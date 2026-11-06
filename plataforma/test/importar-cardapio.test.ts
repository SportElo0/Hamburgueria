import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { useFileStorage } from '@/lib/storage';
import { createStore, getDraft, importItemsByOwner } from '@/lib/stores';
import { lerCardapio } from '@/lib/importar-cardapio';

describe('ler o cardápio que o Claude transcreveu', () => {
  it('lê categorias, itens, preços e descrições em vários jeitos', () => {
    const r = lerCardapio(`\`\`\`
## Lanches
X-Salada | 34,90 | Pão, hambúrguer, alface e tomate
X-Bacon | R$ 39,90
- Misto quente - R$ 18
## Bebidas:
Refrigerante lata ........ 6,90
Suco natural | ? |
\`\`\``);
    expect(r.categorias.map((c) => [c.name, c.items.map((i) => [i.name, i.price])])).toEqual([
      ['Lanches', [['X-Salada', 3490], ['X-Bacon', 3990], ['Misto quente', 1800]]],
      ['Bebidas', [['Refrigerante lata', 690]]],
    ]);
    expect(r.categorias[0].items[0].description).toBe('Pão, hambúrguer, alface e tomate');
    expect(r.total).toBe(4);
    expect(r.avisos).toHaveLength(1);
    expect(r.avisos[0]).toMatch(/Suco natural.*sem preço/);
  });

  it('item sem categoria vai para "Cardápio"', () => {
    expect(lerCardapio('Pastel | 9,00').categorias).toEqual([{ name: 'Cardápio', items: [{ name: 'Pastel', price: 900, description: '' }] }]);
  });
});

describe('importar no cardápio da loja', () => {
  beforeEach(() => {
    useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'importar-')));
  });

  it('cria categorias, não duplica o que já existe', async () => {
    await createStore({ slug: 'love', name: 'Love', segment: 'restaurante' }, 'equipe');
    const lido = lerCardapio('## Lanches\nX-Salada | 34,90\nX-Bacon | 39,90\n## Bebidas\nRefri | 6,90');
    expect(await importItemsByOwner('love', lido.categorias, 'Dono')).toEqual({ adicionados: 3, repetidos: 0 });
    expect(await importItemsByOwner('love', lerCardapio('## lanches\nx-salada | 30,00\nX-Egg | 32,90').categorias, 'Dono')).toEqual({ adicionados: 1, repetidos: 1 });
    const cats = (await getDraft('love'))!.data.store.catalog.categories;
    expect(cats.map((c) => [c.name, c.items.map((i) => [i.name, i.price])])).toEqual([
      ['Lanches', [['X-Salada', 3490], ['X-Bacon', 3990], ['X-Egg', 3290]]],
      ['Bebidas', [['Refri', 690]]],
    ]);
  });
});

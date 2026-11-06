import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { useFileStorage } from '@/lib/storage';
import { createStore } from '@/lib/stores';
import { analisarPeriodo, precoRedondo, type ItemInfo } from '@/lib/relatorio/analise';
import { documentoDoRestaurante, validarPeriodo } from '@/lib/relatorio/exportar';
import { fillTestData } from '@/lib/inteligencia/dados';
import { INSTRUCOES_CLAUDE } from '@/lib/relatorio/instrucoes';
import type { DaySummary } from '@/lib/inteligencia/resumo';
import type { Order } from '@/lib/ordering';

const itens: ItemInfo[] = [
  { id: 'burger', name: 'Burger', category: 'Lanches', price: 3000, cost: 2300, drink: false },
  { id: 'fritas', name: 'Fritas', category: 'Porções', price: 1500, cost: 400, drink: false },
  { id: 'refri', name: 'Refri', category: 'Bebidas', price: 700, cost: 300, drink: true },
  { id: 'salada', name: 'Salada', category: 'Lanches', price: 2500, cost: 2000, drink: false },
];
const pedido = (ids: string[]): Order => ({ lines: ids.map((productId) => ({ productId, name: productId, quantity: 1, unit: 0, total: 0, options: [], notes: '' })) }) as unknown as Order;
function dia(day: string, revenue: number, products: Record<string, number>): DaySummary {
  const byHour = Array(24).fill(0);
  byHour[20] = 10;
  return {
    day, orders: 10, revenue, itemsRevenue: revenue, deliveryFees: 0, discounts: 0, refused: 0, abandoned: 0, refunded: 0, customers: {}, byHour,
    products: Object.fromEntries(Object.entries(products).map(([id, q]) => [id, { name: id, quantity: q, revenue: { pix: q * 1000, cartao: 0, dinheiro: 0 } }])),
  };
}

describe('análise do período', () => {
  it('acha pedido sem bebida, item muito pedido com margem baixa e o que sai junto', () => {
    const dias = Array.from({ length: 28 }, (_, i) => dia(`2026-10-${String(i + 1).padStart(2, '0')}`, 30000, { burger: 8, fritas: 6, refri: 2 }));
    const pedidos = [...Array(70).fill(['burger', 'fritas']), ...Array(20).fill(['burger', 'refri']), ...Array(10).fill(['fritas'])].map(pedido);
    const r = analisarPeriodo({ de: '2026-10-01', ate: '2026-10-28', pedidos, dias, diasAnterior: [], dias90: dias, itens });
    expect(r.numeros.semBebida).toEqual({ pedidos: 80, comComida: 100 });
    expect(r.numeros.pares[0]).toEqual({ a: 'burger', b: 'fritas', pedidos: 70 });
    const ids = r.sugestoes.map((s) => s.id);
    expect(ids).toContain('combo-bebida');
    expect(ids).toContain('preco:burger');
    const preco = r.sugestoes.find((s) => s.id === 'preco:burger')!;
    expect(preco.texto).toMatch(/R\$\s35,90/); // 2300 / 0,65 = 35,38 → 35,90
    expect(r.resumo).toMatch(/^De 01\/10\/2026 a 28\/10\/2026 foram 280 pedidos/);
    // Salada nunca saiu e tem margem baixa: aparece para trocar ou tirar.
    expect(ids).toContain('parado:salada');
  });

  it('preço redondo termina em ,90 e nunca baixa', () => {
    expect(precoRedondo(3538)).toBe(3590);
    expect(precoRedondo(3590)).toBe(3590);
    expect(precoRedondo(3591)).toBe(3690);
  });
});

describe('documento para o Claude', () => {
  beforeEach(() => {
    useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'relatorio-')));
  });

  it('confere o período', () => {
    const agora = new Date('2026-11-05T15:00:00Z');
    expect(validarPeriodo('2026-10-01', '2026-10-31', agora)).toBe(31);
    expect(() => validarPeriodo('2026-10-31', '2026-10-01', agora)).toThrow(/depois/);
    expect(() => validarPeriodo('2026-11-01', '2026-11-30', agora)).toThrow(/hoje/);
    expect(() => validarPeriodo('2026-01-01', '2026-10-31', agora)).toThrow(/92/);
    expect(() => validarPeriodo('ontem', '2026-10-31', agora)).toThrow(/inválidas/);
  });

  it('monta o documento com os números da loja, sem dado de cliente', async () => {
    await createStore({ slug: 'love', name: 'Love', segment: 'restaurante' }, 'equipe');
    const agora = new Date();
    await fillTestData('love', 'Equipe', agora);
    const ate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
    const de = new Date(Date.parse(`${ate}T12:00:00Z`) - 29 * 86_400_000).toISOString().slice(0, 10);
    const { texto } = await documentoDoRestaurante('love', de, ate, agora);
    for (const parte of ['# Dados do restaurante: Love', '## Números do período', '## Itens vendidos', '## O que sai junto no mesmo pedido', '## Horários', '## Dias da semana', '## Pistas calculadas pelo painel']) {
      expect(texto).toContain(parte);
    }
    expect(texto).toMatch(/\| Clássico \| Burgers \| \d+ \|/);
    expect(texto).not.toMatch(/Cliente fictício|DEMO\d{4}/); // nenhum nome nem telefone de cliente
  });

  it('as instruções proíbem inventar número', () => {
    expect(INSTRUCOES_CLAUDE).toContain('Use só os números que estão no documento');
  });
});

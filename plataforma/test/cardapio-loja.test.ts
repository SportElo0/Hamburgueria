import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { seedStores } from '@/lib/seeds';
import { storeSchema, type Store, type StoreRecord } from '@/lib/schema';
import { ItemEditError, editItemByStore, getChanges, getDraft, getPublished } from '@/lib/stores';
import { parsePrice } from '@/components/cardapio/CardapioEditor';

const SLUG = 'el-patron-burger';
const store = (): Store => storeSchema.parse(seedStores().find((s) => s.slug === SLUG)!);
const firstPriced = (s: Store) => s.catalog.categories.flatMap((c) => c.items).find((i) => i.price !== null)!;
const find = (s: Store, id: string) => s.catalog.categories.flatMap((c) => c.items).find((i) => i.id === id)!;

async function save(key: 'rascunho' | 'publicado', s: Store) {
  const record: StoreRecord = { store: s, updatedAt: new Date().toISOString(), updatedBy: 'teste', publishedAt: new Date().toISOString() };
  await storage().writeJSON(`lojas/${SLUG}/${key}.json`, record);
}

beforeEach(async () => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'cardapio-')));
  await save('rascunho', store());
  await save('publicado', store());
});

describe('cardápio editado pela loja', () => {
  it('muda o preço no ar e no rascunho, e registra sem contar como alteração', async () => {
    const item = firstPriced(store());
    await editItemByStore(SLUG, item.id, { name: item.name, description: item.description, price: 4290 }, 'caixa');
    expect(find((await getPublished(SLUG))!.store, item.id).price).toBe(4290);
    expect(find((await getDraft(SLUG))!.data.store, item.id).price).toBe(4290);
    const log = await getChanges(SLUG);
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ counted: false, reason: 'Feita pela loja', by: 'caixa' });
    expect(log[0].description).toContain('42.90');
  });

  it('não desfaz o que a equipe deixou no rascunho sem publicar', async () => {
    const draft = store();
    draft.name = 'Nome novo ainda não publicado';
    await save('rascunho', draft);
    const item = firstPriced(store());
    await editItemByStore(SLUG, item.id, { name: 'Novo nome', description: item.description, price: item.price! }, 'caixa');
    const d = (await getDraft(SLUG))!.data.store;
    expect(d.name).toBe('Nome novo ainda não publicado');
    expect(find(d, item.id).name).toBe('Novo nome');
    expect((await getPublished(SLUG))!.store.name).toBe(store().name);
  });

  it('só mexe em nome, descrição e preço', async () => {
    const item = firstPriced(store());
    await editItemByStore(SLUG, item.id, { name: item.name, description: 'Outra descrição', price: item.price! }, 'caixa');
    const after = find((await getPublished(SLUG))!.store, item.id);
    expect({ ...after, description: item.description }).toEqual(item);
  });

  it('recusa preço inválido, nome vazio e item que não existe', async () => {
    const item = firstPriced(store());
    await expect(editItemByStore(SLUG, item.id, { name: item.name, description: '', price: 0 }, 'x')).rejects.toBeInstanceOf(ItemEditError);
    await expect(editItemByStore(SLUG, item.id, { name: item.name, description: '', price: 12.5 }, 'x')).rejects.toBeInstanceOf(ItemEditError);
    await expect(editItemByStore(SLUG, item.id, { name: '  ', description: '', price: 100 }, 'x')).rejects.toBeInstanceOf(ItemEditError);
    await expect(editItemByStore(SLUG, 'nao-existe', { name: 'a', description: '', price: 100 }, 'x')).rejects.toBeInstanceOf(ItemEditError);
    expect(await getChanges(SLUG)).toHaveLength(0);
  });

  it('entende o preço digitado', () => {
    expect(parsePrice('32,90')).toBe(3290);
    expect(parsePrice('R$ 32.9')).toBe(3290);
    expect(parsePrice('32')).toBe(3200);
    expect(parsePrice('3,2,1')).toBeNull();
    expect(parsePrice('abc')).toBeNull();
  });
});

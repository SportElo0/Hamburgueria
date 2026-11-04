import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { seedStores } from '@/lib/seeds';
import { storeSchema, type Store, type StoreRecord } from '@/lib/schema';
import { CustoError, itensDoDono, salvarCustoManual } from '@/lib/dono';
import { addItemByOwner, createStore, editItemByOwner, getChanges, getDraft, getPublished, setTablesCount } from '@/lib/stores';
import { floor, freeTable, seatTable } from '@/lib/mesas';
import { orderingOf } from '@/lib/ordering';
import { createDemo } from '@/lib/inteligencia/dados';
import { DEMO_SLUG } from '@/lib/inteligencia/demo';
import { getCostSheet, saveCostSheet } from '@/lib/inteligencia/dados';
import { EMPTY_COST_SHEET } from '@/lib/inteligencia/custos';
import { horasComMovimento, margem, montarResumo, parseReais, variacao } from '@/lib/dono-resumo';
import type { DaySummary } from '@/lib/inteligencia/resumo';

const SLUG = 'el-patron-burger';
const store = (): Store => storeSchema.parse(seedStores().find((s) => s.slug === SLUG)!);
const priced = () => store().catalog.categories.flatMap((c) => c.items).filter((i) => i.price !== null);

function day(n: number, orders: number, revenue: number, products: Record<string, number> = {}, hour = 20): DaySummary {
  const byHour = Array(24).fill(0);
  byHour[hour] = orders;
  return {
    day: `2026-10-${String(n).padStart(2, '0')}`,
    orders,
    revenue,
    itemsRevenue: revenue,
    deliveryFees: 0,
    discounts: 0,
    refused: 0,
    abandoned: 0,
    refunded: 0,
    customers: {},
    byHour,
    products: Object.fromEntries(Object.entries(products).map(([id, q]) => [id, { name: id.toUpperCase(), quantity: q, revenue: { pix: 0, cartao: 0, dinheiro: 0 } }])),
  };
}

describe('resumo do dono', () => {
  it('compara hoje com o mesmo dia da semana passada e a semana com a anterior', () => {
    const days = Array.from({ length: 14 }, (_, i) => day(i + 1, i < 7 ? 10 : 12, i < 7 ? 10_000 : 15_000, { a: 2, b: 1 }));
    days[6] = day(7, 8, 8_000, { a: 1 }); // mesmo dia da semana passada
    days[13] = day(14, 20, 30_000, { a: 5, c: 3 }); // hoje
    const r = montarResumo(days, [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
      { id: 'd', name: 'D nunca pedido' },
    ]);
    expect(r.hoje.vendas).toEqual({ value: 30_000, before: 8_000 });
    expect(r.hoje.pedidos).toEqual({ value: 20, before: 8 });
    expect(r.semana.pedidos.value).toBe(12 * 6 + 20);
    expect(r.semana.pedidos.before).toBe(10 * 6 + 8);
    expect(r.semana.ticket.value).toBe(Math.round((15_000 * 6 + 30_000) / 92));
    expect(r.maisVendidos.map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(r.maisVendidos[0].quantity).toBe(2 * 6 + 5);
    // O que menos sai inclui item do cardápio que não saiu nenhuma vez.
    expect(r.menosVendido).toEqual({ id: 'd', name: 'D nunca pedido', quantity: 0 });
    expect(variacao(r.hoje.vendas)).toBeCloseTo(2.75);
  });

  it('sem histórico não inventa comparação', () => {
    const r = montarResumo([day(1, 3, 3_000, { a: 3 })], [{ id: 'a', name: 'A' }]);
    expect(r.hoje.vendas.before).toBeNull();
    expect(r.semana.vendas.before).toBeNull();
    expect(r.semana.ticket.before).toBeNull();
    expect(variacao(r.semana.vendas)).toBeNull();
    expect(r.menosVendido).toBeNull(); // único item já está no topo
  });

  it('horas de pico só da primeira à última hora com movimento', () => {
    const h = Array(24).fill(0);
    h[11] = 2;
    h[13] = 5;
    h[22] = 1;
    expect(horasComMovimento(h)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]);
    expect(horasComMovimento(Array(24).fill(0))).toEqual([]);
  });

  it('margem e valores digitados', () => {
    expect(margem(5000, 2000)).toEqual({ lucro: 3000, taxa: 0.6 });
    expect(margem(5000, null)).toBeNull();
    expect(parseReais('12,50')).toBe(1250);
    expect(parseReais('R$ 1.234,5')).toBe(123450);
    expect(parseReais('12.5')).toBe(1250);
    expect(parseReais('')).toBeNull();
    expect(parseReais('doze')).toBeNaN();
    expect(parseReais('-3')).toBeNaN();
  });
});

describe('custos do dono', () => {
  beforeEach(async () => {
    useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'dono-')));
    const record: StoreRecord = { store: store(), updatedAt: new Date().toISOString(), updatedBy: 'teste', publishedAt: new Date().toISOString() };
    await storage().writeJSON(`lojas/${SLUG}/rascunho.json`, record);
    await storage().writeJSON(`lojas/${SLUG}/publicado.json`, record);
  });

  it('o dono escreve quanto custa, a margem aparece e dá para apagar', async () => {
    const item = priced()[0];
    await salvarCustoManual(SLUG, item.id, 1200, 'Dono');
    let found = (await itensDoDono(SLUG)).categories.flatMap((c) => c.items).find((i) => i.id === item.id)!;
    expect(found).toMatchObject({ cost: 1200, costMode: 'manual', manualCost: 1200, packaging: 0 });
    await salvarCustoManual(SLUG, item.id, null, 'Dono');
    found = (await itensDoDono(SLUG)).categories.flatMap((c) => c.items).find((i) => i.id === item.id)!;
    expect(found).toMatchObject({ cost: null, costMode: null });
  });

  it('soma a embalagem e não mexe em item com ficha técnica da equipe', async () => {
    const [a, b] = priced();
    const { etag } = await getCostSheet(SLUG);
    await saveCostSheet(
      SLUG,
      {
        ...EMPTY_COST_SHEET,
        packagingDefault: 150,
        ingredients: [{ id: 'carne', name: 'Carne', unit: 'kg', costPerUnit: 4000 }],
        products: { [b.id]: { mode: 'ficha', unitCost: null, recipe: [{ ingredientId: 'carne', quantity: 0.2 }], packaging: null } },
      },
      etag,
      'equipe',
    );
    await salvarCustoManual(SLUG, a.id, 1000, 'Dono');
    const items = (await itensDoDono(SLUG)).categories.flatMap((c) => c.items);
    expect(items.find((i) => i.id === a.id)).toMatchObject({ cost: 1150, manualCost: 1000, packaging: 150 });
    expect(items.find((i) => i.id === b.id)).toMatchObject({ cost: 950, costMode: 'ficha' });
    await expect(salvarCustoManual(SLUG, b.id, 500, 'Dono')).rejects.toBeInstanceOf(CustoError);
    await expect(salvarCustoManual(SLUG, a.id, -1, 'Dono')).rejects.toBeInstanceOf(CustoError);
    // A ficha da equipe continua lá.
    expect((await getCostSheet(SLUG)).sheet.ingredients).toHaveLength(1);
  });
});

describe('o dono monta mesas e cardápio sozinho', () => {
  beforeEach(() => {
    useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'dono-sozinho-')));
  });

  it('loja nova, sem cardápio no ar: adiciona item com custo e muda o preço só no rascunho', async () => {
    await createStore({ slug: 'cantina-nova', name: 'Cantina Nova', segment: 'restaurante' }, 'equipe');
    const id = await addItemByOwner('cantina-nova', { name: 'X-Salada', price: 3490, category: 'Lanches' }, 'Dono');
    await addItemByOwner('cantina-nova', { name: 'Suco', price: 990, category: 'bebidas' }, 'Dono');
    await addItemByOwner('cantina-nova', { name: 'X-Bacon', price: 3990, category: 'lanches' }, 'Dono');
    await salvarCustoManual('cantina-nova', id, 1300, 'Dono');
    const { categories, published } = await itensDoDono('cantina-nova');
    expect(published).toBe(false);
    expect(categories.map((c) => [c.name, c.items.map((i) => i.name)])).toEqual([
      ['Lanches', ['X-Salada', 'X-Bacon']],
      ['bebidas', ['Suco']],
    ]);
    expect(categories[0].items[0]).toMatchObject({ price: 3490, cost: 1300 });
    await editItemByOwner('cantina-nova', id, { name: 'X-Salada Especial', description: '', price: 3690 }, 'Dono');
    expect((await getDraft('cantina-nova'))!.data.store.catalog.categories[0].items[0]).toMatchObject({ name: 'X-Salada Especial', price: 3690 });
    expect(await getPublished('cantina-nova')).toBeNull();
    await expect(addItemByOwner('cantina-nova', { name: '', price: 100, category: 'Lanches' }, 'Dono')).rejects.toThrow(/nome/);
    await expect(addItemByOwner('cantina-nova', { name: 'X', price: 0, category: 'Lanches' }, 'Dono')).rejects.toThrow(/Preço/);
  });

  it('com cardápio no ar, o item novo vai para o rascunho e para o que o cliente vê', async () => {
    const record: StoreRecord = { store: store(), updatedAt: new Date().toISOString(), updatedBy: 'teste', publishedAt: new Date().toISOString() };
    await storage().writeJSON(`lojas/${SLUG}/rascunho.json`, record);
    await storage().writeJSON(`lojas/${SLUG}/publicado.json`, record);
    const id = await addItemByOwner(SLUG, { name: 'Batata Rústica', price: 2190, category: 'Porções novas' }, 'Dono');
    for (const s of [(await getPublished(SLUG))!.store, (await getDraft(SLUG))!.data.store]) {
      expect(s.catalog.categories.at(-1)).toMatchObject({ name: 'Porções novas', items: [expect.objectContaining({ id, price: 2190 })] });
    }
  });

  it('define quantas mesas e ocupa uma mesa à mão, mesmo sem o QR ligado', async () => {
    await createStore({ slug: 'cantina-nova', name: 'Cantina Nova', segment: 'restaurante' }, 'equipe');
    await setTablesCount('cantina-nova', 8, 'Dono');
    expect(orderingOf((await getDraft('cantina-nova'))!.data.store).tables.count).toBe(8);
    await seatTable('cantina-nova', 3, { people: 4 });
    expect((await floor('cantina-nova')).map((t) => [t.number, t.people, t.confirmed])).toEqual([[3, 4, true]]);
    await expect(seatTable('cantina-nova', 9, { people: null })).rejects.toThrow(/não encontrada/);
    await freeTable('cantina-nova', 3, 'Dono');
    expect(await floor('cantina-nova')).toEqual([]);
    await expect(setTablesCount('cantina-nova', 0, 'Dono')).rejects.toThrow(/1 a 200/);
    await expect(setTablesCount('cantina-nova', 4, 'Dono', 6)).rejects.toThrow(/mesa 6 está aberta/);
    expect((await getChanges('cantina-nova')).map((c) => c.description)).toContain('Feita pelo dono: número de mesas: 8');
  });

  it('a demonstração vem com mesas abertas, pedidos pelo QR e chamados', async () => {
    await createDemo('equipe');
    const mesas = await floor(DEMO_SLUG);
    expect(mesas.map((m) => m.number)).toEqual([2, 3, 5, 7, 9, 12]);
    expect(mesas.find((m) => m.number === 7)!.total).toBeGreaterThan(0);
    expect(mesas.flatMap((m) => m.calls.map((c) => c.kind)).sort()).toEqual(['conta', 'garcom']);
    expect(mesas.find((m) => m.number === 12)!.confirmed).toBe(false);
    expect(await getPublished(DEMO_SLUG)).toBeNull();
    const { categories } = await itensDoDono(DEMO_SLUG);
    expect(categories.flatMap((c) => c.items).length).toBeGreaterThan(5);
  });
});

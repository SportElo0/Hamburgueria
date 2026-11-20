import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { seedStores } from '@/lib/seeds';
import { storeSchema, type Store, type StoreRecord } from '@/lib/schema';
import { DEFAULT_ORDERING, type Order } from '@/lib/ordering';
import { applyAction, setOpen } from '@/lib/orders';
import { callFromTable, closeTable, confirmTable, floor, offerDessert, openTable, orderAtTable, seatingHistory, tableState } from '@/lib/mesas';
import {
  DEFAULT_SOBREMESA,
  dessertCategoryIds,
  dessertContext,
  dessertDue,
  dessertStats,
  featuredDesserts,
  inDessertTest,
  type DessertRecord,
  type Sobremesa,
} from '@/lib/sobremesa';

const SLUG = 'el-patron-burger';
const burger = { items: [{ productId: 'chicken', quantity: 1 }] };
const sorvete = { items: [{ productId: 'sorvete-palito', quantity: 2 }] };

function elPatron(sobremesa: Partial<Sobremesa> = {}): Store {
  const seed = seedStores().find((s) => s.slug === SLUG)!;
  return storeSchema.parse({
    ...seed,
    ordering: { ...DEFAULT_ORDERING, enabled: true, tables: { enabled: true, count: 12 }, sobremesa: { ...DEFAULT_SOBREMESA, ...sobremesa } },
  });
}

async function publishStore(store: Store) {
  const record: StoreRecord = { store, updatedAt: new Date().toISOString(), updatedBy: 'teste', publishedAt: new Date().toISOString() };
  await storage().writeJSON(`lojas/${store.slug}/rascunho.json`, record);
  await storage().writeJSON(`lojas/${store.slug}/publicado.json`, record);
}

const cfg = (over: Partial<Sobremesa> = {}): Sobremesa => ({ ...DEFAULT_SOBREMESA, mode: 'todas', ...over });

function order(over: Partial<Order> & { lines: Order['lines'] }): Order {
  return {
    id: Math.random().toString(36).slice(2),
    number: 1,
    tokenHash: '',
    createdAt: '2026-11-07T20:00:00.000Z',
    updatedAt: '2026-11-07T20:00:00.000Z',
    status: 'pronto',
    history: [{ status: 'pronto', at: '2026-11-07T20:20:00.000Z', by: 'cozinha' }],
    customer: { name: 'Mesa 1', phone: '', email: '' },
    mode: 'mesa',
    address: null,
    payment: { method: 'cartao', status: 'na-mesa', changeFor: null, pix: null, paidAt: null },
    subtotal: 0,
    deliveryFee: 0,
    feePending: false,
    discount: 0,
    coupon: '',
    total: 0,
    note: '',
    reason: '',
    ...over,
  };
}
const line = (productId: string, quantity = 1, total = 1000) => ({ productId, name: productId, quantity, unit: total / quantity, total, options: [], notes: '' });

describe('regras da hora da sobremesa', () => {
  const store = elPatron();
  const ctx = dessertContext(store, cfg(), new Set(['bebidas']));
  const at = (min: number) => new Date(Date.parse('2026-11-07T20:20:00.000Z') + min * 60_000);

  it('acha a categoria de sobremesa pelo nome, ou usa a que a equipe marcou', () => {
    expect([...dessertCategoryIds(store, cfg())]).toEqual(['sobremesas']);
    expect([...dessertCategoryIds(store, cfg({ categories: ['porcoes'] }))]).toEqual(['porcoes']);
    // A category that no longer exists falls back to the name.
    expect([...dessertCategoryIds(store, cfg({ categories: ['sumiu'] }))]).toEqual(['sobremesas']);
  });

  it('no teste de metade, só as mesas ímpares recebem o aviso', () => {
    expect(inDessertTest(cfg({ mode: 'metade' }), 3)).toBe(true);
    expect(inDessertTest(cfg({ mode: 'metade' }), 4)).toBe(false);
    expect(inDessertTest(cfg({ mode: 'desligado' }), 3)).toBe(false);
    expect(inDessertTest(cfg(), 4)).toBe(true);
  });

  it('aparece só depois do tempo do prato principal pronto', () => {
    const orders = [order({ lines: [line('chicken')] })];
    const base = { cfg: cfg(), table: 1, orders, ctx, askedBill: false };
    expect(dessertDue({ ...base, now: at(14) })).toBeNull();
    expect(dessertDue({ ...base, now: at(15) })).toBe('tempo');
  });

  it('não aparece com prato ainda na cozinha, sem prato principal ou com sobremesa já pedida', () => {
    const served = order({ lines: [line('chicken')] });
    const cooking = order({ lines: [line('batata-simples')], status: 'preparo', history: [] });
    const drinkOnly = order({ lines: [line('refri-lata')] });
    const dessert = order({ lines: [line('sorvete-massa')] });
    const due = (orders: Order[]) => dessertDue({ cfg: cfg(), table: 1, orders, ctx, askedBill: false, now: at(60) });
    expect(due([served, cooking])).toBeNull();
    expect(due([drinkOnly])).toBeNull();
    expect(due([served, dessert])).toBeNull();
    // A refused dessert does not count as ordered.
    expect(due([served, { ...dessert, status: 'recusado' }])).toBe('tempo');
  });

  it('ao pedir a conta aparece na hora', () => {
    const cooking = order({ lines: [line('chicken')], status: 'preparo', history: [] });
    expect(dessertDue({ cfg: cfg(), table: 1, orders: [cooking], ctx, askedBill: true, now: at(0) })).toBe('conta');
  });

  it('mostra até 3 sobremesas disponíveis, as escolhidas primeiro', () => {
    expect(featuredDesserts(store, cfg())).toEqual(['sorvete-palito', 'sorvete-massa']);
    expect(featuredDesserts(store, cfg({ featured: ['sorvete-massa', 'chicken'] }))).toEqual(['sorvete-massa', 'chicken', 'sorvete-palito']);
    const soldOut = storeSchema.parse({
      ...store,
      catalog: { categories: store.catalog.categories.map((c) => ({ ...c, items: c.items.map((i) => (i.id === 'sorvete-palito' ? { ...i, available: false } : i)) })) },
    });
    expect(featuredDesserts(soldOut, cfg())).toEqual(['sorvete-massa']);
  });

  it('a medição compara as mesas com e sem o aviso', () => {
    const r = (over: Partial<DessertRecord>): DessertRecord => ({ number: 1, minutes: 50, orders: 1, desserts: 0, dessertRevenue: 0, dessertTest: false, ...over });
    const stats = dessertStats([
      r({ dessertTest: true, desserts: 2, dessertRevenue: 2400, dessertOffered: true }),
      r({ dessertTest: true }),
      r({ dessertTest: false, desserts: 1, dessertRevenue: 1200 }),
      r({ dessertTest: false }),
      r({ dessertTest: false }),
      r({ dessertTest: false }),
      // Not measured yet (closed before), nothing ordered on the panel, forgotten open: left out.
      { number: 1, minutes: 50, orders: 1 },
      r({ orders: 0 }),
      r({ minutes: 500, desserts: 3 }),
    ]);
    expect(stats.all.tables).toBe(6);
    expect(stats.com).toMatchObject({ tables: 2, withDessert: 1, rate: 0.5, units: 2, revenue: 2400, offered: 1 });
    expect(stats.sem).toMatchObject({ tables: 4, withDessert: 1, rate: 0.25 });
    expect(stats.diff).toBe(25);
    expect(stats.reliable).toBe(false);
  });
});

describe('hora da sobremesa na mesa', () => {
  beforeEach(async () => {
    useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'sobremesa-')));
    await setOpen(SLUG, true, 'teste');
  });

  async function servedTable(number: number) {
    const token = await openTable(SLUG, number, '');
    const o = await orderAtTable(SLUG, number, token, burger);
    await confirmTable(SLUG, number, 'garçom');
    await applyAction(SLUG, o.id, 'aceitar', 'cozinha');
    await applyAction(SLUG, o.id, 'despachar', 'cozinha');
    return token;
  }
  const later = () => new Date(Date.now() + 16 * 60_000);

  it('o celular e o garçom veem o aviso; "Já ofereci" tira só do garçom', async () => {
    await publishStore(elPatron({ mode: 'todas' }));
    const token = await servedTable(5);
    expect(await tableState(SLUG, 5, token, new Date())).toMatchObject({ sobremesa: null });
    const state = await tableState(SLUG, 5, token, later());
    expect(state).toMatchObject({ sobremesa: { reason: 'tempo', items: ['sorvete-palito', 'sorvete-massa'] } });
    expect((await floor(SLUG, later()))[0].sobremesa).toBe('tempo');

    await offerDessert(SLUG, 5, 'garçom');
    expect((await floor(SLUG, later()))[0].sobremesa).toBeNull();
    expect(await tableState(SLUG, 5, token, later())).toMatchObject({ sobremesa: { reason: 'tempo' } });

    // After ordering dessert, nobody is reminded any more.
    await orderAtTable(SLUG, 5, token, sorvete);
    expect(await tableState(SLUG, 5, token, later())).toMatchObject({ sobremesa: null });
  });

  it('desligado não mostra nada, mas a conta fechada guarda as sobremesas', async () => {
    await publishStore(elPatron({ mode: 'desligado' }));
    const token = await servedTable(4);
    await callFromTable(SLUG, 4, token, 'conta');
    expect(await tableState(SLUG, 4, token, later())).toMatchObject({ sobremesa: null });
    const d = await orderAtTable(SLUG, 4, token, sorvete);
    await closeTable(SLUG, 4, 'pix', 'garçom');
    const [rec] = await seatingHistory(SLUG, 1);
    expect(rec).toMatchObject({ desserts: 2, dessertRevenue: d.total, dessertTest: false, dessertOffered: false });
  });

  it('no teste de metade, a mesa par fica sem aviso e conta como comparação', async () => {
    await publishStore(elPatron({ mode: 'metade' }));
    const even = await servedTable(2);
    const odd = await servedTable(3);
    await callFromTable(SLUG, 2, even, 'conta');
    await callFromTable(SLUG, 3, odd, 'conta');
    expect(await tableState(SLUG, 2, even)).toMatchObject({ sobremesa: null });
    expect(await tableState(SLUG, 3, odd)).toMatchObject({ sobremesa: { reason: 'conta' } });
    await offerDessert(SLUG, 3, 'garçom');
    await closeTable(SLUG, 2, 'pix', 'garçom');
    await closeTable(SLUG, 3, 'pix', 'garçom');
    const history = await seatingHistory(SLUG, 1);
    expect(history.map((r) => [r.number, r.dessertTest, r.dessertOffered])).toEqual([
      [2, false, false],
      [3, true, true],
    ]);
  });
});

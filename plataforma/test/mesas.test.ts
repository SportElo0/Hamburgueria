import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { seedStores } from '@/lib/seeds';
import { storeSchema, type Store, type StoreRecord } from '@/lib/schema';
import { DEFAULT_ORDERING, salesReport } from '@/lib/ordering';
import { applyAction, ordersForDays, setOpen } from '@/lib/orders';
import { customersFrom } from '@/lib/customers';
import {
  TableError,
  answerCall,
  callFromTable,
  closeTable,
  confirmTable,
  dismissTable,
  floor,
  joinTable,
  openTable,
  orderAtTable,
  tableKey,
  tableState,
  validKey,
} from '@/lib/mesas';

const SLUG = 'el-patron-burger';
const item = { items: [{ productId: 'batata-completa', quantity: 1, selections: { tamanho: ['grande'] } }] };

function elPatron(tables = { enabled: true, count: 12 }): Store {
  const seed = seedStores().find((s) => s.slug === SLUG)!;
  return storeSchema.parse({ ...seed, ordering: { ...DEFAULT_ORDERING, enabled: true, tables } });
}

async function publishStore(store: Store) {
  const record: StoreRecord = { store, updatedAt: new Date().toISOString(), updatedBy: 'teste', publishedAt: new Date().toISOString() };
  await storage().writeJSON(`lojas/${store.slug}/rascunho.json`, record);
  await storage().writeJSON(`lojas/${store.slug}/publicado.json`, record);
}

beforeEach(async () => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'mesas-')));
  await publishStore(elPatron());
  await setOpen(SLUG, true, 'teste');
});

describe('QR da mesa', () => {
  it('só abre com a chave daquela mesa', () => {
    const k = tableKey(SLUG, 5);
    expect(validKey(SLUG, 5, k)).toBe(true);
    expect(validKey(SLUG, 6, k)).toBe(false);
    expect(validKey('outra-loja', 5, k)).toBe(false);
    expect(validKey(SLUG, 5, '')).toBe(false);
  });

  it('recusa mesa fora da conta da loja ou com o pedido na mesa desligado', async () => {
    await expect(openTable(SLUG, 13, '')).rejects.toThrow(TableError);
    await publishStore(elPatron({ enabled: false, count: 12 }));
    await expect(openTable(SLUG, 5, '')).rejects.toThrow('não está recebendo pedidos pela mesa');
  });
});

describe('sessão da mesa', () => {
  it('o primeiro abre, os outros entram só com o código', async () => {
    const first = await openTable(SLUG, 5, '');
    await expect(openTable(SLUG, 5, '')).rejects.toThrow('já foi aberta');
    const state = await tableState(SLUG, 5, first);
    expect(state.member).toBe(true);
    if (!state.member) return;
    expect(state.code).toMatch(/^\d{4}$/);

    const outsider = await tableState(SLUG, 5, 'token-qualquer');
    expect(outsider).toEqual({ open: true, member: false });

    const wrong = state.code === '0000' ? '1111' : '0000';
    await expect(joinTable(SLUG, 5, wrong, '1.1.1.1')).rejects.toThrow('Código errado');
    const second = await joinTable(SLUG, 5, state.code, '1.1.1.1');
    expect((await tableState(SLUG, 5, second)).member).toBe(true);
  });

  it('bloqueia quem tenta adivinhar o código', async () => {
    const first = await openTable(SLUG, 5, '');
    const s = await tableState(SLUG, 5, first);
    if (!s.member) throw new Error('esperava estar na mesa');
    const wrong = s.code === '0000' ? '1111' : '0000';
    for (let i = 0; i < 8; i++) await expect(joinTable(SLUG, 5, wrong, '9.9.9.9')).rejects.toThrow('Código errado');
    await expect(joinTable(SLUG, 5, s.code, '9.9.9.9')).rejects.toThrow('Muitas tentativas');
  });

  it('limita os erros de código por mesa, mesmo vindo de muitos endereços', async () => {
    const first = await openTable(SLUG, 4, '');
    const s = await tableState(SLUG, 4, first);
    if (!s.member) throw new Error('esperava estar na mesa');
    const wrong = s.code === '0000' ? '1111' : '0000';
    for (let i = 0; i < 50; i++) await expect(joinTable(SLUG, 4, wrong, `10.0.0.${i}`)).rejects.toThrow('Código errado');
    await expect(joinTable(SLUG, 4, s.code, '10.0.1.1')).rejects.toThrow('Muitas tentativas');
  });

  it('mesa aberta e esquecida sem o garçom confirmar se libera depois de 1 hora', async () => {
    const t0 = new Date('2026-10-30T20:00:00Z');
    await openTable(SLUG, 7, '', t0);
    await expect(openTable(SLUG, 7, '', new Date(t0.getTime() + 30 * 60_000))).rejects.toThrow('já foi aberta');
    expect(await openTable(SLUG, 7, '', new Date(t0.getTime() + 61 * 60_000))).toBeTruthy();
  });

  it('o primeiro pedido espera o garçom; depois de confirmar, vai direto para a cozinha', async () => {
    const token = await openTable(SLUG, 5, '');
    const first = await orderAtTable(SLUG, 5, token, item);
    expect(first.status).toBe('aguardando-garcom');
    expect(first.mode).toBe('mesa');
    expect(first.table?.number).toBe(5);
    expect(first.customer.phone).toBe('');
    await expect(orderAtTable(SLUG, 5, 'intruso', item)).rejects.toThrow('não está na mesa');

    await confirmTable(SLUG, 5, 'garçom');
    const [table] = await floor(SLUG);
    expect(table.confirmed).toBe(true);
    expect(table.orders[0].status).toBe('novo');
    const second = await orderAtTable(SLUG, 5, token, item);
    expect(second.status).toBe('novo');
    expect((await floor(SLUG))[0].total).toBe(first.total + second.total);
  });

  it('chamar o garçom não repete a chamada e some quando é atendida', async () => {
    const token = await openTable(SLUG, 3, '');
    await callFromTable(SLUG, 3, token, 'garcom');
    await callFromTable(SLUG, 3, token, 'garcom');
    await callFromTable(SLUG, 3, token, 'conta');
    expect((await floor(SLUG))[0].calls.map((c) => c.kind)).toEqual(['garcom', 'conta']);
    await answerCall(SLUG, 3, 'garcom');
    expect((await floor(SLUG))[0].calls.map((c) => c.kind)).toEqual(['conta']);
    await expect(callFromTable(SLUG, 3, 'intruso', 'garcom')).rejects.toThrow('não está na mesa');
  });

  it('fechar a conta marca como pago, entrega o que estava pronto e encerra o código', async () => {
    const token = await openTable(SLUG, 5, '');
    const order = await orderAtTable(SLUG, 5, token, item);
    await expect(closeTable(SLUG, 5, 'pix', 'garçom')).rejects.toThrow('Confirme a mesa');
    await confirmTable(SLUG, 5, 'garçom');
    await applyAction(SLUG, order.id, 'aceitar', 'cozinha');
    const ready = await applyAction(SLUG, order.id, 'despachar', 'cozinha');
    expect(ready.status).toBe('pronto');
    await closeTable(SLUG, 5, 'pix', 'garçom');

    expect(await floor(SLUG)).toEqual([]);
    expect(await tableState(SLUG, 5, token)).toEqual({ open: false, member: false });
    await expect(orderAtTable(SLUG, 5, token, item)).rejects.toThrow('não está na mesa');

    const days = await ordersForDays(SLUG, 2);
    const done = days.flatMap((d) => d.orders).find((o) => o.id === order.id)!;
    expect(done.status).toBe('concluido');
    expect(done.payment).toMatchObject({ method: 'pix', status: 'pago' });
    const report = salesReport(days);
    expect(report.byMode.mesa).toEqual({ orders: 1, revenue: order.total });
    expect(report.customers).toBe(0);
    expect(customersFrom(days, [])).toEqual([]);
  });

  it('mesa sem ninguém: o garçom recusa o que chegou e libera a mesa', async () => {
    const token = await openTable(SLUG, 9, '');
    await orderAtTable(SLUG, 9, token, item);
    await dismissTable(SLUG, 9, 'garçom');
    expect(await floor(SLUG)).toEqual([]);
    const all = (await ordersForDays(SLUG, 2)).flatMap((d) => d.orders);
    expect(all[0]).toMatchObject({ status: 'recusado', reason: 'Mesa sem ninguém' });
    // A mesa pode ser aberta de novo, com outro código.
    expect(await openTable(SLUG, 9, '')).toBeTruthy();
  });

  it('cozinha fechada não recebe pedido da mesa', async () => {
    const token = await openTable(SLUG, 2, '');
    await setOpen(SLUG, false, 'teste');
    await expect(orderAtTable(SLUG, 2, token, item)).rejects.toThrow('cozinha está fechada');
  });
});

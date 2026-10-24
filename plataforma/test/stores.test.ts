import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { useFileStorage } from '@/lib/storage';
import {
  ConflictError,
  addPedido,
  createStore,
  getChanges,
  getDraft,
  getPayment,
  getPublished,
  listPedidos,
  listStores,
  logChange,
  publish,
  resolvePedido,
  saveDraft,
  setPayment,
} from '@/lib/stores';
import { toPublic } from '@/lib/schema';

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'plataforma-')));
});

describe('lojas', () => {
  it('cria, lista e não deixa duplicar', async () => {
    await createStore({ slug: 'gara', name: 'Gara', segment: 'restaurante' }, 'ana');
    expect((await listStores()).map((s) => s.slug)).toEqual(['gara']);
    await expect(createStore({ slug: 'gara', name: 'Outra', segment: 'loja' }, 'ana')).rejects.toBeInstanceOf(ConflictError);
  });

  it('não deixa uma edição antiga sobrescrever outra mais nova', async () => {
    await createStore({ slug: 'gara', name: 'Gara', segment: 'restaurante' }, 'ana');
    const v1 = (await getDraft('gara'))!;
    await saveDraft('gara', { ...v1.data.store, name: 'Gara Pizza' }, v1.etag, 'ana');
    await expect(saveDraft('gara', { ...v1.data.store, name: 'Versão velha' }, v1.etag, 'bia')).rejects.toBeInstanceOf(ConflictError);
    expect((await getDraft('gara'))!.data.store.name).toBe('Gara Pizza');
  });

  it('recusa dados inválidos', async () => {
    await createStore({ slug: 'gara', name: 'Gara', segment: 'restaurante' }, 'ana');
    const v1 = (await getDraft('gara'))!;
    await expect(saveDraft('gara', { ...v1.data.store, name: '' }, v1.etag, 'ana')).rejects.toThrow();
    await expect(saveDraft('gara', { ...v1.data.store, slug: 'outra' }, v1.etag, 'ana')).rejects.toThrow(/identificador/);
  });

  it('publica só quando pedido, e o rascunho não vaza antes', async () => {
    await createStore({ slug: 'gara', name: 'Gara', segment: 'restaurante' }, 'ana');
    expect(await getPublished('gara')).toBeNull();
    const v1 = (await getDraft('gara'))!;
    await saveDraft('gara', { ...v1.data.store, notice: { active: true, text: 'Fechado no feriado' } }, v1.etag, 'ana');
    await publish('gara', { description: '', counted: false, reason: '' }, 'ana');
    const pub = await getPublished('gara');
    expect(toPublic(pub!.store, pub!.publishedAt, '').notice).toBe('Fechado no feriado');
    // Internal publish leaves the client's log untouched.
    expect(await getChanges('gara')).toEqual([]);
  });

  it('conta as mudanças e marca a terceira do parceiro como extra', async () => {
    await createStore({ slug: 'gara', name: 'Gara', segment: 'restaurante' }, 'ana');
    await publish('gara', { description: 'Preço da Calabresa', counted: true, reason: '' }, 'ana');
    await publish('gara', { description: 'Horário de feriado', counted: false, reason: 'Horário de feriado' }, 'ana');
    await publish('gara', { description: 'Pizza nova', counted: true, reason: '' }, 'ana');
    const third = await publish('gara', { description: 'Mais uma', counted: true, reason: '' }, 'ana');
    expect(third.entry?.extra).toBe(true);
    const log = await getChanges('gara');
    expect(log.map((e) => [e.counted, e.extra])).toEqual([
      [true, false],
      [false, false],
      [true, false],
      [true, true],
    ]);
  });

  it('registros simultâneos não se perdem', async () => {
    await createStore({ slug: 'gara', name: 'Gara', segment: 'restaurante' }, 'ana');
    await Promise.all([1, 2, 3].map((i) => logChange('gara', { description: `Pedido ${i}`, counted: true, reason: '' }, 'ana')));
    expect(await getChanges('gara')).toHaveLength(3);
  });
});

describe('caixa de pedidos', () => {
  it('registra, lista e resolve', async () => {
    await createStore({ slug: 'gara', name: 'Gara', segment: 'restaurante' }, 'ana');
    const p = await addPedido('gara', { texto: 'Trocar o preço da Calabresa', canal: 'WhatsApp' }, 'ana');
    expect(p.status).toBe('pendente');
    expect(await listPedidos('gara')).toHaveLength(1);
    await resolvePedido('gara', p.id, 'feito', 'bia');
    const [resolved] = await listPedidos('gara');
    expect(resolved).toMatchObject({ status: 'feito', resolvidoPor: 'bia' });
    expect(resolved.resolvidoEm).not.toBeNull();
  });

  it('pedidos simultâneos não se perdem', async () => {
    await createStore({ slug: 'gara', name: 'Gara', segment: 'restaurante' }, 'ana');
    await Promise.all([1, 2, 3].map((i) => addPedido('gara', { texto: `Pedido ${i}`, canal: 'WhatsApp' }, 'ana')));
    expect(await listPedidos('gara')).toHaveLength(3);
  });
});

describe('pagamentos', () => {
  it('começa pendente e marca como pago', async () => {
    await createStore({ slug: 'gara', name: 'Gara', segment: 'restaurante' }, 'ana');
    expect(await getPayment('gara', '2026-10')).toMatchObject({ paid: false, paidAt: null });
    await setPayment('gara', '2026-10', { paid: true, note: 'Pix dia 5' }, 'ana');
    const paid = await getPayment('gara', '2026-10');
    expect(paid).toMatchObject({ paid: true, paidBy: 'ana', note: 'Pix dia 5' });
    expect(paid.paidAt).not.toBeNull();
  });

  it('não perde a data de pagamento ao só editar a nota', async () => {
    await createStore({ slug: 'gara', name: 'Gara', segment: 'restaurante' }, 'ana');
    await setPayment('gara', '2026-10', { paid: true, note: '' }, 'ana');
    const first = await getPayment('gara', '2026-10');
    await setPayment('gara', '2026-10', { paid: true, note: 'combinado' }, 'ana');
    const second = await getPayment('gara', '2026-10');
    expect(second.paidAt).toBe(first.paidAt);
  });
});

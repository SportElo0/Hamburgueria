import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { seedStores } from '@/lib/seeds';
import { storeSchema, type Store, type StoreRecord } from '@/lib/schema';
import { DEFAULT_ORDERING, DEFAULT_RESERVATIONS, type Order } from '@/lib/ordering';
import { applyAction, setOpen } from '@/lib/orders';
import { addByStaff, joinQueue, leaveQueue, queueOfDay, queueStatus, updateQueue, waitingCount } from '@/lib/fila';
import { confirmTable, floor, openTable, orderAtTable, tableState } from '@/lib/mesas';
import { paymentOutcome, settleTablePaymentFromMercadoPago, simulateTablePayment, startTablePayment } from '@/lib/mesa-pagamento';
import { setMercadoPagoToken } from '@/lib/pix';
import { pushOrder, recentSends, toSaiposOrder } from '@/lib/pdv';

const SLUG = 'el-patron-burger';
const ORIGIN = 'https://painel.example';
const NOW = new Date('2026-11-05T20:00:00-03:00');
const item = { items: [{ productId: 'batata-completa', quantity: 1, selections: { tamanho: ['grande'] } }] };

const SELLER = { name: 'Restaurante Teste Ltda', cnpj: '12.345.678/0001-90', address: 'Rua Teste, 1, São Paulo/SP', privacyContact: 'privacidade@teste.local', keepMonths: 6 };

function elPatron(extra: Record<string, unknown> = {}, demoStore = true): Store {
  const seed = seedStores().find((s) => s.slug === SLUG)!;
  return storeSchema.parse({
    ...seed,
    extra: { ...seed.extra, demo: demoStore },
    ordering: { ...DEFAULT_ORDERING, enabled: true, tables: { enabled: true, count: 12 }, waitlist: { enabled: true, maxParties: 5 }, tablePay: true, reservations: { ...DEFAULT_RESERVATIONS, seller: SELLER }, ...extra },
  });
}
async function publish(store: Store) {
  const record: StoreRecord = { store, updatedAt: NOW.toISOString(), updatedBy: 'teste', publishedAt: NOW.toISOString() };
  await storage().writeJSON(`lojas/${store.slug}/rascunho.json`, record);
  await storage().writeJSON(`lojas/${store.slug}/publicado.json`, record);
}

beforeEach(async () => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'fila-')));
  await publish(elPatron());
  await setOpen(SLUG, true, 'teste');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('fila de espera', () => {
  it('entra, vê a posição, é chamado e senta', async () => {
    const a = await joinQueue(SLUG, { name: 'Ana', phone: '(11) 98888-7777', people: 2 }, '1.1.1.1', NOW);
    const b = await joinQueue(SLUG, { name: 'Bruno', people: 4 }, '2.2.2.2', new Date(NOW.getTime() + 1000));
    expect(a.entry.position).toBe(1);
    expect(b.entry).toMatchObject({ position: 2, ahead: 1 });
    expect(await waitingCount(SLUG, NOW)).toBe(2);
    // Someone else's link token sees nothing.
    expect(await queueStatus(SLUG, a.id, b.token)).toBeNull();

    await updateQueue(SLUG, a.id, 'chamar', null, NOW);
    expect((await queueStatus(SLUG, a.id, a.token))!.status).toBe('chamado');
    expect((await queueStatus(SLUG, b.id, b.token))!.position).toBe(1);
    await updateQueue(SLUG, a.id, 'sentou', 7, NOW);
    // Out of the queue, the phone is gone.
    expect((await queueOfDay(SLUG, NOW)).find((e) => e.id === a.id)).toMatchObject({ status: 'sentou', table: 7, phone: '' });
    await expect(updateQueue(SLUG, a.id, 'chamar', null, NOW)).rejects.toThrow('já saiu da fila');
    expect(await waitingCount(SLUG, NOW)).toBe(1);
  });

  it('sair da fila, não veio e cadastro pela recepção', async () => {
    const a = await joinQueue(SLUG, { name: 'Ana', people: 2 }, '1.1.1.1', NOW);
    expect((await leaveQueue(SLUG, a.id, a.token))!.status).toBe('saiu');
    const walk = await addByStaff(SLUG, { name: 'Carla', people: 3 }, NOW);
    expect(walk).toMatchObject({ by: 'equipe', phone: '', tokenHash: '' });
    await updateQueue(SLUG, walk.id, 'nao-veio', null, NOW);
    expect(await waitingCount(SLUG, NOW)).toBe(0);
  });

  it('recusa robôs, dados errados, fila cheia e o mesmo celular entrando muitas vezes', async () => {
    await expect(joinQueue(SLUG, { name: 'Bot', people: 2, website: 'x' }, '1.1.1.1', NOW)).rejects.toThrow();
    await expect(joinQueue(SLUG, { name: 'Ana', phone: '123', people: 2 }, '1.1.1.1', NOW)).rejects.toThrow('Telefone');
    for (let i = 0; i < 4; i++) await joinQueue(SLUG, { name: `Pessoa ${i}`, people: 2 }, '3.3.3.3', NOW);
    await expect(joinQueue(SLUG, { name: 'Quinta', people: 2 }, '3.3.3.3', NOW)).rejects.toThrow('várias vezes');
    await joinQueue(SLUG, { name: 'Quinta', people: 2 }, '4.4.4.4', NOW);
    await expect(joinQueue(SLUG, { name: 'Sexta', people: 2 }, '5.5.5.5', NOW)).rejects.toThrow('cheia');
  });

  it('desligada na loja, ou sem os dados do restaurante, não aceita ninguém', async () => {
    await publish(elPatron({ waitlist: { enabled: false, maxParties: 60 } }));
    await expect(joinQueue(SLUG, { name: 'Ana', people: 2 }, '1.1.1.1', NOW)).rejects.toThrow('não está usando a fila');
    await publish(elPatron({ reservations: DEFAULT_RESERVATIONS }));
    await expect(joinQueue(SLUG, { name: 'Ana', people: 2 }, '1.1.1.1', NOW)).rejects.toThrow('não está usando a fila');
  });

  it('conta o IPv6 pela rede /64, mesmo escrito de jeitos diferentes', async () => {
    for (let i = 0; i < 4; i++) await joinQueue(SLUG, { name: `P${i}`, people: 2 }, `2001:db8::${i + 1}`, NOW);
    await expect(joinQueue(SLUG, { name: 'Outra', people: 2 }, '2001:0db8:0:0:aaaa::1', NOW)).rejects.toThrow('várias vezes');
  });

  it('apaga a fila de dias antigos', async () => {
    const old = new Date(NOW.getTime() - 2 * 86_400_000);
    await joinQueue(SLUG, { name: 'Antiga', people: 2 }, '', old);
    await joinQueue(SLUG, { name: 'Hoje', people: 2 }, '', NOW);
    const keys = await storage().list(`fila/${SLUG}/`);
    expect(keys.some((k) => k.includes('2026-11-03'))).toBe(false);
    expect(keys.some((k) => k.includes('2026-11-05'))).toBe(true);
  });
});

async function seatedTable(n = 5) {
  const token = await openTable(SLUG, n, '');
  await orderAtTable(SLUG, n, token, item);
  await orderAtTable(SLUG, n, token, item);
  await confirmTable(SLUG, n, 'garçom');
  const state = await tableState(SLUG, n, token);
  if (!state.member) throw new Error('esperava estar na mesa');
  return { token, total: state.total as number };
}

describe('pagar na mesa pelo Pix', () => {
  it('divide a conta e fecha a mesa sozinha quando tudo é pago', async () => {
    const { token, total } = await seatedTable();
    const first = await startTablePayment(SLUG, 5, token, 2, '', ORIGIN);
    expect(first.amount).toBe(Math.ceil(total / 2));
    expect(first.pix.demo).toBe(true);
    await simulateTablePayment(SLUG, 5, token, first.id);
    const mid = await tableState(SLUG, 5, token);
    expect(mid).toMatchObject({ member: true, paid: first.amount, due: total - first.amount });

    const rest = await startTablePayment(SLUG, 5, token, 2, '', ORIGIN);
    expect(rest.amount).toBe(total - first.amount);
    // The same phone still on "2 pessoas" pays only what is left, not half of it.
    await simulateTablePayment(SLUG, 5, token, rest.id);
    expect(await floor(SLUG)).toEqual([]);
  });

  it('três pessoas dividindo: cada uma paga um terço da conta inteira', async () => {
    const { token, total } = await seatedTable();
    const third = Math.ceil(total / 3);
    const a = await startTablePayment(SLUG, 5, token, 3, '', ORIGIN);
    await simulateTablePayment(SLUG, 5, token, a.id);
    const b = await startTablePayment(SLUG, 5, token, 3, '', ORIGIN);
    expect(b.amount).toBe(third);
    await simulateTablePayment(SLUG, 5, token, b.id);
    const c = await startTablePayment(SLUG, 5, token, 3, '', ORIGIN);
    expect(c.amount).toBe(total - 2 * third);
    await simulateTablePayment(SLUG, 5, token, c.id);
    expect(await floor(SLUG)).toEqual([]);
  });

  it('Pix de demonstração não fecha conta de loja de verdade', async () => {
    await publish(elPatron({}, false));
    const { token } = await seatedTable();
    await expect(startTablePayment(SLUG, 5, token, 1, '', ORIGIN)).rejects.toThrow('desligado');
  });

  it('só quem está na mesa, com a mesa confirmada e o recurso ligado', async () => {
    const token = await openTable(SLUG, 6, '');
    await orderAtTable(SLUG, 6, token, item);
    await expect(startTablePayment(SLUG, 6, token, 1, '', ORIGIN)).rejects.toThrow('confirmar a mesa');
    await confirmTable(SLUG, 6, 'garçom');
    await expect(startTablePayment(SLUG, 6, 'intruso', 1, '', ORIGIN)).rejects.toThrow('não está na mesa');
    await expect(startTablePayment(SLUG, 6, token, 0, '', ORIGIN)).rejects.toThrow('entre 1 e 20');
    await publish(elPatron({ tablePay: false }));
    await expect(startTablePayment(SLUG, 6, token, 1, '', ORIGIN)).rejects.toThrow('desligado');
  });

  it('guarda quanto voltou para avisar o celular que pagou', async () => {
    const { token, total } = await seatedTable();
    const whole = await startTablePayment(SLUG, 5, token, 1, '', ORIGIN);
    const half = await startTablePayment(SLUG, 5, token, 2, '', ORIGIN);
    await simulateTablePayment(SLUG, 5, token, half.id);
    await simulateTablePayment(SLUG, 5, token, whole.id);
    expect(await floor(SLUG)).toEqual([]);
    expect(await paymentOutcome(SLUG, half.id)).toBeNull();
    expect(await paymentOutcome(SLUG, whole.id)).toEqual({ amount: total - (total - half.amount), status: 'feito' });
  });

  describe('Pix real (Mercado Pago simulado)', () => {
    function mercadoPago(paid: () => number) {
      const calls: { method: string; url: string }[] = [];
      const refs = new Map<string, string>();
      let next = 700;
      vi.stubGlobal('fetch', async (url: string, init: RequestInit = {}) => {
        const method = init.method ?? 'GET';
        calls.push({ method, url });
        const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (method === 'POST' && url.endsWith('/v1/payments')) {
          const id = String(next++);
          refs.set(id, JSON.parse(String(init.body)).external_reference);
          return json({ id: Number(id), point_of_interaction: { transaction_data: { qr_code: 'PIX-REAL', qr_code_base64: 'AAAA' } } });
        }
        if (method === 'GET') {
          const id = /\/v1\/payments\/(\d+)/.exec(url)?.[1] ?? '';
          return json({ status: 'approved', transaction_amount: paid() / 100, external_reference: refs.get(id) ?? '' });
        }
        return json({});
      });
      return calls;
    }
    async function real() {
      await publish(elPatron({ pixMode: 'mercadopago' }));
      await setMercadoPagoToken(SLUG, 'TOKEN-DE-TESTE');
    }

    it('pede e-mail e fecha a mesa quando o Pix cai', async () => {
      await real();
      const { token, total } = await seatedTable();
      mercadoPago(() => total);
      await expect(startTablePayment(SLUG, 5, token, 1, '', ORIGIN)).rejects.toThrow('e-mail');
      await startTablePayment(SLUG, 5, token, 1, 'ana@teste.local', ORIGIN);
      expect(await settleTablePaymentFromMercadoPago(SLUG, '700')).toBe(true);
      expect(await floor(SLUG)).toEqual([]);
    });

    it('valor menor que o pedido é devolvido e a mesa continua aberta', async () => {
      await real();
      const { token } = await seatedTable();
      const calls = mercadoPago(() => 100);
      await startTablePayment(SLUG, 5, token, 1, 'ana@teste.local', ORIGIN);
      expect(await settleTablePaymentFromMercadoPago(SLUG, '700')).toBe(false);
      expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/refunds'))).toBe(true);
      expect((await floor(SLUG)).length).toBe(1);
    });

    it('Pix pago depois que a mesa fechou é devolvido uma vez', async () => {
      await real();
      const { token, total } = await seatedTable();
      let amount = total;
      const calls = mercadoPago(() => amount);
      await startTablePayment(SLUG, 5, token, 1, 'ana@teste.local', ORIGIN); // 700
      await startTablePayment(SLUG, 5, token, 1, 'bia@teste.local', ORIGIN); // 701, the same bill from another phone
      expect(await settleTablePaymentFromMercadoPago(SLUG, '700')).toBe(true);
      expect(await floor(SLUG)).toEqual([]);
      amount = total;
      expect(await settleTablePaymentFromMercadoPago(SLUG, '701')).toBe(false);
      expect(await settleTablePaymentFromMercadoPago(SLUG, '701')).toBe(false);
      expect(calls.filter((c) => c.method === 'POST' && c.url.endsWith('/refunds')).length).toBe(1);
    });
  });
});

const baseOrder: Order = {
  id: 'abc123',
  number: 12,
  tokenHash: 'x',
  createdAt: NOW.toISOString(),
  updatedAt: NOW.toISOString(),
  status: 'preparo',
  history: [],
  customer: { name: 'Ana', phone: '11988887777', email: '' },
  mode: 'entrega',
  address: { area: 'Centro', street: 'Rua A, 10', reference: 'portão azul' },
  payment: { method: 'dinheiro', status: 'na-entrega', changeFor: 10000, pix: null, paidAt: null },
  lines: [{ productId: 'smash', name: 'Smash', quantity: 2, unit: 3200, options: [{ group: 'Adicional', label: 'Bacon', price: 400 }], notes: 'sem cebola', total: 6400 }],
  subtotal: 6400,
  deliveryFee: 800,
  feePending: false,
  discount: 0,
  coupon: '',
  total: 7200,
  note: '',
  reason: '',
} as unknown as Order;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- loose view of the JSON sent to Saipos
type Saipos = Record<string, any>;
const pdv = { provider: 'saipos' as const, codStore: 'LOJA-1', codes: { smash: 'SM01', 'smash:Bacon': 'AD-BAC' }, city: 'São Paulo', state: 'SP' };

describe('PDV Saipos', () => {
  it('entrega: endereço, troco, códigos do PDV e adicional separado do preço', () => {
    const o = toSaiposOrder(baseOrder, { name: 'El Patron' }, pdv) as Saipos;
    expect(o).toMatchObject({ order_id: 'abc123', display_id: '12', cod_store: 'LOJA-1', total_amount: 72 });
    expect(o.order_method).toMatchObject({ mode: 'DELIVERY', delivery_by: 'RESTAURANT', delivery_fee: 8 });
    expect(o.delivery_address).toMatchObject({ city: 'São Paulo', state: 'SP', district: 'Centro' });
    expect(o.payment_types).toEqual([{ code: 'DIN', amount: 72, change_for: 100, type: 'OFFLINE' }]);
    expect(o.items[0]).toMatchObject({ integration_code: 'SM01', quantity: 2, unit_price: 28, notes: 'sem cebola' });
    expect(o.items[0].choice_items[0]).toMatchObject({ integration_code: 'AD-BAC', aditional_price: 4 });
    expect(JSON.stringify(o).toLowerCase()).not.toContain('cpf');
  });

  it('retirada com Pix pago e mesa sem pagamento nem cliente', () => {
    const pix = toSaiposOrder({ ...baseOrder, mode: 'retirada', address: null, payment: { ...baseOrder.payment, method: 'pix', status: 'pago' } }, { name: 'x' }, pdv) as Saipos;
    expect(pix.order_method.mode).toBe('TAKEOUT');
    expect(pix.payment_types[0]).toMatchObject({ code: 'PARTNER_PAYMENT', type: 'ONLINE' });
    const table = toSaiposOrder({ ...baseOrder, mode: 'mesa', address: null, table: { number: 4, session: 's' } }, { name: 'x' }, { ...pdv, codes: {} }) as Saipos;
    expect(table.order_method).toMatchObject({ mode: 'TABLE', table_reference: 'Mesa 4' });
    expect(table.table).toEqual({ desc_table: '4' });
    expect(table.payment_types).toBeUndefined();
    expect(table.customer).toBeUndefined();
    expect(table.items[0].integration_code).toBe('smash');
  });

  it('manda ao aceitar o pedido, registra e não manda duas vezes', async () => {
    await publish(elPatron({ pdv }));
    vi.stubEnv('SAIPOS_PARTNER_ID', 'parceiro');
    vi.stubEnv('SAIPOS_SECRET', 'segredo');
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(url);
      if (url.endsWith('/auth')) return new Response(JSON.stringify({ token: 'jwt' }), { status: 200 });
      return new Response('{}', { status: 200 });
    });
    const token = await openTable(SLUG, 3, '');
    const order = await orderAtTable(SLUG, 3, token, item);
    await confirmTable(SLUG, 3, 'garçom');
    await applyAction(SLUG, order.id, 'aceitar', 'cozinha');
    expect(calls.filter((u) => u.endsWith('/order')).length).toBe(1);
    expect((await recentSends(SLUG))[0]).toMatchObject({ orderId: order.id, status: 'enviado' });
    await pushOrder(SLUG, { ...order, status: 'preparo' });
    expect(calls.filter((u) => u.endsWith('/order')).length).toBe(1);
  });

  it('sem as credenciais de parceiro, registra que não enviou', async () => {
    await publish(elPatron({ pdv }));
    vi.stubEnv('SAIPOS_PARTNER_ID', '');
    vi.stubEnv('SAIPOS_SECRET', '');
    await pushOrder(SLUG, baseOrder);
    expect((await recentSends(SLUG))[0]).toMatchObject({ status: 'sem-credenciais' });
  });

  it('sem os dados do restaurante (aviso de privacidade), não manda nada ao PDV', async () => {
    await publish(elPatron({ pdv, reservations: DEFAULT_RESERVATIONS }));
    vi.stubEnv('SAIPOS_PARTNER_ID', 'parceiro');
    vi.stubEnv('SAIPOS_SECRET', 'segredo');
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => (calls.push(url), new Response('{}', { status: 200 })));
    await pushOrder(SLUG, baseOrder);
    expect(calls).toEqual([]);
    expect((await recentSends(SLUG))[0]).toMatchObject({ status: 'erro' });
  });

  it('erro do Saipos fica registrado para reenviar', async () => {
    await publish(elPatron({ pdv }));
    vi.stubEnv('SAIPOS_PARTNER_ID', 'parceiro');
    vi.stubEnv('SAIPOS_SECRET', 'segredo');
    vi.stubGlobal('fetch', async (url: string) =>
      url.endsWith('/auth') ? new Response(JSON.stringify({ token: 'jwt' }), { status: 200 }) : new Response(JSON.stringify({ errorMessage: 'cod_store inválido' }), { status: 400 }),
    );
    await pushOrder(SLUG, baseOrder);
    expect((await recentSends(SLUG))[0]).toMatchObject({ status: 'erro', error: 'Saipos 400: cod_store inválido' });
  });
});

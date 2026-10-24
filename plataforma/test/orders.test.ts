import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { seedStores } from '@/lib/seeds';
import { storeSchema, toPublic, type Store, type StoreRecord } from '@/lib/schema';
import { DEFAULT_ORDERING, applyCoupon, nextStatus, orderInputSchema, orderingSchema, priceOrder, publicOrdering, salesReport, type OrderInput } from '@/lib/ordering';
import { ActionError, OrderError, applyAction, getOperation, getOrder, listOrders, ordersForDays, placeOrder, setOpen, setSoldOut, simulateDemoPayment, trackOrder } from '@/lib/orders';
import { authenticateOperator, removeOperator, upsertOperator } from '@/lib/operators';
import { listCustomers, setOptOut } from '@/lib/customers';
import { addSubscriber } from '@/lib/subscribers';

const SLUG = 'el-patron-burger';
const ORIGIN = 'https://painel.example';

function elPatron(overrides: Partial<Store['ordering']> = {}): Store {
  const seed = seedStores().find((s) => s.slug === SLUG)!;
  return storeSchema.parse({ ...seed, ordering: { ...DEFAULT_ORDERING, enabled: true, ...overrides } });
}

async function publishStore(store: Store) {
  const record: StoreRecord = { store, updatedAt: new Date().toISOString(), updatedBy: 'teste', publishedAt: new Date().toISOString() };
  await storage().writeJSON(`lojas/${store.slug}/rascunho.json`, record);
  await storage().writeJSON(`lojas/${store.slug}/publicado.json`, record);
}

const base = (extra: Partial<OrderInput> = {}): OrderInput => ({
  items: [
    { productId: 'el-patron', quantity: 1, selections: { adicionais: ['bacon'] }, notes: 'sem cebola' },
    { productId: 'batata-completa', quantity: 2, selections: { tamanho: ['grande'] } },
  ],
  customer: { name: 'Ana Souza', phone: '(11) 98888-7777' },
  mode: 'retirada',
  payment: 'cartao',
  ...extra,
});

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'pedidos-')));
});

describe('preço do pedido', () => {
  it('soma itens, adicionais e tamanhos pelo cardápio publicado', () => {
    const priced = priceOrder(elPatron(), orderInputSchema.parse(base()));
    // El Patron 47,99 + bacon 6,99; batata completa grande 32,99 × 2
    expect(priced.lines[0]).toMatchObject({ name: 'El Patron', unit: 5498, total: 5498, notes: 'sem cebola' });
    expect(priced.lines[1]).toMatchObject({ unit: 3299, total: 6598 });
    expect(priced.total).toBe(5498 + 6598);
  });

  it('usa o preço do adicional da categoria Adicionais (como o site)', () => {
    const store = elPatron();
    store.catalog.categories.find((c) => c.id === 'adicionais')!.items.find((i) => i.id === 'bacon')!.price = 800;
    expect(priceOrder(store, orderInputSchema.parse(base())).lines[0].unit).toBe(4799 + 800);
  });

  it('recusa item esgotado, opção inexistente e tamanho faltando', () => {
    const store = elPatron();
    store.catalog.categories[0].items[0].available = false;
    expect(() => priceOrder(store, orderInputSchema.parse(base()))).toThrow(/esgotado/);
    const fresh = elPatron();
    expect(() => priceOrder(fresh, orderInputSchema.parse(base({ items: [{ productId: 'el-patron', quantity: 1, selections: { adicionais: ['caviar'] } }] })))).toThrow(OrderError);
    expect(() => priceOrder(fresh, orderInputSchema.parse(base({ items: [{ productId: 'onion-rings', quantity: 1, selections: {} }] })))).toThrow(/Tamanho/);
  });

  it('cobra a taxa do bairro e exige endereço', () => {
    const store = elPatron({ areas: [{ id: 'centro', name: 'Centro', fee: 700 }] });
    const input = orderInputSchema.parse(base({ mode: 'entrega', address: { areaId: 'centro', street: 'Rua A, 10', reference: '' } }));
    const priced = priceOrder(store, input);
    expect(priced.deliveryFee).toBe(700);
    expect(priced.total).toBe(5498 + 6598 + 700);
    expect(() => priceOrder(store, orderInputSchema.parse(base({ mode: 'entrega', address: { areaId: 'x', street: 'Rua A, 10', reference: '' } })))).toThrow(/bairro/);
    expect(() => priceOrder(store, orderInputSchema.parse(base({ mode: 'entrega', address: { areaId: 'centro', street: '', reference: '' } })))).toThrow(/endereço/);
  });

  it('sem bairros, a taxa fica a combinar e o Pix não vale para entrega', () => {
    const store = elPatron();
    const priced = priceOrder(store, orderInputSchema.parse(base({ mode: 'entrega', address: { areaId: '', street: 'Rua B, 2', reference: '' } })));
    expect(priced.feePending).toBe(true);
    expect(() => priceOrder(store, orderInputSchema.parse(base({ mode: 'entrega', payment: 'pix', address: { areaId: '', street: 'Rua B, 2', reference: '' } })))).toThrow(/Pix/);
  });

  it('respeita pedido mínimo, formas de pagamento e troco', () => {
    expect(() => priceOrder(elPatron({ minOrder: 100_000 }), orderInputSchema.parse(base()))).toThrow(/mínimo/);
    expect(() => priceOrder(elPatron({ card: false }), orderInputSchema.parse(base()))).toThrow(/pagamento/);
    expect(() => priceOrder(elPatron(), orderInputSchema.parse(base({ payment: 'dinheiro', changeFor: 1000 })))).toThrow(/troco/);
  });

  it('valida telefone e esvazia a sacola vazia', () => {
    expect(orderInputSchema.safeParse(base({ customer: { name: 'Ana', phone: '123' } })).success).toBe(false);
    expect(orderInputSchema.parse(base({ customer: { name: 'Ana', phone: '+55 11 98888-7777' } })).customer.phone).toBe('11988887777');
    expect(orderInputSchema.safeParse(base({ items: [] })).success).toBe(false);
  });
});

describe('fluxo do pedido', () => {
  it('não aceita pedido com a loja fechada ou desligada', async () => {
    await publishStore(elPatron());
    await expect(placeOrder(SLUG, base(), ORIGIN)).rejects.toThrow(/fechada/);
    await publishStore(elPatron({ enabled: false }));
    await setOpen(SLUG, true, 'teste');
    await expect(placeOrder(SLUG, base(), ORIGIN)).rejects.toThrow(/não está recebendo/);
  });

  it('cartão na entrega: chega como novo, numerado, e segue até concluído', async () => {
    await publishStore(elPatron());
    await setOpen(SLUG, true, 'teste');
    const a = await placeOrder(SLUG, base(), ORIGIN);
    const b = await placeOrder(SLUG, base(), ORIGIN);
    expect([a.order.number, b.order.number]).toEqual([1, 2]);
    expect(a.order.status).toBe('novo');
    expect(a.order.payment.status).toBe('na-entrega');
    expect((await listOrders(SLUG)).map((o) => o.number)).toEqual([2, 1]);

    await applyAction(SLUG, a.order.id, 'aceitar', 'caixa');
    await applyAction(SLUG, a.order.id, 'despachar', 'caixa');
    expect((await getOrder(SLUG, a.order.id))!.status).toBe('pronto');
    await applyAction(SLUG, a.order.id, 'concluir', 'caixa');
    await expect(applyAction(SLUG, a.order.id, 'aceitar', 'caixa')).rejects.toThrow(ActionError);

    const tracked = await trackOrder(SLUG, a.order.id, a.token);
    expect(tracked!.status).toBe('concluido');
    expect(tracked!.history.map((h) => h.status)).toEqual(['novo', 'preparo', 'pronto', 'concluido']);
    expect(JSON.stringify(tracked)).not.toContain('tokenHash');
  });

  it('o link de acompanhamento exige o token certo', async () => {
    await publishStore(elPatron());
    await setOpen(SLUG, true, 'teste');
    const { order, token } = await placeOrder(SLUG, base(), ORIGIN);
    expect(await trackOrder(SLUG, order.id, token.replace(/.$/, token.endsWith('a') ? 'b' : 'a'))).toBeNull();
    expect(await trackOrder(SLUG, order.id, '')).toBeNull();
    expect(await trackOrder(SLUG, order.id, token)).not.toBeNull();
  });

  it('Pix de demonstração: só chega na loja depois de pago', async () => {
    await publishStore(elPatron());
    await setOpen(SLUG, true, 'teste');
    const { order, token } = await placeOrder(SLUG, base({ payment: 'pix' }), ORIGIN);
    expect(order.status).toBe('aguardando-pix');
    expect(order.payment.pix?.qrBase64.length).toBeGreaterThan(100);
    const before = await trackOrder(SLUG, order.id, token);
    expect(before!.payment.pix?.demo).toBe(true);

    const paid = await simulateDemoPayment(SLUG, order.id, token);
    expect(paid!.status).toBe('novo');
    expect(paid!.payment.status).toBe('pago');
    expect(paid!.payment.pix).toBeNull();
    expect(await simulateDemoPayment(SLUG, order.id, token)).toBeNull();
  });

  it('recusar um Pix pago marca a devolução', async () => {
    await publishStore(elPatron());
    await setOpen(SLUG, true, 'teste');
    const { order, token } = await placeOrder(SLUG, base({ payment: 'pix' }), ORIGIN);
    await simulateDemoPayment(SLUG, order.id, token);
    const refused = await applyAction(SLUG, order.id, 'recusar', 'caixa', 'acabou o pão');
    expect(refused.status).toBe('recusado');
    expect(refused.payment.status).toBe('devolvido');
    expect((await trackOrder(SLUG, order.id, token))!.reason).toBe('acabou o pão');
  });

  it('Pix vencido aparece como expirado e não pode ser simulado', async () => {
    await publishStore(elPatron());
    await setOpen(SLUG, true, 'teste');
    const past = new Date(Date.now() - 2 * 60 * 60_000);
    const { order, token } = await placeOrder(SLUG, base({ payment: 'pix' }), ORIGIN, past);
    expect((await trackOrder(SLUG, order.id, token))!.status).toBe('expirado');
    expect(await simulateDemoPayment(SLUG, order.id, token)).toBeNull();
  });

  it('dois pedidos ao mesmo tempo recebem números diferentes', async () => {
    await publishStore(elPatron());
    await setOpen(SLUG, true, 'teste');
    const placed = await Promise.all(Array.from({ length: 5 }, () => placeOrder(SLUG, base(), ORIGIN)));
    expect(new Set(placed.map((p) => p.order.number)).size).toBe(5);
  });

  it('o site público vê se a loja está aberta, sem segredos', async () => {
    const store = elPatron({ pixMode: 'mercadopago' });
    const pub = toPublic(store, null, ORIGIN, true);
    expect(pub.ordering).toMatchObject({ enabled: true, open: true, pixDemo: false });
    expect(JSON.stringify(pub)).not.toMatch(/mercadoPagoToken|account/);
  });
});

describe('regras de status', () => {
  it('cada ação só vale no momento certo', () => {
    expect(nextStatus({ status: 'novo', mode: 'entrega' }, 'aceitar')).toBe('preparo');
    expect(nextStatus({ status: 'preparo', mode: 'entrega' }, 'despachar')).toBe('saiu');
    expect(nextStatus({ status: 'preparo', mode: 'retirada' }, 'despachar')).toBe('pronto');
    expect(nextStatus({ status: 'saiu', mode: 'entrega' }, 'concluir')).toBe('concluido');
    expect(nextStatus({ status: 'concluido', mode: 'entrega' }, 'recusar')).toBeNull();
    expect(nextStatus({ status: 'aguardando-pix', mode: 'entrega' }, 'aceitar')).toBeNull();
  });
});

describe('acesso da loja', () => {
  it('cria login com senha gerada, troca a senha e remove', async () => {
    const pass = await upsertOperator(SLUG, { email: 'Caixa@ElPatron.com', name: 'Caixa' }, 'equipe');
    expect(pass).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
    expect((await authenticateOperator('caixa@elpatron.com', pass))?.slug).toBe(SLUG);
    expect(await authenticateOperator('caixa@elpatron.com', 'errada')).toBeNull();
    const pass2 = await upsertOperator(SLUG, { email: 'caixa@elpatron.com', name: 'Caixa' }, 'equipe');
    expect(await authenticateOperator('caixa@elpatron.com', pass)).toBeNull();
    expect(await authenticateOperator('caixa@elpatron.com', pass2)).not.toBeNull();
    await expect(upsertOperator('outra-loja', { email: 'caixa@elpatron.com', name: '' }, 'equipe')).rejects.toThrow(/outra loja/);
    await removeOperator(SLUG, 'caixa@elpatron.com');
    expect(await authenticateOperator('caixa@elpatron.com', pass2)).toBeNull();
  });
});

describe('cupom, esgotado e relatório', () => {
  const coupons = [
    { code: 'PATRON10', type: 'percent' as const, value: 10, minOrder: 5000, active: true, until: '' },
    { code: 'MENOS5', type: 'fixed' as const, value: 500, minOrder: 0, active: true, until: '2020-01-01' },
    { code: 'PAUSADO', type: 'fixed' as const, value: 500, minOrder: 0, active: false, until: '' },
  ];

  it('normaliza o código e valida o cupom', () => {
    const o = orderingSchema.parse({ ...DEFAULT_ORDERING, coupons: [{ ...coupons[0], code: ' patron10 ' }] });
    expect(o.coupons[0].code).toBe('PATRON10');
    expect(() => orderingSchema.parse({ ...DEFAULT_ORDERING, coupons: [{ ...coupons[0], code: 'com espaço' }] })).toThrow();
    const ord = orderingSchema.parse({ ...DEFAULT_ORDERING, coupons });
    expect(applyCoupon(ord, 'patron10', 12000, '2026-10-20')).toEqual({ code: 'PATRON10', discount: 1200, freeDelivery: false });
    expect(() => applyCoupon(ord, 'PATRON10', 4000, '2026-10-20')).toThrow(/a partir de/);
    expect(() => applyCoupon(ord, 'MENOS5', 4000, '2026-10-20')).toThrow(/vencido/);
    expect(() => applyCoupon(ord, 'PAUSADO', 4000, '2026-10-20')).toThrow(/vencido/);
    expect(() => applyCoupon(ord, 'NADA', 4000, '2026-10-20')).toThrow(/vencido/);
    // The public catalogue only says whether a coupon exists, never the codes.
    expect(publicOrdering(ord, true).coupons).toBe(true);
    expect(JSON.stringify(publicOrdering(ord, true))).not.toContain('PATRON10');
  });

  it('o pedido sai com o desconto calculado no servidor', async () => {
    await publishStore(elPatron({ coupons }));
    await setOpen(SLUG, true, 'teste');
    const { order } = await placeOrder(SLUG, base({ coupon: 'patron10' }), ORIGIN);
    const subtotal = 5498 + 6598;
    expect(order.discount).toBe(Math.round(subtotal * 0.1));
    expect(order.coupon).toBe('PATRON10');
    expect(order.total).toBe(subtotal - order.discount);
    await expect(placeOrder(SLUG, base({ coupon: 'NADA' }), ORIGIN)).rejects.toThrow(/Cupom/);
  });

  it('esgotado com um toque some do site e trava o pedido, sem publicar de novo', async () => {
    await publishStore(elPatron());
    await setOpen(SLUG, true, 'teste');
    await setSoldOut(SLUG, 'el-patron', true, 'caixa');
    expect((await getOperation(SLUG)).soldOut).toEqual(['el-patron']);
    await expect(placeOrder(SLUG, base(), ORIGIN)).rejects.toThrow(/esgotado/);
    await setSoldOut(SLUG, 'el-patron', false, 'caixa');
    expect((await getOperation(SLUG)).open).toBe(true);
    await expect(placeOrder(SLUG, base(), ORIGIN)).resolves.toBeTruthy();
  });

  it('relatório soma só os pedidos aceitos', async () => {
    await publishStore(elPatron({ coupons }));
    await setOpen(SLUG, true, 'teste');
    const a = await placeOrder(SLUG, base({ coupon: 'PATRON10' }), ORIGIN);
    const b = await placeOrder(SLUG, base({ payment: 'dinheiro' }), ORIGIN);
    const c = await placeOrder(SLUG, base({ customer: { name: 'Bia', phone: '11977776666' } }), ORIGIN);
    await placeOrder(SLUG, base(), ORIGIN); // still waiting: not a sale yet
    await applyAction(SLUG, a.order.id, 'aceitar', 'caixa');
    await applyAction(SLUG, b.order.id, 'aceitar', 'caixa');
    await applyAction(SLUG, c.order.id, 'recusar', 'caixa', 'acabou o pão');
    const days = await ordersForDays(SLUG, 7);
    expect(days).toHaveLength(7);
    const r = salesReport(days);
    expect(r.orders).toBe(2);
    expect(r.revenue).toBe(a.order.total + b.order.total);
    expect(r.average).toBe(Math.round((a.order.total + b.order.total) / 2));
    expect(r.refused).toBe(1);
    expect(r.byPayment.cartao.orders).toBe(1);
    expect(r.byPayment.dinheiro.orders).toBe(1);
    expect(r.byMode.retirada.orders).toBe(2);
    expect(r.topItems[0]).toMatchObject({ name: 'Batata frita completa', quantity: 4 });
    expect(r.coupons).toEqual([{ code: 'PATRON10', orders: 1, discount: a.order.discount }]);
    expect(r.customers).toBe(1);
    expect(r.returning).toBe(1);
    expect(r.byHour.reduce((x, y) => x + y, 0)).toBe(2);
  });
});

describe('clube: entrega grátis e clientes', () => {
  const frete = { code: 'VOLTEI', type: 'frete' as const, value: 0, minOrder: 0, active: true, until: '' };
  const entrega = (extra: Partial<OrderInput> = {}) => base({ mode: 'entrega', address: { areaId: 'centro', street: 'Rua A, 10', reference: '' }, ...extra });

  it('cupom de entrega grátis zera a taxa e só vale para entrega', async () => {
    expect(() => orderingSchema.parse({ ...DEFAULT_ORDERING, coupons: [{ ...frete, type: 'fixed' }] })).toThrow();
    const ord = orderingSchema.parse({ ...DEFAULT_ORDERING, coupons: [frete] });
    expect(applyCoupon(ord, 'voltei', 3000, '2026-10-20')).toEqual({ code: 'VOLTEI', discount: 0, freeDelivery: true });
    await publishStore(elPatron({ coupons: [frete], areas: [{ id: 'centro', name: 'Centro', fee: 700 }] }));
    await setOpen(SLUG, true, 'teste');
    const { order } = await placeOrder(SLUG, entrega({ coupon: 'VOLTEI' }), ORIGIN);
    expect(order.deliveryFee).toBe(700);
    expect(order.discount).toBe(700);
    expect(order.total).toBe(order.subtotal);
    await expect(placeOrder(SLUG, base({ coupon: 'VOLTEI' }), ORIGIN)).rejects.toThrow(/só para entrega/);
  });

  it('lista clientes, respeita o aceite do último pedido e quem pediu para sair', async () => {
    await publishStore(elPatron());
    await setOpen(SLUG, true, 'teste');
    const ana1 = await placeOrder(SLUG, base({ optIn: true }), ORIGIN);
    const ana2 = await placeOrder(SLUG, base(), ORIGIN); // later order without the tick: consent withdrawn
    const bia = await placeOrder(SLUG, base({ customer: { name: 'Bia', phone: '11977776666' }, optIn: true }), ORIGIN);
    const caio = await placeOrder(SLUG, base({ customer: { name: 'Caio', phone: '11955554444' }, optIn: true }), ORIGIN);
    for (const p of [ana1, ana2, bia]) await applyAction(SLUG, p.order.id, 'aceitar', 'caixa');
    expect(ana1.order.optIn).toBe(true);

    let list = await listCustomers(SLUG);
    const by = (phone: string) => list.find((c) => c.phone === phone)!;
    expect(list).toHaveLength(3);
    expect(by('11988887777')).toMatchObject({ orders: 2, optIn: false });
    expect(by('11977776666')).toMatchObject({ orders: 1, optIn: true, spent: bia.order.total });
    expect(by('11955554444')).toMatchObject({ orders: 0, optIn: true }); // still waiting, but a contact

    await setOptOut(SLUG, '11977776666', true);
    list = await listCustomers(SLUG);
    expect(by('11977776666')).toMatchObject({ optIn: false, optedOut: true, ticked: true });
    await setOptOut(SLUG, '11977776666', false);
    list = await listCustomers(SLUG);
    expect(by('11977776666').optIn).toBe(true);
    expect(caio.order.optIn).toBe(true);
  });
});

describe('lista de ofertas pelo site', () => {
  it('quem se inscreve no site entra na lista; quem pediu para sair não volta sozinho', async () => {
    await publishStore(elPatron());
    await expect(addSubscriber(SLUG, { phone: '11 96666-5555', consent: false })).rejects.toThrow(/autorização/);
    await expect(addSubscriber('nao-existe', { phone: '11966665555', consent: true })).rejects.toThrow(/não encontrada/);
    await addSubscriber(SLUG, { name: 'Duda', phone: '(11) 96666-5555', consent: true });
    await addSubscriber(SLUG, { name: 'Duda Souza', phone: '11966665555', consent: true }); // same phone: one entry
    let list = await listCustomers(SLUG);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ phone: '11966665555', name: 'Duda Souza', orders: 0, optIn: true });
    expect(list[0].subscribedAt).toBeTruthy();

    // A later order without the tick box withdraws consent; signing up again afterwards restores it.
    await setOpen(SLUG, true, 'teste');
    await placeOrder(SLUG, base({ customer: { name: 'Duda', phone: '11966665555' } }), ORIGIN);
    list = await listCustomers(SLUG);
    expect(list[0].optIn).toBe(false);
    await addSubscriber(SLUG, { name: 'Duda', phone: '11966665555', consent: true });
    list = await listCustomers(SLUG);
    expect(list[0].optIn).toBe(true);

    await setOptOut(SLUG, '11966665555', true);
    await addSubscriber(SLUG, { name: 'Duda', phone: '11966665555', consent: true });
    expect((await listCustomers(SLUG))[0]).toMatchObject({ optIn: false, optedOut: true });
  });
});

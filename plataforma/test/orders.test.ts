import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { seedStores } from '@/lib/seeds';
import { storeSchema, toPublic, type Store, type StoreRecord } from '@/lib/schema';
import { DEFAULT_ORDERING, nextStatus, orderInputSchema, priceOrder, type OrderInput } from '@/lib/ordering';
import { ActionError, OrderError, applyAction, getOrder, listOrders, placeOrder, setOpen, simulateDemoPayment, trackOrder } from '@/lib/orders';
import { authenticateOperator, removeOperator, upsertOperator } from '@/lib/operators';

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

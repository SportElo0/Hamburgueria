import 'server-only';
import { ZodError } from 'zod';
import { storage, ConflictError } from './storage';
import { getPublished } from './stores';
import { checkCharge, createCharge, lookupMercadoPago, PixError, refundCharge, type PaymentCheck } from './pix';
import {
  OPEN_STATUSES,
  OrderError,
  effectiveStatus,
  nextStatus,
  orderInputSchema,
  orderingOf,
  priceOrder,
  withSoldOut,
  publicOrder,
  type OperatorAction,
  type Order,
  type OrderStatus,
} from './ordering';

/**
 * Layout in storage:
 *   pedidos/<slug>/<YYYY-MM-DD>.json   that day's orders (Order[]), São Paulo calendar day
 *   lojas/<slug>/operacao.json         live switches the store flips during service (open/closed)
 * One document per day keeps the store's polling to a single read; every write carries the etag
 * it read and retries on a conflict, so two orders arriving together both land.
 */

const TZ = 'America/Sao_Paulo';
const dayOf = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const dayKey = (slug: string, day: string) => `pedidos/${slug}/${day}.json`;
const opKey = (slug: string) => `lojas/${slug}/operacao.json`;
const ORDER_ID = /^(\d{4})(\d{2})(\d{2})-[a-z0-9]{10}$/;
const MAX_PER_DAY = 600;

export { OrderError };

export interface Operation {
  open: boolean;
  /** Item ids sold out right now (set from the store's screen, no publish). */
  soldOut: string[];
  updatedAt: string | null;
  updatedBy: string;
}

export async function getOperation(slug: string): Promise<Operation> {
  const doc = await storage().readJSON<Partial<Operation>>(opKey(slug));
  return { open: false, soldOut: [], updatedAt: null, updatedBy: '', ...(doc?.data ?? {}) };
}

async function updateOperation(slug: string, by: string, fn: (op: Operation) => Partial<Operation>): Promise<Operation> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await storage().readJSON<Partial<Operation>>(opKey(slug));
    const current: Operation = { open: false, soldOut: [], updatedAt: null, updatedBy: '', ...(doc?.data ?? {}) };
    const next: Operation = { ...current, ...fn(current), updatedAt: new Date().toISOString(), updatedBy: by };
    try {
      await storage().writeJSON(opKey(slug), next, doc ? doc.etag : null);
      return next;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
  throw new ConflictError();
}

export function setOpen(slug: string, open: boolean, by: string): Promise<Operation> {
  return updateOperation(slug, by, () => ({ open }));
}

export function setSoldOut(slug: string, itemId: string, soldOut: boolean, by: string): Promise<Operation> {
  return updateOperation(slug, by, (op) => ({
    soldOut: soldOut ? [...new Set([...op.soldOut, itemId])].slice(-300) : op.soldOut.filter((x) => x !== itemId),
  }));
}

function random(chars: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(chars));
  return Array.from(bytes, (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
}

async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function sameHash(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function dayOfId(id: string) {
  const m = ORDER_ID.exec(id);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

async function readDay(slug: string, day: string) {
  return storage().readJSON<Order[]>(dayKey(slug, day));
}

/** Read-modify-write of one day's list, retried when another write got there first. */
async function writeDay<R>(slug: string, day: string, fn: (orders: Order[]) => { orders: Order[]; result: R }): Promise<R> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const doc = await readDay(slug, day);
    const { orders, result } = fn(doc?.data ?? []);
    try {
      await storage().writeJSON(dayKey(slug, day), orders, doc ? doc.etag : null);
      return result;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 5) throw err;
    }
  }
  throw new ConflictError();
}

export async function getOrder(slug: string, id: string): Promise<Order | null> {
  const day = dayOfId(id);
  if (!day) return null;
  const doc = await readDay(slug, day);
  return doc?.data.find((o) => o.id === id) ?? null;
}

/** Applies `fn` to one order. `fn` returns null to leave it untouched. */
async function updateOrder(slug: string, id: string, fn: (o: Order) => Order | null): Promise<Order | null> {
  const day = dayOfId(id);
  if (!day) return null;
  return writeDay(slug, day, (orders) => {
    const i = orders.findIndex((o) => o.id === id);
    if (i < 0) return { orders, result: null };
    const next = fn(orders[i]);
    if (!next) return { orders, result: orders[i] };
    const copy = [...orders];
    copy[i] = { ...next, updatedAt: new Date().toISOString() };
    return { orders: copy, result: copy[i] };
  });
}

function messageOf(err: ZodError) {
  return err.issues[0]?.message || 'Confira os dados do pedido.';
}

export interface Placed {
  order: Order;
  /** The customer's tracking capability; only its hash is stored. */
  token: string;
}

/** Creates an order from what a site sent. `origin` is this panel's public URL (for payment notifications). */
export async function placeOrder(slug: string, raw: unknown, origin: string, now = new Date()): Promise<Placed> {
  const record = await getPublished(slug);
  if (!record) throw new OrderError('Loja não encontrada.');
  const operation = await getOperation(slug);
  const store = withSoldOut(record.store, operation.soldOut);
  const ordering = orderingOf(store);
  if (!ordering.enabled) throw new OrderError('Esta loja não está recebendo pedidos pelo site.');
  if (!operation.open) throw new OrderError('A loja está fechada agora. Tente de novo no horário de funcionamento.');

  const parsed = orderInputSchema.safeParse(raw);
  if (!parsed.success) throw new OrderError(messageOf(parsed.error));
  const input = parsed.data;
  if (input.website) throw new OrderError('Não foi possível enviar o pedido.');
  const priced = priceOrder(store, input);
  if (input.payment === 'pix' && ordering.pixMode === 'mercadopago' && !input.customer.email) {
    throw new OrderError('Informe seu e-mail para receber o comprovante do Pix.');
  }

  const day = dayOf(now);
  const id = `${day.replace(/-/g, '')}-${random(10)}`;
  const token = random(32);
  let pix = null;
  if (input.payment === 'pix') {
    try {
      pix = await createCharge(
        ordering.pixMode,
        {
          slug,
          orderId: id,
          amount: priced.total,
          description: `Pedido ${store.name}`,
          payerName: input.customer.name,
          payerEmail: input.customer.email,
          notificationUrl: `${origin}/api/pagamentos/mercadopago/${slug}`,
        },
        now,
      );
    } catch (err) {
      throw new OrderError(err instanceof PixError ? err.message : 'Não foi possível gerar o Pix agora. Escolha pagar na entrega ou tente de novo.');
    }
  }

  const at = now.toISOString();
  const status: OrderStatus = pix ? 'aguardando-pix' : 'novo';
  const base: Omit<Order, 'number'> = {
    id,
    tokenHash: await sha256(token),
    createdAt: at,
    updatedAt: at,
    status,
    history: [{ status, at, by: 'cliente' }],
    customer: input.customer,
    mode: input.mode,
    address: input.mode === 'entrega' ? { area: priced.areaName, street: input.address.street, reference: input.address.reference } : null,
    payment: {
      method: input.payment,
      status: pix ? 'pendente' : 'na-entrega',
      changeFor: input.payment === 'dinheiro' ? input.changeFor : null,
      pix,
      paidAt: null,
    },
    lines: priced.lines,
    subtotal: priced.subtotal,
    deliveryFee: priced.deliveryFee,
    feePending: priced.feePending,
    discount: priced.discount,
    coupon: priced.coupon,
    total: priced.total,
    note: input.note,
    reason: '',
    optIn: input.optIn,
  };
  const order = await writeDay(slug, day, (orders) => {
    // A ceiling against floods; far above what one kitchen takes in a day.
    if (orders.length >= MAX_PER_DAY) throw new OrderError('A loja não está aceitando mais pedidos pelo site hoje.');
    const created: Order = { ...base, number: orders.length + 1 };
    return { orders: [...orders, created], result: created };
  });
  return { order, token };
}

/** Today's orders plus yesterday's still-open ones (service runs past midnight). Newest first. */
export async function listOrders(slug: string, now = new Date()): Promise<Order[]> {
  const today = dayOf(now);
  const yesterday = dayOf(new Date(now.getTime() - 86_400_000));
  const [t, y] = await Promise.all([readDay(slug, today), readDay(slug, yesterday)]);
  const stamp = now.getTime();
  const open = (y?.data ?? []).filter((o) => OPEN_STATUSES.includes(effectiveStatus(o, stamp)));
  return [...open, ...(t?.data ?? [])]
    .map((o) => ({ ...o, status: effectiveStatus(o, stamp) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** The last `count` days of orders, oldest first, for the sales report. */
export async function ordersForDays(slug: string, count: number, now = new Date()) {
  const days = Array.from({ length: count }, (_, i) => dayOf(new Date(now.getTime() - (count - 1 - i) * 86_400_000)));
  return Promise.all(days.map(async (day) => ({ day, orders: (await readDay(slug, day))?.data ?? [] })));
}

/** Marks a Pix order paid once the provider (never the browser) has confirmed it. */
async function markPaid(slug: string, id: string, check: PaymentCheck | 'demo') {
  return updateOrder(slug, id, (o) => {
    if (o.payment.status === 'pago' || !['aguardando-pix', 'expirado'].includes(o.status)) return null;
    if (check !== 'demo' && (!check.paid || check.reference !== o.id || check.amount < o.total)) return null;
    const at = new Date().toISOString();
    return {
      ...o,
      status: 'novo',
      history: [...o.history, { status: 'novo', at, by: 'pix' }],
      payment: { ...o.payment, status: 'pago', paidAt: at },
    };
  });
}

async function authorised(slug: string, id: string, token: string) {
  const order = await getOrder(slug, id);
  if (!order || typeof token !== 'string' || token.length < 16) return null;
  return sameHash(order.tokenHash, await sha256(token)) ? order : null;
}

/** The customer's view of their order; also nudges a pending Mercado Pago charge. */
export async function trackOrder(slug: string, id: string, token: string) {
  let order = await authorised(slug, id, token);
  if (!order) return null;
  if (effectiveStatus(order) === 'aguardando-pix' && order.payment.pix?.provider === 'mercadopago') {
    const check = await checkCharge(slug, order.payment.pix).catch(() => null);
    if (check?.paid) order = (await markPaid(slug, id, check)) ?? order;
  }
  return publicOrder(order);
}

/** Practice Pix only: the customer taps "simular pagamento" to see the rest of the flow. */
export async function simulateDemoPayment(slug: string, id: string, token: string) {
  const order = await authorised(slug, id, token);
  if (!order || order.payment.pix?.provider !== 'demo' || effectiveStatus(order) !== 'aguardando-pix') return null;
  const paid = await markPaid(slug, id, 'demo');
  return paid ? publicOrder(paid) : null;
}

/** Mercado Pago notification: look the payment up with the store's own token, then settle the order it names. */
export async function settleFromMercadoPago(slug: string, paymentId: string) {
  const check = await lookupMercadoPago(slug, paymentId);
  if (!check?.paid || !ORDER_ID.test(check.reference)) return false;
  return Boolean(await markPaid(slug, check.reference, check));
}

export class ActionError extends Error {}

/** Accept, dispatch, finish or refuse an order from the store's panel. A refused Pix order is refunded. */
export async function applyAction(slug: string, id: string, action: OperatorAction, by: string, reason = '') {
  let refund = false;
  const updated = await updateOrder(slug, id, (o) => {
    const current = { ...o, status: effectiveStatus(o) };
    const to = nextStatus(current, action);
    if (!to) throw new ActionError('Esse pedido já mudou de situação. A lista foi atualizada.');
    refund = to === 'recusado' && o.payment.status === 'pago' && Boolean(o.payment.pix);
    return {
      ...o,
      status: to,
      reason: to === 'recusado' ? reason.trim().slice(0, 200) : o.reason,
      history: [...o.history, { status: to, at: new Date().toISOString(), by }],
      payment: refund ? { ...o.payment, status: 'devolver' } : o.payment,
    };
  });
  if (!updated) throw new ActionError('Pedido não encontrado.');
  if (refund && updated.payment.pix) {
    const ok = await refundCharge(slug, updated.payment.pix);
    if (ok) return (await updateOrder(slug, id, (o) => ({ ...o, payment: { ...o.payment, status: 'devolvido' } }))) ?? updated;
  }
  return updated;
}

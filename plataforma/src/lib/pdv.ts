import 'server-only';
import { storage, ConflictError } from './storage';
import { getPublished } from './stores';
import { orderingOf, sellerReady, type Order, type Ordering } from './ordering';
import type { Store } from './schema';

/**
 * Sending orders to the store's POS. First (and only) provider: Saipos, through its order-integration API
 * (https://saipos-docs-order-api.readme.io). The partner id and secret are Growlift's, given by Saipos when the
 * partnership is signed, and live only in env vars (SAIPOS_PARTNER_ID, SAIPOS_SECRET). Each store gives its Saipos
 * store code. An order goes to the POS when the store accepts it (it is going to the kitchen). Every attempt is
 * logged so the team can see and resend what failed. No CPF is ever sent (we never collect it).
 *
 * Layout in storage:
 *   pdv/<slug>/envios.json   the last sends (PdvSend[]), newest last
 */

export interface PdvSend {
  orderId: string;
  number: number;
  at: string;
  status: 'enviado' | 'erro' | 'sem-credenciais';
  error: string;
}

const API = () => process.env.SAIPOS_API_URL || 'https://order-api.saipos.com';
const logKey = (slug: string) => `pdv/${slug}/envios.json`;
const KEEP = 300;
const reais = (c: number) => Math.round(c) / 100;

export const saiposReady = () => Boolean(process.env.SAIPOS_PARTNER_ID && process.env.SAIPOS_SECRET);

/** Our order in Saipos's shape. Pure (tested); item codes come from the store's mapping, else our ids. */
export function toSaiposOrder(order: Order, store: Pick<Store, 'name'>, pdv: Ordering['pdv']) {
  const code = (id: string) => pdv.codes[id] || id;
  const items = order.lines.map((l) => {
    const extras = l.options.reduce((n, op) => n + op.price, 0);
    return {
      integration_code: code(l.productId),
      desc_item: l.name,
      quantity: l.quantity,
      unit_price: reais(l.unit - extras),
      notes: l.notes,
      choice_items: l.options.map((op) => ({
        integration_code: code(`${l.productId}:${op.label}`),
        desc_item_choice: op.group ? `${op.group}: ${op.label}` : op.label,
        aditional_price: reais(op.price),
        quantity: 1,
        notes: '',
      })),
    };
  });
  const base = {
    order_id: order.id,
    display_id: String(order.number),
    cod_store: pdv.codStore,
    created_at: order.createdAt,
    notes: order.note,
    total_discount: reais(order.discount),
    total_increase: 0,
    total_amount: reais(order.total),
    customer: order.mode === 'mesa' ? undefined : { id: order.customer.phone || order.id, name: order.customer.name, phone: order.customer.phone },
    items,
  };
  const paid = order.payment.status === 'pago';
  const payment_types =
    order.mode === 'mesa'
      ? undefined
      : order.payment.method === 'pix'
        ? [{ code: paid ? 'PARTNER_PAYMENT' : 'OTHER', amount: reais(order.total), type: paid ? 'ONLINE' : 'OFFLINE', complement: 'Pix' }]
        : order.payment.method === 'dinheiro'
          ? [{ code: 'DIN', amount: reais(order.total), change_for: order.payment.changeFor ? reais(order.payment.changeFor) : 0, type: 'OFFLINE' }]
          : [{ code: 'CARD', amount: reais(order.total), type: 'OFFLINE' }];

  if (order.mode === 'mesa') {
    const n = String(order.table?.number ?? '');
    return { ...base, order_method: { mode: 'TABLE', table_reference: `Mesa ${n}` }, table: { desc_table: n } };
  }
  if (order.mode === 'retirada') {
    return { ...base, order_method: { mode: 'TAKEOUT', scheduled: false, delivery_date_time: order.createdAt }, payment_types };
  }
  return {
    ...base,
    order_method: { mode: 'DELIVERY', delivery_by: 'RESTAURANT', delivery_fee: reais(order.deliveryFee), scheduled: false, delivery_date_time: order.createdAt },
    delivery_address: {
      country: 'BR',
      state: pdv.state,
      city: pdv.city,
      district: order.address?.area ?? '',
      street_name: order.address?.street ?? '',
      street_number: '',
      reference: order.address?.reference ?? '',
    },
    payment_types,
  };
}

let cached: { token: string; until: number } | null = null;

async function token(now = Date.now()) {
  if (cached && cached.until > now + 60_000) return cached.token;
  const res = await fetch(`${API()}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idPartner: process.env.SAIPOS_PARTNER_ID, secret: process.env.SAIPOS_SECRET }),
    signal: AbortSignal.timeout(8000),
  });
  const body = (await res.json().catch(() => ({}))) as { token?: string; errorMessage?: string };
  if (!res.ok || !body.token) throw new Error(`Saipos recusou a autenticação (${res.status}${body.errorMessage ? `: ${body.errorMessage}` : ''}).`);
  // The token is a JWT; use its expiry when readable, else keep it one hour.
  let until = now + 3_600_000;
  try {
    const exp = JSON.parse(Buffer.from(body.token.split('.')[1], 'base64url').toString()).exp;
    if (typeof exp === 'number') until = exp * 1000;
  } catch {}
  cached = { token: body.token, until };
  return body.token;
}

async function log(slug: string, entry: PdvSend) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const doc = await storage().readJSON<PdvSend[]>(logKey(slug));
    const list = (doc?.data ?? []).filter((e) => e.orderId !== entry.orderId);
    try {
      await storage().writeJSON(logKey(slug), [...list, entry].slice(-KEEP), doc ? doc.etag : null);
      return;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 4) throw err;
    }
  }
}

export async function recentSends(slug: string, limit = 15) {
  return ((await storage().readJSON<PdvSend[]>(logKey(slug)))?.data ?? []).slice(-limit).reverse();
}

/** Sends one order to the store's POS, once. Never throws: the result is logged for the team. */
export async function pushOrder(slug: string, order: Order, opts: { force?: boolean } = {}) {
  try {
    const record = await getPublished(slug);
    if (!record) return;
    const ordering = orderingOf(record.store);
    const pdv = ordering.pdv;
    if (pdv.provider !== 'saipos' || !pdv.codStore) return;
    const sent = ((await storage().readJSON<PdvSend[]>(logKey(slug)))?.data ?? []).find((e) => e.orderId === order.id);
    if (sent?.status === 'enviado' && !opts.force) return;
    const at = new Date().toISOString();
    // Customer data only goes to the POS once the privacy notice (which names Saipos) can be shown.
    if (!sellerReady(ordering.reservations)) return log(slug, { orderId: order.id, number: order.number, at, status: 'erro', error: 'Preencha os dados do restaurante (razão social, CNPJ, endereço e contato de privacidade) para enviar ao PDV.' });
    if (!saiposReady()) return log(slug, { orderId: order.id, number: order.number, at, status: 'sem-credenciais', error: 'Credenciais de parceiro do Saipos ainda não configuradas.' });
    const res = await fetch(`${API()}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: await token() },
      body: JSON.stringify(toSaiposOrder(order, record.store, pdv)),
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 401) cached = null;
    const body = (await res.json().catch(() => ({}))) as { errorMessage?: string };
    await log(slug, { orderId: order.id, number: order.number, at, status: res.ok ? 'enviado' : 'erro', error: res.ok ? '' : `Saipos ${res.status}${body.errorMessage ? `: ${body.errorMessage}` : ''}`.slice(0, 300) });
  } catch (err) {
    await log(slug, { orderId: order.id, number: order.number, at: new Date().toISOString(), status: 'erro', error: (err instanceof Error ? err.message : 'Falha ao enviar').slice(0, 300) }).catch(() => undefined);
  }
}

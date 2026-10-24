import { z } from 'zod';
import type { Item, Store } from './schema';

/**
 * Online ordering: the store's settings, the order a site sends, and the order as kept.
 * Pure functions only (no storage), so pricing and status rules are unit-tested directly.
 * Money is always integer centavos, and the server prices every order from the published
 * catalogue: a site only says what was picked, never what it costs.
 */

const id = z.string().min(1).max(40);
const text = (max: number) => z.string().trim().max(max);

export const deliveryAreaSchema = z.object({
  id,
  name: text(60).min(1),
  /** Centavos. */
  fee: z.number().int().min(0).max(100_000),
});
export type DeliveryArea = z.infer<typeof deliveryAreaSchema>;

export const PIX_MODES = ['demo', 'mercadopago'] as const;

export const couponSchema = z.object({
  /** What the customer types; stored upper-case. */
  code: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9]{3,20}$/, 'Cupom: 3 a 20 letras ou números, sem espaço.')),
  /** percent / fixed: off the items. frete: the delivery fee is waived (value unused). */
  type: z.enum(['percent', 'fixed', 'frete']),
  /** Percent (1–100) or centavos; 0 for frete. */
  value: z.number().int().min(0).max(1_000_000),
  /** Centavos on the items' subtotal. */
  minOrder: z.number().int().min(0).max(1_000_000),
  active: z.boolean(),
  /** Last day it works (YYYY-MM-DD, São Paulo), or '' for no end. */
  until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')),
}).refine((c) => c.type === 'frete' || c.value >= 1, 'Informe o valor do desconto.');
export type Coupon = z.infer<typeof couponSchema>;

export const orderingSchema = z.object({
  /** Orders go to the panel instead of WhatsApp. */
  enabled: z.boolean(),
  delivery: z.boolean(),
  pickup: z.boolean(),
  /** Neighbourhoods served and their fees. Empty: the store confirms the fee with each order. */
  areas: z.array(deliveryAreaSchema).max(80),
  /** Centavos, on the items' subtotal. */
  minOrder: z.number().int().min(0).max(1_000_000),
  /** Shown to the customer, e.g. "40 a 60 min". */
  eta: text(40),
  pix: z.boolean(),
  card: z.boolean(),
  cash: z.boolean(),
  /** `demo` makes a practice Pix that the tracking page can mark as paid; nothing is charged. */
  pixMode: z.enum(PIX_MODES),
  coupons: z.array(couponSchema).max(50).default([]),
});
export type Ordering = z.infer<typeof orderingSchema>;

export const DEFAULT_ORDERING: Ordering = {
  enabled: false,
  delivery: true,
  pickup: true,
  areas: [],
  minOrder: 0,
  eta: '',
  pix: true,
  card: true,
  cash: true,
  pixMode: 'demo',
  coupons: [],
};

/** Stores saved before online ordering existed have no settings yet. */
export function orderingOf(store: Pick<Store, 'ordering'> | { ordering?: Ordering }): Ordering {
  return { ...DEFAULT_ORDERING, ...(store.ordering ?? {}) };
}

/** The part a public site may see. */
export function publicOrdering(o: Ordering, open: boolean) {
  return {
    enabled: o.enabled,
    open: o.enabled && open,
    delivery: o.delivery,
    pickup: o.pickup,
    areas: o.areas,
    minOrder: o.minOrder,
    eta: o.eta,
    payments: { pix: o.pix, card: o.card, cash: o.cash },
    pixDemo: o.pixMode === 'demo',
    /** Only whether a coupon field is worth showing; the codes stay on the server. */
    coupons: o.coupons.some((c) => c.active),
  };
}

// ───────────────────────────── What a site sends ─────────────────────────────

export const PAYMENT_METHODS = ['pix', 'cartao', 'dinheiro'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const phone = z
  .string()
  .transform((v) => v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, ''))
  .refine((v) => /^\d{10,11}$/.test(v), 'Informe um telefone com DDD.');

export const orderInputSchema = z.object({
  items: z
    .array(
      z.object({
        productId: id,
        quantity: z.number().int().min(1).max(20),
        selections: z.record(id, z.array(id).max(30)).default({}),
        notes: text(140).default(''),
      }),
    )
    .min(1, 'A sacola está vazia.')
    .max(40),
  customer: z.object({
    name: text(60).min(2, 'Informe seu nome.'),
    phone,
    email: z.union([z.literal(''), z.string().trim().email('E-mail inválido.').max(120)]).default(''),
  }),
  mode: z.enum(['entrega', 'retirada']),
  address: z
    .object({
      areaId: text(40).default(''),
      street: text(200).default(''),
      reference: text(120).default(''),
    })
    .default({ areaId: '', street: '', reference: '' }),
  payment: z.enum(PAYMENT_METHODS),
  /** Cash: the note the customer will pay with, so the driver brings change. */
  changeFor: z.number().int().min(0).max(1_000_000).nullable().default(null),
  note: text(200).default(''),
  coupon: text(20).default(''),
  /** The customer ticked "receive promotions on WhatsApp" (never pre-ticked). */
  optIn: z.boolean().default(false),
  /** Honeypot: people never see it, bots fill it. */
  website: z.string().max(0).optional(),
});
export type OrderInput = z.input<typeof orderInputSchema>;
export type ParsedOrderInput = z.output<typeof orderInputSchema>;

// ───────────────────────────── The order as kept ─────────────────────────────

export const ORDER_STATUSES = ['aguardando-pix', 'novo', 'preparo', 'saiu', 'pronto', 'concluido', 'recusado', 'expirado'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  'aguardando-pix': 'Aguardando Pix',
  novo: 'Novo',
  preparo: 'Em preparo',
  saiu: 'Saiu para entrega',
  pronto: 'Pronto para retirada',
  concluido: 'Concluído',
  recusado: 'Recusado',
  expirado: 'Pix expirado',
};

export interface OrderLine {
  productId: string;
  name: string;
  quantity: number;
  /** Item price plus its paid options, per unit. */
  unit: number;
  total: number;
  options: { group: string; label: string; price: number }[];
  notes: string;
}

export interface PixCharge {
  provider: (typeof PIX_MODES)[number];
  /** The provider's payment id (demo: our own). */
  id: string;
  copyPaste: string;
  qrBase64: string;
  expiresAt: string;
}

export interface Order {
  id: string;
  /** Per-day sequence the kitchen calls out: #1, #2… */
  number: number;
  /** SHA-256 of the customer's tracking token; the token itself is only ever in the customer's link. */
  tokenHash: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  history: { status: OrderStatus; at: string; by: string }[];
  customer: { name: string; phone: string; email: string };
  mode: 'entrega' | 'retirada';
  address: { area: string; street: string; reference: string } | null;
  payment: {
    method: PaymentMethod;
    status: 'pendente' | 'pago' | 'na-entrega' | 'devolvido' | 'devolver';
    changeFor: number | null;
    pix: PixCharge | null;
    paidAt: string | null;
  };
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  /** No neighbourhood list: the store confirms the fee by phone. */
  feePending: boolean;
  /** Centavos off the order from a coupon (the items, or the delivery fee for a free-delivery coupon). */
  discount: number;
  coupon: string;
  total: number;
  note: string;
  /** Marketing consent given with this order; the latest order decides. Missing on older orders. */
  optIn?: boolean;
  reason: string;
}

export const PIX_MINUTES = 30;

export class OrderError extends Error {}

function findItem(store: Store, productId: string): Item | undefined {
  for (const c of store.catalog.categories) {
    const item = c.items.find((i) => i.id === productId);
    if (item) return item;
  }
}

/** Add-ons can be listed in their own category so the panel prices them once for every burger (as the sites do). */
function addonItem(store: Store, choiceId: string): Item | undefined {
  return store.catalog.categories.find((c) => c.id === 'adicionais')?.items.find((i) => i.id === choiceId);
}

export interface Priced {
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  feePending: boolean;
  discount: number;
  coupon: string;
  total: number;
  areaName: string;
}

const TZ = 'America/Sao_Paulo';
export const todaySP = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

/** The discount a coupon gives. Throws OrderError when it does not apply. Without `delivery` (a preview), a
 * free-delivery coupon reports `freeDelivery` and the site works out the fee it waives. */
export function applyCoupon(
  o: Ordering,
  code: string,
  subtotal: number,
  today = todaySP(),
  delivery?: { mode: 'entrega' | 'retirada'; fee: number; feePending: boolean },
): { code: string; discount: number; freeDelivery: boolean } {
  const wanted = code.trim().toUpperCase();
  const c = o.coupons.find((x) => x.code === wanted);
  if (!c || !c.active || (c.until && c.until < today)) throw new OrderError('Cupom inválido ou vencido.');
  if (subtotal < c.minOrder) throw new OrderError(`Esse cupom vale para pedidos a partir de ${brl(c.minOrder)}.`);
  if (c.type === 'frete') {
    if (delivery?.mode === 'retirada') throw new OrderError('Esse cupom é de entrega grátis: vale só para entrega.');
    if (delivery?.feePending) throw new OrderError('Esse cupom precisa da taxa do bairro definida. Fale com a loja.');
    return { code: c.code, discount: delivery?.fee ?? 0, freeDelivery: true };
  }
  const discount = c.type === 'percent' ? Math.round((subtotal * Math.min(c.value, 100)) / 100) : Math.min(c.value, subtotal);
  return { code: c.code, discount, freeDelivery: false };
}

/** Prices a parsed order against the published catalogue and the store's ordering rules. Throws OrderError with a message for the customer. */
export function priceOrder(store: Store, input: ParsedOrderInput): Priced {
  const o = orderingOf(store);
  const lines: OrderLine[] = input.items.map((line) => {
    const item = findItem(store, line.productId);
    if (!item || item.price === null) throw new OrderError('Um item da sacola não está mais no cardápio. Atualize a página.');
    if (!item.available) throw new OrderError(`${item.name} está esgotado no momento.`);
    const options: OrderLine['options'] = [];
    for (const group of item.options) {
      const picked = [...new Set(line.selections[group.id] ?? [])];
      if (group.type === 'single' && picked.length > 1) throw new OrderError(`Escolha só uma opção em "${group.name}" (${item.name}).`);
      if (group.required && picked.length === 0) throw new OrderError(`Escolha uma opção em "${group.name}" (${item.name}).`);
      for (const choiceId of picked) {
        const choice = group.choices.find((c) => c.id === choiceId);
        if (!choice) throw new OrderError(`Uma opção de ${item.name} não existe mais. Atualize a página.`);
        const linked = group.id === 'adicionais' ? addonItem(store, choiceId) : undefined;
        if (linked && !linked.available) throw new OrderError(`O adicional ${linked.name} está esgotado.`);
        options.push({ group: group.name, label: linked?.name || choice.label, price: linked?.price ?? choice.priceDelta });
      }
    }
    for (const groupId of Object.keys(line.selections)) {
      if ((line.selections[groupId] ?? []).length && !item.options.some((g) => g.id === groupId)) {
        throw new OrderError(`Uma opção de ${item.name} não existe mais. Atualize a página.`);
      }
    }
    const unit = item.price + options.reduce((s, x) => s + x.price, 0);
    return { productId: item.id, name: item.name, quantity: line.quantity, unit, total: unit * line.quantity, options, notes: line.notes };
  });
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  if (subtotal < o.minOrder) throw new OrderError(`O pedido mínimo é de ${brl(o.minOrder)} (sem a entrega).`);

  let deliveryFee = 0;
  let feePending = false;
  let areaName = '';
  if (input.mode === 'entrega') {
    if (!o.delivery) throw new OrderError('Esta loja não está fazendo entregas agora. Escolha retirar no local.');
    if (input.address.street.length < 5) throw new OrderError('Informe o endereço de entrega (rua, número e bairro).');
    if (o.areas.length) {
      const area = o.areas.find((a) => a.id === input.address.areaId);
      if (!area) throw new OrderError('Escolha o seu bairro para calcular a entrega.');
      deliveryFee = area.fee;
      areaName = area.name;
    } else {
      feePending = true;
    }
  } else if (!o.pickup) {
    throw new OrderError('Esta loja só está fazendo entregas agora.');
  }

  const { code: coupon, discount } = input.coupon
    ? applyCoupon(o, input.coupon, subtotal, todaySP(), { mode: input.mode, fee: deliveryFee, feePending })
    : { code: '', discount: 0 };
  const total = subtotal - discount + deliveryFee;
  const allowed = { pix: o.pix, cartao: o.card, dinheiro: o.cash }[input.payment];
  if (!allowed) throw new OrderError('Essa forma de pagamento não está disponível nesta loja.');
  if (input.payment === 'pix' && feePending) throw new OrderError('Para pagar por Pix, a taxa de entrega precisa estar definida. Escolha pagar na entrega.');
  if (input.payment === 'dinheiro' && input.changeFor !== null && input.changeFor < total) {
    throw new OrderError('O valor para troco precisa ser maior que o total do pedido.');
  }
  return { lines, subtotal, deliveryFee, feePending, discount, coupon, total, areaName };
}

export function brl(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100).replace(/ /g, ' ');
}

// ───────────────────────────── Status rules ─────────────────────────────

export const OPERATOR_ACTIONS = ['aceitar', 'recusar', 'despachar', 'concluir'] as const;
export type OperatorAction = (typeof OPERATOR_ACTIONS)[number];

/** Where an operator action takes an order from its current status, or null when it does not apply. */
export function nextStatus(order: Pick<Order, 'status' | 'mode'>, action: OperatorAction): OrderStatus | null {
  switch (action) {
    case 'aceitar':
      return order.status === 'novo' ? 'preparo' : null;
    case 'despachar':
      return order.status === 'preparo' ? (order.mode === 'entrega' ? 'saiu' : 'pronto') : null;
    case 'concluir':
      return order.status === 'saiu' || order.status === 'pronto' ? 'concluido' : null;
    case 'recusar':
      return ['aguardando-pix', 'novo', 'preparo'].includes(order.status) ? 'recusado' : null;
  }
}

/** An unpaid Pix past its deadline reads as expired even before anyone rewrites it. */
export function effectiveStatus(order: Order, now = Date.now()): OrderStatus {
  if (order.status === 'aguardando-pix' && order.payment.pix && Date.parse(order.payment.pix.expiresAt) < now) return 'expirado';
  return order.status;
}

export const OPEN_STATUSES: OrderStatus[] = ['aguardando-pix', 'novo', 'preparo', 'saiu', 'pronto'];

/** What the customer's tracking page may see: no token hash, no internal ids. */
export function publicOrder(order: Order, now = Date.now()) {
  const status = effectiveStatus(order, now);
  return {
    id: order.id,
    number: order.number,
    createdAt: order.createdAt,
    status,
    statusLabel: STATUS_LABEL[status],
    history: order.history.map((h) => ({ status: h.status, at: h.at })),
    mode: order.mode,
    address: order.address,
    customerName: order.customer.name,
    payment: {
      method: order.payment.method,
      status: order.payment.status,
      changeFor: order.payment.changeFor,
      paidAt: order.payment.paidAt,
      pix:
        order.payment.pix && status === 'aguardando-pix'
          ? { copyPaste: order.payment.pix.copyPaste, qrBase64: order.payment.pix.qrBase64, expiresAt: order.payment.pix.expiresAt, demo: order.payment.pix.provider === 'demo' }
          : null,
    },
    lines: order.lines,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    feePending: order.feePending,
    discount: order.discount ?? 0,
    coupon: order.coupon ?? '',
    total: order.total,
    note: order.note,
    reason: status === 'recusado' ? order.reason : '',
  };
}
export type PublicOrder = ReturnType<typeof publicOrder>;

/** Items the store marked sold out during service (no publish needed) apply on top of the published catalogue. */
export function withSoldOut<T extends Store>(store: T, soldOut: readonly string[]): T {
  if (!soldOut.length) return store;
  const out = new Set(soldOut);
  return {
    ...store,
    catalog: {
      categories: store.catalog.categories.map((c) => ({ ...c, items: c.items.map((i) => (out.has(i.id) ? { ...i, available: false } : i)) })),
    },
  };
}

/** Accepted by the store: these count as sales. */
export const SOLD_STATUSES: OrderStatus[] = ['preparo', 'saiu', 'pronto', 'concluido'];

interface Tally {
  orders: number;
  revenue: number;
}
const tally = (): Tally => ({ orders: 0, revenue: 0 });

export interface SalesReport {
  days: (Tally & { day: string })[];
  orders: number;
  revenue: number;
  average: number;
  discounts: number;
  deliveryFees: number;
  byPayment: Record<PaymentMethod, Tally>;
  byMode: Record<Order['mode'], Tally>;
  /** Orders per hour of the day (São Paulo), 0–23. */
  byHour: number[];
  topItems: { name: string; quantity: number; revenue: number }[];
  coupons: { code: string; orders: number; discount: number }[];
  customers: number;
  returning: number;
  refused: number;
  /** Pix never paid. */
  abandoned: number;
}

const hourSP = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' });

/** Sales over the given days (oldest first), from each day's order document. */
export function salesReport(days: { day: string; orders: Order[] }[], now = Date.now()): SalesReport {
  const r: SalesReport = {
    days: [],
    orders: 0,
    revenue: 0,
    average: 0,
    discounts: 0,
    deliveryFees: 0,
    byPayment: { pix: tally(), cartao: tally(), dinheiro: tally() },
    byMode: { entrega: tally(), retirada: tally() },
    byHour: Array.from({ length: 24 }, () => 0),
    topItems: [],
    coupons: [],
    customers: 0,
    returning: 0,
    refused: 0,
    abandoned: 0,
  };
  const items = new Map<string, { name: string; quantity: number; revenue: number }>();
  const coupons = new Map<string, { code: string; orders: number; discount: number }>();
  const phones = new Map<string, number>();
  for (const { day, orders } of days) {
    const d = { day, ...tally() };
    for (const o of orders) {
      const status = effectiveStatus(o, now);
      if (status === 'recusado') r.refused++;
      if (status === 'expirado') r.abandoned++;
      if (!SOLD_STATUSES.includes(status)) continue;
      d.orders++;
      d.revenue += o.total;
      r.discounts += o.discount ?? 0;
      r.deliveryFees += o.deliveryFee;
      r.byPayment[o.payment.method].orders++;
      r.byPayment[o.payment.method].revenue += o.total;
      r.byMode[o.mode].orders++;
      r.byMode[o.mode].revenue += o.total;
      r.byHour[Number(hourSP.format(new Date(o.createdAt))) % 24]++;
      phones.set(o.customer.phone, (phones.get(o.customer.phone) ?? 0) + 1);
      for (const l of o.lines) {
        const it = items.get(l.productId) ?? { name: l.name, quantity: 0, revenue: 0 };
        it.quantity += l.quantity;
        it.revenue += l.total;
        items.set(l.productId, it);
      }
      if (o.coupon) {
        const c = coupons.get(o.coupon) ?? { code: o.coupon, orders: 0, discount: 0 };
        c.orders++;
        c.discount += o.discount ?? 0;
        coupons.set(o.coupon, c);
      }
    }
    r.days.push(d);
    r.orders += d.orders;
    r.revenue += d.revenue;
  }
  r.average = r.orders ? Math.round(r.revenue / r.orders) : 0;
  r.topItems = [...items.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue).slice(0, 10);
  r.coupons = [...coupons.values()].sort((a, b) => b.orders - a.orders);
  r.customers = phones.size;
  r.returning = [...phones.values()].filter((n) => n > 1).length;
  return r;
}

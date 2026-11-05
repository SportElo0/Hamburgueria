import 'server-only';
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { storage, ConflictError } from './storage';
import { getDraft, getPublished } from './stores';
import { monthKey } from './changes';
import type { Store } from './schema';
import { count, hourWindow, record, take } from './limits';
import { OrderError, contaDaMesa, orderingOf, type ContaConfig, type Order, type PaymentMethod, type PixCharge } from './ordering';
import { ordersOfDays, placeStaffTableOrder, placeTableOrder, priceStaffOrder, tableDays, tableOrders, updateTableOrders } from './orders';

/**
 * Ordering at the table. Each table has a QR code with a secret key (the link alone is not guessable).
 * The first phone that opens a table starts a SEATING and gets a 4-digit code to show the others at the
 * table; a phone joins only with that code. The waiter confirms the seating's first order before the
 * kitchen sees it, so a photo of the QR taken home cannot send food to an empty table. Closing the bill
 * ends the seating: its code and every phone's access stop working.
 *
 * Layout in storage:
 *   mesas/<slug>/abertas.json   the open seatings ({ [table number]: Seating })
 *   mesas/<slug>/historico/<YYYY-MM>.json   one SeatingRecord per closed bill (time at the table, drinks, ticket)
 */

export interface Seating {
  id: string;
  number: number;
  /** Shown to the people at the table (and to the waiter, who can repeat it). */
  code: string;
  openedAt: string;
  /** The waiter saw someone at the table: later orders go straight to the kitchen. */
  confirmed: boolean;
  /** SHA-256 of each joined phone's token (the token itself only lives in that phone's cookie). */
  devices: string[];
  /** Waiting calls: the waiter, or the bill. */
  calls: { kind: CallKind; at: string }[];
  /** How many people sat down, when the waiter said so. */
  people?: number | null;
  /** The booking this table is holding, and the deposit already paid for it (centavos, deducted from the bill). */
  reservationId?: string;
  credit?: number;
  /** Pix payments made from the phones at the table (see mesa-pagamento.ts). */
  payments?: TablePayment[];
  /** The waiter took the service charge off this table's bill (it is optional for the customer). */
  semServico?: boolean;
}

export interface TablePayment {
  id: string;
  amount: number;
  /** `amount` is what counts toward the bill; `charged` what the Pix was for, when part of it went back. */
  status: 'aguardando' | 'pago' | 'devolvido';
  charged?: number;
  /** Money given back (the bill was already covered, or less than asked was paid). */
  refund?: { amount: number; status: 'pendente' | 'feito' | 'falhou' };
  pix: PixCharge;
  createdAt: string;
  paidAt: string | null;
  checkedAt?: string;
}

/** What is kept of a closed bill, for the time-at-table analysis. No customer data. */
export interface SeatingRecord {
  id: string;
  number: number;
  openedAt: string;
  closedAt: string;
  minutes: number;
  people: number | null;
  orders: number;
  /** Centavos, the bill without the deposit taken off. */
  total: number;
  /** Units of items from the drink categories. */
  drinks: number;
  credit: number;
  reserved: boolean;
  /** Service and cover charges on the bill (centavos), on top of `total`. */
  servico?: number;
  couvert?: number;
}

const historyKey = (slug: string, month: string) => `mesas/${slug}/historico/${month}.json`;
const DRINK_NAME = /bebida|drink|chop|cerveja|vinho|coquetel|caipirinha|suco|refri|soda|dose|bar/i;

export type CallKind = 'garcom' | 'conta';
type Doc = { seatings: Record<string, Seating> };

const docKey = (slug: string) => `mesas/${slug}/abertas.json`;
const MAX_DEVICES = 12;
/** Wrong codes per phone address per table per hour, so 10 000 codes cannot be tried. */
const MAX_CODE_TRIES = 8;
/** Wrong codes per table per hour from any address: many addresses together still cannot try them all. */
const MAX_CODE_TRIES_PER_TABLE = 50;
/** A table opened and never confirmed by the waiter frees itself after this long. */
const STALE_UNCONFIRMED_MS = 60 * 60_000;

export class TableError extends Error {}

/** What is kept of a phone's token: its hash, never the token. */
const hashDevice = (token: string) => createHmac('sha256', 'mesa-aparelho').update(token).digest('hex');

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET ausente ou curto (mínimo 32 caracteres).');
  return 'segredo-local-so-para-desenvolvimento';
}

/** The key printed in a table's QR. Without it the table page does not open. */
export function tableKey(slug: string, number: number) {
  return createHmac('sha256', secret()).update(`mesa:${slug}:${number}`).digest('base64url').slice(0, 16);
}

export function validKey(slug: string, number: number, key: string) {
  const want = Buffer.from(tableKey(slug, number));
  const got = Buffer.from(String(key ?? ''));
  return got.length === want.length && timingSafeEqual(got, want);
}

export const tablePath = (slug: string, number: number) => `/mesa/${slug}/${number}?k=${tableKey(slug, number)}`;

/** Cookie that holds this phone's token for one table. */
export const deviceCookie = (slug: string, number: number) => `mesa-${slug}-${number}`;

export async function readDoc(slug: string) {
  const doc = await storage().readJSON<Doc>(docKey(slug));
  return { data: doc?.data ?? { seatings: {} }, etag: doc ? doc.etag : null };
}

/** Read-modify-write of the open seatings, retried when two phones (or a phone and the waiter) write together. */
export async function change<R>(slug: string, fn: (doc: Doc) => R): Promise<R> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, etag } = await readDoc(slug);
    const copy: Doc = structuredClone(data);
    const result = fn(copy);
    try {
      await storage().writeJSON(docKey(slug), copy, etag);
      return result;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 5) throw err;
    }
  }
  throw new ConflictError();
}

export async function openSeatings(slug: string): Promise<Seating[]> {
  return Object.values((await readDoc(slug)).data.seatings).sort((a, b) => a.number - b.number);
}

export async function tableSettings(slug: string, number: number) {
  const record = await getPublished(slug);
  if (!record) throw new TableError('Restaurante não encontrado.');
  const ordering = orderingOf(record.store);
  if (!ordering.enabled || !ordering.tables.enabled) throw new TableError('Este restaurante não está recebendo pedidos pela mesa.');
  if (!Number.isInteger(number) || number < 1 || number > ordering.tables.count) throw new TableError('Mesa não encontrada.');
  return record.store;
}

/**
 * The staff (waiter or owner) opens a table by hand: only the table must exist. It works without the QR
 * ordering on, so a restaurant can follow its floor before it takes orders by phone. Phones still go through
 * tableSettings.
 */
async function staffTableSettings(slug: string, number: number) {
  const store = (await getPublished(slug))?.store ?? (await getDraft(slug))?.data.store;
  if (!store) throw new TableError('Restaurante não encontrado.');
  if (!Number.isInteger(number) || number < 1 || number > orderingOf(store).tables.count) throw new TableError('Mesa não encontrada.');
}

const newToken = () => randomBytes(24).toString('base64url');
export const isMember = (s: Seating | undefined, token: string | undefined) => Boolean(s && token && s.devices.includes(hashDevice(token)));

/**
 * What one phone at the table sees, polled every few seconds: so it reads only the seatings and, for a
 * phone in the seating, the order days (the route checked the table's key; writes check the settings).
 */
export async function tableState(slug: string, number: number, token: string | undefined, now = new Date()) {
  const seating = (await readDoc(slug)).data.seatings[number];
  if (!seating || !isMember(seating, token)) return { open: Boolean(seating), member: false as const };
  const [orders, conta] = await Promise.all([tableOrders(slug, seating.id, now), contaConfig(slug)]);
  const bill = billOf(seating, orders, conta);
  return {
    open: true,
    member: true as const,
    code: seating.code,
    confirmed: seating.confirmed,
    phones: seating.devices.length,
    calls: seating.calls.map((c) => c.kind),
    orders: orders.map(publicTableOrder),
    total: bill.total,
    conta: bill,
    servicoPct: conta.servico,
    couvertPessoa: conta.couvert,
    credit: seating.credit ?? 0,
    paid: paidOf(seating),
    due: dueOf(seating, orders, conta),
    payments: (seating.payments ?? [])
      .filter((p) => p.status !== 'aguardando' || Date.parse(p.pix.expiresAt) > now.getTime())
      .map((p) => ({ id: p.id, amount: p.amount, status: p.status, refund: p.refund ?? null, pix: p.status === 'aguardando' ? { copyPaste: p.pix.copyPaste, qrBase64: p.pix.qrBase64, expiresAt: p.pix.expiresAt, demo: p.pix.provider === 'demo' } : null })),
  };
}

/** Paid by Pix from the table's phones so far (centavos). */
export const paidOf = (s: Seating) => (s.payments ?? []).filter((p) => p.status === 'pago').reduce((n, p) => n + p.amount, 0);
/** The whole bill of a seating: items, service charge and cover charge. */
export const billOf = (s: Seating, orders: Order[], conta: ContaConfig) => contaDaMesa(billTotal(orders), { conta, pessoas: s.people, semServico: s.semServico });
/** What is left to pay: the whole bill, minus the booking deposit, minus Pix already paid. */
export const dueOf = (s: Seating, orders: Order[], conta: ContaConfig) => Math.max(0, billOf(s, orders, conta).total - (s.credit ?? 0) - paidOf(s));

/** The store's service and cover charge settings (the published menu, or the draft before it goes live). */
export async function contaConfig(slug: string): Promise<ContaConfig> {
  const store = (await getPublished(slug))?.store ?? (await getDraft(slug))?.data.store;
  return store ? orderingOf(store).conta : { servico: 0, couvert: 0 };
}

/** The waiter takes the service charge off a table's bill, or puts it back. */
export async function setServico(slug: string, number: number, cobrar: boolean) {
  await change(slug, (doc) => {
    const s = doc.seatings[number];
    if (!s) throw new TableError('Essa mesa já foi fechada.');
    if (cobrar) delete s.semServico;
    else s.semServico = true;
  });
}
export type TableState = Awaited<ReturnType<typeof tableState>>;

/** A seating's bill: every order the kitchen did not refuse. */
export const billTotal = (orders: Order[]) => orders.filter((o) => o.status !== 'recusado').reduce((sum, o) => sum + o.total, 0);

/** What the table may see of an order: no ids of other systems, no history. */
export function publicTableOrder(o: Order) {
  return { id: o.id, number: o.number, createdAt: o.createdAt, status: o.status, reason: o.status === 'recusado' ? o.reason : '', lines: o.lines, total: o.total };
}

/** First phone at a free table: starts the seating. Returns the phone's token (for its cookie). */
export async function openTable(slug: string, number: number, ip: string, now = new Date()) {
  await tableSettings(slug, number);
  if (ip && !(await take(`mesa-abrir-${slug}`, ip, 20, hourWindow(now)))) throw new TableError('Muitas tentativas. Chame o garçom.');
  // Opened and abandoned (e.g. from a photo of the QR) without the waiter ever confirming it: free it.
  const old = (await readDoc(slug)).data.seatings[number];
  if (old && !old.confirmed && now.getTime() - Date.parse(old.openedAt) > STALE_UNCONFIRMED_MS) {
    await dismissTable(slug, number, 'sistema').catch(() => undefined);
  }
  const token = newToken();
  await change(slug, (doc) => {
    if (doc.seatings[number]) throw new TableError('Esta mesa já foi aberta por alguém. Peça o código para quem abriu, ou chame o garçom.');
    doc.seatings[number] = {
      id: `${now.getTime().toString(36)}${randomBytes(4).toString('hex')}`,
      number,
      code: String(randomInt(0, 10_000)).padStart(4, '0'),
      openedAt: now.toISOString(),
      confirmed: false,
      devices: [hashDevice(token)],
      calls: [],
    };
  });
  return token;
}

/** Another phone at the table, with the code the first one shows. */
export async function joinTable(slug: string, number: number, code: string, ip: string, now = new Date()) {
  await tableSettings(slug, number);
  const window = hourWindow(now);
  if (
    (await count(`mesa-codigo-mesa-${slug}`, String(number), window)) >= MAX_CODE_TRIES_PER_TABLE ||
    !(await take(`mesa-codigo-${slug}`, `${ip || 'sem-ip'}:${number}`, MAX_CODE_TRIES, window))
  ) {
    throw new TableError('Muitas tentativas de código. Chame o garçom.');
  }
  const token = newToken();
  let wrong = false;
  await change(slug, (doc) => {
    const s = doc.seatings[number];
    if (!s) throw new TableError('Esta mesa ainda não foi aberta. Toque em "Abrir a mesa".');
    const typed = String(code ?? '').replace(/\D/g, '');
    if (typed.length !== 4 || !timingSafeEqual(Buffer.from(typed), Buffer.from(s.code))) {
      wrong = true;
      throw new TableError('Código errado. Confira no celular de quem abriu a mesa.');
    }
    if (s.devices.length >= MAX_DEVICES) throw new TableError('Esta mesa já tem celulares demais. Chame o garçom.');
    s.devices.push(hashDevice(token));
  }).catch(async (err) => {
    if (wrong) await record(`mesa-codigo-mesa-${slug}`, String(number), window);
    throw err;
  });
  return token;
}

async function memberSeating(slug: string, number: number, token: string | undefined) {
  const seating = (await readDoc(slug)).data.seatings[number];
  if (!seating || !isMember(seating, token)) throw new TableError('Este celular não está na mesa. Abra a mesa ou digite o código.');
  return seating;
}

/** An order from a phone at the table. */
export async function orderAtTable(slug: string, number: number, token: string | undefined, raw: unknown, now = new Date()) {
  await tableSettings(slug, number);
  const seating = await memberSeating(slug, number, token);
  try {
    return await placeTableOrder(slug, { number, session: seating.id, confirmed: seating.confirmed }, raw, hashDevice(token!), now);
  } catch (err) {
    if (err instanceof OrderError) throw new TableError(err.message);
    throw err;
  }
}

/** Call the waiter or ask for the bill. A call already waiting is not repeated. */
export async function callFromTable(slug: string, number: number, token: string | undefined, kind: CallKind, now = new Date()) {
  await tableSettings(slug, number);
  await memberSeating(slug, number, token);
  await change(slug, (doc) => {
    const s = doc.seatings[number];
    if (!s) throw new TableError('A mesa foi fechada.');
    if (!s.calls.some((c) => c.kind === kind)) s.calls.push({ kind, at: now.toISOString() });
  });
}

// ───────────────────────────── The waiter ─────────────────────────────

/** Every open seating with its orders, for the waiter's floor screen. */
export async function floor(slug: string, now = new Date()) {
  const [seatings, days, conta] = await Promise.all([openSeatings(slug), ordersOfDays(slug, tableDays(now)), contaConfig(slug)]);
  const all = days.flatMap((d) => d.orders);
  return seatings.map((s) => {
    const orders = all.filter((o) => o.table?.session === s.id);
    const bill = billOf(s, orders, conta);
    return { ...s, devices: s.devices.length, orders, total: bill.total, conta: bill, servicoPct: conta.servico };
  });
}
export type FloorTable = Awaited<ReturnType<typeof floor>>[number];

/** The waiter saw people at the table: its waiting orders go to the kitchen, and later ones go straight. */
export async function confirmTable(slug: string, number: number, by: string) {
  const seating = await change(slug, (doc) => {
    const s = doc.seatings[number];
    if (!s) throw new TableError('Essa mesa já foi fechada.');
    s.confirmed = true;
    return s;
  });
  const at = new Date().toISOString();
  await updateTableOrders(slug, seating.id, (o) =>
    o.status === 'aguardando-garcom' ? { ...o, status: 'novo', history: [...o.history, { status: 'novo', at, by }] } : null,
  );
}

/** Nobody at the table (a QR photo used from outside): refuse what it sent and end the seating. */
export async function dismissTable(slug: string, number: number, by: string) {
  const seating = await change(slug, (doc) => {
    const s = doc.seatings[number];
    if (!s) throw new TableError('Essa mesa já foi fechada.');
    if (s.confirmed) throw new TableError('Essa mesa já foi confirmada. Para encerrar, feche a conta.');
    delete doc.seatings[number];
    return s;
  });
  const at = new Date().toISOString();
  await updateTableOrders(slug, seating.id, (o) =>
    o.status === 'aguardando-garcom'
      ? { ...o, status: 'recusado', reason: 'Mesa sem ninguém', history: [...o.history, { status: 'recusado', at, by }] }
      : null,
  );
}

/** The waiter answered a call. */
export async function answerCall(slug: string, number: number, kind: CallKind) {
  await change(slug, (doc) => {
    const s = doc.seatings[number];
    if (s) s.calls = s.calls.filter((c) => c.kind !== kind);
  });
}

/**
 * The bill is paid: every order of the seating is marked paid the way it was paid (that is what the
 * sales report and the margins use), food already taken to the table counts as delivered, and the
 * seating ends, so its code and phones stop working.
 */
export async function closeTable(slug: string, number: number, method: PaymentMethod, by: string, now = new Date(), session?: string): Promise<Seating> {
  const seating = await change(slug, (doc) => {
    const s = doc.seatings[number];
    if (!s) throw new TableError('Essa mesa já foi fechada.');
    // Closing on behalf of a payment: only that seating, never a group that sat down after it.
    if (session && s.id !== session) throw new TableError('A mesa já é de outro grupo.');
    if (!s.confirmed) throw new TableError('Confirme a mesa antes de fechar a conta.');
    delete doc.seatings[number];
    return s;
  });
  const at = now.toISOString();
  const closed = await updateTableOrders(slug, seating.id, (o) => {
    if (o.status === 'recusado') return null;
    const delivered = o.status === 'pronto';
    return {
      ...o,
      status: delivered ? 'concluido' : o.status,
      history: delivered ? [...o.history, { status: 'concluido', at, by }] : o.history,
      payment: { ...o.payment, method, status: 'pago', paidAt: at },
    };
  });
  await recordSeating(slug, seating, closed, now).catch((err) => console.error('historico da mesa', err));
  return seating;
}

/** Which categories count as drinks: the ones the team picked, or the ones whose name says so. */
export function drinkCategoryIds(store: Store): Set<string> {
  const picked = orderingOf(store).salao.drinkCategories;
  const cats = store.catalog.categories;
  return new Set(picked.length ? picked : cats.filter((c) => DRINK_NAME.test(c.name)).map((c) => c.id));
}

/** Keeps a closed bill's numbers (never who sat there) for the analysis of time at the table. */
async function recordSeating(slug: string, seating: Seating, orders: Order[], now: Date) {
  const record = await getPublished(slug);
  const conta = await contaConfig(slug);
  const drinkCats = record ? drinkCategoryIds(record.store) : new Set<string>();
  const categoryOf = new Map<string, string>();
  for (const c of record?.store.catalog.categories ?? []) for (const i of c.items) categoryOf.set(i.id, c.id);
  const kept = orders.filter((o) => o.status !== 'recusado');
  const entry: SeatingRecord = {
    id: seating.id,
    number: seating.number,
    openedAt: seating.openedAt,
    closedAt: now.toISOString(),
    minutes: Math.max(0, Math.round((now.getTime() - Date.parse(seating.openedAt)) / 60_000)),
    people: seating.people ?? null,
    orders: kept.length,
    total: billTotal(kept),
    drinks: kept.flatMap((o) => o.lines).reduce((n, l) => n + (drinkCats.has(categoryOf.get(l.productId) ?? '') ? l.quantity : 0), 0),
    credit: seating.credit ?? 0,
    reserved: Boolean(seating.reservationId),
    ...(() => {
      const b = billOf(seating, kept, conta);
      return b.servico || b.couvert ? { servico: b.servico, couvert: b.couvert } : {};
    })(),
  };
  const key = historyKey(slug, monthKey(now));
  for (let attempt = 0; attempt < 5; attempt++) {
    const doc = await storage().readJSON<SeatingRecord[]>(key);
    const list = doc?.data ?? [];
    if (list.some((r) => r.id === entry.id)) return;
    try {
      await storage().writeJSON(key, [...list, entry], doc ? doc.etag : null);
      return;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 4) throw err;
    }
  }
}

/** Closed bills of the last `days` days (by month files), newest last. */
export async function seatingHistory(slug: string, days: number, now = new Date()): Promise<SeatingRecord[]> {
  const since = now.getTime() - days * 86_400_000;
  const months = new Set<string>();
  for (let t = since; t <= now.getTime() + 86_400_000; t += 86_400_000) months.add(monthKey(new Date(t)));
  const docs = await Promise.all([...months].map((m) => storage().readJSON<SeatingRecord[]>(historyKey(slug, m))));
  return docs.flatMap((d) => d?.data ?? []).filter((r) => Date.parse(r.closedAt) >= since).sort((a, b) => a.closedAt.localeCompare(b.closedAt));
}

/**
 * The waiter seats people at a table (with or without the QR): opens the seating already confirmed, or,
 * if a phone opened it first, just notes the people and the booking. The table code still works for phones.
 */
export async function seatTable(
  slug: string,
  number: number,
  input: { people: number | null; reservationId?: string; credit?: number },
  now = new Date(),
): Promise<Seating> {
  await staffTableSettings(slug, number);
  if (input.people !== null && (!Number.isInteger(input.people) || input.people < 1 || input.people > 40)) throw new TableError('Número de pessoas inválido.');
  return change(slug, (doc) => {
    const current = doc.seatings[number];
    if (current) {
      if (input.reservationId && current.reservationId && current.reservationId !== input.reservationId) throw new TableError('Essa mesa já está com outra reserva.');
      current.confirmed = true;
      if (input.people !== null) current.people = input.people;
      if (input.reservationId) {
        current.reservationId = input.reservationId;
        current.credit = input.credit ?? 0;
      }
      return current;
    }
    const s: Seating = {
      id: `${now.getTime().toString(36)}${randomBytes(4).toString('hex')}`,
      number,
      code: String(randomInt(0, 10_000)).padStart(4, '0'),
      openedAt: now.toISOString(),
      confirmed: true,
      devices: [],
      calls: [],
      people: input.people,
      ...(input.reservationId ? { reservationId: input.reservationId, credit: input.credit ?? 0 } : {}),
    };
    doc.seatings[number] = s;
    return s;
  });
}

/**
 * The waiter (or the owner) orders for a table from the staff screen. A free table is opened (as if the waiter
 * seated people) and a table opened by a phone is confirmed, so the order goes straight to the kitchen.
 */
export async function orderByStaff(slug: string, number: number, raw: unknown, by: string, now = new Date()) {
  // A wrong order (sold out, price changed, empty) must not leave a free table open.
  await priceStaffOrder(slug, raw);
  let seating = (await readDoc(slug)).data.seatings[number];
  if (!seating) seating = await seatTable(slug, number, { people: null }, now);
  else if (!seating.confirmed) await confirmTable(slug, number, by);
  return placeStaffTableOrder(slug, { number, session: seating.id }, raw, by, now);
}

/**
 * The staff frees a table from the map: an unconfirmed one is dismissed, a seated one with nothing ordered by
 * QR is closed (the time still goes into the analysis). A table with QR orders must be closed in the floor screen,
 * where the payment is chosen.
 */
export async function freeTable(slug: string, number: number, by: string, now = new Date()) {
  const t = (await floor(slug, now)).find((x) => x.number === number);
  if (!t) throw new TableError('Essa mesa já está livre.');
  if (!t.confirmed) return dismissTable(slug, number, by);
  if (t.orders.some((o) => o.status !== 'recusado')) throw new TableError('Essa mesa tem pedidos pelo QR: feche a conta na tela do salão.');
  await closeTable(slug, number, 'dinheiro', by, now);
}

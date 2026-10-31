import 'server-only';
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { storage, ConflictError } from './storage';
import { getPublished } from './stores';
import { count, hourWindow, record, take } from './limits';
import { OrderError, orderingOf, type Order, type PaymentMethod } from './ordering';
import { ordersOfDays, placeTableOrder, tableDays, tableOrders, updateTableOrders } from './orders';

/**
 * Ordering at the table. Each table has a QR code with a secret key (the link alone is not guessable).
 * The first phone that opens a table starts a SEATING and gets a 4-digit code to show the others at the
 * table; a phone joins only with that code. The waiter confirms the seating's first order before the
 * kitchen sees it, so a photo of the QR taken home cannot send food to an empty table. Closing the bill
 * ends the seating: its code and every phone's access stop working.
 *
 * Layout in storage:
 *   mesas/<slug>/abertas.json   the open seatings ({ [table number]: Seating })
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
}

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

async function readDoc(slug: string) {
  const doc = await storage().readJSON<Doc>(docKey(slug));
  return { data: doc?.data ?? { seatings: {} }, etag: doc ? doc.etag : null };
}

/** Read-modify-write of the open seatings, retried when two phones (or a phone and the waiter) write together. */
async function change<R>(slug: string, fn: (doc: Doc) => R): Promise<R> {
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

async function tableSettings(slug: string, number: number) {
  const record = await getPublished(slug);
  if (!record) throw new TableError('Restaurante não encontrado.');
  const ordering = orderingOf(record.store);
  if (!ordering.enabled || !ordering.tables.enabled) throw new TableError('Este restaurante não está recebendo pedidos pela mesa.');
  if (!Number.isInteger(number) || number < 1 || number > ordering.tables.count) throw new TableError('Mesa não encontrada.');
  return record.store;
}

const newToken = () => randomBytes(24).toString('base64url');
const isMember = (s: Seating | undefined, token: string | undefined) => Boolean(s && token && s.devices.includes(hashDevice(token)));

/**
 * What one phone at the table sees, polled every few seconds: so it reads only the seatings and, for a
 * phone in the seating, the order days (the route checked the table's key; writes check the settings).
 */
export async function tableState(slug: string, number: number, token: string | undefined, now = new Date()) {
  const seating = (await readDoc(slug)).data.seatings[number];
  if (!seating || !isMember(seating, token)) return { open: Boolean(seating), member: false as const };
  const orders = await tableOrders(slug, seating.id, now);
  return {
    open: true,
    member: true as const,
    code: seating.code,
    confirmed: seating.confirmed,
    phones: seating.devices.length,
    calls: seating.calls.map((c) => c.kind),
    orders: orders.map(publicTableOrder),
    total: billTotal(orders),
  };
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
  const [seatings, days] = await Promise.all([openSeatings(slug), ordersOfDays(slug, tableDays(now))]);
  const all = days.flatMap((d) => d.orders);
  return seatings.map((s) => {
    const orders = all.filter((o) => o.table?.session === s.id);
    return { ...s, devices: s.devices.length, orders, total: billTotal(orders) };
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
export async function closeTable(slug: string, number: number, method: PaymentMethod, by: string) {
  const seating = await change(slug, (doc) => {
    const s = doc.seatings[number];
    if (!s) throw new TableError('Essa mesa já foi fechada.');
    if (!s.confirmed) throw new TableError('Confirme a mesa antes de fechar a conta.');
    delete doc.seatings[number];
    return s;
  });
  const at = new Date().toISOString();
  await updateTableOrders(slug, seating.id, (o) => {
    if (o.status === 'recusado') return null;
    const delivered = o.status === 'pronto';
    return {
      ...o,
      status: delivered ? 'concluido' : o.status,
      history: delivered ? [...o.history, { status: 'concluido', at, by }] : o.history,
      payment: { ...o.payment, method, status: 'pago', paidAt: at },
    };
  });
}

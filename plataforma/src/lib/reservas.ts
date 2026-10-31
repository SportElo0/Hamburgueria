import 'server-only';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { storage, ConflictError } from './storage';
import { getPublished } from './stores';
import { take } from './limits';
import { cancelCharge, createCharge, checkCharge, lookupMercadoPago, PixError, refundCharge, type PaymentCheck } from './pix';
import { PIX_MINUTES, orderingOf, sellerReady, type PixCharge, type ReservationSettings } from './ordering';

/**
 * Booking a table from the site. To hold the table the customer pays a deposit by Pix (per person, set
 * by the store); it is deducted from the bill on the day. The rules are shown before paying and kept on
 * the booking: cancelled early enough → full refund; late cancel or no-show after the tolerance → the
 * deposit stays with the restaurant. The restaurant can always cancel and refund.
 *
 * Layout in storage:
 *   reservas/<slug>/<YYYY-MM-DD>.json   that day's bookings (Reservation[])
 */

export { RESERVATION_LABEL, RESERVATION_STATUSES, type ReservationStatus } from './reservas-labels';
import { RESERVATION_LABEL, type ReservationStatus } from './reservas-labels';

export interface Reservation {
  id: string;
  tokenHash: string;
  date: string;
  time: string;
  people: number;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  status: ReservationStatus;
  /** Centavos asked as deposit (0 = free booking). */
  deposit: number;
  pix: PixCharge | null;
  paidAt: string | null;
  /** Deposit given back (customer cancelled in time, or the restaurant cancelled). */
  refunded: boolean;
  table: number | null;
  /** The rules the customer accepted, as numbers, so a later settings change doesn't rewrite them. */
  rules: { cancelHours: number; toleranceMinutes: number; depositPerPerson?: number; withdrawalDays?: number; version?: string };
  /** When the customer ticked "li e aceito". */
  acceptedAt?: string;
  history: { status: ReservationStatus; at: string; by: string }[];
}

export class ReservationError extends Error {}

const TZ = 'America/Sao_Paulo';
const RES_ID = /^r(\d{4})(\d{2})(\d{2})-[a-z0-9]{10}$/;
const dayKey = (slug: string, date: string) => `reservas/${slug}/${date}.json`;
const dayOf = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
/** Brazil has had no daylight saving since 2019: São Paulo is UTC−3 all year. */
export const startOf = (r: Pick<Reservation, 'date' | 'time'>) => new Date(`${r.date}T${r.time}:00-03:00`);
const MAX_PER_SENDER = 5;
/** All bookings a store takes from the site in a day, whoever sends them. */
const MAX_PER_STORE_DAY = 80;

/** IPv6 addresses change inside a /64: count the network, not the address. */
const senderOf = (ip: string) => (ip.includes(':') ? ip.split(':').slice(0, 4).join(':') : ip);
/** Online bookings close this long before the time (the floor has to know in advance). */
const LEAD_MINUTES = 60;
/** Booked online = contract made away from the premises (CDC art. 49): 7 days to withdraw with a full refund, while the time hasn't come. */
export const WITHDRAWAL_DAYS = 7;
/** Bump when the wording of the rules shown before paying changes (kept on each booking). */
export const RULES_VERSION = '2026-10-31';

function random(chars: number) {
  const bytes = randomBytes(chars);
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

/** An unpaid Pix expires: the slot is free again. */
export function effectiveStatus(r: Reservation, now = new Date()): ReservationStatus {
  if (r.status === 'aguardando-pix' && r.pix && now.getTime() > Date.parse(r.pix.expiresAt)) return 'expirada';
  return r.status;
}
const HOLDS_SLOT: ReservationStatus[] = ['aguardando-pix', 'confirmada', 'chegou'];

// ───────────────────────────── Slots ─────────────────────────────

const minutesOf = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
const hhmmOf = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** The days a customer can pick (today included), in the store's settings. */
export function bookableDays(s: ReservationSettings, now = new Date()): string[] {
  const out: string[] = [];
  for (let i = 0; i <= s.daysAhead; i++) {
    const date = dayOf(new Date(now.getTime() + i * 86_400_000));
    const weekday = new Date(`${date}T12:00:00-03:00`).getUTCDay();
    if (s.days.includes(weekday) && slotTimes(s, date, now).length) out.push(date);
  }
  return out;
}

/** The times of a day that can still be booked online. */
export function slotTimes(s: ReservationSettings, date: string, now = new Date()): string[] {
  const out: string[] = [];
  const end = minutesOf(s.to) >= minutesOf(s.from) ? minutesOf(s.to) : minutesOf(s.to) + 24 * 60;
  for (let m = minutesOf(s.from); m <= end && m < 24 * 60; m += s.slotMinutes) {
    const time = hhmmOf(m);
    if (startOf({ date, time }).getTime() - now.getTime() >= LEAD_MINUTES * 60_000) out.push(time);
  }
  return out;
}

async function settingsOf(slug: string) {
  const record = await getPublished(slug);
  if (!record) throw new ReservationError('Restaurante não encontrado.');
  const ordering = orderingOf(record.store);
  if (!ordering.enabled || !ordering.tables.enabled || !ordering.reservations.enabled || !sellerReady(ordering.reservations)) throw new ReservationError('Este restaurante não está recebendo reservas pelo site.');
  return { store: record.store, ordering, settings: ordering.reservations };
}

async function readDay(slug: string, date: string) {
  return storage().readJSON<Reservation[]>(dayKey(slug, date));
}

async function writeDay<R>(slug: string, date: string, fn: (list: Reservation[]) => { list: Reservation[]; result: R }): Promise<R> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const doc = await readDay(slug, date);
    const { list, result } = fn(structuredClone(doc?.data ?? []));
    try {
      await storage().writeJSON(dayKey(slug, date), list, doc ? doc.etag : null);
      return result;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 5) throw err;
    }
  }
  throw new ConflictError();
}

/** How many tables are still free for bookings at each time of a day. */
export async function availability(slug: string, date: string, now = new Date()) {
  const { settings } = await settingsOf(slug);
  if (!bookableDays(settings, now).includes(date)) return [];
  const list = (await readDay(slug, date))?.data ?? [];
  return slotTimes(settings, date, now).map((time) => {
    const taken = list.filter((r) => r.time === time && HOLDS_SLOT.includes(effectiveStatus(r, now))).length;
    return { time, left: Math.max(0, settings.perSlot - taken) };
  });
}

// ───────────────────────────── The customer ─────────────────────────────

const phone = z
  .string()
  .transform((v) => v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, ''))
  .refine((v) => /^\d{10,11}$/.test(v), 'Informe um telefone com DDD.');

export const reservationInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  people: z.number().int().min(1).max(30),
  name: z.string().trim().min(2, 'Informe seu nome.').max(60),
  phone,
  email: z.union([z.literal(''), z.string().trim().email('E-mail inválido.').max(120)]).default(''),
  /** Ticked "li e aceito as regras do sinal". Required. */
  accepted: z.literal(true, { message: 'Para reservar, aceite as regras do sinal.' }),
  /** Honeypot: people never see it, bots fill it. */
  website: z.string().max(0).optional(),
});
export type ReservationInput = z.input<typeof reservationInputSchema>;

/** What the customer's page shows: no other booking, no phone. */
export function publicReservation(r: Reservation, now = new Date()) {
  const status = effectiveStatus(r, now);
  const start = startOf(r);
  return {
    id: r.id,
    date: r.date,
    time: r.time,
    people: r.people,
    name: r.name,
    status,
    statusLabel: RESERVATION_LABEL[status],
    deposit: r.deposit,
    refunded: r.refunded,
    pix: status === 'aguardando-pix' && r.pix ? { copyPaste: r.pix.copyPaste, qrBase64: r.pix.qrBase64, expiresAt: r.pix.expiresAt, demo: r.pix.provider === 'demo' } : null,
    rules: r.rules,
    /** Until when cancelling gives the deposit back. */
    refundUntil: new Date(start.getTime() - r.rules.cancelHours * 3_600_000).toISOString(),
    /** Withdrawal (CDC art. 49): full refund until this moment too, whichever is later. */
    withdrawUntil: r.paidAt ? new Date(Math.min(start.getTime(), Date.parse(r.paidAt) + (r.rules.withdrawalDays ?? WITHDRAWAL_DAYS) * 86_400_000)).toISOString() : null,
    paid: Boolean(r.paidAt),
    canCancel: status === 'aguardando-pix' || (status === 'confirmada' && now < start),
  };
}
export type PublicReservation = ReturnType<typeof publicReservation>;

export async function createReservation(slug: string, raw: unknown, ip: string, origin: string, now = new Date()) {
  const { store, ordering, settings } = await settingsOf(slug);
  const parsed = reservationInputSchema.safeParse(raw);
  if (!parsed.success) throw new ReservationError(parsed.error.issues[0]?.message ?? 'Confira os dados da reserva.');
  const input = parsed.data;
  if (input.people > settings.maxPeople) throw new ReservationError(`Pelo site, até ${settings.maxPeople} pessoas por reserva. Para mais, fale com o restaurante.`);
  if (!bookableDays(settings, now).includes(input.date) || !slotTimes(settings, input.date, now).includes(input.time)) {
    throw new ReservationError('Esse horário não está disponível para reserva. Escolha outro.');
  }
  const deposit = settings.depositPerPerson * input.people;
  // A practice Pix can't hold a real table on a live site: the customer would be told about a deposit nobody paid.
  if (deposit > 0 && ordering.pixMode === 'demo' && store.extra.demo !== true && process.env.RESERVAS_PIX_DEMO !== '1') {
    throw new ReservationError('Este restaurante ainda não está recebendo reservas pelo site.');
  }
  if (deposit > 0 && ordering.pixMode === 'mercadopago' && !input.email) throw new ReservationError('Informe seu e-mail para o comprovante do Pix.');
  if (ip && !(await take(`reservas-${slug}`, senderOf(ip), MAX_PER_SENDER, dayOf(now)))) throw new ReservationError('Muitas reservas deste aparelho hoje. Fale direto com o restaurante.');
  if (!(await take(`reservas-loja-${slug}`, 'site', MAX_PER_STORE_DAY, dayOf(now)))) throw new ReservationError('O restaurante não está aceitando mais reservas pelo site hoje. Fale direto com a casa.');
  await purgeOld(slug, settings.seller.keepMonths, now).catch((err) => console.error('reservas antigas', err));

  const id = `r${input.date.replace(/-/g, '')}-${random(10)}`;
  const token = random(32);
  let pix: PixCharge | null = null;
  if (deposit > 0) {
    try {
      pix = await createCharge(
        ordering.pixMode,
        {
          slug,
          orderId: id,
          amount: deposit,
          description: `Sinal da reserva · ${store.name}`,
          payerName: input.name,
          payerEmail: input.email,
          notificationUrl: `${origin}/api/pagamentos/mercadopago/${slug}`,
        },
        now,
      );
    } catch (err) {
      console.error('reserva: Pix', slug, err instanceof PixError ? err.message : err);
      throw new ReservationError('Não foi possível gerar o Pix agora. Tente de novo em instantes ou fale com o restaurante.');
    }
  }
  const at = now.toISOString();
  const reservation: Reservation = {
    id,
    tokenHash: await sha256(token),
    date: input.date,
    time: input.time,
    people: input.people,
    name: input.name,
    phone: input.phone,
    email: input.email,
    createdAt: at,
    status: deposit > 0 ? 'aguardando-pix' : 'confirmada',
    deposit,
    pix,
    paidAt: null,
    refunded: false,
    table: null,
    rules: { cancelHours: settings.cancelHours, toleranceMinutes: settings.toleranceMinutes, depositPerPerson: settings.depositPerPerson, withdrawalDays: WITHDRAWAL_DAYS, version: RULES_VERSION },
    acceptedAt: at,
    history: [{ status: deposit > 0 ? 'aguardando-pix' : 'confirmada', at, by: 'cliente' }],
  };
  await writeDay(slug, input.date, (list) => {
    const taken = list.filter((r) => r.time === input.time && HOLDS_SLOT.includes(effectiveStatus(r, now))).length;
    if (taken >= settings.perSlot) throw new ReservationError('Esse horário acabou de lotar. Escolha outro.');
    return { list: [...list, reservation], result: null };
  });
  return { id, token, reservation: publicReservation(reservation, now) };
}

function dateOfId(id: string) {
  const m = RES_ID.exec(id);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

export async function getReservation(slug: string, id: string) {
  const date = dateOfId(id);
  if (!date) return null;
  return ((await readDay(slug, date))?.data ?? []).find((r) => r.id === id) ?? null;
}

async function authorised(slug: string, id: string, token: string) {
  const r = await getReservation(slug, id);
  if (!r || typeof token !== 'string' || token.length < 16) return null;
  return sameHash(r.tokenHash, await sha256(token)) ? r : null;
}

async function update(slug: string, id: string, fn: (r: Reservation) => Reservation | null): Promise<Reservation | null> {
  const date = dateOfId(id);
  if (!date) return null;
  return writeDay(slug, date, (list) => {
    let out: Reservation | null = null;
    const next = list.map((r) => {
      if (r.id !== id) return r;
      const changed = fn(r);
      if (changed) out = changed;
      return changed ?? r;
    });
    return { list: next, result: out };
  });
}

/**
 * The deposit arrived (checked with the provider, never from what a webhook body says). A payment that lands
 * after the booking was cancelled or its Pix expired (the slot may be someone else's) is given back at once.
 */
async function markPaid(slug: string, id: string, check: PaymentCheck | 'demo', now = new Date()) {
  if (check !== 'demo' && (!check.paid || check.reference !== id)) return null;
  let late: Reservation | null = null;
  const confirmed = await update(slug, id, (x) => {
    const short = check !== 'demo' && check.amount < x.deposit;
    if (!short && x.status === 'aguardando-pix' && effectiveStatus(x, now) === 'aguardando-pix') {
      const at = now.toISOString();
      return { ...x, status: 'confirmada', paidAt: at, history: [...x.history, { status: 'confirmada', at, by: check === 'demo' ? 'demonstração' : 'pix' }] };
    }
    if (check !== 'demo' && !x.refunded && !x.paidAt && ['aguardando-pix', 'cancelada', 'expirada'].includes(x.status)) late = x;
    if (short) console.error('reserva: Pix pago com valor menor que o sinal', slug, x.id);
    return null;
  });
  if (late) await refundLate(slug, late, now);
  return confirmed;
}

/** Paid after cancelling or after the Pix expired: refund, and keep the booking cancelled. */
async function refundLate(slug: string, r: Reservation, now: Date) {
  if (!r.pix || !(await refundCharge(slug, r.pix))) {
    console.error('reserva: pagamento depois do cancelamento sem devolução automática', slug, r.id);
    return;
  }
  const at = now.toISOString();
  await update(slug, r.id, (x) => ({ ...x, status: 'cancelada', paidAt: at, refunded: true, history: [...x.history, { status: 'cancelada', at, by: 'pago fora do prazo ou com valor diferente: devolvido' }] }));
}

/** The customer's page polls this; it also nudges a pending Mercado Pago charge. */
export async function trackReservation(slug: string, id: string, token: string, now = new Date()) {
  let r = await authorised(slug, id, token);
  if (!r) return null;
  if (effectiveStatus(r, now) === 'aguardando-pix' && r.pix?.provider === 'mercadopago') {
    const check = await checkCharge(slug, r.pix).catch(() => null);
    if (check?.paid) r = (await markPaid(slug, id, check, now)) ?? r;
  }
  return publicReservation(r, now);
}

export async function simulateDeposit(slug: string, id: string, token: string, now = new Date()) {
  const r = await authorised(slug, id, token);
  if (!r || r.pix?.provider !== 'demo' || effectiveStatus(r, now) !== 'aguardando-pix') return null;
  const paid = await markPaid(slug, id, 'demo', now);
  return paid ? publicReservation(paid, now) : null;
}

export async function settleReservationFromMercadoPago(slug: string, paymentId: string) {
  const check = await lookupMercadoPago(slug, paymentId);
  if (!check?.paid || !RES_ID.test(check.reference)) return false;
  return Boolean(await markPaid(slug, check.reference, check));
}

/**
 * Cancels in three steps so nothing can slip in between: mark it cancelled (only from "aguardando-pix" or
 * "confirmada", inside the day's lock, so "chegou" can't happen at the same time), give the deposit back if
 * due, and undo the cancel if the provider refuses the refund.
 */
async function cancel(slug: string, id: string, by: string, refundDue: (r: Reservation) => boolean, now: Date) {
  let before: Reservation | null = null;
  const claimed = await update(slug, id, (x) => {
    if (!['aguardando-pix', 'confirmada'].includes(effectiveStatus(x, now))) throw new ReservationError('Esta reserva já foi encerrada.');
    before = x;
    const at = now.toISOString();
    return { ...x, status: 'cancelada', history: [...x.history, { status: 'cancelada', at, by }] };
  });
  if (!claimed || !before) throw new ReservationError('Reserva não encontrada.');
  const prev: Reservation = before;
  if (prev.status === 'aguardando-pix' && prev.pix) await cancelCharge(slug, prev.pix).catch(() => undefined);
  if (prev.status === 'confirmada' && prev.paidAt && prev.pix && refundDue(prev)) {
    if (!(await refundCharge(slug, prev.pix))) {
      await update(slug, id, () => prev);
      throw new ReservationError('Não foi possível devolver o sinal agora. Tente de novo ou fale com o restaurante.');
    }
    return update(slug, id, (x) => ({ ...x, refunded: true }));
  }
  return claimed;
}

/** Whether cancelling now gives the deposit back: before the cancel deadline, or within the 7-day withdrawal. */
export function refundDueNow(view: Pick<PublicReservation, 'refundUntil' | 'withdrawUntil'>, now = new Date()) {
  return now.getTime() <= Date.parse(view.refundUntil) || (view.withdrawUntil !== null && now.getTime() <= Date.parse(view.withdrawUntil));
}

export class RefundChangedError extends ReservationError {}

/**
 * The customer cancels. In time (or within the withdrawal days): the deposit comes back. Late: it stays (they
 * were told before paying). `expectRefund` is what their screen said; if the deadline passed meanwhile, ask again.
 */
export async function cancelByCustomer(slug: string, id: string, token: string, now = new Date(), expectRefund?: boolean) {
  const r = await authorised(slug, id, token);
  if (!r) return null;
  const view = publicReservation(r, now);
  if (!view.canCancel) throw new ReservationError('Esta reserva não pode mais ser cancelada pelo site. Fale com o restaurante.');
  const due = refundDueNow(view, now);
  if (expectRefund !== undefined && view.paid && r.deposit > 0 && expectRefund !== due) {
    throw new RefundChangedError('O prazo para devolução acabou enquanto você decidia. Se cancelar agora, o sinal fica com o restaurante. Quer cancelar mesmo assim?');
  }
  const updated = await cancel(slug, id, 'cliente', () => due, now);
  return updated ? publicReservation(updated, now) : null;
}

/** Personal data (name, phone, e-mail) of bookings older than the store's retention are erased; the money record stays. */
async function purgeOld(slug: string, keepMonths: number, now: Date) {
  const limit = dayOf(new Date(now.getTime() - keepMonths * 30 * 86_400_000));
  const keys = (await storage().list(`reservas/${slug}/`)).filter((k) => (/(\d{4}-\d{2}-\d{2})\.json$/.exec(k)?.[1] ?? '9999') < limit);
  for (const key of keys) {
    const doc = await storage().readJSON<Reservation[]>(key);
    if (!doc || doc.data.every((x) => !x.phone && !x.email && x.name === 'Dados apagados')) continue;
    await storage().writeJSON(key, doc.data.map((x) => ({ ...x, name: 'Dados apagados', phone: '', email: '' })), doc.etag);
  }
}

// ───────────────────────────── The restaurant ─────────────────────────────

/** A day's bookings for the floor, with the effective status. */
export async function reservationsOfDay(slug: string, date: string, now = new Date()) {
  const list = (await readDay(slug, date))?.data ?? [];
  return list
    .map((r) => ({ ...r, status: effectiveStatus(r, now) }))
    .sort((a, b) => a.time.localeCompare(b.time) || a.createdAt.localeCompare(b.createdAt));
}

/** Bookings that hold a table now: confirmed and starting within `minutes`, or already late but in tolerance. */
export function heldNow(list: Reservation[], now = new Date(), minutes = 30) {
  return list.filter((r) => {
    if (effectiveStatus(r, now) !== 'confirmada') return false;
    const start = startOf(r).getTime();
    return start - now.getTime() <= minutes * 60_000 && now.getTime() <= start + r.rules.toleranceMinutes * 60_000;
  }).length;
}

/** The party arrived: the booking is marked and its paid deposit returned to be put on the table's bill. */
export async function markArrived(slug: string, id: string, table: number, by: string, now = new Date()) {
  const r = await update(slug, id, (x) => {
    if (effectiveStatus(x, now) !== 'confirmada') throw new ReservationError('Só uma reserva confirmada pode chegar.');
    const at = now.toISOString();
    return { ...x, status: 'chegou', table, history: [...x.history, { status: 'chegou', at, by }] };
  });
  if (!r) throw new ReservationError('Reserva não encontrada.');
  return { reservation: r, credit: r.paidAt ? r.deposit : 0 };
}

/** Undo "chegou" when seating the table failed, so the booking is not lost. */
export async function undoArrived(slug: string, id: string) {
  await update(slug, id, (x) => (x.status === 'chegou' ? { ...x, status: 'confirmada', table: null, history: x.history.slice(0, -1) } : null));
}

export async function markFinished(slug: string, id: string, now = new Date()) {
  const at = now.toISOString();
  await update(slug, id, (x) => (x.status === 'chegou' ? { ...x, status: 'concluida', history: [...x.history, { status: 'concluida', at, by: 'conta fechada' }] } : null));
}

/** Didn't come: only after the tolerance; the deposit stays with the restaurant, as the rules said. */
export async function markNoShow(slug: string, id: string, by: string, now = new Date()) {
  const r = await update(slug, id, (x) => {
    if (effectiveStatus(x, now) !== 'confirmada') throw new ReservationError('Só uma reserva confirmada pode ser marcada como "não veio".');
    if (now.getTime() < startOf(x).getTime() + x.rules.toleranceMinutes * 60_000) throw new ReservationError(`Espere a tolerância de ${x.rules.toleranceMinutes} minutos depois do horário.`);
    const at = now.toISOString();
    return { ...x, status: 'nao-veio', history: [...x.history, { status: 'nao-veio', at, by }] };
  });
  if (!r) throw new ReservationError('Reserva não encontrada.');
  return r;
}

/** The restaurant cancels: whatever was paid always goes back. */
export async function cancelByStore(slug: string, id: string, by: string, now = new Date()) {
  return cancel(slug, id, by, () => true, now);
}

export { PIX_MINUTES };

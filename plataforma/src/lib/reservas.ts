import 'server-only';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { storage, ConflictError } from './storage';
import { getPublished } from './stores';
import { take } from './limits';
import { createCharge, checkCharge, lookupMercadoPago, PixError, refundCharge, type PaymentCheck } from './pix';
import { PIX_MINUTES, orderingOf, type PixCharge, type ReservationSettings } from './ordering';

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
  rules: { cancelHours: number; toleranceMinutes: number };
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
/** Online bookings close this long before the time (the floor has to know in advance). */
const LEAD_MINUTES = 60;

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
  if (!ordering.enabled || !ordering.tables.enabled || !ordering.reservations.enabled) throw new ReservationError('Este restaurante não está recebendo reservas pelo site.');
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
  if (deposit > 0 && ordering.pixMode === 'mercadopago' && !input.email) throw new ReservationError('Informe seu e-mail para o comprovante do Pix.');
  if (ip && !(await take(`reservas-${slug}`, ip, MAX_PER_SENDER, dayOf(now)))) throw new ReservationError('Muitas reservas deste aparelho hoje. Fale direto com o restaurante.');

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
      throw new ReservationError(err instanceof PixError ? err.message : 'Não foi possível gerar o Pix agora. Tente de novo.');
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
    rules: { cancelHours: settings.cancelHours, toleranceMinutes: settings.toleranceMinutes },
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

/** The deposit arrived (checked with the provider, never from what a webhook body says). */
async function markPaid(slug: string, id: string, check: PaymentCheck | 'demo', now = new Date()) {
  return update(slug, id, (r) => {
    if (r.status !== 'aguardando-pix') return null;
    if (check !== 'demo' && (!check.paid || check.amount < r.deposit || check.reference !== r.id)) return null;
    const at = now.toISOString();
    return { ...r, status: 'confirmada', paidAt: at, history: [...r.history, { status: 'confirmada', at, by: check === 'demo' ? 'demonstração' : 'pix' }] };
  });
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

/** The customer cancels. In time: the deposit comes back. Late: it stays (they were told before paying). */
export async function cancelByCustomer(slug: string, id: string, token: string, now = new Date()) {
  const r = await authorised(slug, id, token);
  if (!r) return null;
  const status = effectiveStatus(r, now);
  const view = publicReservation(r, now);
  if (!view.canCancel) throw new ReservationError('Esta reserva não pode mais ser cancelada pelo site. Fale com o restaurante.');
  const inTime = now.getTime() <= Date.parse(view.refundUntil);
  let refunded = false;
  if (status === 'confirmada' && r.deposit > 0 && r.pix && inTime) {
    refunded = await refundCharge(slug, r.pix);
    if (!refunded) throw new ReservationError('Não foi possível devolver o sinal agora. Tente de novo ou fale com o restaurante.');
  }
  const at = now.toISOString();
  const updated = await update(slug, id, (x) => ({ ...x, status: 'cancelada', refunded, history: [...x.history, { status: 'cancelada', at, by: 'cliente' }] }));
  return updated ? publicReservation(updated, now) : null;
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
  const r = await getReservation(slug, id);
  if (!r) throw new ReservationError('Reserva não encontrada.');
  const status = effectiveStatus(r, now);
  if (!['aguardando-pix', 'confirmada'].includes(status)) throw new ReservationError('Esta reserva já foi encerrada.');
  let refunded = false;
  if (status === 'confirmada' && r.paidAt && r.pix) {
    refunded = await refundCharge(slug, r.pix);
    if (!refunded) throw new ReservationError('Não foi possível devolver o sinal pelo Mercado Pago. Tente de novo.');
  }
  const at = now.toISOString();
  return update(slug, id, (x) => ({ ...x, status: 'cancelada', refunded, history: [...x.history, { status: 'cancelada', at, by }] }));
}

export { PIX_MINUTES };

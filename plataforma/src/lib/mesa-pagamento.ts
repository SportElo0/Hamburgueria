import 'server-only';
import { randomBytes } from 'node:crypto';
import { getPublished } from './stores';
import type { Store } from './schema';
import { storage, ConflictError } from './storage';
import { take } from './limits';
import { checkCharge, createCharge, lookupMercadoPago, PixError, refundCharge, type PaymentCheck } from './pix';
import { orderingOf, sellerReady } from './ordering';
import { tableOrders } from './orders';
import { TableError, billTotal, change, closeTable, dueOf, isMember, readDoc, tableSettings, type Seating, type TablePayment } from './mesas';
import { markFinished } from './reservas';

/**
 * Paying the table's bill by Pix from the phones at the table: the whole bill, or one share when splitting.
 * The amount is always worked out on the server from the table's orders (minus a booking deposit and what was
 * already paid). The money goes straight to the store's account. When nothing is left to pay the table closes
 * by itself. A payment that arrives when the bill was already covered (two people paid at once) is refunded.
 */

const PAY_ID = /^m(\d{8})-[a-z0-9]{10}$/;
const MAX_PENDING = 8;
/** Pix payments started per table per hour (a phone tapping "pagar" again and again). */
const MAX_STARTS_PER_HOUR = 20;
const CHECK_EVERY_MS = 10_000;
const indexKey = (slug: string) => `mesas/${slug}/pix-da-mesa.json`;
/** Every table Pix, kept two days after it was created, so a payment that lands after the table closed can still be refunded. */
interface IndexEntry {
  id: string;
  pix: TablePayment['pix'];
  amount: number;
  createdAt: string;
  refunded?: boolean;
  /** What went back to the customer, so the phone that paid can be told even after the table closed. */
  refund?: { amount: number; status: 'feito' | 'falhou' };
}

async function noteInIndex(slug: string, id: string, refund: NonNullable<IndexEntry['refund']>) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const doc = await storage().readJSON<IndexEntry[]>(indexKey(slug));
    if (!doc) return;
    try {
      await storage().writeJSON(indexKey(slug), doc.data.map((x) => (x.id === id ? { ...x, refund, refunded: refund.status === 'feito' || x.refunded } : x)), doc.etag);
      return;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 4) return;
    }
  }
}

/** For the phone that started this Pix (it alone knows the id): was any of it given back? */
export async function paymentOutcome(slug: string, id: string) {
  if (!PAY_ID.test(id)) return null;
  return (await storage().readJSON<IndexEntry[]>(indexKey(slug)))?.data.find((x) => x.id === id)?.refund ?? null;
}

async function addToIndex(slug: string, entry: IndexEntry, now: Date) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const doc = await storage().readJSON<IndexEntry[]>(indexKey(slug));
    const keep = (doc?.data ?? []).filter((e) => now.getTime() - Date.parse(e.createdAt) < 2 * 86_400_000);
    try {
      await storage().writeJSON(indexKey(slug), [...keep, entry], doc ? doc.etag : null);
      return;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 4) throw err;
    }
  }
}

/** Refunds the provider refused (no token, no balance): the staff gives them back at the till and ticks them off. */
export interface RefundToDo {
  id: string;
  table: number;
  amount: number;
  at: string;
}
const todoKey = (slug: string) => `mesas/${slug}/devolver.json`;

async function noteRefundToDo(slug: string, item: RefundToDo) {
  console.error('mesa: devolução do Pix falhou, a loja precisa devolver', slug, item.id);
  for (let attempt = 0; attempt < 5; attempt++) {
    const doc = await storage().readJSON<RefundToDo[]>(todoKey(slug));
    const list = (doc?.data ?? []).filter((x) => x.id !== item.id);
    try {
      await storage().writeJSON(todoKey(slug), [...list, item].slice(-100), doc ? doc.etag : null);
      return;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 4) return;
    }
  }
}

export async function refundsToDo(slug: string) {
  return (await storage().readJSON<RefundToDo[]>(todoKey(slug)))?.data ?? [];
}

export async function markRefundDone(slug: string, id: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const doc = await storage().readJSON<RefundToDo[]>(todoKey(slug));
    if (!doc) return;
    try {
      await storage().writeJSON(todoKey(slug), doc.data.filter((x) => x.id !== id), doc.etag);
      return;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 4) throw err;
    }
  }
}

/** A payment for a table that is no longer open: give it back once. */
async function refundOrphan(slug: string, id: string, check: PaymentCheck) {
  const doc = await storage().readJSON<IndexEntry[]>(indexKey(slug));
  const e = doc?.data.find((x) => x.id === id);
  if (!e || e.refunded || !check.paid) return;
  if (!(await refundCharge(slug, e.pix))) {
    await noteRefundToDo(slug, { id, table: 0, amount: check.amount, at: new Date().toISOString() });
    await noteInIndex(slug, id, { amount: check.amount, status: 'falhou' });
    return;
  }
  await noteInIndex(slug, id, { amount: check.amount, status: 'feito' });
}

function random(chars: number) {
  return Array.from(randomBytes(chars), (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
}
const dayStamp = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d).replace(/-/g, '');

export class TablePayError extends TableError {}

/**
 * Paying by phone needs real Pix (Mercado Pago). Practice Pix would let anyone close the table without paying, so it
 * only works on a demonstration store (or locally with RESERVAS_PIX_DEMO=1).
 */
export function tablePayReady(store: Store) {
  const o = orderingOf(store);
  return Boolean(o.tablePay) && sellerReady(o.reservations) && (o.pixMode !== 'demo' || store.extra.demo === true || process.env.RESERVAS_PIX_DEMO === '1');
}

/** Starts a Pix for what is left (parts = 1) or for one of `parts` equal shares of the bill. Only a phone at the table. */
export async function startTablePayment(slug: string, number: number, token: string | undefined, parts: number, email: string, origin: string, now = new Date()) {
  const store = await tableSettings(slug, number);
  const o = orderingOf(store);
  if (!tablePayReady(store)) throw new TablePayError('Pagamento pelo celular desligado neste restaurante. Peça a conta ao garçom.');
  if (!Number.isInteger(parts) || parts < 1 || parts > 20) throw new TablePayError('Divida a conta entre 1 e 20 pessoas.');
  const mail = typeof email === 'string' ? email.trim().slice(0, 120) : '';
  if (o.pixMode === 'mercadopago' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) throw new TablePayError('Informe seu e-mail para o comprovante do Pix.');
  const seating = (await readDoc(slug)).data.seatings[number];
  if (!seating || !isMember(seating, token)) throw new TablePayError('Este celular não está na mesa.');
  if (!seating.confirmed) throw new TablePayError('Espere o garçom confirmar a mesa para pagar.');
  const orders = await tableOrders(slug, seating.id, now);
  const due = dueOf(seating, orders);
  if (due <= 0) throw new TablePayError('A conta já está paga.');
  // A share is always of the whole bill (after a booking deposit), so each phone picking "3 pessoas" pays a third;
  // the last one pays only what is left.
  const amount = Math.min(due, Math.ceil(Math.max(0, billTotal(orders) - (seating.credit ?? 0)) / parts));
  if (amount < 100) throw new TablePayError('O valor mínimo para pagar pelo Pix é R$ 1,00.');
  const pending = (seating.payments ?? []).filter((p) => p.status === 'aguardando' && Date.parse(p.pix.expiresAt) > now.getTime());
  if (pending.length >= MAX_PENDING) throw new TablePayError('Já tem vários Pix abertos nesta mesa. Pague um deles ou espere vencer.');
  if (!(await take(`mesa-pagar-${slug}`, seating.id, MAX_STARTS_PER_HOUR, new Date(now).toISOString().slice(0, 13)))) throw new TablePayError('Muitas tentativas. Chame o garçom.');

  const id = `m${dayStamp(now)}-${random(10)}`;
  let pix;
  try {
    pix = await createCharge(
      o.pixMode,
      { slug, orderId: id, amount, description: `Mesa ${number} · ${store.name}`, payerName: 'Cliente da mesa', payerEmail: mail, notificationUrl: `${origin}/api/pagamentos/mercadopago/${slug}` },
      now,
    );
  } catch (err) {
    console.error('mesa: Pix', slug, err instanceof PixError ? err.message : err);
    throw new TablePayError('Não foi possível gerar o Pix agora. Tente de novo ou pague com o garçom.');
  }
  const payment: TablePayment = { id, amount, status: 'aguardando', pix, createdAt: now.toISOString(), paidAt: null };
  await addToIndex(slug, { id, pix, amount, createdAt: payment.createdAt }, now);
  await change(slug, (doc) => {
    const s = doc.seatings[number];
    if (!s || s.id !== seating.id) throw new TablePayError('A mesa foi fechada.');
    // Expired, unpaid Pix can no longer be paid: drop them (the index still has them for refunds).
    s.payments = [...(s.payments ?? []).filter((x) => x.status !== 'aguardando' || Date.parse(x.pix.expiresAt) > now.getTime()), payment];
  });
  return { id, amount, pix: { copyPaste: pix.copyPaste, qrBase64: pix.qrBase64, expiresAt: pix.expiresAt, demo: pix.provider === 'demo' } };
}

function findPayment(seatings: Record<string, Seating>, id: string) {
  for (const s of Object.values(seatings)) {
    const p = (s.payments ?? []).find((x) => x.id === id);
    if (p) return { seating: s, payment: p };
  }
  return null;
}

/**
 * A payment arrived (checked with the provider, or the demo button). The decision is made inside the write, against
 * the table as it is right then, so two Pix landing at once can't both count: what is over the bill goes back (all of
 * it when nothing was owed, or when less than asked was paid). When nothing is left to pay, that seating closes.
 */
async function settle(slug: string, id: string, check: PaymentCheck | 'demo', now = new Date()) {
  const found = findPayment((await readDoc(slug)).data.seatings, id);
  if (!found) {
    // The table closed in between: whatever was paid goes back.
    if (check !== 'demo') await refundOrphan(slug, id, check);
    return false;
  }
  if (found.payment.status !== 'aguardando') return found.payment.status === 'pago';
  if (check !== 'demo' && (!check.paid || check.reference !== id)) return false;
  const short = check !== 'demo' && check.amount < found.payment.amount;
  const { number } = found.seating;
  const session = found.seating.id;
  const orders = await tableOrders(slug, session, now);
  const decided = await change(slug, (doc) => {
    const s = doc.seatings[number];
    const p = s?.id === session ? s.payments?.find((x) => x.id === id) : undefined;
    if (!s || !p || p.status !== 'aguardando') return null;
    const due = dueOf(s, orders);
    const paid = short ? (check as PaymentCheck).amount : p.amount;
    const credit = short ? 0 : Math.min(p.amount, due);
    p.paidAt = now.toISOString();
    if (credit > 0) {
      if (credit < p.amount) p.charged = p.amount;
      p.amount = credit;
      p.status = 'pago';
    } else p.status = 'devolvido';
    if (paid > credit) p.refund = { amount: paid - credit, status: 'pendente' };
    return { credit, excess: paid - credit, dueAfter: due - credit, pix: p.pix };
  });
  if (!decided) return findPayment((await readDoc(slug)).data.seatings, id)?.payment.status === 'pago';
  if (decided.excess > 0) {
    const ok = await refundCharge(slug, decided.pix, decided.credit > 0 ? decided.excess : undefined);
    await change(slug, (doc) => {
      const p = doc.seatings[number]?.payments?.find((x) => x.id === id);
      if (p?.refund) p.refund.status = ok ? 'feito' : 'falhou';
    }).catch(() => undefined);
    await noteInIndex(slug, id, { amount: decided.excess, status: ok ? 'feito' : 'falhou' });
    if (!ok) await noteRefundToDo(slug, { id, table: number, amount: decided.excess, at: now.toISOString() });
  }
  if (decided.credit > 0 && decided.dueAfter <= 0) {
    // Check again with the orders as they are now: someone may have ordered in between.
    const s = (await readDoc(slug)).data.seatings[number];
    if (s?.id === session && dueOf(s, await tableOrders(slug, session, now)) <= 0) {
      const closed = await closeTable(slug, number, 'pix', 'pago pelo Pix na mesa', now, session).catch((err) => {
        console.error('mesa: fechar depois do Pix', slug, err);
        return null;
      });
      if (closed?.reservationId) await markFinished(slug, closed.reservationId, now).catch(() => undefined);
    }
  }
  return decided.credit > 0;
}

/** The phone asks whether its Pix was paid (checked with the provider at most every few seconds). */
export async function checkTablePayment(slug: string, number: number, token: string | undefined, id: string, now = new Date()) {
  if (!PAY_ID.test(id)) return;
  const seating = (await readDoc(slug)).data.seatings[number];
  if (!seating || !isMember(seating, token)) return;
  const p = (seating.payments ?? []).find((x) => x.id === id);
  if (!p || p.status !== 'aguardando' || p.pix.provider !== 'mercadopago') return;
  if (p.checkedAt && now.getTime() - Date.parse(p.checkedAt) < CHECK_EVERY_MS) return;
  await change(slug, (doc) => {
    const q = doc.seatings[number]?.payments?.find((x) => x.id === id);
    if (q) q.checkedAt = now.toISOString();
  });
  const check = await checkCharge(slug, p.pix).catch(() => null);
  if (check?.paid) await settle(slug, id, check, now);
}

/** Demo Pix only: the "simular pagamento" button. */
export async function simulateTablePayment(slug: string, number: number, token: string | undefined, id: string, now = new Date()) {
  if (!tablePayReady(await tableSettings(slug, number))) throw new TablePayError('Pagamento pelo celular desligado neste restaurante.');
  const seating = (await readDoc(slug)).data.seatings[number];
  if (!seating || !isMember(seating, token)) throw new TablePayError('Este celular não está na mesa.');
  const p = (seating.payments ?? []).find((x) => x.id === id);
  if (!p || p.pix.provider !== 'demo') throw new TablePayError('Pagamento não encontrado.');
  await settle(slug, id, 'demo', now);
}

/** Mercado Pago notification for a table payment (reference "m…"). */
export async function settleTablePaymentFromMercadoPago(slug: string, paymentId: string) {
  const check = await lookupMercadoPago(slug, paymentId);
  if (!check?.paid || !PAY_ID.test(check.reference)) return false;
  return settle(slug, check.reference, check);
}

/** Whether a store lets tables pay by phone (for the table page). */
export async function tablePayOn(slug: string) {
  const record = await getPublished(slug);
  return record ? tablePayReady(record.store) : false;
}

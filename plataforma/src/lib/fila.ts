import 'server-only';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { storage, ConflictError } from './storage';
import { getPublished } from './stores';
import { take } from './limits';
import { orderingOf, sellerReady } from './ordering';

/**
 * Walk-in waiting list. The customer scans the QR at the door, leaves a name (and, if they want, a phone so the
 * staff can call them on WhatsApp by hand), and keeps the page open: it changes to "sua mesa está pronta" when the
 * staff calls them. Nothing is sent automatically on anyone's behalf.
 *
 * Layout in storage:
 *   fila/<slug>/<YYYY-MM-DD>.json   that day's queue (QueueEntry[]). Days older than KEEP_DAYS are deleted.
 */

export const QUEUE_STATUSES = ['aguardando', 'chamado', 'sentou', 'saiu', 'nao-veio'] as const;
export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export interface QueueEntry {
  id: string;
  /** SHA-256 of the customer's link token; empty for people added by the staff. */
  tokenHash: string;
  name: string;
  phone: string;
  people: number;
  createdAt: string;
  status: QueueStatus;
  calledAt: string | null;
  table: number | null;
  by: 'cliente' | 'equipe';
}

export class QueueError extends Error {}

const TZ = 'America/Sao_Paulo';
const Q_ID = /^f(\d{4})(\d{2})(\d{2})-[a-z0-9]{10}$/;
const dayOf = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const key = (slug: string, day: string) => `fila/${slug}/${day}.json`;
/** Queue data is about one evening: only today's and yesterday's lists are kept (yesterday's for a late night). */
const KEEP_DAYS = 1;
const MAX_PER_SENDER = 4;
/** Called and not here after this: the staff may mark them as gone. */
export const CALL_WAIT_MINUTES = 10;

function random(chars: number) {
  return Array.from(randomBytes(chars), (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
}
async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}
function sameHash(a: string, b: string) {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
/** One phone = one IPv4 address or one IPv6 /64 (expanded first, so "2001:db8::1" and "2001:db8:0:0::2" match). */
function senderOf(ip: string) {
  if (!ip.includes(':')) return ip;
  const [head, tail = ''] = ip.split('::');
  const a = head ? head.split(':') : [];
  const b = tail ? tail.split(':') : [];
  const full = ip.includes('::') ? [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill('0'), ...b] : a;
  return full.slice(0, 4).map((x) => x.toLowerCase().replace(/^0+(?=.)/, '')).join(':');
}

async function settingsOf(slug: string) {
  const record = await getPublished(slug);
  if (!record) throw new QueueError('Restaurante não encontrado.');
  const o = orderingOf(record.store);
  // The privacy notice needs the restaurant's details (CNPJ, contact): without them the queue stays off.
  if (!o.enabled || !o.tables.enabled || !o.waitlist.enabled || !sellerReady(o.reservations)) throw new QueueError('Este restaurante não está usando a fila pelo celular agora.');
  return { store: record.store, settings: o.waitlist };
}

async function readDay(slug: string, day: string) {
  return storage().readJSON<QueueEntry[]>(key(slug, day));
}

async function writeDay<R>(slug: string, day: string, fn: (list: QueueEntry[]) => { list: QueueEntry[]; result: R }): Promise<R> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const doc = await readDay(slug, day);
    const { list, result } = fn(structuredClone(doc?.data ?? []));
    try {
      await storage().writeJSON(key(slug, day), list, doc ? doc.etag : null);
      return result;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 5) throw err;
    }
  }
  throw new ConflictError();
}

/** Waiting-list days older than KEEP_DAYS are deleted (they hold names and phones). */
export async function purgeOld(slug: string, now: Date) {
  const limit = dayOf(new Date(now.getTime() - KEEP_DAYS * 86_400_000));
  const keys = await storage().list(`fila/${slug}/`);
  await Promise.all(keys.filter((k) => (/(\d{4}-\d{2}-\d{2})\.json$/.exec(k)?.[1] ?? '9999') < limit).map((k) => storage().remove(k)));
}

const waiting = (list: QueueEntry[]) => list.filter((e) => e.status === 'aguardando' || e.status === 'chamado');

const phone = z
  .string()
  .transform((v) => v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, ''))
  .refine((v) => v === '' || /^\d{10,11}$/.test(v), 'Telefone com DDD, ou deixe em branco.');

export const joinSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(40),
  phone: phone.default(''),
  people: z.number().int().min(1).max(30),
  /** Honeypot: people never see it, bots fill it. */
  website: z.string().max(0).optional(),
});

/** What the customer's page shows: their place, never anyone else's name. */
export function publicEntry(e: QueueEntry, list: QueueEntry[]) {
  const ahead = waiting(list).filter((x) => x.createdAt < e.createdAt && x.status === 'aguardando').length;
  return { id: e.id, name: e.name, people: e.people, status: e.status, calledAt: e.calledAt, ahead, position: e.status === 'aguardando' ? ahead + 1 : 0, createdAt: e.createdAt };
}
export type PublicEntry = ReturnType<typeof publicEntry>;

export async function joinQueue(slug: string, raw: unknown, ip: string, now = new Date()) {
  const { settings } = await settingsOf(slug);
  const parsed = joinSchema.safeParse(raw);
  if (!parsed.success) throw new QueueError(parsed.error.issues[0]?.message ?? 'Confira os dados.');
  const day = dayOf(now);
  if (ip && !(await take(`fila-${slug}`, senderOf(ip), MAX_PER_SENDER, day))) throw new QueueError('Este celular já entrou na fila várias vezes hoje. Fale com a recepção.');
  await purgeOld(slug, now).catch((err) => console.error('fila antiga', err));
  const id = `f${day.replace(/-/g, '')}-${random(10)}`;
  const token = random(32);
  const entry: QueueEntry = {
    id,
    tokenHash: await sha256(token),
    name: parsed.data.name,
    phone: parsed.data.phone,
    people: parsed.data.people,
    createdAt: now.toISOString(),
    status: 'aguardando',
    calledAt: null,
    table: null,
    by: 'cliente',
  };
  const list = await writeDay(slug, day, (l) => {
    if (waiting(l).length >= settings.maxParties) throw new QueueError('A fila está cheia agora. Fale com a recepção.');
    const next = [...l, entry];
    return { list: next, result: next };
  });
  return { id, token, entry: publicEntry(entry, list) };
}

function dayOfId(id: string) {
  const m = Q_ID.exec(id);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** The customer's page polls this with their link token. */
export async function queueStatus(slug: string, id: string, token: string) {
  const day = dayOfId(id);
  if (!day || typeof token !== 'string' || token.length < 16) return null;
  const list = (await readDay(slug, day))?.data ?? [];
  const e = list.find((x) => x.id === id);
  if (!e || !sameHash(e.tokenHash, await sha256(token))) return null;
  return publicEntry(e, list);
}

/** The customer gives up their place. */
export async function leaveQueue(slug: string, id: string, token: string) {
  const day = dayOfId(id);
  if (!day || !(await queueStatus(slug, id, token))) return null;
  return writeDay(slug, day, (l) => {
    const next = l.map((x) => (x.id === id && (x.status === 'aguardando' || x.status === 'chamado') ? { ...x, status: 'saiu' as const, phone: '' } : x));
    const e = next.find((x) => x.id === id)!;
    return { list: next, result: publicEntry(e, next) };
  });
}

// ───────────────────────────── The staff ─────────────────────────────

export async function queueOfDay(slug: string, now = new Date()) {
  // The staff map reads this every few seconds: old days go away even when nobody joins the queue any more.
  await purgeOld(slug, now).catch((err) => console.error('fila antiga', err));
  return ((await readDay(slug, dayOf(now)))?.data ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** How many parties are waiting now (for the public page). */
export async function waitingCount(slug: string, now = new Date()) {
  return waiting(await queueOfDay(slug, now)).length;
}

/** The host adds someone who arrived without scanning (no phone needed). */
export async function addByStaff(slug: string, input: { name: string; people: number }, now = new Date()) {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 40) throw new QueueError('Nome de 1 a 40 letras.');
  if (!Number.isInteger(input.people) || input.people < 1 || input.people > 30) throw new QueueError('Número de pessoas inválido.');
  const day = dayOf(now);
  const entry: QueueEntry = { id: `f${day.replace(/-/g, '')}-${random(10)}`, tokenHash: '', name, phone: '', people: input.people, createdAt: now.toISOString(), status: 'aguardando', calledAt: null, table: null, by: 'equipe' };
  await writeDay(slug, day, (l) => ({ list: [...l, entry], result: null }));
  return entry;
}

export type QueueAction = 'chamar' | 'sentou' | 'nao-veio' | 'voltar';

/** Call (the customer's page lights up), seated at a table, didn't show, or undo a call. */
export async function updateQueue(slug: string, id: string, action: QueueAction, table: number | null, now = new Date()) {
  const day = dayOfId(id);
  if (!day) throw new QueueError('Pessoa não encontrada na fila.');
  return writeDay(slug, day, (l) => {
    const e = l.find((x) => x.id === id);
    if (!e) throw new QueueError('Pessoa não encontrada na fila.');
    if (e.status !== 'aguardando' && e.status !== 'chamado') throw new QueueError('Essa pessoa já saiu da fila.');
    let next: QueueEntry;
    if (action === 'chamar') next = { ...e, status: 'chamado', calledAt: now.toISOString() };
    else if (action === 'voltar') next = { ...e, status: 'aguardando', calledAt: null };
    // Out of the queue: the phone was only for calling them, so it goes.
    else if (action === 'sentou') next = { ...e, status: 'sentou', table, phone: '' };
    else next = { ...e, status: 'nao-veio', phone: '' };
    return { list: l.map((x) => (x.id === id ? next : x)), result: next };
  });
}

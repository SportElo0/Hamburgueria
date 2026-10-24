import 'server-only';
import { storage, ConflictError } from './storage';
import { monthKey, nextIsExtra } from './changes';
import {
  changeEntrySchema,
  changeLimit,
  emptyPayment,
  emptyStore,
  newId,
  paymentSchema,
  pedidoEntrySchema,
  storeSchema,
  type ChangeEntry,
  type PedidoEntry,
  type PedidoStatus,
  type Payment,
  type Store,
  type StoreRecord,
  type StoreSummary,
} from './schema';

/**
 * Layout in storage:
 *   lojas/<slug>/rascunho.json     editable draft (StoreRecord)
 *   lojas/<slug>/publicado.json    what the public API serves (StoreRecord)
 *   lojas/<slug>/mudancas/<YYYY-MM>.json   change log for that month (ChangeEntry[])
 *   midia/<slug>/<id>.<ext>        uploaded photos
 */
const draftKey = (slug: string) => `lojas/${slug}/rascunho.json`;
const publishedKey = (slug: string) => `lojas/${slug}/publicado.json`;
const changesKey = (slug: string, month: string) => `lojas/${slug}/mudancas/${month}.json`;
const pedidosKey = (slug: string) => `lojas/${slug}/pedidos.json`;
const paymentKey = (slug: string, month: string) => `lojas/${slug}/pagamentos/${month}.json`;

export { ConflictError };

export async function listStores(): Promise<StoreSummary[]> {
  const keys = await storage().list('lojas/');
  const slugs = [...new Set(keys.filter((k) => k.endsWith('/rascunho.json')).map((k) => k.split('/')[1]))];
  const records = await Promise.all(slugs.map((s) => storage().readJSON<StoreRecord>(draftKey(s))));
  return records
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map(({ data }) => ({
      slug: data.store.slug,
      name: data.store.name,
      segment: data.store.segment,
      plan: data.store.account.plan,
      updatedAt: data.updatedAt,
      publishedAt: data.publishedAt,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export async function getDraft(slug: string) {
  return storage().readJSON<StoreRecord>(draftKey(slug));
}

export async function getPublished(slug: string) {
  const doc = await storage().readJSON<StoreRecord>(publishedKey(slug));
  return doc?.data ?? null;
}

export async function createStore(input: { slug: string; name: string; segment: Store['segment'] }, by: string) {
  const store = storeSchema.parse(emptyStore(input.slug, input.name, input.segment));
  const record: StoreRecord = { store, updatedAt: new Date().toISOString(), updatedBy: by, publishedAt: null };
  await storage().writeJSON(draftKey(store.slug), record, null);
  return record;
}

/** Saves the draft. `etag` is what the editor loaded; a stale one means someone else saved first. */
export async function saveDraft(slug: string, input: unknown, etag: string, by: string) {
  const store = storeSchema.parse(input);
  if (store.slug !== slug) throw new Error('O identificador da loja não pode ser alterado.');
  const current = await getDraft(slug);
  if (!current) throw new Error('Loja não encontrada.');
  if (current.etag !== etag) throw new ConflictError();
  const record: StoreRecord = { store, updatedAt: new Date().toISOString(), updatedBy: by, publishedAt: current.data.publishedAt };
  const newEtag = await storage().writeJSON(draftKey(slug), record, etag);
  return { record, etag: newEtag };
}

export interface PublishInput {
  /** What the client asked for, when this publish answers a request. Empty = internal update, not logged. */
  description: string;
  counted: boolean;
  reason: string;
}

/** Copies the draft to the public version and logs the change against the month's allowance. */
export async function publish(slug: string, input: PublishInput, by: string) {
  const draft = await getDraft(slug);
  if (!draft) throw new Error('Loja não encontrada.');
  const now = new Date();
  const publishedAt = now.toISOString();

  let entry: ChangeEntry | null = null;
  if (input.description.trim()) {
    entry = await logChange(slug, { description: input.description, counted: input.counted, reason: input.reason }, by, now);
  }

  const record: StoreRecord = { ...draft.data, publishedAt };
  await storage().writeJSON(publishedKey(slug), record);
  // Mark the draft as published too (if nobody saved in between; otherwise their newer draft wins).
  try {
    await storage().writeJSON(draftKey(slug), record, draft.etag);
  } catch (err) {
    if (!(err instanceof ConflictError)) throw err;
  }
  return { publishedAt, entry };
}

export async function getChanges(slug: string, month = monthKey()) {
  const doc = await storage().readJSON<ChangeEntry[]>(changesKey(slug, month));
  return doc?.data ?? [];
}

export async function logChange(
  slug: string,
  input: { description: string; counted: boolean; reason: string },
  by: string,
  at: Date = new Date(),
) {
  const draft = await getDraft(slug);
  if (!draft) throw new Error('Loja não encontrada.');
  const limit = changeLimit(draft.data.store);
  const key = changesKey(slug, monthKey(at));
  // Retry on a concurrent append so two publishes in the same second both land.
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await storage().readJSON<ChangeEntry[]>(key);
    const entries = doc?.data ?? [];
    const entry = changeEntrySchema.parse({
      id: newId(),
      at: at.toISOString(),
      by,
      description: input.description,
      counted: input.counted,
      extra: input.counted && nextIsExtra(entries, limit),
      reason: input.counted ? '' : input.reason,
    });
    try {
      await storage().writeJSON(key, [...entries, entry], doc ? doc.etag : null);
      return entry;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
  throw new ConflictError();
}

export async function removeChange(slug: string, month: string, id: string) {
  const key = changesKey(slug, month);
  const doc = await storage().readJSON<ChangeEntry[]>(key);
  if (!doc) return;
  await storage().writeJSON(key, doc.data.filter((e) => e.id !== id), doc.etag);
}

export async function listChangeMonths(slug: string) {
  const keys = await storage().list(`lojas/${slug}/mudancas/`);
  return keys.map((k) => k.split('/').pop()!.replace('.json', '')).sort().reverse();
}

/** Requests logged as they come in (usually by WhatsApp), before anyone has published them. */
export async function listPedidos(slug: string): Promise<PedidoEntry[]> {
  const doc = await storage().readJSON<PedidoEntry[]>(pedidosKey(slug));
  return doc?.data ?? [];
}

export async function addPedido(slug: string, input: { texto: string; canal: PedidoEntry['canal'] }, by: string): Promise<PedidoEntry> {
  const key = pedidosKey(slug);
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await storage().readJSON<PedidoEntry[]>(key);
    const entries = doc?.data ?? [];
    const entry = pedidoEntrySchema.parse({
      id: newId(),
      texto: input.texto,
      canal: input.canal,
      criadoEm: new Date().toISOString(),
      criadoPor: by,
      status: 'pendente',
      resolvidoEm: null,
      resolvidoPor: '',
    });
    try {
      await storage().writeJSON(key, [...entries, entry], doc ? doc.etag : null);
      return entry;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
  throw new ConflictError();
}

export async function resolvePedido(slug: string, id: string, status: Exclude<PedidoStatus, 'pendente'>, by: string): Promise<void> {
  const key = pedidosKey(slug);
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await storage().readJSON<PedidoEntry[]>(key);
    if (!doc) return;
    const next = doc.data.map((p) => (p.id === id ? { ...p, status, resolvidoEm: new Date().toISOString(), resolvidoPor: by } : p));
    try {
      await storage().writeJSON(key, next, doc.etag);
      return;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
  throw new ConflictError();
}

export async function getPayment(slug: string, month: string): Promise<Payment> {
  const doc = await storage().readJSON<Payment>(paymentKey(slug, month));
  return doc?.data ?? emptyPayment(month);
}

export async function setPayment(slug: string, month: string, input: { paid: boolean; note: string }, by: string): Promise<Payment> {
  const key = paymentKey(slug, month);
  const current = await storage().readJSON<Payment>(key);
  const payment = paymentSchema.parse({
    month,
    paid: input.paid,
    paidAt: input.paid ? (current?.data.paid ? current.data.paidAt : new Date().toISOString()) : null,
    paidBy: input.paid ? by : '',
    note: input.note,
  });
  await storage().writeJSON(key, payment, current ? current.etag : null);
  return payment;
}

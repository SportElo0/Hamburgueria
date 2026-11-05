import 'server-only';
import { after } from 'next/server';
import { storage, ConflictError } from './storage';
import { monthKey, nextIsExtra } from './changes';
import { hourWindow, take } from './limits';
import { orderingOf } from './ordering';
import {
  changeEntrySchema,
  changeLimit,
  emptyPayment,
  emptyStore,
  itemSchema,
  newId,
  paymentSchema,
  pedidoEntrySchema,
  storeSchema,
  type ChangeEntry,
  type Item,
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
  // A loja de demonstração da Inteligência tem dados fictícios e nunca vai ao ar.
  if (draft.data.store.extra.demo === true) throw new Error('A loja de demonstração não pode ser publicada.');
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

/** What a store's own staff may change on an item, without going through the agency. */
export interface StoreItemEdit {
  name: string;
  description: string;
  /** Centavos. */
  price: number;
}

export class ItemEditError extends Error {}

/** Applies the staff edit to one item of a record; `null` when the item is not in it. Throws ItemEditError on bad input. */
function editItemIn(store: Store, itemId: string, edit: StoreItemEdit): { store: Store; before: Item } | null {
  for (const c of store.catalog.categories) {
    const at = c.items.findIndex((i) => i.id === itemId);
    if (at < 0) continue;
    const before = c.items[at];
    const parsed = itemSchema.safeParse({ ...before, name: edit.name, description: edit.description, price: edit.price });
    if (!parsed.success) throw new ItemEditError('Confira o nome, a descrição e o preço.');
    const categories = store.catalog.categories.map((cat) => (cat === c ? { ...cat, items: cat.items.map((i, n) => (n === at ? parsed.data : i)) } : cat));
    return { store: { ...store, catalog: { categories } }, before };
  }
  return null;
}

/**
 * The store's staff edits an item's name, description or price. It goes live at once (published copy) and is
 * mirrored into the draft, so the next publish by the team does not undo it. Logged, not counted.
 */
export async function editItemByStore(slug: string, itemId: string, input: StoreItemEdit, by: string): Promise<Item> {
  const edit: StoreItemEdit = { name: input.name.trim(), description: input.description.trim(), price: input.price };
  if (!edit.name || edit.name.length > 120) throw new ItemEditError('O nome precisa ter de 1 a 120 letras.');
  if (edit.description.length > 600) throw new ItemEditError('A descrição pode ter até 600 letras.');
  if (!Number.isInteger(edit.price) || edit.price < 1 || edit.price > 10_000_000) throw new ItemEditError('Preço inválido.');
  if (!(await take('cardapio-loja', slug, 60, hourWindow()))) throw new ItemEditError('Muitas mudanças nesta hora. Espere um pouco ou fale com a Growlift.');

  let before: Item | null = null;
  let after: Item | null = null;
  for (let attempt = 0; ; attempt++) {
    const doc = await storage().readJSON<StoreRecord>(publishedKey(slug));
    if (!doc) throw new ItemEditError('O cardápio ainda não foi publicado.');
    const result = editItemIn(doc.data.store, itemId, edit);
    if (!result) throw new ItemEditError('Esse item não está mais no cardápio. Atualize a página.');
    try {
      await storage().writeJSON(publishedKey(slug), { ...doc.data, store: result.store }, doc.etag);
      before = result.before;
      after = result.store.catalog.categories.flatMap((c) => c.items).find((i) => i.id === itemId)!;
      break;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await getDraft(slug);
    const result = doc && editItemIn(doc.data.store, itemId, edit);
    if (!doc || !result) break; // removed from the draft: the team's next publish drops it anyway
    try {
      await storage().writeJSON(draftKey(slug), { ...doc.data, store: result.store }, doc.etag);
      break;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }

  const changes: string[] = [];
  if (before.name !== after.name) changes.push(`nome "${before.name}" → "${after.name}"`);
  if (before.price !== after.price) changes.push(`preço ${before.price === null ? 'sem preço' : (before.price / 100).toFixed(2)} → ${(after.price! / 100).toFixed(2)}`);
  if (before.description !== after.description) changes.push('descrição');
  if (changes.length) {
    await logChange(slug, { description: `Feita pela loja: ${after.name}: ${changes.join(', ')}`.slice(0, 500), counted: false, reason: 'Feita pela loja' }, by);
  }
  return after;
}

/**
 * Applies `fn` to the draft and, when there is one, to the published copy, each re-read on a write conflict.
 * For owner changes that must hold for customers at once and not be undone by the team's next publish.
 */
async function updateBoth(slug: string, by: string, fn: (store: Store) => Store) {
  for (const key of [publishedKey(slug), draftKey(slug)]) {
    for (let attempt = 0; ; attempt++) {
      const doc = await storage().readJSON<StoreRecord>(key);
      if (!doc) break;
      const store = storeSchema.parse(fn(doc.data.store));
      try {
        await storage().writeJSON(key, key === draftKey(slug) ? { ...doc.data, store, updatedAt: new Date().toISOString(), updatedBy: by } : { ...doc.data, store }, doc.etag);
        break;
      } catch (err) {
        if (!(err instanceof ConflictError) || attempt === 3) throw err;
      }
    }
  }
}

async function ownerLimit(slug: string) {
  if (!(await take('cardapio-loja', slug, 60, hourWindow()))) throw new ItemEditError('Muitas mudanças nesta hora. Espere um pouco ou fale com a Growlift.');
}
/** The owner's change goes to the change log after the answer is sent, so the screen does not wait for it. */
async function ownerLog(slug: string, description: string, by: string) {
  const write = () =>
    logChange(slug, { description: `Feita pelo dono: ${description}`.slice(0, 500), counted: false, reason: 'Feita pela loja' }, by).then(
      () => undefined,
      (err) => console.error('registro da mudança do dono', err),
    );
  try {
    after(write);
  } catch {
    await write(); // outside a request (tests, scripts)
  }
}

/** The owner says how many tables the restaurant has (1 to 200), never fewer than a table open right now. */
export async function setTablesCount(slug: string, count: number, by: string, highestOpen = 0) {
  if (!Number.isInteger(count) || count < 1 || count > 200) throw new ItemEditError('Informe de 1 a 200 mesas.');
  if (count < highestOpen) throw new ItemEditError(`A mesa ${highestOpen} está aberta. Libere ou feche a conta dela antes de diminuir.`);
  await ownerLimit(slug);
  await updateBoth(slug, by, (store) => {
    const o = orderingOf(store);
    return { ...store, ordering: { ...o, tables: { ...o.tables, count } } };
  });
  await ownerLog(slug, `número de mesas: ${count}`, by);
}

/** The owner sets the service charge (whole %, 0 to 20) and the cover charge per person (centavos). */
export async function setContaConfig(slug: string, servico: number, couvert: number, by: string) {
  if (!Number.isInteger(servico) || servico < 0 || servico > 20) throw new ItemEditError('A taxa de serviço vai de 0% a 20%.');
  if (!Number.isInteger(couvert) || couvert < 0 || couvert > 50_000) throw new ItemEditError('Couvert inválido.');
  await ownerLimit(slug);
  await updateBoth(slug, by, (store) => ({ ...store, ordering: { ...orderingOf(store), conta: { servico, couvert } } }));
  await ownerLog(slug, `taxa de serviço ${servico}% e couvert ${(couvert / 100).toFixed(2)}`, by);
}

/** The owner edits an item; with no published menu yet, only the draft exists and gets the change. */
export async function editItemByOwner(slug: string, itemId: string, input: StoreItemEdit, by: string) {
  if (await getPublished(slug)) return editItemByStore(slug, itemId, input, by);
  const edit: StoreItemEdit = { name: input.name.trim(), description: input.description.trim(), price: input.price };
  if (!edit.name || edit.name.length > 120) throw new ItemEditError('O nome precisa ter de 1 a 120 letras.');
  if (!Number.isInteger(edit.price) || edit.price < 1 || edit.price > 10_000_000) throw new ItemEditError('Preço inválido.');
  await ownerLimit(slug);
  let found = false;
  await updateBoth(slug, by, (store) => {
    const r = editItemIn(store, itemId, edit);
    found = Boolean(r);
    return r ? r.store : store;
  });
  if (!found) throw new ItemEditError('Esse item não está mais no cardápio. Atualize a página.');
  await ownerLog(slug, `${edit.name} (${(edit.price / 100).toFixed(2)})`, by);
}

/** The owner adds an item (name, price, category; a new category is created). Returns its id. */
export async function addItemByOwner(slug: string, input: { name: string; price: number; category: string }, by: string): Promise<string> {
  const name = input.name.trim().replace(/\s+/g, ' ');
  const category = input.category.trim().replace(/\s+/g, ' ');
  if (!name || name.length > 120) throw new ItemEditError('O nome precisa ter de 1 a 120 letras.');
  if (!category || category.length > 80) throw new ItemEditError('Escreva a categoria (ex.: Lanches, Bebidas).');
  if (!Number.isInteger(input.price) || input.price < 1 || input.price > 10_000_000) throw new ItemEditError('Preço inválido.');
  await ownerLimit(slug);
  const id = newId();
  await updateBoth(slug, by, (store) => {
    const cats = store.catalog.categories;
    if (cats.flatMap((c) => c.items).length >= 300) throw new ItemEditError('O cardápio já tem itens demais.');
    const item = itemSchema.parse({ id, name, description: '', price: input.price, priceLabel: '', image: '', imageAlt: '', available: true, featured: false, tags: [], options: [] });
    const at = cats.findIndex((c) => c.name.toLocaleLowerCase('pt-BR') === category.toLocaleLowerCase('pt-BR'));
    const categories =
      at >= 0
        ? cats.map((c, i) => (i === at ? { ...c, items: [...c.items, item] } : c))
        : [...cats, { id: newId(), name: category, description: '', items: [item] }];
    return { ...store, catalog: { categories } };
  });
  await ownerLog(slug, `item novo ${name} em ${category} (${(input.price / 100).toFixed(2)})`, by);
  return id;
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

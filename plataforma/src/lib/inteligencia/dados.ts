import 'server-only';
import { storage, ConflictError } from '../storage';
import { getDraft, getPublished } from '../stores';
import { ordersForDays } from '../orders';
import { costSheetSchema, EMPTY_COST_SHEET, type CostSheet } from './custos';
import { analyze } from './analise';
import { recommend, decisionSchema, type Decision, type DecisionStatus } from './recomendacoes';
import { DEMO_SLUG, demoCostSheet, demoOrders, demoStore } from './demo';
import type { StoreRecord } from '../schema';

/**
 * Layout in storage:
 *   inteligencia/<slug>/custos.json     ficha de custos (CostSheet)
 *   inteligencia/<slug>/decisoes.json   decisão sobre cada recomendação ({ [id]: Decision })
 */
const costsKey = (slug: string) => `inteligencia/${slug}/custos.json`;
const decisionsKey = (slug: string) => `inteligencia/${slug}/decisoes.json`;

export async function getCostSheet(slug: string): Promise<{ sheet: CostSheet; etag: string | null; updatedAt: string | null; updatedBy: string }> {
  const doc = await storage().readJSON<{ sheet: CostSheet; updatedAt: string; updatedBy: string }>(costsKey(slug));
  if (!doc) return { sheet: EMPTY_COST_SHEET, etag: null, updatedAt: null, updatedBy: '' };
  const parsed = costSheetSchema.safeParse(doc.data.sheet);
  return { sheet: parsed.success ? parsed.data : EMPTY_COST_SHEET, etag: doc.etag, updatedAt: doc.data.updatedAt, updatedBy: doc.data.updatedBy };
}

/** Salva a ficha de custos. `etag` é o que a tela carregou; se mudou, outra pessoa salvou antes. */
export async function saveCostSheet(slug: string, input: unknown, etag: string | null, by: string) {
  const sheet = costSheetSchema.parse(input);
  const ids = new Set(sheet.ingredients.map((i) => i.id));
  for (const p of Object.values(sheet.products)) {
    for (const line of p.recipe) if (!ids.has(line.ingredientId)) throw new Error('A ficha técnica usa um insumo que não existe mais.');
  }
  const newEtag = await storage().writeJSON(costsKey(slug), { sheet, updatedAt: new Date().toISOString(), updatedBy: by }, etag);
  return { sheet, etag: newEtag };
}

export async function getDecisions(slug: string): Promise<Record<string, Decision>> {
  const doc = await storage().readJSON<Record<string, Decision>>(decisionsKey(slug));
  return doc?.data ?? {};
}

export async function setDecision(slug: string, id: string, input: { status: DecisionStatus | null; note: string }, by: string) {
  if (!/^[a-z0-9:-]{1,80}$/.test(id)) throw new Error('Recomendação inválida.');
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await storage().readJSON<Record<string, Decision>>(decisionsKey(slug));
    const current = { ...(doc?.data ?? {}) };
    if (input.status === null) delete current[id];
    else current[id] = decisionSchema.parse({ status: input.status, note: input.note, by, at: new Date().toISOString() });
    try {
      await storage().writeJSON(decisionsKey(slug), current, doc ? doc.etag : null);
      return current;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
  throw new ConflictError();
}

/** Análise dos últimos `days` dias comparada aos `days` dias anteriores, com as recomendações. */
export async function intelligenceFor(slug: string, days: number, now = new Date()) {
  const [all, costs, decisions, draft] = await Promise.all([ordersForDays(slug, days * 2, now), getCostSheet(slug), getDecisions(slug), getDraft(slug)]);
  const categories = new Map(draft?.data.store.catalog.categories.flatMap((c) => c.items.map((i) => [i.id, c.name] as const)) ?? []);
  const analysis = analyze({
    previous: all.slice(0, days),
    current: all.slice(days),
    sheet: costs.sheet,
    categoryOf: (id) => categories.get(id),
    now: now.getTime(),
  });
  return { analysis, recommendations: recommend(analysis), decisions, costs };
}

/**
 * Cria (ou recria) a loja de demonstração com dados fictícios: rascunho da loja, ficha
 * de custos e 120 dias de pedidos. Não publica nada e não toca em nenhuma outra loja.
 */
export async function createDemo(by: string, now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  // Só recria se o slug for mesmo da demonstração: nunca sobrescreve uma loja de verdade ou publicada.
  const [existing, published] = await Promise.all([getDraft(DEMO_SLUG), getPublished(DEMO_SLUG)]);
  if (published || (existing && (existing.data.store.extra.demo !== true || existing.data.publishedAt))) {
    throw new Error(`O endereço ${DEMO_SLUG} já é usado por uma loja que não é a demonstração.`);
  }
  const store = demoStore();
  const record: StoreRecord = { store, updatedAt: now.toISOString(), updatedBy: by, publishedAt: null };
  await storage().writeJSON(`lojas/${DEMO_SLUG}/rascunho.json`, record);
  await storage().writeJSON(costsKey(DEMO_SLUG), { sheet: demoCostSheet(), updatedAt: now.toISOString(), updatedBy: by });
  await storage().writeJSON(decisionsKey(DEMO_SLUG), {});
  const days = demoOrders(today, 120);
  for (let i = 0; i < days.length; i += 10) {
    await Promise.all(days.slice(i, i + 10).map(({ day, orders }) => storage().writeJSON(`pedidos/${DEMO_SLUG}/${day}.json`, orders)));
  }
  return { slug: DEMO_SLUG, days: days.length, orders: days.reduce((s, d) => s + d.orders.length, 0) };
}

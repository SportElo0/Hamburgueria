import 'server-only';
import { createHmac } from 'node:crypto';
import { storage, ConflictError } from '../storage';
import { getDraft, getPublished } from '../stores';
import { dayOf, ordersOfDays } from '../orders';
import { costSheetSchema, EMPTY_COST_SHEET, type CostSheet } from './custos';
import { analyze } from './analise';
import { SUMMARY_VERSION, monthSummaryKey, summarizeDay, type DaySummary, type MonthSummary } from './resumo';
import { recommend, decisionSchema, type Decision, type DecisionStatus } from './recomendacoes';
import { DEMO_SLUG, demoCostSheet, demoFloor, demoOrders, demoStore } from './demo';
import type { StoreRecord } from '../schema';

/**
 * Layout in storage:
 *   inteligencia/<slug>/custos.json     ficha de custos (CostSheet)
 *   inteligencia/<slug>/decisoes.json   decisão sobre cada recomendação ({ [id]: Decision })
 *   inteligencia/<slug>/resumo/<YYYY-MM>.json   dias fechados do mês já resumidos (MonthSummary)
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

/**
 * Chave do código de cliente dos resumos, derivada do SESSION_SECRET e da loja. Trocar o
 * SESSION_SECRET muda os códigos: os resumos antigos contam o mesmo cliente como outro.
 */
function customerKey(slug: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET ausente ou curto (mínimo 32 caracteres).');
    return `local:${slug}`;
  }
  return createHmac('sha256', secret).update(`inteligencia-cliente:${slug}`).digest('hex');
}

/** Dias que já podem ir para o resumo do mês: até anteontem. Hoje e ontem ainda recebem pedidos. */
export const lastClosedDay = (now: Date) => dayOf(new Date(now.getTime() - 2 * 86_400_000));

/**
 * Resumo de cada um dos últimos `count` dias, do mais antigo ao mais novo. Lê um documento por
 * mês; só os dias que ainda não estão nele (hoje, ontem e os que faltam) vêm dos pedidos. Os
 * dias fechados lidos assim entram no resumo do mês para a próxima vez. Se um pedido de um dia
 * fechado muda (ex.: devolução), orders.ts esvazia o resumo daquele mês e ele é refeito.
 */
export async function summariesForDays(slug: string, count: number, now = new Date()): Promise<DaySummary[]> {
  const days = Array.from({ length: count }, (_, i) => dayOf(new Date(now.getTime() - (count - 1 - i) * 86_400_000)));
  const closed = lastClosedDay(now);
  const months = [...new Set(days.map((d) => d.slice(0, 7)))];
  const docs = new Map(
    await Promise.all(
      months.map(async (m) => {
        // Documento de outra versão: os dias contam como faltando, mas o etag fica para sobrescrevê-lo.
        const doc = await storage().readJSON<MonthSummary>(monthSummaryKey(slug, m));
        return [m, doc && doc.data.version !== SUMMARY_VERSION ? { ...doc, data: { version: SUMMARY_VERSION, days: {} } } : doc] as const;
      }),
    ),
  );
  const stamp = now.getTime();
  const key = customerKey(slug);
  const missing = days.filter((d) => !docs.get(d.slice(0, 7))?.data.days[d]);
  const fresh = new Map((await ordersOfDays(slug, missing)).map(({ day, orders }) => [day, summarizeDay(day, orders, stamp, key)]));

  // Guarda os dias fechados recém-resumidos. É só um atalho: se a gravação falhar, a tela abre igual e tenta de novo na próxima.
  await Promise.all(
    months.map(async (m) => {
      const add = [...fresh.values()].filter((s) => s.day.startsWith(m) && s.day <= closed);
      if (!add.length) return;
      const doc = docs.get(m);
      const next: MonthSummary = { version: SUMMARY_VERSION, days: { ...(doc?.data.days ?? {}) } };
      for (const s of add) next.days[s.day] = s;
      await storage().writeJSON(monthSummaryKey(slug, m), next, doc ? doc.etag : null).catch((err) => {
        if (!(err instanceof ConflictError)) console.error('resumo da inteligência não gravado', slug, m, err);
      });
    }),
  );
  return days.map((d) => fresh.get(d) ?? docs.get(d.slice(0, 7))!.data.days[d]);
}

/** Análise dos últimos `days` dias comparada aos `days` dias anteriores, com as recomendações. */
export async function intelligenceFor(slug: string, days: number, now = new Date()) {
  const [all, costs, decisions, draft] = await Promise.all([summariesForDays(slug, days * 2, now), getCostSheet(slug), getDecisions(slug), getDraft(slug)]);
  const categories = new Map(draft?.data.store.catalog.categories.flatMap((c) => c.items.map((i) => [i.id, c.name] as const)) ?? []);
  const analysis = analyze({
    previous: all.slice(0, days),
    current: all.slice(days),
    sheet: costs.sheet,
    categoryOf: (id) => categories.get(id),
  });
  return { analysis, recommendations: recommend(analysis), decisions, costs };
}

/**
 * Grava os dados fictícios de uma loja: ficha de custos, 120 dias de pedidos (já resumidos por mês)
 * e mesas abertas agora. Os pedidos usam os itens do cardápio de demonstração (demoStore).
 */
async function writeFakeData(slug: string, by: string, now: Date) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  await storage().writeJSON(costsKey(slug), { sheet: demoCostSheet(), updatedAt: now.toISOString(), updatedBy: by });
  await storage().writeJSON(decisionsKey(slug), {});
  const days = demoOrders(today, 120);
  // Tables open right now, with their orders among today's (the owner's live floor).
  const last = days[days.length - 1];
  const floor = last.orders.length ? demoFloor(last.orders[0], now) : null;
  if (floor) last.orders.push(...floor.orders);
  // Os resumos dos meses vão prontos: abrir a demo não precisa ler os 120 dias de pedidos.
  const closed = lastClosedDay(now);
  const stamp = now.getTime();
  const key = customerKey(slug);
  const months = new Map<string, MonthSummary>();
  // Os dias antes da demo também vão no resumo (sem pedidos), para a comparação de 90 dias (que olha 180) não precisar lê-los um a um.
  const before = Array.from({ length: 200 - days.length }, (_, i) => ({ day: dayOf(new Date(Date.parse(`${days[0].day}T12:00:00Z`) - (200 - days.length - i) * 86_400_000)), orders: [] }));
  for (const { day, orders } of [...before, ...days]) {
    if (day > closed) continue;
    const m = months.get(day.slice(0, 7)) ?? { version: SUMMARY_VERSION, days: {} };
    m.days[day] = summarizeDay(day, orders, stamp, key);
    months.set(day.slice(0, 7), m);
  }
  const old = (await storage().list(`inteligencia/${slug}/resumo/`)).filter((k) => !months.has(k.slice(-12, -5)));
  const writes = [
    ...days.map(({ day, orders }) => () => storage().writeJSON(`pedidos/${slug}/${day}.json`, orders)),
    ...[...months].map(([m, doc]) => () => storage().writeJSON(monthSummaryKey(slug, m), doc)),
    ...old.map((k) => () => storage().remove(k)),
    ...(floor ? [() => storage().writeJSON(`mesas/${slug}/abertas.json`, { seatings: floor.seatings })] : []),
  ];
  for (let i = 0; i < writes.length; i += 10) await Promise.all(writes.slice(i, i + 10).map((w) => w()));
  return { days };
}

export class TestDataError extends Error {}

/** A loja pode receber dados de teste: nunca publicada e sem pedidos de verdade (ou já marcada como teste). */
async function testable(slug: string) {
  if (slug === DEMO_SLUG) throw new TestDataError('Use Recriar demonstração para a loja de demonstração.');
  const [draft, published] = await Promise.all([getDraft(slug), getPublished(slug)]);
  if (!draft) throw new TestDataError('Loja não encontrada.');
  if (published || draft.data.publishedAt) throw new TestDataError('Essa loja já foi publicada: dados de teste só em loja que nunca foi ao ar.');
  if (draft.data.store.extra.teste !== true && (await storage().list(`pedidos/${slug}/`)).length > 0) {
    throw new TestDataError('Essa loja já tem pedidos de verdade: não dá para misturar com dados de teste.');
  }
  return draft;
}

/**
 * Enche uma loja de teste com dados fictícios para mostrar o painel do dono: o cardápio da hamburgueria
 * de demonstração, custos, 120 dias de pedidos, 12 mesas com algumas abertas. Nunca publica nada; a loja
 * fica marcada com `extra.teste` e o botão de limpar apaga tudo isso.
 */
export async function fillTestData(slug: string, by: string, now = new Date()) {
  const draft = await testable(slug);
  const demo = demoStore();
  const o = draft.data.store.ordering;
  const store = { ...draft.data.store, catalog: demo.catalog, extra: { ...draft.data.store.extra, teste: true }, ordering: { ...o, tables: { ...o.tables, count: 12 } } };
  await storage().writeJSON(`lojas/${slug}/rascunho.json`, { ...draft.data, store, updatedAt: now.toISOString(), updatedBy: by }, draft.etag);
  const { days } = await writeFakeData(slug, by, now);
  return { days: days.length, orders: days.reduce((n, d) => n + d.orders.length, 0) };
}

/** Apaga os dados de teste: pedidos, resumos, custos, decisões, mesas e o cardápio de demonstração. */
export async function clearTestData(slug: string, by: string, now = new Date()) {
  const draft = await testable(slug);
  if (draft.data.store.extra.teste !== true) throw new TestDataError('Essa loja não tem dados de teste.');
  const keys = [
    ...(await storage().list(`pedidos/${slug}/`)),
    ...(await storage().list(`inteligencia/${slug}/resumo/`)),
    ...(await storage().list(`mesas/${slug}/historico/`)),
    costsKey(slug),
    decisionsKey(slug),
    `mesas/${slug}/abertas.json`,
  ];
  for (let i = 0; i < keys.length; i += 10) await Promise.all(keys.slice(i, i + 10).map((k) => storage().remove(k)));
  const { teste: _teste, ...extra } = draft.data.store.extra;
  void _teste;
  await storage().writeJSON(`lojas/${slug}/rascunho.json`, { ...draft.data, store: { ...draft.data.store, extra, catalog: { categories: [] } }, updatedAt: now.toISOString(), updatedBy: by }, draft.etag);
}

/**
 * Cria (ou recria) a loja de demonstração com dados fictícios: rascunho da loja, ficha
 * de custos e 120 dias de pedidos. Não publica nada e não toca em nenhuma outra loja.
 */
export async function createDemo(by: string, now = new Date()) {
  // Só recria se o slug for mesmo da demonstração: nunca sobrescreve uma loja de verdade ou publicada.
  const [existing, published] = await Promise.all([getDraft(DEMO_SLUG), getPublished(DEMO_SLUG)]);
  if (published || (existing && (existing.data.store.extra.demo !== true || existing.data.publishedAt))) {
    throw new Error(`O endereço ${DEMO_SLUG} já é usado por uma loja que não é a demonstração.`);
  }
  const store = demoStore();
  const record: StoreRecord = { store, updatedAt: now.toISOString(), updatedBy: by, publishedAt: null };
  await storage().writeJSON(`lojas/${DEMO_SLUG}/rascunho.json`, record);
  const { days } = await writeFakeData(DEMO_SLUG, by, now);
  return { slug: DEMO_SLUG, days: days.length, orders: days.reduce((n, d) => n + d.orders.length, 0) };
}

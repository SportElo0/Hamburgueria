import { z } from 'zod';
import type { Store } from './schema';
import type { Order } from './ordering';

/**
 * "Hora da sobremesa": after the main course, the table's phone shows the desserts (in 3D when scanned) and the
 * waiter's floor screen says which table to offer dessert to. Pure functions only (no storage), so the rules are
 * unit-tested directly. Measuring comes first: every closed bill keeps how many desserts it had and whether the
 * table was in the test, so the owner sees the dessert rate with and without the prompt.
 *
 * Mode:
 * - desligado: nothing is shown; desserts are still counted (that is the "before" measurement).
 * - metade: only odd-numbered tables get the prompt, even ones are the comparison group.
 * - todas: every table gets it.
 */

export const DESSERT_MODES = ['desligado', 'metade', 'todas'] as const;
export type DessertMode = (typeof DESSERT_MODES)[number];

export const DESSERT_MODE_LABEL: Record<DessertMode, string> = {
  desligado: 'Desligado (só mede)',
  metade: 'Metade das mesas (teste)',
  todas: 'Todas as mesas',
};

const id = z.string().min(1).max(40);

export const sobremesaSchema = z.object({
  mode: z.enum(DESSERT_MODES),
  /** Categories that are dessert. Empty: by the category's name (sobremesas, doces…). */
  categories: z.array(id).max(20),
  /** Up to 3 items shown first (best the ones with 3D). Empty: dessert items with 3D first. */
  featured: z.array(id).max(3),
  /** Minutes after the main course is ready before the prompt shows. */
  minutes: z.number().int().min(5).max(90),
});
export type Sobremesa = z.infer<typeof sobremesaSchema>;

export const DEFAULT_SOBREMESA: Sobremesa = { mode: 'desligado', categories: [], featured: [], minutes: 15 };

const DESSERT_NAME = /sobremesa|doce|dessert|sorvete|a[çc]a[ií]|torta|bolo|pudim|brownie|mousse|gelato|petit/i;
/** Categories never treated as the main course: add-ons and drinks are bought with it, not instead of it. */
const ADDONS = 'adicionais';

/** Which categories count as dessert: the ones the team picked, or the ones whose name says so. */
export function dessertCategoryIds(store: Pick<Store, 'catalog'>, cfg: Sobremesa): Set<string> {
  const cats = store.catalog.categories;
  const picked = cfg.categories.filter((c) => cats.some((x) => x.id === c));
  return new Set(picked.length ? picked : cats.filter((c) => DESSERT_NAME.test(c.name)).map((c) => c.id));
}

/** Is this table in the group that gets the prompt? Odd tables in the half test. */
export function inDessertTest(cfg: Sobremesa, table: number): boolean {
  if (cfg.mode === 'todas') return true;
  if (cfg.mode === 'metade') return table % 2 === 1;
  return false;
}

export interface DessertContext {
  dessert: Set<string>;
  drinks: Set<string>;
  /** Item id → category id. */
  categoryOf: Map<string, string>;
}

export function dessertContext(store: Pick<Store, 'catalog'>, cfg: Sobremesa, drinks: Set<string>): DessertContext {
  const categoryOf = new Map<string, string>();
  for (const c of store.catalog.categories) for (const i of c.items) categoryOf.set(i.id, c.id);
  return { dessert: dessertCategoryIds(store, cfg), drinks, categoryOf };
}

const counted = (orders: Order[]) => orders.filter((o) => o.status !== 'recusado' && o.status !== 'expirado');
const isDessertLine = (ctx: DessertContext, productId: string) => ctx.dessert.has(ctx.categoryOf.get(productId) ?? '');
const isFoodLine = (ctx: DessertContext, productId: string) => {
  const cat = ctx.categoryOf.get(productId) ?? '';
  return !ctx.dessert.has(cat) && !ctx.drinks.has(cat) && cat !== ADDONS;
};
const COOKING: Order['status'][] = ['aguardando-garcom', 'novo', 'preparo'];

/** When an order left the kitchen: first time it was ready or done (the waiter may skip "ready"). */
function servedAt(o: Order): number | null {
  const h = o.history.find((x) => x.status === 'pronto' || x.status === 'concluido');
  return h ? Date.parse(h.at) : null;
}

/** Desserts on a table's orders: units and money (centavos). */
export function dessertTotals(orders: Order[], ctx: DessertContext) {
  let units = 0;
  let revenue = 0;
  for (const o of counted(orders)) {
    for (const l of o.lines) {
      if (!isDessertLine(ctx, l.productId)) continue;
      units += l.quantity;
      revenue += l.total;
    }
  }
  return { units, revenue };
}

export type DessertReason = 'tempo' | 'conta';

/**
 * Should this table be offered dessert now? Only tables in the test, with a main course and no dessert yet:
 * right away when they ask for the bill, otherwise `minutes` after the last main course left the kitchen
 * (and nothing else is still cooking).
 */
export function dessertDue(input: { cfg: Sobremesa; table: number; orders: Order[]; ctx: DessertContext; askedBill: boolean; now: Date }): DessertReason | null {
  const { cfg, ctx } = input;
  if (!inDessertTest(cfg, input.table)) return null;
  const orders = counted(input.orders);
  if (orders.some((o) => o.lines.some((l) => isDessertLine(ctx, l.productId)))) return null;
  const food = orders.filter((o) => o.lines.some((l) => isFoodLine(ctx, l.productId)));
  if (!food.length) return null;
  if (input.askedBill) return 'conta';
  if (food.some((o) => COOKING.includes(o.status))) return null;
  const served = food.map(servedAt).filter((t): t is number => t !== null);
  if (served.length < food.length) return null;
  return input.now.getTime() - Math.max(...served) >= cfg.minutes * 60_000 ? 'tempo' : null;
}

/** The desserts the prompt shows: the picked ones, then dessert items with 3D, then the rest; only available, at most 3. */
export function featuredDesserts(store: Pick<Store, 'catalog'>, cfg: Sobremesa): string[] {
  const cats = dessertCategoryIds(store, cfg);
  const all = store.catalog.categories.flatMap((c) => c.items.map((i) => ({ ...i, dessert: cats.has(c.id) })));
  const ok = all.filter((i) => i.available);
  const picked = cfg.featured.map((f) => ok.find((i) => i.id === f)).filter((i): i is (typeof ok)[number] => Boolean(i));
  const rest = ok.filter((i) => i.dessert && !picked.some((p) => p.id === i.id)).sort((a, b) => Number(Boolean(b.modelo3d)) - Number(Boolean(a.modelo3d)));
  return [...picked, ...rest].slice(0, 3).map((i) => i.id);
}

// ───────────────────────────── Measuring ─────────────────────────────

/** What a closed bill keeps about desserts (see SeatingRecord in mesas.ts). */
export interface DessertRecord {
  number: number;
  minutes: number;
  orders: number;
  desserts?: number;
  dessertRevenue?: number;
  /** The table was in the group that got the prompt. */
  dessertTest?: boolean;
  /** The waiter tapped "Já ofereci". */
  dessertOffered?: boolean;
}

export interface DessertGroup {
  tables: number;
  withDessert: number;
  /** 0–1. */
  rate: number;
  units: number;
  revenue: number;
  offered: number;
}

function group(list: DessertRecord[]): DessertGroup {
  const withDessert = list.filter((r) => (r.desserts ?? 0) > 0).length;
  return {
    tables: list.length,
    withDessert,
    rate: list.length ? withDessert / list.length : 0,
    units: list.reduce((n, r) => n + (r.desserts ?? 0), 0),
    revenue: list.reduce((n, r) => n + (r.dessertRevenue ?? 0), 0),
    offered: list.filter((r) => r.dessertOffered).length,
  };
}

/** Below this many tables in each group the difference is shown but marked as not reliable yet. */
export const DESSERT_RELIABLE = 30;

/**
 * The dessert rate of closed bills: all tables, the ones that got the prompt and the ones that did not (the half
 * test, or the weeks before turning it on). Only bills measured since this existed, with something ordered on the
 * panel, and of a normal length (5 min to 6 h, like the time-at-table analysis).
 */
export function dessertStats(records: DessertRecord[], minStay = 5, maxStay = 360) {
  const valid = records.filter((r) => typeof r.desserts === 'number' && r.orders > 0 && r.minutes >= minStay && r.minutes <= maxStay);
  const com = group(valid.filter((r) => r.dessertTest));
  const sem = group(valid.filter((r) => !r.dessertTest));
  return {
    all: group(valid),
    com,
    sem,
    /** Percentage points, prompt minus no prompt (null when a group is empty). */
    diff: com.tables && sem.tables ? Math.round((com.rate - sem.rate) * 1000) / 10 : null,
    reliable: com.tables >= DESSERT_RELIABLE && sem.tables >= DESSERT_RELIABLE,
  };
}
export type DessertStats = ReturnType<typeof dessertStats>;

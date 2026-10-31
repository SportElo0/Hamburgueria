// Pure cart model. All money is integer centavos.
import type { OptionGroup, Product } from '@/content/menu';

/** groupId → selected choice ids */
export type Selections = Record<string, string[]>;

export interface CartLine {
  lineId: string;
  productId: string;
  quantity: number;
  selections: Selections;
  notes: string;
}

export interface CartState {
  lines: CartLine[];
}

export type CartAction =
  | { type: 'add'; productId: string; quantity: number; selections: Selections; notes?: string }
  | { type: 'setQuantity'; lineId: string; quantity: number }
  | { type: 'remove'; lineId: string }
  | { type: 'update'; lineId: string; selections: Selections; notes: string; quantity: number }
  | { type: 'clear' }
  | { type: 'hydrate'; state: CartState };

export const MAX_QTY = 20;

const clampQty = (q: number) => Math.max(1, Math.min(MAX_QTY, Math.round(q)));

/** Stable identity: same product + same options + same notes merge into one line. */
export function lineKey(productId: string, selections: Selections, notes = '') {
  const sel = Object.keys(selections)
    .sort()
    .map((g) => `${g}:${[...selections[g]].sort().join(',')}`)
    .filter((s) => !s.endsWith(':'))
    .join('|');
  return `${productId}#${sel}#${notes.trim().toLowerCase()}`;
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const notes = (action.notes ?? '').trim();
      const key = lineKey(action.productId, action.selections, notes);
      const existing = state.lines.find((l) => l.lineId === key);
      if (existing) {
        return {
          lines: state.lines.map((l) => (l.lineId === key ? { ...l, quantity: clampQty(l.quantity + action.quantity) } : l)),
        };
      }
      return {
        lines: [
          ...state.lines,
          { lineId: key, productId: action.productId, quantity: clampQty(action.quantity), selections: action.selections, notes },
        ],
      };
    }
    case 'setQuantity':
      if (action.quantity <= 0) return { lines: state.lines.filter((l) => l.lineId !== action.lineId) };
      return { lines: state.lines.map((l) => (l.lineId === action.lineId ? { ...l, quantity: clampQty(action.quantity) } : l)) };
    case 'update': {
      const line = state.lines.find((l) => l.lineId === action.lineId);
      if (!line) return state;
      const notes = action.notes.trim();
      const key = lineKey(line.productId, action.selections, notes);
      const others = state.lines.filter((l) => l.lineId !== action.lineId);
      const clash = others.find((l) => l.lineId === key);
      if (clash) {
        return { lines: others.map((l) => (l.lineId === key ? { ...l, quantity: clampQty(l.quantity + action.quantity) } : l)) };
      }
      return {
        lines: state.lines.map((l) =>
          l.lineId === action.lineId ? { ...l, lineId: key, selections: action.selections, notes, quantity: clampQty(action.quantity) } : l,
        ),
      };
    }
    case 'remove':
      return { lines: state.lines.filter((l) => l.lineId !== action.lineId) };
    case 'clear':
      return { lines: [] };
    case 'hydrate':
      return action.state;
  }
}

export interface PricedSelection {
  group: OptionGroup;
  choice: { id: string; label: string; priceDelta: number };
}

export function resolveSelections(product: Product, selections: Selections): PricedSelection[] {
  const out: PricedSelection[] = [];
  for (const group of product.options ?? []) {
    const picked = selections[group.id] ?? [];
    for (const choice of group.choices) {
      if (picked.includes(choice.id)) out.push({ group, choice });
    }
  }
  return out;
}

/** Unit price = base + chargeable extras. Included choices never add cost. */
export function unitPrice(product: Product, selections: Selections): number {
  return resolveSelections(product, selections).reduce(
    (sum, { group, choice }) => sum + (group.included ? 0 : choice.priceDelta),
    product.price,
  );
}

export function lineTotal(product: Product, line: Pick<CartLine, 'selections' | 'quantity'>): number {
  return unitPrice(product, line.selections) * line.quantity;
}

export function cartTotals(lines: CartLine[], lookup: (id: string) => Product | undefined) {
  let subtotal = 0;
  let count = 0;
  for (const line of lines) {
    const p = lookup(line.productId);
    if (!p) continue;
    subtotal += lineTotal(p, line);
    count += line.quantity;
  }
  return { subtotal, total: subtotal, count };
}

/** Returns the groups that still need an answer before the item can be added. */
export function missingRequired(product: Product, selections: Selections): OptionGroup[] {
  return (product.options ?? []).filter((g) => g.required && !(selections[g.id]?.length > 0));
}

export function defaultSelections(product: Product): Selections {
  const sel: Selections = {};
  for (const g of product.options ?? []) sel[g.id] = g.variant ? [g.choices[0].id] : [];
  return sel;
}

/** Drops lines whose product no longer exists or whose saved choices are no longer valid. */
export function sanitize(state: unknown, lookup: (id: string) => Product | undefined): CartState {
  if (!state || typeof state !== 'object' || !Array.isArray((state as CartState).lines)) return { lines: [] };
  const lines: CartLine[] = [];
  for (const raw of (state as CartState).lines) {
    const p = raw && lookup(raw.productId);
    if (!p || typeof raw.quantity !== 'number') continue;
    const selections: Selections = {};
    for (const g of p.options ?? []) {
      const valid = (raw.selections?.[g.id] ?? []).filter((id: string) => g.choices.some((c) => c.id === id));
      selections[g.id] = g.type === 'single' ? valid.slice(0, 1) : valid;
    }
    if (missingRequired(p, selections).length) continue;
    const notes = typeof raw.notes === 'string' ? raw.notes.slice(0, 140) : '';
    lines.push({ lineId: lineKey(p.id, selections, notes), productId: p.id, quantity: clampQty(raw.quantity), selections, notes });
  }
  return { lines };
}

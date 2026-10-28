import { SOLD_STATUSES, effectiveStatus, type Order, type PaymentMethod } from '../ordering';
import { unitCostOf, type CostSheet } from './custos';

/**
 * Análise de vendas e margens de uma loja. Funções puras: tudo é calculado aqui, em
 * centavos inteiros, a partir dos pedidos gravados. Nenhum número vem de IA.
 *
 * Regras:
 * - Conta como venda o pedido aceito pela loja (em preparo, a caminho, pronto ou entregue)
 *   e que não foi devolvido. Recusados, Pix não pagos e devolvidos ficam de fora.
 * - Margem de contribuição de um item = receita do item (com o desconto do cupom rateado)
 *   − taxa do meio de pagamento − custo direto (insumos + embalagem). Não é lucro:
 *   aluguel, salários, entrega e impostos não entram.
 * - Itens sem custo informado aparecem, mas ficam fora da matriz e das margens.
 */

export type DayOrders = { day: string; orders: Order[] };

export const MIN_ORDERS_TO_COMPARE = 30;

export type MenuClass = 'estrela' | 'cavalo-de-batalha' | 'quebra-cabeca' | 'abacaxi';

export const MENU_CLASS_LABEL: Record<MenuClass, string> = {
  estrela: 'Estrela',
  'cavalo-de-batalha': 'Cavalo de batalha',
  'quebra-cabeca': 'Quebra-cabeça',
  abacaxi: 'Abacaxi',
};

export const MENU_CLASS_HINT: Record<MenuClass, string> = {
  estrela: 'Vende muito e deixa boa margem.',
  'cavalo-de-batalha': 'Vende muito, mas deixa pouca margem.',
  'quebra-cabeca': 'Deixa boa margem, mas vende pouco.',
  abacaxi: 'Vende pouco e deixa pouca margem.',
};

export interface ProductRow {
  productId: string;
  name: string;
  quantity: number;
  /** Receita do item já com o desconto rateado, em centavos. */
  revenue: number;
  /** Preço médio efetivo por unidade. */
  averagePrice: number;
  /** Custo direto por unidade, ou null quando não informado. */
  unitCost: number | null;
  fees: number;
  /** Margem de contribuição total e por unidade (null sem custo). */
  contribution: number | null;
  unitContribution: number | null;
  /** Margem sobre a receita, 0–1. */
  marginRate: number | null;
  /** Categoria do cardápio (a matriz compara itens da mesma categoria). */
  category: string;
  /** Participação na quantidade vendida entre os itens com custo da mesma categoria, 0–1. */
  mixShare: number | null;
  menuClass: MenuClass | null;
}

export interface Period {
  from: string;
  to: string;
  days: number;
  orders: number;
  revenue: number;
  itemsRevenue: number;
  deliveryFees: number;
  discounts: number;
  average: number;
  refused: number;
  abandoned: number;
  refunded: number;
  customers: number;
  returning: number;
}

export interface MatrixGroup {
  category: string;
  /** Participação mínima para contar como "vende muito" (70% da média da categoria). */
  popularityThreshold: number;
  /** Margem por unidade média da categoria, ponderada pela quantidade. */
  marginThreshold: number;
  items: number;
}

export interface Comparison {
  /** Variação relativa (0,1 = +10%) ou null sem base. */
  revenue: number | null;
  orders: number | null;
  average: number | null;
  /** Os dois períodos têm pedidos suficientes para comparar com segurança. */
  reliable: boolean;
}

export interface Analysis {
  current: Period;
  previous: Period;
  comparison: Comparison;
  products: ProductRow[];
  /** Fatia da receita de itens que tem custo informado, 0–1. */
  costCoverage: number;
  /** Margem de contribuição dos itens com custo (null sem nenhum custo). */
  contribution: number | null;
  contributionRate: number | null;
  /** Limites usados na matriz de cada categoria, para mostrar os critérios. */
  matrix: MatrixGroup[];
  byHour: number[];
  byWeekday: number[];
  feesConfirmed: boolean;
}

const TZ = 'America/Sao_Paulo';
const hourSP = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' });

const isSale = (o: Order, now: number) =>
  SOLD_STATUSES.includes(effectiveStatus(o, now)) && o.payment.status !== 'devolvido' && o.payment.status !== 'devolver';

function period(days: DayOrders[], now: number): Period {
  const p: Period = {
    from: days[0]?.day ?? '',
    to: days[days.length - 1]?.day ?? '',
    days: days.length,
    orders: 0,
    revenue: 0,
    itemsRevenue: 0,
    deliveryFees: 0,
    discounts: 0,
    average: 0,
    refused: 0,
    abandoned: 0,
    refunded: 0,
    customers: 0,
    returning: 0,
  };
  const phones = new Map<string, number>();
  for (const { orders } of days) {
    for (const o of orders) {
      const status = effectiveStatus(o, now);
      if (status === 'recusado') p.refused++;
      if (status === 'expirado') p.abandoned++;
      if (SOLD_STATUSES.includes(status) && (o.payment.status === 'devolvido' || o.payment.status === 'devolver')) p.refunded++;
      if (!isSale(o, now)) continue;
      p.orders++;
      p.revenue += o.total;
      p.deliveryFees += o.deliveryFee;
      p.discounts += o.discount ?? 0;
      p.itemsRevenue += o.total - o.deliveryFee;
      phones.set(o.customer.phone, (phones.get(o.customer.phone) ?? 0) + 1);
    }
  }
  p.average = p.orders ? Math.round(p.revenue / p.orders) : 0;
  p.customers = phones.size;
  p.returning = [...phones.values()].filter((n) => n > 1).length;
  return p;
}

const change = (now: number, before: number) => (before > 0 ? (now - before) / before : null);

/**
 * Receita de cada linha com o desconto do pedido rateado pelo valor dos itens.
 * O desconto de "entrega grátis" também é rateado: o painel não guarda o tipo do cupom no pedido.
 */
function lineRevenues(o: Order): number[] {
  const subtotal = o.lines.reduce((s, l) => s + l.total, 0);
  const discount = Math.min(o.discount ?? 0, subtotal);
  if (!discount || !subtotal) return o.lines.map((l) => l.total);
  let given = 0;
  return o.lines.map((l, i) => {
    const share = i === o.lines.length - 1 ? discount - given : Math.round((discount * l.total) / subtotal);
    given += share;
    return l.total - share;
  });
}

export function analyze(input: {
  current: DayOrders[];
  previous: DayOrders[];
  sheet: CostSheet;
  /** Categoria de cada produto no cardápio atual; sem ela, tudo vira uma categoria só. */
  categoryOf?: (productId: string) => string | undefined;
  now?: number;
}): Analysis {
  const now = input.now ?? Date.now();
  const { sheet } = input;
  const current = period(input.current, now);
  const previous = period(input.previous, now);

  const rows = new Map<string, { name: string; quantity: number; revenue: number; fees: number }>();
  const byHour = Array.from({ length: 24 }, () => 0);
  const byWeekday = Array.from({ length: 7 }, () => 0);

  for (const { day, orders } of input.current) {
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
    for (const o of orders) {
      if (!isSale(o, now)) continue;
      byHour[Number(hourSP.format(new Date(o.createdAt))) % 24]++;
      byWeekday[weekday]++;
      const rate = (sheet.fees[o.payment.method as PaymentMethod] ?? 0) / 10_000;
      const revenues = lineRevenues(o);
      o.lines.forEach((l, i) => {
        const row = rows.get(l.productId) ?? { name: l.name, quantity: 0, revenue: 0, fees: 0 };
        row.name = l.name;
        row.quantity += l.quantity;
        row.revenue += revenues[i];
        row.fees += Math.round(revenues[i] * rate);
        rows.set(l.productId, row);
      });
    }
  }

  const products: ProductRow[] = [...rows.entries()].map(([productId, r]) => {
    const unitCost = unitCostOf(sheet, productId);
    const contribution = unitCost === null ? null : r.revenue - r.fees - unitCost * r.quantity;
    return {
      productId,
      name: r.name,
      quantity: r.quantity,
      revenue: r.revenue,
      averagePrice: r.quantity ? Math.round(r.revenue / r.quantity) : 0,
      unitCost,
      fees: r.fees,
      contribution,
      unitContribution: contribution === null || !r.quantity ? null : Math.round(contribution / r.quantity),
      marginRate: contribution === null || !r.revenue ? null : contribution / r.revenue,
      category: input.categoryOf?.(productId) ?? 'Outros',
      mixShare: null,
      menuClass: null,
    };
  });

  // Matriz de engenharia de cardápio (Kasavana & Smith), dentro de cada categoria: popularidade
  // pela participação na quantidade (alta se ≥ 70% da média) e margem pela margem por unidade
  // (alta se ≥ média ponderada). Comparar burger com refrigerante não diria nada.
  const costed = products.filter((p) => p.unitContribution !== null && p.quantity > 0);
  const matrix: MatrixGroup[] = [];
  const groups = new Map<string, ProductRow[]>();
  for (const p of costed) groups.set(p.category, [...(groups.get(p.category) ?? []), p]);
  for (const [category, group] of groups) {
    if (group.length < 2) continue;
    const totalQty = group.reduce((s, p) => s + p.quantity, 0);
    const totalContribution = group.reduce((s, p) => s + (p.contribution ?? 0), 0);
    const popularityThreshold = 0.7 / group.length;
    const marginThreshold = Math.round(totalContribution / totalQty);
    for (const p of group) {
      p.mixShare = p.quantity / totalQty;
      const popular = p.mixShare >= popularityThreshold;
      const profitable = (p.unitContribution ?? 0) >= marginThreshold;
      p.menuClass = popular ? (profitable ? 'estrela' : 'cavalo-de-batalha') : profitable ? 'quebra-cabeca' : 'abacaxi';
    }
    matrix.push({ category, popularityThreshold, marginThreshold, items: group.length });
  }

  const itemsRevenue = products.reduce((s, p) => s + p.revenue, 0);
  const costedRevenue = costed.reduce((s, p) => s + p.revenue, 0);
  const contribution = costed.length ? costed.reduce((s, p) => s + (p.contribution ?? 0), 0) : null;

  products.sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity);

  return {
    current,
    previous,
    comparison: {
      revenue: change(current.revenue, previous.revenue),
      orders: change(current.orders, previous.orders),
      average: change(current.average, previous.average),
      reliable: current.orders >= MIN_ORDERS_TO_COMPARE && previous.orders >= MIN_ORDERS_TO_COMPARE,
    },
    products,
    costCoverage: itemsRevenue ? costedRevenue / itemsRevenue : 0,
    contribution,
    contributionRate: contribution === null || !costedRevenue ? null : contribution / costedRevenue,
    matrix,
    byHour,
    byWeekday,
    feesConfirmed: sheet.feesConfirmed,
  };
}

export interface PriceSimulation {
  price: number;
  unitContribution: number;
  /** Quantas unidades vender no novo preço para manter a mesma margem total do período. */
  breakEvenQuantity: number | null;
  /** Variação de volume que ainda mantém a margem total (−0,1 = pode vender 10% menos). */
  volumeTolerance: number | null;
}

/**
 * Simulação de preço de um item (não muda nada no cardápio). Considera o custo e a taxa
 * média do item no período; não prevê quanto o cliente vai comprar.
 */
export function simulatePrice(row: ProductRow, newPrice: number): PriceSimulation | null {
  if (row.unitCost === null || !row.quantity || row.contribution === null) return null;
  const feeRate = row.revenue ? row.fees / row.revenue : 0;
  const unitContribution = Math.round(newPrice - newPrice * feeRate - row.unitCost);
  if (unitContribution <= 0) return { price: newPrice, unitContribution, breakEvenQuantity: null, volumeTolerance: null };
  const breakEvenQuantity = Math.ceil(row.contribution / unitContribution);
  return {
    price: newPrice,
    unitContribution,
    breakEvenQuantity,
    volumeTolerance: breakEvenQuantity / row.quantity - 1,
  };
}

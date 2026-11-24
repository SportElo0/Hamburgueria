import type { DaySummary } from './inteligencia/resumo';

/**
 * Contas da tela "Resumo geral" do painel do dono, só com os resumos diários (sem ler pedido
 * nenhum de novo). `days` vem do mais antigo ao mais novo e o último é hoje.
 */

export interface Kpi {
  value: number;
  /** O mesmo número no período de comparação (null quando não há base). */
  before: number | null;
}

export interface ResumoDono {
  hoje: { vendas: Kpi; pedidos: Kpi; dia: string; diaAntes: string };
  semana: { vendas: Kpi; pedidos: Kpi; ticket: Kpi };
  /** Pedidos por hora nos dias lidos, 24 posições (horário de São Paulo). */
  porHora: number[];
  diasNoPico: number;
  /** Itens mais pedidos dos últimos 7 dias, do mais ao menos pedido. */
  maisVendidos: { id: string; name: string; quantity: number }[];
  /** O item do cardápio que menos saiu na semana (entre os que existem hoje), ou null. */
  menosVendido: { id: string; name: string; quantity: number } | null;
}

const sum = (days: DaySummary[], f: (d: DaySummary) => number) => days.reduce((n, d) => n + f(d), 0);

/**
 * @param days pelo menos 14 dias (os 7 últimos são "esta semana"; os 7 antes, a anterior). Mais dias
 *   entram só nos horários de pico.
 * @param menu itens que estão no cardápio agora, para achar o que menos sai (inclusive os que não saíram).
 */
export function montarResumo(days: DaySummary[], menu: { id: string; name: string }[]): ResumoDono {
  const n = days.length;
  const today = days[n - 1];
  const sameDayLastWeek = n >= 8 ? days[n - 8] : null;
  const week = days.slice(Math.max(0, n - 7));
  const prevWeek = n >= 14 ? days.slice(n - 14, n - 7) : [];
  const has = prevWeek.length === 7;

  const weekRevenue = sum(week, (d) => d.revenue);
  const weekOrders = sum(week, (d) => d.orders);
  const prevRevenue = sum(prevWeek, (d) => d.revenue);
  const prevOrders = sum(prevWeek, (d) => d.orders);

  const porHora = Array.from({ length: 24 }, (_, h) => sum(days, (d) => d.byHour?.[h] ?? 0));

  const qty = new Map<string, { name: string; quantity: number }>();
  for (const d of week) {
    for (const [id, p] of Object.entries(d.products)) {
      const cur = qty.get(id);
      qty.set(id, { name: p.name, quantity: (cur?.quantity ?? 0) + p.quantity });
    }
  }
  const ranked = [...qty.entries()].map(([id, p]) => ({ id, ...p })).sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name, 'pt-BR'));
  // Menos pedido: só itens que ainda estão no cardápio; um que não saiu nenhuma vez conta como zero.
  const onMenu = menu.map((m) => ({ id: m.id, name: qty.get(m.id)?.name ?? m.name, quantity: qty.get(m.id)?.quantity ?? 0 }));
  const top = ranked.slice(0, 5);
  const least = weekOrders > 0 ? [...onMenu].sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name, 'pt-BR'))[0] : undefined;

  return {
    hoje: {
      vendas: { value: today?.revenue ?? 0, before: sameDayLastWeek ? sameDayLastWeek.revenue : null },
      pedidos: { value: today?.orders ?? 0, before: sameDayLastWeek ? sameDayLastWeek.orders : null },
      dia: today?.day ?? '',
      diaAntes: sameDayLastWeek?.day ?? '',
    },
    semana: {
      vendas: { value: weekRevenue, before: has ? prevRevenue : null },
      pedidos: { value: weekOrders, before: has ? prevOrders : null },
      ticket: { value: weekOrders ? Math.round(weekRevenue / weekOrders) : 0, before: has && prevOrders ? Math.round(prevRevenue / prevOrders) : null },
    },
    porHora,
    diasNoPico: n,
    maisVendidos: top,
    menosVendido: least && !top.some((t) => t.id === least.id) ? least : null,
  };
}

/** Variação para mostrar ("12% a mais"), ou null quando não dá para comparar. */
export function variacao(k: Kpi): number | null {
  if (k.before === null || k.before <= 0) return null;
  return (k.value - k.before) / k.before;
}

/** As horas com movimento, da primeira à última, para o gráfico não mostrar a madrugada vazia. */
export function horasComMovimento(porHora: number[]): number[] {
  const first = porHora.findIndex((v) => v > 0);
  if (first < 0) return [];
  let last = 23;
  while (porHora[last] === 0) last--;
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

/** Lucro por unidade e margem sobre o preço (null sem custo). Antes de taxas e impostos. */
export function margem(price: number, cost: number | null): { lucro: number; taxa: number } | null {
  if (cost === null || price <= 0) return null;
  return { lucro: price - cost, taxa: (price - cost) / price };
}

/** Margem abaixo disso aparece em alerta para o dono. */
export const MARGEM_BAIXA = 0.3;

/** "12,50", "R$ 1.234,5" or "12.5" → centavos; "" → null; anything else → NaN. */
export function parseReais(text: string): number | null {
  const t = text.replace(/R\$|\s/g, '');
  if (!t) return null;
  const normal = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
  if (!/^\d+(\.\d{0,2})?$/.test(normal)) return NaN;
  return Math.round(Number(normal) * 100);
}

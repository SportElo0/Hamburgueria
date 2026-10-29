import { createHmac } from 'node:crypto';
import { SOLD_STATUSES, effectiveStatus, PAYMENT_METHODS, type Order, type PaymentMethod } from '../ordering';

/**
 * Resumo de um dia de pedidos: só os totais que a análise usa, sem nome, telefone ou endereço.
 * Os dias fechados ficam guardados num documento por mês, e a análise de 90 dias lê uns
 * poucos documentos em vez de 180 (um por dia). Funções puras: nada aqui lê ou grava.
 *
 * O resumo não depende da ficha de custos: guarda a receita de cada item por meio de pagamento,
 * e a taxa e o custo são aplicados na hora da análise. Mudar um custo não pede para refazer nada.
 */

export const SUMMARY_VERSION = 2;

export type DayOrders = { day: string; orders: Order[] };

export interface ProductDay {
  name: string;
  quantity: number;
  /** Receita do item com o desconto do cupom rateado, em centavos, por meio de pagamento. */
  revenue: Record<PaymentMethod, number>;
}

export interface DaySummary {
  day: string;
  orders: number;
  revenue: number;
  itemsRevenue: number;
  deliveryFees: number;
  discounts: number;
  refused: number;
  abandoned: number;
  refunded: number;
  /** Pedidos por cliente. A chave é um código do telefone com segredo e por loja (ver customerCode). */
  customers: Record<string, number>;
  /** Pedidos vendidos por hora do dia (horário de São Paulo), 24 posições. */
  byHour: number[];
  products: Record<string, ProductDay>;
}

/** Documento de um mês: os dias fechados já resumidos. */
export interface MonthSummary {
  version: number;
  days: Record<string, DaySummary>;
}

export const monthSummaryKey = (slug: string, month: string) => `inteligencia/${slug}/resumo/${month}.json`;

const TZ = 'America/Sao_Paulo';
const hourSP = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' });

export const isSale = (o: Order, now: number) =>
  SOLD_STATUSES.includes(effectiveStatus(o, now)) && o.payment.status !== 'devolvido' && o.payment.status !== 'devolver';

/**
 * Código do cliente: HMAC-SHA256 dos dígitos do telefone com uma chave secreta da loja, 12 caracteres.
 * Só serve para contar clientes e quem voltou. Sem a chave não dá para testar telefones, e o mesmo
 * cliente tem códigos diferentes em lojas diferentes. Continua sendo dado pessoal (pseudônimo).
 */
export function customerCode(phone: string, key: string) {
  return createHmac('sha256', key).update(phone.replace(/\D/g, '') || phone).digest('hex').slice(0, 12);
}

/**
 * Receita de cada linha com o desconto do pedido rateado pelo valor dos itens.
 * O desconto de "entrega grátis" também é rateado: o painel não guarda o tipo do cupom no pedido.
 */
export function lineRevenues(o: Order): number[] {
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

const zeroByMethod = (): Record<PaymentMethod, number> => Object.fromEntries(PAYMENT_METHODS.map((m) => [m, 0])) as Record<PaymentMethod, number>;

/** `key`: chave secreta da loja para o código do cliente (summaryKeyFor em dados.ts). */
export function summarizeDay(day: string, orders: Order[], now: number, key: string): DaySummary {
  const s: DaySummary = {
    day,
    orders: 0,
    revenue: 0,
    itemsRevenue: 0,
    deliveryFees: 0,
    discounts: 0,
    refused: 0,
    abandoned: 0,
    refunded: 0,
    customers: {},
    byHour: Array.from({ length: 24 }, () => 0),
    products: {},
  };
  for (const o of orders) {
    const status = effectiveStatus(o, now);
    if (status === 'recusado') s.refused++;
    if (status === 'expirado') s.abandoned++;
    if (SOLD_STATUSES.includes(status) && (o.payment.status === 'devolvido' || o.payment.status === 'devolver')) s.refunded++;
    if (!isSale(o, now)) continue;
    s.orders++;
    s.revenue += o.total;
    s.deliveryFees += o.deliveryFee;
    s.discounts += o.discount ?? 0;
    s.itemsRevenue += o.total - o.deliveryFee;
    const code = customerCode(o.customer.phone, key);
    s.customers[code] = (s.customers[code] ?? 0) + 1;
    s.byHour[Number(hourSP.format(new Date(o.createdAt))) % 24]++;
    const method: PaymentMethod = PAYMENT_METHODS.includes(o.payment.method) ? o.payment.method : 'dinheiro';
    const revenues = lineRevenues(o);
    o.lines.forEach((l, i) => {
      const p = (s.products[l.productId] ??= { name: l.name, quantity: 0, revenue: zeroByMethod() });
      p.name = l.name;
      p.quantity += l.quantity;
      p.revenue[method] += revenues[i];
    });
  }
  return s;
}

export const summarize = (days: DayOrders[], now: number, key: string) => days.map(({ day, orders }) => summarizeDay(day, orders, now, key));

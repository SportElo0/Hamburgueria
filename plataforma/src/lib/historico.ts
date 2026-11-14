import { effectiveStatus, type Order, type OrderMode, type OrderStatus } from './ordering';

/** The owner's order history (Painel do dono › Pedidos e delivery): one day, filtered by channel and outcome. */

export const SITUACOES = ['todos', 'andamento', 'concluido', 'cancelado'] as const;
export type Situacao = (typeof SITUACOES)[number];
export const MODOS = ['todos', 'entrega', 'retirada', 'mesa'] as const;
export type Modo = (typeof MODOS)[number];

const CANCELADOS: OrderStatus[] = ['recusado', 'expirado'];

export function situacaoDe(status: OrderStatus): Exclude<Situacao, 'todos'> {
  if (status === 'concluido') return 'concluido';
  if (CANCELADOS.includes(status)) return 'cancelado';
  return 'andamento';
}

/** The day's orders with their current status, newest first, kept to the channel and outcome asked for. */
export function filtrarPedidos(orders: Order[], filtro: { modo: Modo; situacao: Situacao }, now = Date.now()): Order[] {
  return orders
    .map((o) => ({ ...o, status: effectiveStatus(o, now) }))
    .filter((o) => filtro.modo === 'todos' || o.mode === (filtro.modo as OrderMode))
    .filter((o) => filtro.situacao === 'todos' || situacaoDe(o.status) === filtro.situacao)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** A query value from the address bar, or the default when it is anything else. */
export function escolha<T extends readonly string[]>(lista: T, valor: unknown, padrao: T[number]): T[number] {
  return typeof valor === 'string' && (lista as readonly string[]).includes(valor) ? (valor as T[number]) : padrao;
}

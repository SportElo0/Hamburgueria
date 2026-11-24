import { describe, expect, it } from 'vitest';
import { escolha, filtrarPedidos, MODOS, situacaoDe } from '@/lib/historico';
import type { Order } from '@/lib/ordering';

const pedido = (id: string, mode: Order['mode'], status: Order['status'], createdAt: string) =>
  ({ id, number: 1, mode, status, createdAt, updatedAt: createdAt, history: [], payment: { method: 'pix', status: 'pago', changeFor: null, pix: null, paidAt: null }, lines: [], total: 1000 }) as unknown as Order;

describe('histórico de pedidos do dono', () => {
  const lista = [
    pedido('a', 'entrega', 'concluido', '2026-11-05T12:00:00Z'),
    pedido('b', 'mesa', 'preparo', '2026-11-05T13:00:00Z'),
    pedido('c', 'retirada', 'recusado', '2026-11-05T11:00:00Z'),
  ];

  it('mais novo primeiro, filtrando por canal e situação', () => {
    expect(filtrarPedidos(lista, { modo: 'todos', situacao: 'todos' }).map((o) => o.id)).toEqual(['b', 'a', 'c']);
    expect(filtrarPedidos(lista, { modo: 'mesa', situacao: 'todos' }).map((o) => o.id)).toEqual(['b']);
    expect(filtrarPedidos(lista, { modo: 'todos', situacao: 'cancelado' }).map((o) => o.id)).toEqual(['c']);
    expect(filtrarPedidos(lista, { modo: 'entrega', situacao: 'andamento' })).toEqual([]);
  });

  it('agrupa os status', () => {
    expect(situacaoDe('concluido')).toBe('concluido');
    expect(situacaoDe('expirado')).toBe('cancelado');
    expect(situacaoDe('aguardando-garcom')).toBe('andamento');
  });

  it('valor da barra de endereço fora da lista vira o padrão', () => {
    expect(escolha(MODOS, 'mesa', 'todos')).toBe('mesa');
    expect(escolha(MODOS, '<script>', 'todos')).toBe('todos');
    expect(escolha(MODOS, undefined, 'todos')).toBe('todos');
  });
});

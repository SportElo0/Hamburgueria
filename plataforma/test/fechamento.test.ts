import { describe, expect, it } from 'vitest';
import { fecharDia } from '@/lib/fechamento';
import type { Order } from '@/lib/ordering';

const o = (p: Partial<Order> & { pay?: Partial<Order['payment']> }): Order =>
  ({
    id: Math.random().toString(36),
    status: 'concluido',
    mode: 'retirada',
    total: 1000,
    discount: 0,
    deliveryFee: 0,
    ...p,
    payment: { method: 'pix', status: 'pago', changeFor: null, pix: null, paidAt: null, ...p.pay },
  }) as Order;

describe('fechamento do dia', () => {
  it('soma por forma de pagamento e por canal, separa o que está em aberto', () => {
    const f = fecharDia(
      '2026-11-05',
      [
        o({ total: 5000 }),
        o({ total: 3000, pay: { method: 'cartao' } }),
        o({ total: 2000, mode: 'entrega', deliveryFee: 700, pay: { method: 'dinheiro' } }),
        o({ total: 4000, mode: 'entrega', status: 'saiu', pay: { method: 'cartao', status: 'na-entrega' } }),
        o({ total: 2500, mode: 'retirada', pay: { method: 'dinheiro', status: 'na-entrega' } }),
        o({ total: 6000, mode: 'mesa', status: 'preparo', pay: { method: 'cartao', status: 'na-mesa' } }),
        o({ total: 9999, status: 'recusado' }),
        o({ total: 1500, pay: { status: 'devolvido' } }),
        o({ total: 800, status: 'aguardando-pix', pay: { status: 'pendente' } }),
        o({ total: 1200, discount: 300 }),
      ],
      [{ total: 8000, servico: 800, couvert: 1000, credit: 2000 }],
    );
    expect(f.porForma).toEqual({ pix: { pedidos: 2, valor: 6200 }, cartao: { pedidos: 1, valor: 3000 }, dinheiro: { pedidos: 2, valor: 4500 } });
    expect(f.recebido).toBe(13700);
    expect(f.emAberto).toEqual({ pedidos: 2, valor: 10000 });
    expect(f.porCanal).toEqual({ entrega: { pedidos: 2, valor: 6000 }, retirada: { pedidos: 4, valor: 11700 }, mesa: { pedidos: 1, valor: 6000 } });
    expect(f).toMatchObject({ servico: 800, couvert: 1000, sinais: 2000, descontos: 300, entregas: 700, recusados: 1, devolvidos: { pedidos: 1, valor: 1500 } });
  });
});

import { describe, expect, it } from 'vitest';
import { analyze, simulatePrice } from '@/lib/inteligencia/analise';
import { costSheetSchema, EMPTY_COST_SHEET, unitCostOf, type CostSheet } from '@/lib/inteligencia/custos';
import { recommend } from '@/lib/inteligencia/recomendacoes';
import { demoCostSheet, demoOrders, demoStore } from '@/lib/inteligencia/demo';
import type { Order } from '@/lib/ordering';

const NOW = Date.parse('2026-10-28T20:00:00Z');

function order(partial: Partial<Order> & { lines: Order['lines'] }): Order {
  const subtotal = partial.lines.reduce((s, l) => s + l.total, 0);
  const discount = partial.discount ?? 0;
  const deliveryFee = partial.deliveryFee ?? 0;
  return {
    id: '20261028-abcdefghij',
    number: 1,
    tokenHash: '',
    createdAt: '2026-10-28T22:00:00Z',
    updatedAt: '2026-10-28T22:00:00Z',
    status: 'concluido',
    history: [],
    customer: { name: 'Teste', phone: '11999990000', email: '' },
    mode: 'retirada',
    address: null,
    payment: { method: 'pix', status: 'pago', changeFor: null, pix: null, paidAt: null },
    subtotal,
    deliveryFee,
    feePending: false,
    discount,
    coupon: '',
    total: subtotal - discount + deliveryFee,
    note: '',
    reason: '',
    ...partial,
  };
}

const line = (productId: string, quantity: number, unit: number): Order['lines'][number] => ({
  productId,
  name: productId,
  quantity,
  unit,
  total: unit * quantity,
  options: [],
  notes: '',
});

const sheet = (over: Partial<CostSheet> = {}): CostSheet => ({
  ...EMPTY_COST_SHEET,
  ingredients: [{ id: 'carne', name: 'Carne', unit: 'kg', costPerUnit: 5000 }],
  products: {
    burger: { mode: 'ficha', unitCost: null, recipe: [{ ingredientId: 'carne', quantity: 0.2 }], packaging: 100 },
    refri: { mode: 'manual', unitCost: 300, recipe: [], packaging: 0 },
  },
  ...over,
});

describe('custos', () => {
  it('soma a ficha técnica e a embalagem em centavos', () => {
    expect(unitCostOf(sheet(), 'burger')).toBe(1100);
    expect(unitCostOf(sheet(), 'refri')).toBe(300);
    expect(unitCostOf(sheet(), 'sem-ficha')).toBeNull();
  });

  it('usa a embalagem padrão quando o produto não define a sua', () => {
    const s = sheet({ packagingDefault: 50 });
    s.products.refri.packaging = null;
    expect(unitCostOf(s, 'refri')).toBe(350);
  });

  it('não calcula custo com insumo apagado', () => {
    const s = sheet();
    s.ingredients = [];
    expect(unitCostOf(s, 'burger')).toBeNull();
  });

  it('recusa taxa negativa ou absurda', () => {
    expect(costSheetSchema.safeParse({ ...EMPTY_COST_SHEET, fees: { pix: -1, cartao: 0, dinheiro: 0 } }).success).toBe(false);
    expect(costSheetSchema.safeParse({ ...EMPTY_COST_SHEET, fees: { pix: 0, cartao: 9000, dinheiro: 0 } }).success).toBe(false);
  });
});

describe('análise', () => {
  it('conta só vendas aceitas e não devolvidas', () => {
    const a = analyze({
      previous: [],
      current: [
        {
          day: '2026-10-28',
          orders: [
            order({ lines: [line('burger', 1, 3000)] }),
            order({ lines: [line('burger', 1, 3000)], status: 'recusado' }),
            order({ lines: [line('burger', 1, 3000)], payment: { method: 'pix', status: 'devolvido', changeFor: null, pix: null, paidAt: null } }),
          ],
        },
      ],
      sheet: sheet(),
      now: NOW,
    });
    expect(a.current.orders).toBe(1);
    expect(a.current.revenue).toBe(3000);
    expect(a.current.refused).toBe(1);
    expect(a.current.refunded).toBe(1);
  });

  it('desconta taxa do meio de pagamento e custo na margem de contribuição', () => {
    const a = analyze({
      previous: [],
      current: [{ day: '2026-10-28', orders: [order({ lines: [line('burger', 2, 3000)], payment: { method: 'cartao', status: 'na-entrega', changeFor: null, pix: null, paidAt: null } })] }],
      sheet: sheet({ fees: { pix: 0, cartao: 500, dinheiro: 0 } }),
      now: NOW,
    });
    const burger = a.products.find((p) => p.productId === 'burger')!;
    // 6000 de receita − 5% (300) − 2 × 1100 = 3500
    expect(burger.fees).toBe(300);
    expect(burger.contribution).toBe(3500);
    expect(burger.unitContribution).toBe(1750);
  });

  it('rateia o desconto do cupom entre os itens e ignora a taxa de entrega', () => {
    const a = analyze({
      previous: [],
      current: [{ day: '2026-10-28', orders: [order({ lines: [line('burger', 1, 3000), line('refri', 1, 1000)], discount: 400, deliveryFee: 700 })] }],
      sheet: sheet(),
      now: NOW,
    });
    expect(a.products.find((p) => p.productId === 'burger')!.revenue).toBe(2700);
    expect(a.products.find((p) => p.productId === 'refri')!.revenue).toBe(900);
    expect(a.current.itemsRevenue).toBe(3600);
  });

  it('deixa fora da matriz quem não tem custo e mede a cobertura', () => {
    const a = analyze({
      previous: [],
      current: [{ day: '2026-10-28', orders: [order({ lines: [line('burger', 1, 3000), line('refri', 1, 1000), line('sobremesa', 1, 1000)] })] }],
      sheet: sheet(),
      now: NOW,
    });
    expect(a.products.find((p) => p.productId === 'sobremesa')!.menuClass).toBeNull();
    expect(a.costCoverage).toBeCloseTo(0.8);
    expect(a.matrix[0]?.items).toBe(2);
  });

  it('só compara períodos com pedidos suficientes', () => {
    const few = analyze({ previous: [{ day: 'a', orders: [order({ lines: [line('burger', 1, 3000)] })] }], current: [{ day: 'b', orders: [order({ lines: [line('burger', 1, 3000)] })] }], sheet: sheet(), now: NOW });
    expect(few.comparison.reliable).toBe(false);
  });
});

describe('simulação de preço', () => {
  it('diz quanto o volume pode cair mantendo a margem total', () => {
    const a = analyze({ previous: [], current: [{ day: 'd', orders: [order({ lines: [line('burger', 10, 3000)] })] }], sheet: sheet(), now: NOW });
    const burger = a.products.find((p) => p.productId === 'burger')!;
    // margem atual 10 × (3000 − 1100) = 19000; a 3300 deixa 2200 por unidade → 9 unidades bastam
    const sim = simulatePrice(burger, 3300)!;
    expect(sim.unitContribution).toBe(2200);
    expect(sim.breakEvenQuantity).toBe(9);
    expect(sim.volumeTolerance).toBeCloseTo(-0.1);
  });

  it('não simula sem custo', () => {
    const a = analyze({ previous: [], current: [{ day: 'd', orders: [order({ lines: [line('sobremesa', 1, 1000)] })] }], sheet: sheet(), now: NOW });
    expect(simulatePrice(a.products[0], 1200)).toBeNull();
  });
});

describe('demonstração', () => {
  const days = demoOrders('2026-10-28', 120);
  it('é sempre igual (semente fixa) e tem ids de pedido válidos', () => {
    expect(demoOrders('2026-10-28', 120)).toEqual(days);
    for (const { orders } of days) for (const o of orders) expect(o.id).toMatch(/^\d{8}-[a-z0-9]{10}$/);
  });

  it('é marcada como fictícia e passa na validação da loja', () => {
    const store = demoStore();
    expect(store.name).toMatch(/fictícios/);
    expect(store.extra.demo).toBe(true);
    expect(costSheetSchema.safeParse(demoCostSheet()).success).toBe(true);
  });

  it('gera uma análise com matriz, comparação e recomendações explicadas', () => {
    const store = demoStore();
    const cat = new Map(store.catalog.categories.flatMap((c) => c.items.map((i) => [i.id, c.name] as const)));
    const a = analyze({ previous: days.slice(60, 90), current: days.slice(90), sheet: demoCostSheet(), categoryOf: (id) => cat.get(id), now: NOW });
    expect(a.comparison.reliable).toBe(true);
    expect(a.matrix.length).toBeGreaterThanOrEqual(3);
    expect(new Set(a.products.map((p) => p.menuClass).filter(Boolean)).size).toBe(4);
    const recs = recommend(a);
    expect(recs.length).toBeGreaterThan(2);
    for (const r of recs) {
      expect(r.evidence.length).toBeGreaterThan(0);
      expect(r.measure).not.toBe('');
    }
    // Milkshake e brownie estão sem custo de propósito.
    expect(recs.some((r) => r.id === 'custos-faltando')).toBe(true);
  });
});

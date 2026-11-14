import { describe, expect, it } from 'vitest';
import { productById, products } from '@/content/menu';
import { cartReducer, cartTotals, lineKey, missingRequired, sanitize, unitPrice, type CartState } from '../cart';
import { formatBRL } from '../money';
import { buildOrderMessage } from '../order';

const lookup = (id: string) => productById.get(id);
const empty: CartState = { lines: [] };

describe('menu data', () => {
  it('stores every price as integer centavos', () => {
    for (const p of products) expect(Number.isInteger(p.price)).toBe(true);
  });

  it('matches the printed menu', () => {
    const expected: Record<string, number> = {
      'downtown-classic': 3990, 'the-bacon-street': 4490, 'australian-cheddar': 5890, 'kill-bill': 5890,
      'golden-chicken': 4990, holyfield: 6990, 'green-burger': 5990, 'little-downtown': 3990,
      'bacon-cheddar-fries': 3490, 'croc-canoa': 3990, 'downtown-nuggets': 2490, 'classic-fries': 2390,
      agua: 600, 'agua-com-gas': 1000, 'coca-ks': 1200, 'coca-ks-zero': 1200, 'agua-tonica': 1000, tubaina: 1200,
      schweppes: 1200, guarana: 1000, 'suco-laranja': 1200, 'pink-lemonade': 1500,
      heineken: 1500, praya: 1500, 'praya-classica': 1500, 'amstel-ultra': 1500, 'lagunitas-ipa': 1800, 'blue-moon': 1800, eisenbahn: 1300,
      brownie: 3490, milkshake: 3490,
    };
    expect(products.length).toBe(Object.keys(expected).length);
    for (const [id, price] of Object.entries(expected)) expect(lookup(id)?.price, id).toBe(price);
  });

  it('never labels the Green Burger as vegan', () => {
    const g = lookup('green-burger')!;
    expect(`${g.name} ${g.description}`.toLowerCase()).not.toMatch(/vegan/);
  });
});

describe('money', () => {
  it('formats BRL with a plain space', () => {
    expect(formatBRL(4490)).toBe('R$ 44,90');
    expect(formatBRL(7380)).toBe('R$ 73,80');
    expect(formatBRL(123456)).toBe('R$ 1.234,56');
  });
  it('rejects non-integer centavos', () => {
    expect(() => formatBRL(44.9)).toThrow();
  });
});

describe('cart', () => {
  it('reproduces the brief example: Bacon Street + cheddar + Classic Fries = R$ 73,80', () => {
    let s = cartReducer(empty, { type: 'add', productId: 'the-bacon-street', quantity: 1, selections: { adicionais: ['cheddar-cremoso'] } });
    s = cartReducer(s, { type: 'add', productId: 'classic-fries', quantity: 1, selections: {} });
    expect(cartTotals(s.lines, lookup).total).toBe(7380);
    const msg = buildOrderMessage(s.lines, lookup);
    expect(msg).toBe(
      [
        'Olá! Gostaria de fazer um pedido na Downtown Burger:',
        '1x The Bacon Street — R$ 44,90\nAdicional: cheddar cremoso — R$ 5,00',
        '1x Classic Fries — R$ 23,90',
        'Total: R$ 73,80',
      ].join('\n\n'),
    );
  });

  it('merges identical lines and keeps different options apart', () => {
    let s = cartReducer(empty, { type: 'add', productId: 'downtown-classic', quantity: 1, selections: { adicionais: ['cream-cheese', 'blend-160'] } });
    s = cartReducer(s, { type: 'add', productId: 'downtown-classic', quantity: 2, selections: { adicionais: ['blend-160', 'cream-cheese'] } });
    s = cartReducer(s, { type: 'add', productId: 'downtown-classic', quantity: 1, selections: { adicionais: [] } });
    expect(s.lines).toHaveLength(2);
    expect(s.lines[0].quantity).toBe(3);
    // (39,90 + 5,00 + 25,00) * 3 + 39,90
    expect(cartTotals(s.lines, lookup).total).toBe(6990 * 3 + 3990);
  });

  it('never charges for the Little Downtown included juice', () => {
    const p = lookup('little-downtown')!;
    expect(missingRequired(p, { suco: [], adicionais: [] }).map((g) => g.id)).toEqual(['suco']);
    expect(unitPrice(p, { suco: ['uva'], adicionais: [] })).toBe(3990);
    const s = cartReducer(empty, { type: 'add', productId: 'little-downtown', quantity: 2, selections: { suco: ['laranja'], adicionais: [] } });
    const msg = buildOrderMessage(s.lines, lookup);
    expect(msg).toContain('2x Little Downtown — R$ 79,80');
    expect(msg).toContain('Suco: laranja (incluso)');
    expect(msg).toContain('Total: R$ 79,80');
  });

  it('requires a milkshake flavour', () => {
    const p = lookup('milkshake')!;
    expect(missingRequired(p, { sabor: [] })).toHaveLength(1);
    expect(missingRequired(p, { sabor: ['nutella'] })).toHaveLength(0);
    expect(unitPrice(p, { sabor: ['nutella'] })).toBe(3490);
  });

  it('edits quantity, removes at zero and clears', () => {
    let s = cartReducer(empty, { type: 'add', productId: 'agua', quantity: 1, selections: {} });
    const id = s.lines[0].lineId;
    s = cartReducer(s, { type: 'setQuantity', lineId: id, quantity: 4 });
    expect(cartTotals(s.lines, lookup)).toEqual({ subtotal: 2400, total: 2400, count: 4 });
    s = cartReducer(s, { type: 'setQuantity', lineId: id, quantity: 0 });
    expect(s.lines).toHaveLength(0);
    s = cartReducer(s, { type: 'add', productId: 'agua', quantity: 99, selections: {} });
    expect(s.lines[0].quantity).toBe(20);
    expect(cartReducer(s, { type: 'clear' }).lines).toHaveLength(0);
  });

  it('updates a line in place and merges on clash', () => {
    let s = cartReducer(empty, { type: 'add', productId: 'milkshake', quantity: 1, selections: { sabor: ['morango'] } });
    s = cartReducer(s, { type: 'add', productId: 'milkshake', quantity: 1, selections: { sabor: ['nutella'] } });
    s = cartReducer(s, { type: 'update', lineId: s.lines[0].lineId, selections: { sabor: ['nutella'] }, notes: '', quantity: 1 });
    expect(s.lines).toHaveLength(1);
    expect(s.lines[0].quantity).toBe(2);
    expect(s.lines[0].lineId).toBe(lineKey('milkshake', { sabor: ['nutella'] }));
  });

  it('sanitizes stored carts', () => {
    const stored = {
      lines: [
        { productId: 'ghost', quantity: 1, selections: {}, notes: '' },
        { productId: 'milkshake', quantity: 2, selections: { sabor: ['chocolate'] }, notes: '' },
        { productId: 'holyfield', quantity: 1, selections: { adicionais: ['salada', 'nope'] }, notes: 'sem cebola' },
      ],
    };
    const s = sanitize(stored, lookup);
    expect(s.lines).toHaveLength(1);
    expect(s.lines[0].selections.adicionais).toEqual(['salada']);
    expect(cartTotals(s.lines, lookup).total).toBe(7490);
    expect(sanitize('garbage', lookup).lines).toEqual([]);
  });
});

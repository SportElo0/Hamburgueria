import { describe, expect, it } from 'vitest';
import { productById, products } from '@/content/menu';
import { cartReducer, cartTotals, defaultSelections, lineKey, missingRequired, sanitize, unitPrice, type CartState } from '../cart';
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
      'el-patron': 4799, 'al-capone': 3299, ochoa: 2999, 'el-chapo': 3199, abadia: 3199,
      dimas: 3099, velasquez: 3899, nomura: 2999, lucchese: 3399,
      gacha: 1999, blanco: 1999, figueroa: 2399, guzman: 1799,
      'batata-completa': 1999, 'batata-simples': 1599, 'rustica-completa': 1999, 'rustica-simples': 1599, chicken: 3999, 'onion-rings': 2599,
      'refri-lata': 699, 'refri-600': 999, 'coca-2l': 1799, 'refri-2l': 1599, 'suco-polpa': 799, agua: 499,
      'sorvete-palito': 400, 'sorvete-massa': 800,
    };
    expect(products.length).toBe(Object.keys(expected).length);
    for (const [id, price] of Object.entries(expected)) expect(lookup(id)?.price, id).toBe(price);
  });

  it('prices the large portions as printed', () => {
    const large: Record<string, number> = { 'batata-completa': 3299, 'batata-simples': 2099, 'rustica-completa': 3399, 'rustica-simples': 2199, 'onion-rings': 3299 };
    for (const [id, price] of Object.entries(large)) expect(unitPrice(lookup(id)!, { tamanho: ['grande'] }), id).toBe(price);
  });

  it('prices the add-ons as printed', () => {
    const p = lookup('gacha')!;
    const all = p.options!.find((g) => g.id === 'adicionais')!.choices.map((c) => c.id);
    // 2,99 + 2,99 + 3,99 + 3,99 + 4,99 + 6,99 + 6,99 + 9,99 + 12,99
    expect(unitPrice(p, { adicionais: all })).toBe(1999 + 5591);
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
  it('builds the WhatsApp order: El Patron + bacon + large fries, for delivery', () => {
    let s = cartReducer(empty, { type: 'add', productId: 'el-patron', quantity: 1, selections: { adicionais: ['bacon'] } });
    s = cartReducer(s, { type: 'add', productId: 'batata-completa', quantity: 1, selections: { tamanho: ['grande'] } });
    expect(cartTotals(s.lines, lookup).total).toBe(4799 + 699 + 3299);
    const msg = buildOrderMessage(s.lines, lookup, { mode: 'entrega', address: 'Rua X, 10', customerName: 'Ana' });
    expect(msg).toBe(
      [
        'Olá! Gostaria de fazer um pedido no El Patron:',
        '1x El Patron — R$ 47,99\nAdicional: bacon — R$ 6,99',
        '1x Batata frita completa — R$ 32,99\nTamanho: grande',
        'Total: R$ 87,97\nEntrega: Rua X, 10\nNome: Ana',
      ].join('\n\n'),
    );
  });

  it('says when the order is picked up', () => {
    const s = cartReducer(empty, { type: 'add', productId: 'agua', quantity: 2, selections: {} });
    expect(buildOrderMessage(s.lines, lookup, { mode: 'retirada' })).toContain('Total: R$ 9,98\nRetirada no local');
  });

  it('merges identical lines and keeps different options apart', () => {
    let s = cartReducer(empty, { type: 'add', productId: 'dimas', quantity: 1, selections: { adicionais: ['queijo', 'bacon'] } });
    s = cartReducer(s, { type: 'add', productId: 'dimas', quantity: 2, selections: { adicionais: ['bacon', 'queijo'] } });
    s = cartReducer(s, { type: 'add', productId: 'dimas', quantity: 1, selections: { adicionais: [] } });
    expect(s.lines).toHaveLength(2);
    expect(s.lines[0].quantity).toBe(3);
    expect(cartTotals(s.lines, lookup).total).toBe((3099 + 499 + 699) * 3 + 3099);
  });

  it('preselects the small portion and requires a size', () => {
    const p = lookup('onion-rings')!;
    expect(defaultSelections(p)).toEqual({ tamanho: ['pequena'] });
    expect(missingRequired(p, { tamanho: [] })).toHaveLength(1);
    expect(unitPrice(p, defaultSelections(p))).toBe(2599);
  });

  it('edits quantity, removes at zero and clears', () => {
    let s = cartReducer(empty, { type: 'add', productId: 'agua', quantity: 1, selections: {} });
    const id = s.lines[0].lineId;
    s = cartReducer(s, { type: 'setQuantity', lineId: id, quantity: 4 });
    expect(cartTotals(s.lines, lookup)).toEqual({ subtotal: 1996, total: 1996, count: 4 });
    s = cartReducer(s, { type: 'setQuantity', lineId: id, quantity: 0 });
    expect(s.lines).toHaveLength(0);
    s = cartReducer(s, { type: 'add', productId: 'agua', quantity: 99, selections: {} });
    expect(s.lines[0].quantity).toBe(20);
    expect(cartReducer(s, { type: 'clear' }).lines).toHaveLength(0);
  });

  it('updates a line in place and merges on clash', () => {
    let s = cartReducer(empty, { type: 'add', productId: 'chicken', quantity: 1, selections: {} });
    s = cartReducer(s, { type: 'add', productId: 'onion-rings', quantity: 1, selections: { tamanho: ['pequena'] } });
    s = cartReducer(s, { type: 'add', productId: 'onion-rings', quantity: 1, selections: { tamanho: ['grande'] } });
    s = cartReducer(s, { type: 'update', lineId: s.lines[1].lineId, selections: { tamanho: ['grande'] }, notes: '', quantity: 1 });
    expect(s.lines).toHaveLength(2);
    expect(s.lines[1].quantity).toBe(2);
    expect(s.lines[1].lineId).toBe(lineKey('onion-rings', { tamanho: ['grande'] }));
  });

  it('sanitizes stored carts', () => {
    const stored = {
      lines: [
        { productId: 'ghost', quantity: 1, selections: {}, notes: '' },
        { productId: 'onion-rings', quantity: 2, selections: { tamanho: ['gigante'] }, notes: '' },
        { productId: 'ochoa', quantity: 1, selections: { adicionais: ['molho-verde', 'nope'] }, notes: 'sem cebola' },
      ],
    };
    const s = sanitize(stored, lookup);
    expect(s.lines).toHaveLength(1);
    expect(s.lines[0].selections.adicionais).toEqual(['molho-verde']);
    expect(cartTotals(s.lines, lookup).total).toBe(2999 + 299);
    expect(sanitize('garbage', lookup).lines).toEqual([]);
  });
});

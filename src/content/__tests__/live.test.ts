import { describe, expect, it } from 'vitest';
import { mergeLive, staticCatalog } from '../live';
import { productById } from '../menu';
import { restaurant } from '../restaurant';

const published = (items: Record<string, unknown>[], extra: Record<string, unknown> = {}) => ({
  slug: 'downtown-burger',
  contact: { whatsapp: '', instagram: '', email: '', phone: '' },
  units: [],
  notice: null,
  catalog: { categories: [{ id: 'x', name: 'X', items }] },
  ...extra,
});

describe('mergeLive', () => {
  it('rejects payloads without a catalog', () => {
    expect(mergeLive(null)).toBeNull();
    expect(mergeLive({ error: 'Loja não encontrada' })).toBeNull();
    expect(mergeLive('<html>')).toBeNull();
  });

  it('applies price, name and description, keeping our photos', () => {
    const base = productById.get('holyfield')!;
    const c = mergeLive(published([{ id: 'holyfield', name: 'Holyfield XL', description: '', price: 6990, image: 'https://downtown.example/photos/x.webp' }]))!;
    const p = c.byId.get('holyfield')!;
    expect(p.price).toBe(6990);
    expect(p.name).toBe('Holyfield XL');
    expect(p.description).toBeUndefined();
    expect(p.image).toBe(base.image);
    expect(p.layers).toBe(base.layers);
  });

  it('uses photos uploaded through the panel', () => {
    const c = mergeLive(published([{ id: 'holyfield', image: 'https://painel.example/api/midia/downtown-burger/abc.webp' }]))!;
    expect(c.byId.get('holyfield')!.image).toBe('https://painel.example/api/midia/downtown-burger/abc.webp');
  });

  it('ignores invalid prices and keeps unknown items out', () => {
    const base = productById.get('holyfield')!;
    const c = mergeLive(published([{ id: 'holyfield', price: -5 }, { id: 'nao-existe', name: 'Novo', price: 100 }]))!;
    expect(c.byId.get('holyfield')!.price).toBe(base.price);
    expect(c.byId.has('nao-existe')).toBe(false);
    expect(mergeLive(published([{ id: 'holyfield', price: null }]))!.byId.get('holyfield')!.price).toBe(base.price);
  });

  it('marks sold-out items and drops unavailable add-ons from every burger', () => {
    const c = mergeLive(published([{ id: 'brownie', available: false }, { id: 'blend-160', available: false }, { id: 'cheddar-cremoso', price: 700 }]))!;
    expect(c.soldOut.has('brownie')).toBe(true);
    expect(c.addons.some((a) => a.id === 'blend-160')).toBe(false);
    const extras = c.byId.get('holyfield')!.options!.find((g) => g.id === 'adicionais')!;
    expect(extras.choices.some((a) => a.id === 'blend-160')).toBe(false);
    expect(extras.choices.find((a) => a.id === 'cheddar-cremoso')!.priceDelta).toBe(700);
  });

  it('takes contacts, hours and notice from the panel', () => {
    const c = mergeLive(
      published([], {
        notice: 'Fechado no feriado',
        contact: { whatsapp: '+55 (12) 99999-0000', instagram: '@downtown', email: '', phone: '' },
        units: [{ address: 'Rua A, 1', mapsUrl: 'javascript:alert(1)', whatsapp: '', hours: [{ days: 'Ter a Dom', time: '18h às 23h' }, { days: '', time: '' }] }],
      }),
    )!;
    expect(c.notice).toBe('Fechado no feriado');
    expect(c.restaurant.whatsappNumber).toBe('5512999990000');
    expect(c.restaurant.instagram).toBe('downtown');
    expect(c.restaurant.address).toBe('Rua A, 1');
    expect(c.restaurant.mapsUrl).toBe(restaurant.mapsUrl);
    expect(c.restaurant.hours).toEqual([{ days: 'Ter a Dom', time: '18h às 23h' }]);
  });

  it('matches the static catalog when the panel changes nothing', () => {
    const c = mergeLive(published([]))!;
    expect(c.products.map((p) => [p.id, p.price])).toEqual(staticCatalog.products.map((p) => [p.id, p.price]));
    expect(c.restaurant).toEqual(restaurant);
    expect(c.notice).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { monthKey, nextIsExtra, usage } from '@/lib/changes';
import { formatPrice, parsePrice, slugify } from '@/lib/slug';
import { emptyStore, partnerStatus, storeSchema, toPublic } from '@/lib/schema';
import type { ChangeEntry } from '@/lib/schema';
import { seedStores } from '@/lib/seeds';

const entry = (counted: boolean, extra = false): ChangeEntry => ({ id: Math.random().toString(36).slice(2), at: '', by: '', description: 'x', counted, extra, reason: '' });

describe('mês das mudanças', () => {
  it('usa o fuso de Brasília', () => {
    // 1º de novembro, 01:30 UTC ainda é 31 de outubro em São Paulo.
    expect(monthKey(new Date('2026-11-01T01:30:00Z'))).toBe('2026-10');
    expect(monthKey(new Date('2026-11-01T03:30:00Z'))).toBe('2026-11');
  });
});

describe('limite de mudanças', () => {
  it('conta só as que contam', () => {
    expect(usage([entry(true), entry(false)], 2)).toMatchObject({ used: 1, remaining: 1, state: 'ok' });
  });
  it('avisa na última e marca extra depois', () => {
    expect(usage([entry(true), entry(true)], 2).state).toBe('last');
    expect(nextIsExtra([entry(true), entry(true)], 2)).toBe(true);
    expect(nextIsExtra([entry(true), entry(false)], 2)).toBe(false);
    expect(usage([entry(true), entry(true), entry(true, true)], 2)).toMatchObject({ state: 'over', extras: 1 });
  });
});

describe('preços', () => {
  it.each([
    ['54,90', 5490],
    ['54.90', 5490],
    ['R$ 1.234,50', 123450],
    ['15', 1500],
    ['', null],
  ])('%s → %s', (input, out) => expect(parsePrice(input)).toBe(out));
  it('recusa lixo', () => expect(parsePrice('abc')).toBeNaN());
  it('formata em reais', () => expect(formatPrice(123450)).toBe('1.234,50'));
});

describe('slug', () => {
  it('normaliza acentos e Ø', () => expect(slugify('SemvØ Clothing — Juquehy')).toBe('semvo-clothing-juquehy'));
});

describe('prazo de parceria', () => {
  const store = (partnerUntil: string) => ({ ...emptyStore('x', 'X', 'loja'), account: { ...emptyStore('x', 'X', 'loja').account, partnerUntil } });
  it('sem prazo definido', () => expect(partnerStatus(store(''), '2026-10-01')).toBe('sem-prazo'));
  it('em dia quando falta mais que o aviso', () => expect(partnerStatus(store('2026-12-01'), '2026-10-01')).toBe('em-dia'));
  it('vencendo dentro da janela de aviso', () => expect(partnerStatus(store('2026-10-10'), '2026-10-01')).toBe('vencendo'));
  it('vencido depois da data', () => expect(partnerStatus(store('2026-09-30'), '2026-10-01')).toBe('vencido'));
});

describe('lojas importadas', () => {
  const seeds = seedStores();
  it('as 4 lojas são válidas', () => {
    expect(seeds.map((s) => s.slug)).toEqual(['downtown-burger', 'gara-pizza', 'semvo', 'surflife']);
    for (const s of seeds) expect(storeSchema.safeParse(s).success).toBe(true);
  });
  it('ids de itens não se repetem dentro da loja', () => {
    for (const s of seeds) {
      const ids = s.catalog.categories.flatMap((c) => c.items.map((i) => i.id));
      expect(new Set(ids).size, s.slug).toBe(ids.length);
    }
  });
  it('preços da Gara batem com o site', () => {
    const gara = seeds.find((s) => s.slug === 'gara-pizza')!;
    const calabresa = gara.catalog.categories[0].items.find((i) => i.name === 'Calabresa');
    expect(calabresa?.price).toBe(5490);
  });
  it('o público não recebe dados internos', () => {
    const pub = toPublic(seeds[0], null, 'https://p.app/api/midia') as Record<string, unknown>;
    expect(pub.account).toBeUndefined();
    expect(JSON.stringify(pub)).not.toContain('R$ 597');
  });
});

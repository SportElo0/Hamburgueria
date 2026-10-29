import { beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import { ordersForDays } from '@/lib/orders';
import { createStore, getDraft, getPublished, publish } from '@/lib/stores';

vi.mock('server-only', () => ({}));
const { createDemo, intelligenceFor } = await import('@/lib/inteligencia/dados');
const { analyze } = await import('@/lib/inteligencia/analise');
const { summarize } = await import('@/lib/inteligencia/resumo');
const { demoCostSheet } = await import('@/lib/inteligencia/demo');
const { DEMO_SLUG } = await import('@/lib/inteligencia/demo');

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'intel-')));
});

describe('loja de demonstração', () => {
  it('cria e recria sem publicar, e a publicação é recusada', async () => {
    await createDemo('ana');
    await createDemo('ana');
    expect((await getDraft(DEMO_SLUG))!.data.store.extra.demo).toBe(true);
    await expect(publish(DEMO_SLUG, { description: '', counted: false, reason: '' }, 'ana')).rejects.toThrow('demonstração');
    expect(await getPublished(DEMO_SLUG)).toBeNull();
  });

  it('não sobrescreve uma loja de verdade com o mesmo endereço', async () => {
    await createStore({ slug: DEMO_SLUG, name: 'Loja real', segment: 'restaurante' }, 'ana');
    await expect(createDemo('ana')).rejects.toThrow('não é a demonstração');
    expect((await getDraft(DEMO_SLUG))!.data.store.name).toBe('Loja real');
  });

  it('abre 90 dias lendo só os resumos do mês, com os mesmos números dos pedidos', async () => {
    const now = new Date('2026-10-28T20:00:00Z');
    await createDemo('ana', now);
    const reads = vi.spyOn(storage(), 'readJSON');
    const { analysis } = await intelligenceFor(DEMO_SLUG, 90, now);
    const orderReads = reads.mock.calls.filter(([key]) => key.startsWith('pedidos/'));
    expect(orderReads.length).toBeLessThanOrEqual(2); // hoje e ontem
    expect(reads.mock.calls.length).toBeLessThan(20);
    reads.mockRestore();

    const days = await ordersForDays(DEMO_SLUG, 180, now);
    const direct = analyze({ previous: summarize(days.slice(0, 90), now.getTime(), 'x'), current: summarize(days.slice(90), now.getTime(), 'x'), sheet: demoCostSheet(), categoryOf: () => undefined });
    expect(analysis.current).toEqual(direct.current);
    expect(analysis.previous).toEqual(direct.previous);
    expect(analysis.contribution).not.toBeNull();
  });
});

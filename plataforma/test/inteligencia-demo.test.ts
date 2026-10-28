import { beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { useFileStorage } from '@/lib/storage';
import { createStore, getDraft, getPublished, publish } from '@/lib/stores';

vi.mock('server-only', () => ({}));
const { createDemo } = await import('@/lib/inteligencia/dados');
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
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { useFileStorage } from '@/lib/storage';
import { createReferral, listReferrals, updateReferral } from '@/lib/referrals';

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'plataforma-')));
  // Relógio fixo: dois cadastros no mesmo milissegundo deixavam a ordem e as datas iguais.
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-01T12:00:00Z') });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('indicações', () => {
  it('cadastra como novo e lista do mais recente', async () => {
    await createReferral({ nome: 'Padaria da Vila', segmento: 'loja', indicadoPor: 'Gara Pizza' });
    vi.advanceTimersByTime(1000);
    await createReferral({ nome: 'Clínica Sorriso', segmento: 'servico', indicadoPor: 'SemvØ' });
    const list = await listReferrals();
    expect(list.map((r) => r.nome)).toEqual(['Clínica Sorriso', 'Padaria da Vila']);
    expect(list[0].status).toBe('novo');
  });

  it('avança o status e registra a comissão', async () => {
    const r = await createReferral({ nome: 'Padaria da Vila', segmento: 'loja', indicadoPor: 'Gara Pizza' });
    vi.advanceTimersByTime(1000);
    await updateReferral(r.id, { status: 'fechado', storeSlug: 'padaria-da-vila', comissao: 10000 });
    const [updated] = await listReferrals();
    expect(updated).toMatchObject({ status: 'fechado', storeSlug: 'padaria-da-vila', comissao: 10000, comissaoPaga: false });
    expect(updated.atualizadoEm).not.toBe(updated.criadoEm);
  });

  it('indicações simultâneas não se perdem', async () => {
    await Promise.all([1, 2, 3].map((i) => createReferral({ nome: `Negócio ${i}`, segmento: 'loja', indicadoPor: 'ana' })));
    expect(await listReferrals()).toHaveLength(3);
  });

  it('recusa atualizar uma indicação inexistente', async () => {
    await expect(updateReferral('nada', { status: 'fechado' })).rejects.toThrow(/não encontrada/);
  });
});

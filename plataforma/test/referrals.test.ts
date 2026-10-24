import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { useFileStorage } from '@/lib/storage';
import { createReferral, listReferrals, updateReferral } from '@/lib/referrals';

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'plataforma-')));
});

describe('indicações', () => {
  it('cadastra como novo e lista do mais recente', async () => {
    await createReferral({ nome: 'Padaria da Vila', segmento: 'loja', indicadoPor: 'Gara Pizza' });
    await createReferral({ nome: 'Clínica Sorriso', segmento: 'servico', indicadoPor: 'SemvØ' });
    const list = await listReferrals();
    expect(list.map((r) => r.nome)).toEqual(['Clínica Sorriso', 'Padaria da Vila']);
    expect(list[0].status).toBe('novo');
  });

  it('avança o status e registra a comissão', async () => {
    const r = await createReferral({ nome: 'Padaria da Vila', segmento: 'loja', indicadoPor: 'Gara Pizza' });
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

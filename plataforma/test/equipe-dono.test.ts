import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { storage, useFileStorage } from '@/lib/storage';
import {
  MAX_LOGINS_LOJA,
  OperatorError,
  authenticateOperator,
  donoAdicionaLogin,
  donoMudaFuncao,
  donoNovaSenha,
  donoRemoveLogin,
  listOperators,
  operatorKey,
  upsertOperator,
} from '@/lib/operators';

beforeEach(() => {
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'equipe-')));
});

describe('Equipe no painel do dono', () => {
  it('cria login de garçom e de cozinha, com senha que funciona', async () => {
    const { email, password } = await donoAdicionaLogin('loja-a', { email: ' Marcos@Exemplo.com ', name: 'Marcos', funcao: 'garcom' }, 'dono@a.com');
    expect(email).toBe('marcos@exemplo.com');
    const op = await authenticateOperator(email, password);
    expect(op).toMatchObject({ slug: 'loja-a', funcao: 'garcom', createdBy: 'dono@a.com' });
    await donoAdicionaLogin('loja-a', { email: 'cozinha@exemplo.com', name: 'Ana', funcao: 'cozinha' }, 'dono@a.com');
    expect((await listOperators('loja-a')).map((o) => o.funcao).sort()).toEqual(['cozinha', 'garcom']);
  });

  it('não cria login de dono nem função inventada', async () => {
    for (const funcao of ['dono', 'admin', '', undefined]) {
      await expect(donoAdicionaLogin('loja-a', { email: 'x@exemplo.com', name: 'X', funcao }, 'd')).rejects.toThrow(OperatorError);
    }
    expect(await listOperators('loja-a')).toEqual([]);
  });

  it('não reaproveita e-mail já usado (nem revela de qual loja é)', async () => {
    await upsertOperator('loja-b', { email: 'outro@exemplo.com', name: 'B', funcao: 'garcom' }, 'equipe');
    await expect(donoAdicionaLogin('loja-a', { email: 'outro@exemplo.com', name: 'X', funcao: 'garcom' }, 'd')).rejects.toThrow('não pode ser usado');
    await upsertOperator('loja-a', { email: 'ja@exemplo.com', name: 'J', funcao: 'garcom' }, 'equipe');
    // Same store: no silent password reset through "create".
    await expect(donoAdicionaLogin('loja-a', { email: 'ja@exemplo.com', name: 'J', funcao: 'garcom' }, 'd')).rejects.toThrow('Nova senha');
  });

  it('não mexe em login de dono, de cadastro pendente nem de outra loja', async () => {
    await upsertOperator('loja-a', { email: 'dono@a.com', name: 'Dono', funcao: 'dono' }, 'equipe');
    await upsertOperator('loja-b', { email: 'g@b.com', name: 'G', funcao: 'garcom' }, 'equipe');
    // An old login with no role is an owner's.
    const key = await operatorKey('antigo@a.com');
    await storage().writeJSON(key, { email: 'antigo@a.com', name: 'Antigo', slug: 'loja-a', hash: 'x', createdAt: new Date().toISOString(), createdBy: 'equipe' });
    const pend = await operatorKey('pend@a.com');
    await storage().writeJSON(pend, { email: 'pend@a.com', name: 'P', slug: 'loja-a', funcao: 'garcom', pendente: true, hash: 'x', createdAt: new Date().toISOString(), createdBy: 'cadastro' });

    for (const email of ['dono@a.com', 'antigo@a.com', 'pend@a.com', 'g@b.com', 'ninguem@a.com']) {
      await expect(donoNovaSenha('loja-a', email, 'd')).rejects.toThrow(OperatorError);
      await expect(donoMudaFuncao('loja-a', email, 'cozinha')).rejects.toThrow(OperatorError);
      await expect(donoRemoveLogin('loja-a', email)).rejects.toThrow(OperatorError);
    }
    expect((await storage().readJSON<{ funcao: string }>(await operatorKey('dono@a.com')))?.data.funcao).toBe('dono');
    expect(await storage().readJSON(await operatorKey('g@b.com'))).not.toBeNull();
  });

  it('nova senha troca a senha; mudar função só entre cozinha e garçom; remover apaga', async () => {
    const { email, password } = await donoAdicionaLogin('loja-a', { email: 'm@a.com', name: 'M', funcao: 'garcom' }, 'd');
    const nova = await donoNovaSenha('loja-a', email, 'd');
    expect(nova).not.toBe(password);
    expect(await authenticateOperator(email, password)).toBeNull();
    expect(await authenticateOperator(email, nova)).not.toBeNull();

    await donoMudaFuncao('loja-a', email, 'cozinha');
    expect((await listOperators('loja-a'))[0].funcao).toBe('cozinha');
    await expect(donoMudaFuncao('loja-a', email, 'dono')).rejects.toThrow(OperatorError);

    await donoRemoveLogin('loja-a', email);
    expect(await listOperators('loja-a')).toEqual([]);
    expect(await authenticateOperator(email, nova)).toBeNull();
  });

  it(`para em ${MAX_LOGINS_LOJA} logins por loja`, async () => {
    const list = Array.from({ length: MAX_LOGINS_LOJA }, (_, i) => ({ email: `p${i}@a.com`, name: `P${i}`, funcao: 'garcom', createdAt: '' }));
    await storage().writeJSON('lojas/loja-a/acessos.json', list);
    await expect(donoAdicionaLogin('loja-a', { email: 'mais@a.com', name: 'Mais', funcao: 'garcom' }, 'd')).rejects.toThrow('Remova');
  });
});

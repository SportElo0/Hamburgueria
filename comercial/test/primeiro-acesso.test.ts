import { afterAll, describe, expect, it } from 'vitest';
import { contextoDe } from '@/server/contexto';
import { fecharPool, um } from '@/server/db';
import { empresaPorId } from '@/server/empresas';
import { CONHECIMENTO_GROWLIFT, prepararPrimeiroAcesso } from '@/server/primeiro-acesso';
import { Conhecimento } from '@/server/config';
import { novaEmpresa, unico } from './apoio';

afterAll(fecharPool);

describe('primeiro acesso a um banco de produção novo', () => {
  it('sem as variáveis não faz nada; com administrador já existente também não', async () => {
    expect(await prepararPrimeiroAcesso({})).toMatch(/não configurado/);
    await novaEmpresa('Outra Empresa'); // creates a Growlift admin, like a database already in use
    expect(await prepararPrimeiroAcesso({ PRIMEIRO_ADMIN_EMAIL: `a${unico()}@growlift.test`, PRIMEIRO_ADMIN_SENHA: 'senha-longa-de-teste' })).toMatch(/já existe administrador/);
  });

  it('cria o login da equipe Growlift e a empresa Growlift falando como marca; repetir não duplica', async () => {
    const email = `equipe${unico()}@growlift.test`;
    const env = { PRIMEIRO_ADMIN_EMAIL: email, PRIMEIRO_ADMIN_NOME: 'Equipe Growlift', PRIMEIRO_ADMIN_SENHA: 'senha-curta' };
    expect(await prepararPrimeiroAcesso({ ...env, PRIMEIRO_ADMIN_SENHA: 'curta' }, { somenteSeVazio: false })).toMatch(/10 caracteres/);
    const r = await prepararPrimeiroAcesso({ ...env, PRIMEIRO_ADMIN_SENHA: 'uma-senha-nova-de-teste' }, { somenteSeVazio: false });
    expect(r).toMatch(/criad/);
    expect(r).not.toContain(email);
    const u = (await um<{ id: string }>('select id from "user" where email = $1', [email]))!;
    const { ctx, adminPlataforma } = await contextoDe(u.id, 'Equipe Growlift', email);
    expect(adminPlataforma).toBe(true);
    const e = (await empresaPorId(ctx!.empresaId))!;
    expect(e.nome).toBe('Growlift');
    expect(e.config.ia.falar_como_marca).toBe(true);
    const k = (await um<{ dados: unknown }>('select dados from conhecimento where empresa_id = $1 and versao = 1', [e.id]))!.dados;
    expect(Conhecimento.parse(k).faq).toHaveLength(CONHECIMENTO_GROWLIFT.faq.length);
    expect(await prepararPrimeiroAcesso({ ...env, PRIMEIRO_ADMIN_SENHA: 'uma-senha-nova-de-teste' }, { somenteSeVazio: false })).toMatch(/já existe um login/);
  });
});

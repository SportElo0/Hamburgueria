import { afterEach, describe, expect, it } from 'vitest';
import { chaveCredenciais, enderecoBanco, segredoAgendador, segredoSessao } from '@/server/chaves';

const guardado = { ...process.env };
afterEach(() => {
  for (const k of ['BETTER_AUTH_SECRET', 'CHAVE_CREDENCIAIS', 'CRON_SECRET', 'SUPABASE_JWT_SECRET', 'DATABASE_URL', 'POSTGRES_URL', 'DATABASE_URL_UNPOOLED', 'POSTGRES_URL_NON_POOLING', 'VERCEL']) {
    if (guardado[k] === undefined) delete process.env[k];
    else process.env[k] = guardado[k];
  }
});

describe('chaves do servidor', () => {
  it('sem as variáveis próprias, deriva três chaves diferentes e estáveis do segredo do Supabase', () => {
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.CHAVE_CREDENCIAIS;
    delete process.env.CRON_SECRET;
    process.env.SUPABASE_JWT_SECRET = 'segredo-do-supabase-com-mais-de-32-caracteres-123';
    const [a, b, c] = [segredoSessao(), chaveCredenciais(), segredoAgendador()];
    expect(new Set([a, b, c]).size).toBe(3);
    expect(Buffer.from(b!, 'base64')).toHaveLength(32);
    expect(segredoSessao()).toBe(a);
    expect(a).not.toContain('segredo-do-supabase');
  });

  it('a variável própria sempre vence, e sem nada não inventa chave', () => {
    process.env.SUPABASE_JWT_SECRET = 'segredo-do-supabase-com-mais-de-32-caracteres-123';
    process.env.BETTER_AUTH_SECRET = 'minha-chave';
    expect(segredoSessao()).toBe('minha-chave');
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;
    expect(segredoSessao()).toBeUndefined();
  });

  it('sem Supabase, na Vercel com outro Postgres (Neon), deriva do usuário e da senha do banco; fora da Vercel ou com senha curta, não', () => {
    for (const k of ['BETTER_AUTH_SECRET', 'SUPABASE_JWT_SECRET', 'POSTGRES_URL_NON_POOLING', 'DATABASE_URL_UNPOOLED']) delete process.env[k];
    process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_AbCdEfGh1234@ep-x-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';
    delete process.env.VERCEL;
    expect(segredoSessao()).toBeUndefined();
    process.env.VERCEL = '1';
    const a = segredoSessao();
    expect(Buffer.from(a!, 'base64')).toHaveLength(32);
    expect(a).not.toContain('npg_');
    // the unpooled address, when present, is the base (the pooler host can change, the password is the same)
    process.env.DATABASE_URL_UNPOOLED = 'postgresql://neondb_owner:npg_AbCdEfGh1234@ep-x.us-east-1.aws.neon.tech/neondb?sslmode=require';
    expect(segredoSessao()).toBe(a);
    expect(chaveCredenciais()).not.toBe(a);
    process.env.DATABASE_URL_UNPOOLED = 'postgresql://u:curta@h/db';
    expect(segredoSessao()).toBeUndefined();
  });

  it('o banco vem de DATABASE_URL ou, na falta dele, de POSTGRES_URL', () => {
    delete process.env.DATABASE_URL;
    process.env.POSTGRES_URL = 'postgres://integracao';
    expect(enderecoBanco()).toBe('postgres://integracao');
    process.env.DATABASE_URL = 'postgres://proprio';
    expect(enderecoBanco()).toBe('postgres://proprio');
  });
});

describe('endereço do banco', () => {
  it('tira só o sslmode e mantém os outros parâmetros', async () => {
    const { semSslmode } = await import('../src/server/db');
    expect(semSslmode('postgres://u:p@h:6543/postgres?sslmode=require&supa=base-pooler.x')).toBe('postgres://u:p@h:6543/postgres?supa=base-pooler.x');
    expect(semSslmode('postgres://u:p@h:5432/postgres')).toBe('postgres://u:p@h:5432/postgres');
  });
});

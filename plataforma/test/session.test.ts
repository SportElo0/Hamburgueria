import { beforeAll, describe, expect, it } from 'vitest';
import { authenticate, hashPassword, signSession, verifyPassword, verifySession } from '@/lib/session';

beforeAll(() => {
  process.env.SESSION_SECRET = 'x'.repeat(40);
});

describe('senhas', () => {
  it('confere a senha certa e recusa a errada', async () => {
    const hash = await hashPassword('senha-forte-123');
    expect(await verifyPassword('senha-forte-123', hash)).toBe(true);
    expect(await verifyPassword('senha-errada', hash)).toBe(false);
  });

  it('recusa hash malformado', async () => {
    expect(await verifyPassword('x', 'md5$abc')).toBe(false);
  });

  it('autentica só usuários da equipe', async () => {
    const users = [{ email: 'Ana@Agencia.com', name: 'Ana', hash: await hashPassword('senha-forte-123') }];
    expect((await authenticate('ana@agencia.com', 'senha-forte-123', users))?.name).toBe('Ana');
    expect(await authenticate('ana@agencia.com', 'outra', users)).toBeNull();
    expect(await authenticate('intruso@x.com', 'senha-forte-123', users)).toBeNull();
  });
});

describe('sessão', () => {
  it('assina e valida', async () => {
    const token = await signSession({ email: 'a@b.c', name: 'A' });
    expect((await verifySession(token))?.email).toBe('a@b.c');
  });

  it('recusa sessão adulterada', async () => {
    const token = await signSession({ email: 'a@b.c', name: 'A' });
    const [body, sig] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ email: 'chefe@b.c', name: 'X', exp: Date.now() + 1e9 })).toString('base64url');
    expect(await verifySession(`${forged}.${sig}`)).toBeNull();
    expect(await verifySession(`${body}.${sig.slice(0, -2)}xx`)).toBeNull();
    expect(await verifySession('lixo')).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });

  it('expira depois de 7 dias', async () => {
    const token = await signSession({ email: 'a@b.c', name: 'A' }, Date.now() - 8 * 86_400_000);
    expect(await verifySession(token)).toBeNull();
  });
});

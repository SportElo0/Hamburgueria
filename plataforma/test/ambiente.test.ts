import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { legacyBlob, resetStorageForTests, storage, useFileStorage } from '@/lib/storage';
import { SomenteLeituraError, gravacaoPermitida } from '@/lib/ambiente';
import { take } from '@/lib/limits';
import { createCharge, refundCharge, cancelCharge, PixError } from '@/lib/pix';
import { GET as saude } from '@/app/api/saude/route';

/** The read-only lock for Vercel previews, tried on a throwaway folder (never the real database). */
let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ambiente-'));
  vi.stubEnv('PLATAFORMA_DATA_DIR', dir);
  vi.stubEnv('POSTGRES_URL', '');
  vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
  resetStorageForTests();
});
afterEach(() => {
  vi.unstubAllEnvs();
  useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'ambiente-fim-')));
});

const como = (vercel: string, env: string) => {
  vi.stubEnv('VERCEL', vercel);
  vi.stubEnv('VERCEL_ENV', env);
  resetStorageForTests();
};

describe('trava de prévia', () => {
  it('local e testes gravam normalmente', async () => {
    como('', '');
    expect(gravacaoPermitida()).toBe(true);
    await storage().writeJSON('x/a.json', { ok: 1 });
    expect((await storage().readJSON('x/a.json'))?.data).toEqual({ ok: 1 });
  });

  it('produção grava normalmente', async () => {
    como('1', 'production');
    expect(gravacaoPermitida()).toBe(true);
    await storage().writeJSON('x/a.json', { ok: 1 });
    await storage().writeFile('x/b.bin', Buffer.from('oi'), 'text/plain');
    await storage().remove('x/b.bin');
    expect((await storage().readJSON('x/a.json'))?.data).toEqual({ ok: 1 });
  });

  for (const env of ['preview', 'development']) {
    it(`${env}: lê os dados, mas qualquer escrita é recusada e nada muda`, async () => {
      como('', '');
      await storage().writeJSON('x/a.json', { real: true });
      como('1', env);
      expect(gravacaoPermitida()).toBe(false);
      expect((await storage().readJSON('x/a.json'))?.data).toEqual({ real: true });
      expect(await storage().list('x/')).toContain('x/a.json');
      await expect(storage().writeJSON('x/a.json', { real: false })).rejects.toBeInstanceOf(SomenteLeituraError);
      await expect(storage().writeJSON('x/novo.json', {}, null)).rejects.toBeInstanceOf(SomenteLeituraError);
      await expect(storage().writeFile('x/b.bin', Buffer.from('oi'), 'text/plain')).rejects.toBeInstanceOf(SomenteLeituraError);
      await expect(storage().remove('x/a.json')).rejects.toBeInstanceOf(SomenteLeituraError);
      como('', '');
      expect((await storage().readJSON('x/a.json'))?.data).toEqual({ real: true });
      expect(await storage().readJSON('x/novo.json')).toBeNull();
    });
  }

  it('prévia: contadores (login, limites) não quebram e não gravam', async () => {
    como('1', 'preview');
    expect(await take('login-email', 'a@b.c', 1, '2026-11-02T10')).toBe(true);
    expect(await take('login-email', 'a@b.c', 1, '2026-11-02T10')).toBe(true);
    como('', '');
    expect(await storage().list('limites/')).toEqual([]);
  });

  it('prévia: a cópia antiga do Blob não é oferecida', () => {
    vi.stubEnv('POSTGRES_URL', 'postgres://x');
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'falso');
    como('1', 'preview');
    expect(legacyBlob()).toBeNull();
  });

  it('prévia: nenhum Pix real é aberto, devolvido ou cancelado; o de demonstração continua', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    como('1', 'preview');
    const req = { slug: 'loja', orderId: '20261102-abcdefghij', amount: 1000, description: 'Teste', payerName: 'Teste', payerEmail: 'a@b.c', notificationUrl: 'https://x/n' };
    await expect(createCharge('mercadopago', req)).rejects.toBeInstanceOf(PixError);
    const real = { provider: 'mercadopago', id: '1' } as Parameters<typeof refundCharge>[1];
    await expect(refundCharge('loja', real)).rejects.toBeInstanceOf(PixError);
    await expect(cancelCharge('loja', real)).rejects.toBeInstanceOf(PixError);
    expect((await createCharge('demo', req)).provider).toBe('demo');
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('/api/saude diz se o ambiente grava (sem dado nenhum)', async () => {
    como('1', 'preview');
    expect(await (await saude()).json()).toEqual({ ok: true, gravacao: false });
    como('1', 'production');
    expect(await (await saude()).json()).toEqual({ ok: true, gravacao: true });
  });
});

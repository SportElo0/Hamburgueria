import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import postgres from 'postgres';
import { ConflictError, storage, useFileStorage, postgresForTests, type Storage } from '@/lib/storage';
import { migrateFromBlob, migrationDone } from '@/lib/migracao';

// The Postgres half runs when a test database is given, e.g.
//   TEST_POSTGRES_URL='postgres://postgres@127.0.0.1:5433/postgres?sslmode=disable' npm test
const PG = process.env.TEST_POSTGRES_URL;
const closers: Array<() => Promise<void>> = [];
afterAll(async () => {
  for (const close of closers) await close();
});

async function freshPostgres() {
  const admin = postgres(PG!, { onnotice: () => {} });
  await admin.unsafe('drop schema if exists painel cascade');
  await admin.end();
  const pg = postgresForTests(PG!);
  closers.push(() => pg.end());
  return pg;
}

const backends: Array<[string, () => Promise<unknown> | unknown]> = [
  ['arquivos', () => useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'storage-')))],
  ...(PG ? ([['postgres', freshPostgres]] as Array<[string, () => Promise<unknown>]>) : []),
];

describe.each(backends)('armazenamento (%s)', (_name, setup) => {
  beforeEach(async () => {
    await setup();
  });

  it('lê o que gravou, com acentos e números', async () => {
    const data = { nome: 'Pão de queijo', preco: 1250, itens: [{ a: null }], ok: true };
    const etag = await storage().writeJSON('lojas/x/rascunho.json', data);
    const doc = await storage().readJSON<typeof data>('lojas/x/rascunho.json');
    expect(doc).toEqual({ data, etag });
    expect(await storage().readJSON('lojas/y/rascunho.json')).toBeNull();
  });

  it('não deixa duas pessoas sobrescreverem uma à outra', async () => {
    const s: Storage = storage();
    const first = await s.writeJSON('k.json', { v: 1 }, null);
    await expect(s.writeJSON('k.json', { v: 2 }, null)).rejects.toThrow(ConflictError);
    const second = await s.writeJSON('k.json', { v: 2 }, first);
    await expect(s.writeJSON('k.json', { v: 3 }, first)).rejects.toThrow(ConflictError);
    await expect(s.writeJSON('nao-existe.json', { v: 1 }, 'qualquer')).rejects.toThrow(ConflictError);
    expect((await s.readJSON('k.json'))).toEqual({ data: { v: 2 }, etag: second });
  });

  it('só um de vários gravando ao mesmo tempo ganha', async () => {
    const s = storage();
    const etag = await s.writeJSON('corrida.json', { n: 0 });
    const results = await Promise.allSettled(Array.from({ length: 6 }, (_, i) => s.writeJSON('corrida.json', { n: i + 1 }, etag)));
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  });

  it('lista por prefixo, em ordem, sem confundir _ e % com curingas', async () => {
    const s = storage();
    for (const k of ['pedidos/a/2026-10-02.json', 'pedidos/a/2026-10-01.json', 'pedidos/ab/x.json', 'pedidos/a_b/y.json', 'outro.json']) await s.writeJSON(k, {});
    expect(await s.list('pedidos/a/')).toEqual(['pedidos/a/2026-10-01.json', 'pedidos/a/2026-10-02.json']);
    expect(await s.list('pedidos/a_')).toEqual(['pedidos/a_b/y.json']);
    await s.remove('pedidos/a/2026-10-01.json');
    expect(await s.list('pedidos/a/')).toEqual(['pedidos/a/2026-10-02.json']);
  });

  it('guarda imagens e não troca uma que já existe', async () => {
    const s = storage();
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 255]);
    await s.writeFile('imagens/a.png', png, 'image/png');
    const file = await s.readFile('imagens/a.png');
    expect(file?.contentType).toBe('image/png');
    expect(Buffer.from(file!.body as Buffer).equals(png)).toBe(true);
    await expect(s.writeFile('imagens/a.png', Buffer.from([1]), 'image/png')).rejects.toThrow();
    expect(await s.list('imagens/')).toEqual(['imagens/a.png']);
  });
});

describe.each(backends)('cópia do armazenamento antigo (%s)', (_name, setup) => {
  it('copia tudo uma vez, sem passar por cima do que já existe no novo', async () => {
    useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'antigo-')));
    const old = storage();
    await old.writeJSON('lojas/a/rascunho.json', { nome: 'A' });
    await old.writeJSON('lojas/b/rascunho.json', { nome: 'B antigo' });
    await old.writeFile('imagens/foto.webp', Buffer.from([1, 2, 3]), 'image/webp');

    await setup();
    await storage().writeJSON('lojas/b/rascunho.json', { nome: 'B novo' });
    expect(await migrationDone()).toBe(false);

    const result = await migrateFromBlob('equipe@growlift', old);
    expect(result).toEqual({ copied: 2, skipped: 1, failed: [], finished: true });
    expect((await storage().readJSON('lojas/a/rascunho.json'))?.data).toEqual({ nome: 'A' });
    expect((await storage().readJSON('lojas/b/rascunho.json'))?.data).toEqual({ nome: 'B novo' });
    expect((await storage().readFile('imagens/foto.webp'))?.contentType).toBe('image/webp');
    expect(await migrationDone()).toBe(true);

    // Rodar de novo não copia nada.
    expect((await migrateFromBlob('equipe@growlift', old)).copied).toBe(0);
  });
});

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { carregarEnv } from './env';

carregarEnv();

/** Applies the login tables (Better Auth) and then every migrations/*.sql not applied yet. `--zerar` wipes the database first. */
export async function migrar(zerar = false) {
  const { pool, q, tx } = await import('../src/server/db');
  const { auth } = await import('../src/server/auth');
  const { getMigrations } = await import('better-auth/db/migration');
  if (zerar) {
    if (!['desenvolvimento', 'demonstracao'].includes(process.env.AMBIENTE ?? '')) throw new Error('Recusado: --zerar só roda com AMBIENTE=desenvolvimento ou demonstracao definido.');
    await q('drop schema public cascade');
    await q('create schema public');
  }
  const { runMigrations } = await getMigrations(auth().options);
  await runMigrations();
  await q('create table if not exists _migracoes (nome text primary key, aplicada_em timestamptz not null default now())');
  const feitas = new Set((await q<{ nome: string }>('select nome from _migracoes')).map((r) => r.nome));
  const dir = path.join(process.cwd(), 'migrations');
  for (const nome of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    if (feitas.has(nome)) continue;
    await tx(async (db) => {
      await db.query(readFileSync(path.join(dir, nome), 'utf8'));
      await db.query('insert into _migracoes (nome) values ($1)', [nome]);
    });
    console.log('migração aplicada:', nome);
  }
  const { agendarFilaNoBanco } = await import('../src/server/agendador-banco');
  console.log(await agendarFilaNoBanco((sql, params) => q(sql, params as unknown[])));
  return pool();
}

if (process.argv[1]?.endsWith('migrar.ts')) {
  migrar(process.argv.includes('--zerar'))
    .then(async () => {
      const { fecharPool } = await import('../src/server/db');
      await fecharPool();
      console.log('Banco pronto.');
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

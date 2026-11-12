import { Pool, type PoolClient, type QueryResultRow } from 'pg';

/** One pool per process (Next dev reloads modules; keep it on globalThis). */
const g = globalThis as unknown as { __growliftPool?: Pool };

export function pool(): Pool {
  if (!g.__growliftPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL não configurada. Copie .env.example para .env.local.');
    g.__growliftPool = new Pool({ connectionString: url, max: 10 });
  }
  return g.__growliftPool;
}

export interface Db {
  query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number | null }>;
}

/** Runs a parameterized query (never string-built) and returns the rows. */
export async function q<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = [], db: Db = pool()): Promise<T[]> {
  return (await db.query<T>(text, params)).rows;
}

export async function um<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = [], db: Db = pool()): Promise<T | null> {
  return (await q<T>(text, params, db))[0] ?? null;
}

export async function tx<T>(fn: (db: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query('begin');
    const out = await fn(client);
    await client.query('commit');
    return out;
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function fecharPool() {
  await g.__growliftPool?.end();
  g.__growliftPool = undefined;
  // The login library keeps the pool it was created with.
  (globalThis as unknown as { __growliftAuth?: unknown }).__growliftAuth = undefined;
}

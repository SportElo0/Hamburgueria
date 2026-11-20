import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { enderecoBanco } from './chaves';

/** One pool per process (Next dev reloads modules; keep it on globalThis). */
const g = globalThis as unknown as { __growliftPool?: Pool };

export function pool(): Pool {
  if (!g.__growliftPool) {
    const url = enderecoBanco();
    if (!url) throw new Error('Banco não configurado: defina DATABASE_URL (ou ligue a integração do Supabase, que cria POSTGRES_URL).');
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    // Hosted databases need TLS. Their pooler certificates are not always in Node's trust store: DATABASE_SSL=no-verify accepts them (encrypted, not verified).
    const ssl = local ? undefined : process.env.DATABASE_SSL === 'no-verify' ? { rejectUnauthorized: false } : true;
    // Serverless: many short-lived instances, so each keeps few connections.
    g.__growliftPool = new Pool({ connectionString: semSslmode(url), max: process.env.VERCEL ? 3 : 10, ssl });
  }
  return g.__growliftPool;
}

/** pg would let sslmode in the URL override the ssl option above, so it is removed (other parameters stay). */
export function semSslmode(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete('sslmode');
    return u.toString();
  } catch {
    return url;
  }
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

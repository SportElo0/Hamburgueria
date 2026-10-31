import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { BlobNotFoundError, BlobPreconditionFailedError, del, get, head, list, put } from '@vercel/blob';
import postgres from 'postgres';

/**
 * Tiny document store. Production: Postgres on Supabase (POSTGRES_URL), one row per document.
 * Before that it was a private Vercel Blob store (BLOB_READ_WRITE_TOKEN), kept only to copy the old data over.
 * Local dev and tests: files under PLATAFORMA_DATA_DIR (default .data/).
 * Every write can carry the etag it read, so two people editing the same store
 * cannot silently overwrite each other.
 */

export class ConflictError extends Error {
  constructor() {
    super('O conteúdo foi alterado por outra pessoa. Recarregue a página e tente de novo.');
  }
}

export interface Doc<T> {
  data: T;
  etag: string;
}

export interface Storage {
  readJSON<T>(key: string): Promise<Doc<T> | null>;
  /** `ifMatch`: etag from the read; `null` = must not exist yet; `undefined` = unconditional. */
  writeJSON<T>(key: string, data: T, ifMatch?: string | null): Promise<string>;
  readFile(key: string): Promise<{ body: ReadableStream<Uint8Array> | Buffer; contentType: string } | null>;
  writeFile(key: string, body: Buffer, contentType: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
  remove(key: string): Promise<void>;
}

class BlobStorage implements Storage {
  async readJSON<T>(key: string): Promise<Doc<T> | null> {
    // The download's HTTP etag is not the one `ifMatch` compares against; the API's is.
    // Read it first: if the blob changes before the body arrives, the next write conflicts instead of losing data.
    let etag: string;
    try {
      etag = (await head(key)).etag;
    } catch (err) {
      if (err instanceof BlobNotFoundError) return null;
      throw err;
    }
    const res = await get(key, { access: 'private', useCache: false });
    if (!res || !res.stream) return null;
    const text = await new Response(res.stream).text();
    return { data: JSON.parse(text) as T, etag };
  }

  async writeJSON<T>(key: string, data: T, ifMatch?: string | null): Promise<string> {
    try {
      const out = await put(key, JSON.stringify(data, null, 1), {
        access: 'private',
        addRandomSuffix: false,
        // Create-only writes are refused by the store itself if the key appeared meanwhile (atomic).
        allowOverwrite: ifMatch !== null,
        contentType: 'application/json',
        cacheControlMaxAge: 60,
        ...(ifMatch ? { ifMatch } : {}),
      });
      return out.etag;
    } catch (err) {
      if (ifMatch !== undefined && (err instanceof BlobPreconditionFailedError || /precondition|etag|412|exist/i.test(String((err as Error)?.message)))) {
        throw new ConflictError();
      }
      throw err;
    }
  }

  async readFile(key: string) {
    const res = await get(key, { access: 'private' });
    if (!res || !res.stream) return null;
    return { body: res.stream, contentType: res.blob.contentType ?? 'application/octet-stream' };
  }

  async writeFile(key: string, body: Buffer, contentType: string) {
    await put(key, body, { access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType });
  }

  async list(prefix: string) {
    const keys: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor, limit: 1000 });
      keys.push(...page.blobs.map((b) => b.pathname));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return keys;
  }

  async remove(key: string) {
    await del(key);
  }
}

/**
 * One table, outside Supabase's public API: the `painel` schema is not exposed, and row level security
 * with no policies closes it even if someone exposes it. Only this server's connection reads it.
 */
const SCHEMA = `
create schema if not exists painel;
create table if not exists painel.documentos (
  chave text collate "C" primary key,
  dados jsonb,
  arquivo bytea,
  tipo text,
  etag text not null,
  atualizado timestamptz not null default now()
);
alter table painel.documentos enable row level security;
do $$ begin
  -- Supabase's API roles: no way in, even if someone exposes the schema later.
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on schema painel from anon, authenticated;
    revoke all on all tables in schema painel from anon, authenticated;
  end if;
end $$;
`;

class PostgresStorage implements Storage {
  private sql: postgres.Sql;
  private ready: Promise<void> | null = null;

  constructor(url: string) {
    // Supabase's pooled URL carries extra query options the driver would send to the server as settings.
    let clean: URL;
    try {
      clean = new URL(url);
    } catch {
      // The parse error would carry the URL, password included, into the logs.
      throw new Error('POSTGRES_URL inválida.');
    }
    // TLS off only for a local test database, never on Vercel.
    const ssl = process.env.VERCEL ? true : clean.searchParams.get('sslmode') !== 'disable';
    clean.search = '';
    this.sql = postgres(clean.toString(), {
      ssl: ssl ? 'require' : false,
      // The transaction pooler (port 6543) cannot keep prepared statements between calls.
      prepare: false,
      max: 3,
      idle_timeout: 20,
      onnotice: () => {},
    });
  }

  private setup() {
    // Only the first start creates the table; later ones just check it is there (no locks).
    const create = async () => {
      const [row] = await this.sql<{ ok: boolean }[]>`select to_regclass('painel.documentos') is not null as ok`;
      if (!row.ok) await this.sql.unsafe(SCHEMA);
    };
    this.ready ??= create()
      .catch(async () => {
        // Two cold starts creating it at once: one of them loses the race; the table is there now.
        await create();
      })
      .catch((err) => {
        this.ready = null;
        throw err;
      });
    return this.ready;
  }

  private etag() {
    return crypto.randomUUID();
  }

  async readJSON<T>(key: string): Promise<Doc<T> | null> {
    await this.setup();
    const [row] = await this.sql<{ dados: string; etag: string }[]>`
      select dados::text as dados, etag from painel.documentos where chave = ${key} and dados is not null`;
    return row ? { data: JSON.parse(row.dados) as T, etag: row.etag } : null;
  }

  async writeJSON<T>(key: string, data: T, ifMatch?: string | null): Promise<string> {
    await this.setup();
    const text = JSON.stringify(data);
    const etag = this.etag();
    if (ifMatch === undefined) {
      await this.sql`
        insert into painel.documentos (chave, dados, etag) values (${key}, ${text}::text::jsonb, ${etag})
        on conflict (chave) do update set dados = excluded.dados, arquivo = null, tipo = null, etag = excluded.etag, atualizado = now()`;
      return etag;
    }
    const rows =
      ifMatch === null
        ? await this.sql`
            insert into painel.documentos (chave, dados, etag) values (${key}, ${text}::text::jsonb, ${etag})
            on conflict (chave) do nothing returning chave`
        : await this.sql`
            update painel.documentos set dados = ${text}::text::jsonb, etag = ${etag}, atualizado = now()
            where chave = ${key} and etag = ${ifMatch} and dados is not null returning chave`;
    if (rows.length === 0) throw new ConflictError();
    return etag;
  }

  async readFile(key: string) {
    await this.setup();
    const [row] = await this.sql<{ arquivo: Buffer; tipo: string | null }[]>`
      select arquivo, tipo from painel.documentos where chave = ${key} and arquivo is not null`;
    return row ? { body: row.arquivo, contentType: row.tipo ?? 'application/octet-stream' } : null;
  }

  async writeFile(key: string, body: Buffer, contentType: string) {
    await this.setup();
    // Like the blob store with allowOverwrite: false, an existing file is never replaced.
    await this.sql`
      insert into painel.documentos (chave, arquivo, tipo, etag) values (${key}, ${body}, ${contentType}, ${this.etag()})`;
  }

  async list(prefix: string) {
    await this.setup();
    const pattern = prefix.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
    const rows = await this.sql<{ chave: string }[]>`
      select chave from painel.documentos where chave like ${pattern} order by chave`;
    return rows.map((r) => r.chave);
  }

  async remove(key: string) {
    await this.setup();
    await this.sql`delete from painel.documentos where chave = ${key}`;
  }

  /** Tests only: drop the connection so the process can exit. */
  async end() {
    await this.sql.end({ timeout: 1 });
  }
}

class FileStorage implements Storage {
  constructor(private root: string) {}

  // Serialises read-check-write per key, standing in for the blob store's server-side conditions.
  private locks = new Map<string, Promise<unknown>>();
  private async exclusive<R>(key: string, fn: () => Promise<R>): Promise<R> {
    const prev = this.locks.get(key) ?? Promise.resolve();
    const run = prev.then(fn, fn);
    this.locks.set(key, run.catch(() => undefined));
    return run;
  }

  private file(key: string) {
    const target = path.resolve(this.root, key);
    if (!target.startsWith(path.resolve(this.root) + path.sep)) throw new Error('Caminho inválido');
    return target;
  }

  private etagOf(text: string | Buffer) {
    return crypto.createHash('sha1').update(text).digest('hex');
  }

  async readJSON<T>(key: string): Promise<Doc<T> | null> {
    try {
      const text = await fs.readFile(this.file(key), 'utf8');
      return { data: JSON.parse(text) as T, etag: this.etagOf(text) };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async writeJSON<T>(key: string, data: T, ifMatch?: string | null): Promise<string> {
    return this.exclusive(key, async () => {
      const current = await this.readJSON<T>(key);
      if (ifMatch === null && current) throw new ConflictError();
      if (ifMatch && current?.etag !== ifMatch) throw new ConflictError();
      const text = JSON.stringify(data, null, 1);
      const target = this.file(key);
      await fs.mkdir(path.dirname(target), { recursive: true });
      // Write aside and rename: a reader never sees a half-written file.
      const tmp = `${target}.${crypto.randomUUID()}.tmp`;
      await fs.writeFile(tmp, text);
      await fs.rename(tmp, target);
      return this.etagOf(text);
    });
  }

  async readFile(key: string) {
    try {
      const body = await fs.readFile(this.file(key));
      const meta = await this.readJSON<{ contentType: string }>(key + '.meta.json');
      return { body, contentType: meta?.data.contentType ?? 'application/octet-stream' };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async writeFile(key: string, body: Buffer, contentType: string) {
    const target = this.file(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, body, { flag: 'wx' });
    await this.writeJSON(key + '.meta.json', { contentType });
  }

  async list(prefix: string) {
    const out: string[] = [];
    const walk = async (dir: string) => {
      let entries: import('node:fs').Dirent[];
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) await walk(full);
        else if (!e.name.endsWith('.meta.json') && !e.name.endsWith('.tmp')) out.push(path.relative(this.root, full).split(path.sep).join('/'));
      }
    };
    await walk(this.root);
    return out.filter((k) => k.startsWith(prefix)).sort();
  }

  async remove(key: string) {
    await fs.rm(this.file(key), { force: true });
    await fs.rm(this.file(key + '.meta.json'), { force: true });
  }
}

let instance: Storage | null = null;

export function storage(): Storage {
  if (!instance) {
    instance = process.env.POSTGRES_URL
      ? new PostgresStorage(process.env.POSTGRES_URL)
      : process.env.BLOB_READ_WRITE_TOKEN
        ? new BlobStorage()
        : new FileStorage(path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.PLATAFORMA_DATA_DIR || '.data'));
  }
  return instance;
}

/** The old Vercel Blob store, while its data still has to be copied into Postgres. */
export function legacyBlob(): Storage | null {
  return process.env.POSTGRES_URL && process.env.BLOB_READ_WRITE_TOKEN ? new BlobStorage() : null;
}

/** Tests: a real Postgres (local: add ?sslmode=disable). */
export function postgresForTests(url: string) {
  const pg = new PostgresStorage(url);
  instance = pg;
  return pg;
}

/** Tests swap in a fresh directory. */
export function useFileStorage(root: string) {
  instance = new FileStorage(root);
}

import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { BlobNotFoundError, BlobPreconditionFailedError, del, get, head, list, put } from '@vercel/blob';

/**
 * Tiny document store. Production: a private Vercel Blob store (BLOB_READ_WRITE_TOKEN).
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
      await fs.writeFile(target, text);
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
        else if (!e.name.endsWith('.meta.json')) out.push(path.relative(this.root, full).split(path.sep).join('/'));
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
    instance = process.env.BLOB_READ_WRITE_TOKEN
      ? new BlobStorage()
      : new FileStorage(path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.PLATAFORMA_DATA_DIR || '.data'));
  }
  return instance;
}

/** Tests swap in a fresh directory. */
export function useFileStorage(root: string) {
  instance = new FileStorage(root);
}

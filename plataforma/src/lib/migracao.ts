import 'server-only';
import { ConflictError, legacyBlob, storage, type Storage } from '@/lib/storage';

/**
 * Copies everything from the old Vercel Blob store into Postgres, once.
 * Never overwrites: a key already in Postgres stays as it is, so it can run again after a timeout
 * and simply picks up where it stopped.
 */
const DONE_KEY = 'sistema/migracao-blob.json';

export interface MigrationResult {
  copied: number;
  skipped: number;
  failed: string[];
  finished: boolean;
}

export async function migrationDone() {
  return Boolean(await storage().readJSON(DONE_KEY));
}

/** True while there is an old store to copy from and the copy has not finished. */
export async function migrationPending() {
  return Boolean(legacyBlob()) && !(await migrationDone());
}

export async function migrateFromBlob(by: string, from: Storage | null = legacyBlob(), budgetMs = 50_000): Promise<MigrationResult> {
  if (!from) throw new Error('Não há armazenamento antigo para copiar.');
  const to = storage();
  const started = Date.now();
  const [source, existing] = await Promise.all([from.list(''), to.list('')]);
  const have = new Set(existing);
  const todo = source.filter((k) => !have.has(k));
  const result: MigrationResult = { copied: 0, skipped: source.length - todo.length, failed: [], finished: false };

  let next = 0;
  const worker = async () => {
    while (next < todo.length && Date.now() - started < budgetMs) {
      const key = todo[next++];
      try {
        if (key.endsWith('.json')) {
          const doc = await from.readJSON(key);
          if (doc) await to.writeJSON(key, doc.data, null);
        } else {
          const file = await from.readFile(key);
          if (file) {
            const body = Buffer.isBuffer(file.body) ? file.body : Buffer.from(await new Response(file.body).arrayBuffer());
            await to.writeFile(key, body, file.contentType);
          }
        }
        result.copied++;
      } catch (err) {
        // Someone wrote this key in Postgres meanwhile: theirs is newer.
        if (err instanceof ConflictError) result.skipped++;
        else result.failed.push(key);
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));

  result.finished = next >= todo.length && result.failed.length === 0;
  if (result.finished) {
    await to.writeJSON(DONE_KEY, { at: new Date().toISOString(), by, copied: result.copied, skipped: result.skipped });
  }
  return result;
}

import 'server-only';
import { ConflictError, storage } from './storage';

/**
 * Counters for abuse limits (orders, coupons, sign-ups, logins). One small doc per scope and
 * window holds the counts: limites/<scope>/<window>.json → { <hashed key>: count }.
 * Keys are hashed with the window, so no address or e-mail is kept in the clear or linkable across windows.
 */

const TZ = 'America/Sao_Paulo';
export const dayWindow = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
export const hourWindow = (d = new Date()) => `${dayWindow(d)}T${new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(d)}`;

const docKey = (scope: string, window: string) => `limites/${scope}/${window}.json`;

async function hashed(window: string, key: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${window}:${key}`));
  return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** The client's address as Vercel passes it; '' when unknown (local runs), which skips per-address limits. */
export const clientIp = (headers: Headers) => headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';

export async function count(scope: string, key: string, window: string): Promise<number> {
  const doc = await storage().readJSON<Record<string, number>>(docKey(scope, window));
  return doc?.data[await hashed(window, key)] ?? 0;
}

/** Adds one hit unless the key already reached `max`. Returns whether this hit was allowed. */
export async function take(scope: string, key: string, max: number, window: string): Promise<boolean> {
  const h = await hashed(window, key);
  for (let attempt = 0; attempt < 10; attempt++) {
    // A burst of hits on the same counter retries with a little random spacing instead of colliding again.
    if (attempt) await new Promise((r) => setTimeout(r, Math.random() * 20 * attempt));
    const doc = await storage().readJSON<Record<string, number>>(docKey(scope, window));
    const counts = doc?.data ?? {};
    if ((counts[h] ?? 0) >= max) return false;
    try {
      await storage().writeJSON(docKey(scope, window), { ...counts, [h]: (counts[h] ?? 0) + 1 }, doc ? doc.etag : null);
      return true;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 9) throw err;
    }
  }
  return false;
}

/** Records a hit with no ceiling (e.g. a failed login), for a later `count`. */
export const record = (scope: string, key: string, window: string) => take(scope, key, Number.MAX_SAFE_INTEGER, window);

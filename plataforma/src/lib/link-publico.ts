import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Instagram downloads each video and image from a public link at publishing time. These links are signed and expire
 * (90 minutes by default), and the route only serves files listed in the Conteúdos manifest, so nothing else is exposed.
 */

const MAX_TTL_S = 24 * 3600;
const strong = () => (process.env.SESSION_SECRET ?? '').length >= 32;
const secret = () => createHash('sha256').update('conteudos-publico:' + (process.env.SESSION_SECRET ?? '')).digest();
const sign = (rel: string, exp: number, jpg: boolean) => createHmac('sha256', secret()).update(`${rel}|${exp}|${jpg ? 1 : 0}`).digest('base64url');

export function signedContentUrl(origin: string, rel: string, opts: { jpg?: boolean; ttlMinutes?: number } = {}, now = Date.now()) {
  if (!strong()) throw new Error('SESSION_SECRET ausente ou curto: não dá para assinar links.');
  const exp = Math.floor(now / 1000) + Math.min(opts.ttlMinutes ?? 90, MAX_TTL_S / 60) * 60;
  const jpg = Boolean(opts.jpg);
  const path = rel.split('/').map(encodeURIComponent).join('/');
  return `${origin.replace(/\/$/, '')}/api/conteudos/publico/${path}?e=${exp}&s=${sign(rel, exp, jpg)}${jpg ? '&jpg=1' : ''}`;
}

export function verifyContentLink(rel: string, e: string | null, s: string | null, jpg: boolean, now = Date.now()) {
  const exp = Number(e);
  if (!Number.isInteger(exp) || !s || !strong()) return false;
  const nowS = Math.floor(now / 1000);
  if (exp < nowS || exp > nowS + MAX_TTL_S) return false;
  const want = Buffer.from(sign(rel, exp, jpg));
  const got = Buffer.from(s);
  return want.length === got.length && timingSafeEqual(want, got);
}

/**
 * Session cookie and password hashing on Web Crypto only, so the same code runs in the
 * proxy (edge-style runtime), in Server Functions and in tests.
 */

export const SESSION_COOKIE = 'plataforma_sessao';
export const SESSION_DAYS = 7;

export interface Session {
  email: string;
  name: string;
  exp: number;
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET ausente ou curto (mínimo 32 caracteres).');
  return s;
}

async function hmac(data: string, key = secret()) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(data)));
}

export async function signSession(session: Omit<Session, 'exp'>, now = Date.now()): Promise<string> {
  const payload: Session = { ...session, exp: now + SESSION_DAYS * 86_400_000 };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  return `${body}.${b64url(await hmac(body))}`;
}

export async function verifySession(token: string | undefined, now = Date.now()): Promise<Session | null> {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  try {
    if (!timingSafeEqual(await hmac(body), fromB64url(sig))) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as Session;
    if (typeof payload.exp !== 'number' || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

const ITERATIONS = 210_000;

/** Returns `pbkdf2.<iterations>.<salt>.<hash>` (dots, not `$`: .env files expand `$`). */
export async function hashPassword(password: string, salt = crypto.getRandomValues(new Uint8Array(16))): Promise<string> {
  const bits = await derive(password, salt, ITERATIONS);
  return `pbkdf2.${ITERATIONS}.${b64url(salt)}.${b64url(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iter, salt, hash] = stored.split(/[.$]/);
  if (scheme !== 'pbkdf2' || !iter || !salt || !hash) return false;
  const bits = await derive(password, fromB64url(salt), Number(iter));
  return timingSafeEqual(bits, fromB64url(hash));
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}

export interface TeamUser {
  email: string;
  name: string;
  hash: string;
}

/** Team accounts come from ADMIN_USERS: a JSON array of { email, name, hash }. */
export function teamUsers(raw = process.env.ADMIN_USERS): TeamUser[] {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as TeamUser[];
    return Array.isArray(list) ? list.filter((u) => u && u.email && u.hash) : [];
  } catch {
    return [];
  }
}

// A real hash of a random value, so unknown emails cost the same time as wrong passwords.
const DUMMY_HASH = 'pbkdf2.210000.eCAzA5ZVKqeqWGsesrdo-g.KDqd6hjPkfqmBszWRdu-00vcRG1bm0NSMZ8GLilWb98';

export async function authenticate(email: string, password: string, users = teamUsers()): Promise<TeamUser | null> {
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  const ok = await verifyPassword(password, user?.hash ?? DUMMY_HASH);
  return user && ok ? user : null;
}

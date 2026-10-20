import 'server-only';
import { storage, ConflictError } from './storage';
import { hashPassword, teamUsers, verifyPassword } from './session';

/**
 * Logins for a store's own staff (they see only that store's orders). The team creates them in the
 * panel and passes the generated password on once; only its hash is kept.
 *   acessos/<sha256(email)>.json    { email, name, slug, hash, createdAt, createdBy }
 *   lojas/<slug>/acessos.json       [{ email, name, createdAt }] for the panel list
 */

export interface Operator {
  email: string;
  name: string;
  slug: string;
  hash: string;
  createdAt: string;
  createdBy: string;
}

export interface OperatorSummary {
  email: string;
  name: string;
  createdAt: string;
}

async function keyOf(email: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.trim().toLowerCase()));
  return `acessos/${Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')}.json`;
}
const listKey = (slug: string) => `lojas/${slug}/acessos.json`;

export class OperatorError extends Error {}

/** Readable, unambiguous and long enough: 4 groups of 4 from 31 symbols (~79 bits). */
export function generatePassword() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  return [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join('')).join('-');
}

export async function listOperators(slug: string): Promise<OperatorSummary[]> {
  return (await storage().readJSON<OperatorSummary[]>(listKey(slug)))?.data ?? [];
}

async function updateList(slug: string, fn: (list: OperatorSummary[]) => OperatorSummary[]) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await storage().readJSON<OperatorSummary[]>(listKey(slug));
    try {
      await storage().writeJSON(listKey(slug), fn(doc?.data ?? []), doc ? doc.etag : null);
      return;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
}

/** Creates the login, or gives an existing login of this store a new password. Returns the password to hand over. */
export async function upsertOperator(slug: string, input: { email: string; name: string }, by: string): Promise<string> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new OperatorError('Informe um e-mail válido.');
  if (teamUsers().some((u) => u.email.toLowerCase() === email)) throw new OperatorError('Esse e-mail já é da equipe.');
  const key = await keyOf(email);
  const existing = await storage().readJSON<Operator>(key);
  if (existing && existing.data.slug !== slug) throw new OperatorError('Esse e-mail já acessa outra loja.');
  const password = generatePassword();
  const name = input.name.trim().slice(0, 60) || email;
  const operator: Operator = { email, name, slug, hash: await hashPassword(password), createdAt: new Date().toISOString(), createdBy: by };
  await storage().writeJSON(key, operator);
  await updateList(slug, (list) => [...list.filter((o) => o.email !== email), { email, name, createdAt: operator.createdAt }]);
  return password;
}

export async function removeOperator(slug: string, email: string) {
  const key = await keyOf(email);
  const existing = await storage().readJSON<Operator>(key);
  if (existing?.data.slug === slug) await storage().remove(key);
  await updateList(slug, (list) => list.filter((o) => o.email !== email.trim().toLowerCase()));
}

export async function authenticateOperator(email: string, password: string): Promise<Operator | null> {
  const doc = await storage().readJSON<Operator>(await keyOf(email));
  // Unknown emails still pay for a hash check, so timing does not reveal which logins exist.
  const ok = await verifyPassword(password, doc?.data.hash ?? 'pbkdf2.210000.eCAzA5ZVKqeqWGsesrdo-g.KDqd6hjPkfqmBszWRdu-00vcRG1bm0NSMZ8GLilWb98');
  return doc && ok ? doc.data : null;
}

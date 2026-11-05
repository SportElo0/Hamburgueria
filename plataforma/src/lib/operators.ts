import 'server-only';
import { storage, ConflictError } from './storage';
import { hashPassword, isFuncao, teamUsers, verifyPassword, type Funcao } from './session';

/**
 * Logins for a store's own staff (they see only that store's orders). The team creates them in the
 * panel and passes the generated password on once; only its hash is kept.
 *   acessos/<sha256(email)>.json    { email, name, slug, funcao, hash, createdAt, createdBy }
 *   lojas/<slug>/acessos.json       [{ email, name, funcao, createdAt }] for the panel list
 * Logins made before roles existed have no `funcao`: they are the owner's (dono).
 */

export interface Operator {
  email: string;
  name: string;
  slug: string;
  funcao?: Funcao;
  /** Signed up alone on the login screen (see cadastros.ts) and not approved yet. */
  pendente?: boolean;
  hash: string;
  createdAt: string;
  createdBy: string;
}

export interface OperatorSummary {
  email: string;
  name: string;
  funcao?: Funcao;
  createdAt: string;
}

export async function operatorKey(email: string) {
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
export async function upsertOperator(slug: string, input: { email: string; name: string; funcao: Funcao }, by: string, opts: { soNovo?: boolean; etag?: string } = {}): Promise<string> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new OperatorError('Informe um e-mail válido.');
  if (!isFuncao(input.funcao)) throw new OperatorError('Escolha a função: dono, cozinha ou garçom.');
  const funcao = input.funcao;
  if (teamUsers().some((u) => u.email.toLowerCase() === email)) throw new OperatorError('Esse e-mail já é da equipe.');
  const key = await operatorKey(email);
  const existing = await storage().readJSON<Operator>(key);
  if (existing && existing.data.slug !== slug) throw new OperatorError('Esse e-mail já acessa outra loja.');
  const password = generatePassword();
  const name = input.name.trim().slice(0, 60) || email;
  // A new password from the team does not approve a sign-up on its own: approval also creates the store.
  const pendente = existing?.data.slug === slug && existing.data.pendente ? true : undefined;
  const operator: Operator = { email, name, slug, funcao, ...(pendente ? { pendente } : {}), hash: await hashPassword(password), createdAt: new Date().toISOString(), createdBy: by };
  try {
    // `soNovo`: only if nobody created this e-mail meanwhile; `etag`: only if the login is still the one checked.
    await storage().writeJSON(key, operator, opts.soNovo ? null : opts.etag);
  } catch (err) {
    if (err instanceof ConflictError && (opts.soNovo || opts.etag)) throw new OperatorError(opts.soNovo ? 'Esse e-mail não pode ser usado. Use outro.' : 'Esse login mudou agora há pouco. Atualize a página.');
    throw err;
  }
  await updateList(slug, (list) => [...list.filter((o) => o.email !== email), { email, name, funcao, createdAt: operator.createdAt }]);
  return password;
}

/** Changes what a login sees, keeping its password. Takes effect on its next screen (the role is read on every request). */
export async function setOperatorFuncao(slug: string, email: string, funcao: Funcao, soEquipe = false) {
  if (!isFuncao(funcao)) throw new OperatorError('Função inválida.');
  const key = await operatorKey(email);
  let e = '';
  for (let attempt = 0; ; attempt++) {
    const doc = await storage().readJSON<Operator>(key);
    if (!doc || doc.data.slug !== slug) throw new OperatorError('Esse login não é desta loja.');
    // The owner's change is checked again on the copy it overwrites (the team may have just promoted this login).
    if (soEquipe && (doc.data.pendente || !isFuncaoEquipe(doc.data.funcao))) throw new OperatorError('Esse login é de dono: só a Growlift muda.');
    try {
      await storage().writeJSON(key, { ...doc.data, funcao }, doc.etag);
      e = doc.data.email;
      break;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
  await updateList(slug, (list) => list.map((o) => (o.email === e ? { ...o, funcao } : o)));
}

export async function removeOperator(slug: string, email: string) {
  const key = await operatorKey(email);
  const existing = await storage().readJSON<Operator>(key);
  if (existing?.data.slug === slug) await storage().remove(key);
  await updateList(slug, (list) => list.filter((o) => o.email !== email.trim().toLowerCase()));
}

export async function authenticateOperator(email: string, password: string): Promise<Operator | null> {
  const doc = await storage().readJSON<Operator>(await operatorKey(email));
  // Unknown emails still pay for a hash check, so timing does not reveal which logins exist.
  const ok = await verifyPassword(password, doc?.data.hash ?? 'pbkdf2.210000.eCAzA5ZVKqeqWGsesrdo-g.KDqd6hjPkfqmBszWRdu-00vcRG1bm0NSMZ8GLilWb98');
  return doc && ok ? doc.data : null;
}

/**
 * A staff session stays valid only while its login exists for that store and was not re-issued
 * after the session started: removing a login or giving it a new password ends old sessions. A role
 * change needs no new session: the role returned here (from storage, never from the cookie) is the one used.
 */
export async function operatorActive(email: string, slug: string, sessionStart: number): Promise<{ funcao: Funcao; pendente: boolean } | null> {
  const doc = await storage().readJSON<Operator>(await operatorKey(email));
  if (!doc || doc.data.slug !== slug || Date.parse(doc.data.createdAt) > sessionStart) return null;
  return { funcao: isFuncao(doc.data.funcao) ? doc.data.funcao : 'dono', pendente: doc.data.pendente === true };
}

/**
 * What a store's owner manages alone (Painel do dono › Equipe): the kitchen and waiter logins of their own
 * store. Owner logins, and sign-ups waiting for approval, stay with the Growlift team.
 */
export const EQUIPE_DO_DONO = ['cozinha', 'garcom'] as const satisfies readonly Funcao[];
export type FuncaoEquipe = (typeof EQUIPE_DO_DONO)[number];
export const isFuncaoEquipe = (v: unknown): v is FuncaoEquipe => typeof v === 'string' && (EQUIPE_DO_DONO as readonly string[]).includes(v);
export const MAX_LOGINS_LOJA = 30;

/** A kitchen or waiter login of this store, or an error the owner can read (never which other store an e-mail belongs to). */
async function equipeDaLoja(slug: string, email: unknown): Promise<Operator & { etag: string }> {
  if (typeof email !== 'string' || !email.trim()) throw new OperatorError('Login inválido.');
  const doc = await storage().readJSON<Operator>(await operatorKey(email));
  if (!doc || doc.data.slug !== slug) throw new OperatorError('Esse login não é desta loja. Atualize a página.');
  if (doc.data.pendente || !isFuncaoEquipe(doc.data.funcao)) throw new OperatorError('Esse login é de dono: só a Growlift muda.');
  return { ...doc.data, etag: doc.etag };
}

/** The owner adds a kitchen or waiter login. Returns the password to hand over in person. */
export async function donoAdicionaLogin(slug: string, input: { email: unknown; name: unknown; funcao: unknown }, by: string): Promise<{ email: string; password: string }> {
  if (!isFuncaoEquipe(input.funcao)) throw new OperatorError('Escolha a função: cozinha ou garçom.');
  if (typeof input.email !== 'string' || typeof input.name !== 'string') throw new OperatorError('Dados inválidos.');
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) throw new OperatorError('Informe um e-mail válido.');
  const existing = await storage().readJSON<Operator>(await operatorKey(email));
  if (existing) {
    throw new OperatorError(existing.data.slug === slug ? 'Esse e-mail já tem login nesta loja. Use “Nova senha” na lista.' : 'Esse e-mail não pode ser usado. Use outro.');
  }
  if ((await listOperators(slug)).length >= MAX_LOGINS_LOJA) throw new OperatorError(`A loja já tem ${MAX_LOGINS_LOJA} logins. Remova quem saiu antes de criar outro.`);
  try {
    return { email, password: await upsertOperator(slug, { email, name: input.name, funcao: input.funcao }, by, { soNovo: true }) };
  } catch (err) {
    // The team's message names "the team" or "another store"; the owner only needs to try another e-mail.
    if (err instanceof OperatorError && /equipe|outra loja/.test(err.message)) throw new OperatorError('Esse e-mail não pode ser usado. Use outro.');
    throw err;
  }
}

/** New password for a kitchen or waiter login; the old one, and its open sessions, stop working. */
export async function donoNovaSenha(slug: string, email: unknown, by: string): Promise<string> {
  const op = await equipeDaLoja(slug, email);
  return upsertOperator(slug, { email: op.email, name: op.name, funcao: op.funcao as FuncaoEquipe }, by, { etag: op.etag });
}

export async function donoMudaFuncao(slug: string, email: unknown, funcao: unknown) {
  if (!isFuncaoEquipe(funcao)) throw new OperatorError('Escolha a função: cozinha ou garçom.');
  const op = await equipeDaLoja(slug, email);
  await setOperatorFuncao(slug, op.email, funcao, true);
}

/** Removes a kitchen or waiter login; whoever is using it is logged out on their next screen. */
export async function donoRemoveLogin(slug: string, email: unknown) {
  const op = await equipeDaLoja(slug, email);
  await removeOperator(slug, op.email);
}

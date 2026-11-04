import 'server-only';
import { ConflictError, storage } from './storage';
import { createStore, getDraft, saveDraft } from './stores';
import { operatorKey, type Operator, type OperatorSummary } from './operators';
import { hashPassword, teamUsers } from './session';
import { slugify } from './slug';

/**
 * A restaurant signs up alone on the login screen ("Sou restaurante" › "Sou novo"): it creates its
 * owner's password right away, but only sees a waiting screen until the team approves. Approving
 * creates the store (draft, never published by this) and frees the login; refusing deletes it all.
 *   cadastros/<slug>.json   { slug, restaurante, dono, email, whatsapp, logo, criadoEm, status }
 * The owner's login itself lives with the other store logins (operators.ts), marked `pendente`.
 */

export interface Cadastro {
  slug: string;
  restaurante: string;
  dono: string;
  email: string;
  /** Digits only, with area code. Used by the team to talk to the owner; never sent to a site. */
  whatsapp: string;
  /** Storage key of the logo (midia/<slug>/<id>.<ext>), or '' without one. */
  logo: string;
  criadoEm: string;
  status: 'pendente' | 'aprovado';
  decididoPor?: string;
  decididoEm?: string;
}

export class CadastroError extends Error {}

const key = (slug: string) => `cadastros/${slug}.json`;
export const LOGO_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const MAX_LOGO = 2 * 1024 * 1024;
export const logoUrl = (storageKey: string) => (storageKey ? `/api/${storageKey}` : '');

function randomName() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface NovoCadastro {
  restaurante: string;
  dono: string;
  email: string;
  whatsapp: string;
  senha: string;
  logo: File | null;
}

/** Checks the form; returns the cleaned values or throws CadastroError with a message for the person. */
export function validarCadastro(input: NovoCadastro) {
  const restaurante = input.restaurante.trim().replace(/\s+/g, ' ');
  const dono = input.dono.trim().replace(/\s+/g, ' ');
  const email = input.email.trim().toLowerCase();
  const whatsapp = input.whatsapp.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  if (restaurante.length < 2 || restaurante.length > 80) throw new CadastroError('Escreva o nome do restaurante.');
  if (!slugify(restaurante)) throw new CadastroError('O nome do restaurante precisa ter letras ou números.');
  if (dono.length < 2 || dono.length > 60) throw new CadastroError('Escreva o seu nome.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) throw new CadastroError('Informe um e-mail válido.');
  if (!/^\d{10,11}$/.test(whatsapp)) throw new CadastroError('Informe o WhatsApp com DDD.');
  if (input.senha.length < 8) throw new CadastroError('A senha precisa ter pelo menos 8 letras ou números.');
  if (input.senha.length > 200) throw new CadastroError('A senha é longa demais.');
  if (input.logo && input.logo.size > 0) {
    if (!LOGO_TYPES[input.logo.type]) throw new CadastroError('A logo precisa ser uma imagem JPG, PNG ou WebP.');
    if (input.logo.size > MAX_LOGO) throw new CadastroError('A logo passa de 2 MB. Mande uma imagem menor.');
  }
  return { restaurante, dono, email, whatsapp };
}

/** Saves the sign-up and the owner's pending login. Returns the store address it reserved. */
export async function criarCadastro(input: NovoCadastro, now = new Date()): Promise<{ slug: string; email: string; nome: string }> {
  const { restaurante, dono, email, whatsapp } = validarCadastro(input);
  if (teamUsers().some((u) => u.email.toLowerCase() === email)) throw new CadastroError('Esse e-mail já tem conta. Use "Já tenho conta".');
  const opKey = await operatorKey(email);
  if (await storage().readJSON<Operator>(opKey)) throw new CadastroError('Esse e-mail já tem conta. Use "Já tenho conta" ou fale com a Growlift.');
  const hash = await hashPassword(input.senha);

  // Reserve a free address: not a store already, and not another sign-up (the write fails if it exists).
  const base = slugify(restaurante).slice(0, 50).replace(/-+$/, '') || 'restaurante';
  const criadoEm = now.toISOString();
  let cadastro: Cadastro | null = null;
  for (let n = 1; n <= 30 && !cadastro; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (await getDraft(slug)) continue;
    const doc: Cadastro = { slug, restaurante, dono, email, whatsapp, logo: '', criadoEm, status: 'pendente' };
    try {
      await storage().writeJSON(key(slug), doc, null);
      cadastro = doc;
    } catch (err) {
      if (!(err instanceof ConflictError)) throw err;
    }
  }
  if (!cadastro) throw new CadastroError('Não consegui reservar um endereço para esse nome. Fale com a Growlift.');

  const operator: Operator = { email, name: dono, slug: cadastro.slug, funcao: 'dono', pendente: true, hash, createdAt: criadoEm, createdBy: 'cadastro' };
  try {
    await storage().writeJSON(opKey, operator, null);
  } catch (err) {
    await storage().remove(key(cadastro.slug));
    if (err instanceof ConflictError) throw new CadastroError('Esse e-mail já tem conta. Use "Já tenho conta".');
    throw err;
  }

  if (input.logo && input.logo.size > 0) {
    const logo = `midia/${cadastro.slug}/${randomName()}.${LOGO_TYPES[input.logo.type]}`;
    try {
      await storage().writeFile(logo, Buffer.from(await input.logo.arrayBuffer()), input.logo.type);
      await storage().writeJSON(key(cadastro.slug), { ...cadastro, logo });
    } catch (err) {
      // The sign-up still counts without the logo; the team can ask for it on WhatsApp.
      console.error('logo do cadastro', err);
    }
  }
  return { slug: cadastro.slug, email, nome: dono };
}

export async function getCadastro(slug: string): Promise<Cadastro | null> {
  return (await storage().readJSON<Cadastro>(key(slug)))?.data ?? null;
}

export async function listarCadastros(): Promise<Cadastro[]> {
  const keys = (await storage().list('cadastros/')).filter((k) => k.endsWith('.json'));
  const docs = await Promise.all(keys.map((k) => storage().readJSON<Cadastro>(k)));
  return docs
    .map((d) => d?.data)
    .filter((c): c is Cadastro => Boolean(c))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

/** Creates the store (draft, with the logo) and frees the owner's login. */
export async function aprovarCadastro(slug: string, by: string, now = new Date()) {
  const doc = await storage().readJSON<Cadastro>(key(slug));
  if (!doc || doc.data.status !== 'pendente') throw new CadastroError('Esse cadastro não está mais esperando.');
  const c = doc.data;
  if (await getDraft(slug)) throw new CadastroError(`Já existe uma loja com o endereço ${slug}. Recuse e peça um novo cadastro, ou fale com o dono.`);
  const record = await createStore({ slug, name: c.restaurante, segment: 'restaurante' }, by);
  if (c.logo) {
    const draft = await getDraft(slug);
    if (draft) await saveDraft(slug, { ...record.store, extra: { ...record.store.extra, logo: logoUrl(c.logo) } }, draft.etag, by);
  }
  const opKey = await operatorKey(c.email);
  for (let attempt = 0; ; attempt++) {
    const op = await storage().readJSON<Operator>(opKey);
    if (!op || op.data.slug !== slug) break; // login removed meanwhile: the team creates one in Acesso da loja
    try {
      await storage().writeJSON(opKey, { ...op.data, pendente: undefined }, op.etag);
      break;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
  // The store's list of logins (Acesso da loja) shows the owner like any login the team created.
  const listKey = `lojas/${slug}/acessos.json`;
  const list = await storage().readJSON<OperatorSummary[]>(listKey);
  const entries = (list?.data ?? []).filter((o) => o.email !== c.email);
  await storage().writeJSON(listKey, [...entries, { email: c.email, name: c.dono, funcao: 'dono', createdAt: c.criadoEm }], list ? list.etag : null);
  await storage().writeJSON(key(slug), { ...c, status: 'aprovado', decididoPor: by, decididoEm: now.toISOString() }, doc.etag);
}

/** Deletes the sign-up, its pending login and its logo: nothing personal is kept from a refused sign-up. */
export async function recusarCadastro(slug: string) {
  const c = await getCadastro(slug);
  if (!c || c.status !== 'pendente') throw new CadastroError('Esse cadastro não está mais esperando.');
  const opKey = await operatorKey(c.email);
  const op = await storage().readJSON<Operator>(opKey);
  if (op?.data.slug === slug && op.data.pendente) await storage().remove(opKey);
  if (c.logo) await storage().remove(c.logo).catch((err) => console.error('logo do cadastro recusado', err));
  await storage().remove(key(slug));
}

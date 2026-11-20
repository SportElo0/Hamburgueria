import 'server-only';
import { createHash } from 'node:crypto';
import { storage } from './storage';

/**
 * Publishing to the Growlift Instagram (@growlift.ai) with the official Instagram API. Two kinds of token work:
 *   - starts with "IG": Instagram Login, host graph.instagram.com (the panel refreshes it every week);
 *   - starts with "EAA": Facebook / unified login (what newer Meta apps give), host graph.facebook.com. The account is
 *     found by its number: INSTAGRAM_USER_ID when set, else looked up through the token (/me, then /me/accounts).
 *
 * The access token is a secret: it is set in Vercel as INSTAGRAM_TOKEN and never committed. Long-lived tokens last
 * 60 days; for IG tokens the panel refreshes it before that and keeps the refreshed one in the store
 * (instagram/token.json). If the team puts a new token in Vercel, that one wins again.
 *
 * Publishing is two steps: create a media container (Instagram downloads the file from a public link), wait until it
 * is FINISHED, then publish it. See agenda.ts for the schedule around it.
 */

const isFacebookToken = (token: string) => token.startsWith('EAA');
/** The API host for this token (INSTAGRAM_API_URL overrides it, for tests). */
const API = (token: string) =>
  (process.env.INSTAGRAM_API_URL || (isFacebookToken(token) ? 'https://graph.facebook.com/v26.0' : 'https://graph.instagram.com/v26.0')).replace(/\/$/, '');
const REFRESH_URL = () => process.env.INSTAGRAM_REFRESH_URL || 'https://graph.instagram.com/refresh_access_token';
const TOKEN_KEY = 'instagram/token.json';
/** Refresh once a week: a refreshed token is good for 60 days, so a missed week or two never lets it lapse. */
const REFRESH_EVERY_MS = 7 * 86_400_000;

interface TokenDoc {
  token: string;
  /** Which INSTAGRAM_TOKEN this doc came from (a hash, never the token): a new one in Vercel replaces it. */
  envHash: string;
  refreshedAt: string;
  expiresAt: string | null;
  userId?: string;
  username?: string;
}

export class InstagramError extends Error {
  constructor(
    message: string,
    readonly code?: number,
  ) {
    super(message);
  }
}

const envToken = () => process.env.INSTAGRAM_TOKEN?.trim() || '';
const hashOf = (t: string) => createHash('sha256').update(t).digest('hex').slice(0, 16);

export const instagramConfigured = () => Boolean(envToken());

async function tokenDoc(): Promise<{ doc: TokenDoc; etag: string | null } | null> {
  const env = envToken();
  if (!env) return null;
  const stored = await storage().readJSON<TokenDoc>(TOKEN_KEY);
  if (stored && stored.data.envHash === hashOf(env)) return { doc: stored.data, etag: stored.etag };
  return { doc: { token: env, envHash: hashOf(env), refreshedAt: '', expiresAt: null }, etag: stored ? stored.etag : null };
}

async function saveToken(doc: TokenDoc, etag: string | null) {
  await storage()
    .writeJSON(TOKEN_KEY, doc, etag)
    .catch(() => undefined); // someone else saved at the same time: theirs is just as good
}

/** One Graph API call. The token goes in the body or query, never in an error message or log. */
async function call<T>(method: 'GET' | 'POST', where: string, params: Record<string, string | undefined>, token: string): Promise<T> {
  const url = new URL(where.startsWith('http') ? where : API(token) + where);
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, access_token: token })) if (v !== undefined) (method === 'GET' ? url.searchParams : body).set(k, v);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      body: method === 'POST' ? body : undefined,
      headers: method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    throw new InstagramError('O Instagram não respondeu. Tentamos de novo na próxima verificação.');
  }
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string; code?: number; error_user_msg?: string } } & T;
  if (!res.ok || json.error) throw new InstagramError((json.error?.error_user_msg || json.error?.message || `Instagram respondeu ${res.status}`).slice(0, 300), json.error?.code);
  return json;
}

async function auth() {
  const t = await tokenDoc();
  if (!t) throw new InstagramError('O Instagram ainda não foi conectado (falta o INSTAGRAM_TOKEN na Vercel).');
  return t;
}

const ID = /^\d{5,25}$/;

/** The connected account (cached after the first call). */
export async function account(): Promise<{ userId: string; username: string }> {
  const { doc, etag } = await auth();
  const fixed = process.env.INSTAGRAM_USER_ID?.trim() ?? '';
  if (fixed && !ID.test(fixed)) throw new InstagramError('INSTAGRAM_USER_ID inválido: deve ser só o número da conta do Instagram.');
  const wanted = fixed || doc.userId || '';
  if (wanted && doc.userId === wanted && doc.username !== undefined) return { userId: wanted, username: doc.username };

  let userId = wanted;
  let username = '';
  if (userId) {
    // Known number: this call also proves the token works.
    const u = await call<{ username?: string }>('GET', `/${userId}`, { fields: 'username' }, doc.token);
    username = u.username ?? '';
  } else {
    const found = await findAccount(doc.token);
    userId = found.userId;
    username = found.username;
  }
  if (!ID.test(userId)) throw new InstagramError('O Instagram devolveu uma conta inválida.');
  await saveToken({ ...doc, userId, username }, etag);
  return { userId, username };
}

/** Finds the Instagram professional account behind a token that came without its number. */
async function findAccount(token: string): Promise<{ userId: string; username: string }> {
  type Acc = { id: string; username?: string };
  // Instagram Login tokens answer /me with the account itself. (Facebook tokens have no user_id field: skip this.)
  if (!isFacebookToken(token)) {
    const me = await call<{ id?: string; user_id?: string; username?: string }>('GET', '/me', { fields: 'user_id,username' }, token);
    if (me.user_id && ID.test(String(me.user_id))) return { userId: String(me.user_id), username: me.username ?? '' };
  }
  // Facebook tokens: the account hangs off the Page it is linked to.
  let detail = '';
  const pages = await call<{ data?: { instagram_business_account?: Acc }[] }>('GET', '/me/accounts', { fields: 'instagram_business_account{id,username}' }, token).catch((err) => {
    detail = err instanceof InstagramError ? err.message : '';
    return { data: [] as { instagram_business_account?: Acc }[] };
  });
  const accounts = (pages.data ?? []).map((p) => p.instagram_business_account).filter((a): a is Acc => Boolean(a?.id));
  const pick = accounts.find((a) => a.username === 'growlift.ai') ?? accounts[0];
  if (pick) return { userId: String(pick.id), username: pick.username ?? '' };
  throw new InstagramError(
    `Não achei a conta do Instagram por este token${detail ? ` (${detail})` : ''}. Coloque o número da conta na variável INSTAGRAM_USER_ID da Vercel (ele aparece na página do app, no passo "Gerar tokens de acesso").`,
  );
}

/** Keeps the long-lived token alive. Safe to call often: it only refreshes once a week. */
export async function refreshTokenIfDue(now = new Date()) {
  const t = await tokenDoc();
  if (!t) return;
  // The weekly refresh is an Instagram Login feature; Facebook (EAA) tokens are replaced by hand when they expire.
  if (isFacebookToken(t.doc.token)) return;
  const last = t.doc.refreshedAt ? Date.parse(t.doc.refreshedAt) : 0;
  if (last && now.getTime() - last < REFRESH_EVERY_MS) return;
  try {
    const r = await call<{ access_token: string; expires_in?: number }>('GET', REFRESH_URL(), { grant_type: 'ig_refresh_token' }, t.doc.token);
    await saveToken(
      { ...t.doc, token: r.access_token, refreshedAt: now.toISOString(), expiresAt: r.expires_in ? new Date(now.getTime() + r.expires_in * 1000).toISOString() : null },
      t.etag,
    );
  } catch (err) {
    // A token younger than 24 h can't be refreshed yet; it will be next time. Never log the token itself.
    console.error('instagram: renovar token', err instanceof Error ? err.message : err);
    if (!last) await saveToken({ ...t.doc, refreshedAt: new Date(now.getTime() - REFRESH_EVERY_MS + 86_400_000).toISOString() }, t.etag);
  }
}

export interface ContainerInput {
  caption: string;
  ai: boolean;
}

export async function createReel(input: ContainerInput & { videoUrl: string; coverUrl?: string }) {
  const { doc } = await auth();
  const { userId } = await account();
  const r = await call<{ id: string }>(
    'POST',
    `/${userId}/media`,
    {
      media_type: 'REELS',
      video_url: input.videoUrl,
      cover_url: input.coverUrl,
      caption: input.caption,
      share_to_feed: 'true',
      is_ai_generated: input.ai ? 'true' : undefined,
    },
    doc.token,
  );
  return r.id;
}

/** A photo post, or one slide of a carousel (`child`: no caption or AI flag, those go on the carousel). */
export async function createImage(input: { imageUrl: string; child?: boolean; caption?: string; ai?: boolean }) {
  const { doc } = await auth();
  const { userId } = await account();
  const r = await call<{ id: string }>(
    'POST',
    `/${userId}/media`,
    {
      image_url: input.imageUrl,
      is_carousel_item: input.child ? 'true' : undefined,
      caption: input.child ? undefined : input.caption,
      is_ai_generated: !input.child && input.ai ? 'true' : undefined,
    },
    doc.token,
  );
  return r.id;
}

export async function createCarousel(input: ContainerInput & { children: string[] }) {
  const { doc } = await auth();
  const { userId } = await account();
  const r = await call<{ id: string }>(
    'POST',
    `/${userId}/media`,
    { media_type: 'CAROUSEL', children: input.children.join(','), caption: input.caption, is_ai_generated: input.ai ? 'true' : undefined },
    doc.token,
  );
  return r.id;
}

export type ContainerStatus = 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED';

export async function containerStatus(id: string) {
  const { doc } = await auth();
  const r = await call<{ status_code?: ContainerStatus; status?: string }>('GET', `/${encodeURIComponent(id)}`, { fields: 'status_code,status' }, doc.token);
  return { code: r.status_code ?? 'IN_PROGRESS', detail: r.status ?? '' };
}

export async function publishContainer(creationId: string) {
  const { doc } = await auth();
  const { userId } = await account();
  const r = await call<{ id: string }>('POST', `/${userId}/media_publish`, { creation_id: creationId }, doc.token);
  return r.id;
}

export async function permalinkOf(mediaId: string) {
  const { doc } = await auth();
  const r = await call<{ permalink?: string }>('GET', `/${encodeURIComponent(mediaId)}`, { fields: 'permalink' }, doc.token).catch(() => ({ permalink: '' }));
  return r.permalink && /^https:\/\/(www\.)?instagram\.com\//.test(r.permalink) ? r.permalink : '';
}

/** How many API posts were used in the last 24 hours (Instagram allows 100; a carousel counts as one). */
export async function publishingUsage() {
  const { doc } = await auth();
  const { userId } = await account();
  const r = await call<{ data?: { quota_usage?: number; config?: { quota_total?: number } }[] }>('GET', `/${userId}/content_publishing_limit`, { fields: 'quota_usage,config' }, doc.token);
  const d = r.data?.[0];
  return { used: d?.quota_usage ?? 0, total: d?.config?.quota_total ?? 100 };
}

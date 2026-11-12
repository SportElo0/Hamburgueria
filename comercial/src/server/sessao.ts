import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import { auth } from './auth';
import { contextoDe, type Ctx } from './contexto';
import { NaoEncontrado } from './erros';

export interface Sessao {
  userId: string;
  nome: string;
  email: string;
  ctx: Ctx | null;
  adminPlataforma: boolean;
}

/** Who is logged in, read from the session cookie on every request (never from anything the page sends). */
export const sessao = cache(async (): Promise<Sessao | null> => {
  const s = await auth().api.getSession({ headers: await headers() });
  if (!s) return null;
  const { ctx, adminPlataforma } = await contextoDe(s.user.id, s.user.name);
  return { userId: s.user.id, nome: s.user.name, email: s.user.email, ctx, adminPlataforma };
});

/** Pages and actions of the company panel start here. */
export async function exigirCtx(): Promise<Ctx> {
  const s = await sessao();
  if (!s) redirect('/login');
  if (!s.ctx) redirect(s.adminPlataforma ? '/admin' : '/login?sem=empresa');
  return s.ctx;
}

export async function exigirPlataforma(): Promise<Sessao> {
  const s = await sessao();
  if (!s) redirect('/login');
  if (!s.adminPlataforma) redirect('/painel');
  return s;
}

/** Visitor address, hashed with a server secret: used only to limit abuse, never stored with a request. */
export async function ipHash(): Promise<string> {
  const h = await headers();
  // The platform's own header first (the browser cannot set it); a client-supplied list is the last resort, and then its last entry.
  const xff = h.get('x-forwarded-for')?.split(',').map((x) => x.trim()).filter(Boolean);
  const ip = h.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || xff?.at(-1) || 'local';
  return createHash('sha256').update(`${process.env.BETTER_AUTH_SECRET}:${ip}`).digest('hex').slice(0, 24);
}

/** A record of another company (or a wrong id) is simply "not found": the page says nothing about it. */
export async function ouNaoEncontrado<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (err) {
    if (err instanceof NaoEncontrado) notFound();
    throw err;
  }
}

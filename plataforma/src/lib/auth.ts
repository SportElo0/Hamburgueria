import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { SESSION_COOKIE, SESSION_DAYS, canUse, homeOf, isTeam, verifySession, type Funcao, type Session } from './session';
import { operatorActive } from './operators';

/** Once per request. A store's staff session also needs its login to still exist (see operatorActive). */
export const currentUser = cache(async (): Promise<Session | null> => {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (session?.role !== 'loja') return session;
  const active = await operatorActive(session.email, session.slug ?? '', session.exp - SESSION_DAYS * 86_400_000);
  if (!active) return null;
  // Role and approval come from the stored login, never from the cookie.
  return { ...session, funcao: active.funcao, pendente: active.pendente || undefined };
});

/** Agency team only. Every page and Server Function checks the session itself; the proxy redirect is only a convenience. */
export async function requireUser(): Promise<Session> {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (!isTeam(user)) redirect(homeOf(user));
  return user;
}

/** Which store roles open each group of screens (the team opens all). */
export const DONO = ['dono'] as const;
/** Orders board, open/closed and sold-out switches. */
export const COZINHA = ['dono', 'cozinha'] as const;
/** Floor, tables, bookings and the waiting list. */
export const SALAO = ['dono', 'garcom'] as const;
/** Marking an order done is used by the kitchen and by the waiter delivering it. */
export const TODOS = ['dono', 'cozinha', 'garcom'] as const;

/**
 * The team, or the staff of this one store. With `funcoes`, only those store roles (the team always
 * passes); anyone else goes to their own start screen, which their role can always open.
 */
export async function requireStoreAccess(slug: string, funcoes?: readonly Funcao[]): Promise<Session> {
  const user = await currentUser();
  if (!user) redirect(`/login?volta=/loja/${slug}`);
  if (!canUse(user, slug, funcoes)) redirect(homeOf(user));
  return user;
}

/** Same check for Route Handlers, which answer with a status instead of redirecting. */
export async function storeAccess(slug: string, funcoes?: readonly Funcao[]): Promise<Session | null> {
  const user = await currentUser();
  if (!user) return null;
  return canUse(user, slug, funcoes) ? user : null;
}

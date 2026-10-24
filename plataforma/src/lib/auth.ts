import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, isTeam, verifySession, type Session } from './session';

export async function currentUser(): Promise<Session | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Agency team only. Every page and Server Function checks the session itself; the proxy redirect is only a convenience. */
export async function requireUser(): Promise<Session> {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (!isTeam(user)) redirect(`/loja/${user.slug}`);
  return user;
}

/** The team, or the staff of this one store. */
export async function requireStoreAccess(slug: string): Promise<Session> {
  const user = await currentUser();
  if (!user) redirect(`/login?volta=/loja/${slug}`);
  if (!isTeam(user) && user.slug !== slug) redirect(`/loja/${user.slug}`);
  return user;
}

/** Same check for Route Handlers, which answer with a status instead of redirecting. */
export async function storeAccess(slug: string): Promise<Session | null> {
  const user = await currentUser();
  if (!user) return null;
  return isTeam(user) || user.slug === slug ? user : null;
}

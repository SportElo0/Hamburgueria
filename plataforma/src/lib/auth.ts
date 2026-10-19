import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySession, type Session } from './session';

export async function currentUser(): Promise<Session | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Every page and Server Function checks the session itself; the proxy redirect is only a convenience. */
export async function requireUser(): Promise<Session> {
  const user = await currentUser();
  if (!user) redirect('/login');
  return user;
}

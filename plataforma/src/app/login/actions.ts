'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authenticate, SESSION_COOKIE, SESSION_DAYS, signSession, type Session } from '@/lib/session';
import { authenticateOperator } from '@/lib/operators';

export interface LoginState {
  error?: string;
  /** Echoed back so the form keeps it after React resets the inputs. */
  email?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('senha') ?? '');
  const back = String(formData.get('volta') ?? '');
  const team = await authenticate(email, password);
  const operator = team ? null : await authenticateOperator(email, password);
  const user: Omit<Session, 'exp'> | null = team
    ? { email: team.email, name: team.name, role: 'equipe' }
    : operator
      ? { email: operator.email, name: operator.name, role: 'loja', slug: operator.slug }
      : null;
  if (!user) {
    // Slow down guessing a little; the PBKDF2 cost already makes each attempt expensive.
    await new Promise((r) => setTimeout(r, 600));
    return { error: 'E-mail ou senha incorretos.', email };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86_400,
  });
  if (user.role === 'loja') redirect(`/loja/${user.slug}`);
  redirect(back.startsWith('/painel') || back.startsWith('/loja/') ? back : '/painel');
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect('/login');
}

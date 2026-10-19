'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authenticate, SESSION_COOKIE, SESSION_DAYS, signSession } from '@/lib/session';

export interface LoginState {
  error?: string;
  /** Echoed back so the form keeps it after React resets the inputs. */
  email?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('senha') ?? '');
  const back = String(formData.get('volta') ?? '');
  const user = await authenticate(email, password);
  if (!user) {
    // Slow down guessing a little; the PBKDF2 cost already makes each attempt expensive.
    await new Promise((r) => setTimeout(r, 600));
    return { error: 'E-mail ou senha incorretos.', email };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession({ email: user.email, name: user.name }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86_400,
  });
  redirect(back.startsWith('/painel') ? back : '/painel');
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect('/login');
}

'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authenticate, homeOf, isFuncao, SESSION_COOKIE, SESSION_DAYS, signSession, type Session } from '@/lib/session';
import { authenticateOperator } from '@/lib/operators';
import { clientIp, count, dayWindow, hourWindow, record, take } from '@/lib/limits';
import { CadastroError, criarCadastro } from '@/lib/cadastros';

/** Failed logins allowed per hour, per e-mail and per address, before the form stops trying. */
const MAX_FAILS_EMAIL = 10;
const MAX_FAILS_IP = 30;

export interface LoginState {
  error?: string;
  /** Echoed back so the form keeps it after React resets the inputs. */
  email?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('senha') ?? '');
  const back = String(formData.get('volta') ?? '');
  const ip = clientIp(await headers());
  const hour = hourWindow();
  const who = email.trim().toLowerCase();
  if ((await count('login-email', who, hour)) >= MAX_FAILS_EMAIL || (ip && (await count('login-ip', ip, hour)) >= MAX_FAILS_IP)) {
    return { error: 'Muitas tentativas erradas. Espere uma hora ou peça uma nova senha à equipe.', email };
  }
  const team = await authenticate(email, password);
  const operator = team ? null : await authenticateOperator(email, password);
  const user: Omit<Session, 'exp'> | null = team
    ? { email: team.email, name: team.name, role: 'equipe' }
    : operator
      ? { email: operator.email, name: operator.name, role: 'loja', slug: operator.slug, funcao: isFuncao(operator.funcao) ? operator.funcao : 'dono', ...(operator.pendente ? { pendente: true } : {}) }
      : null;
  if (!user) {
    await record('login-email', who, hour);
    if (ip) await record('login-ip', ip, hour);
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
  if (user.role === 'loja') redirect(!user.pendente && (back.startsWith(`/loja/${user.slug}/`) || back === `/loja/${user.slug}`) ? back : homeOf(user));
  redirect(back.startsWith('/painel') || back.startsWith('/loja/') ? back : '/painel');
}

export interface CadastroState {
  error?: string;
  /** Echoed back so the form keeps what was typed (never the password or the logo). */
  valores?: { restaurante: string; dono: string; email: string; whatsapp: string };
}

/** Sign-ups per address per hour and in the whole panel per day: enough for real restaurants, a wall for robots. */
const MAX_CADASTROS_IP = 3;
const MAX_CADASTROS_DIA = 30;

/** "Sou restaurante" › "Sou novo": creates the owner's password and a sign-up the team approves. */
export async function cadastrar(_prev: CadastroState, formData: FormData): Promise<CadastroState> {
  const field = (k: string) => {
    const v = formData.get(k);
    return typeof v === 'string' ? v : '';
  };
  const valores = { restaurante: field('restaurante'), dono: field('dono'), email: field('email'), whatsapp: field('whatsapp') };
  // A field people never see: only robots fill it. Answer as if it worked, without saving anything.
  if (field('site')) return { error: 'Não foi possível enviar agora. Tente de novo mais tarde.', valores };
  if (field('aceite') !== 'sim') return { error: 'Para criar a conta, marque que leu como usamos os seus dados.', valores };
  if (field('senha') !== field('senha2')) return { error: 'As duas senhas não são iguais.', valores };
  const logo = formData.get('logo');
  const ip = clientIp(await headers());
  if (!(await take('cadastro-dia', 'todos', MAX_CADASTROS_DIA, dayWindow())) || (ip && !(await take('cadastro-ip', ip, MAX_CADASTROS_IP, hourWindow())))) {
    return { error: 'Muitos cadastros agora. Tente de novo mais tarde ou chame a Growlift no WhatsApp.', valores };
  }
  let user: Omit<Session, 'exp'>;
  try {
    const c = await criarCadastro({ ...valores, senha: field('senha'), logo: logo instanceof File ? logo : null });
    user = { email: c.email, name: c.nome, role: 'loja', slug: c.slug, funcao: 'dono', pendente: true };
  } catch (err) {
    if (err instanceof CadastroError) return { error: err.message, valores };
    console.error('cadastro', err);
    return { error: 'Não foi possível criar a conta. Tente de novo.', valores };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86_400,
  });
  redirect('/cadastro/aguardando');
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect('/login');
}

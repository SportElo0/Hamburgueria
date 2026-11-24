import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { segredoSessao } from './chaves';
import { pool } from './db';
import { emSegundoPlano, enviarEmail } from './email';

const g = globalThis as unknown as { __growliftAuth?: ReturnType<typeof criar> };

function criar() {
  return betterAuth({
    database: pool(),
    baseURL: process.env.APP_URL ?? 'http://localhost:3100',
    secret: segredoSessao(),
    emailAndPassword: {
      enabled: true,
      // Accounts are created only by invitation or by the Growlift admin, never by open sign-up.
      disableSignUp: true,
      resetPasswordTokenExpiresIn: 60 * 60,
      minPasswordLength: 10,
      revokeSessionsOnPasswordReset: true,
      // Sent through the e-mail provider when configured; without one it is a simulated e-mail (never stored in production).
      // Not awaited: the answer must take the same time whether the e-mail exists or not (see pedirNovaSenha).
      sendResetPassword: async ({ user, url }) => {
        emSegundoPlano(() => enviarEmail({
          para: user.email,
          assunto: 'Redefinir a senha · Growlift Comercial',
          link: url,
          texto: `Recebemos um pedido para criar uma senha nova para ${user.email}.\n\nPara criar a senha, abra: ${url}\n\nSe não foi você, ignore este e-mail: a senha atual continua valendo.`,
        }));
      },
    },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: { enabled: true, window: 60, max: 30 },
    advanced: { cookiePrefix: 'growlift' },
    plugins: [nextCookies()],
  });
}

export function auth() {
  if (!g.__growliftAuth) g.__growliftAuth = criar();
  return g.__growliftAuth;
}

/** Creates a login from the server (invitation accepted, demo data, Growlift admin). */
export async function criarUsuario(email: string, nome: string, senha: string): Promise<string> {
  const ctx = await auth().$context;
  const limpo = email.trim().toLowerCase();
  const existente = await ctx.internalAdapter.findUserByEmail(limpo);
  if (existente) throw new Error('Já existe um login com este e-mail.');
  const user = await ctx.internalAdapter.createUser({ email: limpo, name: nome.trim(), emailVerified: true }, { method: 'admin' });
  await ctx.internalAdapter.linkAccount({ userId: user.id, providerId: 'credential', accountId: user.id, password: await ctx.password.hash(senha) });
  return user.id;
}

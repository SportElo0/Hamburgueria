import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { segredoSessao } from './chaves';
import { ambiente } from './config';
import { pool, q } from './db';

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
      minPasswordLength: 10,
      revokeSessionsOnPasswordReset: true,
      // No e-mail provider yet: the message is stored and shown to the Growlift admin as a simulation.
      sendResetPassword: async ({ user, url }) => {
        // Without an e-mail provider the link would only sit in the database: in production it is not stored at all.
        if (ambiente() === 'producao') return;
        await q('insert into emails_simulados (para, assunto, corpo) values ($1, $2, $3)', [
          user.email,
          'Redefinir a senha',
          `Para criar uma senha nova, abra: ${url}`,
        ]);
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

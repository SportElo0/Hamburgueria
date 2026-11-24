import { hkdfSync } from 'node:crypto';

/**
 * Server keys. Each one comes from its own variable when set (recommended for production). When it is not set, it is
 * derived with HKDF, one independent key per purpose, from a secret the database integration already put in the
 * environment: nobody has to create or copy a secret by hand. That base is SUPABASE_JWT_SECRET (Supabase) or, on Vercel
 * with another managed Postgres (Neon), the database user and password. Rotating that secret changes the derived keys
 * (logins end and stored WhatsApp tokens must be saved again), so a real customer setup should set these variables
 * explicitly (and VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY for phone alerts, see push.ts).
 */
export function segredoBase(): string | undefined {
  const supabase = process.env.SUPABASE_JWT_SECRET;
  if (supabase && supabase.length >= 32) return supabase;
  if (process.env.VERCEL !== '1') return undefined;
  try {
    const u = new URL(process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || enderecoBanco() || '');
    const senha = decodeURIComponent(u.password);
    return senha.length >= 12 ? `banco:${decodeURIComponent(u.username)}:${senha}` : undefined;
  } catch {
    return undefined;
  }
}

function derivar(rotulo: string): string | undefined {
  const base = segredoBase();
  if (!base) return undefined;
  return Buffer.from(hkdfSync('sha256', base, 'growlift-comercial', rotulo, 32)).toString('base64');
}

export const segredoSessao = () => process.env.BETTER_AUTH_SECRET || derivar('sessao');
export const chaveCredenciais = () => process.env.CHAVE_CREDENCIAIS || derivar('credenciais');
export const segredoAgendador = () => process.env.CRON_SECRET || derivar('agendador');
export const enderecoBanco = () => process.env.DATABASE_URL || process.env.POSTGRES_URL;

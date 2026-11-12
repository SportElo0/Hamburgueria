import { hkdfSync } from 'node:crypto';

/**
 * Server keys. Each one comes from its own variable when set (recommended for production). When it is not set and the
 * Supabase integration is connected, it is derived from SUPABASE_JWT_SECRET with HKDF, one independent key per purpose:
 * nobody has to create or copy a secret by hand. Rotating that Supabase secret changes the derived keys (logins end and
 * stored WhatsApp tokens must be saved again), so a real customer setup should set the three variables explicitly.
 */
function derivar(rotulo: string): string | undefined {
  const base = process.env.SUPABASE_JWT_SECRET;
  if (!base || base.length < 32) return undefined;
  return Buffer.from(hkdfSync('sha256', base, 'growlift-comercial', rotulo, 32)).toString('base64');
}

export const segredoSessao = () => process.env.BETTER_AUTH_SECRET || derivar('sessao');
export const chaveCredenciais = () => process.env.CHAVE_CREDENCIAIS || derivar('credenciais');
export const segredoAgendador = () => process.env.CRON_SECRET || derivar('agendador');
export const enderecoBanco = () => process.env.DATABASE_URL || process.env.POSTGRES_URL;

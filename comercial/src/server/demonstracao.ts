import { createHmac } from 'node:crypto';
import { auth, criarUsuario } from './auth';
import { segredoSessao } from './chaves';
import { ambiente } from './config';
import { VISITANTE_DEMO } from './contexto';
import { q, um } from './db';

/**
 * "Entrar na demonstração": one shared login inside the fictitious Lumivale, used by the button on the login page,
 * without typing a password. It only exists in the demonstration and development environments. The password is
 * derived on the server from the session secret and never shown; the login is flagged as a visitor (see
 * exigirNaoVisitante), so settings, invitations, keys, phone alerts, sending proposals, export and deletion stay locked.
 */
export const EMPRESA_DEMO = 'lumivale-demo';

export const demonstracaoAberta = () => ambiente() !== 'producao';

export function senhaVisitante(): string {
  const segredo = segredoSessao() ?? (ambiente() === 'desenvolvimento' ? 'desenvolvimento-local' : '');
  if (!segredo) throw new Error('Sem segredo de sessão: a demonstração aberta fica desligada.');
  return createHmac('sha256', segredo).update('growlift-visitante-demo').digest('base64url');
}

/** Creates the visitor login (admin of the demo company) when missing and keeps its password in sync with the secret. */
export async function garantirVisitante(): Promise<{ email: string; senha: string } | null> {
  if (!demonstracaoAberta()) return null;
  const empresa = await um<{ id: string }>('select id from empresas where slug = $1 and demonstracao and ativa', [EMPRESA_DEMO]);
  if (!empresa) return null;
  const senha = senhaVisitante();
  const ctx = await auth().$context;
  const existente = await ctx.internalAdapter.findUserByEmail(VISITANTE_DEMO);
  const userId = existente?.user.id ?? (await criarUsuario(VISITANTE_DEMO, 'Visitante da demonstração', senha));
  await q(`insert into membros (user_id, empresa_id, papel) values ($1, $2, 'admin') on conflict do nothing`, [userId, empresa.id]);
  return { email: VISITANTE_DEMO, senha };
}

/** After a secret change the stored hash no longer matches: set it again (only for the visitor). */
export async function reporSenhaVisitante(): Promise<void> {
  const ctx = await auth().$context;
  const u = await ctx.internalAdapter.findUserByEmail(VISITANTE_DEMO);
  if (u) await ctx.internalAdapter.updatePassword(u.user.id, await ctx.password.hash(senhaVisitante()));
}

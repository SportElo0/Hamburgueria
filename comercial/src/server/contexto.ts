import { NaoAutorizado } from './erros';
import { q, um, type Db } from './db';

/**
 * Who is acting and for which company. Always built on the server from the session
 * (see sessao.ts); a company id sent by the browser is never trusted.
 */
export interface Ctx {
  userId: string;
  nome: string;
  empresaId: string;
  papel: 'admin' | 'vendedor';
  /** Set when a Growlift admin is inside a company through a logged access grant. */
  acessoAdmin?: string;
}

export const ator = (ctx: Ctx) => ({ tipo: ctx.acessoAdmin ? ('admin_growlift' as const) : ('usuario' as const), id: ctx.userId });

export function exigirAdmin(ctx: Ctx) {
  if (ctx.papel !== 'admin') throw new NaoAutorizado('Só o administrador da empresa pode fazer isso.');
}

/** Resolves the company context of a login: its own membership, or an active Growlift admin grant. */
export async function contextoDe(userId: string, nome: string): Promise<{ ctx: Ctx | null; adminPlataforma: boolean }> {
  const admin = !!(await um('select 1 from admins_plataforma where user_id = $1', [userId]));
  const m = await um<{ empresa_id: string; papel: 'admin' | 'vendedor' }>(
    `select m.empresa_id, m.papel from membros m join empresas e on e.id = m.empresa_id
     where m.user_id = $1 and m.ativo and e.ativa`,
    [userId],
  );
  if (m) return { ctx: { userId, nome, empresaId: m.empresa_id, papel: m.papel }, adminPlataforma: admin };
  if (admin) {
    const a = await um<{ id: string; empresa_id: string }>(
      'select id, empresa_id from acessos_admin where user_id = $1 and fim > now() order by inicio desc limit 1',
      [userId],
    );
    if (a) return { ctx: { userId, nome, empresaId: a.empresa_id, papel: 'admin', acessoAdmin: a.id }, adminPlataforma: true };
  }
  return { ctx: null, adminPlataforma: admin };
}

export interface NovoEvento {
  oportunidadeId?: string | null;
  contatoId?: string | null;
  conversaId?: string | null;
  ator: { tipo: 'usuario' | 'admin_growlift' | 'ia' | 'sistema' | 'visitante'; id?: string | null };
  tipo: string;
  dados?: Record<string, unknown>;
}

/** Audit trail: every relevant change of an opportunity, conversation or setting. */
export async function registrar(db: Db, empresaId: string, e: NovoEvento) {
  await q(
    `insert into eventos (empresa_id, oportunidade_id, contato_id, conversa_id, ator_tipo, ator_id, tipo, dados)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [empresaId, e.oportunidadeId ?? null, e.contatoId ?? null, e.conversaId ?? null, e.ator.tipo, e.ator.id ?? null, e.tipo, JSON.stringify(e.dados ?? {})],
    db,
  );
}

export interface NovaTarefa {
  oportunidadeId?: string | null;
  conversaId?: string | null;
  tipo: string;
  titulo: string;
  detalhe?: string;
  prazo?: Date | null;
  responsavelId?: string | null;
  /** Same key = same task: creating it twice does nothing. */
  chave?: string;
  link?: string;
}

/** Creates a task and its internal notification (to the assignee, or to the company admins when there is none). */
export async function criarTarefa(db: Db, empresaId: string, t: NovaTarefa): Promise<string | null> {
  const r = await um<{ id: string }>(
    `insert into tarefas (empresa_id, oportunidade_id, conversa_id, tipo, titulo, detalhe, prazo, responsavel_id, chave)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     on conflict (empresa_id, chave) do nothing returning id`,
    [empresaId, t.oportunidadeId ?? null, t.conversaId ?? null, t.tipo, t.titulo, t.detalhe ?? '', t.prazo ?? null, t.responsavelId ?? null, t.chave ?? null],
    db,
  );
  if (!r) return null;
  await q('insert into notificacoes (empresa_id, user_id, titulo, corpo, link) values ($1, $2, $3, $4, $5)', [
    empresaId,
    t.responsavelId ?? null,
    t.titulo,
    t.detalhe ?? '',
    t.link ?? (t.oportunidadeId ? `/painel/oportunidades/${t.oportunidadeId}` : t.conversaId ? `/painel/atendimento/${t.conversaId}` : '/painel/tarefas'),
  ], db);
  return r.id;
}

/** Fixed-window counter in the database. Returns false when the limit was passed. */
export async function dentroDoLimite(chave: string, max: number, janelaSegundos: number): Promise<boolean> {
  const r = await um<{ total: number }>(
    `insert into limites (chave, janela, total)
     values ($1, to_timestamp(floor(extract(epoch from now()) / $2) * $2), 1)
     on conflict (chave, janela) do update set total = limites.total + 1 returning total`,
    [chave, janelaSegundos],
  );
  return (r?.total ?? 0) <= max;
}

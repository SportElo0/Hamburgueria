import { pool, q, um, type Db } from './db';

/**
 * Job queue kept in the database. A job has a unique key, so scheduling the same thing twice
 * does nothing, and restarting the worker neither loses nor repeats work.
 */
export interface Trabalho {
  id: string;
  empresa_id: string;
  tipo: string;
  dados: Record<string, unknown>;
  executar_em: Date;
  estado: 'pendente' | 'executando' | 'concluido' | 'falhou' | 'cancelado' | 'incerto';
  tentativas: number;
  max_tentativas: number;
  chave: string | null;
  conversa_id: string | null;
  oportunidade_id: string | null;
  criado_em: Date;
}

export interface NovoTrabalho {
  tipo: string;
  dados?: Record<string, unknown>;
  em?: Date;
  chave: string;
  conversaId?: string | null;
  oportunidadeId?: string | null;
  maxTentativas?: number;
}

export async function agendar(db: Db, empresaId: string, t: NovoTrabalho): Promise<string | null> {
  const r = await um<{ id: string }>(
    `insert into trabalhos (empresa_id, tipo, dados, executar_em, chave, conversa_id, oportunidade_id, max_tentativas)
     values ($1, $2, $3, $4, $5, $6, $7, $8) on conflict (chave) do nothing returning id`,
    [empresaId, t.tipo, JSON.stringify(t.dados ?? {}), t.em ?? new Date(), t.chave, t.conversaId ?? null, t.oportunidadeId ?? null, t.maxTentativas ?? 3],
    db,
  );
  return r?.id ?? null;
}

/** Cancels pending jobs of a conversation and/or opportunity. Returns how many were cancelled. */
export async function cancelarPendentes(
  db: Db,
  empresaId: string,
  alvo: { conversaId?: string | null; oportunidadeId?: string | null; tipos: string[] },
  motivo: string,
): Promise<number> {
  if (!alvo.conversaId && !alvo.oportunidadeId) return 0;
  const r = await db.query(
    `update trabalhos set estado = 'cancelado', resultado = $5, concluido_em = now()
     where empresa_id = $1 and estado = 'pendente' and tipo = any($4)
       and (($2::uuid is not null and conversa_id = $2) or ($3::uuid is not null and oportunidade_id = $3))`,
    [empresaId, alvo.conversaId ?? null, alvo.oportunidadeId ?? null, alvo.tipos, motivo],
  );
  return r.rowCount ?? 0;
}

/** Claims the next due job (or one whose worker died mid-run), safely among several workers. */
export async function pegar(apenasId?: string): Promise<Trabalho | null> {
  return um<Trabalho>(
    `update trabalhos set estado = 'executando', tentativas = tentativas + 1, bloqueado_ate = now() + interval '2 minutes'
     where id = (
       select id from trabalhos
       where ((estado = 'pendente' and executar_em <= now()) or (estado = 'executando' and bloqueado_ate < now()))
         and ($1::uuid is null or id = $1)
       order by executar_em limit 1 for update skip locked
     ) returning *`,
    [apenasId ?? null],
  );
}

export type Resultado =
  | { tipo: 'concluido'; nota?: string }
  | { tipo: 'cancelado'; motivo: string }
  | { tipo: 'adiar'; para: Date; nota?: string }
  | { tipo: 'repetir'; erro: string }
  | { tipo: 'falhou'; erro: string }
  | { tipo: 'incerto'; erro: string };

export type Executor = (t: Trabalho) => Promise<Resultado>;

/** Runs one claimed job and records what happened. Retries are limited and spaced out. */
export async function executar(t: Trabalho, executores: Record<string, Executor>): Promise<Resultado> {
  let r: Resultado;
  try {
    const fn = executores[t.tipo];
    r = fn ? await fn(t) : { tipo: 'falhou', erro: `Tipo de trabalho desconhecido: ${t.tipo}` };
  } catch (err) {
    r = { tipo: 'repetir', erro: err instanceof Error ? err.message : String(err) };
  }
  if (r.tipo === 'repetir' && t.tentativas >= t.max_tentativas) r = { tipo: 'falhou', erro: r.erro };
  const db = pool();
  if (r.tipo === 'concluido') await q(`update trabalhos set estado = 'concluido', resultado = $2, concluido_em = now(), bloqueado_ate = null where id = $1`, [t.id, r.nota ?? null], db);
  else if (r.tipo === 'cancelado') await q(`update trabalhos set estado = 'cancelado', resultado = $2, concluido_em = now(), bloqueado_ate = null where id = $1`, [t.id, r.motivo], db);
  else if (r.tipo === 'adiar') await q(`update trabalhos set estado = 'pendente', executar_em = $2, resultado = $3, tentativas = tentativas - 1, bloqueado_ate = null where id = $1`, [t.id, r.para, r.nota ?? null], db);
  else if (r.tipo === 'repetir') await q(`update trabalhos set estado = 'pendente', executar_em = now() + make_interval(secs => 30 * power(4, tentativas - 1)), ultimo_erro = $2, bloqueado_ate = null where id = $1`, [t.id, r.erro.slice(0, 500)], db);
  else await q(`update trabalhos set estado = $3, ultimo_erro = $2, concluido_em = now(), bloqueado_ate = null where id = $1`, [t.id, r.erro.slice(0, 500), r.tipo], db);
  return r;
}

/** Runs everything that is due right now. Used by the worker loop and by tests. */
export async function processarPendentes(executores: Record<string, Executor>, max = 50): Promise<number> {
  let n = 0;
  for (; n < max; n++) {
    const t = await pegar();
    if (!t) break;
    await executar(t, executores);
  }
  return n;
}

import { Conhecimento } from './config';
import { ator, exigirAdmin, registrar, type Ctx } from './contexto';
import { tx, um, type Db } from './db';
import { ErroDeUso } from './erros';

export interface VersaoConhecimento {
  versao: number;
  dados: Conhecimento;
  criado_em: Date;
}

/** The approved content the assistant may use. Every save is a new version; answers record which one they used. */
export async function conhecimentoAtual(empresaId: string, db?: Db): Promise<VersaoConhecimento> {
  const l = await um<{ versao: number; dados: unknown; criado_em: Date }>('select versao, dados, criado_em from conhecimento where empresa_id = $1 order by versao desc limit 1', [empresaId], db);
  const r = Conhecimento.safeParse(l?.dados ?? {});
  return { versao: l?.versao ?? 0, dados: r.success ? r.data : Conhecimento.parse({}), criado_em: l?.criado_em ?? new Date(0) };
}

export async function salvarConhecimento(ctx: Ctx, entrada: unknown): Promise<number> {
  exigirAdmin(ctx);
  const r = Conhecimento.safeParse(entrada);
  if (!r.success) throw new ErroDeUso(`Não foi possível salvar: ${r.error.issues[0]?.path.join(' › ')} ${r.error.issues[0]?.message}`);
  return tx(async (db) => {
    await db.query('select pg_advisory_xact_lock(hashtext($1))', [`conhecimento:${ctx.empresaId}`]);
    const atual = await um<{ v: number }>('select coalesce(max(versao), 0) as v from conhecimento where empresa_id = $1', [ctx.empresaId], db);
    const versao = (atual?.v ?? 0) + 1;
    await db.query('insert into conhecimento (empresa_id, versao, dados, criado_por) values ($1, $2, $3, $4)', [ctx.empresaId, versao, JSON.stringify(r.data), ctx.userId]);
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'conhecimento_alterado', dados: { versao } });
    return versao;
  });
}

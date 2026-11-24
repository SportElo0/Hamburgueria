import { ETAPAS, type Etapa } from './config';
import type { Ctx } from './contexto';
import { q, um } from './db';

export interface Metricas {
  dias: number;
  /** Requests received in the period (opportunities opened). Denominator of the averages below. */
  pedidos: number;
  porOrigem: { origem: string; total: number }[];
  /** Current stage of every opportunity of the company (not limited to the period). */
  porEtapa: Record<Etapa, number>;
  /** Minutes from the request to the first action of a person. Only requests already attended count. */
  primeiroHumano: { mediana: number | null; atendidos: number; aguardando: number };
  /** Minutes from the request to the automatic confirmation message. Only requests that got one count. */
  confirmacaoAuto: { mediana: number | null; confirmados: number };
  pendenciasVencidas: number;
  propostasEnviadas: number;
  ganhos: number;
  perdidos: number;
  /** Sum of the values typed by sellers on won deals closed in the period. A commercial value, not profit. */
  valorGanhoCentavos: number;
  ganhosSemValor: number;
  tecnico?: { mensagensFalhas: number; mensagensIncertas: number; trabalhosFalhos: number; iaRespostasMes: number; iaFalhasMes: number; iaTokensMes: number; iaLimiteMes: number };
}

/** Numbers of the company for the last N days. Everything is counted from what people and customers registered; nothing is estimated. */
export async function metricas(ctx: Ctx, dias = 30, limiteIa = 0): Promise<Metricas> {
  const d = Math.min(365, Math.max(1, Math.round(dias)));
  const p = [ctx.empresaId, d];
  const desde = `now() - make_interval(days => $2)`;
  const g = await um<{ pedidos: number; atendidos: number; aguardando: number; med_humano: number | null; confirmados: number; med_conf: number | null; propostas: number; ganhos: number; perdidos: number; valor: string; sem_valor: number }>(
    `select
       count(*) filter (where entrada_em >= ${desde})::int as pedidos,
       count(*) filter (where entrada_em >= ${desde} and primeiro_humano_em is not null)::int as atendidos,
       count(*) filter (where entrada_em >= ${desde} and primeiro_humano_em is null and etapa = 'novo')::int as aguardando,
       percentile_cont(0.5) within group (order by extract(epoch from primeiro_humano_em - entrada_em) / 60) filter (where entrada_em >= ${desde} and primeiro_humano_em is not null) as med_humano,
       count(*) filter (where entrada_em >= ${desde} and confirmacao_auto_em is not null)::int as confirmados,
       percentile_cont(0.5) within group (order by extract(epoch from confirmacao_auto_em - entrada_em) / 60) filter (where entrada_em >= ${desde} and confirmacao_auto_em is not null) as med_conf,
       count(*) filter (where proposta_em >= ${desde})::int as propostas,
       count(*) filter (where etapa = 'ganho' and fechada_em >= ${desde})::int as ganhos,
       count(*) filter (where etapa = 'perdido' and fechada_em >= ${desde})::int as perdidos,
       coalesce(sum(valor_proposta_centavos) filter (where etapa = 'ganho' and fechada_em >= ${desde}), 0) as valor,
       count(*) filter (where etapa = 'ganho' and fechada_em >= ${desde} and valor_proposta_centavos is null)::int as sem_valor
     from oportunidades where empresa_id = $1`,
    p,
  );
  const porOrigem = await q<{ origem: string; total: number }>(`select origem, count(*)::int as total from oportunidades where empresa_id = $1 and entrada_em >= ${desde} group by origem order by total desc`, p);
  const etapas = await q<{ etapa: Etapa; total: number }>('select etapa, count(*)::int as total from oportunidades where empresa_id = $1 group by etapa', [ctx.empresaId]);
  const vencidas = await um<{ n: number }>('select count(*)::int as n from tarefas where empresa_id = $1 and concluida_em is null and prazo < now()', [ctx.empresaId]);
  const porEtapa = Object.fromEntries(ETAPAS.map((e) => [e, etapas.find((x) => x.etapa === e)?.total ?? 0])) as Record<Etapa, number>;
  const out: Metricas = {
    dias: d,
    pedidos: g?.pedidos ?? 0,
    porOrigem,
    porEtapa,
    primeiroHumano: { mediana: g?.med_humano ?? null, atendidos: g?.atendidos ?? 0, aguardando: g?.aguardando ?? 0 },
    confirmacaoAuto: { mediana: g?.med_conf ?? null, confirmados: g?.confirmados ?? 0 },
    pendenciasVencidas: vencidas?.n ?? 0,
    propostasEnviadas: g?.propostas ?? 0,
    ganhos: g?.ganhos ?? 0,
    perdidos: g?.perdidos ?? 0,
    valorGanhoCentavos: Number(g?.valor ?? 0),
    ganhosSemValor: g?.sem_valor ?? 0,
  };
  // Integration failures and technical consumption: company admins only.
  if (ctx.papel === 'admin') {
    const t = await um<{ falhas: number; incertas: number; trabalhos: number; respostas: number; ia_falhas: number; tokens: string }>(
      `select
         (select count(*)::int from mensagens where empresa_id = $1 and estado = 'falhou' and criado_em >= ${desde}) as falhas,
         (select count(*)::int from mensagens where empresa_id = $1 and estado = 'incerta' and criado_em >= ${desde}) as incertas,
         (select count(*)::int from trabalhos where empresa_id = $1 and estado in ('falhou', 'incerto') and criado_em >= ${desde}) as trabalhos,
         coalesce((select respostas from uso_ia where empresa_id = $1 and mes = date_trunc('month', now())::date), 0) as respostas,
         coalesce((select falhas from uso_ia where empresa_id = $1 and mes = date_trunc('month', now())::date), 0) as ia_falhas,
         coalesce((select tokens_entrada + tokens_saida from uso_ia where empresa_id = $1 and mes = date_trunc('month', now())::date), 0) as tokens`,
      p,
    );
    out.tecnico = { mensagensFalhas: t?.falhas ?? 0, mensagensIncertas: t?.incertas ?? 0, trabalhosFalhos: t?.trabalhos ?? 0, iaRespostasMes: t?.respostas ?? 0, iaFalhasMes: t?.ia_falhas ?? 0, iaTokensMes: Number(t?.tokens ?? 0), iaLimiteMes: limiteIa };
  }
  return out;
}

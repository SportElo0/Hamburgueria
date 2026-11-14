import { z } from 'zod';
import { ator, exigirAdmin, registrar, type Ctx } from './contexto';
import { q, tx } from './db';
import { empresaPorId } from './empresas';
import { ErroDeUso } from './erros';

/**
 * Cost per request and per sale of each ad. Requests carry the ad that brought them (utm_source / utm_campaign of the
 * link, or the Google/Meta click id); the company types how much it spent on each ad in the month.
 * Counted by the month the request came in (a request of March that became a sale in April counts for March).
 * Nothing is estimated: without the amount spent, the cost columns stay empty.
 */

export interface LinhaAnuncio {
  fonte: string;
  campanha: string;
  pedidos: number;
  atendidos: number;
  propostas: number;
  ganhos: number;
  valorGanhoCentavos: number;
  investimentoCentavos: number | null;
}

/** Ad source of a request, from its tracking fields. Empty = it did not come from a tagged ad. */
const FONTE = `lower(trim(coalesce(nullif(o.campanha ->> 'utm_source', ''), case when o.campanha ? 'gclid' then 'google' when o.campanha ? 'fbclid' then 'facebook' else '' end)))`;
const CAMPANHA = `trim(coalesce(o.campanha ->> 'utm_campaign', ''))`;

export function validarMes(mes: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new ErroDeUso('Mês inválido.');
  return `${mes}-01`;
}

export async function resultadosAnuncios(ctx: Ctx, mes: string): Promise<LinhaAnuncio[]> {
  exigirAdmin(ctx);
  const inicio = validarMes(mes);
  const linhas = await q<{ fonte: string; campanha: string; pedidos: number; atendidos: number; propostas: number; ganhos: number; valor: string; inv: string | null }>(
    `with p as (
       select ${FONTE} as fonte, ${CAMPANHA} as campanha,
              count(*)::int as pedidos,
              count(*) filter (where o.primeiro_humano_em is not null)::int as atendidos,
              count(*) filter (where o.proposta_em is not null)::int as propostas,
              count(*) filter (where o.etapa = 'ganho')::int as ganhos,
              coalesce(sum(o.valor_proposta_centavos) filter (where o.etapa = 'ganho'), 0) as valor
       from oportunidades o
       where o.empresa_id = $1 and o.entrada_em >= ($2::date::timestamp at time zone $3) and o.entrada_em < (($2::date + interval '1 month')::timestamp at time zone $3)
       group by 1, 2
     )
     select coalesce(p.fonte, i.fonte) as fonte, coalesce(p.campanha, i.campanha) as campanha,
            coalesce(p.pedidos, 0) as pedidos, coalesce(p.atendidos, 0) as atendidos, coalesce(p.propostas, 0) as propostas,
            coalesce(p.ganhos, 0) as ganhos, coalesce(p.valor, 0) as valor, i.valor_centavos as inv
     from p full join (select fonte, campanha, valor_centavos from investimentos where empresa_id = $1 and mes = $2::date) i
       on i.fonte = p.fonte and i.campanha = p.campanha
     order by (coalesce(p.fonte, i.fonte) = '') , coalesce(p.pedidos, 0) desc, 1, 2`,
    [ctx.empresaId, inicio, (await empresaPorId(ctx.empresaId))?.config.regras.fuso ?? 'America/Sao_Paulo'],
  );
  return linhas.map((l) => ({ fonte: l.fonte, campanha: l.campanha, pedidos: l.pedidos, atendidos: l.atendidos, propostas: l.propostas, ganhos: l.ganhos, valorGanhoCentavos: Number(l.valor), investimentoCentavos: l.inv == null ? null : Number(l.inv) }));
}

const Investimento = z.object({
  mes: z.string(),
  fonte: z.string().trim().toLowerCase().min(1, 'Diga de onde é o anúncio (ex.: facebook, google).').max(60),
  campanha: z.string().trim().max(120).default(''),
  valorCentavos: z.number().int().min(0).max(100_000_000_00),
});

/** Saves (or, with zero, removes) the amount spent on one ad in one month. */
export async function salvarInvestimento(ctx: Ctx, entrada: z.input<typeof Investimento>) {
  exigirAdmin(ctx);
  const r = Investimento.safeParse(entrada);
  if (!r.success) throw new ErroDeUso(r.error.issues[0]?.message ?? 'Valor inválido.');
  const mes = validarMes(r.data.mes);
  await tx(async (db) => {
    if (r.data.valorCentavos === 0) {
      await q('delete from investimentos where empresa_id = $1 and mes = $2 and fonte = $3 and campanha = $4', [ctx.empresaId, mes, r.data.fonte, r.data.campanha], db);
    } else {
      await q(
        `insert into investimentos (empresa_id, mes, fonte, campanha, valor_centavos, atualizado_por) values ($1, $2, $3, $4, $5, $6)
         on conflict (empresa_id, mes, fonte, campanha) do update set valor_centavos = excluded.valor_centavos, atualizado_por = excluded.atualizado_por, atualizado_em = now()`,
        [ctx.empresaId, mes, r.data.fonte, r.data.campanha, r.data.valorCentavos, ctx.userId],
        db,
      );
    }
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'investimento_informado', dados: { mes: r.data.mes, fonte: r.data.fonte, campanha: r.data.campanha, valor_centavos: r.data.valorCentavos } });
  });
}

import { z } from 'zod';
import { ator, exigirAdmin, exigirNaoVisitante, registrar, type Ctx } from './contexto';
import { q, tx, um } from './db';
import { ErroDeUso, NaoAutorizado, NaoEncontrado } from './erros';

/**
 * Money that came in for a sale (down payment, balance, an instalment), told by a person of the team. The platform does
 * not charge anyone: this is the record that lets the owner see, request by request, what was actually paid.
 */
export const RELATOS = { '': 'Não informado', voltou_pela_retomada: 'O cliente voltou depois da retomada', fechou_sem_retomada: 'Fechou sem precisar da retomada' } as const;
export type Relato = keyof typeof RELATOS;

const Recebimento = z.object({
  valorCentavos: z.number({ error: 'Informe o valor recebido.' }).int().positive('O valor recebido precisa ser maior que zero.').max(10_000_000_000, 'Valor alto demais.'),
  recebidoEm: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data em que o dinheiro entrou.'),
  descricao: z.string().trim().max(80, 'Descrição de no máximo 80 caracteres.').default(''),
});

export interface LinhaRecebimento {
  id: string;
  valor_centavos: number;
  recebido_em: string;
  descricao: string;
  criado_por: string | null;
  criado_nome: string | null;
  criado_em: Date;
}

/** Today in the company's time zone, as YYYY-MM-DD (what a date field shows). */
export const hojeEm = (fuso: string, d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

export async function registrarRecebimento(ctx: Ctx, oportunidadeId: string, entrada: z.input<typeof Recebimento>): Promise<string> {
  exigirNaoVisitante(ctx);
  if (!/^[0-9a-f-]{36}$/i.test(oportunidadeId)) throw new NaoEncontrado('Oportunidade não encontrada.');
  const r = Recebimento.safeParse(entrada);
  if (!r.success) throw new ErroDeUso(r.error.issues[0]?.message ?? 'Recebimento inválido.');
  const d = new Date(`${r.data.recebidoEm}T12:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== r.data.recebidoEm) throw new ErroDeUso('Data inválida.');
  if (r.data.recebidoEm < '2020-01-01') throw new ErroDeUso('Data antiga demais.');
  // One day of slack for time zones; a payment in the future is a typing mistake.
  if (d.getTime() > Date.now() + 36 * 3_600_000) throw new ErroDeUso('A data do recebimento não pode ser no futuro.');
  return tx(async (db) => {
    const o = await um<{ id: string; etapa: string; contato_id: string }>('select id, etapa, contato_id from oportunidades where empresa_id = $1 and id = $2 for update', [ctx.empresaId, oportunidadeId], db);
    if (!o) throw new NaoEncontrado('Oportunidade não encontrada.');
    if (o.etapa === 'perdido') throw new ErroDeUso('Esta oportunidade está como perdida. Reabra antes de registrar um recebimento.');
    const x = await um<{ id: string }>(
      `insert into recebimentos (empresa_id, oportunidade_id, valor_centavos, recebido_em, descricao, criado_por) values ($1, $2, $3, $4, $5, $6) returning id`,
      [ctx.empresaId, o.id, r.data.valorCentavos, r.data.recebidoEm, r.data.descricao, ctx.userId],
      db,
    );
    await q('update oportunidades set ultima_interacao_em = now() where id = $1', [o.id], db);
    await registrar(db, ctx.empresaId, { oportunidadeId: o.id, contatoId: o.contato_id, ator: ator(ctx), tipo: 'recebimento_registrado', dados: { valor_centavos: r.data.valorCentavos, recebido_em: r.data.recebidoEm, descricao: r.data.descricao } });
    return x!.id;
  });
}

/** A wrong entry is removed (and the removal stays in the history). Only who registered it, or an admin. */
export async function removerRecebimento(ctx: Ctx, id: string): Promise<void> {
  exigirNaoVisitante(ctx);
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new NaoEncontrado('Recebimento não encontrado.');
  await tx(async (db) => {
    const r = await um<{ id: string; oportunidade_id: string; valor_centavos: number; recebido_em: string; criado_por: string | null; contato_id: string }>(
      `select r.id, r.oportunidade_id, r.valor_centavos::int as valor_centavos, to_char(r.recebido_em, 'YYYY-MM-DD') as recebido_em, r.criado_por, o.contato_id
       from recebimentos r join oportunidades o on o.empresa_id = r.empresa_id and o.id = r.oportunidade_id where r.empresa_id = $1 and r.id = $2 for update of r`,
      [ctx.empresaId, id],
      db,
    );
    if (!r) throw new NaoEncontrado('Recebimento não encontrado.');
    if (ctx.papel !== 'admin' && r.criado_por !== ctx.userId) throw new NaoAutorizado('Só quem registrou ou o administrador remove um recebimento.');
    await q('delete from recebimentos where empresa_id = $1 and id = $2', [ctx.empresaId, id], db);
    await registrar(db, ctx.empresaId, { oportunidadeId: r.oportunidade_id, contatoId: r.contato_id, ator: ator(ctx), tipo: 'recebimento_removido', dados: { valor_centavos: r.valor_centavos, recebido_em: r.recebido_em } });
  });
}

export async function recebimentosDa(ctx: Ctx, oportunidadeId: string): Promise<LinhaRecebimento[]> {
  return q<LinhaRecebimento>(
    `select r.id, r.valor_centavos::int as valor_centavos, to_char(r.recebido_em, 'YYYY-MM-DD') as recebido_em, r.descricao, r.criado_por, u.name as criado_nome, r.criado_em
     from recebimentos r left join "user" u on u.id = r.criado_por where r.empresa_id = $1 and r.oportunidade_id = $2 order by r.recebido_em, r.criado_em`,
    [ctx.empresaId, oportunidadeId],
  );
}

/** What the seller says about the sale: the system proves when the follow-up happened, not why the customer came back. */
export async function definirRelato(ctx: Ctx, oportunidadeId: string, relato: string): Promise<void> {
  exigirNaoVisitante(ctx);
  if (!/^[0-9a-f-]{36}$/i.test(oportunidadeId)) throw new NaoEncontrado('Oportunidade não encontrada.');
  if (!(relato in RELATOS)) throw new ErroDeUso('Opção inválida.');
  await tx(async (db) => {
    const o = await um<{ contato_id: string; retomada_relato: string }>('select contato_id, retomada_relato from oportunidades where empresa_id = $1 and id = $2 for update', [ctx.empresaId, oportunidadeId], db);
    if (!o) throw new NaoEncontrado('Oportunidade não encontrada.');
    if (o.retomada_relato === relato) return;
    await q('update oportunidades set retomada_relato = $3 where empresa_id = $1 and id = $2', [ctx.empresaId, oportunidadeId, relato], db);
    await registrar(db, ctx.empresaId, { oportunidadeId, contatoId: o.contato_id, ator: ator(ctx), tipo: 'relato_retomada', dados: { relato } });
  });
}

export interface LinhaVenda {
  oportunidade_id: string;
  cliente: string;
  etapa: string;
  valor_proposta_centavos: number | null;
  recebido_mes_centavos: number;
  recebido_total_centavos: number;
  primeiro_recebimento: string;
  /** First automatic follow-up actually sent (accepted by WhatsApp) for this opportunity on or before the first payment. */
  retomada_em: Date | null;
  relato: Relato;
}

export interface RelatorioVendas {
  linhas: LinhaVenda[];
  recebidoMes: number;
  /** Paid sales with a follow-up sent on or before the first payment. */
  aposRetomada: LinhaVenda[];
  recebidoAposRetomada: number;
}

/**
 * Money received in a month, sale by sale, and which of those sales had an automatic follow-up sent (and accepted by
 * WhatsApp) on or before the first payment. Counted from records, never estimated.
 */
export async function relatorioVendas(ctx: Ctx, mes: string): Promise<RelatorioVendas> {
  exigirAdmin(ctx);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new ErroDeUso('Mês inválido.');
  const linhas = await q<LinhaVenda>(
    `with mes as (select r.oportunidade_id from recebimentos r where r.empresa_id = $1 and to_char(r.recebido_em, 'YYYY-MM') = $2 group by r.oportunidade_id)
     select o.id as oportunidade_id, c.nome as cliente, o.etapa, o.valor_proposta_centavos::int as valor_proposta_centavos, o.retomada_relato as relato,
       coalesce(sum(r.valor_centavos) filter (where to_char(r.recebido_em, 'YYYY-MM') = $2), 0)::int as recebido_mes_centavos,
       sum(r.valor_centavos)::int as recebido_total_centavos,
       to_char(min(r.recebido_em), 'YYYY-MM-DD') as primeiro_recebimento,
       (select min(m.criado_em) from mensagens m
          where m.empresa_id = o.empresa_id and m.oportunidade_id = o.id and m.autor = 'sistema' and m.finalidade in ('retorno', 'retomada')
            and m.estado in ('enviada', 'entregue', 'lida') and m.criado_em < (min(r.recebido_em) + 1)::timestamp at time zone $3) as retomada_em
     from mes join oportunidades o on o.empresa_id = $1 and o.id = mes.oportunidade_id
       join contatos c on c.id = o.contato_id
       join recebimentos r on r.empresa_id = o.empresa_id and r.oportunidade_id = o.id
     group by o.id, c.nome
     order by min(r.recebido_em) desc, o.id`,
    [ctx.empresaId, mes, (await um<{ fuso: string }>(`select coalesce(config -> 'regras' ->> 'fuso', 'America/Sao_Paulo') as fuso from empresas where id = $1`, [ctx.empresaId]))?.fuso ?? 'America/Sao_Paulo'],
  );
  const aposRetomada = linhas.filter((l) => l.retomada_em);
  return {
    linhas,
    recebidoMes: linhas.reduce((t, l) => t + l.recebido_mes_centavos, 0),
    aposRetomada,
    recebidoAposRetomada: aposRetomada.reduce((t, l) => t + l.recebido_mes_centavos, 0),
  };
}

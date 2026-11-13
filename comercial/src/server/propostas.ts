import { z } from 'zod';
import { ator, criarTarefa, registrar, type Ctx } from './contexto';
import { pool, q, tx, um } from './db';
import { cancelarPendentes } from './fila';
import { empresaPorId, type Empresa } from './empresas';
import { ErroDeUso, NaoEncontrado } from './erros';
import { dispararFluxos } from './fluxos';
import { moverEtapaPorFluxo, mudarEtapa } from './oportunidades';
import { hashToken, novoToken } from './segredos';

/**
 * Online proposal. The seller writes it (items, conditions, validity), sends a private link, and the customer opens it
 * and accepts (typing their name) or declines. Accepting never marks the sale as won: a person does that.
 * The content is the company's own offer; the platform only shows and records it.
 */

export interface ItemProposta {
  descricao: string;
  quantidade: number;
  valor_unit_centavos: number;
}

export interface Proposta {
  id: string;
  oportunidade_id: string;
  numero: number;
  titulo: string;
  itens: ItemProposta[];
  condicoes: string;
  validade: string;
  total_centavos: number;
  estado: 'rascunho' | 'enviada' | 'aceita' | 'recusada' | 'cancelada';
  enviada_em: Date | null;
  vista_em: Date | null;
  visualizacoes: number;
  respondida_em: Date | null;
  aceite_nome: string;
  motivo_recusa: string;
  vencida: boolean;
}

const Item = z.object({
  descricao: z.string().trim().min(2, 'Descreva cada item.').max(200),
  quantidade: z.number().positive('Quantidade precisa ser maior que zero.').max(100_000),
  valor_unit_centavos: z.number().int().min(0).max(10_000_000_00),
});
const Entrada = z.object({
  oportunidadeId: z.uuid(),
  titulo: z.string().trim().min(3, 'Dê um título à proposta.').max(120),
  itens: z.array(Item).min(1, 'Coloque pelo menos um item.').max(30),
  condicoes: z.string().trim().max(3000).default(''),
  validadeDias: z.number().int().min(1, 'Validade de pelo menos 1 dia.').max(180),
});

export const totalDe = (itens: ItemProposta[]) => itens.reduce((t, i) => t + Math.round(i.quantidade * i.valor_unit_centavos), 0);

const colunas = (p: string) => `${p}id, ${p}oportunidade_id, ${p}numero, ${p}titulo, ${p}itens, ${p}condicoes, to_char(${p}validade, 'YYYY-MM-DD') as validade, ${p}total_centavos::int as total_centavos, ${p}estado,
  ${p}enviada_em, ${p}vista_em, ${p}visualizacoes, ${p}respondida_em, ${p}aceite_nome, ${p}motivo_recusa, (${p}validade < (now() at time zone 'America/Sao_Paulo')::date) as vencida`;

export async function propostasDa(ctx: Ctx, oportunidadeId: string): Promise<Proposta[]> {
  return q<Proposta>(`select ${colunas('')} from propostas where empresa_id = $1 and oportunidade_id = $2 order by numero desc`, [ctx.empresaId, oportunidadeId]);
}

/** Saves a draft. Sent proposals are never edited: a new version is a new proposal. */
export async function criarProposta(ctx: Ctx, entrada: z.input<typeof Entrada>): Promise<string> {
  const r = Entrada.safeParse(entrada);
  if (!r.success) throw new ErroDeUso(r.error.issues[0]?.message ?? 'Proposta inválida.');
  const e = r.data;
  return tx(async (db) => {
    await db.query('select pg_advisory_xact_lock(hashtext($1))', [`propostas:${ctx.empresaId}`]);
    const o = await um<{ etapa: string }>('select etapa from oportunidades where empresa_id = $1 and id = $2', [ctx.empresaId, e.oportunidadeId], db);
    if (!o) throw new NaoEncontrado('Oportunidade não encontrada.');
    if (o.etapa === 'ganho' || o.etapa === 'perdido') throw new ErroDeUso('A oportunidade já está encerrada.');
    const n = await um<{ n: number }>('select coalesce(max(numero), 0) + 1 as n from propostas where empresa_id = $1', [ctx.empresaId], db);
    const p = await um<{ id: string }>(
      `insert into propostas (empresa_id, oportunidade_id, numero, titulo, itens, condicoes, validade, total_centavos, criado_por)
       values ($1, $2, $3, $4, $5, $6, (now() at time zone 'America/Sao_Paulo')::date + $7::int, $8, $9) returning id`,
      [ctx.empresaId, e.oportunidadeId, n!.n, e.titulo, JSON.stringify(e.itens), e.condicoes, e.validadeDias, totalDe(e.itens), ctx.userId],
      db,
    );
    return p!.id;
  });
}

/** Creates the private link, moves the opportunity to "proposal sent" (if it was before) and records the value. */
export async function enviarProposta(ctx: Ctx, id: string): Promise<string> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new NaoEncontrado();
  const token = `pr_${novoToken(24)}`;
  const p = await tx(async (db) => {
    const p = await um<{ oportunidade_id: string; estado: string; total_centavos: number; numero: number }>(`select oportunidade_id, estado, total_centavos::int as total_centavos, numero from propostas where empresa_id = $1 and id = $2 for update`, [ctx.empresaId, id], db);
    if (!p) throw new NaoEncontrado('Proposta não encontrada.');
    if (p.estado !== 'rascunho' && p.estado !== 'enviada') throw new ErroDeUso('Esta proposta já foi respondida ou cancelada.');
    // A new link replaces the old one (the old link stops working).
    await q(`update propostas set token_hash = $3, estado = 'enviada', enviada_em = coalesce(enviada_em, now()) where empresa_id = $1 and id = $2`, [ctx.empresaId, id, hashToken(token)], db);
    await q('update oportunidades set valor_proposta_centavos = $3 where empresa_id = $1 and id = $2', [ctx.empresaId, p.oportunidade_id, p.total_centavos], db);
    await registrar(db, ctx.empresaId, { oportunidadeId: p.oportunidade_id, ator: ator(ctx), tipo: 'proposta_enviada', dados: { numero: p.numero, total_centavos: p.total_centavos } });
    return p;
  });
  const o = await um<{ etapa: string }>('select etapa from oportunidades where empresa_id = $1 and id = $2', [ctx.empresaId, p.oportunidade_id]);
  if (o && ['novo', 'atendimento', 'qualificado'].includes(o.etapa)) await mudarEtapa(ctx, p.oportunidade_id, { etapa: 'proposta' });
  return `${process.env.APP_URL ?? ''}/p/${token}`;
}

export async function cancelarProposta(ctx: Ctx, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new NaoEncontrado();
  const r = await um<{ oportunidade_id: string; numero: number }>(
    `update propostas set estado = 'cancelada', token_hash = null where empresa_id = $1 and id = $2 and estado in ('rascunho', 'enviada') returning oportunidade_id, numero`,
    [ctx.empresaId, id],
  );
  if (!r) throw new ErroDeUso('Só dá para cancelar uma proposta ainda sem resposta.');
  await registrar(pool(), ctx.empresaId, { oportunidadeId: r.oportunidade_id, ator: ator(ctx), tipo: 'proposta_cancelada', dados: { numero: r.numero } }).catch(() => {});
}

/* ---------- Customer side (by the private link) ---------- */

export interface PropostaPublica extends Proposta {
  empresa: Empresa;
  cliente: string;
}

/** The proposal behind a link; counts the view and tells the seller the first time. */
export async function abrirPropostaPublica(token: string, contarVisita: boolean): Promise<PropostaPublica | null> {
  if (!/^pr_[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const p = await um<Proposta & { empresa_id: string; cliente: string }>(
    `select ${colunas('p.')}, p.empresa_id, c.nome as cliente
     from propostas p join oportunidades o on o.id = p.oportunidade_id join contatos c on c.id = o.contato_id join empresas e on e.id = p.empresa_id and e.ativa
     where p.token_hash = $1 and p.estado <> 'cancelada'`,
    [hashToken(token)],
  );
  if (!p) return null;
  const empresa = (await empresaPorId(p.empresa_id))!;
  if (contarVisita && p.estado === 'enviada') {
    const primeira = await um<{ responsavel_id: string | null }>(
      `update propostas pr set visualizacoes = visualizacoes + 1, vista_em = coalesce(vista_em, now())
       from oportunidades o where pr.id = $1 and o.id = pr.oportunidade_id returning (case when pr.visualizacoes = 1 then coalesce(o.responsavel_id, '') else null end) as responsavel_id`,
      [p.id],
    );
    if (primeira?.responsavel_id != null) {
      await q('insert into notificacoes (empresa_id, user_id, titulo, corpo, link) values ($1, $2, $3, $4, $5)', [p.empresa_id, primeira.responsavel_id || null, `O cliente abriu a proposta nº ${p.numero}`, '', `/painel/oportunidades/${p.oportunidade_id}`]);
      await registrar(pool(), p.empresa_id, { oportunidadeId: p.oportunidade_id, ator: { tipo: 'visitante' }, tipo: 'proposta_vista', dados: { numero: p.numero } }).catch(() => {});
    }
  }
  return { ...p, empresa, cliente: p.cliente };
}

/** Accept or decline, once. Accepting creates the task to close the sale; it never marks the sale as won. */
export async function responderProposta(token: string, r: { aceitar: boolean; nome?: string; motivo?: string; ipHash: string }): Promise<'aceita' | 'recusada'> {
  if (!/^pr_[A-Za-z0-9_-]{20,64}$/.test(token)) throw new NaoEncontrado('Proposta não encontrada.');
  const nome = (r.nome ?? '').trim().replace(/\s+/g, ' ').slice(0, 120);
  if (r.aceitar && nome.length < 3) throw new ErroDeUso('Escreva seu nome completo para aceitar.');
  return tx(async (db) => {
    const p = await um<{ id: string; empresa_id: string; oportunidade_id: string; numero: number; estado: string; vencida: boolean; responsavel_id: string | null; contato_id: string; etapa: string }>(
      `select p.id, p.empresa_id, p.oportunidade_id, p.numero, p.estado, (p.validade < (now() at time zone 'America/Sao_Paulo')::date) as vencida, o.responsavel_id, o.contato_id, o.etapa
       from propostas p join oportunidades o on o.id = p.oportunidade_id where p.token_hash = $1 for update of p`,
      [hashToken(token)],
      db,
    );
    if (!p || p.estado === 'cancelada') throw new NaoEncontrado('Proposta não encontrada.');
    if (p.estado !== 'enviada') throw new ErroDeUso('Esta proposta já foi respondida.');
    if (p.vencida && r.aceitar) throw new ErroDeUso('A validade desta proposta terminou. Fale com a empresa para receber uma nova.');
    const estado = r.aceitar ? 'aceita' : 'recusada';
    await q(
      `update propostas set estado = $2, respondida_em = now(), aceite_nome = $3, aceite_ip_hash = $4, motivo_recusa = $5 where id = $1`,
      [p.id, estado, r.aceitar ? nome : '', r.ipHash.slice(0, 64), r.aceitar ? '' : (r.motivo ?? '').trim().slice(0, 500)],
      db,
    );
    await q('update oportunidades set ultima_interacao_em = now() where id = $1', [p.oportunidade_id], db);
    await registrar(db, p.empresa_id, { oportunidadeId: p.oportunidade_id, contatoId: p.contato_id, ator: { tipo: 'visitante' }, tipo: r.aceitar ? 'proposta_aceita' : 'proposta_recusada', dados: { numero: p.numero, ...(r.aceitar ? {} : { motivo: (r.motivo ?? '').trim().slice(0, 200) }) } });
    await criarTarefa(db, p.empresa_id, {
      oportunidadeId: p.oportunidade_id,
      tipo: r.aceitar ? 'proposta_aceita' : 'proposta_recusada',
      titulo: r.aceitar ? `Proposta nº ${p.numero} aceita: combinar o fechamento` : `Proposta nº ${p.numero} recusada: falar com o cliente`,
      detalhe: r.aceitar ? `Aceita por “${nome}”. Confirme com o cliente e, fechado o negócio, marque a oportunidade como ganha.` : (r.motivo ?? '').trim().slice(0, 500),
      prazo: new Date(Date.now() + 4 * 3_600_000),
      responsavelId: p.responsavel_id,
      chave: `proposta-resposta:${p.id}`,
    });
    // Accepted: the deal goes to "negotiation" (ends the proposal follow-ups). Declined: the follow-ups stop; the seller decides the stage.
    if (r.aceitar && ['novo', 'atendimento', 'qualificado', 'proposta'].includes(p.etapa)) await moverEtapaPorFluxo(db, p.empresa_id, p.oportunidade_id, 'negociacao', 'Proposta aceita pelo cliente');
    if (!r.aceitar) await cancelarPendentes(db, p.empresa_id, { oportunidadeId: p.oportunidade_id, tipos: ['retorno_cliente'] }, 'O cliente recusou a proposta.');
    if (r.aceitar) await dispararFluxos(db, p.empresa_id, { tipo: 'proposta_aceita' }, { id: p.oportunidade_id, contatoId: p.contato_id, etapa: 'negociacao' });
    return estado;
  });
}

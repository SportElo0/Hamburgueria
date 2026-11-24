import { formatarTelefone } from './config';
import { ator, criarTarefa, registrar, type Ctx } from './contexto';
import { pool, q, tx, um } from './db';
import { empresaPorId } from './empresas';
import { ErroDeUso, NaoEncontrado } from './erros';
import { hashToken } from './segredos';
import { criarConviteAvaliacao } from './trabalhos';

/** A person generates the invitation link to send by hand (the automatic rule does the same through the queue). */
export async function gerarLinkAvaliacao(ctx: Ctx, oportunidadeId: string): Promise<string> {
  const o = await um<{ servico_concluido_em: Date | null }>('select servico_concluido_em from oportunidades where empresa_id = $1 and id = $2', [ctx.empresaId, oportunidadeId]);
  if (!o) throw new NaoEncontrado('Oportunidade não encontrada.');
  if (!o.servico_concluido_em) throw new ErroDeUso('Marque o serviço como concluído antes de pedir a avaliação.');
  const empresa = await empresaPorId(ctx.empresaId);
  if (!empresa?.config.avaliacao.link) throw new ErroDeUso('Configure primeiro o link de avaliação da empresa.');
  const token = await criarConviteAvaliacao(ctx.empresaId, oportunidadeId);
  await registrar(pool(), ctx.empresaId, { oportunidadeId, ator: ator(ctx), tipo: 'link_avaliacao_gerado' });
  return `${process.env.APP_URL ?? ''}/avaliar/${token}`;
}

/** Public page of an invitation. The public review link is always part of it, whatever the private rating. */
export async function conviteAberto(token: string) {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) return null;
  const a = await um<{ id: string; empresa_id: string; nota_privada: number | null }>('update avaliacoes set aberto_em = coalesce(aberto_em, now()) where token_hash = $1 returning id, empresa_id, nota_privada', [hashToken(token)]);
  if (!a) return null;
  const empresa = await empresaPorId(a.empresa_id);
  if (!empresa?.config.avaliacao.link) return null;
  return { empresa: empresa.nome, linkPublico: empresa.config.avaliacao.link, jaRespondeu: a.nota_privada != null };
}

export async function registrarCliquePublico(token: string) {
  await q('update avaliacoes set clicou_publico_em = coalesce(clicou_publico_em, now()) where token_hash = $1', [hashToken(token)]);
}

/** Ratings at or below this (of 5) alert the company right away, so someone can talk to the customer. */
export const NOTA_BAIXA = 3;

/**
 * Optional private feedback to the company. It never replaces or hides the public review link.
 * A low rating becomes, once, a task to talk to the customer (with the rating and the comment), which also alerts
 * the team in the panel and on the phone.
 */
export async function registrarFeedbackPrivado(token: string, nota: number, comentario: string) {
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) throw new ErroDeUso('Escolha uma nota de 1 a 5.');
  const texto = comentario.trim().slice(0, 1000);
  await tx(async (db) => {
    const r = await um<{ id: string; empresa_id: string; oportunidade_id: string; anterior: number | null }>(
      `with antes as (select id, nota_privada from avaliacoes where token_hash = $1 for update)
       update avaliacoes a set nota_privada = $2, comentario_privado = $3 from antes where a.id = antes.id
       returning a.id, a.empresa_id, a.oportunidade_id, antes.nota_privada as anterior`,
      [hashToken(token), nota, texto],
      db,
    );
    if (!r) throw new NaoEncontrado('Convite não encontrado.');
    // Only when it turns low (a second low answer to the same invitation does not alert again).
    if (nota > NOTA_BAIXA || (r.anterior != null && r.anterior <= NOTA_BAIXA)) return;
    const o = await um<{ responsavel_id: string | null; nome: string; telefone: string }>(
      'select o.responsavel_id, c.nome, c.telefone from oportunidades o join contatos c on c.id = o.contato_id where o.empresa_id = $1 and o.id = $2',
      [r.empresa_id, r.oportunidade_id],
      db,
    );
    const quem = o?.nome || (o?.telefone ? formatarTelefone(o.telefone) : 'cliente');
    await criarTarefa(db, r.empresa_id, {
      oportunidadeId: r.oportunidade_id,
      tipo: 'avaliacao_baixa',
      titulo: `Avaliação com nota ${nota} de 5: ${quem}`.slice(0, 200),
      detalhe: `${texto ? `Comentário: "${texto}"` : 'Sem comentário.'} Fale com o cliente para entender o que aconteceu e ajudar.`,
      responsavelId: o?.responsavel_id ?? null,
      prazo: new Date(Date.now() + 24 * 3_600_000),
      chave: `avaliacao-baixa:${r.id}`,
    });
    await registrar(db, r.empresa_id, { oportunidadeId: r.oportunidade_id, ator: { tipo: 'visitante' }, tipo: 'avaliacao_baixa', dados: { nota } });
  });
}

export async function feedbacks(ctx: Ctx) {
  return q<{ contato: string; nota_privada: number | null; comentario_privado: string | null; aberto_em: Date | null; clicou_publico_em: Date | null; criado_em: Date }>(
    `select c.nome as contato, a.nota_privada, a.comentario_privado, a.aberto_em, a.clicou_publico_em, a.criado_em
     from avaliacoes a join oportunidades o on o.id = a.oportunidade_id join contatos c on c.id = o.contato_id
     where a.empresa_id = $1 order by a.criado_em desc limit 100`,
    [ctx.empresaId],
  );
}

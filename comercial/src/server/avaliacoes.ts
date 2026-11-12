import { ator, registrar, type Ctx } from './contexto';
import { pool, q, um } from './db';
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

/** Optional private feedback to the company. It never replaces or hides the public review link. */
export async function registrarFeedbackPrivado(token: string, nota: number, comentario: string) {
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) throw new ErroDeUso('Escolha uma nota de 1 a 5.');
  const r = await um('update avaliacoes set nota_privada = $2, comentario_privado = $3 where token_hash = $1 returning id', [hashToken(token), nota, comentario.trim().slice(0, 1000)]);
  if (!r) throw new NaoEncontrado('Convite não encontrado.');
}

export async function feedbacks(ctx: Ctx) {
  return q<{ contato: string; nota_privada: number | null; comentario_privado: string | null; aberto_em: Date | null; clicou_publico_em: Date | null; criado_em: Date }>(
    `select c.nome as contato, a.nota_privada, a.comentario_privado, a.aberto_em, a.clicou_publico_em, a.criado_em
     from avaliacoes a join oportunidades o on o.id = a.oportunidade_id join contatos c on c.id = o.contato_id
     where a.empresa_id = $1 order by a.criado_em desc limit 100`,
    [ctx.empresaId],
  );
}

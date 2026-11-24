import { celular } from './ligacoes';
import { normalizarTelefone } from './config';
import { dentroDoLimite, exigirNaoVisitante, type Ctx } from './contexto';
import { q, um } from './db';
import { empresaPorId } from './empresas';
import { ErroDeUso } from './erros';
import { canalDa } from './integracoes';
import { assuntoSeguro } from './push';
import { horaLocal, preferenciasDe, recebeAgora } from './avisos';

/**
 * The important alerts also on the WhatsApp of whoever asked (many owners never install the panel app): a new
 * request, a conversation that needs a person, a missed call, a low rating. Sent from the company's own official
 * number, with a template approved by Meta (the company pays Meta for each one), only to team members who turned it
 * on themselves and accepted the text below. Like the phone alert, it carries only the subject and the link: no
 * customer name or message.
 */
export const TIPOS_WHATSAPP = ['tarefa:atender_pedido', 'tarefa:assumir_conversa', 'tarefa:retornar_ligacao', 'tarefa:avaliacao_baixa'];
/** Cost guard per person per day (each message is paid to Meta). */
export const MAX_POR_DIA = 30;

export const TEXTO_ACEITE_AVISOS = (empresa: string) =>
  `Quero receber no meu WhatsApp, enviados pelo número da ${empresa}, os avisos importantes do painel: pedido novo, cliente esperando uma pessoa, ligação perdida e avaliação com nota baixa. Para parar, desligo no painel.`;

export async function meuAvisoWhatsApp(ctx: Ctx) {
  return um<{ telefone: string; aceito_em: Date; ultimo_envio_em: Date | null }>('select telefone, aceito_em, ultimo_envio_em from avisos_whatsapp where empresa_id = $1 and user_id = $2', [ctx.empresaId, ctx.userId]);
}

/** Turned on by the person, for their own number (never by someone else, and never by Growlift's support access). */
export async function ligarAvisoWhatsApp(ctx: Ctx, telefone: string, aceite: boolean) {
  exigirNaoVisitante(ctx);
  if (ctx.acessoAdmin) throw new ErroDeUso('Cada pessoa liga os avisos no próprio WhatsApp, com o próprio login.');
  if (!aceite) throw new ErroDeUso('Marque que aceita receber os avisos no WhatsApp.');
  const tel = normalizarTelefone(telefone);
  if (!tel || !celular(tel)) throw new ErroDeUso('Informe um celular com DDD, por exemplo (11) 91234-5678.');
  const empresa = (await empresaPorId(ctx.empresaId))!;
  await q(
    `insert into avisos_whatsapp (empresa_id, user_id, telefone, texto_aceite) values ($1, $2, $3, $4)
     on conflict (empresa_id, user_id) do update set telefone = excluded.telefone, texto_aceite = excluded.texto_aceite, aceito_em = now()`,
    [ctx.empresaId, ctx.userId, tel, TEXTO_ACEITE_AVISOS(empresa.nome)],
  );
}

export async function desligarAvisoWhatsApp(ctx: Ctx) {
  await q('delete from avisos_whatsapp where empresa_id = $1 and user_id = $2', [ctx.empresaId, ctx.userId]);
}

/**
 * Sends the WhatsApp alerts of new important notifications. Each notification is claimed once; older than one hour is
 * skipped (a late alert is worse than none). Without the official WhatsApp or the approved template, nothing goes out.
 * Returns how many messages the channel accepted.
 */
export async function enviarAvisosWhatsApp(max = 50): Promise<number> {
  await q(`update notificacoes set whatsapp_em = now() where whatsapp_em is null and (criado_em < now() - interval '1 hour' or not (tipo = any($1)))`, [TIPOS_WHATSAPP]);
  const lote = await q<{ empresa_id: string; user_id: string | null; titulo: string; link: string; tipo: string }>(
    `update notificacoes set whatsapp_em = now() where id in (
       select id from notificacoes where whatsapp_em is null order by criado_em limit $1 for update skip locked
     ) returning empresa_id, user_id, titulo, link, tipo`,
    [max],
  );
  let enviados = 0;
  for (const n of lote) {
    // No recipient = the company's admins. Only active members of that same company who turned it on.
    const quem = await q<{ user_id: string; telefone: string }>(
      `select a.user_id, a.telefone from avisos_whatsapp a
       join membros m on m.user_id = a.user_id and m.empresa_id = a.empresa_id and m.ativo
       where a.empresa_id = $1 and (a.user_id = $2 or ($2::text is null and m.papel = 'admin'))`,
      [n.empresa_id, n.user_id],
    );
    if (!quem.length) continue;
    const { canal, config } = await canalDa(n.empresa_id);
    if (!canal || !config.modelo_aviso_equipe) continue;
    const empresa = await empresaPorId(n.empresa_id);
    const hora = horaLocal(empresa?.config.regras.fuso ?? 'America/Sao_Paulo');
    const link = `${(process.env.APP_URL ?? '').replace(/\/$/, '')}${n.link.startsWith('/painel') ? n.link : '/painel'}`;
    for (const p of quem) {
      // Subjects turned off and quiet hours of this person (same choices as the phone alerts).
      if (!recebeAgora(await preferenciasDe(n.empresa_id, p.user_id), n.tipo, hora)) continue;
      if (!(await dentroDoLimite(`aviso-whatsapp:${n.empresa_id}:${p.user_id}`, MAX_POR_DIA, 86_400))) continue;
      try {
        const r = await canal.enviarModelo(p.telefone, { nome: config.modelo_aviso_equipe, idioma: config.idioma_modelos, variaveis: [empresa?.nome ?? '', assuntoSeguro(n.titulo), link] });
        if (r.tipo === 'aceito') {
          enviados++;
          await q('update avisos_whatsapp set ultimo_envio_em = now() where empresa_id = $1 and user_id = $2', [n.empresa_id, p.user_id]);
        } else console.error('[aviso whatsapp]', r.tipo, 'erro' in r ? r.erro : '');
      } catch (err) {
        console.error('[aviso whatsapp]', err instanceof Error ? err.message : err);
      }
    }
  }
  return enviados;
}

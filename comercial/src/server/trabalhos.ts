import { criarTarefa, registrar } from './contexto';
import { enviarAvisosCelular } from './push';
import { despachar, responderComIA, JANELA_WHATSAPP_MS, type Conversa } from './conversas';
import { pool, q, tx, um, type Db } from './db';
import { empresaPorId, type Empresa } from './empresas';
import { nomeSeguro } from './trabalhos-texto';
import { executarPassoFluxo } from './fluxos-exec';
import { agendar, processarPendentes, type Executor, type Resultado, type Trabalho } from './fila';
import { canalDa } from './integracoes';
import { hashToken, novoToken } from './segredos';

/** Local hour (0-23) in the company's time zone. */
function horaLocal(fuso: string, d = new Date()): number {
  try {
    return Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: fuso }).format(d));
  } catch {
    return d.getUTCHours();
  }
}
/** Automatic messages to customers only go out inside the company's hours; otherwise at the next opening. */
export function proximoHorarioPermitido(regras: Empresa['config']['regras'], agora = new Date()): Date | null {
  const h = horaLocal(regras.fuso, agora);
  if (h >= regras.hora_inicio && h < regras.hora_fim) return null;
  const horas = h < regras.hora_inicio ? regras.hora_inicio - h : 24 - h + regras.hora_inicio;
  const d = new Date(agora.getTime() + horas * 3_600_000);
  d.setMinutes(1, 0, 0);
  return d;
}

interface Iniciada {
  oportunidadeId: string;
  corpo: string;
  finalidade: 'confirmacao' | 'retorno' | 'avaliacao' | 'manutencao' | 'fluxo';
  /** Approved template name chosen by a flow step; empty = free text only inside the 24-hour window. */
  modelo?: string;
  /** For follow-ups: cancel when the customer wrote after this moment. */
  agendadoEm?: Date;
}

/**
 * A message the company starts (confirmation, follow-up, review invitation). Everything is checked again here,
 * at send time, with the conversation locked: consent, opt-out, who holds the conversation, replies, hours, channel rules.
 */
export async function enviarIniciada(t: Trabalho, i: Iniciada): Promise<Resultado> {
  const empresa = await empresaPorId(t.empresa_id);
  if (!empresa) return { tipo: 'cancelado', motivo: 'Empresa não existe mais.' };
  const adiar = proximoHorarioPermitido(empresa.config.regras);
  if (adiar) return { tipo: 'adiar', para: adiar, nota: 'Fora do horário de envio da empresa.' };
  const { canal, config, motivo } = await canalDa(empresa.id);
  if (!canal) return { tipo: 'cancelado', motivo: motivo ?? 'Canal indisponível.' };
  const modelo = i.finalidade === 'fluxo' ? i.modelo ?? '' : { confirmacao: config.modelo_confirmacao, retorno: config.modelo_retorno, avaliacao: config.modelo_avaliacao, manutencao: config.modelo_manutencao }[i.finalidade];
  return tx(async (db): Promise<Resultado> => {
    const o = await um<{ id: string; etapa: string; contato_id: string; responsavel_id: string | null; nome: string; nao_contatar_em: Date | null }>(
      `select o.id, o.etapa, o.contato_id, o.responsavel_id, c.nome, c.nao_contatar_em from oportunidades o join contatos c on c.id = o.contato_id
       where o.empresa_id = $1 and o.id = $2 for update of o`,
      [empresa.id, i.oportunidadeId],
      db,
    );
    if (!o) return { tipo: 'cancelado', motivo: 'Oportunidade não existe mais.' };
    if (o.nao_contatar_em) return { tipo: 'cancelado', motivo: 'O contato pediu para não receber mensagens.' };
    if (i.finalidade === 'retorno' && o.etapa !== 'proposta') return { tipo: 'cancelado', motivo: 'A oportunidade saiu da etapa de proposta.' };
    if (i.finalidade === 'confirmacao' && o.etapa !== 'novo') return { tipo: 'cancelado', motivo: 'O pedido já está em atendimento.' };
    if (!(await um(`select 1 from consentimentos where empresa_id = $1 and contato_id = $2 and canal = 'whatsapp' and revogado_em is null`, [empresa.id, o.contato_id], db))) {
      return { tipo: 'cancelado', motivo: 'Sem autorização de contato pelo WhatsApp.' };
    }
    // The maintenance reminder needs an acceptance of the text that mentions it.
    if (i.finalidade === 'manutencao' && !(await um(`select 1 from consentimentos where empresa_id = $1 and contato_id = $2 and canal = 'whatsapp' and revogado_em is null and versao >= 2`, [empresa.id, o.contato_id], db))) {
      return { tipo: 'cancelado', motivo: 'A autorização deste cliente não inclui o lembrete de manutenção.' };
    }
    if (i.finalidade === 'manutencao' && o.etapa !== 'ganho') return { tipo: 'cancelado', motivo: 'A venda não está mais como ganha.' };
    let v = await um<Conversa>(`select * from conversas where empresa_id = $1 and contato_id = $2 and canal = 'whatsapp' for update`, [empresa.id, o.contato_id], db);
    if (!v) v = (await um<Conversa>(`insert into conversas (empresa_id, contato_id, oportunidade_id, canal, dados) values ($1, $2, $3, 'whatsapp', $4) returning *`, [empresa.id, o.contato_id, o.id, JSON.stringify(o.nome ? { nome: o.nome } : {})], db))!;
    if (v.estado !== 'ia_ativa') return { tipo: 'cancelado', motivo: v.estado === 'humano_atendendo' ? 'Uma pessoa assumiu a conversa.' : 'A conversa está aguardando uma pessoa.' };
    if (i.agendadoEm && v.ultima_entrada_em && v.ultima_entrada_em > i.agendadoEm) return { tipo: 'cancelado', motivo: 'O cliente respondeu depois do agendamento.' };
    const naJanela = !!v.ultima_entrada_em && Date.now() - v.ultima_entrada_em.getTime() < JANELA_WHATSAPP_MS;
    if (!naJanela && !modelo) {
      // Outside the 24-hour window WhatsApp only accepts a template approved by Meta. Without one, a person does it.
      await criarTarefa(db, empresa.id, { oportunidadeId: o.id, tipo: 'contato_manual', titulo: { confirmacao: 'Confirmar o recebimento do pedido com o cliente', retorno: 'Retornar ao cliente sobre a proposta', avaliacao: 'Enviar o convite de avaliação ao cliente', manutencao: 'Lembrar o cliente da manutenção', fluxo: 'Enviar ao cliente a mensagem de um fluxo de automação' }[i.finalidade], detalhe: 'Envio automático não feito: falta um modelo de mensagem aprovado no WhatsApp.', responsavelId: o.responsavel_id, chave: `manual:${t.id}` });
      return { tipo: 'cancelado', motivo: 'Fora da janela de 24 horas e sem modelo aprovado: virou tarefa.' };
    }
    const m = await um<{ id: string }>(
      `insert into mensagens (empresa_id, conversa_id, direcao, autor, corpo, estado, automatica, modelo_mensagem) values ($1, $2, 'saida', 'sistema', $3, 'na_fila', true, $4) returning id`,
      [empresa.id, v.id, i.corpo, modelo || 'texto'],
      db,
    );
    await q('update conversas set atualizado_em = now(), oportunidade_id = coalesce(oportunidade_id, $2) where id = $1', [v.id, o.id], db);
    await agendar(db, empresa.id, { tipo: 'enviar_mensagem', chave: `envio:${m!.id}`, conversaId: v.id, oportunidadeId: o.id, dados: { mensagem: m!.id, finalidade: i.finalidade } });
    await registrar(db, empresa.id, { oportunidadeId: o.id, contatoId: o.contato_id, conversaId: v.id, ator: { tipo: 'sistema' }, tipo: `envio_automatico_${i.finalidade}`, dados: { simulado: canal.simulado } });
    return { tipo: 'concluido', nota: canal.simulado ? 'Simulação — nenhuma mensagem externa enviada.' : undefined };
  });
}

const nomeDe = async (db: Db | undefined, empresaId: string, oportunidadeId: string) =>
  (await um<{ nome: string }>('select c.nome from oportunidades o join contatos c on c.id = o.contato_id where o.empresa_id = $1 and o.id = $2', [empresaId, oportunidadeId], db))?.nome ?? '';

export { nomeSeguro };

export const executores: Record<string, Executor> = {
  responder_ia: responderComIA,
  fluxo_passo: (t) => executarPassoFluxo(t, (tr, i) => enviarIniciada(tr, i)),
  enviar_mensagem: despachar,

  /** A new request nobody attended within the company's deadline: internal alert only. */
  async alerta_sla(t) {
    const o = await um<{ etapa: string; primeiro_humano_em: Date | null; responsavel_id: string | null; nome: string }>(
      'select o.etapa, o.primeiro_humano_em, o.responsavel_id, c.nome from oportunidades o join contatos c on c.id = o.contato_id where o.empresa_id = $1 and o.id = $2',
      [t.empresa_id, t.oportunidade_id],
    );
    if (!o || o.etapa !== 'novo' || o.primeiro_humano_em) return { tipo: 'cancelado', motivo: 'O pedido já foi atendido.' };
    const link = `/painel/oportunidades/${t.oportunidade_id}`;
    const titulo = `Pedido sem atendimento: ${o.nome || 'contato'}`;
    // To the assignee (if any) and always to the company admins.
    await q(`insert into notificacoes (empresa_id, user_id, titulo, corpo, link) select $1, x, $2, $3, $4 from (select distinct unnest(array[$5::text, null]) as x) s`, [t.empresa_id, titulo, 'Passou do prazo configurado para o primeiro atendimento.', link, o.responsavel_id]);
    await registrar(pool(), t.empresa_id, { oportunidadeId: t.oportunidade_id, ator: { tipo: 'sistema' }, tipo: 'alerta_sem_atendimento' });
    return { tipo: 'concluido' };
  },

  async confirmacao_pedido(t) {
    const empresa = await empresaPorId(t.empresa_id);
    const nome = nomeSeguro(await nomeDe(undefined, t.empresa_id, t.oportunidade_id!));
    return enviarIniciada(t, { oportunidadeId: t.oportunidade_id!, finalidade: 'confirmacao', corpo: `Olá${nome ? `, ${nome}` : ''}! Recebemos seu pedido de orçamento na ${empresa?.nome}. Uma pessoa da equipe vai falar com você. Para não receber mensagens, responda SAIR.` });
  },

  async retorno_cliente(t) {
    const empresa = await empresaPorId(t.empresa_id);
    if (!empresa?.config.regras.retorno_auto_cliente) return { tipo: 'cancelado', motivo: 'O retorno automático foi desligado nas regras da empresa.' };
    const nome = nomeSeguro(await nomeDe(undefined, t.empresa_id, t.oportunidade_id!));
    const corpo = Number(t.dados.passo ?? 1) >= 2
      ? `Olá${nome ? `, ${nome}` : ''}! Passando para saber se você conseguiu ver a proposta da ${empresa.nome}. Se quiser, é só responder por aqui que uma pessoa da equipe fala com você. Para não receber mensagens, responda SAIR.`
      : `Olá${nome ? `, ${nome}` : ''}! Aqui é da ${empresa.nome}. Ficou alguma dúvida sobre a proposta que enviamos? Para não receber mensagens, responda SAIR.`;
    return enviarIniciada(t, { oportunidadeId: t.oportunidade_id!, finalidade: 'retorno', agendadoEm: new Date(String(t.dados.agendado_em ?? t.criado_em)), corpo });
  },

  async lembrete_manutencao(t) {
    const empresa = await empresaPorId(t.empresa_id);
    if (!empresa?.config.regras.manutencao_auto) return { tipo: 'cancelado', motivo: 'O lembrete de manutenção foi desligado nas regras da empresa.' };
    const nome = nomeSeguro(await nomeDe(undefined, t.empresa_id, t.oportunidade_id!));
    const meses = Number(t.dados.meses ?? empresa.config.regras.manutencao_meses);
    return enviarIniciada(t, { oportunidadeId: t.oportunidade_id!, finalidade: 'manutencao', corpo: `Olá${nome ? `, ${nome}` : ''}! Aqui é da ${empresa.nome}. Já faz ${meses} ${meses === 1 ? 'mês' : 'meses'} do serviço que fizemos. Quer agendar a manutenção? É só responder por aqui que uma pessoa da equipe combina com você. Para não receber mensagens, responda SAIR.` });
  },

  /** The same neutral invitation for every eligible customer. */
  async convite_avaliacao(t) {
    const empresa = await empresaPorId(t.empresa_id);
    if (!empresa?.config.avaliacao.link) return { tipo: 'cancelado', motivo: 'Sem link de avaliação configurado.' };
    const token = await criarConviteAvaliacao(empresa.id, t.oportunidade_id!);
    const nome = nomeSeguro(await nomeDe(undefined, t.empresa_id, t.oportunidade_id!));
    return enviarIniciada(t, { oportunidadeId: t.oportunidade_id!, finalidade: 'avaliacao', corpo: `Olá${nome ? `, ${nome}` : ''}! Obrigado por contratar a ${empresa.nome}. Se puder, conte como foi sua experiência: ${process.env.APP_URL ?? ''}/avaliar/${token} Para não receber mensagens, responda SAIR.` });
  },
};

/** One invitation per opportunity; asking again gives a fresh link (only the hash is stored). */
export async function criarConviteAvaliacao(empresaId: string, oportunidadeId: string): Promise<string> {
  const token = novoToken();
  await q(
    `insert into avaliacoes (empresa_id, oportunidade_id, token_hash) values ($1, $2, $3)
     on conflict (empresa_id, oportunidade_id) do update set token_hash = excluded.token_hash`,
    [empresaId, oportunidadeId, hashToken(token)],
  );
  return token;
}

export async function processarFila(max?: number): Promise<number> {
  const n = await processarPendentes(executores, max);
  // Phone alerts of the notifications these jobs (and the request that triggered them) created.
  await enviarAvisosCelular().catch((err) => console.error('[avisos celular]', err));
  return n;
}

/** Time-based automations: started here, every few minutes, then run by the queue like any other step. */
export async function varrerAutomacoes(): Promise<number> {
  const { varrerParadas } = await import('./fluxos');
  const { escalarTarefas, enviarResumos, agendarManutencoes } = await import('./rotinas');
  return (await varrerParadas()) + (await escalarTarefas()) + (await enviarResumos()) + (await agendarManutencoes());
}

export const NOME_TRABALHO: Record<string, string> = {
  responder_ia: 'Resposta da assistente',
  enviar_mensagem: 'Envio de mensagem pelo WhatsApp',
  alerta_sla: 'Alerta de pedido sem atendimento',
  confirmacao_pedido: 'Confirmação do pedido ao cliente',
  retorno_cliente: 'Retorno ao cliente depois da proposta',
  convite_avaliacao: 'Convite de avaliação',
  fluxo_passo: 'Passo de um fluxo de automação',
  lembrete_manutencao: 'Lembrete de manutenção',
};

export interface Execucao {
  id: string;
  tipo: string;
  estado: Trabalho['estado'];
  executar_em: Date;
  concluido_em: Date | null;
  resultado: string | null;
  ultimo_erro: string | null;
  oportunidade_id: string | null;
  conversa_id: string | null;
  contato: string | null;
}

/** What the automations of one company did and what is still scheduled (company admins). */
export async function execucoes(empresaId: string): Promise<{ agendadas: Execucao[]; recentes: Execucao[]; resumo: { tipo: string; estado: string; total: number }[] }> {
  const base = `select t.id, t.tipo, t.estado, t.executar_em, t.concluido_em, t.resultado, t.ultimo_erro, t.oportunidade_id, t.conversa_id,
      coalesce(c.nome, c2.nome) as contato
    from trabalhos t
      left join oportunidades o on o.id = t.oportunidade_id left join contatos c on c.id = o.contato_id
      left join conversas v on v.id = t.conversa_id left join contatos c2 on c2.id = v.contato_id
    where t.empresa_id = $1`;
  const [agendadas, recentes, resumo] = await Promise.all([
    q<Execucao>(`${base} and t.estado in ('pendente', 'executando') order by t.executar_em limit 50`, [empresaId]),
    q<Execucao>(`${base} and t.estado not in ('pendente', 'executando') order by t.concluido_em desc nulls last limit 60`, [empresaId]),
    q<{ tipo: string; estado: string; total: number }>(`select tipo, estado, count(*)::int as total from trabalhos where empresa_id = $1 and criado_em > now() - interval '30 days' group by tipo, estado`, [empresaId]),
  ]);
  return { agendadas, recentes, resumo };
}

import { z } from 'zod';
import { lerWebhook } from './canais/whatsapp-cloud';
import { normalizarTelefone, type EstadoConversa } from './config';
import { conhecimentoAtual } from './conhecimento';
import { ator, criarTarefa, dentroDoLimite, registrar, type Ctx } from './contexto';
import { pool, q, tx, um, type Db } from './db';
import { empresaPorId, type Empresa } from './empresas';
import { ErroDeUso, NaoEncontrado } from './erros';
import { agendar, cancelarPendentes, executar, pegar, type Resultado, type Trabalho } from './fila';
import { adaptadorIA, modeloPadrao } from './ia';
import { MOTIVOS_ENCAMINHAMENTO, type ContextoIA } from './ia/tipos';
import { canalDa, empresaDoNumero } from './integracoes';
import { marcarAtendimentoHumano } from './oportunidades';
import { abrirAtendimento, validarExtras } from './pedidos';
import { hashToken, novoToken } from './segredos';

export interface Conversa {
  id: string;
  empresa_id: string;
  contato_id: string | null;
  oportunidade_id: string | null;
  canal: 'site' | 'whatsapp';
  estado: EstadoConversa;
  assumida_por: string | null;
  assumida_em: Date | null;
  ultima_entrada_em: Date | null;
  falhas_ia: number;
  resumo: string;
  dados: Record<string, string | number>;
  criado_em: Date;
  atualizado_em: Date;
}

export interface Mensagem {
  id: string;
  conversa_id: string;
  direcao: 'entrada' | 'saida';
  autor: 'contato' | 'ia' | 'humano' | 'sistema';
  autor_nome?: string | null;
  corpo: string;
  estado: string;
  automatica: boolean;
  simulada: boolean;
  ia_simulada: boolean;
  modelo_mensagem: string | null;
  erro: string | null;
  criado_em: Date;
}

/** Automatic sends that a human take-over, a reply or an opt-out must stop. */
const AUTOMATICOS = ['responder_ia', 'retorno_cliente', 'convite_avaliacao', 'confirmacao_pedido'];
export const JANELA_WHATSAPP_MS = 24 * 3_600_000;
const TELEFONE = /(?:\+?55[\s.-]?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}/;
const TELEFONE_G = new RegExp(TELEFONE.source, 'g');
const SAIR = /^\s*(sair|parar|pare|stop|cancelar|descadastrar|nao quero mais|não quero mais)\s*[.!]?\s*$/i;

const travar = async (db: Db, empresaId: string, id: string) => um<Conversa>('select * from conversas where empresa_id = $1 and id = $2 for update', [empresaId, id], db);

/* ---------- Panel: reading ---------- */

export async function listarConversas(ctx: Ctx, estado?: EstadoConversa) {
  return q<Conversa & { contato_nome: string | null; contato_telefone: string | null; assumida_nome: string | null; ultima: string | null }>(
    `select v.*, c.nome as contato_nome, c.telefone as contato_telefone, u.name as assumida_nome,
       (select m.corpo from mensagens m where m.conversa_id = v.id order by m.criado_em desc limit 1) as ultima
     from conversas v left join contatos c on c.id = v.contato_id left join "user" u on u.id = v.assumida_por
     where v.empresa_id = $1 and ($2::text is null or v.estado = $2) and exists (select 1 from mensagens m where m.conversa_id = v.id)
     order by (v.estado = 'aguardando_humano') desc, v.atualizado_em desc limit 200`,
    [ctx.empresaId, estado ?? null],
  );
}

export async function obterConversa(ctx: Ctx, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new NaoEncontrado('Conversa não encontrada.');
  const v = await um<Conversa & { contato_nome: string | null; contato_telefone: string | null; assumida_nome: string | null; nao_contatar_em: Date | null }>(
    `select v.*, c.nome as contato_nome, c.telefone as contato_telefone, c.nao_contatar_em, u.name as assumida_nome
     from conversas v left join contatos c on c.id = v.contato_id left join "user" u on u.id = v.assumida_por
     where v.empresa_id = $1 and v.id = $2`,
    [ctx.empresaId, id],
  );
  if (!v) throw new NaoEncontrado('Conversa não encontrada.');
  return v;
}

export async function mensagensDe(empresaId: string, conversaId: string, db?: Db): Promise<Mensagem[]> {
  return q<Mensagem>(
    `select m.*, u.name as autor_nome from mensagens m left join "user" u on u.id = m.autor_id
     where m.empresa_id = $1 and m.conversa_id = $2 order by m.criado_em, m.id limit 500`,
    [empresaId, conversaId],
    db,
  );
}

export async function conversasDoContato(ctx: Ctx, contatoId: string) {
  return q<Conversa>('select * from conversas where empresa_id = $1 and contato_id = $2 order by atualizado_em desc', [ctx.empresaId, contatoId]);
}

/* ---------- Outgoing messages ---------- */

interface Saida {
  autor: 'ia' | 'humano' | 'sistema';
  autorId?: string | null;
  corpo: string;
  automatica: boolean;
  iaSimulada?: boolean;
  modelo?: string | null;
  versaoConhecimento?: number | null;
}

/**
 * Stores an outgoing message. Site chat: the widget reads it from here, so it is already delivered.
 * WhatsApp: it waits in the queue and a job sends it (after checking again that it still may be sent).
 */
async function inserirSaida(db: Db, v: Conversa, s: Saida): Promise<string> {
  const site = v.canal === 'site';
  const m = await um<{ id: string }>(
    `insert into mensagens (empresa_id, conversa_id, direcao, autor, autor_id, corpo, estado, automatica, ia_simulada, modelo_mensagem, versao_conhecimento)
     values ($1, $2, 'saida', $3, $4, $5, $6, $7, $8, $9, $10) returning id`,
    [v.empresa_id, v.id, s.autor, s.autorId ?? null, s.corpo, site ? 'enviada' : 'na_fila', s.automatica, s.iaSimulada ?? false, s.modelo ?? null, s.versaoConhecimento ?? null],
    db,
  );
  await q('update conversas set atualizado_em = now() where id = $1', [v.id], db);
  if (!site) await agendar(db, v.empresa_id, { tipo: 'enviar_mensagem', chave: `envio:${m!.id}`, conversaId: v.id, dados: { mensagem: m!.id } });
  return m!.id;
}

/** Sends one queued WhatsApp message. The state of the message itself prevents sending it twice. */
export async function despachar(t: Trabalho): Promise<Resultado> {
  const id = String(t.dados.mensagem ?? '');
  const pronto = await tx(async (db) => {
    const m = await um<Mensagem & { empresa_id: string }>('select * from mensagens where empresa_id = $1 and id = $2 for update', [t.empresa_id, id], db);
    if (!m) return { fim: { tipo: 'cancelado', motivo: 'Mensagem não existe mais.' } as Resultado };
    const v = (await travar(db, t.empresa_id, m.conversa_id))!;
    if (m.estado === 'enviando') {
      // A previous run stopped between "sending" and the provider's answer: we cannot know if it went out.
      await q(`update mensagens set estado = 'incerta', erro = 'Envio interrompido: não sabemos se o WhatsApp recebeu.', atualizado_em = now() where id = $1`, [id], db);
      await criarTarefa(db, t.empresa_id, { conversaId: v.id, tipo: 'envio_incerto', titulo: 'Confirme se o cliente recebeu a última mensagem', chave: `incerto:${id}` });
      return { fim: { tipo: 'incerto', erro: 'Envio interrompido antes da confirmação.' } as Resultado };
    }
    if (m.estado !== 'na_fila') return { fim: { tipo: 'cancelado', motivo: `Mensagem em estado ${m.estado}.` } as Resultado };
    const contato = await um<{ telefone: string; nao_contatar_em: Date | null }>('select telefone, nao_contatar_em from contatos where id = $1', [v.contato_id], db);
    const cancelar = async (motivo: string) => {
      await q(`update mensagens set estado = 'cancelada', erro = $2, atualizado_em = now() where id = $1`, [id, motivo], db);
      return { fim: { tipo: 'cancelado', motivo } as Resultado };
    };
    if (!contato) return cancelar('Contato não existe mais.');
    const respondeuDepois = !!v.ultima_entrada_em && v.ultima_entrada_em > m.criado_em;
    if (m.automatica) {
      if (contato.nao_contatar_em) return cancelar('O contato pediu para não receber mensagens.');
      if (v.estado === 'humano_atendendo') return cancelar('Uma pessoa assumiu a conversa.');
      if (m.autor === 'sistema' && m.modelo_mensagem !== null && v.estado !== 'ia_ativa') return cancelar('A conversa não está mais com o atendimento automático.');
      if (m.autor === 'sistema' && m.modelo_mensagem !== null && respondeuDepois) return cancelar('O cliente respondeu antes do envio.');
    } else if (contato.nao_contatar_em && !(v.ultima_entrada_em && v.ultima_entrada_em > contato.nao_contatar_em)) {
      return cancelar('O contato pediu para não receber mensagens.');
    }
    const naJanela = !!v.ultima_entrada_em && Date.now() - v.ultima_entrada_em.getTime() < JANELA_WHATSAPP_MS;
    const modelo = m.modelo_mensagem && m.modelo_mensagem !== 'texto' ? m.modelo_mensagem : null;
    if (!naJanela && !modelo) {
      await criarTarefa(db, t.empresa_id, { conversaId: v.id, tipo: 'fora_da_janela', titulo: 'Mensagem não enviada: passou das 24 horas da última mensagem do cliente', detalhe: 'O WhatsApp só aceita texto livre até 24 horas depois da última mensagem do cliente. Use um modelo aprovado ou ligue.', chave: `janela:${id}` });
      return cancelar('Fora da janela de 24 horas e sem modelo aprovado.');
    }
    await q(`update mensagens set estado = 'enviando', atualizado_em = now() where id = $1`, [id], db);
    return { m, telefone: contato.telefone, usarModelo: naJanela ? null : modelo };
  });
  if ('fim' in pronto) return pronto.fim as Resultado;

  const { canal, config, motivo } = await canalDa(t.empresa_id);
  const falhar = async (erro: string, estado: 'falhou' | 'incerta'): Promise<void> => {
    await tx(async (db) => {
      await q(`update mensagens set estado = $2, erro = $3, atualizado_em = now() where id = $1 and estado = 'enviando'`, [id, estado, erro.slice(0, 500)], db);
      await criarTarefa(db, t.empresa_id, {
        conversaId: pronto.m.conversa_id,
        tipo: estado === 'falhou' ? 'envio_falhou' : 'envio_incerto',
        titulo: estado === 'falhou' ? 'Uma mensagem não foi enviada ao cliente' : 'Confirme se o cliente recebeu a última mensagem',
        detalhe: erro.slice(0, 300),
        chave: `${estado}:${id}`,
      });
    });
  };
  if (!canal) {
    await falhar(motivo ?? 'Canal indisponível.', 'falhou');
    return { tipo: 'falhou', erro: motivo ?? 'Canal indisponível.' };
  }
  const r = pronto.usarModelo
    ? await canal.enviarModelo(pronto.telefone, { nome: pronto.usarModelo, idioma: config.idioma_modelos, variaveis: [pronto.m.corpo] })
    : await canal.enviarTexto(pronto.telefone, pronto.m.corpo);
  if (r.tipo === 'aceito') {
    // Only now, with the provider's id, the message counts as sent.
    await q(`update mensagens set estado = 'enviada', id_provedor = $2, simulada = $3, erro = null, atualizado_em = now() where id = $1 and estado = 'enviando'`, [id, r.idProvedor, canal.simulado]);
    // The automatic confirmation only counts once the provider accepted it.
    if (t.dados.finalidade === 'confirmacao' && t.oportunidade_id) await q('update oportunidades set confirmacao_auto_em = coalesce(confirmacao_auto_em, now()) where empresa_id = $1 and id = $2', [t.empresa_id, t.oportunidade_id]);
    return { tipo: 'concluido', nota: canal.simulado ? 'Simulação — nenhuma mensagem externa enviada.' : 'Aceita pelo WhatsApp.' };
  }
  if (r.tipo === 'incerto') {
    await falhar(r.erro, 'incerta');
    return { tipo: 'incerto', erro: r.erro };
  }
  if (r.repetir && t.tentativas < t.max_tentativas) {
    await q(`update mensagens set estado = 'na_fila', erro = $2, atualizado_em = now() where id = $1 and estado = 'enviando'`, [id, r.erro.slice(0, 500)]);
    return { tipo: 'repetir', erro: r.erro };
  }
  await falhar(r.erro, 'falhou');
  return { tipo: 'falhou', erro: r.erro };
}

/* ---------- Human take-over ---------- */

async function pararAutomaticos(db: Db, v: Conversa, motivo: string) {
  await cancelarPendentes(db, v.empresa_id, { conversaId: v.id, oportunidadeId: v.oportunidade_id, tipos: AUTOMATICOS }, motivo);
  await q(`update mensagens set estado = 'cancelada', erro = $3, atualizado_em = now() where empresa_id = $1 and conversa_id = $2 and estado = 'na_fila' and automatica`, [v.empresa_id, v.id, motivo], db);
}

/** A person takes the conversation: the assistant and every pending automatic send stop at once. */
export async function assumir(ctx: Ctx, conversaId: string): Promise<void> {
  await tx(async (db) => {
    const v = await travar(db, ctx.empresaId, conversaId);
    if (!v) throw new NaoEncontrado('Conversa não encontrada.');
    if (v.estado === 'humano_atendendo' && v.assumida_por === ctx.userId) return;
    await q(`update conversas set estado = 'humano_atendendo', assumida_por = $2, assumida_em = now(), atualizado_em = now() where id = $1`, [v.id, ctx.userId], db);
    await pararAutomaticos(db, v, 'Uma pessoa assumiu a conversa.');
    await q(`update tarefas set concluida_em = now(), concluida_por = $3 where empresa_id = $1 and conversa_id = $2 and tipo = 'assumir_conversa' and concluida_em is null`, [ctx.empresaId, v.id, ctx.userId], db);
    await marcarAtendimentoHumano(db, ctx.empresaId, v.oportunidade_id, ctx.userId);
    await registrar(db, ctx.empresaId, { conversaId: v.id, oportunidadeId: v.oportunidade_id, contatoId: v.contato_id, ator: ator(ctx), tipo: 'conversa_assumida', dados: { de: v.estado } });
  });
}

/** Giving the conversation back to the assistant is always an explicit act; a seller's silence never does it. */
export async function devolverParaIA(ctx: Ctx, conversaId: string): Promise<void> {
  await tx(async (db) => {
    const v = await travar(db, ctx.empresaId, conversaId);
    if (!v) throw new NaoEncontrado('Conversa não encontrada.');
    if (v.estado === 'ia_ativa') return;
    await q(`update conversas set estado = 'ia_ativa', assumida_por = null, assumida_em = null, falhas_ia = 0, atualizado_em = now() where id = $1`, [v.id], db);
    await registrar(db, ctx.empresaId, { conversaId: v.id, oportunidadeId: v.oportunidade_id, contatoId: v.contato_id, ator: ator(ctx), tipo: 'conversa_devolvida_ia', dados: { de: v.estado } });
  });
}

export async function encerrarConversa(ctx: Ctx, conversaId: string): Promise<void> {
  await tx(async (db) => {
    const v = await travar(db, ctx.empresaId, conversaId);
    if (!v) throw new NaoEncontrado('Conversa não encontrada.');
    await q(`update conversas set estado = 'encerrada', atualizado_em = now() where id = $1`, [v.id], db);
    await pararAutomaticos(db, v, 'Conversa encerrada.');
    await registrar(db, ctx.empresaId, { conversaId: v.id, oportunidadeId: v.oportunidade_id, contatoId: v.contato_id, ator: ator(ctx), tipo: 'conversa_encerrada', dados: { de: v.estado } });
  });
}

/** A person writes to the customer. Writing takes the conversation over, so no automatic message can cross it. */
export async function enviarComoHumano(ctx: Ctx, conversaId: string, texto: string): Promise<void> {
  const corpo = texto.trim();
  if (!corpo) throw new ErroDeUso('Escreva a mensagem.');
  if (corpo.length > 2000) throw new ErroDeUso('Mensagem longa demais (até 2.000 caracteres).');
  await assumir(ctx, conversaId);
  await tx(async (db) => {
    const v = (await travar(db, ctx.empresaId, conversaId))!;
    if (v.canal === 'whatsapp') {
      const c = await um<{ nao_contatar_em: Date | null }>('select nao_contatar_em from contatos where id = $1', [v.contato_id], db);
      if (c?.nao_contatar_em && !(v.ultima_entrada_em && v.ultima_entrada_em > c.nao_contatar_em)) throw new ErroDeUso('Este contato pediu para não receber mensagens. Só dá para responder se ele escrever de novo.');
      if (!v.ultima_entrada_em || Date.now() - v.ultima_entrada_em.getTime() >= JANELA_WHATSAPP_MS) {
        throw new ErroDeUso('Passou das 24 horas desde a última mensagem do cliente: o WhatsApp não aceita texto livre agora. Ligue ou aguarde o cliente escrever.');
      }
    }
    await inserirSaida(db, v, { autor: 'humano', autorId: ctx.userId, corpo, automatica: false });
    await registrar(db, ctx.empresaId, { conversaId: v.id, oportunidadeId: v.oportunidade_id, contatoId: v.contato_id, ator: ator(ctx), tipo: 'mensagem_humana' });
  });
}

/** The assistant (or a failure, or a limit) passes the conversation to the team and stops answering. */
async function encaminhar(db: Db, v: Conversa, motivo: string, resumo: string, quem: 'ia' | 'sistema') {
  if (v.estado !== 'ia_ativa') return;
  await q(`update conversas set estado = 'aguardando_humano', resumo = $2, atualizado_em = now() where id = $1`, [v.id, resumo.slice(0, 1000)], db);
  await cancelarPendentes(db, v.empresa_id, { conversaId: v.id, oportunidadeId: v.oportunidade_id, tipos: ['retorno_cliente'] }, 'Conversa encaminhada para uma pessoa.');
  const resp = v.oportunidade_id ? (await um<{ responsavel_id: string | null }>('select responsavel_id from oportunidades where id = $1', [v.oportunidade_id], db))?.responsavel_id : null;
  const titulos: Record<string, string> = {
    pedido_do_cliente: 'Cliente pediu para falar com uma pessoa',
    negociacao: 'Cliente quer negociar',
    reclamacao: 'Cliente com reclamação',
    fora_da_base: 'Pergunta sem resposta no conteúdo aprovado',
    nao_entendi: 'A assistente não entendeu o cliente',
    ia_indisponivel: 'Assistente indisponível: conversa precisa de uma pessoa',
    limite_consumo: 'Limite mensal da assistente atingido: conversa precisa de uma pessoa',
    ia_desligada: 'Nova mensagem de cliente (assistente desligada)',
    midia: 'Cliente enviou mídia que a assistente não lê',
  };
  await criarTarefa(db, v.empresa_id, {
    conversaId: v.id,
    oportunidadeId: v.oportunidade_id,
    tipo: 'assumir_conversa',
    titulo: titulos[motivo] ?? 'Conversa precisa de uma pessoa',
    detalhe: resumo.slice(0, 500),
    prazo: new Date(Date.now() + 15 * 60_000),
    responsavelId: resp ?? null,
    chave: `encaminhar:${v.id}:${Date.now()}`,
    link: `/painel/atendimento/${v.id}`,
  });
  await registrar(db, v.empresa_id, { conversaId: v.id, oportunidadeId: v.oportunidade_id, contatoId: v.contato_id, ator: { tipo: quem }, tipo: 'conversa_encaminhada', dados: { motivo } });
}

/* ---------- Assistant ---------- */

const DadosIA = z.object({
  nome: z.string().trim().min(2).max(80).optional(),
  telefone: z.string().trim().max(30).optional(),
  cidade: z.string().trim().min(2).max(80).optional(),
  necessidade: z.string().trim().min(3).max(1000).optional(),
  extras: z.record(z.string(), z.string().max(200)).optional(),
});

function faltando(empresa: Empresa, v: Conversa): { id: string; pergunta: string }[] {
  const d = v.dados;
  const lista = [
    { id: 'nome', pergunta: 'Para começar, qual é o seu nome?' },
    ...(v.canal === 'site' ? [{ id: 'telefone', pergunta: 'Qual é o seu telefone com DDD, para a equipe falar com você?' }] : []),
    { id: 'cidade', pergunta: 'Em qual cidade fica o imóvel?' },
    ...empresa.config.campos.filter((c) => c.obrigatorio).map((c) => ({ id: c.id, pergunta: c.pergunta })),
    { id: 'necessidade', pergunta: 'Me conte em poucas palavras o que você precisa.' },
  ];
  return lista.filter((f) => d[f.id] === undefined || d[f.id] === '');
}

/** Links what the visitor told in this conversation to a contact and an opportunity of this company. */
async function sincronizar(db: Db, empresa: Empresa, v: Conversa): Promise<Conversa> {
  const d = v.dados;
  const extras = Object.fromEntries(empresa.config.campos.filter((c) => d[c.id] !== undefined).map((c) => [c.id, d[c.id]]));
  if (!v.contato_id) {
    const tel = typeof d.telefone === 'string' ? d.telefone : '';
    if (!tel || !d.nome) return v;
    await db.query('select pg_advisory_xact_lock(hashtext($1))', [`${empresa.id}:t:${tel}`]);
    // Typing a phone number in the chat is not proof of owning it: an existing contact only gets empty fields filled,
    // and this conversation never shows that contact's earlier history.
    const c = await um<{ id: string }>(
      `insert into contatos (empresa_id, nome, telefone, cidade, dados) values ($1, $2, $3, $4, $5)
       on conflict (empresa_id, telefone) do update set
         nome = case when contatos.nome = '' then excluded.nome else contatos.nome end,
         cidade = case when contatos.cidade = '' then excluded.cidade else contatos.cidade end,
         dados = excluded.dados || contatos.dados
       returning id`,
      [empresa.id, String(d.nome), tel, String(d.cidade ?? ''), JSON.stringify(extras)],
      db,
    );
    v.contato_id = c!.id;
    await q('update conversas set contato_id = $2 where id = $1', [v.id, v.contato_id], db);
  } else {
    await q(
      `update contatos set nome = case when nome = '' then $3 else nome end, cidade = case when cidade = '' or $5 then $4 else cidade end,
         dados = case when $5 then dados || $6::jsonb else $6::jsonb || dados end
       where empresa_id = $1 and id = $2`,
      [empresa.id, v.contato_id, String(d.nome ?? ''), String(d.cidade ?? ''), v.canal === 'whatsapp' && !!d.cidade, JSON.stringify(extras)],
      db,
    );
  }
  if (!v.oportunidade_id) {
    const aberta = await um<{ id: string }>(`select id from oportunidades where empresa_id = $1 and contato_id = $2 and etapa not in ('ganho', 'perdido') order by entrada_em desc limit 1`, [empresa.id, v.contato_id], db);
    if (aberta) v.oportunidade_id = aberta.id;
    else {
      const resp = empresa.responsavel_padrao && (await um('select 1 from membros where empresa_id = $1 and user_id = $2 and ativo', [empresa.id, empresa.responsavel_padrao], db)) ? empresa.responsavel_padrao : null;
      const origem = v.canal === 'whatsapp' ? 'whatsapp' : 'chat_site';
      const o = await um<{ id: string }>(`insert into oportunidades (empresa_id, contato_id, necessidade, origem, responsavel_id) values ($1, $2, $3, $4, $5) returning id`, [empresa.id, v.contato_id, String(d.necessidade ?? ''), origem, resp], db);
      v.oportunidade_id = o!.id;
      await registrar(db, empresa.id, { oportunidadeId: o!.id, contatoId: v.contato_id, conversaId: v.id, ator: { tipo: 'visitante' }, tipo: 'pedido_recebido', dados: { origem } });
      await abrirAtendimento(db, empresa, o!.id, resp, `${d.nome || 'Contato'} escreveu pelo ${v.canal === 'whatsapp' ? 'WhatsApp' : 'chat do site'}`);
    }
    await q('update conversas set oportunidade_id = $2 where id = $1', [v.id, v.oportunidade_id], db);
  }
  if (d.necessidade) await q(`update oportunidades set necessidade = $3 where empresa_id = $1 and id = $2 and necessidade = ''`, [empresa.id, v.oportunidade_id, String(d.necessidade)], db);
  if (d._visita) await q(`update oportunidades set interesse_visita = $3 where empresa_id = $1 and id = $2 and interesse_visita = ''`, [empresa.id, v.oportunidade_id, String(d._visita)], db);
  return v;
}

/**
 * Runs one action the assistant asked for. This is where authorization lives: the conversation and the company
 * come from the server, the input is validated, and nothing outside this list can be done, whatever the prompt said.
 */
async function executarAcao(empresa: Empresa, conversaId: string, nome: string, entrada: unknown, marcas: { encaminhou: boolean }): Promise<string> {
  return tx(async (db) => {
    const v = await travar(db, empresa.id, conversaId);
    if (!v || v.estado !== 'ia_ativa') return 'erro: a conversa não está mais com a assistente.';
    if (nome === 'salvar_dados') {
      const r = DadosIA.safeParse(entrada);
      if (!r.success) return 'erro: dados inválidos.';
      const novo: Record<string, string | number> = {};
      if (r.data.nome) novo.nome = r.data.nome;
      if (r.data.cidade) novo.cidade = r.data.cidade;
      if (r.data.necessidade) novo.necessidade = r.data.necessidade;
      if (r.data.telefone !== undefined && v.canal === 'site') {
        const tel = normalizarTelefone(r.data.telefone);
        if (!tel) return 'erro: O telefone parece incompleto.';
        novo.telefone = tel;
      }
      if (r.data.extras) {
        const pedidos = empresa.config.campos.filter((c) => c.id in r.data.extras!).map((c) => ({ ...c, obrigatorio: false }));
        const ex = validarExtras(pedidos, aproximar(pedidos, r.data.extras));
        const erro = Object.values(ex.erros)[0];
        if (erro) return `erro: ${erro}`;
        Object.assign(novo, ex.dados);
      }
      if (!Object.keys(novo).length) return 'erro: nada para salvar.';
      v.dados = { ...v.dados, ...novo };
      await q('update conversas set dados = $2 where id = $1', [v.id, JSON.stringify(v.dados)], db);
      await sincronizar(db, empresa, v);
      await registrar(db, empresa.id, { conversaId: v.id, oportunidadeId: v.oportunidade_id, contatoId: v.contato_id, ator: { tipo: 'ia' }, tipo: 'dados_coletados', dados: { campos: Object.keys(novo) } });
      return 'ok';
    }
    if (nome === 'registrar_interesse_visita') {
      const pref = String((entrada as { preferencia?: unknown })?.preferencia ?? '').trim().slice(0, 300);
      if (!pref) return 'erro: diga a preferência do cliente.';
      v.dados = { ...v.dados, _visita: pref };
      await q('update conversas set dados = $2 where id = $1', [v.id, JSON.stringify(v.dados)], db);
      if (v.oportunidade_id) {
        await q('update oportunidades set interesse_visita = $3 where empresa_id = $1 and id = $2', [empresa.id, v.oportunidade_id, pref], db);
        await criarTarefa(db, empresa.id, { oportunidadeId: v.oportunidade_id, conversaId: v.id, tipo: 'confirmar_visita', titulo: 'Cliente quer visita: confirmar dia e horário', detalhe: pref, chave: `visita:${v.id}:${pref.length}` });
      }
      await registrar(db, empresa.id, { conversaId: v.id, oportunidadeId: v.oportunidade_id, contatoId: v.contato_id, ator: { tipo: 'ia' }, tipo: 'interesse_visita', dados: { preferencia: pref } });
      return 'ok: interesse anotado; a equipe confirma (não confirme data).';
    }
    if (nome === 'encaminhar_para_pessoa') {
      const e = entrada as { motivo?: string; resumo?: string };
      const motivo = (MOTIVOS_ENCAMINHAMENTO as readonly string[]).includes(e?.motivo ?? '') ? e.motivo! : 'nao_entendi';
      await encaminhar(db, v, motivo, String(e?.resumo ?? '').trim() || 'Sem resumo.', 'ia');
      marcas.encaminhou = true;
      return 'ok: uma pessoa da equipe vai continuar.';
    }
    return 'erro: ação não permitida.';
  });
}

/** "casa" → "Casa", "comercio" → "Comércio": matches a free answer to one of the field's options. */
function aproximar(campos: { id: string; tipo: string; opcoes: string[] }[], extras: Record<string, string>): Record<string, string> {
  const n = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const out = { ...extras };
  for (const c of campos) {
    if (c.tipo !== 'opcoes' || !out[c.id]) continue;
    const v = n(out[c.id]);
    const achou = c.opcoes.find((o) => n(o) === v) ?? c.opcoes.find((o) => n(o).split(/\s+/).some((p) => p.length > 3 && v.includes(p.slice(0, 5))));
    if (achou) out[c.id] = achou;
  }
  return out;
}

const AVISO_INDISPONIVEL = 'No momento não consigo responder por aqui. Já avisei a equipe, que vai continuar este atendimento.';

async function contarUso(empresaId: string, campos: { respostas?: number; entrada?: number; saida?: number; falhas?: number }) {
  await q(
    `insert into uso_ia (empresa_id, mes, respostas, tokens_entrada, tokens_saida, falhas) values ($1, date_trunc('month', now())::date, $2, $3, $4, $5)
     on conflict (empresa_id, mes) do update set respostas = uso_ia.respostas + excluded.respostas, tokens_entrada = uso_ia.tokens_entrada + excluded.tokens_entrada,
       tokens_saida = uso_ia.tokens_saida + excluded.tokens_saida, falhas = uso_ia.falhas + excluded.falhas`,
    [empresaId, campos.respostas ?? 0, campos.entrada ?? 0, campos.saida ?? 0, campos.falhas ?? 0],
  );
}

/** Job: the assistant answers one incoming message (if the conversation is still hers when she finishes). */
export async function responderComIA(t: Trabalho): Promise<Resultado> {
  const msgId = String(t.dados.mensagem ?? '');
  const m = await um<{ id: string; conversa_id: string; criado_em: Date }>(`select id, conversa_id, criado_em from mensagens where empresa_id = $1 and id = $2 and direcao = 'entrada'`, [t.empresa_id, msgId]);
  if (!m) return { tipo: 'cancelado', motivo: 'Mensagem não existe mais.' };
  const empresa = await empresaPorId(t.empresa_id);
  const v = await um<Conversa>('select * from conversas where empresa_id = $1 and id = $2', [t.empresa_id, m.conversa_id]);
  if (!empresa || !v) return { tipo: 'cancelado', motivo: 'Conversa não existe mais.' };
  if (v.estado !== 'ia_ativa') return { tipo: 'cancelado', motivo: 'A conversa não está com a assistente.' };
  // Compared inside the database: timestamps there are finer than a JavaScript Date.
  if (await um(`select 1 from mensagens where conversa_id = $1 and id <> $2 and criado_em > (select criado_em from mensagens where id = $2) and ((direcao = 'entrada') or (autor = 'ia'))`, [v.id, m.id])) {
    return { tipo: 'cancelado', motivo: 'Há mensagem mais recente nesta conversa.' };
  }
  if (v.contato_id && (await um('select 1 from contatos where id = $1 and nao_contatar_em is not null', [v.contato_id]))) return { tipo: 'cancelado', motivo: 'O contato pediu para não receber mensagens.' };

  const passar = async (motivo: string, aviso: string | null) => {
    await tx(async (db) => {
      const atual = await travar(db, empresa.id, v.id);
      if (!atual || atual.estado !== 'ia_ativa') return;
      await encaminhar(db, atual, motivo, 'A assistente não respondeu a última mensagem do cliente.', 'sistema');
      if (aviso) await inserirSaida(db, atual, { autor: 'sistema', corpo: aviso, automatica: true });
    });
  };
  const cfg = empresa.config.ia;
  if (!cfg.ativa) {
    await passar('ia_desligada', null);
    return { tipo: 'concluido', nota: 'Assistente desligada: encaminhada para a equipe.' };
  }
  const adaptador = adaptadorIA();
  if (!adaptador) {
    await passar('ia_indisponivel', AVISO_INDISPONIVEL);
    return { tipo: 'concluido', nota: 'Sem provedor de IA configurado.' };
  }
  const uso = await um<{ respostas: number }>(`select respostas from uso_ia where empresa_id = $1 and mes = date_trunc('month', now())::date`, [empresa.id]);
  if ((uso?.respostas ?? 0) >= cfg.limite_respostas_mes) {
    await passar('limite_consumo', 'Vou chamar uma pessoa da equipe para continuar este atendimento.');
    return { tipo: 'concluido', nota: 'Limite mensal de respostas atingido.' };
  }

  const k = await conhecimentoAtual(empresa.id);
  const marcas = { encaminhou: false };
  const todas = (await mensagensDe(empresa.id, v.id)).filter((x) => x.estado !== 'cancelada' && x.estado !== 'falhou');
  // The phone is read here, on the server, and never travels to the model: the history carries only a marker.
  if (v.canal === 'site' && !v.dados.telefone) {
    const achado = todas.find((x) => x.id === m.id)?.corpo.match(TELEFONE)?.[0];
    if (achado && normalizarTelefone(achado)) {
      await executarAcao(empresa, v.id, 'salvar_dados', { telefone: achado }, marcas);
      Object.assign(v, await um<Conversa>('select * from conversas where id = $1', [v.id]));
    }
  }
  const historico = todas
    .slice(-cfg.max_mensagens_contexto)
    .map((x) => ({ de: x.direcao === 'entrada' ? ('contato' as const) : ('assistente' as const), texto: x.direcao === 'entrada' ? x.corpo.replace(TELEFONE_G, '[telefone informado]') : x.corpo }));
  while (historico[0]?.de === 'assistente') historico.shift();
  const coletado: Record<string, string | number> = {};
  for (const [id, valor] of Object.entries(v.dados)) if (!id.startsWith('_')) coletado[id] = id === 'telefone' ? 'informado' : valor;
  const contexto: ContextoIA = { empresa: empresa.nome, assistente: cfg.nome, canal: v.canal, conhecimento: k.dados, campos: empresa.config.campos, coletado, faltando: faltando(empresa, v) };
  let resposta;
  try {
    resposta = await adaptador.responder({ contexto, historico, modelo: cfg.modelo || modeloPadrao(), maxTokens: cfg.max_tokens_resposta }, (nome, entrada) => executarAcao(empresa, v.id, nome, entrada, marcas));
  } catch (err) {
    // The provider failed: the conversation is kept, the customer is told, and a person gets the task.
    await contarUso(empresa.id, { falhas: 1 });
    await registrar(pool(), empresa.id, { conversaId: v.id, oportunidadeId: v.oportunidade_id, ator: { tipo: 'sistema' }, tipo: 'ia_falhou', dados: { erro: (err instanceof Error ? err.message : String(err)).slice(0, 300) } });
    await passar('ia_indisponivel', AVISO_INDISPONIVEL);
    return { tipo: 'concluido', nota: 'Falha do provedor de IA: encaminhada para a equipe.' };
  }
  await contarUso(empresa.id, { respostas: 1, entrada: resposta.tokensEntrada, saida: resposta.tokensSaida });
  return tx(async (db) => {
    const atual = await travar(db, empresa.id, v.id);
    const podeEnviar = !!atual && (atual.estado === 'ia_ativa' || (marcas.encaminhou && atual.estado === 'aguardando_humano'));
    const base = { conversaId: v.id, oportunidadeId: atual?.oportunidade_id, contatoId: atual?.contato_id, ator: { tipo: 'ia' as const } };
    if (!podeEnviar) {
      await registrar(db, empresa.id, { ...base, tipo: 'resposta_ia_descartada', dados: { motivo: `Conversa em estado ${atual?.estado}.` } });
      return { tipo: 'cancelado', motivo: 'Uma pessoa assumiu antes da resposta ficar pronta.' } as Resultado;
    }
    await inserirSaida(db, atual!, { autor: 'ia', corpo: resposta.texto, automatica: true, iaSimulada: adaptador.simulada, versaoConhecimento: k.versao });
    await registrar(db, empresa.id, { ...base, tipo: 'ia_respondeu', dados: { versao_conhecimento: k.versao, modelo: resposta.modelo, simulada: adaptador.simulada, tokens_entrada: resposta.tokensEntrada, tokens_saida: resposta.tokensSaida } });
    return { tipo: 'concluido' } as Resultado;
  });
}

/* ---------- Incoming: WhatsApp ---------- */

export interface EntradaWhatsApp {
  de: string;
  nome: string;
  texto: string | null;
  idProvedor: string;
  quando: Date;
}

/** Stores a message that arrived on the company's WhatsApp number and decides who answers it. */
export async function receberWhatsApp(empresaId: string, e: EntradaWhatsApp): Promise<{ duplicada: boolean; mensagemId?: string; trabalhoId?: string | null; conversaId?: string }> {
  const empresa = await empresaPorId(empresaId);
  const telefone = e.de.replace(/\D/g, '');
  if (!empresa || !/^\d{8,15}$/.test(telefone)) return { duplicada: true };
  return tx(async (db) => {
    await db.query('select pg_advisory_xact_lock(hashtext($1))', [`${empresaId}:t:${telefone}`]);
    if (await um('select 1 from mensagens where empresa_id = $1 and id_provedor = $2', [empresaId, e.idProvedor], db)) return { duplicada: true };
    const contato = await um<{ id: string; nome: string; cidade: string; dados: Record<string, string | number>; nao_contatar_em: Date | null }>(
      `insert into contatos (empresa_id, nome, telefone) values ($1, $2, $3)
       on conflict (empresa_id, telefone) do update set telefone = excluded.telefone returning id, nome, cidade, dados, nao_contatar_em`,
      [empresaId, e.nome.trim().slice(0, 80), telefone],
      db,
    );
    let v = await um<Conversa>(`select * from conversas where empresa_id = $1 and contato_id = $2 and canal = 'whatsapp' for update`, [empresaId, contato!.id], db);
    if (!v) {
      const inicial: Record<string, string | number> = { ...contato!.dados };
      if (contato!.nome) inicial.nome = contato!.nome;
      if (contato!.cidade) inicial.cidade = contato!.cidade;
      v = (await um<Conversa>(`insert into conversas (empresa_id, contato_id, canal, dados) values ($1, $2, 'whatsapp', $3) returning *`, [empresaId, contato!.id, JSON.stringify(inicial)], db))!;
    }
    const corpo = e.texto?.trim() ? e.texto.trim().slice(0, 4000) : '[O cliente enviou um arquivo ou áudio. A assistente só lê texto.]';
    const m = await um<{ id: string }>(
      `insert into mensagens (empresa_id, conversa_id, direcao, autor, corpo, estado, id_provedor) values ($1, $2, 'entrada', 'contato', $3, 'recebida', $4) returning id`,
      [empresaId, v.id, corpo, e.idProvedor],
      db,
    );
    const reabrir = v.estado === 'encerrada';
    if (reabrir) v.estado = 'ia_ativa';
    await q(`update conversas set ultima_entrada_em = greatest(coalesce(ultima_entrada_em, $2), $2), estado = $3, atualizado_em = now() where id = $1`, [v.id, e.quando > new Date() ? new Date() : e.quando, v.estado], db);
    v = await sincronizar(db, empresa, v);
    await q('update oportunidades set ultima_interacao_em = now() where empresa_id = $1 and id = $2', [empresaId, v.oportunidade_id], db);
    // The customer answered: any follow-up that was waiting is no longer wanted.
    await cancelarPendentes(db, empresaId, { conversaId: v.id, oportunidadeId: v.oportunidade_id, tipos: ['retorno_cliente'] }, 'O cliente respondeu.');
    await q(`update mensagens set estado = 'cancelada', erro = 'O cliente respondeu antes do envio.', atualizado_em = now() where conversa_id = $1 and estado = 'na_fila' and autor = 'sistema' and modelo_mensagem is not null`, [v.id], db);

    if (e.texto && SAIR.test(e.texto)) {
      await q('update contatos set nao_contatar_em = now() where id = $1', [contato!.id], db);
      await q('update consentimentos set revogado_em = now() where empresa_id = $1 and contato_id = $2 and revogado_em is null', [empresaId, contato!.id], db);
      await pararAutomaticos(db, v, 'O contato pediu para não receber mensagens.');
      await registrar(db, empresaId, { conversaId: v.id, oportunidadeId: v.oportunidade_id, contatoId: contato!.id, ator: { tipo: 'visitante' }, tipo: 'pedido_de_interrupcao' });
      await criarTarefa(db, empresaId, { conversaId: v.id, oportunidadeId: v.oportunidade_id, tipo: 'descadastro', titulo: 'Um contato pediu para não receber mais mensagens', chave: `sair:${m!.id}` });
      return { duplicada: false, mensagemId: m!.id, trabalhoId: null, conversaId: v.id };
    }
    if (v.estado !== 'ia_ativa') {
      const resp = v.assumida_por ?? (await um<{ responsavel_id: string | null }>('select responsavel_id from oportunidades where id = $1', [v.oportunidade_id], db))?.responsavel_id ?? null;
      await q('insert into notificacoes (empresa_id, user_id, titulo, corpo, link) values ($1, $2, $3, $4, $5)', [empresaId, resp, 'Nova mensagem do cliente', corpo.slice(0, 120), `/painel/atendimento/${v.id}`], db);
      return { duplicada: false, mensagemId: m!.id, trabalhoId: null, conversaId: v.id };
    }
    if (!e.texto?.trim()) {
      await encaminhar(db, v, 'midia', 'O cliente enviou mídia.', 'sistema');
      return { duplicada: false, mensagemId: m!.id, trabalhoId: null, conversaId: v.id };
    }
    const trabalhoId = contato!.nao_contatar_em ? null : await agendar(db, empresaId, { tipo: 'responder_ia', chave: `ia:${m!.id}`, conversaId: v.id, dados: { mensagem: m!.id }, maxTentativas: 2 });
    return { duplicada: false, mensagemId: m!.id, trabalhoId, conversaId: v.id };
  });
}

const ORDEM = ['na_fila', 'enviando', 'incerta', 'enviada', 'entregue', 'lida'];
const DE_PARA = { sent: 'enviada', delivered: 'entregue', read: 'lida', failed: 'falhou' } as const;

/** Delivery report from the provider. Reports can arrive late or out of order: a message never goes backwards. */
export async function atualizarEstado(empresaId: string, idProvedor: string, estado: keyof typeof DE_PARA, erro: string | null): Promise<boolean> {
  const novo = DE_PARA[estado];
  const m =
    novo === 'falhou'
      ? await um<{ id: string; conversa_id: string }>(
          `update mensagens set estado = 'falhou', erro = $3, atualizado_em = now()
           where empresa_id = $1 and id_provedor = $2 and direcao = 'saida' and estado in ('enviando', 'incerta', 'enviada') returning id, conversa_id`,
          [empresaId, idProvedor, erro ?? 'O WhatsApp informou falha na entrega.'],
        )
      : await um<{ id: string; conversa_id: string }>(
          `update mensagens set estado = $3, erro = null, atualizado_em = now()
           where empresa_id = $1 and id_provedor = $2 and direcao = 'saida' and array_position($4::text[], estado) < array_position($4::text[], $3) returning id, conversa_id`,
          [empresaId, idProvedor, novo, ORDEM],
        );
  if (m && novo === 'falhou') {
    await criarTarefa(pool(), empresaId, { conversaId: m.conversa_id, tipo: 'envio_falhou', titulo: 'O WhatsApp informou que uma mensagem não foi entregue', detalhe: erro ?? '', chave: `falhou:${m.id}` });
  }
  return !!m;
}

/** Handles one verified webhook body. Each provider event is processed once, for the company that owns the number. */
export async function processarWebhookWhatsApp(payload: unknown): Promise<{ trabalhos: string[]; ignorados: number }> {
  const trabalhos: string[] = [];
  let ignorados = 0;
  for (const entrada of lerWebhook(payload)) {
    const empresaId = await empresaDoNumero(entrada.phoneNumberId);
    if (!empresaId) {
      ignorados += entrada.mensagens.length + entrada.estados.length;
      continue;
    }
    for (const m of entrada.mensagens) {
      const novo = await um(`insert into eventos_webhook (provedor, id_evento) values ('whatsapp', $1) on conflict do nothing returning id_evento`, [`msg:${m.id}`]);
      if (!novo) {
        ignorados++;
        continue;
      }
      const r = await receberWhatsApp(empresaId, { de: m.de, nome: m.nome, texto: m.texto, idProvedor: m.id, quando: m.quando });
      if (r.trabalhoId) trabalhos.push(r.trabalhoId);
    }
    for (const s of entrada.estados) {
      const novo = await um(`insert into eventos_webhook (provedor, id_evento) values ('whatsapp', $1) on conflict do nothing returning id_evento`, [`st:${s.id}:${s.estado}`]);
      if (!novo) ignorados++;
      else await atualizarEstado(empresaId, s.id, s.estado, s.erro);
    }
  }
  return { trabalhos, ignorados };
}

/* ---------- Incoming: site chat ---------- */

export interface ChatSite {
  token: string;
  estado: EstadoConversa;
  mensagens: { id: string; de: 'voce' | 'assistente' | 'equipe'; texto: string; quando: string; simulada: boolean }[];
}

/** The chat token is the only key to a site conversation: a phone number or an id never opens one. */
async function conversaDoToken(empresaId: string, token: string, db?: Db) {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) return null;
  return um<Conversa>(`select * from conversas where empresa_id = $1 and token_hash = $2 and canal = 'site'`, [empresaId, hashToken(token)], db);
}

export async function lerChatSite(empresa: Empresa, token: string): Promise<ChatSite> {
  const v = await conversaDoToken(empresa.id, token);
  if (!v) throw new NaoEncontrado('Conversa não encontrada.');
  const ms = (await mensagensDe(empresa.id, v.id)).filter((m) => m.estado !== 'cancelada');
  return {
    token,
    estado: v.estado,
    mensagens: ms.map((m) => ({ id: m.id, de: m.direcao === 'entrada' ? 'voce' : m.autor === 'humano' ? 'equipe' : 'assistente', texto: m.corpo, quando: m.criado_em.toISOString(), simulada: m.ia_simulada })),
  };
}

/** Opens a chat already linked to a request the visitor has just sent (the form's data is not asked again). */
export async function abrirChatDoPedido(empresa: Empresa, pedido: { oportunidadeId: string; contatoId: string }, dados: Record<string, string | number>): Promise<string> {
  const token = novoToken();
  await q(`insert into conversas (empresa_id, contato_id, oportunidade_id, canal, dados, token_hash) values ($1, $2, $3, 'site', $4, $5)`, [empresa.id, pedido.contatoId, pedido.oportunidadeId, JSON.stringify(dados), hashToken(token)]);
  return token;
}

export async function escreverNoChatSite(empresa: Empresa, token: string | null, texto: string, ipHash: string): Promise<ChatSite> {
  const corpo = texto.trim();
  if (!corpo) throw new ErroDeUso('Escreva sua mensagem.');
  if (corpo.length > 1000) throw new ErroDeUso('Mensagem longa demais (até 1.000 caracteres).');
  if (!(await dentroDoLimite(`chat:ip:${empresa.id}:${ipHash}`, 40, 600)) || !(await dentroDoLimite(`chat:empresa:${empresa.id}`, 1500, 3600))) throw new ErroDeUso('Muitas mensagens em pouco tempo. Aguarde um pouco.', 429);
  let novoTokenChat = token;
  const trabalhoId = await tx(async (db) => {
    let v = token ? await conversaDoToken(empresa.id, token, db) : null;
    if (token && !v) throw new NaoEncontrado('Conversa não encontrada. Recarregue a página para começar outra.');
    if (!v) {
      if (!(await dentroDoLimite(`chat:novo:${empresa.id}:${ipHash}`, 6, 3600))) throw new ErroDeUso('Muitas conversas abertas em pouco tempo. Tente mais tarde.', 429);
      novoTokenChat = novoToken();
      v = (await um<Conversa>(`insert into conversas (empresa_id, canal, token_hash) values ($1, 'site', $2) returning *`, [empresa.id, hashToken(novoTokenChat)], db))!;
    }
    v = (await travar(db, empresa.id, v.id))!;
    const m = await um<{ id: string }>(`insert into mensagens (empresa_id, conversa_id, direcao, autor, corpo, estado) values ($1, $2, 'entrada', 'contato', $3, 'recebida') returning id`, [empresa.id, v.id, corpo], db);
    if (v.estado === 'encerrada') v.estado = 'ia_ativa';
    await q('update conversas set ultima_entrada_em = now(), estado = $2, atualizado_em = now() where id = $1', [v.id, v.estado], db);
    if (v.oportunidade_id) await q('update oportunidades set ultima_interacao_em = now() where id = $1', [v.oportunidade_id], db);
    if (v.estado !== 'ia_ativa') {
      await q('insert into notificacoes (empresa_id, user_id, titulo, corpo, link) values ($1, $2, $3, $4, $5)', [empresa.id, v.assumida_por, 'Nova mensagem no chat do site', corpo.slice(0, 120), `/painel/atendimento/${v.id}`], db);
      return null;
    }
    return agendar(db, empresa.id, { tipo: 'responder_ia', chave: `ia:${m!.id}`, conversaId: v.id, dados: { mensagem: m!.id }, maxTentativas: 2 });
  });
  // Answer right away when possible; if this process dies here, the worker picks the job up.
  if (trabalhoId) {
    const t = await pegar(trabalhoId);
    if (t) await executar(t, { responder_ia: responderComIA });
  }
  return lerChatSite(empresa, novoTokenChat!);
}

/** Demo and tests: a message "arriving" on WhatsApp without any provider. Refused where the official channel is on. */
export async function simularEntradaWhatsApp(ctx: Ctx, telefone: string, nome: string, texto: string) {
  const { canal } = await canalDa(ctx.empresaId);
  if (!canal?.simulado) throw new ErroDeUso('A simulação só existe enquanto o WhatsApp oficial não está ligado.');
  const tel = normalizarTelefone(telefone);
  if (!tel) throw new ErroDeUso('Telefone inválido. Use DDD + número.');
  if (!texto.trim()) throw new ErroDeUso('Escreva a mensagem.');
  const r = await receberWhatsApp(ctx.empresaId, { de: tel, nome, texto, idProvedor: `sim_in_${novoToken(9)}`, quando: new Date() });
  if (r.trabalhoId) {
    const t = await pegar(r.trabalhoId);
    if (t) await executar(t, { responder_ia: responderComIA });
  }
  return r;
}

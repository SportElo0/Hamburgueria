import { TEXTO_ACEITE_LIGACAO, VERSAO_FRASE_LIGACAO, ambiente, formatarTelefone, normalizarTelefone, type Etapa } from './config';
import { ator, criarTarefa, dentroDoLimite, exigirAdmin, registrar, type Ctx } from './contexto';
import { q, tx, um } from './db';
import { empresaPorId, membroAtivo, type Empresa } from './empresas';
import { ErroDeUso } from './erros';
import { agendar } from './fila';
import { canalDa } from './integracoes';
import { dispararFluxos } from './fluxos';
import { hashToken, novoToken } from './segredos';

/**
 * Missed calls. The company's telephony service (a phone number that rings the team's phones) tells the platform
 * when a call was not answered. The platform then, in one transaction: finds or creates the contact and an open
 * opportunity, creates the "call back" task, starts the company's "missed call" flows and schedules the WhatsApp
 * answer. That answer only goes to who allowed it (pressed 1 in the call menu, or authorized before on the form)
 * and to mobile numbers; everything is checked again when it is sent.
 */

export interface LigacaoPerdida {
  telefone: string;
  /** The call's id at the telephony service (repeated notices of the same call do nothing). */
  idExterno: string;
  quando?: Date;
  /** The caller pressed 1 in the call menu to receive the answer by WhatsApp. */
  aceiteWhatsapp: boolean;
  simulada?: boolean;
}

export type ResultadoLigacao = 'mensagem_agendada' | 'sem_autorizacao' | 'telefone_fixo' | 'pediu_sair' | 'ja_respondida_hoje' | 'limite' | 'repetida' | 'desligado' | 'ja_recebida';

/** Safety cap: answers per company per hour (a leaked service key cannot become mass messaging). */
const MAX_RESPOSTAS_HORA = 40;

/** Calls from the same number within this window count as one (someone calling three times in a row): one task, no new message.
 * Messages: at most one per number per 24 hours. */
const JANELA_REPETIDA_MS = 2 * 3_600_000;
const celular = (tel: string) => /^55[1-9]\d9\d{8}$/.test(tel);

export async function registrarLigacaoPerdida(empresa: Empresa, l: LigacaoPerdida): Promise<{ resultado: ResultadoLigacao; oportunidadeId?: string }> {
  const tel = normalizarTelefone(l.telefone);
  if (!tel) throw new ErroDeUso('Telefone de quem ligou inválido.', 422);
  const idExterno = l.idExterno.trim().slice(0, 120);
  if (!idExterno) throw new ErroDeUso('Falta o identificador da chamada.', 422);
  const quando = l.quando && !Number.isNaN(l.quando.getTime()) && l.quando.getTime() <= Date.now() + 60_000 ? l.quando : new Date();
  // A repeated notice of the same call answers before counting against the company's limit.
  if (await um('select 1 from ligacoes where empresa_id = $1 and id_externo = $2', [empresa.id, idExterno])) return { resultado: 'ja_recebida' };
  if (!(await dentroDoLimite(`ligacao:empresa:${empresa.id}`, 300, 3600))) throw new ErroDeUso('Muitos avisos de ligação em pouco tempo.', 429);

  try {
    return await gravarLigacao(empresa, l, tel, idExterno, quando);
  } catch (err) {
    // Two simultaneous notices of the same call: the second one is just a repeat.
    if (typeof err === 'object' && err && 'code' in err && (err as { code: string }).code === '23505') return { resultado: 'ja_recebida' };
    throw err;
  }
}

async function gravarLigacao(empresa: Empresa, l: LigacaoPerdida, tel: string, idExterno: string, quando: Date): Promise<{ resultado: ResultadoLigacao; oportunidadeId?: string }> {
  return tx(async (db) => {
    // The same number is handled one notice at a time inside the company.
    await db.query('select pg_advisory_xact_lock(hashtext($1))', [`${empresa.id}:t:${tel}`]);
    if (await um('select 1 from ligacoes where empresa_id = $1 and id_externo = $2', [empresa.id, idExterno], db)) return { resultado: 'ja_recebida' as const };

    const contato = (await um<{ id: string; nome: string }>(
      `insert into contatos (empresa_id, telefone) values ($1, $2)
       on conflict (empresa_id, telefone) do update set telefone = excluded.telefone returning id, nome`,
      [empresa.id, tel],
      db,
    ))!;
    const pediuSair = !!(await um('select 1 from contatos where id = $1 and nao_contatar_em is not null', [contato.id], db));
    // Pressing 1 authorizes the answer to THIS call only (recorded with the call's id and time, as proof).
    // Not recorded when the answer is switched off, for a landline or for someone who asked to stop.
    const aceitouAgora = l.aceiteWhatsapp && celular(tel) && !pediuSair && empresa.config.regras.ligacao_auto;
    if (aceitouAgora) {
      await q(`insert into consentimentos (empresa_id, contato_id, canal, texto, origem, versao) values ($1, $2, 'whatsapp', $3, 'ligacao', $4)`, [empresa.id, contato.id, TEXTO_ACEITE_LIGACAO(empresa.nome, idExterno, quando), VERSAO_FRASE_LIGACAO], db);
    }

    // An open opportunity of this contact gets the call; otherwise the call opens a new one.
    let op = await um<{ id: string; etapa: string; responsavel_id: string | null }>(
      `select id, etapa, responsavel_id from oportunidades where empresa_id = $1 and contato_id = $2 and etapa not in ('ganho', 'perdido') order by entrada_em desc limit 1`,
      [empresa.id, contato.id],
      db,
    );
    const nova = !op;
    if (!op) {
      const resp = empresa.responsavel_padrao && (await membroAtivo(db, empresa.id, empresa.responsavel_padrao)) ? empresa.responsavel_padrao : null;
      op = (await um<{ id: string; etapa: string; responsavel_id: string | null }>(
        `insert into oportunidades (empresa_id, contato_id, necessidade, origem, responsavel_id) values ($1, $2, '', 'ligacao', $3) returning id, etapa, responsavel_id`,
        [empresa.id, contato.id, resp],
        db,
      ))!;
    } else {
      await q('update oportunidades set ultima_interacao_em = now() where id = $1', [op.id], db);
    }

    const anterior = await um('select 1 from ligacoes where empresa_id = $1 and contato_id = $2 and recebida_em > $3', [empresa.id, contato.id, new Date(quando.getTime() - JANELA_REPETIDA_MS)], db);
    // Who may get the answer: pressed 1 in this call, or accepted on the form a text that covers calls (version 3+).
    const autorizado = aceitouAgora || (!pediuSair && !!(await um(`select 1 from consentimentos where empresa_id = $1 and contato_id = $2 and canal = 'whatsapp' and revogado_em is null and origem <> 'ligacao' and versao >= 3`, [empresa.id, contato.id], db)));
    const jaRespondidoHoje = !!(await um(`select 1 from ligacoes where empresa_id = $1 and contato_id = $2 and resultado = 'mensagem_agendada' and recebida_em > now() - interval '24 hours'`, [empresa.id, contato.id], db));
    const muitasNaHora = (await um<{ n: number }>(`select count(*)::int as n from ligacoes where empresa_id = $1 and resultado = 'mensagem_agendada' and criado_em > now() - interval '1 hour'`, [empresa.id], db))!.n >= MAX_RESPOSTAS_HORA;
    const resultado: ResultadoLigacao = anterior
      ? 'repetida'
      : !empresa.config.regras.ligacao_auto
        ? 'desligado'
        : !celular(tel)
          ? 'telefone_fixo'
          : pediuSair
            ? 'pediu_sair'
            : !autorizado
              ? 'sem_autorizacao'
              : jaRespondidoHoje
                ? 'ja_respondida_hoje'
                : muitasNaHora
                  ? 'limite'
                  : 'mensagem_agendada';

    const lig = (await um<{ id: string }>(
      `insert into ligacoes (empresa_id, id_externo, telefone, contato_id, oportunidade_id, recebida_em, resultado, simulada) values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
      [empresa.id, idExterno, tel, contato.id, op.id, quando, resultado, !!l.simulada],
      db,
    ))!;
    await registrar(db, empresa.id, { oportunidadeId: op.id, contatoId: contato.id, ator: { tipo: 'visitante' }, tipo: 'ligacao_nao_atendida', dados: { resultado, simulada: !!l.simulada, nova } });
    if (resultado === 'repetida') return { resultado, oportunidadeId: op.id };

    await criarTarefa(db, empresa.id, {
      oportunidadeId: op.id,
      tipo: 'retornar_ligacao',
      titulo: `Retornar a ligação: ${contato.nome || formatarTelefone(tel)}`,
      detalhe: `Ligou de ${formatarTelefone(tel)} e ninguém atendeu.${resultado === 'mensagem_agendada' ? ' A mensagem de retorno foi para o WhatsApp.' : resultado === 'sem_autorizacao' ? ' Sem autorização para WhatsApp: retorne por ligação.' : resultado === 'telefone_fixo' ? ' É telefone fixo: retorne por ligação.' : resultado === 'pediu_sair' ? ' Esta pessoa tinha pedido para não receber mensagens: retorne por ligação e confirme se ela quer voltar a receber.' : resultado === 'ja_respondida_hoje' ? ' Já recebeu uma mensagem de retorno nas últimas 24 horas.' : resultado === 'limite' ? ' Muitas respostas automáticas nesta hora: a mensagem não foi enviada. Confira com a equipe Growlift.' : ''}`,
      prazo: new Date(Date.now() + empresa.config.regras.sla_minutos * 60_000),
      responsavelId: op.responsavel_id,
      chave: `ligacao:${lig.id}`,
    });
    if (resultado === 'mensagem_agendada') await agendar(db, empresa.id, { tipo: 'retorno_ligacao', chave: `retorno-ligacao:${lig.id}`, oportunidadeId: op.id, dados: { ligacao: lig.id } });
    await dispararFluxos(db, empresa.id, { tipo: 'ligacao_perdida' }, { id: op.id, contatoId: contato.id, etapa: op.etapa as Etapa });
    return { resultado, oportunidadeId: op.id };
  });
}

/** Text of the WhatsApp answer, inside or outside the company's hours. */
export function textoRetornoLigacao(empresa: Empresa, foraDoHorario: boolean): string {
  const r = empresa.config.regras;
  const base = foraDoHorario ? r.ligacao_texto_fora : r.ligacao_texto;
  const corpo = base
    .replace(/\{\{\s*empresa\s*\}\}/g, () => empresa.nome)
    .replace(/\{\{\s*atendente\s*\}\}/g, () => empresa.config.ia.nome || 'a equipe')
    .replace(/\{\{\s*abertura\s*\}\}/g, () => `${r.hora_inicio}h`);
  return `${corpo} Para não receber mensagens, responda SAIR.`;
}

/* ---------- Telephony service key (set by the Growlift team, like the WhatsApp number) ---------- */

export async function gerarChaveTelefonia(ctx: Ctx): Promise<string> {
  exigirAdmin(ctx);
  if (!ctx.acessoAdmin) throw new ErroDeUso('A ligação com o serviço de telefonia é configurada pela equipe Growlift.');
  const chave = `tel_${novoToken(24)}`;
  await tx(async (db) => {
    await q(
      `insert into integracoes (empresa_id, tipo, config, atualizado_por) values ($1, 'telefonia', $2, $3)
       on conflict (empresa_id, tipo) do update set config = excluded.config, atualizado_por = excluded.atualizado_por, atualizado_em = now()`,
      [ctx.empresaId, JSON.stringify({ chave_hash: hashToken(chave), final: chave.slice(-4), criada_em: new Date().toISOString() }), ctx.userId],
      db,
    );
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'integracao_alterada', dados: { integracao: 'telefonia', chave_trocada: true } });
  });
  return chave;
}

export async function telefoniaDa(empresaId: string): Promise<{ final: string; ultimo_aviso_em: string | null } | null> {
  const l = await um<{ config: { final?: string; ultimo_aviso_em?: string } }>(`select config from integracoes where empresa_id = $1 and tipo = 'telefonia'`, [empresaId]);
  return l ? { final: l.config.final ?? '', ultimo_aviso_em: l.config.ultimo_aviso_em ?? null } : null;
}

/** Which company a telephony notice belongs to, by its key (only its hash is stored). */
export async function empresaDaChaveTelefonia(chave: string): Promise<Empresa | null> {
  if (!/^tel_[A-Za-z0-9_-]{20,64}$/.test(chave)) return null;
  const l = await um<{ empresa_id: string; ultimo: string | null }>(
    `select i.empresa_id, i.config ->> 'ultimo_aviso_em' as ultimo from integracoes i join empresas e on e.id = i.empresa_id
     where e.ativa and i.tipo = 'telefonia' and i.config ->> 'chave_hash' = $1`,
    [hashToken(chave)],
  );
  if (!l) return null;
  // "Last notice" shown on the settings screen: written at most once a minute.
  if (!l.ultimo || Date.now() - new Date(l.ultimo).getTime() > 60_000) {
    await q(`update integracoes set config = config || jsonb_build_object('ultimo_aviso_em', now()) where empresa_id = $1 and tipo = 'telefonia'`, [l.empresa_id]);
  }
  return empresaPorId(l.empresa_id);
}

/** Demonstration only: what happens when a call is missed, without any telephony service. */
export async function simularLigacaoPerdida(ctx: Ctx, telefone: string, aceite: boolean) {
  exigirAdmin(ctx);
  if (ambiente() === 'producao') throw new ErroDeUso('A simulação de ligação não existe em produção.');
  const { canal } = await canalDa(ctx.empresaId);
  if (!canal?.simulado) throw new ErroDeUso('A simulação só existe enquanto o WhatsApp oficial não está ligado.');
  const empresa = (await empresaPorId(ctx.empresaId))!;
  return registrarLigacaoPerdida(empresa, { telefone, idExterno: `sim_${novoToken(9)}`, aceiteWhatsapp: aceite, simulada: true });
}

/** Last missed calls of the company, for the settings screen. */
export async function ultimasLigacoes(ctx: Ctx) {
  return q<{ telefone: string; recebida_em: Date; resultado: ResultadoLigacao; simulada: boolean; oportunidade_id: string; nome: string }>(
    `select l.telefone, l.recebida_em, l.resultado, l.simulada, l.oportunidade_id, c.nome from ligacoes l join contatos c on c.id = l.contato_id
     where l.empresa_id = $1 order by l.recebida_em desc limit 10`,
    [ctx.empresaId],
  );
}

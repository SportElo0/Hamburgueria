import { z } from 'zod';
import { PREFERENCIAS, TEXTO_CONSENTIMENTO_WHATSAPP, VERSAO_CONSENTIMENTO, normalizarTelefone, type Campo } from './config';
import { criarTarefa, dentroDoLimite, registrar } from './contexto';
import { tx, um, q, type Db } from './db';
import { membroAtivo, type Empresa } from './empresas';
import { ErroDeUso } from './erros';
import { agendar } from './fila';
import { dispararFluxos } from './fluxos';

/** Validation error with one message per field, so the form can show where to fix. */
export class ErroDeFormulario extends ErroDeUso {
  constructor(public campos: Record<string, string>) {
    super('Confira os campos destacados.', 422);
  }
}

const Base = z.object({
  nome: z.string().trim().min(2, 'Escreva seu nome.').max(80),
  telefone: z.string().trim().max(30),
  cidade: z.string().trim().min(2, 'Escreva sua cidade.').max(80),
  necessidade: z.string().trim().min(5, 'Conte em poucas palavras o que você precisa.').max(1000),
  preferencia_contato: z.enum(PREFERENCIAS, 'Escolha como prefere o contato.'),
  aceite_whatsapp: z.boolean().default(false),
  chave_idempotencia: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  extras: z.record(z.string(), z.string().max(200)).default({}),
  campanha: z.record(z.string(), z.string().max(120)).default({}),
  /** Honeypot: people never see this field, so anything in it is a robot. */
  site_url: z.string().max(200).default(''),
});
export type EntradaPedido = z.input<typeof Base>;

const CAMPANHA = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];

/** Validates the segment's extra fields against the company's own form definition. */
export function validarExtras(campos: Campo[], extras: Record<string, string>): { dados: Record<string, string | number>; erros: Record<string, string> } {
  const dados: Record<string, string | number> = {};
  const erros: Record<string, string> = {};
  for (const c of campos) {
    const v = (extras[c.id] ?? '').trim();
    if (!v) {
      if (c.obrigatorio) erros[c.id] = `Preencha: ${c.rotulo.toLowerCase()}.`;
      continue;
    }
    if (c.tipo === 'opcoes') {
      if (!c.opcoes.includes(v)) erros[c.id] = 'Escolha uma das opções.';
      else dados[c.id] = v;
    } else if (c.tipo === 'numero') {
      const n = Number(v.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, ''));
      if (!Number.isFinite(n) || n < 0 || n > 10_000_000) erros[c.id] = 'Escreva só o valor aproximado, em números.';
      else dados[c.id] = Math.round(n);
    } else dados[c.id] = v.slice(0, 200);
  }
  return { dados, erros };
}

export interface MetaPedido {
  origem: 'site' | 'formulario_incorporado' | 'api';
  /** Hash of the visitor's address, only for abuse limits (never stored with the request). */
  ipHash: string;
}

export interface PedidoSalvo {
  oportunidadeId: string;
  contatoId: string;
  /** The same submission arrived again: nothing new was created. */
  repetido: boolean;
}

/**
 * Receives a quote request from a public form. Everything happens in one transaction:
 * contact (deduplicated inside the company), opportunity, consent, task, notification and the alert job.
 * The caller only confirms to the visitor after this returns.
 */
export async function receberPedido(empresa: Empresa, entrada: unknown, meta: MetaPedido): Promise<PedidoSalvo | { descartado: true }> {
  const r = Base.safeParse(entrada);
  const erros: Record<string, string> = {};
  if (!r.success) for (const i of r.error.issues) erros[String(i.path[0])] ??= i.message;
  const e = r.success ? r.data : null;
  const telefone = normalizarTelefone(e?.telefone ?? String((entrada as Record<string, unknown>)?.telefone ?? ''));
  if (!telefone) erros.telefone = 'Escreva o telefone com DDD. Exemplo: (11) 91234-5678.';
  const extras = validarExtras(empresa.config.campos, e?.extras ?? {});
  Object.assign(erros, extras.erros);
  if (!e || !telefone || Object.keys(erros).length) throw new ErroDeFormulario(erros);
  if (e.site_url) return { descartado: true };

  if (!(await dentroDoLimite(`pedido:ip:${empresa.id}:${meta.ipHash}`, 5, 600)) || !(await dentroDoLimite(`pedido:empresa:${empresa.id}`, 300, 3600))) {
    throw new ErroDeUso('Muitos envios em pouco tempo. Aguarde alguns minutos e tente de novo.', 429);
  }

  const campanha = Object.fromEntries(Object.entries(e.campanha).filter(([k, v]) => CAMPANHA.includes(k) && v));
  return tx(async (db) => {
    // Serialize submissions of the same key and of the same phone inside this company.
    await db.query('select pg_advisory_xact_lock(hashtext($1)), pg_advisory_xact_lock(hashtext($2))', [`${empresa.id}:k:${e.chave_idempotencia}`, `${empresa.id}:t:${telefone}`]);
    const ja = await um<{ oportunidade_id: string; contato_id: string }>(
      `select p.oportunidade_id, o.contato_id from pedidos p join oportunidades o on o.id = p.oportunidade_id
       where p.empresa_id = $1 and p.chave_idempotencia = $2`,
      [empresa.id, e.chave_idempotencia],
      db,
    );
    if (ja) return { oportunidadeId: ja.oportunidade_id, contatoId: ja.contato_id, repetido: true };

    // The form is not proof of identity: an existing contact only gets its empty fields filled.
    const contato = await um<{ id: string }>(
      `insert into contatos (empresa_id, nome, telefone, cidade, preferencia_contato, dados) values ($1, $2, $3, $4, $5, $6)
       on conflict (empresa_id, telefone) do update set
         nome = case when contatos.nome = '' then excluded.nome else contatos.nome end,
         cidade = case when contatos.cidade = '' then excluded.cidade else contatos.cidade end,
         preferencia_contato = excluded.preferencia_contato,
         dados = excluded.dados || contatos.dados
       returning id`,
      [empresa.id, e.nome, telefone, e.cidade, e.preferencia_contato, JSON.stringify(extras.dados)],
      db,
    );
    const contatoId = contato!.id;

    if (e.aceite_whatsapp) {
      await q(`insert into consentimentos (empresa_id, contato_id, canal, texto, origem, versao) values ($1, $2, 'whatsapp', $3, $4, $5)`, [empresa.id, contatoId, TEXTO_CONSENTIMENTO_WHATSAPP(empresa.nome), meta.origem, VERSAO_CONSENTIMENTO], db);
    }

    // Same person, same need, a moment ago (double click, back button): do not open a second opportunity.
    const recente = await um<{ id: string }>(
      `select id from oportunidades where empresa_id = $1 and contato_id = $2 and etapa not in ('ganho', 'perdido')
         and necessidade = $3 and entrada_em > now() - interval '10 minutes' order by entrada_em desc limit 1`,
      [empresa.id, contatoId, e.necessidade],
      db,
    );
    if (recente) {
      await q('insert into pedidos (empresa_id, chave_idempotencia, oportunidade_id, origem) values ($1, $2, $3, $4)', [empresa.id, e.chave_idempotencia, recente.id, meta.origem], db);
      return { oportunidadeId: recente.id, contatoId, repetido: true };
    }

    const responsavel = empresa.responsavel_padrao && (await membroAtivo(db, empresa.id, empresa.responsavel_padrao)) ? empresa.responsavel_padrao : null;
    const op = await um<{ id: string }>(
      `insert into oportunidades (empresa_id, contato_id, necessidade, origem, campanha, responsavel_id) values ($1, $2, $3, $4, $5, $6) returning id`,
      [empresa.id, contatoId, e.necessidade, meta.origem, JSON.stringify(campanha), responsavel],
      db,
    );
    const oportunidadeId = op!.id;
    await q('insert into pedidos (empresa_id, chave_idempotencia, oportunidade_id, origem) values ($1, $2, $3, $4)', [empresa.id, e.chave_idempotencia, oportunidadeId, meta.origem], db);
    await registrar(db, empresa.id, {
      oportunidadeId,
      contatoId,
      ator: { tipo: 'visitante' },
      tipo: 'pedido_recebido',
      dados: { origem: meta.origem, campanha, nome: e.nome, cidade: e.cidade, preferencia: e.preferencia_contato, aceite_whatsapp: e.aceite_whatsapp, ...extras.dados },
    });
    await abrirAtendimento(db, empresa, oportunidadeId, responsavel, `${e.nome} (${e.cidade}) pediu orçamento`);
    // Automatic confirmation by WhatsApp, only with the visitor's consent (checked again when it is sent).
    if (e.aceite_whatsapp) await agendar(db, empresa.id, { tipo: 'confirmacao_pedido', chave: `confirmacao:${oportunidadeId}`, oportunidadeId, em: new Date(Date.now() + 5_000) });
    await dispararFluxos(db, empresa.id, { tipo: 'pedido_recebido' }, { id: oportunidadeId, contatoId, etapa: 'novo' });
    return { oportunidadeId, contatoId, repetido: false };
  });
}

/** Task for the first contact + the internal alert if nobody attends within the company's deadline. */
export async function abrirAtendimento(db: Db, empresa: Empresa, oportunidadeId: string, responsavel: string | null, titulo: string) {
  const prazo = new Date(Date.now() + empresa.config.regras.sla_minutos * 60_000);
  await criarTarefa(db, empresa.id, {
    oportunidadeId,
    tipo: 'atender_pedido',
    titulo: `Novo pedido: ${titulo}`,
    detalhe: responsavel ? '' : 'Sem responsável: está na fila da empresa.',
    prazo,
    responsavelId: responsavel,
    chave: `atender:${oportunidadeId}`,
  });
  await agendar(db, empresa.id, { tipo: 'alerta_sla', chave: `sla:${oportunidadeId}`, em: prazo, oportunidadeId, dados: {} });
}

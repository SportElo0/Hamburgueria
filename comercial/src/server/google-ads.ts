import { z } from 'zod';
import { normalizarTelefone } from './config';
import { ator, dentroDoLimite, exigirAdmin, registrar, type Ctx } from './contexto';
import { q, tx, um } from './db';
import { empresaPorId, membroAtivo, type Empresa } from './empresas';
import { ErroDeUso } from './erros';
import { dispararFluxos } from './fluxos';
import { abrirAtendimento } from './pedidos';
import { hashToken, novoToken } from './segredos';

/**
 * Lead forms of Google ads. Google Ads sends each filled form to /api/webhooks/google-ads with the key the company
 * typed in the form's webhook settings (field google_key). The lead becomes a request in the funnel, like one from
 * the site: contact, opportunity, first-contact task and the "request received" flows. Google's form does not ask
 * for WhatsApp authorization, so nothing is sent to the person automatically; the team calls or writes by hand.
 * Test leads (sent by the "Send test data" button) only mark the connection as working.
 */

export const ORIGEM_GOOGLE = 'anuncio_google';

const Lead = z.object({
  lead_id: z.string().trim().min(1).max(200),
  google_key: z.string().max(200),
  is_test: z.boolean().optional(),
  campaign_id: z.union([z.number(), z.string().max(40)]).optional(),
  form_id: z.union([z.number(), z.string().max(40)]).optional(),
  gcl_id: z.string().max(200).optional(),
  user_column_data: z
    .array(z.object({ column_id: z.string().max(80).optional(), column_name: z.string().max(200).optional(), string_value: z.string().max(1000).optional() }))
    .max(60)
    .default([]),
});

export type ResultadoLead = { resultado: 'criado' | 'repetido' | 'teste'; oportunidadeId?: string };

/** Reads what the person filled in: name, phone, city, e-mail and the company's own questions. */
export function lerLead(colunas: z.infer<typeof Lead>['user_column_data']) {
  const v = (id: string) => colunas.find((c) => c.column_id === id)?.string_value?.trim() ?? '';
  const nome = (v('FULL_NAME') || [v('FIRST_NAME'), v('LAST_NAME')].filter(Boolean).join(' ')).slice(0, 80);
  const conhecidos = new Set(['FULL_NAME', 'FIRST_NAME', 'LAST_NAME', 'PHONE_NUMBER', 'CITY', 'EMAIL']);
  const perguntas = colunas
    .filter((c) => !conhecidos.has(c.column_id ?? '') && c.string_value?.trim())
    .map((c) => `${(c.column_name || c.column_id || 'Pergunta').trim().slice(0, 120)}: ${c.string_value!.trim().slice(0, 300)}`);
  return {
    nome,
    telefone: normalizarTelefone(v('PHONE_NUMBER')),
    cidade: v('CITY').slice(0, 80),
    email: v('EMAIL').slice(0, 120),
    necessidade: (perguntas.join('\n') || 'Preencheu o formulário do anúncio do Google.').slice(0, 1000),
  };
}

/** Which company a lead belongs to, by its key (only the hash is stored). */
export async function empresaDaChaveGoogle(chave: string): Promise<Empresa | null> {
  if (!/^gads_[A-Za-z0-9_-]{20,64}$/.test(chave)) return null;
  const l = await um<{ empresa_id: string }>(
    `select i.empresa_id from integracoes i join empresas e on e.id = i.empresa_id where e.ativa and i.tipo = 'google_ads' and i.config ->> 'chave_hash' = $1`,
    [hashToken(chave)],
  );
  return l ? empresaPorId(l.empresa_id) : null;
}

export async function receberLeadGoogle(empresa: Empresa, entrada: unknown): Promise<ResultadoLead> {
  const r = Lead.safeParse(entrada);
  if (!r.success) throw new ErroDeUso('Formato do lead inválido.', 400);
  const l = r.data;
  const marcar = (campo: 'ultimo_teste_em' | 'ultimo_lead_em') =>
    q(`update integracoes set config = config || jsonb_build_object($2::text, now()) where empresa_id = $1 and tipo = 'google_ads'`, [empresa.id, campo]);
  if (l.is_test) {
    await marcar('ultimo_teste_em');
    return { resultado: 'teste' };
  }
  const d = lerLead(l.user_column_data);
  if (!d.telefone) throw new ErroDeUso('O lead chegou sem telefone válido. Inclua o campo de telefone no formulário do anúncio.', 422);
  const chave = `google:${l.lead_id}`;
  // A repeated delivery answers before counting against the limit.
  const ja = await um<{ oportunidade_id: string }>('select oportunidade_id from pedidos where empresa_id = $1 and chave_idempotencia = $2', [empresa.id, chave]);
  if (ja) return { resultado: 'repetido', oportunidadeId: ja.oportunidade_id };
  if (!(await dentroDoLimite(`google:empresa:${empresa.id}`, 300, 3600))) throw new ErroDeUso('Muitos leads em pouco tempo. Tente de novo mais tarde.', 503);

  const campanha: Record<string, string> = { utm_source: 'google', utm_medium: 'formulario_anuncio' };
  if (l.campaign_id !== undefined && String(l.campaign_id).trim()) campanha.utm_campaign = String(l.campaign_id).trim();
  if (l.gcl_id?.trim()) campanha.gclid = l.gcl_id.trim();

  const res = await tx(async (db) => {
    await db.query('select pg_advisory_xact_lock(hashtext($1)), pg_advisory_xact_lock(hashtext($2))', [`${empresa.id}:k:${chave}`, `${empresa.id}:t:${d.telefone}`]);
    const repetido = await um<{ oportunidade_id: string }>('select oportunidade_id from pedidos where empresa_id = $1 and chave_idempotencia = $2', [empresa.id, chave], db);
    if (repetido) return { resultado: 'repetido' as const, oportunidadeId: repetido.oportunidade_id };

    // Like the site form, a lead is not proof of identity: an existing contact only gets its empty fields filled.
    const contato = (await um<{ id: string }>(
      `insert into contatos (empresa_id, nome, telefone, cidade, dados) values ($1, $2, $3, $4, $5)
       on conflict (empresa_id, telefone) do update set
         nome = case when contatos.nome = '' then excluded.nome else contatos.nome end,
         cidade = case when contatos.cidade = '' then excluded.cidade else contatos.cidade end,
         dados = excluded.dados || contatos.dados
       returning id`,
      [empresa.id, d.nome, d.telefone, d.cidade, JSON.stringify(d.email ? { 'E-mail': d.email } : {})],
      db,
    ))!;
    const responsavel = empresa.responsavel_padrao && (await membroAtivo(db, empresa.id, empresa.responsavel_padrao)) ? empresa.responsavel_padrao : null;
    const op = (await um<{ id: string }>(
      `insert into oportunidades (empresa_id, contato_id, necessidade, origem, campanha, responsavel_id) values ($1, $2, $3, $4, $5, $6) returning id`,
      [empresa.id, contato.id, d.necessidade, ORIGEM_GOOGLE, JSON.stringify(campanha), responsavel],
      db,
    ))!;
    await q('insert into pedidos (empresa_id, chave_idempotencia, oportunidade_id, origem) values ($1, $2, $3, $4)', [empresa.id, chave, op.id, ORIGEM_GOOGLE], db);
    await registrar(db, empresa.id, {
      oportunidadeId: op.id,
      contatoId: contato.id,
      ator: { tipo: 'visitante' },
      tipo: 'pedido_recebido',
      dados: { origem: ORIGEM_GOOGLE, campanha, nome: d.nome, cidade: d.cidade, aceite_whatsapp: false },
    });
    await abrirAtendimento(db, empresa, op.id, responsavel, `${d.nome || 'Lead do Google'}${d.cidade ? ` (${d.cidade})` : ''} preencheu o formulário do anúncio`);
    await dispararFluxos(db, empresa.id, { tipo: 'pedido_recebido' }, { id: op.id, contatoId: contato.id, etapa: 'novo' });
    return { resultado: 'criado' as const, oportunidadeId: op.id };
  });
  if (res.resultado === 'criado') await marcar('ultimo_lead_em');
  return res;
}

/* ---------- The company's key (the admin creates it and pastes it in Google Ads) ---------- */

export async function gerarChaveGoogle(ctx: Ctx): Promise<string> {
  exigirAdmin(ctx);
  const chave = `gads_${novoToken(24)}`;
  await tx(async (db) => {
    await q(
      `insert into integracoes (empresa_id, tipo, config, atualizado_por) values ($1, 'google_ads', $2, $3)
       on conflict (empresa_id, tipo) do update set config = excluded.config, atualizado_por = excluded.atualizado_por, atualizado_em = now()`,
      [ctx.empresaId, JSON.stringify({ chave_hash: hashToken(chave), final: chave.slice(-4), criada_em: new Date().toISOString() }), ctx.userId],
      db,
    );
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'integracao_alterada', dados: { integracao: 'google_ads', chave_trocada: true } });
  });
  return chave;
}

export async function googleAdsDa(empresaId: string): Promise<{ final: string; ultimo_teste_em: string | null; ultimo_lead_em: string | null } | null> {
  const l = await um<{ config: { final?: string; ultimo_teste_em?: string; ultimo_lead_em?: string } }>(`select config from integracoes where empresa_id = $1 and tipo = 'google_ads'`, [empresaId]);
  return l ? { final: l.config.final ?? '', ultimo_teste_em: l.config.ultimo_teste_em ?? null, ultimo_lead_em: l.config.ultimo_lead_em ?? null } : null;
}

import { z } from 'zod';
import { canalSimulado } from './canais/simulador';
import type { CanalWhatsApp } from './canais/tipos';
import { canalCloud } from './canais/whatsapp-cloud';
import { ambiente } from './config';
import { ator, exigirAdmin, exigirNaoVisitante, registrar, type Ctx } from './contexto';
import { q, tx, um, type Db } from './db';
import { ErroDeUso } from './erros';
import { cifrar, decifrar, mascarar } from './segredos';

/** Meta template names: lowercase letters, digits and underscores. */
const NOME_MODELO = /^[a-z0-9_]{1,512}$/;
/** {{1}}, {{2}}... in the approved text, numbered from 1 with no gaps. */
export function variaveisDoTexto(texto: string): number {
  const nums = [...texto.matchAll(/\{\{\s*(\d{1,6})\s*\}\}/g)].map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) : 0;
}
const MAX_CAMPOS = 10;

/**
 * A template approved by Meta that a person of the team fills in and sends from the panel (a quote, the values of a
 * booking). The text must be exactly the approved one; each {{n}} gets a field with a name the team understands.
 */
export const ModeloEquipe = z
  .object({
    nome: z.string().trim().toLowerCase().regex(NOME_MODELO, 'O nome do modelo na Meta tem só letras minúsculas, números e _ (ex.: orcamento_reserva).'),
    titulo: z.string().trim().min(2, 'Dê um título para a equipe reconhecer o modelo.').max(60),
    texto: z.string().trim().min(5, 'Cole o texto aprovado do modelo.').max(1024, 'O WhatsApp aceita até 1.024 caracteres no texto do modelo.'),
    campos: z.array(z.string().trim().min(1).max(40)).max(10, 'No máximo 10 campos por modelo.'),
  })
  .superRefine((m, c) => {
    // Checked before any loop: a huge {{n}} must never make the server count up to it.
    const numeros = [...m.texto.matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map((x) => x[1]);
    if (numeros.some((x) => x.length > 2 || Number(x) < 1 || Number(x) > MAX_CAMPOS)) {
      c.addIssue({ code: 'custom', message: `Os campos vão de {{1}} a {{${MAX_CAMPOS}}}.` });
      return;
    }
    if (!/\bSAIR\b/.test(m.texto)) c.addIssue({ code: 'custom', message: 'O texto precisa dizer como parar de receber (ex.: “Para não receber mensagens, responda SAIR.”).' });
    const n = variaveisDoTexto(m.texto);
    for (let i = 1; i <= n; i++) if (!new RegExp(`\\{\\{\\s*${i}\\s*\\}\\}`).test(m.texto)) c.addIssue({ code: 'custom', message: `O texto pula o campo {{${i}}}: numere os campos 1, 2, 3... sem buracos.` });
    if (m.campos.length !== n) c.addIssue({ code: 'custom', message: `O texto tem ${n} ${n === 1 ? 'campo' : 'campos'} ({{1}}${n > 1 ? ` a {{${n}}}` : ''}) e você deu nome a ${m.campos.length}. Escreva um nome por linha, na ordem.` });
  });
export type ModeloEquipe = z.infer<typeof ModeloEquipe>;

const ConfigWhatsApp = z.object({
  /** simulador: nothing leaves the platform. oficial: Meta's Cloud API with the company's own number. */
  modo: z.enum(['simulador', 'oficial']).default('simulador'),
  phone_number_id: z.string().trim().regex(/^\d{0,30}$/, 'O ID do número tem só dígitos.').default(''),
  waba_id: z.string().trim().regex(/^\d{0,30}$/, 'O ID da conta tem só dígitos.').default(''),
  /** Names of templates already approved by Meta for each business-initiated message. Empty = that message becomes a human task. */
  modelo_confirmacao: z.string().trim().max(80).default(''),
  modelo_retorno: z.string().trim().max(80).default(''),
  modelo_avaliacao: z.string().trim().max(80).default(''),
  modelo_manutencao: z.string().trim().max(80).default(''),
  modelo_ligacao: z.string().trim().max(80).default(''),
  modelo_lembrete_visita: z.string().trim().max(80).default(''),
  idioma_modelos: z.string().trim().max(10).default('pt_BR'),
  /** Templates a person sends from the panel (saved on their own screen, kept when the rest is saved). */
  modelos_equipe: z.array(ModeloEquipe).max(15).default([]),
});
export type ConfigWhatsApp = z.infer<typeof ConfigWhatsApp>;

export interface IntegracaoWhatsApp {
  config: ConfigWhatsApp;
  /** Never the token itself: only whether one is stored and its last characters. */
  token: string;
  pronta: boolean;
}

async function linha(empresaId: string, db?: Db) {
  return um<{ config: unknown; segredo_cifrado: string | null }>(`select config, segredo_cifrado from integracoes where empresa_id = $1 and tipo = 'whatsapp'`, [empresaId], db);
}

export async function integracaoWhatsApp(empresaId: string): Promise<IntegracaoWhatsApp> {
  const l = await linha(empresaId);
  const config = ConfigWhatsApp.parse(ConfigWhatsApp.safeParse(l?.config ?? {}).data ?? {});
  const token = decifrar(l?.segredo_cifrado ?? null).access_token;
  return { config, token: mascarar(token), pronta: config.modo === 'oficial' && !!config.phone_number_id && !!token && !!process.env.WHATSAPP_APP_SECRET };
}

/** Saves the channel settings. The access token is encrypted; leaving it blank keeps the stored one. */
export async function salvarWhatsApp(ctx: Ctx, entrada: unknown, novoToken?: string) {
  exigirAdmin(ctx);
  exigirNaoVisitante(ctx);
  const r = ConfigWhatsApp.safeParse(entrada);
  if (!r.success) throw new ErroDeUso(r.error.issues[0]?.message ?? 'Configuração inválida.');
  await tx(async (db) => {
    const atual = await linha(ctx.empresaId, db);
    const antes = ConfigWhatsApp.safeParse(atual?.config ?? {}).data;
    // Which number a company owns is a fact only the Growlift team can establish (against the company's Meta account).
    if (!ctx.acessoAdmin && (r.data.phone_number_id !== (antes?.phone_number_id ?? '') || r.data.waba_id !== (antes?.waba_id ?? '') || novoToken?.trim())) {
      throw new ErroDeUso('O número e o token do WhatsApp são configurados pela equipe Growlift.');
    }
    // The team's templates are edited on their own form: this one never drops them.
    r.data.modelos_equipe = antes?.modelos_equipe ?? [];
    const segredo = novoToken?.trim() ? cifrar({ access_token: novoToken.trim() }) : atual?.segredo_cifrado ?? null;
    if (r.data.phone_number_id && (await um(`select 1 from integracoes where tipo = 'whatsapp' and config ->> 'phone_number_id' = $1 and empresa_id <> $2`, [r.data.phone_number_id, ctx.empresaId], db))) {
      throw new ErroDeUso('Este número já está ligado a outra empresa.');
    }
    await q(
      `insert into integracoes (empresa_id, tipo, config, segredo_cifrado, atualizado_por) values ($1, 'whatsapp', $2, $3, $4)
       on conflict (empresa_id, tipo) do update set config = excluded.config, segredo_cifrado = excluded.segredo_cifrado, atualizado_por = excluded.atualizado_por, atualizado_em = now()`,
      [ctx.empresaId, JSON.stringify(r.data), segredo, ctx.userId],
      db,
    );
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'integracao_alterada', dados: { integracao: 'whatsapp', modo: r.data.modo, token_trocado: !!novoToken?.trim() } });
  });
}

/** Adds or replaces (same name) a template the team sends from the panel. Company admins manage their own list. */
export async function salvarModeloEquipe(ctx: Ctx, entrada: unknown): Promise<ModeloEquipe> {
  exigirAdmin(ctx);
  exigirNaoVisitante(ctx);
  const r = ModeloEquipe.safeParse(entrada);
  if (!r.success) throw new ErroDeUso(r.error.issues[0]?.message ?? 'Modelo inválido.');
  await tx(async (db) => {
    const atual = await um<{ config: unknown }>(`select config from integracoes where empresa_id = $1 and tipo = 'whatsapp' for update`, [ctx.empresaId], db);
    const config = ConfigWhatsApp.parse(ConfigWhatsApp.safeParse(atual?.config ?? {}).data ?? {});
    const outros = config.modelos_equipe.filter((m) => m.nome !== r.data.nome);
    if (outros.length >= 15) throw new ErroDeUso('No máximo 15 modelos. Remova um que não usa mais.');
    config.modelos_equipe = [...outros, r.data];
    await q(
      `insert into integracoes (empresa_id, tipo, config, atualizado_por) values ($1, 'whatsapp', $2, $3)
       on conflict (empresa_id, tipo) do update set config = excluded.config, atualizado_por = excluded.atualizado_por, atualizado_em = now()`,
      [ctx.empresaId, JSON.stringify(config), ctx.userId],
      db,
    );
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'modelo_equipe_salvo', dados: { modelo: r.data.nome } });
  });
  return r.data;
}

export async function removerModeloEquipe(ctx: Ctx, nome: string): Promise<void> {
  exigirAdmin(ctx);
  exigirNaoVisitante(ctx);
  await tx(async (db) => {
    const atual = await um<{ config: unknown }>(`select config from integracoes where empresa_id = $1 and tipo = 'whatsapp' for update`, [ctx.empresaId], db);
    if (!atual) return;
    const config = ConfigWhatsApp.parse(ConfigWhatsApp.safeParse(atual.config).data ?? {});
    config.modelos_equipe = config.modelos_equipe.filter((m) => m.nome !== nome);
    await q(`update integracoes set config = $2, atualizado_por = $3, atualizado_em = now() where empresa_id = $1 and tipo = 'whatsapp'`, [ctx.empresaId, JSON.stringify(config), ctx.userId], db);
    await registrar(db, ctx.empresaId, { ator: ator(ctx), tipo: 'modelo_equipe_removido', dados: { modelo: nome } });
  });
}

/** The channel a company sends through. Production never falls back to the simulator silently. */
export async function canalDa(empresaId: string): Promise<{ canal: CanalWhatsApp | null; config: ConfigWhatsApp; motivo?: string }> {
  const l = await linha(empresaId);
  const config = ConfigWhatsApp.parse(ConfigWhatsApp.safeParse(l?.config ?? {}).data ?? {});
  if (config.modo === 'oficial') {
    const token = decifrar(l?.segredo_cifrado ?? null).access_token;
    if (!config.phone_number_id || !token) return { canal: null, config, motivo: 'WhatsApp oficial sem número ou token configurado.' };
    return { canal: canalCloud({ phoneNumberId: config.phone_number_id, accessToken: token }), config };
  }
  if (ambiente() === 'producao') return { canal: null, config, motivo: 'WhatsApp não configurado (em produção o simulador fica desligado).' };
  return { canal: canalSimulado(), config };
}

/** Which company owns the phone number a webhook was addressed to. */
export async function empresaDoNumero(phoneNumberId: string): Promise<string | null> {
  const l = await um<{ empresa_id: string }>(
    `select i.empresa_id from integracoes i join empresas e on e.id = i.empresa_id
     where i.tipo = 'whatsapp' and i.config ->> 'phone_number_id' = $1 and i.config ->> 'modo' = 'oficial' and e.ativa`,
    [phoneNumberId],
  );
  return l?.empresa_id ?? null;
}

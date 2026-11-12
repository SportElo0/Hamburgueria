import { z } from 'zod';
import { canalSimulado } from './canais/simulador';
import type { CanalWhatsApp } from './canais/tipos';
import { canalCloud } from './canais/whatsapp-cloud';
import { ambiente } from './config';
import { ator, exigirAdmin, registrar, type Ctx } from './contexto';
import { q, tx, um, type Db } from './db';
import { ErroDeUso } from './erros';
import { cifrar, decifrar, mascarar } from './segredos';

const ConfigWhatsApp = z.object({
  /** simulador: nothing leaves the platform. oficial: Meta's Cloud API with the company's own number. */
  modo: z.enum(['simulador', 'oficial']).default('simulador'),
  phone_number_id: z.string().trim().regex(/^\d{0,30}$/, 'O ID do número tem só dígitos.').default(''),
  waba_id: z.string().trim().regex(/^\d{0,30}$/, 'O ID da conta tem só dígitos.').default(''),
  /** Names of templates already approved by Meta for each business-initiated message. Empty = that message becomes a human task. */
  modelo_confirmacao: z.string().trim().max(80).default(''),
  modelo_retorno: z.string().trim().max(80).default(''),
  modelo_avaliacao: z.string().trim().max(80).default(''),
  idioma_modelos: z.string().trim().max(10).default('pt_BR'),
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
  const r = ConfigWhatsApp.safeParse(entrada);
  if (!r.success) throw new ErroDeUso(r.error.issues[0]?.message ?? 'Configuração inválida.');
  await tx(async (db) => {
    const atual = await linha(ctx.empresaId, db);
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

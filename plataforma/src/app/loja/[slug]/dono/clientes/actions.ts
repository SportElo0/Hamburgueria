'use server';

import { z } from 'zod';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { isSlug } from '@/lib/slug';
import { getDraft } from '@/lib/stores';
import { take, dayWindow } from '@/lib/limits';
import { celularBR, MAX_IMPORTADOS } from '@/lib/importados';
import { TEXTO_ACEITE, apagarImportacao, escreverMensagem, marcarEnviado, saveImportacao, type ResultadoIA } from '@/lib/importados-servidor';

export interface Resultado {
  ok: boolean;
  error?: string;
}

const Cliente = z.object({
  phone: z.string().regex(/^[1-9]{2}9\d{8}$/),
  name: z.string().max(60),
  orders: z.number().int().min(0).max(100000),
  inactiveDays: z.number().int().min(0).max(36500),
});
const Payload = z.object({
  fonte: z.enum(['Anota Aí', 'Planilha']),
  aceite: z.literal(true),
  clientes: z.array(Cliente).min(1).max(MAX_IMPORTADOS),
});

/** Saves the list the owner read from the spreadsheet in the browser (only the columns we use). */
export async function importarClientesAction(slug: string, payload: unknown): Promise<Resultado & { total?: number }> {
  if (!isSlug(slug)) return { ok: false, error: 'Loja inválida.' };
  const user = await requireStoreAccess(slug, DONO);
  const parsed = Payload.safeParse(payload);
  if (!parsed.success) return { ok: false, error: 'A lista veio com dados inválidos. Confira a planilha e marque a confirmação do aceite.' };
  if (!(await take('importar-clientes', slug, 10, dayWindow()))) return { ok: false, error: 'Muitas importações hoje. Tente amanhã.' };
  // Same phone twice: keep the one with more orders (the browser already does this; never trust it).
  const byPhone = new Map<string, z.infer<typeof Cliente>>();
  for (const c of parsed.data.clientes) {
    if (celularBR(c.phone) !== c.phone) continue;
    const name = c.name.replace(/[\u0000-\u001f<>]/g, '').trim() || 'Cliente';
    const prev = byPhone.get(c.phone);
    if (!prev || c.orders > prev.orders) byPhone.set(c.phone, { ...c, name });
  }
  const now = new Date().toISOString();
  await saveImportacao(slug, {
    fonte: parsed.data.fonte,
    importadoEm: now,
    aceite: { por: user.name || user.email, em: now, texto: TEXTO_ACEITE },
    clientes: [...byPhone.values()],
  });
  return { ok: true, total: byPhone.size };
}

export async function apagarImportadosAction(slug: string): Promise<Resultado> {
  if (!isSlug(slug)) return { ok: false, error: 'Loja inválida.' };
  await requireStoreAccess(slug, DONO);
  await apagarImportacao(slug);
  return { ok: true };
}

/** The owner opened the WhatsApp link for this customer: they won't be suggested again for 30 days. */
export async function marcarEnviadoAction(slug: string, phone: string): Promise<Resultado> {
  if (!isSlug(slug) || !/^[1-9]{2}9\d{8}$/.test(phone)) return { ok: false, error: 'Telefone inválido.' };
  await requireStoreAccess(slug, DONO);
  await marcarEnviado(slug, phone);
  return { ok: true };
}

export async function escreverMensagemAction(slug: string, oferta: string): Promise<ResultadoIA> {
  if (!isSlug(slug) || typeof oferta !== 'string' || oferta.length > 300) return { ok: false, error: 'Texto inválido.' };
  await requireStoreAccess(slug, DONO);
  const draft = await getDraft(slug);
  if (!draft) return { ok: false, error: 'Loja não encontrada.' };
  return escreverMensagem(slug, draft.data.store.name, oferta);
}

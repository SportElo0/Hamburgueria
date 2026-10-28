'use server';

import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { requireUser } from '@/lib/auth';
import { isSlug } from '@/lib/slug';
import { ConflictError } from '@/lib/storage';
import { getDraft } from '@/lib/stores';
import { createDemo, saveCostSheet, setDecision } from '@/lib/inteligencia/dados';
import { DECISION_STATUSES, type DecisionStatus } from '@/lib/inteligencia/recomendacoes';

export interface ActionResult {
  ok: boolean;
  error?: string;
  etag?: string;
}

/** Decisão sobre uma recomendação (só a equipe; o dono aprova pela conversa e a equipe registra). */
export async function decideAction(slug: string, id: string, status: DecisionStatus | null, note: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!isSlug(slug) || (status !== null && !DECISION_STATUSES.includes(status))) return { ok: false, error: 'Pedido inválido.' };
  if (!(await getDraft(slug))) return { ok: false, error: 'Loja não encontrada.' };
  try {
    await setDecision(slug, id, { status, note: String(note ?? '').slice(0, 500) }, user.name || user.email);
  } catch (err) {
    console.error('decideAction', err);
    return { ok: false, error: 'Não foi possível salvar. Tente de novo.' };
  }
  revalidatePath(`/painel/inteligencia/${slug}`);
  return { ok: true };
}

export async function saveCostsAction(slug: string, sheet: unknown, etag: string | null): Promise<ActionResult> {
  const user = await requireUser();
  if (!isSlug(slug) || !(await getDraft(slug))) return { ok: false, error: 'Loja não encontrada.' };
  try {
    const saved = await saveCostSheet(slug, sheet, etag, user.name || user.email);
    revalidatePath(`/painel/inteligencia/${slug}`);
    return { ok: true, etag: saved.etag };
  } catch (err) {
    if (err instanceof ConflictError) return { ok: false, error: 'Outra pessoa salvou os custos enquanto você editava. Recarregue a página.' };
    if (err instanceof ZodError) return { ok: false, error: 'Confira os valores: há campo vazio, negativo ou grande demais.' };
    if (err instanceof Error && err.message.startsWith('A ficha')) return { ok: false, error: err.message };
    console.error('saveCostsAction', err);
    return { ok: false, error: 'Não foi possível salvar. Tente de novo.' };
  }
}

export async function createDemoAction(): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await createDemo(user.name || user.email);
  } catch (err) {
    console.error('createDemoAction', err);
    if (err instanceof Error && err.message.includes('não é a demonstração')) return { ok: false, error: err.message };
    return { ok: false, error: 'Não foi possível criar a demonstração.' };
  }
  revalidatePath('/painel/inteligencia');
  return { ok: true };
}

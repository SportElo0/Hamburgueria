'use server';

import { requireStoreAccess } from '@/lib/auth';
import { ActionError, applyAction, setOpen, setSoldOut } from '@/lib/orders';
import { OPERATOR_ACTIONS, type OperatorAction } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';

export interface OrderActionResult {
  ok: boolean;
  error?: string;
}

export async function orderAction(slug: string, id: string, action: OperatorAction, reason = ''): Promise<OrderActionResult> {
  if (!isSlug(slug) || !OPERATOR_ACTIONS.includes(action)) return { ok: false, error: 'Ação inválida.' };
  const user = await requireStoreAccess(slug);
  try {
    await applyAction(slug, id, action, user.name || user.email, reason);
    return { ok: true };
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, error: err.message };
    console.error('orderAction', err);
    return { ok: false, error: 'Não foi possível atualizar o pedido. Tente de novo.' };
  }
}

export async function setOpenAction(slug: string, open: boolean): Promise<OrderActionResult> {
  if (!isSlug(slug)) return { ok: false, error: 'Loja inválida.' };
  const user = await requireStoreAccess(slug);
  await setOpen(slug, open, user.name || user.email);
  return { ok: true };
}

export async function setSoldOutAction(slug: string, itemId: string, soldOut: boolean): Promise<OrderActionResult> {
  if (!isSlug(slug) || !/^[\w-]{1,40}$/.test(itemId)) return { ok: false, error: 'Item inválido.' };
  const user = await requireStoreAccess(slug);
  await setSoldOut(slug, itemId, soldOut, user.name || user.email);
  return { ok: true };
}

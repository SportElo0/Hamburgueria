'use server';

import { requireStoreAccess } from '@/lib/auth';
import { ActionError, applyAction, setOpen, setSoldOut } from '@/lib/orders';
import { OPERATOR_ACTIONS, PAYMENT_METHODS, type OperatorAction, type PaymentMethod } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';
import { setOptOut } from '@/lib/customers';
import { ItemEditError, addPedido, editItemByStore, listPedidos } from '@/lib/stores';
import { TableError, answerCall, closeTable, confirmTable, dismissTable } from '@/lib/mesas';

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

export async function setOptOutAction(slug: string, phone: string, out: boolean): Promise<OrderActionResult> {
  if (!isSlug(slug) || !/^\d{10,11}$/.test(phone)) return { ok: false, error: 'Telefone inválido.' };
  await requireStoreAccess(slug);
  await setOptOut(slug, phone, out);
  return { ok: true };
}

export type TableAction = 'confirmar' | 'dispensar' | 'atender-garcom' | 'atender-conta' | 'fechar';

/** The waiter's floor screen: confirm a table, free an empty one, answer a call, close the bill. */
export async function tableAction(slug: string, number: number, action: TableAction, method?: PaymentMethod): Promise<OrderActionResult> {
  if (!isSlug(slug) || !Number.isInteger(number) || number < 1 || number > 200) return { ok: false, error: 'Mesa inválida.' };
  const user = await requireStoreAccess(slug);
  const by = user.name || user.email;
  try {
    if (action === 'confirmar') await confirmTable(slug, number, by);
    else if (action === 'dispensar') await dismissTable(slug, number, by);
    else if (action === 'atender-garcom') await answerCall(slug, number, 'garcom');
    else if (action === 'atender-conta') await answerCall(slug, number, 'conta');
    else if (action === 'fechar' && method && PAYMENT_METHODS.includes(method)) await closeTable(slug, number, method, by);
    else return { ok: false, error: 'Ação inválida.' };
    return { ok: true };
  } catch (err) {
    if (err instanceof TableError) return { ok: false, error: err.message };
    console.error('tableAction', err);
    return { ok: false, error: 'Não foi possível atualizar a mesa. Tente de novo.' };
  }
}

/** The staff fixes an item's name, description or price; it goes live right away. */
export async function editItemAction(slug: string, itemId: string, input: { name: string; description: string; price: number }): Promise<OrderActionResult> {
  if (!isSlug(slug) || !/^[\w-]{1,40}$/.test(itemId)) return { ok: false, error: 'Item inválido.' };
  if (typeof input?.name !== 'string' || typeof input.description !== 'string' || typeof input.price !== 'number') return { ok: false, error: 'Dados inválidos.' };
  const user = await requireStoreAccess(slug);
  try {
    await editItemByStore(slug, itemId, { name: input.name, description: input.description, price: input.price }, user.name || user.email);
    return { ok: true };
  } catch (err) {
    if (err instanceof ItemEditError) return { ok: false, error: err.message };
    console.error('editItemAction', err);
    return { ok: false, error: 'Não foi possível salvar. Tente de novo.' };
  }
}

/** Anything the staff can't change alone (photo, new item, site text) goes to the agency as a request. */
export async function requestChangeAction(slug: string, text: string): Promise<OrderActionResult> {
  if (!isSlug(slug)) return { ok: false, error: 'Loja inválida.' };
  const texto = typeof text === 'string' ? text.trim() : '';
  if (texto.length < 5 || texto.length > 500) return { ok: false, error: 'Escreva o pedido em até 500 letras.' };
  const user = await requireStoreAccess(slug);
  const open = (await listPedidos(slug)).filter((p) => p.status === 'pendente' && p.canal === 'Painel da loja').length;
  if (open >= 20) return { ok: false, error: 'Já há 20 pedidos esperando. Fale com a Growlift pelo WhatsApp.' };
  await addPedido(slug, { texto, canal: 'Painel da loja' }, user.name || user.email);
  return { ok: true };
}

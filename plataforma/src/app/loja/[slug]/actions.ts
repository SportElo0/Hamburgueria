'use server';

import { COZINHA, DONO, SALAO, TODOS, requireStoreAccess } from '@/lib/auth';
import { ActionError, applyAction, setOpen, setSoldOut } from '@/lib/orders';
import { OrderError } from '@/lib/ordering';
import { OPERATOR_ACTIONS, PAYMENT_METHODS, type OperatorAction, type PaymentMethod } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';
import { setOptOut } from '@/lib/customers';
import { ItemEditError, addPedido, editItemByStore, listPedidos } from '@/lib/stores';
import { TableError, answerCall, closeTable, confirmTable, dismissTable, freeTable, orderByStaff, seatTable, setServico } from '@/lib/mesas';
import { QueueError, addByStaff, queueOfDay, updateQueue, type QueueAction } from '@/lib/fila';
import { markRefundDone } from '@/lib/mesa-pagamento';
import { ReservationError, cancelByStore, markArrived, markFinished, markNoShow, undoArrived } from '@/lib/reservas';

export interface OrderActionResult {
  ok: boolean;
  error?: string;
}

export async function orderAction(slug: string, id: string, action: OperatorAction, reason = ''): Promise<OrderActionResult> {
  if (!isSlug(slug) || !OPERATOR_ACTIONS.includes(action)) return { ok: false, error: 'Ação inválida.' };
  const user = await requireStoreAccess(slug, TODOS);
  // The waiter only marks a dish as delivered; accepting or refusing is the kitchen's (and the owner's).
  if (user.funcao === 'garcom' && action !== 'concluir') return { ok: false, error: 'Só a cozinha aceita ou recusa pedidos.' };
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
  const user = await requireStoreAccess(slug, COZINHA);
  await setOpen(slug, open, user.name || user.email);
  return { ok: true };
}

export async function setSoldOutAction(slug: string, itemId: string, soldOut: boolean): Promise<OrderActionResult> {
  if (!isSlug(slug) || !/^[\w-]{1,40}$/.test(itemId)) return { ok: false, error: 'Item inválido.' };
  const user = await requireStoreAccess(slug, COZINHA);
  await setSoldOut(slug, itemId, soldOut, user.name || user.email);
  return { ok: true };
}

export async function setOptOutAction(slug: string, phone: string, out: boolean): Promise<OrderActionResult> {
  if (!isSlug(slug) || !/^\d{10,11}$/.test(phone)) return { ok: false, error: 'Telefone inválido.' };
  await requireStoreAccess(slug, DONO);
  await setOptOut(slug, phone, out);
  return { ok: true };
}

export type TableAction = 'confirmar' | 'dispensar' | 'atender-garcom' | 'atender-conta' | 'fechar';

/** The waiter's floor screen: confirm a table, free an empty one, answer a call, close the bill. */
export async function tableAction(slug: string, number: number, action: TableAction, method?: PaymentMethod): Promise<OrderActionResult> {
  if (!isSlug(slug) || !Number.isInteger(number) || number < 1 || number > 200) return { ok: false, error: 'Mesa inválida.' };
  const user = await requireStoreAccess(slug, SALAO);
  const by = user.name || user.email;
  try {
    if (action === 'confirmar') await confirmTable(slug, number, by);
    else if (action === 'dispensar') await dismissTable(slug, number, by);
    else if (action === 'atender-garcom') await answerCall(slug, number, 'garcom');
    else if (action === 'atender-conta') await answerCall(slug, number, 'conta');
    else if (action === 'fechar' && method && PAYMENT_METHODS.includes(method)) {
      const closed = await closeTable(slug, number, method, by);
      if (closed.reservationId) await markFinished(slug, closed.reservationId).catch((err) => console.error('reserva concluida', err));
    }
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
  const user = await requireStoreAccess(slug, DONO);
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
  const user = await requireStoreAccess(slug, DONO);
  const open = (await listPedidos(slug)).filter((p) => p.status === 'pendente' && p.canal === 'Painel da loja').length;
  if (open >= 20) return { ok: false, error: 'Já há 20 pedidos esperando. Fale com a Growlift pelo WhatsApp.' };
  await addPedido(slug, { texto, canal: 'Painel da loja' }, user.name || user.email);
  return { ok: true };
}

/** The waiter seats people at a free table (no QR needed), optionally saying how many. */
export async function seatAction(slug: string, number: number, people: number | null): Promise<OrderActionResult> {
  if (!isSlug(slug) || !Number.isInteger(number) || number < 1 || number > 200) return { ok: false, error: 'Mesa inválida.' };
  if (people !== null && (!Number.isInteger(people) || people < 1 || people > 40)) return { ok: false, error: 'Número de pessoas inválido.' };
  await requireStoreAccess(slug, SALAO);
  try {
    await seatTable(slug, number, { people });
    return { ok: true };
  } catch (err) {
    if (err instanceof TableError) return { ok: false, error: err.message };
    console.error('seatAction', err);
    return { ok: false, error: 'Não foi possível ocupar a mesa. Tente de novo.' };
  }
}

export type ReservationAction = 'chegou' | 'nao-veio' | 'cancelar';
const RES_ID = /^r\d{8}-[a-z0-9]{10}$/;

/** Bookings on the floor map: the party arrived (goes to a table with its deposit on the bill), didn't come, or the restaurant cancels (refund). */
export async function reservationAction(slug: string, id: string, action: ReservationAction, table?: number): Promise<OrderActionResult> {
  if (!isSlug(slug) || !RES_ID.test(id)) return { ok: false, error: 'Reserva inválida.' };
  const user = await requireStoreAccess(slug, SALAO);
  const by = user.name || user.email;
  try {
    if (action === 'chegou') {
      if (!Number.isInteger(table) || table! < 1 || table! > 200) return { ok: false, error: 'Escolha a mesa.' };
      const { reservation, credit } = await markArrived(slug, id, table!, by);
      try {
        await seatTable(slug, table!, { people: reservation.people, reservationId: id, credit });
      } catch (err) {
        await undoArrived(slug, id);
        throw err;
      }
    } else if (action === 'nao-veio') await markNoShow(slug, id, by);
    else if (action === 'cancelar') await cancelByStore(slug, id, by);
    else return { ok: false, error: 'Ação inválida.' };
    return { ok: true };
  } catch (err) {
    if (err instanceof ReservationError || err instanceof TableError) return { ok: false, error: err.message };
    console.error('reservationAction', err);
    return { ok: false, error: 'Não foi possível atualizar a reserva. Tente de novo.' };
  }
}

/** Frees a table from the floor map (no QR orders on it). */
export async function freeTableAction(slug: string, number: number): Promise<OrderActionResult> {
  if (!isSlug(slug) || !Number.isInteger(number) || number < 1 || number > 200) return { ok: false, error: 'Mesa inválida.' };
  const user = await requireStoreAccess(slug, SALAO);
  try {
    await freeTable(slug, number, user.name || user.email);
    return { ok: true };
  } catch (err) {
    if (err instanceof TableError) return { ok: false, error: err.message };
    console.error('freeTableAction', err);
    return { ok: false, error: 'Não foi possível liberar a mesa. Tente de novo.' };
  }
}

const Q_ID = /^f\d{8}-[a-z0-9]{10}$/;

/** Waiting list on the floor map: call, seat at a table, didn't come, or undo a call. */
export async function queueAction(slug: string, id: string, action: QueueAction, table?: number, people?: number): Promise<OrderActionResult> {
  if (!isSlug(slug) || !Q_ID.test(id) || !['chamar', 'sentou', 'nao-veio', 'voltar'].includes(action)) return { ok: false, error: 'Ação inválida.' };
  await requireStoreAccess(slug, SALAO);
  try {
    if (action === 'sentou') {
      if (!Number.isInteger(table) || table! < 1 || table! > 200) return { ok: false, error: 'Escolha a mesa.' };
      // Still waiting? (They may have left the queue a second ago.) Only then open the table.
      const entry = (await queueOfDay(slug)).find((e) => e.id === id);
      if (!entry || (entry.status !== 'aguardando' && entry.status !== 'chamado')) return { ok: false, error: 'Essa pessoa já saiu da fila.' };
      await seatTable(slug, table!, { people: Number.isInteger(people) && people! > 0 && people! <= 40 ? people! : null });
      await updateQueue(slug, id, 'sentou', table!);
    } else await updateQueue(slug, id, action, null);
    return { ok: true };
  } catch (err) {
    if (err instanceof QueueError || err instanceof TableError) return { ok: false, error: err.message };
    console.error('queueAction', err);
    return { ok: false, error: 'Não foi possível atualizar a fila. Tente de novo.' };
  }
}

/** The till gave back a Pix the provider refused to refund: tick it off the list. */
export async function refundDoneAction(slug: string, id: string): Promise<OrderActionResult> {
  if (!isSlug(slug) || !/^m\d{8}-[a-z0-9]{10}$/.test(id)) return { ok: false, error: 'Dados inválidos.' };
  await requireStoreAccess(slug, SALAO);
  await markRefundDone(slug, id);
  return { ok: true };
}

/** The host adds someone who arrived without the QR. */
export async function addToQueueAction(slug: string, name: string, people: number): Promise<OrderActionResult> {
  if (!isSlug(slug) || typeof name !== 'string') return { ok: false, error: 'Dados inválidos.' };
  await requireStoreAccess(slug, SALAO);
  try {
    await addByStaff(slug, { name, people });
    return { ok: true };
  } catch (err) {
    if (err instanceof QueueError) return { ok: false, error: err.message };
    console.error('addToQueueAction', err);
    return { ok: false, error: 'Não foi possível adicionar. Tente de novo.' };
  }
}

/** The waiter (or the owner) orders for a table: straight to the kitchen, into the table's bill. */
export async function staffOrderAction(slug: string, number: number, items: unknown, expectedSubtotal: number | null): Promise<OrderActionResult> {
  if (!isSlug(slug) || !Number.isInteger(number) || number < 1 || number > 200) return { ok: false, error: 'Mesa inválida.' };
  if (expectedSubtotal !== null && (typeof expectedSubtotal !== 'number' || !Number.isInteger(expectedSubtotal))) return { ok: false, error: 'Dados inválidos.' };
  const user = await requireStoreAccess(slug, SALAO);
  try {
    await orderByStaff(slug, number, { items, expectedSubtotal }, user.name || user.email);
    return { ok: true };
  } catch (err) {
    if (err instanceof OrderError || err instanceof TableError) return { ok: false, error: err.message };
    console.error('staffOrderAction', err);
    return { ok: false, error: 'Não foi possível lançar o pedido. Tente de novo.' };
  }
}

/** The waiter takes the service charge off a table's bill (it is optional for the customer), or puts it back. */
export async function servicoAction(slug: string, number: number, cobrar: boolean): Promise<OrderActionResult> {
  if (!isSlug(slug) || !Number.isInteger(number) || number < 1 || number > 200 || typeof cobrar !== 'boolean') return { ok: false, error: 'Mesa inválida.' };
  await requireStoreAccess(slug, SALAO);
  try {
    await setServico(slug, number, cobrar);
    return { ok: true };
  } catch (err) {
    if (err instanceof TableError) return { ok: false, error: err.message };
    console.error('servicoAction', err);
    return { ok: false, error: 'Não foi possível mudar a taxa. Tente de novo.' };
  }
}

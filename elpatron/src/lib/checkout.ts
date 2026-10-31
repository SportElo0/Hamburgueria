// Online ordering client: sends the cart to the store panel, which prices it, takes it and, for Pix,
// creates the charge. The panel's answer is the source of truth for totals and status.
import type { CartLine } from './cart';
import { ORDERS_URL } from '@/content/live';

export type PaymentMethod = 'pix' | 'cartao' | 'dinheiro';

export interface CheckoutInput {
  lines: CartLine[];
  customer: { name: string; phone: string; email: string };
  mode: 'entrega' | 'retirada';
  address: { areaId: string; street: string; reference: string };
  payment: PaymentMethod;
  changeFor: number | null;
  note: string;
  coupon: string;
  optIn: boolean;
}

export type OrderStatus = 'aguardando-pix' | 'novo' | 'preparo' | 'saiu' | 'pronto' | 'concluido' | 'recusado' | 'expirado';

export interface TrackedOrder {
  id: string;
  number: number;
  createdAt: string;
  status: OrderStatus;
  statusLabel: string;
  history: { status: OrderStatus; at: string }[];
  mode: 'entrega' | 'retirada';
  address: { area: string; street: string; reference: string } | null;
  customerName: string;
  payment: {
    method: PaymentMethod;
    status: 'pendente' | 'pago' | 'na-entrega' | 'devolvido' | 'devolver';
    changeFor: number | null;
    paidAt: string | null;
    pix: { copyPaste: string; qrBase64: string; expiresAt: string; demo: boolean } | null;
  };
  lines: { name: string; quantity: number; unit: number; total: number; options: { group: string; label: string; price: number }[]; notes: string }[];
  subtotal: number;
  deliveryFee: number;
  feePending: boolean;
  discount: number;
  coupon: string;
  total: number;
  note: string;
  reason: string;
}

export class CheckoutError extends Error {}

const LAST_ORDER_KEY = 'elpatron-last-order';

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(20_000) });
  } catch {
    throw new CheckoutError('Sem conexão. Confira a internet e tente de novo.');
  }
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new CheckoutError(body.error || 'Não foi possível concluir agora. Tente de novo em instantes.');
  return body as T;
}

export async function placeOrder(input: CheckoutInput): Promise<{ id: string; token: string; order: TrackedOrder }> {
  const body = {
    items: input.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, selections: l.selections, notes: l.notes })),
    customer: input.customer,
    mode: input.mode,
    address: input.address,
    payment: input.payment,
    changeFor: input.changeFor,
    note: input.note,
    coupon: input.coupon,
    optIn: input.optIn,
  };
  const placed = await call<{ id: string; token: string; order: TrackedOrder }>(ORDERS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  try {
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ id: placed.id, token: placed.token, at: Date.now() }));
  } catch {}
  return placed;
}

export function fetchOrder(id: string, token: string) {
  return call<TrackedOrder>(`${ORDERS_URL}/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}`);
}

export function simulatePix(id: string, token: string) {
  return call<TrackedOrder>(`${ORDERS_URL}/${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'simular-pix', token }),
  });
}

/** Checks a coupon against the items' subtotal; the panel applies it again when the order is placed. */
export function previewCoupon(code: string, subtotal: number) {
  return call<{ code: string; discount: number; freeDelivery?: boolean; label: string }>(`${ORDERS_URL}/cupom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, subtotal }),
  });
}

/** The customer's most recent order on this device (for "acompanhar meu pedido"). */
export function lastOrder(): { id: string; token: string } | null {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) ?? 'null') as { id: string; token: string; at: number } | null;
    return v && Date.now() - v.at < 24 * 3_600_000 ? v : null;
  } catch {
    return null;
  }
}

export const trackingPath = (id: string, token: string) => `/pedido/?id=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`;

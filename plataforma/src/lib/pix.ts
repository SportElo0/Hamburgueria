import 'server-only';
import QRCode from 'qrcode';
import { storage } from './storage';
import { PIX_MINUTES, type PixCharge } from './ordering';

/**
 * Pix charges. The money always goes straight to the store's own payment account; the platform
 * only asks the provider to create the charge and later reads back whether it was paid.
 *
 *   demo         practice charge for showing the flow; nothing is charged, the tracking page can mark it paid.
 *   mercadopago  the store's Mercado Pago account (access token saved in the panel, never sent to sites).
 */

export interface StoreSecrets {
  mercadoPagoToken: string;
}

const secretsKey = (slug: string) => `lojas/${slug}/segredos.json`;

export async function getSecrets(slug: string): Promise<StoreSecrets> {
  const doc = await storage().readJSON<StoreSecrets>(secretsKey(slug));
  return { mercadoPagoToken: doc?.data.mercadoPagoToken ?? '' };
}

export async function setMercadoPagoToken(slug: string, token: string) {
  const current = await storage().readJSON<StoreSecrets>(secretsKey(slug));
  await storage().writeJSON(secretsKey(slug), { ...(current?.data ?? {}), mercadoPagoToken: token.trim() });
}

export class PixError extends Error {}

export interface ChargeRequest {
  slug: string;
  orderId: string;
  amount: number;
  description: string;
  payerName: string;
  payerEmail: string;
  /** Where Mercado Pago posts payment updates. */
  notificationUrl: string;
}

export interface PaymentCheck {
  paid: boolean;
  /** Amount the provider says was paid, in centavos. */
  amount: number;
  reference: string;
}

const MP = 'https://api.mercadopago.com/v1/payments';

async function mpFetch(token: string, url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(12_000),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new PixError(`Mercado Pago recusou a operação (${res.status}${body.message ? `: ${body.message}` : ''}).`);
  return body;
}

export async function createCharge(mode: PixCharge['provider'], req: ChargeRequest, now = new Date()): Promise<PixCharge> {
  const expiresAt = new Date(now.getTime() + PIX_MINUTES * 60_000);
  if (mode === 'demo') {
    const copyPaste = `PIX DE DEMONSTRACAO - pedido ${req.orderId} - nenhum valor e cobrado`;
    return {
      provider: 'demo',
      id: `demo-${req.orderId}`,
      copyPaste,
      qrBase64: (await QRCode.toDataURL(copyPaste, { margin: 1, width: 360 })).replace(/^data:image\/png;base64,/, ''),
      expiresAt: expiresAt.toISOString(),
    };
  }
  const { mercadoPagoToken } = await getSecrets(req.slug);
  if (!mercadoPagoToken) throw new PixError('O Pix desta loja ainda não foi configurado.');
  const body = await mpFetch(mercadoPagoToken, MP, {
    method: 'POST',
    headers: { 'X-Idempotency-Key': req.orderId },
    body: JSON.stringify({
      transaction_amount: req.amount / 100,
      description: req.description,
      payment_method_id: 'pix',
      external_reference: req.orderId,
      notification_url: req.notificationUrl,
      date_of_expiration: expiresAt.toISOString().replace('Z', '+00:00'),
      payer: { email: req.payerEmail, first_name: req.payerName.split(' ')[0] },
    }),
  });
  const data = (body.point_of_interaction as { transaction_data?: { qr_code?: string; qr_code_base64?: string } } | undefined)?.transaction_data;
  if (!body.id || !data?.qr_code) throw new PixError('Mercado Pago não devolveu o código Pix.');
  return {
    provider: 'mercadopago',
    id: String(body.id),
    copyPaste: data.qr_code,
    qrBase64: data.qr_code_base64 ?? (await QRCode.toDataURL(data.qr_code, { margin: 1, width: 360 })).replace(/^data:image\/png;base64,/, ''),
    expiresAt: expiresAt.toISOString(),
  };
}

/** Asks the provider whether a charge was paid. Never trusts what a webhook body claims. */
export async function checkCharge(slug: string, charge: PixCharge): Promise<PaymentCheck | null> {
  if (charge.provider === 'demo') return null;
  const { mercadoPagoToken } = await getSecrets(slug);
  if (!mercadoPagoToken) return null;
  const body = await mpFetch(mercadoPagoToken, `${MP}/${encodeURIComponent(charge.id)}`);
  return {
    paid: body.status === 'approved',
    amount: Math.round(Number(body.transaction_amount ?? 0) * 100),
    reference: String(body.external_reference ?? ''),
  };
}

/** Same check from a webhook, where we only have the provider's payment id. */
export async function lookupMercadoPago(slug: string, paymentId: string): Promise<PaymentCheck | null> {
  const { mercadoPagoToken } = await getSecrets(slug);
  if (!mercadoPagoToken || !/^\d{1,20}$/.test(paymentId)) return null;
  const body = await mpFetch(mercadoPagoToken, `${MP}/${paymentId}`);
  return {
    paid: body.status === 'approved',
    amount: Math.round(Number(body.transaction_amount ?? 0) * 100),
    reference: String(body.external_reference ?? ''),
  };
}

/** Full refund of a paid charge (store refused the order). Demo charges need nothing. */
export async function refundCharge(slug: string, charge: PixCharge): Promise<boolean> {
  if (charge.provider === 'demo') return true;
  const { mercadoPagoToken } = await getSecrets(slug);
  if (!mercadoPagoToken) return false;
  try {
    await mpFetch(mercadoPagoToken, `${MP}/${encodeURIComponent(charge.id)}/refunds`, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': `refund-${charge.id}` },
      body: '{}',
    });
    return true;
  } catch {
    return false;
  }
}

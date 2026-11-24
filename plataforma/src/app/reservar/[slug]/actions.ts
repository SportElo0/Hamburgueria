'use server';

import { headers } from 'next/headers';
import { clientIp } from '@/lib/limits';
import { isSlug } from '@/lib/slug';
import {
  RefundChangedError,
  ReservationError,
  availability,
  cancelByCustomer,
  createReservation,
  simulateDeposit,
  trackReservation,
  type PublicReservation,
} from '@/lib/reservas';

type Result<T> = { ok: true; data: T } | { ok: false; error: string; askAgain?: boolean };
const RES_ID = /^r\d{8}-[a-z0-9]{10}$/;

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof RefundChangedError) return { ok: false, error: err.message, askAgain: true };
    if (err instanceof ReservationError) return { ok: false, error: err.message };
    console.error('reserva', err);
    return { ok: false, error: 'Não foi possível agora. Tente de novo em instantes.' };
  }
}

export async function availabilityAction(slug: string, date: string) {
  if (!isSlug(slug) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false as const, error: 'Data inválida.' };
  return run(() => availability(slug, date));
}

export async function createReservationAction(slug: string, input: unknown): Promise<Result<{ id: string; token: string }>> {
  if (!isSlug(slug)) return { ok: false, error: 'Restaurante inválido.' };
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;
  return run(async () => {
    const { id, token } = await createReservation(slug, input, clientIp(h), origin);
    return { id, token };
  });
}

export async function trackReservationAction(slug: string, id: string, token: string): Promise<Result<PublicReservation | null>> {
  if (!isSlug(slug) || !RES_ID.test(id)) return { ok: true, data: null };
  return run(() => trackReservation(slug, id, String(token ?? '')));
}

export async function simulateDepositAction(slug: string, id: string, token: string): Promise<Result<PublicReservation | null>> {
  if (!isSlug(slug) || !RES_ID.test(id)) return { ok: true, data: null };
  return run(() => simulateDeposit(slug, id, String(token ?? '')));
}

/** `expectRefund`: what the customer's screen told them; if the deadline passed in between, they are asked again. */
export async function cancelReservationAction(slug: string, id: string, token: string, expectRefund?: boolean): Promise<Result<PublicReservation | null>> {
  if (!isSlug(slug) || !RES_ID.test(id)) return { ok: true, data: null };
  return run(() => cancelByCustomer(slug, id, String(token ?? ''), new Date(), typeof expectRefund === 'boolean' ? expectRefund : undefined));
}

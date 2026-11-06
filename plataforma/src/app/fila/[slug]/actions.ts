'use server';

import { headers } from 'next/headers';
import { clientIp } from '@/lib/limits';
import { isSlug } from '@/lib/slug';
import { QueueError, joinQueue, leaveQueue, queueStatus, type PublicEntry } from '@/lib/fila';

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
const Q_ID = /^f\d{8}-[a-z0-9]{10}$/;

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof QueueError) return { ok: false, error: err.message };
    console.error('fila', err);
    return { ok: false, error: 'Não foi possível agora. Tente de novo ou fale com a recepção.' };
  }
}

export async function joinQueueAction(slug: string, input: unknown): Promise<Result<{ id: string; token: string }>> {
  if (!isSlug(slug)) return { ok: false, error: 'Restaurante inválido.' };
  const ip = clientIp(await headers());
  return run(async () => {
    const { id, token } = await joinQueue(slug, input, ip);
    return { id, token };
  });
}

export async function queueStatusAction(slug: string, id: string, token: string): Promise<Result<PublicEntry | null>> {
  if (!isSlug(slug) || !Q_ID.test(id)) return { ok: true, data: null };
  return run(() => queueStatus(slug, id, String(token ?? '')));
}

export async function leaveQueueAction(slug: string, id: string, token: string): Promise<Result<PublicEntry | null>> {
  if (!isSlug(slug) || !Q_ID.test(id)) return { ok: true, data: null };
  return run(() => leaveQueue(slug, id, String(token ?? '')));
}

'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { AgendaError, approve, publishNow, runAgenda, unschedule } from '@/lib/agenda';
import { publicOrigin } from '@/lib/origem';

export interface AgendaActionResult {
  ok: boolean;
  error?: string;
}

const ID = /^[a-z0-9-]{3,80}$/;

async function origin() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return publicOrigin(`${proto}://${host}`);
}

async function run(fn: () => Promise<unknown>): Promise<AgendaActionResult> {
  try {
    await fn();
    revalidatePath('/painel/conteudos/agenda');
    return { ok: true };
  } catch (err) {
    if (err instanceof AgendaError) return { ok: false, error: err.message };
    console.error('agenda', err);
    return { ok: false, error: 'Não foi possível agora. Tente de novo.' };
  }
}

/** quando: "2026-11-03T15:00" in São Paulo time (no daylight saving since 2019). */
export async function approveAction(id: string, legenda: string, quando: string, ia: boolean) {
  const user = await requireUser();
  if (!ID.test(id) || typeof legenda !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(quando)) return { ok: false, error: 'Dados inválidos.' };
  return run(() => approve(id, { legenda, quando: `${quando}:00-03:00`, ia: Boolean(ia) }, user.name || user.email));
}

export async function unscheduleAction(id: string) {
  await requireUser();
  if (!ID.test(id)) return { ok: false, error: 'Dados inválidos.' };
  return run(() => unschedule(id));
}

export async function publishNowAction(id: string) {
  const user = await requireUser();
  if (!ID.test(id)) return { ok: false, error: 'Dados inválidos.' };
  return run(async () => {
    await publishNow(id, user.name || user.email);
    await runAgenda(await origin());
  });
}

/** "Verificar agora": runs the publisher (advances posts being processed by Instagram). */
export async function checkNowAction() {
  await requireUser();
  return run(async () => runAgenda(await origin()));
}

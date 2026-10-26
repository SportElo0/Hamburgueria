'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { LeadError, estimarPesquisa, executarPesquisa, revisar, verAoVivo, type Resultado } from '@/lib/oportunidades/dados';
import { PlacesError, type LugarAoVivo } from '@/lib/oportunidades/places';
import type { Estimativa, Lead } from '@/lib/oportunidades/regras';

type Resposta<T> = { ok: true; dados: T } | { ok: false; error: string };

async function rodar<T>(fn: () => Promise<T>): Promise<Resposta<T>> {
  try {
    return { ok: true, dados: await fn() };
  } catch (err) {
    if (err instanceof LeadError || err instanceof PlacesError) return { ok: false, error: err.message };
    console.error('oportunidades', err);
    return { ok: false, error: 'Não foi possível concluir agora. Tente de novo em instantes.' };
  }
}

export async function estimarAction(input: unknown): Promise<Resposta<Estimativa>> {
  await requireUser();
  return rodar(() => estimarPesquisa(input));
}

/** `aprovadas`: the number of calls shown in the estimate the person approved. */
export async function pesquisarAction(input: unknown, aprovadas: number): Promise<Resposta<Resultado>> {
  const user = await requireUser();
  const res = await rodar(() => executarPesquisa(input, aprovadas, user.email));
  revalidatePath('/painel/oportunidades');
  return res;
}

export async function revisarAction(placeId: string, input: unknown): Promise<Resposta<Lead>> {
  const user = await requireUser();
  const res = await rodar(() => revisar(placeId, input, user.email));
  if (res.ok) revalidatePath('/painel/oportunidades');
  return res;
}

export async function verAoVivoAction(placeId: string): Promise<Resposta<LugarAoVivo>> {
  await requireUser();
  return rodar(() => verAoVivo(placeId));
}

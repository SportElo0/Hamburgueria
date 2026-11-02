'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { LeadError, estimarPesquisa, executarPesquisa, revisar, verAoVivo, type Resultado } from '@/lib/oportunidades/dados';
import { PlacesError, type LugarAoVivo } from '@/lib/oportunidades/places';
import type { Estimativa, Lead } from '@/lib/oportunidades/regras';
import { sincronizarComOportunidade } from '@/lib/vendas/dados';

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
  const res = await rodar(async () => {
    const lead = await revisar(placeId, input, user.email);
    // "Não contatar" and "Descartada" here also apply to the CRM (block, or move to Perdido). The review is already
    // saved; if this step fails, the CRM still refuses any text for the lead (it re-reads Oportunidades each time).
    await sincronizarComOportunidade(placeId, lead.situacao, user.email).catch((err) => console.error('sincronizar CRM', err instanceof Error ? err.message : err));
    return lead;
  });
  if (res.ok) {
    revalidatePath('/painel/oportunidades');
    revalidatePath('/painel/oportunidades/vendas');
  }
  return res;
}

export async function verAoVivoAction(placeId: string): Promise<Resposta<LugarAoVivo>> {
  await requireUser();
  return rodar(() => verAoVivo(placeId));
}

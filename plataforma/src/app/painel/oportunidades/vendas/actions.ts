'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import {
  VendasError,
  anotar,
  aprovarRascunho,
  bloquearContato,
  bloquearManual,
  criarContato,
  descartarRascunho,
  desbloquear,
  editarRascunho,
  gerarRascunho,
  mudarEtapa,
  registrarResposta,
  registrarWhatsapp,
} from '@/lib/vendas/dados';
import type { TipoRascunho } from '@/lib/vendas/regras';

export type Resposta<T = null> = { ok: true; dados: T } | { ok: false; error: string };

const BASE = '/painel/oportunidades/vendas';

async function rodar<T>(fn: (por: string) => Promise<T>, caminhos: string[]): Promise<Resposta<T>> {
  const user = await requireUser();
  try {
    const dados = await fn(user.email);
    for (const c of caminhos) revalidatePath(c);
    return { ok: true, dados };
  } catch (err) {
    if (err instanceof VendasError) return { ok: false, error: err.message };
    console.error('vendas', err instanceof Error ? err.message : err);
    return { ok: false, error: 'Não foi possível salvar agora. Tente de novo em instantes.' };
  }
}

const idOk = (id: unknown) => typeof id === 'string' && /^[a-z0-9]{10}$/.test(id);
const invalido = <T>(): Resposta<T> => ({ ok: false, error: 'Pedido inválido.' });

export async function criarContatoAction(input: unknown): Promise<Resposta<{ id: string }>> {
  return rodar(async (por) => ({ id: (await criarContato(input, por)).id }), [BASE, '/painel/oportunidades']);
}

export async function etapaAction(id: string, etapa: string): Promise<Resposta> {
  if (!idOk(id)) return invalido();
  return rodar(async (por) => (await mudarEtapa(id, etapa, por), null), [BASE, `${BASE}/${id}`]);
}

export async function notaAction(id: string, texto: string): Promise<Resposta> {
  if (!idOk(id)) return invalido();
  return rodar(async (por) => (await anotar(id, texto, por), null), [`${BASE}/${id}`]);
}

export async function respostaAction(id: string, texto: string): Promise<Resposta> {
  if (!idOk(id)) return invalido();
  return rodar(async (por) => (await registrarResposta(id, texto, por), null), [BASE, `${BASE}/${id}`, '/painel/oportunidades']);
}

export async function whatsappAction(id: string, input: unknown): Promise<Resposta> {
  if (!idOk(id)) return invalido();
  return rodar(async (por) => (await registrarWhatsapp(id, input, por), null), [BASE, `${BASE}/${id}`]);
}

export async function gerarAction(id: string, tipo: TipoRascunho): Promise<Resposta> {
  if (!idOk(id) || (tipo !== 'primeiro' && tipo !== 'acompanhamento')) return invalido();
  return rodar(async (por) => (await gerarRascunho(id, tipo, por), null), [BASE, `${BASE}/${id}`]);
}

export async function editarAction(id: string, rid: string, input: unknown): Promise<Resposta> {
  if (!idOk(id)) return invalido();
  return rodar(async (por) => (await editarRascunho(id, rid, input, por), null), [BASE, `${BASE}/${id}`]);
}

export async function aprovarAction(id: string, rid: string): Promise<Resposta> {
  if (!idOk(id)) return invalido();
  return rodar(async (por) => (await aprovarRascunho(id, rid, por), null), [BASE, `${BASE}/${id}`]);
}

export async function descartarAction(id: string, rid: string): Promise<Resposta> {
  if (!idOk(id)) return invalido();
  return rodar(async (por) => (await descartarRascunho(id, rid, por), null), [BASE, `${BASE}/${id}`]);
}

export async function bloquearContatoAction(id: string, motivo: string): Promise<Resposta> {
  if (!idOk(id)) return invalido();
  const m = String(motivo ?? '').trim().slice(0, 200) || 'Pediu para não ser contatado';
  return rodar(async (por) => (await bloquearContato(id, m, 'equipe', por), null), [BASE, `${BASE}/${id}`, `${BASE}/bloqueio`, '/painel/oportunidades']);
}

export async function bloquearManualAction(valor: string, motivo: string): Promise<Resposta<{ contatos: number }>> {
  return rodar(async (por) => ({ contatos: (await bloquearManual({ valor, motivo }, por)).contatos }), [BASE, `${BASE}/bloqueio`, '/painel/oportunidades']);
}

export async function desbloquearAction(chave: string): Promise<Resposta> {
  if (!/^[a-f0-9]{64}$/.test(String(chave))) return invalido();
  return rodar(async (por) => (await desbloquear(chave, por), null), [`${BASE}/bloqueio`]);
}

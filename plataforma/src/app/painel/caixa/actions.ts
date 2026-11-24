'use server';

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { requireUser } from '@/lib/auth';
import { CATEGORIAS, FREQUENCIAS, MAX_CUSTOS, type Custo } from '@/lib/custos';
import { limparTexto, pareceCpf } from '@/lib/crm';
import { mudarCustos } from '@/lib/custos-servidor';
import { SomenteLeituraError } from '@/lib/ambiente';

export type ResultadoCaixa = { ok: true; lista: Custo[] } | { ok: false; error: string };

const Dados = z.object({
  id: z.string().max(60).optional(),
  nome: z.string().max(200),
  categoria: z.enum(CATEGORIAS),
  valor: z.number().int().min(0).max(100_000_000),
  frequencia: z.enum(FREQUENCIAS),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nota: z.string().max(400),
});

async function rodar(fn: (l: Custo[], agora: string) => Custo[]): Promise<ResultadoCaixa> {
  await requireUser();
  try {
    return { ok: true, lista: await mudarCustos((l) => fn(l, new Date().toISOString())) };
  } catch (err) {
    if (err instanceof SomenteLeituraError) return { ok: false, error: err.message };
    if (err instanceof Erro) return { ok: false, error: err.message };
    console.error('caixa', err);
    return { ok: false, error: 'Não foi possível salvar agora. Tente de novo.' };
  }
}
class Erro extends Error {}

/** New cost (no id) or edit. */
export async function salvarCustoAction(dados: unknown): Promise<ResultadoCaixa> {
  const p = Dados.safeParse(dados);
  if (!p.success) return { ok: false, error: 'Confira nome, valor e data.' };
  const nome = limparTexto(p.data.nome, 80);
  const nota = limparTexto(p.data.nota, 200);
  if (!nome) return { ok: false, error: 'Escreva o nome do custo.' };
  if (pareceCpf(nome) || pareceCpf(nota)) return { ok: false, error: 'Não salve CPF aqui.' };
  return rodar((l, agora) => {
    if (p.data.id) {
      const c = l.find((x) => x.id === p.data.id);
      if (!c) throw new Erro('Custo não encontrado. Recarregue a página.');
      Object.assign(c, { nome, nota, categoria: p.data.categoria, valor: p.data.valor, frequencia: p.data.frequencia, data: p.data.data });
      return l;
    }
    if (l.length >= MAX_CUSTOS) throw new Erro('Lista cheia.');
    return [{ id: randomUUID(), nome, nota, categoria: p.data.categoria, valor: p.data.valor, frequencia: p.data.frequencia, data: p.data.data, fim: null, criadoEm: agora }, ...l];
  });
}

/** Cancel (keeps the history: no more charges after `fim`) or reactivate (fim = null). */
export async function encerrarCustoAction(id: string, fim: string | null): Promise<ResultadoCaixa> {
  if (typeof id !== 'string' || (fim !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(fim)))) return { ok: false, error: 'Inválido.' };
  return rodar((l) => {
    const c = l.find((x) => x.id === id);
    if (!c) throw new Erro('Custo não encontrado.');
    c.fim = fim;
    return l;
  });
}

export async function removerCustoAction(id: string): Promise<ResultadoCaixa> {
  if (typeof id !== 'string') return { ok: false, error: 'Inválido.' };
  return rodar((l) => l.filter((c) => c.id !== id));
}

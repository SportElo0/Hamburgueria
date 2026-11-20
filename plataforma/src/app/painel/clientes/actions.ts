'use server';

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { requireUser } from '@/lib/auth';
import { MAX_CLIENTES, PRODUTOS, SITUACOES, limparTexto, pareceCpf, soDigitosFone, type ClienteCrm } from '@/lib/crm';
import { mudarCrm } from '@/lib/crm-servidor';
import { SomenteLeituraError } from '@/lib/ambiente';

export type ResultadoCrm = { ok: true; lista: ClienteCrm[] } | { ok: false; error: string };

const SEM_CPF = 'Não salve CPF aqui (regra da Growlift).';

async function rodar(fn: (lista: ClienteCrm[], por: string, agora: string) => ClienteCrm[]): Promise<ResultadoCrm> {
  const user = await requireUser();
  const por = user.name || user.email;
  try {
    return { ok: true, lista: await mudarCrm((l) => fn(l, por, new Date().toISOString())) };
  } catch (err) {
    if (err instanceof SomenteLeituraError) return { ok: false, error: err.message };
    if (err instanceof Erro) return { ok: false, error: err.message };
    console.error('crm', err);
    return { ok: false, error: 'Não foi possível salvar agora. Tente de novo.' };
  }
}
class Erro extends Error {}
const achar = (l: ClienteCrm[], id: string) => {
  const c = l.find((x) => x.id === id);
  if (!c) throw new Erro('Cliente não encontrado (talvez alguém apagou). Recarregue a página.');
  return c;
};

const Dados = z.object({
  id: z.string().max(60).optional(),
  negocio: z.string().max(200),
  contato: z.string().max(200),
  whatsapp: z.string().max(40),
  cidade: z.string().max(200),
  situacao: z.enum(SITUACOES),
});

/** New customer (no id) or edit of the basic data. */
export async function salvarClienteAction(dados: unknown): Promise<ResultadoCrm> {
  const p = Dados.safeParse(dados);
  if (!p.success) return { ok: false, error: 'Confira os campos.' };
  const negocio = limparTexto(p.data.negocio, 80);
  if (!negocio) return { ok: false, error: 'Escreva o nome do negócio.' };
  const contato = limparTexto(p.data.contato, 60), cidade = limparTexto(p.data.cidade, 60);
  if ([negocio, contato, cidade].some(pareceCpf)) return { ok: false, error: SEM_CPF };
  const whatsapp = p.data.whatsapp.trim() ? soDigitosFone(p.data.whatsapp) : '';
  if (p.data.whatsapp.trim() && !whatsapp) return { ok: false, error: 'WhatsApp inválido: use DDD + número.' };
  return rodar((l, _por, agora) => {
    if (p.data.id) {
      const c = achar(l, p.data.id);
      Object.assign(c, { negocio, contato, whatsapp, cidade, situacao: p.data.situacao, atualizadoEm: agora });
      return l;
    }
    if (l.length >= MAX_CLIENTES) throw new Erro('Lista cheia.');
    return [{ id: randomUUID(), negocio, contato, whatsapp, cidade, situacao: p.data.situacao, vendas: [], notas: [], criadoEm: agora, atualizadoEm: agora }, ...l];
  });
}

export async function removerClienteAction(id: string): Promise<ResultadoCrm> {
  if (typeof id !== 'string') return { ok: false, error: 'Inválido.' };
  return rodar((l) => (achar(l, id), l.filter((c) => c.id !== id)));
}

const VendaIn = z.object({
  produto: z.enum(PRODUTOS),
  descricao: z.string().max(300),
  valor: z.number().int().min(0).max(100_000_000),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pago: z.boolean(),
  mensal: z.boolean(),
  vencimento: z.number().int().min(1).max(28).nullable(),
});

export async function adicionarVendaAction(clienteId: string, venda: unknown): Promise<ResultadoCrm> {
  const p = VendaIn.safeParse(venda);
  if (typeof clienteId !== 'string' || !p.success) return { ok: false, error: 'Confira produto, valor e data.' };
  const descricao = limparTexto(p.data.descricao, 120);
  if (pareceCpf(descricao)) return { ok: false, error: SEM_CPF };
  return rodar((l, _por, agora) => {
    const c = achar(l, clienteId);
    if (c.vendas.length >= 200) throw new Erro('Muitas vendas neste cliente.');
    c.vendas.unshift({ id: randomUUID(), ...p.data, descricao, vencimento: p.data.mensal ? (p.data.vencimento ?? null) : null });
    // Selling to a possible customer makes them a customer.
    if (c.situacao !== 'cliente') c.situacao = 'cliente';
    c.atualizadoEm = agora;
    return l;
  });
}

export async function alternarPagoAction(clienteId: string, vendaId: string): Promise<ResultadoCrm> {
  if (typeof clienteId !== 'string' || typeof vendaId !== 'string') return { ok: false, error: 'Inválido.' };
  return rodar((l, _por, agora) => {
    const c = achar(l, clienteId);
    const v = c.vendas.find((x) => x.id === vendaId);
    if (!v) throw new Erro('Venda não encontrada.');
    v.pago = !v.pago;
    c.atualizadoEm = agora;
    return l;
  });
}

export async function removerVendaAction(clienteId: string, vendaId: string): Promise<ResultadoCrm> {
  if (typeof clienteId !== 'string' || typeof vendaId !== 'string') return { ok: false, error: 'Inválido.' };
  return rodar((l, _por, agora) => {
    const c = achar(l, clienteId);
    c.vendas = c.vendas.filter((x) => x.id !== vendaId);
    c.atualizadoEm = agora;
    return l;
  });
}

export async function adicionarNotaAction(clienteId: string, texto: string): Promise<ResultadoCrm> {
  const t = limparTexto(texto, 500);
  if (typeof clienteId !== 'string' || !t) return { ok: false, error: 'Escreva a anotação.' };
  if (pareceCpf(t)) return { ok: false, error: SEM_CPF };
  return rodar((l, por, agora) => {
    const c = achar(l, clienteId);
    if (c.notas.length >= 300) c.notas.pop();
    c.notas.unshift({ em: agora, por, texto: t });
    c.atualizadoEm = agora;
    return l;
  });
}

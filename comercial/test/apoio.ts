import { randomUUID } from 'node:crypto';
import { criarUsuario } from '@/server/auth';
import { Conhecimento } from '@/server/config';
import type { Ctx } from '@/server/contexto';
import { q, um } from '@/server/db';
import { criarEmpresa, empresaPorId, type Empresa } from '@/server/empresas';
import type { EntradaPedido } from '@/server/pedidos';

let n = 0;
export const unico = () => `${Date.now().toString(36)}${(n++).toString(36)}`;
/** A valid, never repeated Brazilian mobile number for tests. */
export const telefone = () => `1199${String(1000000 + ((Date.now() + n++ * 7919) % 8999999)).padStart(7, '0')}`;

export interface Cenario {
  empresa: Empresa;
  admin: Ctx;
  vendedor: Ctx;
}

let plataforma: string | null = null;
export async function adminPlataforma(): Promise<string> {
  if (!plataforma) {
    plataforma = await criarUsuario(`growlift-${unico()}@teste.local`, 'Equipe Growlift', 'senha-de-teste-123');
    await q('insert into admins_plataforma (user_id) values ($1)', [plataforma]);
  }
  return plataforma;
}

export async function novaEmpresa(nome: string, conhecimento?: Partial<Conhecimento>): Promise<Cenario> {
  const criada = await criarEmpresa(await adminPlataforma(), { nome, slug: `e-${unico()}`, segmento: 'energia-solar' });
  const a = await criarUsuario(`admin-${unico()}@teste.local`, `Admin ${nome}`, 'senha-de-teste-123');
  const v = await criarUsuario(`vend-${unico()}@teste.local`, `Vendedor ${nome}`, 'senha-de-teste-123');
  await q(`insert into membros (user_id, empresa_id, papel) values ($1, $3, 'admin'), ($2, $3, 'vendedor')`, [a, v, criada.id]);
  if (conhecimento) await q('insert into conhecimento (empresa_id, versao, dados) values ($1, 2, $2)', [criada.id, JSON.stringify(Conhecimento.parse(conhecimento))]);
  return {
    empresa: (await empresaPorId(criada.id))!,
    admin: { userId: a, nome: `Admin ${nome}`, empresaId: criada.id, papel: 'admin' },
    vendedor: { userId: v, nome: `Vendedor ${nome}`, empresaId: criada.id, papel: 'vendedor' },
  };
}

export const pedido = (extra: Partial<EntradaPedido> = {}): EntradaPedido => ({
  nome: 'Marina Teste',
  telefone: telefone(),
  cidade: 'Campinas',
  necessidade: 'Quero orçamento de energia solar para minha casa',
  preferencia_contato: 'WhatsApp',
  aceite_whatsapp: true,
  chave_idempotencia: randomUUID(),
  extras: { tipo_imovel: 'Casa', gasto_mensal: '450' },
  ...extra,
});

export const meta = () => ({ origem: 'site' as const, ipHash: unico() });
export const contar = async (sql: string, p: unknown[]) => (await um<{ n: number }>(`select count(*)::int as n from ${sql}`, p))!.n;

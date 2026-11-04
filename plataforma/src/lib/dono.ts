import 'server-only';
import { ConflictError } from './storage';
import { getPublished } from './stores';
import { getOperation } from './orders';
import { floor } from './mesas';
import { getCostSheet, saveCostSheet, summariesForDays } from './inteligencia/dados';
import { unitCostOf } from './inteligencia/custos';
import { MARGEM_BAIXA, margem, montarResumo } from './dono-resumo';

/**
 * Dados do painel do dono. Lê o cardápio publicado (o que o cliente vê), os resumos diários da
 * Inteligência, a ficha de custos e as mesas abertas. Nada aqui é mostrado fora do login do dono
 * (ou da equipe da Growlift).
 */

export interface ItemDono {
  id: string;
  name: string;
  description: string;
  /** null: item sem preço no cardápio ("consulte"). */
  price: number | null;
  category: string;
  soldOut: boolean;
  /** Custo de 1 unidade como entra na margem (com embalagem), ou null sem custo. */
  cost: number | null;
  /** "ficha": a equipe montou a ficha técnica (o dono só vê); "manual": o dono digita; null: sem custo. */
  costMode: 'ficha' | 'manual' | null;
  /** O que o dono digitou (sem a embalagem), para preencher o campo. */
  manualCost: number | null;
  /** Embalagem somada ao custo, em centavos. */
  packaging: number;
}

export async function itensDoDono(slug: string): Promise<{ categories: { name: string; items: ItemDono[] }[]; published: boolean }> {
  const [published, costs, op] = await Promise.all([getPublished(slug), getCostSheet(slug), getOperation(slug)]);
  if (!published) return { categories: [], published: false };
  const { sheet } = costs;
  const soldOut = new Set(op.soldOut);
  return {
    published: true,
    categories: published.store.catalog.categories.map((c) => ({
      name: c.name,
      items: c.items.map((i) => {
        const p = sheet.products[i.id];
        const cost = unitCostOf(sheet, i.id);
        const costMode = p ? (p.mode === 'ficha' ? (p.recipe.length ? 'ficha' : null) : p.unitCost === null ? null : 'manual') : null;
        return {
          id: i.id,
          name: i.name,
          description: i.description,
          price: i.price,
          category: c.name,
          soldOut: soldOut.has(i.id),
          cost,
          costMode,
          manualCost: p?.mode === 'manual' ? p.unitCost : null,
          packaging: p ? (p.packaging ?? sheet.packagingDefault) : sheet.packagingDefault,
        };
      }),
    })),
  };
}

export class CustoError extends Error {}

/**
 * O dono informa quanto custa fazer 1 unidade (centavos, sem embalagem), ou apaga (null). Não mexe
 * num item com ficha técnica montada pela equipe: lá o custo vem dos insumos.
 */
export async function salvarCustoManual(slug: string, itemId: string, cents: number | null, by: string) {
  if (cents !== null && (!Number.isInteger(cents) || cents < 0 || cents > 10_000_000)) throw new CustoError('Custo inválido.');
  for (let attempt = 0; attempt < 4; attempt++) {
    const { sheet, etag } = await getCostSheet(slug);
    const current = sheet.products[itemId];
    if (current?.mode === 'ficha' && current.recipe.length) throw new CustoError('Este item tem ficha técnica: o custo vem dos ingredientes. Fale com a Growlift para mudar.');
    const products = { ...sheet.products };
    if (cents === null) delete products[itemId];
    else products[itemId] = { mode: 'manual', unitCost: cents, recipe: [], packaging: current?.packaging ?? null };
    try {
      await saveCostSheet(slug, { ...sheet, products }, etag, by);
      return;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
}

const TZ = 'America/Sao_Paulo';

export async function resumoDoDono(slug: string, now = new Date()) {
  const [{ categories }, days, mesas] = await Promise.all([itensDoDono(slug), summariesForDays(slug, 30, now), floor(slug, now)]);
  const items = categories.flatMap((c) => c.items);
  const resumo = montarResumo(days, items.map((i) => ({ id: i.id, name: i.name })));
  const chamados = mesas
    .flatMap((m) => m.calls.map((c) => ({ mesa: m.number, tipo: c.kind, desde: c.at })))
    .sort((a, b) => a.desde.localeCompare(b.desde));
  const margemBaixa = items
    .map((i) => ({ i, m: margem(i.price ?? 0, i.cost) }))
    .filter((x) => x.m && x.m.taxa < MARGEM_BAIXA)
    .sort((a, b) => a.m!.taxa - b.m!.taxa)
    .map(({ i, m }) => ({ id: i.id, name: i.name, lucro: m!.lucro, taxa: m!.taxa }));
  const semCusto = items.filter((i) => i.cost === null).length;
  const esgotados = items.filter((i) => i.soldOut).map((i) => i.name);
  const hora = Number(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(now));
  return { resumo, chamados, mesasAbertas: mesas.length, margemBaixa, semCusto, totalItens: items.length, esgotados, hora };
}

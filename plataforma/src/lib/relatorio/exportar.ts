import 'server-only';
import { getDraft, getPublished } from '../stores';
import { ordersOfDays } from '../orders';
import { drinkCategoryIds } from '../mesas';
import { getCostSheet, summariesForDays } from '../inteligencia/dados';
import { analyze } from '../inteligencia/analise';
import { unitCostOf } from '../inteligencia/custos';
import { isSale } from '../inteligencia/resumo';
import { analisarPeriodo, type ItemInfo } from './analise';
import { montarDocumento } from './documento';

/** Lê os dados de um restaurante num período e devolve o documento (Markdown) para levar ao projeto do Claude. */

export class ExportError extends Error {}

const DIA = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_DIAS = 92;
const TZ = 'America/Sao_Paulo';
export const hojeSP = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
const somaDias = (day: string, n: number) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const entre = (de: string, ate: string) => Math.round((Date.parse(`${ate}T12:00:00Z`) - Date.parse(`${de}T12:00:00Z`)) / 86_400_000) + 1;
const DRINK_NAME = /bebida|drink|chop|cerveja|vinho|coquetel|caipirinha|suco|refri|soda|dose/i;

/** Confere o período: datas válidas, a última não depois de hoje, no máximo MAX_DIAS dias. */
export function validarPeriodo(de: string, ate: string, now = new Date()) {
  if (!DIA.test(de) || !DIA.test(ate) || Number.isNaN(Date.parse(de)) || Number.isNaN(Date.parse(ate))) throw new ExportError('Datas inválidas.');
  if (de > ate) throw new ExportError('A data de início vem depois da data final.');
  if (ate > hojeSP(now)) throw new ExportError('A data final não pode ser depois de hoje.');
  const dias = entre(de, ate);
  if (dias > MAX_DIAS) throw new ExportError(`Escolha até ${MAX_DIAS} dias.`);
  return dias;
}

export async function documentoDoRestaurante(slug: string, de: string, ate: string, now = new Date()): Promise<{ nome: string; texto: string }> {
  const dias = validarPeriodo(de, ate, now);
  const [published, draft, costs] = await Promise.all([getPublished(slug), getDraft(slug), getCostSheet(slug)]);
  const store = published?.store ?? draft?.data.store;
  if (!store) throw new ExportError('Loja não encontrada.');
  const drinks = drinkCategoryIds(store);
  const categoria = new Map<string, string>();
  const itens: ItemInfo[] = store.catalog.categories.flatMap((c) =>
    c.items.map((i) => {
      categoria.set(i.id, c.name);
      return { id: i.id, name: i.name, category: c.name, price: i.price, cost: unitCostOf(costs.sheet, i.id), drink: drinks.has(c.id) || DRINK_NAME.test(c.name) };
    }),
  );

  // Uma leitura só: dos 90 dias (ou do período anterior, o que vier antes) até o último dia.
  const anteriorDe = somaDias(de, -dias);
  const inicio = [anteriorDe, somaDias(ate, -89)].sort()[0];
  const ateData = ate < hojeSP(now) ? new Date(`${ate}T15:00:00Z`) : now;
  const todos = await summariesForDays(slug, entre(inicio, ate), ateData);
  const no = (a: string, b: string) => todos.filter((d) => d.day >= a && d.day <= b);
  const atual = no(de, ate);
  const anterior = no(anteriorDe, somaDias(de, -1));
  const dias90 = no(somaDias(ate, -89), ate);
  const pedidos = (await ordersOfDays(slug, atual.map((d) => d.day))).flatMap((d) => d.orders).filter((o) => isSale(o, now.getTime()));

  const resultado = analisarPeriodo({ de, ate, pedidos, dias: atual, diasAnterior: anterior, dias90, itens });
  const analise = analyze({ current: atual, previous: anterior, sheet: costs.sheet, categoryOf: (id) => categoria.get(id) });
  const texto = montarDocumento({ nome: store.name, de, ate, anteriorDe, anteriorAte: somaDias(de, -1), geradoEm: now, resultado, analise, itens, dias90 });
  return { nome: store.name, texto };
}

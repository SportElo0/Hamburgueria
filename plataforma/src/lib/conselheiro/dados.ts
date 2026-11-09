import 'server-only';
import crypto from 'node:crypto';
import { storage, ConflictError } from '../storage';
import { getDraft, getPublished } from '../stores';
import { dayOf } from '../orders';
import { getCostSheet, summariesForDays } from '../inteligencia/dados';
import type { CostSheet } from '../inteligencia/custos';
import { contribuicaoUnitaria, type EntradaUnidade, type ResultadoUnidade, type TaxasCanal } from './calculos';
import {
  CANAL_PAINEL,
  PERFIL_VAZIO,
  canalSchema,
  custoSchema,
  loteSchema,
  perfilSchema,
  precoSchema,
  produtoSchema,
  vendaSchema,
  type Canal,
  type CustoVersao,
  type Fonte,
  type Lote,
  type Perfil,
  type PrecoCanal,
  type ProdutoCadastrado,
  type Venda,
} from './modelo';

/**
 * Leitura e gravação dos dados do Conselheiro de UMA loja. Todas as funções recebem o slug que a tela ou a
 * ação já conferiu com `requireStoreAccess`; nenhuma aceita slug vindo da IA ou do navegador sem essa conferência.
 *
 *   conselheiro/<slug>/perfil.json        perfil, canais, prioritários, meta
 *   conselheiro/<slug>/produtos.json      produtos cadastrados fora do cardápio
 *   conselheiro/<slug>/precos.json        preços por canal com data de início
 *   conselheiro/<slug>/custos.json        versões de custo (nunca editadas)
 *   conselheiro/<slug>/lotes.json         lotes importados
 *   conselheiro/<slug>/vendas/<lote>.json linhas de venda de cada lote
 */

export class DadosError extends Error {}

const raiz = (slug: string) => `conselheiro/${slug}`;
export const chave = (slug: string, nome: string) => `${raiz(slug)}/${nome}`;

export const hoje = (now = new Date()) => dayOf(now);
export const novoId = (prefixo: string) => `${prefixo}-${crypto.randomBytes(6).toString('hex')}`;

/** Lê, aplica a mudança e grava com o etag lido; repete se outra pessoa gravou no meio. */
export async function mutar<T, R = T>(key: string, vazio: () => T, fn: (atual: T) => { novo: T; retorno?: R }): Promise<R> {
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const doc = await storage().readJSON<T>(key);
    const { novo, retorno } = fn(doc ? doc.data : vazio());
    try {
      await storage().writeJSON(key, novo, doc ? doc.etag : null);
      return (retorno ?? novo) as R;
    } catch (err) {
      if (!(err instanceof ConflictError) || tentativa === 3) throw err;
    }
  }
  throw new ConflictError();
}

async function ler<T>(key: string, vazio: T): Promise<T> {
  return (await storage().readJSON<T>(key))?.data ?? vazio;
}

/** Limpa texto vindo de planilha ou do dono: sem caracteres de controle, tamanho limitado. */
export const limpar = (s: unknown, max: number) =>
  String(s ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

// ───────────────────────────── Perfil ─────────────────────────────

export async function getPerfil(slug: string): Promise<Perfil> {
  const raw = await ler<unknown>(chave(slug, 'perfil.json'), null);
  const p = perfilSchema.safeParse(raw);
  return p.success ? p.data : PERFIL_VAZIO;
}

/** Grava os campos do negócio e marca a etapa. Campos ausentes ficam como estão. */
export async function salvarPerfil(slug: string, input: Partial<Omit<Perfil, 'canais' | 'atualizadoEm' | 'atualizadoPor' | 'etapas'>>, etapa: string | null, by: string) {
  return mutar<unknown, Perfil>(chave(slug, 'perfil.json'), () => null, (raw) => {
    const atual = perfilSchema.safeParse(raw).success ? (raw as Perfil) : PERFIL_VAZIO;
    const prox = perfilSchema.parse({
      ...atual,
      ...input,
      canais: atual.canais,
      etapas: etapa ? { ...atual.etapas, [etapa]: true } : atual.etapas,
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: by,
    });
    return { novo: prox, retorno: prox };
  });
}

/** Cria ou troca um canal. O id do canal não muda depois de criado (as vendas e preços apontam para ele). */
export async function salvarCanal(slug: string, input: Omit<Canal, 'atualizadoEm' | 'atualizadoPor' | 'id'> & { id?: string }, by: string) {
  return mutar<unknown, Canal>(chave(slug, 'perfil.json'), () => null, (raw) => {
    const atual = perfilSchema.safeParse(raw).success ? (raw as Perfil) : PERFIL_VAZIO;
    // O canal "painel" (pedidos que já passam pelo painel) tem id fixo; os outros ganham um id novo.
    const id = input.id ?? novoId('c');
    const canal = canalSchema.parse({ ...input, id, nome: limpar(input.nome, 60), atualizadoEm: new Date().toISOString(), atualizadoPor: by });
    if (!canal.tributosConfirmado && canal.tributosBps !== null) throw new DadosError('Confirme o percentual de tributo antes de salvar (o painel não deduz o regime tributário).');
    const existe = atual.canais.some((c) => c.id === id);
    if (!existe && input.id && input.id !== CANAL_PAINEL) throw new DadosError('Canal não encontrado.');
    if (!existe && atual.canais.length >= 12) throw new DadosError('No máximo 12 canais.');
    const canais = existe ? atual.canais.map((c) => (c.id === id ? canal : c)) : [...atual.canais, canal];
    return { novo: perfilSchema.parse({ ...atual, canais, atualizadoEm: canal.atualizadoEm, atualizadoPor: by }), retorno: canal };
  });
}

// ───────────────────────────── Produtos ─────────────────────────────

export interface ProdutoView {
  id: string;
  nome: string;
  categoria: string;
  origem: 'cardapio' | 'informado' | 'importado';
  /** Preço no cardápio do painel (null fora do cardápio ou "consulte"). */
  precoCardapio: number | null;
  /** Modelo 3D no cardápio: só existe para itens do cardápio. */
  modelo3d: { larguraCm: number; publicado: boolean; ios: boolean } | null;
  foto: boolean;
}

export async function getProdutosCadastrados(slug: string): Promise<ProdutoCadastrado[]> {
  const raw = await ler<unknown[]>(chave(slug, 'produtos.json'), []);
  return raw.flatMap((p) => {
    const r = produtoSchema.safeParse(p);
    return r.success ? [r.data] : [];
  });
}

export async function listarProdutos(slug: string): Promise<ProdutoView[]> {
  const [published, draft, proprios] = await Promise.all([getPublished(slug), getDraft(slug), getProdutosCadastrados(slug)]);
  const store = published?.store ?? draft?.data.store;
  const noAr = new Map(published?.store.catalog.categories.flatMap((c) => c.items.map((i) => [i.id, i] as const)) ?? []);
  const cardapio: ProdutoView[] =
    store?.catalog.categories
      .filter((c) => c.id !== 'adicionais')
      .flatMap((c) =>
        c.items.map((i) => ({
          id: i.id,
          nome: i.name,
          categoria: c.name,
          origem: 'cardapio' as const,
          precoCardapio: i.price,
          modelo3d: i.modelo3d ? { larguraCm: i.modelo3d.larguraCm, publicado: Boolean(noAr.get(i.id)?.modelo3d), ios: Boolean(i.modelo3d.ios) } : null,
          foto: Boolean(i.image),
        })),
      ) ?? [];
  const ids = new Set(cardapio.map((p) => p.id));
  return [
    ...cardapio,
    ...proprios
      .filter((p) => p.ativo && !ids.has(p.id))
      .map((p) => ({ id: p.id, nome: p.nome, categoria: p.categoria, origem: p.origem, precoCardapio: null, modelo3d: null, foto: false })),
  ];
}

export async function adicionarProduto(slug: string, input: { nome: string; categoria: string }, by: string, loteId: string | null = null): Promise<ProdutoCadastrado> {
  const nome = limpar(input.nome, 80);
  if (!nome) throw new DadosError('Informe o nome do produto.');
  const existentes = await listarProdutos(slug);
  if (existentes.some((p) => normalizar(p.nome) === normalizar(nome))) throw new DadosError(`Já existe um produto chamado "${nome}".`);
  return mutar<unknown[], ProdutoCadastrado>(chave(slug, 'produtos.json'), () => [], (lista) => {
    if (lista.length >= 500) throw new DadosError('Limite de 500 produtos cadastrados.');
    const p = produtoSchema.parse({ id: novoId('p'), nome, categoria: limpar(input.categoria, 60), ativo: true, origem: loteId ? 'importado' : 'informado', loteId, criadoEm: new Date().toISOString(), criadoPor: by });
    return { novo: [...lista, p], retorno: p };
  });
}

/** Vários produtos numa gravação só (importação): ou entram todos, ou nenhum. */
export async function adicionarProdutos(slug: string, itens: { nome: string; categoria: string }[], by: string, loteId: string) {
  const existentes = new Set((await listarProdutos(slug)).map((p) => normalizar(p.nome)));
  const em = new Date().toISOString();
  const novos = itens.map((i) => {
    const nome = limpar(i.nome, 80);
    if (!nome || existentes.has(normalizar(nome))) throw new DadosError(`Produto "${nome}" vazio ou repetido.`);
    existentes.add(normalizar(nome));
    return produtoSchema.parse({ id: novoId('p'), nome, categoria: limpar(i.categoria, 60), ativo: true, origem: 'importado', loteId, criadoEm: em, criadoPor: by });
  });
  await mutar<unknown[]>(chave(slug, 'produtos.json'), () => [], (lista) => {
    if (lista.length + novos.length > 500) throw new DadosError('Limite de 500 produtos cadastrados.');
    return { novo: [...lista, ...novos] };
  });
}

/** Tira um lote do registro (a gravação dos dados dele falhou): o mesmo arquivo pode ser importado de novo. */
export async function removerLote(slug: string, id: string) {
  await mutar<unknown[]>(chave(slug, 'lotes.json'), () => [], (lista) => ({ novo: lista.filter((x) => (x as Lote).id !== id) }));
}

export const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// ───────────────────────────── Preços por canal ─────────────────────────────

export async function getPrecos(slug: string): Promise<PrecoCanal[]> {
  const raw = await ler<unknown[]>(chave(slug, 'precos.json'), []);
  return raw.flatMap((p) => {
    const r = precoSchema.safeParse(p);
    return r.success ? [r.data] : [];
  });
}

export async function adicionarPrecos(slug: string, novos: Omit<PrecoCanal, 'id' | 'registradoEm' | 'registradoPor'>[], by: string) {
  const [produtos, perfil] = await Promise.all([listarProdutos(slug), getPerfil(slug)]);
  const ids = new Set(produtos.map((p) => p.id));
  const canais = new Set(perfil.canais.map((c) => c.id));
  for (const n of novos) {
    if (!ids.has(n.produtoId)) throw new DadosError('Produto não encontrado.');
    if (!canais.has(n.canalId)) throw new DadosError('Canal não encontrado: cadastre o canal antes.');
  }
  const em = new Date().toISOString();
  return mutar<unknown[], PrecoCanal[]>(chave(slug, 'precos.json'), () => [], (lista) => {
    const add = novos.map((n) => precoSchema.parse({ ...n, id: novoId('pr'), registradoEm: em, registradoPor: by }));
    if (lista.length + add.length > 5000) throw new DadosError('Limite de preços atingido.');
    return { novo: [...lista, ...add], retorno: add };
  });
}

export interface PrecoVigente {
  preco: number;
  origem: 'informado' | 'importado' | 'cardapio';
  versao: string;
  inicio: string;
}

/** Canais em que o preço do cardápio do painel vale quando não há preço próprio. */
const usaPrecoCardapio = (c: Canal) => c.id === CANAL_PAINEL || c.tipo === 'salao' || c.tipo === 'delivery-proprio' || c.tipo === 'retirada';

export function precoVigente(precos: PrecoCanal[], produto: ProdutoView, canal: Canal, dia: string): PrecoVigente | null {
  const valido = precos
    .filter((p) => p.produtoId === produto.id && p.canalId === canal.id && p.inicio <= dia)
    .sort((a, b) => (a.inicio === b.inicio ? b.registradoEm.localeCompare(a.registradoEm) : b.inicio.localeCompare(a.inicio)))[0];
  if (valido) return { preco: valido.preco, origem: valido.origem, versao: valido.id, inicio: valido.inicio };
  if (produto.precoCardapio !== null && usaPrecoCardapio(canal)) return { preco: produto.precoCardapio, origem: 'cardapio', versao: 'cardapio', inicio: '' };
  return null;
}

// ───────────────────────────── Custos versionados ─────────────────────────────

export async function getCustos(slug: string): Promise<CustoVersao[]> {
  const raw = await ler<unknown[]>(chave(slug, 'custos.json'), []);
  return raw.flatMap((p) => {
    const r = custoSchema.safeParse(p);
    return r.success ? [r.data] : [];
  });
}

export async function adicionarCustos(slug: string, novos: Omit<CustoVersao, 'id' | 'registradoEm' | 'registradoPor'>[], by: string) {
  const ids = new Set((await listarProdutos(slug)).map((p) => p.id));
  for (const n of novos) {
    if (!ids.has(n.produtoId)) throw new DadosError('Produto não encontrado.');
    if (n.ingredientes === null && n.embalagem === null && n.outros === null) throw new DadosError('Informe ao menos um custo.');
  }
  const em = new Date().toISOString();
  return mutar<unknown[], CustoVersao[]>(chave(slug, 'custos.json'), () => [], (lista) => {
    const add = novos.map((n) => custoSchema.parse({ ...n, nota: limpar(n.nota, 200), id: novoId('cu'), registradoEm: em, registradoPor: by }));
    if (lista.length + add.length > 5000) throw new DadosError('Limite de versões de custo atingido.');
    return { novo: [...lista, ...add], retorno: add };
  });
}

export interface CustoVigente {
  ingredientes: number | null;
  embalagem: number | null;
  outros: number | null;
  origem: 'informado' | 'importado' | 'calculado' | 'ficha';
  versao: string;
  inicio: string;
  desatualizado: boolean;
  /** Versão anterior, para ver o tamanho da mudança. */
  anterior: { ingredientes: number | null; inicio: string } | null;
}

const diasEntre = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);

/** O custo da ficha técnica da Inteligência (montada pela equipe ou pelo dono em Preços e custos). */
function custoDaFicha(sheet: CostSheet, produtoId: string): { ingredientes: number | null; embalagem: number } | null {
  const p = sheet.products[produtoId];
  if (!p) return null;
  let ingredientes: number | null = null;
  if (p.mode === 'manual') ingredientes = p.unitCost;
  else if (p.recipe.length) {
    let soma = 0;
    for (const l of p.recipe) {
      const ing = sheet.ingredients.find((i) => i.id === l.ingredientId);
      if (!ing) return null;
      soma += ing.costPerUnit * l.quantity;
    }
    ingredientes = Math.round(soma);
  }
  if (ingredientes === null) return null;
  return { ingredientes, embalagem: p.packaging ?? sheet.packagingDefault };
}

export function custoVigente(custos: CustoVersao[], ficha: { sheet: CostSheet; updatedAt: string | null }, produtoId: string, dia: string, validadeDias: number): CustoVigente | null {
  const versoes = custos
    .filter((c) => c.produtoId === produtoId && c.inicio <= dia && c.confirmadoPor)
    .sort((a, b) => (a.inicio === b.inicio ? b.registradoEm.localeCompare(a.registradoEm) : b.inicio.localeCompare(a.inicio)));
  const v = versoes[0];
  if (v) {
    return {
      ingredientes: v.ingredientes,
      embalagem: v.embalagem,
      outros: v.outros,
      origem: v.origem,
      versao: v.id,
      inicio: v.inicio,
      desatualizado: diasEntre(v.inicio, dia) > validadeDias,
      anterior: versoes[1] ? { ingredientes: versoes[1].ingredientes, inicio: versoes[1].inicio } : null,
    };
  }
  const f = custoDaFicha(ficha.sheet, produtoId);
  if (!f) return null;
  const inicio = ficha.updatedAt ? dayOf(new Date(ficha.updatedAt)) : dia;
  return { ingredientes: f.ingredientes, embalagem: f.embalagem, outros: null, origem: 'ficha', versao: `ficha-${inicio}`, inicio, desatualizado: diasEntre(inicio, dia) > validadeDias, anterior: null };
}

// ───────────────────────────── Contribuição por produto e canal ─────────────────────────────

export function taxasDoCanal(c: Canal): TaxasCanal {
  return { comissaoBps: c.comissaoBps, comissaoBase: c.comissaoBase, pagamentoBps: c.pagamentoBps, tributosBps: c.tributosConfirmado ? c.tributosBps : null };
}

export interface LinhaContribuicao {
  produto: ProdutoView;
  canal: Canal;
  preco: PrecoVigente | null;
  custo: CustoVigente | null;
  entrada: EntradaUnidade | null;
  resultado: ResultadoUnidade | null;
  fontes: Fonte[];
  pendencias: string[];
}

export function entradaDe(preco: PrecoVigente, custo: CustoVigente | null, canal: Canal, desconto = 0): EntradaUnidade {
  return {
    preco: preco.preco,
    desconto,
    custos: { ingredientes: custo?.ingredientes ?? null, embalagem: canal.embalagem ? (custo?.embalagem ?? null) : 0, outros: custo?.outros ?? null },
    taxas: taxasDoCanal(canal),
  };
}

export function fontesDe(produto: ProdutoView, canal: Canal, preco: PrecoVigente | null, custo: CustoVigente | null): Fonte[] {
  const out: Fonte[] = [];
  if (preco) out.push({ rotulo: `Preço de ${produto.nome} em ${canal.nome}`, origem: preco.origem, versao: preco.versao, data: preco.inicio });
  if (custo) out.push({ rotulo: `Custo de ${produto.nome}`, origem: custo.origem, versao: custo.versao, data: custo.inicio });
  out.push({ rotulo: `Taxas de ${canal.nome}`, origem: 'informado', versao: canal.atualizadoEm.slice(0, 19), data: canal.atualizadoEm.slice(0, 10) });
  return out;
}

/** O contexto que quase toda tela e ferramenta usa: lido uma vez por pedido. */
export async function contexto(slug: string, now = new Date()) {
  const [perfil, produtos, precos, custos, ficha] = await Promise.all([getPerfil(slug), listarProdutos(slug), getPrecos(slug), getCustos(slug), getCostSheet(slug)]);
  return { slug, dia: hoje(now), perfil, produtos, precos, custos, ficha: { sheet: ficha.sheet, updatedAt: ficha.updatedAt } };
}
export type Contexto = Awaited<ReturnType<typeof contexto>>;

export function linha(ctx: Contexto, produto: ProdutoView, canal: Canal): LinhaContribuicao {
  const preco = precoVigente(ctx.precos, produto, canal, ctx.dia);
  const custo = custoVigente(ctx.custos, ctx.ficha, produto.id, ctx.dia, ctx.perfil.custoValidadeDias);
  const pendencias: string[] = [];
  if (!preco) pendencias.push(`sem preço em ${canal.nome}`);
  if (!custo || custo.ingredientes === null) pendencias.push('sem custo dos ingredientes');
  else if (custo.desatualizado) pendencias.push(`custo de ${custo.inicio.split('-').reverse().join('/')} (desatualizado)`);
  if (canal.embalagem && custo && custo.embalagem === null) pendencias.push('sem custo de embalagem');
  if (canal.pagamentoBps === null) pendencias.push(`sem taxa de pagamento de ${canal.nome}`);
  if (canal.comissaoBps === null) pendencias.push(`sem comissão de ${canal.nome}`);
  if (!canal.tributosConfirmado) pendencias.push('tributo variável não confirmado');
  const entrada = preco ? entradaDe(preco, custo, canal) : null;
  return { produto, canal, preco, custo, entrada, resultado: entrada ? contribuicaoUnitaria(entrada) : null, fontes: fontesDe(produto, canal, preco, custo), pendencias };
}

export function linhas(ctx: Contexto) {
  const canais = ctx.perfil.canais.filter((c) => c.ativo);
  return ctx.produtos.flatMap((p) => canais.map((c) => linha(ctx, p, c)));
}

// ───────────────────────────── Lotes e vendas ─────────────────────────────

export async function getLotes(slug: string): Promise<Lote[]> {
  const raw = await ler<unknown[]>(chave(slug, 'lotes.json'), []);
  return raw.flatMap((p) => {
    const r = loteSchema.safeParse(p);
    return r.success ? [r.data] : [];
  });
}

export async function registrarLote(slug: string, lote: Lote) {
  return mutar<unknown[], Lote>(chave(slug, 'lotes.json'), () => [], (lista) => {
    const atuais = lista.flatMap((p) => (loteSchema.safeParse(p).success ? [p as Lote] : []));
    if (atuais.some((l) => l.hash === lote.hash && !l.desfeitoEm)) throw new DadosError('Esse arquivo já foi importado.');
    return { novo: [...lista, loteSchema.parse(lote)], retorno: lote };
  });
}

/** Desfaz um lote de vendas: as linhas saem das contas, o registro do lote fica com a data. */
export async function desfazerLote(slug: string, id: string, by: string) {
  await mutar<unknown[]>(chave(slug, 'lotes.json'), () => [], (lista) => {
    const l = lista.find((x) => (x as Lote).id === id) as Lote | undefined;
    if (!l) throw new DadosError('Lote não encontrado.');
    if (l.tipo !== 'vendas') throw new DadosError('Só lotes de vendas podem ser desfeitos (custos e preços têm versões: registre uma nova).');
    if (l.desfeitoEm) throw new DadosError('Esse lote já foi desfeito.');
    return { novo: lista.map((x) => ((x as Lote).id === id ? { ...l, desfeitoEm: `${new Date().toISOString()} (${limpar(by, 60)})` } : x)) };
  });
}

export async function vendasImportadas(slug: string): Promise<{ lote: Lote; vendas: Venda[] }[]> {
  const lotes = (await getLotes(slug)).filter((l) => l.tipo === 'vendas' && !l.desfeitoEm);
  return Promise.all(
    lotes.map(async (lote) => ({
      lote,
      vendas: (await ler<unknown[]>(chave(slug, `vendas/${lote.id}.json`), [])).flatMap((v) => {
        const r = vendaSchema.safeParse(v);
        return r.success ? [r.data] : [];
      }),
    })),
  );
}

export interface Agregado {
  produtoId: string;
  canalId: string;
  quantidade: number;
  receita: number;
  canceladas: number;
}

export interface Cobertura {
  canalId: string;
  /** Último dia com dado de venda desse canal (null = nenhum). */
  ultimoDia: string | null;
  origem: 'painel' | 'importado';
}

export interface VendasPeriodo {
  inicio: string;
  fim: string;
  dias: number;
  linhas: Agregado[];
  /** Pedidos do painel no período (atendimentos), quando o canal painel existe. */
  pedidosPainel: number;
  cobertura: Cobertura[];
  /** Linhas importadas que cruzam o período só em parte: ficam fora, para não inventar o rateio. */
  parciaisForaDaConta: number;
}

export function dias(inicio: string, fim: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(`${inicio}T12:00:00Z`); t <= Date.parse(`${fim}T12:00:00Z`) && out.length < 400; t += 86_400_000) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}

/**
 * Vendas de um período (dias inclusivos): pedidos do painel (canal "painel") somados aos lotes importados
 * que caem inteiros no período. Período sem dado é "sem dado", nunca zero: veja `cobertura`.
 */
export async function vendasDoPeriodo(slug: string, inicio: string, fim: string, now = new Date()): Promise<VendasPeriodo> {
  if (inicio > fim) throw new DadosError('O início vem depois do fim.');
  const listaDias = dias(inicio, fim);
  const hojeDia = hoje(now);
  const perfil = await getPerfil(slug);
  const temPainel = perfil.canais.some((c) => c.id === CANAL_PAINEL);
  const mapa = new Map<string, Agregado>();
  const somar = (produtoId: string, canalId: string, q: number, r: number, c: number) => {
    const k = `${produtoId}|${canalId}`;
    const a = mapa.get(k) ?? { produtoId, canalId, quantidade: 0, receita: 0, canceladas: 0 };
    a.quantidade += q;
    a.receita += r;
    a.canceladas += c;
    mapa.set(k, a);
  };
  let pedidosPainel = 0;
  const cobertura: Cobertura[] = [];
  if (temPainel && inicio <= hojeDia) {
    const atras = diasEntre(inicio, hojeDia) + 1;
    const resumos = (await summariesForDays(slug, Math.min(atras, 400), now)).filter((d) => d.day >= inicio && d.day <= fim);
    let ultimo: string | null = null;
    for (const d of resumos) {
      pedidosPainel += d.orders;
      if (d.orders) ultimo = d.day;
      for (const [id, p] of Object.entries(d.products)) somar(id, CANAL_PAINEL, p.quantity, Object.values(p.revenue).reduce((s, v) => s + v, 0), 0);
    }
    cobertura.push({ canalId: CANAL_PAINEL, ultimoDia: ultimo, origem: 'painel' });
  }
  let parciais = 0;
  const ultimoPorCanal = new Map<string, string>();
  for (const { vendas } of await vendasImportadas(slug)) {
    for (const v of vendas) {
      if (v.fim > (ultimoPorCanal.get(v.canalId) ?? '')) ultimoPorCanal.set(v.canalId, v.fim);
      if (v.inicio >= inicio && v.fim <= fim) somar(v.produtoId, v.canalId, v.quantidade, v.receita, v.canceladas);
      else if (v.inicio <= fim && v.fim >= inicio) parciais++;
    }
  }
  for (const c of perfil.canais) {
    if (c.id === CANAL_PAINEL) continue;
    cobertura.push({ canalId: c.id, ultimoDia: ultimoPorCanal.get(c.id) ?? null, origem: 'importado' });
  }
  return { inicio, fim, dias: listaDias.length, linhas: [...mapa.values()], pedidosPainel, cobertura, parciaisForaDaConta: parciais };
}

/** Grava as linhas de um lote de vendas já conferido. */
export async function gravarVendas(slug: string, loteId: string, vendas: Venda[]) {
  await storage().writeJSON(chave(slug, `vendas/${loteId}.json`), vendas.map((v) => vendaSchema.parse(v)), null);
}

/** Todas as linhas de venda ativas (para detectar repetição na importação). */
export async function chavesDeVendas(slug: string): Promise<Set<string>> {
  const out = new Set<string>();
  for (const { vendas } of await vendasImportadas(slug)) for (const v of vendas) out.add(`${v.produtoId}|${v.canalId}|${v.inicio}|${v.fim}`);
  return out;
}

/** Etapas do cadastro feitas: marcadas pelo dono ou já cumpridas pelos dados (ex.: custos da ficha da Growlift). */
export function etapasFeitas(ctx: Contexto): Record<string, boolean> {
  const e = { ...ctx.perfil.etapas };
  if (ctx.produtos.some((p) => custoVigente(ctx.custos, ctx.ficha, p.id, ctx.dia, ctx.perfil.custoValidadeDias)?.ingredientes != null)) e.custos = true;
  if (ctx.perfil.prioritarios.length) e.produtos = true;
  if (ctx.perfil.canais.length) e.canais = true;
  if (ctx.perfil.canais.some((c) => c.id === CANAL_PAINEL)) e.vendas = true;
  return e;
}

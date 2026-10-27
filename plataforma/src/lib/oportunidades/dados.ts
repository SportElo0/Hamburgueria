import 'server-only';
import { z } from 'zod';
import { ConflictError, storage } from '../storage';
import { count, dayWindow, take } from '../limits';
import { buscarTexto, detalhesDoLugar, type LugarAoVivo } from './places';
import { checarLink, type Checagem } from './site';
import {
  CATEGORIA_IDS,
  FONTE_IDS,
  FONTES_MINIMAS,
  MAX_PAGINAS,
  PLACE_ID,
  SEGMENTO_IDS,
  SITUACAO_IDS,
  VERIFICACAO_IDS,
  estimar,
  naCidade,
  segmento,
  textoDaBusca,
  type Estimativa,
  type Lead,
  type Pesquisa,
  type Sku,
} from './regras';

/**
 * Lead Finder storage and the paid calls. Two documents: oportunidades/lugares.json (place ID → the team's findings)
 * and oportunidades/pesquisas.json (the search log). Every paid call first takes one unit from this month's counter,
 * so the monthly cap holds even with two people searching at once.
 */

const LUGARES = 'oportunidades/lugares.json';
const PESQUISAS = 'oportunidades/pesquisas.json';
const MAX_PESQUISAS_GUARDADAS = 300;

export class LeadError extends Error {}

const mes = (d: Date) => dayWindow(d).slice(0, 7);

/** An unset or blank variable means the default, never zero. */
const inteiro = (nome: string, padrao: number) => {
  const raw = process.env[nome]?.trim();
  const n = Number(raw);
  return raw && Number.isInteger(n) && n >= 0 ? n : padrao;
};

/**
 * This panel's own monthly caps. The defaults stay under Google's free calls (1,000 a month per Enterprise SKU),
 * so the panel alone cannot run up a bill; raising them is a decision for whoever pays.
 */
export const limites = (): Record<Sku, number> => ({
  busca: inteiro('LEADS_LIMITE_BUSCAS_MES', 200),
  detalhes: inteiro('LEADS_LIMITE_DETALHES_MES', 300),
});

/** Business phone numbers are shown (never saved) only when LEADS_MOSTRAR_TELEFONE=sim. */
export const telefoneLiberado = () => process.env.LEADS_MOSTRAR_TELEFONE === 'sim';
export const chaveConfigurada = () => Boolean(process.env.GOOGLE_MAPS_API_KEY);

export async function usoDoMes(now = new Date()): Promise<Record<Sku, number>> {
  const m = mes(now);
  const [busca, detalhes] = await Promise.all([count('places', 'busca', m), count('places', 'detalhes', m)]);
  return { busca, detalhes };
}

export const pesquisaSchema = z.object({
  cidade: z.string().trim().min(2, 'Informe a cidade.').max(60),
  uf: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, 'Informe a UF com duas letras.'),
  bairro: z.string().trim().max(60).default(''),
  segmento: z.enum(SEGMENTO_IDS),
  paginas: z.coerce.number().int().min(1).max(MAX_PAGINAS),
});
export type PesquisaInput = z.input<typeof pesquisaSchema>;

function lerPesquisa(raw: unknown) {
  const parsed = pesquisaSchema.safeParse(raw);
  if (!parsed.success) throw new LeadError(parsed.error.issues[0]?.message || 'Confira os campos da pesquisa.');
  return parsed.data;
}

/** The most this search can cost: one call per page asked for. */
export async function estimarPesquisa(raw: unknown, now = new Date()): Promise<Estimativa> {
  const input = lerPesquisa(raw);
  const uso = await usoDoMes(now);
  return estimar('busca', input.paginas, uso.busca, limites().busca);
}

/** A row of the result screen: Google's data for this one screen only, plus our own reading of it. */
export interface LinhaAoVivo extends LugarAoVivo, Checagem {
  novo: boolean;
}

export interface Resultado {
  pesquisa: Pesquisa;
  linhas: LinhaAoVivo[];
}

async function atualizar<T>(key: string, vazio: T, fn: (atual: T) => T): Promise<T> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const doc = await storage().readJSON<T>(key);
    const novo = fn(doc?.data ?? vazio);
    try {
      await storage().writeJSON(key, novo, doc ? doc.etag : null);
      return novo;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 5) throw err;
    }
  }
  throw new ConflictError();
}

async function emLotes<T, R>(itens: T[], tamanho: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < itens.length; i += tamanho) out.push(...(await Promise.all(itens.slice(i, i + tamanho).map(fn))));
  return out;
}

export interface Opcoes {
  now?: Date;
  /** The website check; tests swap it for one that does not touch the network. */
  checar?: (site: string | undefined) => Promise<Checagem>;
}

/**
 * Runs an approved search. `aprovadas` is the number of calls the person saw in the estimate and approved;
 * if the search would need more (or the month's cap has no room), nothing is called.
 */
export async function executarPesquisa(raw: unknown, aprovadas: number, por: string, { now = new Date(), checar = checarLink }: Opcoes = {}): Promise<Resultado> {
  const input = lerPesquisa(raw);
  if (!chaveConfigurada()) throw new LeadError('A chave GOOGLE_MAPS_API_KEY não está configurada na Vercel. Veja plataforma/LEAD-FINDER.md.');
  const est = await estimarPesquisa(input, now);
  if (!Number.isInteger(aprovadas) || aprovadas < est.chamadas) throw new LeadError('Aprove a estimativa de custo antes de pesquisar.');
  if (!est.cabe) throw new LeadError(`Esta pesquisa passaria do limite do mês (${est.limiteMes} buscas). Espere o mês virar ou aumente LEADS_LIMITE_BUSCAS_MES.`);

  const seg = segmento(input.segmento);
  const textQuery = textoDaBusca(input.segmento, input.cidade, input.uf, input.bairro);
  const telefone = telefoneLiberado();
  const m = mes(now);
  const vistos = new Map<string, LugarAoVivo>();
  let chamadas = 0;
  let pageToken: string | undefined;
  for (let pagina = 0; pagina < input.paginas; pagina++) {
    if (!(await take('places', 'busca', limites().busca, m))) break;
    chamadas++;
    const res = await buscarTexto({ textQuery, includedType: seg.tipo, pageToken }, telefone);
    // The same place can come back on two pages; the place ID is the key.
    for (const l of res.lugares) if (!vistos.has(l.id)) vistos.set(l.id, l);
    if (!res.proxima) break;
    pageToken = res.proxima;
  }

  const todos = [...vistos.values()];
  const naRegiao = todos.filter((l) => naCidade(l.endereco, input.cidade, input.uf));
  const checagens = await emLotes(naRegiao, 4, (l) =>
    l.fechado ? Promise.resolve<Checagem>({ categoria: 'incerta', sinais: ['O Google marca como fechado definitivamente.'] }) : checar(l.site),
  );

  // A place whose own site works is not a lead: it is counted, not listed or kept.
  const alvos = naRegiao.map((l, i) => ({ l, c: checagens[i] })).filter(({ c }) => c.categoria !== 'site-proprio');
  const agora = now.toISOString();
  const pesquisaId = `${dayWindow(now).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 8)}`;
  let novos = 0;
  const marcados: boolean[] = [];
  await atualizar<Record<string, Lead>>(LUGARES, {}, (atual) => {
    const lista = { ...atual };
    novos = 0;
    marcados.length = 0;
    alvos.forEach(({ l, c }) => {
      const antes = lista[l.id];
      marcados.push(!antes);
      if (!antes) {
        novos++;
        lista[l.id] = {
          placeId: l.id,
          cidade: input.cidade,
          uf: input.uf,
          bairro: input.bairro,
          segmento: input.segmento,
          categoria: c.categoria,
          categoriaRevisada: false,
          sinais: c.sinais,
          checadoEm: agora,
          verificacao: { situacao: 'pendente', fontes: [], links: '' },
          observacoes: '',
          situacao: 'nova',
          criadoEm: agora,
          pesquisaId,
        };
      } else {
        // A repeat refreshes the automatic reading, unless the team already decided the category.
        lista[l.id] = { ...antes, sinais: c.sinais, checadoEm: agora, ...(antes.categoriaRevisada ? {} : { categoria: c.categoria }) };
      }
    });
    return lista;
  });

  const pesquisa: Pesquisa = {
    id: pesquisaId,
    em: agora,
    por,
    cidade: input.cidade,
    uf: input.uf,
    bairro: input.bairro,
    segmento: input.segmento,
    chamadas,
    encontrados: naRegiao.length,
    novos,
    repetidos: alvos.length - novos,
    foraDaCidade: todos.length - naRegiao.length,
    comSite: naRegiao.length - alvos.length,
  };
  await atualizar<Pesquisa[]>(PESQUISAS, [], (lista) => [pesquisa, ...lista].slice(0, MAX_PESQUISAS_GUARDADAS));
  return { pesquisa, linhas: alvos.map(({ l, c }, i) => ({ ...l, ...c, novo: marcados[i] })) };
}

/** Google's current data for one place, for the review screen. Counted against the month's cap; never stored. */
export async function verAoVivo(placeId: string, now = new Date()): Promise<LugarAoVivo> {
  if (!PLACE_ID.test(placeId)) throw new LeadError('Identificador de lugar inválido.');
  if (!chaveConfigurada()) throw new LeadError('A chave GOOGLE_MAPS_API_KEY não está configurada na Vercel.');
  if (!(await take('places', 'detalhes', limites().detalhes, mes(now)))) throw new LeadError(`O limite do mês para consultar lugares (${limites().detalhes}) acabou.`);
  return detalhesDoLugar(placeId, telefoneLiberado());
}

export const revisaoSchema = z.object({
  categoria: z.enum(CATEGORIA_IDS),
  situacao: z.enum(SITUACAO_IDS),
  observacoes: z.string().trim().max(1000).default(''),
  verificacao: z.object({
    situacao: z.enum(VERIFICACAO_IDS),
    fontes: z.array(z.enum(FONTE_IDS)).max(FONTE_IDS.length),
    links: z.string().trim().max(600).default(''),
  }),
});
export type RevisaoInput = z.input<typeof revisaoSchema>;

/** The team's review of one place. "Sem website" is only confirmed after enough other sources were checked. */
export async function revisar(placeId: string, raw: unknown, por: string, now = new Date()): Promise<Lead> {
  if (!PLACE_ID.test(placeId)) throw new LeadError('Lugar não encontrado.');
  const parsed = revisaoSchema.safeParse(raw);
  if (!parsed.success) throw new LeadError(parsed.error.issues[0]?.message || 'Confira a revisão.');
  const r = parsed.data;
  const fontes = [...new Set(r.verificacao.fontes)];
  if (r.verificacao.situacao === 'confirmado' && r.categoria === 'sem-site' && fontes.length < FONTES_MINIMAS)
    throw new LeadError(`Para confirmar "sem website", marque pelo menos ${FONTES_MINIMAS} fontes que vocês consultaram.`);
  if (r.verificacao.situacao === 'encontrou-site' && r.categoria === 'sem-site') throw new LeadError('Se acharam um site, mude a categoria (website próprio ou com problemas).');
  let salvo: Lead | undefined;
  await atualizar<Record<string, Lead>>(LUGARES, {}, (atual) => {
    const antes = Object.hasOwn(atual, placeId) ? atual[placeId] : undefined;
    if (!antes) throw new LeadError('Lugar não encontrado.');
    const mudouVerificacao = r.verificacao.situacao !== antes.verificacao.situacao || fontes.join() !== antes.verificacao.fontes.join() || r.verificacao.links !== antes.verificacao.links;
    salvo = {
      ...antes,
      categoria: r.categoria,
      categoriaRevisada: antes.categoriaRevisada || r.categoria !== antes.categoria,
      situacao: r.situacao,
      observacoes: r.observacoes,
      verificacao: mudouVerificacao ? { situacao: r.verificacao.situacao, fontes, links: r.verificacao.links, em: now.toISOString(), por } : antes.verificacao,
    };
    return { ...atual, [placeId]: salvo };
  });
  return salvo!;
}

export async function listarLeads(): Promise<Lead[]> {
  const doc = await storage().readJSON<Record<string, Lead>>(LUGARES);
  return Object.values(doc?.data ?? {}).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm) || a.placeId.localeCompare(b.placeId));
}

export async function listarPesquisas(): Promise<Pesquisa[]> {
  return (await storage().readJSON<Pesquisa[]>(PESQUISAS))?.data ?? [];
}

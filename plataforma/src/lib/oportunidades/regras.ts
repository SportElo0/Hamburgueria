/**
 * Growlift Lead Finder: the rules that need no server, shared by the panel and the tests.
 * The categories, what a search costs on Google's price list, how the link on a Google listing
 * is read, and the CSV the team exports. Setup, costs and the Google terms: plataforma/LEAD-FINDER.md.
 */

export const CATEGORIAS = [
  { id: 'sem-site', nome: 'Sem website cadastrado', explica: 'O perfil no Google não tem site. Antes de concluir que não existe, confira em outras fontes.' },
  { id: 'so-rede-social', nome: 'Apenas rede social', explica: 'O link do perfil leva a Instagram, Facebook, Linktree, WhatsApp ou app de pedidos.' },
  { id: 'site-proprio', nome: 'Website próprio', explica: 'Tem site próprio e ele passou na checagem automática.' },
  { id: 'site-com-problemas', nome: 'Website com problemas identificados', explica: 'Tem site, mas a checagem achou falhas: não abre, sem cadeado (HTTPS), sem versão para celular etc.' },
  { id: 'incerta', nome: 'Situação incerta', explica: 'A checagem não conseguiu concluir. Conferir à mão.' },
] as const;
export type Categoria = (typeof CATEGORIAS)[number]['id'];
export const CATEGORIA_IDS = CATEGORIAS.map((c) => c.id) as [Categoria, ...Categoria[]];
export const nomeCategoria = (id: Categoria) => CATEGORIAS.find((c) => c.id === id)?.nome ?? id;

/**
 * The niches worth searching, grouped by the plan that fits them (see LEAD-FINDER.md, "Nichos").
 * `tipo`: the Google place type that steers the search (Table A of the place types). Where Brazilian places are
 * tagged unevenly (confeitaria spans cake_shop/confectionery/pastry_shop; açaí, marmita, pousada and boat tours
 * come under several types), it stays undefined and the words alone steer the search.
 */
export const SEGMENTOS = [
  // Pedido e Pix no site (plano Lift): delivery and take-away, where the apps' commission hurts most
  { id: 'restaurantes', nome: 'Restaurantes', termo: 'restaurante', tipo: 'restaurant', grupo: 'Pedido e Pix no site' },
  { id: 'pizzarias', nome: 'Pizzarias', termo: 'pizzaria', tipo: 'pizza_restaurant', grupo: 'Pedido e Pix no site' },
  { id: 'hamburguerias', nome: 'Hamburguerias', termo: 'hamburgueria', tipo: 'hamburger_restaurant', grupo: 'Pedido e Pix no site' },
  { id: 'japoneses', nome: 'Japonês e sushi', termo: 'restaurante japonês sushi', tipo: 'japanese_restaurant', grupo: 'Pedido e Pix no site' },
  { id: 'acai', nome: 'Açaí', termo: 'açaí', tipo: undefined, grupo: 'Pedido e Pix no site' },
  { id: 'marmitarias', nome: 'Marmitarias', termo: 'marmitaria', tipo: undefined, grupo: 'Pedido e Pix no site' },
  { id: 'adegas', nome: 'Adegas e bebidas', termo: 'adega distribuidora de bebidas', tipo: 'liquor_store', grupo: 'Pedido e Pix no site' },
  { id: 'padarias', nome: 'Padarias', termo: 'padaria', tipo: 'bakery', grupo: 'Pedido e Pix no site' },
  { id: 'confeitarias', nome: 'Confeitarias', termo: 'confeitaria', tipo: undefined, grupo: 'Pedido e Pix no site' },
  { id: 'sorveterias', nome: 'Sorveterias', termo: 'sorveteria', tipo: 'ice_cream_shop', grupo: 'Pedido e Pix no site' },
  // Site, Google e WhatsApp (Start e Grow): services booked by message
  { id: 'barbearias', nome: 'Barbearias', termo: 'barbearia', tipo: 'barber_shop', grupo: 'Serviços com horário' },
  { id: 'saloes', nome: 'Salões de beleza', termo: 'salão de beleza', tipo: 'beauty_salon', grupo: 'Serviços com horário' },
  { id: 'petshops', nome: 'Pet shops', termo: 'pet shop banho e tosa', tipo: 'pet_store', grupo: 'Serviços com horário' },
  // Litoral: tourists search on the phone before they arrive
  { id: 'pousadas', nome: 'Pousadas', termo: 'pousada', tipo: undefined, grupo: 'Turismo no litoral' },
  { id: 'passeios', nome: 'Passeios de barco', termo: 'passeio de barco', tipo: undefined, grupo: 'Turismo no litoral' },
] as const;
export const GRUPOS_SEGMENTO = [...new Set(SEGMENTOS.map((s) => s.grupo))];
export type Segmento = (typeof SEGMENTOS)[number]['id'];
export const SEGMENTO_IDS = SEGMENTOS.map((s) => s.id) as [Segmento, ...Segmento[]];
export const segmento = (id: Segmento) => SEGMENTOS.find((s) => s.id === id) ?? SEGMENTOS[0];

/**
 * Beach destinations for restaurants. Several are beaches (bairros) of a bigger city: Google writes their
 * addresses as "…, Maresias, São Sebastião - SP", so the search keeps the real city and puts the beach in the
 * bairro, or every result would be dropped by the city check.
 */
export const LUGARES = [
  { nome: 'Ilhabela', cidade: 'Ilhabela', uf: 'SP', bairro: '' },
  { nome: 'Maresias', cidade: 'São Sebastião', uf: 'SP', bairro: 'Maresias' },
  { nome: 'Praia da Baleia', cidade: 'São Sebastião', uf: 'SP', bairro: 'Baleia' },
  { nome: 'Fernando de Noronha', cidade: 'Fernando de Noronha', uf: 'PE', bairro: '' },
] as const;
export const CIDADES_SUGERIDAS = [...new Set(LUGARES.map((l) => l.cidade))];

/** A beach typed in the city field ("Maresias", "baleia") becomes its real city + bairro. */
export function lugarPeloNome(texto: string) {
  const t = sem(texto).trim().replace(/^praia d[aoe]s? /, '');
  if (!t) return undefined;
  return LUGARES.find((l) => sem(l.nome).replace(/^praia d[aoe]s? /, '') === t || sem(l.bairro) === t);
}

export const SITUACOES = [
  { id: 'nova', nome: 'Nova' },
  { id: 'boa', nome: 'Boa oportunidade' },
  { id: 'descartada', nome: 'Descartada' },
  { id: 'nao-contatar', nome: 'Não contatar' },
] as const;
export type Situacao = (typeof SITUACOES)[number]['id'];
export const SITUACAO_IDS = SITUACOES.map((s) => s.id) as [Situacao, ...Situacao[]];

/** Public sources the team checks by hand before concluding a business has no website. */
export const FONTES = [
  { id: 'busca-google', nome: 'Busca no Google pelo nome e a cidade' },
  { id: 'instagram', nome: 'Instagram do negócio (link da bio)' },
  { id: 'facebook', nome: 'Facebook do negócio' },
  { id: 'app-pedidos', nome: 'iFood ou outro app de pedidos/agendamento' },
  { id: 'registro-br', nome: 'Registro.br (domínio com o nome do negócio)' },
] as const;
export type Fonte = (typeof FONTES)[number]['id'];
export const FONTE_IDS = FONTES.map((f) => f.id) as [Fonte, ...Fonte[]];
/** How many sources must be checked before "sem website" counts as confirmed. */
export const FONTES_MINIMAS = 2;

export const VERIFICACOES = [
  { id: 'pendente', nome: 'Não verificado' },
  { id: 'confirmado', nome: 'Confirmado em fontes públicas' },
  { id: 'encontrou-site', nome: 'Achamos um site em outra fonte' },
] as const;
export type Verificacao = (typeof VERIFICACOES)[number]['id'];
export const VERIFICACAO_IDS = VERIFICACOES.map((v) => v.id) as [Verificacao, ...Verificacao[]];

/**
 * One business in the list. Holds only the Google place ID (which the terms let us keep) and the team's
 * own work: the search that found it, the category, the check results, the hand verification and notes.
 * Name, address, phone and website from Google are never stored; the panel fetches them live when asked.
 */
export interface Lead {
  placeId: string;
  cidade: string;
  uf: string;
  bairro: string;
  segmento: Segmento;
  categoria: Categoria;
  /** The team changed the category by hand; later searches no longer overwrite it. */
  categoriaRevisada: boolean;
  /** What the automatic check saw, in plain words. */
  sinais: string[];
  checadoEm: string;
  verificacao: { situacao: Verificacao; fontes: Fonte[]; links: string; em?: string; por?: string };
  observacoes: string;
  situacao: Situacao;
  criadoEm: string;
  pesquisaId: string;
}

export interface Pesquisa {
  id: string;
  em: string;
  por: string;
  cidade: string;
  uf: string;
  bairro: string;
  segmento: Segmento;
  chamadas: number;
  encontrados: number;
  novos: number;
  repetidos: number;
  foraDaCidade: number;
  /** Places whose own site passed the check: not leads, so neither listed nor kept (older searches lack it). */
  comSite?: number;
}

/**
 * Google's price list (first volume tier, USD per 1,000 calls) and the free calls per month for each SKU.
 * Source: developers.google.com/maps/billing-and-pricing/pricing, checked 2026-10-26.
 * The search asks for websiteUri, which puts every call in the Enterprise tier.
 */
export const SKUS = {
  busca: { nome: 'Text Search Enterprise', usdPor1000: 35, gratisPorMes: 1000 },
  detalhes: { nome: 'Place Details Enterprise', usdPor1000: 20, gratisPorMes: 1000 },
} as const;
export type Sku = keyof typeof SKUS;

export interface Estimativa {
  sku: string;
  chamadas: number;
  usadasNoMes: number;
  limiteMes: number;
  gratisRestantes: number;
  pagas: number;
  usd: number;
  /** The panel's own monthly cap still leaves room for every call. */
  cabe: boolean;
}

/** Worst case: every page is requested. `usadasNoMes` counts only this panel's calls. */
export function estimar(sku: Sku, chamadas: number, usadasNoMes: number, limiteMes: number): Estimativa {
  const s = SKUS[sku];
  const gratisRestantes = Math.max(0, s.gratisPorMes - usadasNoMes);
  const pagas = Math.max(0, chamadas - gratisRestantes);
  return {
    sku: s.nome,
    chamadas,
    usadasNoMes,
    limiteMes,
    gratisRestantes,
    pagas,
    usd: Math.round(((pagas * s.usdPor1000) / 1000) * 100) / 100,
    cabe: usadasNoMes + chamadas <= limiteMes,
  };
}

/** Text Search returns at most 20 places a page and 60 in all. */
export const MAX_PAGINAS = 3;

export function textoDaBusca(seg: Segmento, cidade: string, uf: string, bairro: string) {
  return `${segmento(seg).termo} em ${bairro ? `${bairro}, ` : ''}${cidade} - ${uf}`;
}

const sem = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
/** Brazilian addresses from Google end in "…, Ilhabela - SP, 11630-000, Brasil". */
export const naCidade = (endereco: string, cidade: string, uf: string) => sem(endereco).includes(sem(`${cidade} - ${uf}`));

const REDES: [string, string][] = [
  ['instagram.com', 'Instagram'],
  ['facebook.com', 'Facebook'],
  ['fb.com', 'Facebook'],
  ['fb.me', 'Facebook'],
  ['tiktok.com', 'TikTok'],
  ['youtube.com', 'YouTube'],
  ['x.com', 'X (Twitter)'],
  ['twitter.com', 'X (Twitter)'],
  ['linktr.ee', 'Linktree'],
  ['beacons.ai', 'Beacons'],
  ['bio.link', 'Bio.link'],
  ['taplink.cc', 'Taplink'],
  ['linkin.bio', 'Linkin.bio'],
  ['wa.me', 'WhatsApp'],
  ['whatsapp.com', 'WhatsApp'],
  ['ifood.com.br', 'iFood'],
  ['aiqfome.com', 'aiqfome'],
  ['anota.ai', 'Anota AI'],
  ['goomer.app', 'Goomer'],
  ['menudino.com', 'MenuDino'],
  ['booksy.com', 'Booksy'],
  ['trinks.com', 'Trinks'],
];

/** Which social network or third-party page a host belongs to, if any. */
export function redeDoHost(host: string): string | undefined {
  const h = host.toLowerCase().replace(/\.$/, '');
  return REDES.find(([d]) => h === d || h.endsWith(`.${d}`))?.[1];
}

export type Link = { tipo: 'nenhum' } | { tipo: 'invalido' } | { tipo: 'rede'; rede: string } | { tipo: 'site'; url: URL };

/** Reads the website link on a Google listing. */
export function lerLink(raw: string | undefined): Link {
  if (!raw?.trim()) return { tipo: 'nenhum' };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `http://${raw.trim()}`);
  } catch {
    return { tipo: 'invalido' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { tipo: 'invalido' };
  const rede = redeDoHost(url.hostname);
  return rede ? { tipo: 'rede', rede } : { tipo: 'site', url };
}

/** Official Maps URL that opens a place from its ID alone (developers.google.com/maps/documentation/urls). */
export const linkMaps = (placeId: string) => `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${encodeURIComponent(placeId)}`;

/**
 * WhatsApp link for a Brazilian mobile number as Google shows it ("(12) 99123-4567"); landlines get none.
 * Built on screen from the live phone, never stored.
 */
export function linkWhatsApp(telefone: string | undefined): string | undefined {
  const d = (telefone ?? '').replace(/\D/g, '').replace(/^0/, '');
  return /^[1-9]{2}9\d{8}$/.test(d) ? `https://wa.me/55${d}` : undefined;
}

/** Call link for a Brazilian landline (area code + 8 digits); anything else gets no link. */
export function linkLigar(telefone: string | undefined): string | undefined {
  const d = (telefone ?? '').replace(/\D/g, '').replace(/^0/, '');
  return /^[1-9]{2}[2-5]\d{7}$/.test(d) ? `tel:+55${d}` : undefined;
}

export const PLACE_ID = /^[A-Za-z0-9_-]{10,300}$/;

/** Excel in Brazil reads `;` and needs the BOM for accents. Cells that start like a formula are defused. */
export function csv(linhas: (string | number)[][]): string {
  const cel = (v: string | number) => {
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  return `﻿${linhas.map((l) => l.map(cel).join(';')).join('\r\n')}\r\n`;
}

const dataBR = (iso?: string) => (iso ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short' }).format(new Date(iso)) : '');

/** The export: the team's own findings keyed by place ID, with no Google content (names, addresses, phones, sites). */
export function linhasCsv(leads: Lead[]): (string | number)[][] {
  const fonteNome = (id: Fonte) => FONTES.find((f) => f.id === id)?.nome ?? id;
  return [
    ['place_id', 'abrir_no_google_maps', 'cidade', 'uf', 'bairro_pesquisado', 'segmento', 'categoria', 'categoria_revisada', 'o_que_a_checagem_viu', 'checado_em', 'verificacao_manual', 'fontes_consultadas', 'links_das_fontes', 'verificado_em', 'verificado_por', 'observacoes', 'situacao', 'primeira_pesquisa'],
    ...leads.map((l) => [
      l.placeId,
      linkMaps(l.placeId),
      l.cidade,
      l.uf,
      l.bairro,
      segmento(l.segmento).nome,
      nomeCategoria(l.categoria),
      l.categoriaRevisada ? 'sim' : 'não',
      l.sinais.join(' | '),
      dataBR(l.checadoEm),
      VERIFICACOES.find((v) => v.id === l.verificacao.situacao)?.nome ?? '',
      l.verificacao.fontes.map(fonteNome).join(' | '),
      l.verificacao.links,
      dataBR(l.verificacao.em),
      l.verificacao.por ?? '',
      l.observacoes,
      SITUACOES.find((s) => s.id === l.situacao)?.nome ?? '',
      dataBR(l.criadoEm),
    ]),
  ];
}

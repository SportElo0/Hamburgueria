import 'server-only';
import { abrirPagina, checarSite, type Abertura } from '../oportunidades/site';
import { limites, listarLeads, telefoneLiberado, usoDoMes, verAoVivo } from '../oportunidades/dados';
import { estimar, linkWhatsApp, redeDoHost, type Estimativa } from '../oportunidades/regras';
import type { LugarAoVivo } from '../oportunidades/places';
import { DOMINIOS_PUBLICOS, normalizarEmail, type Contato, type SugestaoContato } from './regras';
import { VendasError, completarContato, listarContatos, salvarSugestao } from './dados';

/**
 * "Buscar contatos nos sites": for imported contacts whose business has its own website, read that website (home page
 * and up to two contact pages) and suggest the name it gives itself and a business e-mail published there, with the
 * link of the page. The website address comes from one live Place Details call (shown, counted and priced before the
 * click) and is never stored unless it is the page where the e-mail was found. Nothing is sent; a person confirms.
 */

const CATEGORIAS_COM_SITE = new Set(['site-proprio', 'site-com-problemas', 'incerta']);
/** Per click: each contact may take up to ~25 s (three page visits), three at a time, inside the page's 60 s. */
export const MAX_POR_VEZ = 6;
const PARALELO = 3;
const TEMPO_POR_CONTATO_MS = 25_000;

const LIXO_DOMINIO = /(^|\.)(example\.(com|org)|sentry\.io|sentry-next\.wixpress\.com|wixpress\.com|domain\.com|email\.com|seudominio\.com(\.br)?|seuemail\.com|godaddy\.com|wordpress\.(com|org)|w3\.org|schema\.org)$/i;
const LIXO_USUARIO = /^(no-?reply|nao-?responda|noreply|donotreply|mailer-daemon|postmaster|privacidade|lgpd|dpo|abuse|webmaster|wordpress|admin)$/i;
const EXTENSAO = /\.(png|jpe?g|gif|webp|svg|js|css|ico|avif)$/i;

/** The registrable part of a host, good enough for Brazilian and .com sites (a.b.com.br → b.com.br). */
export function dominioBase(host: string): string {
  const h = host.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
  const p = h.split('.');
  const n = /\.(com|net|org|art|blog|eco|ind|inf|adv|med|odo|psi|tur|rest|arq|eng|edu|gov)\.br$/.test(h) ? 3 : 2;
  return p.slice(-n).join('.');
}

export interface Extraido {
  nome?: string;
  emails: string[];
  contatos: URL[];
}

const decodificar = (s: string) => s.replace(/&#64;|&#x40;|%40/gi, '@').replace(/&amp;/g, '&').replace(/&#46;|&#x2e;/gi, '.');

/** What a page says about itself: its name, the e-mails it publishes and its contact pages (same site only). */
export function extrairDaPagina(html: string, url: URL): Extraido {
  const h = decodificar(html.slice(0, 400_000));
  const brutos = new Set<string>();
  for (const m of h.matchAll(/mailto:([^"'?\s>]+)/gi)) brutos.add(m[1]);
  for (const m of h.matchAll(/[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,120}\.[a-z]{2,24}/gi)) brutos.add(m[0]);
  const emails = [...brutos]
    .map((e) => normalizarEmail(e.replace(/^mailto:/i, '')))
    .filter((e) => /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(e))
    .filter((e) => {
      const [u, d] = e.split('@');
      return !EXTENSAO.test(e) && !LIXO_DOMINIO.test(d) && !LIXO_USUARIO.test(u) && !/^\d+x$/.test(d.split('.')[0]);
    });

  const og = /<meta[^>]+property=["']og:site_name["'][^>]*content=["']([^"']{2,80})["']/i.exec(h)?.[1] ?? /<meta[^>]+content=["']([^"']{2,80})["'][^>]*property=["']og:site_name["']/i.exec(h)?.[1];
  const titulo = /<title[^>]*>([^<]{2,200})<\/title>/i.exec(h)?.[1];
  const candidato = (og ?? titulo?.split(/\s+[|–—·:-]\s+/)[0] ?? '').replace(/\s+/g, ' ').trim();
  const nome = candidato && !/^(home|in[ií]cio|index|site|p[aá]gina inicial|welcome|bem-vindo|untitled)$/i.test(candidato) && candidato.length <= 80 ? candidato : undefined;

  const contatos: URL[] = [];
  for (const m of h.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi)) {
    const [, href, texto] = m;
    if (!/contato|contact|fale|atendimento|sobre|quem-somos|about/i.test(`${href} ${texto.replace(/<[^>]+>/g, '')}`)) continue;
    let u: URL;
    try {
      u = new URL(href, url);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(u.protocol) || dominioBase(u.hostname) !== dominioBase(url.hostname)) continue;
    if (!contatos.some((c) => c.href === u.href) && u.href !== url.href) contatos.push(u);
    if (contatos.length >= 2) break;
  }
  return { nome, emails: [...new Set(emails)], contatos };
}

/** The best e-mail for a business: its own domain first, then a business-looking one; webmail only as a warning. */
export function escolherEmail(emails: string[], site: URL): { email?: string; avisos: string[] } {
  const base = dominioBase(site.hostname);
  const proprios = emails.filter((e) => !DOMINIOS_PUBLICOS.includes(e.split('@')[1]));
  const doSite = proprios.filter((e) => dominioBase(e.split('@')[1]) === base);
  const avisos: string[] = [];
  const preferido = (l: string[]) => l.find((e) => /^(contato|atendimento|sac|comercial|reservas?|pedidos?|delivery|ola|oi)@/.test(e)) ?? l[0];
  if (doSite.length) return { email: preferido(doSite), avisos };
  if (proprios.length) {
    avisos.push('O e-mail tem outro domínio, diferente do site: confira se é mesmo do negócio.');
    return { email: preferido(proprios), avisos };
  }
  return { avisos };
}

export type ResultadoSite = { ok: true; sugestao: Omit<SugestaoContato, 'em'> } | { ok: false; motivo: string };

/** Reads one website: the home page, then up to two contact pages while no e-mail turns up. */
export async function descobrirNoSite(site: URL, abrir = abrirPagina): Promise<ResultadoSite> {
  if (redeDoHost(site.hostname)) return { ok: false, motivo: 'O link do Google leva a uma rede social, não a um site: usar o direct.' };
  let ultima: { url: URL; pagina: Abertura } | null = null;
  const ler = async (u: URL) => {
    ultima = null;
    // The Lead Finder's safe visit (never an internal address, size and time limits, every redirect checked again).
    const c = await checarSite(u, async (url, signal) => {
      const pagina = await abrir(url, signal);
      ultima = { url, pagina };
      return pagina;
    });
    const fim = ultima as { url: URL; pagina: Abertura } | null;
    if (!fim || fim.pagina.status < 200 || fim.pagina.status >= 300) return { checagem: c, url: u, html: '' };
    return { checagem: c, url: fim.url, html: fim.pagina.html };
  };

  const inicio = await ler(site);
  if (!inicio.html) return { ok: false, motivo: inicio.checagem.sinais[0] ?? 'O site não abriu.' };
  const home = extrairDaPagina(inicio.html, inicio.url);
  let todos = home.emails.map((e) => ({ e, url: inicio.url }));
  for (const pagina of home.contatos) {
    if (escolherEmail(todos.map((x) => x.e), inicio.url).email) break;
    const p = await ler(pagina);
    if (p.html) todos = [...todos, ...extrairDaPagina(p.html, p.url).emails.map((e) => ({ e, url: p.url }))];
  }
  const { email, avisos } = escolherEmail(todos.map((x) => x.e), inicio.url);
  if (!email) {
    const webmail = todos.find((x) => DOMINIOS_PUBLICOS.includes(x.e.split('@')[1]));
    return {
      ok: false,
      motivo: webmail
        ? 'O site só mostra e-mail de Gmail, Hotmail ou parecido (costuma ser pessoal): falar por outro canal.'
        : 'Não achei e-mail publicado no site (página inicial e de contato).',
    };
  }
  const fonte = todos.find((x) => x.e === email)!.url;
  if (fonte.protocol !== 'https:') return { ok: false, motivo: 'O site não tem cadeado (HTTPS): conferir e copiar o e-mail à mão.' };
  const nomeAvisos = home.nome ? ['O nome veio do título do site: confira se é o nome do negócio.'] : ['O site não diz o nome do negócio: preencha à mão.'];
  return { ok: true, sugestao: { negocio: home.nome, email, fonteUrl: fonte.href, avisos: [...nomeAvisos, ...avisos] } };
}

const comTempo = <T>(p: Promise<T>, ms: number, falha: T) => Promise.race([p, new Promise<T>((r) => setTimeout(() => r(falha), ms))]);

/**
 * Contacts the button can work on: imported, waiting for qualification, with a website (by the Lead Finder's own
 * reading, so a place Google lists without a site never costs a call), not looked at yet.
 */
export const pendentesDeBusca = (contatos: Contato[], categoriaNoLeadFinder: Record<string, string> = {}) =>
  contatos.filter((c) => c.etapa === 'qualificar' && c.placeId && CATEGORIAS_COM_SITE.has(categoriaNoLeadFinder[c.placeId] ?? c.categoria ?? '') && !c.sugestao && !c.email);

export const categoriasNoLeadFinder = async () => Object.fromEntries((await listarLeads()).map((l) => [l.placeId, l.categoria]));

/** The cost shown before the click: one Place Details call per contact, against the panel's own monthly cap. */
export async function estimarBusca(now = new Date()): Promise<Estimativa & { contatos: number }> {
  const contatos = Math.min(pendentesDeBusca(await listarContatos(), await categoriasNoLeadFinder()).length, MAX_POR_VEZ);
  const uso = await usoDoMes(now);
  return { ...estimar('detalhes', contatos, uso.detalhes, limites().detalhes), contatos };
}

export interface ResumoBusca {
  analisados: number;
  achados: number;
  semEmail: number;
  restantes: number;
}

/**
 * One round of the button. `aprovadas` is the number of Google calls the person saw and accepted: the round never
 * makes more than that (and stops when the monthly cap is reached).
 */
export async function buscarContatosNosSites(aprovadas: number, por: string, opts: { now?: Date; ver?: (placeId: string) => Promise<LugarAoVivo>; abrir?: typeof abrirPagina } = {}): Promise<ResumoBusca> {
  const now = opts.now ?? new Date();
  const ver = opts.ver ?? ((id: string) => verAoVivo(id, now));
  const fila = pendentesDeBusca(await listarContatos(), await categoriasNoLeadFinder());
  const alvo = fila.slice(0, Math.min(MAX_POR_VEZ, Math.max(0, Math.floor(aprovadas))));
  if (!alvo.length) throw new VendasError(fila.length ? 'Confirme o custo antes de buscar.' : 'Nenhum contato com site esperando busca.');
  let achados = 0;
  let semEmail = 0;
  for (let i = 0; i < alvo.length; i += PARALELO) {
    await Promise.all(
      alvo.slice(i, i + PARALELO).map(async (c) => {
        let r: ResultadoSite;
        try {
          const lugar = await ver(c.placeId!);
          let site: URL | null = null;
          try {
            site = lugar.site ? new URL(lugar.site) : null;
          } catch {
            site = null;
          }
          r = site ? await comTempo(descobrirNoSite(site, opts.abrir), TEMPO_POR_CONTATO_MS, { ok: false, motivo: 'O site demorou demais: conferir à mão.' }) : { ok: false, motivo: 'O Google não mostra mais site para este negócio.' };
        } catch (err) {
          // The monthly cap or a Google refusal: keep the contact pending (no suggestion saved) and stop here.
          if (err instanceof Error && /limite do mês|recusou|chave/i.test(err.message)) throw new VendasError(err.message);
          r = { ok: false, motivo: 'Não deu para consultar agora: tentar de novo depois.' };
        }
        if (r.ok) achados++;
        else semEmail++;
        await salvarSugestao(c.id, r.ok ? { em: now.toISOString(), ...r.sugestao } : { em: now.toISOString(), avisos: [], motivo: r.motivo }, por, now);
      }),
    );
  }
  return { analisados: alvo.length, achados, semEmail, restantes: Math.max(0, fila.length - alvo.length) };
}

/** "Confirmar selecionados": each suggestion goes through the same rules as typing it by hand (block list, duplicates, webmail). */
export async function confirmarSugestoes(ids: string[], por: string, now = new Date()) {
  const contatos = new Map((await listarContatos()).map((c) => [c.id, c]));
  const confirmados: string[] = [];
  const falhas: { id: string; erro: string }[] = [];
  for (const id of ids.slice(0, 100)) {
    const c = contatos.get(id);
    const s = c?.sugestao;
    if (!c || !s?.email || !s.fonteUrl || !s.negocio) {
      falhas.push({ id, erro: !s?.negocio && s?.email ? 'Falta o nome: abra o contato e preencha.' : 'Nada para confirmar.' });
      continue;
    }
    try {
      await completarContato(id, { negocio: s.negocio, email: s.email, fonteTipo: 'site', fonteUrl: s.fonteUrl, conferido: true }, por, now);
      confirmados.push(id);
    } catch (err) {
      falhas.push({ id, erro: err instanceof Error ? err.message : 'Não foi possível confirmar.' });
    }
  }
  return { confirmados, falhas };
}

/** The business phone, live from Google for the person about to call (never stored, counted against the monthly cap). */
export async function telefoneAoVivo(c: Contato, now = new Date(), ver = (id: string) => verAoVivo(id, now)) {
  if (!c.placeId) throw new VendasError('Este contato não veio de Oportunidades.');
  if (!telefoneLiberado()) return { liberado: false as const };
  let l: LugarAoVivo;
  try {
    l = await ver(c.placeId);
  } catch (err) {
    // The Lead Finder's own messages (monthly cap, missing key, Google refusal) are already written for the team.
    throw new VendasError(err instanceof Error ? err.message : 'Não deu para consultar o Google agora.');
  }
  return { liberado: true as const, telefone: l.telefone ?? '', whatsapp: linkWhatsApp(l.telefone) ?? '', site: l.site ?? '' };
}

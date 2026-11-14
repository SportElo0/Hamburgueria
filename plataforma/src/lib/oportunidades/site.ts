import 'server-only';
import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { isIP, type LookupFunction } from 'node:net';
import { lerLink, redeDoHost, type Categoria } from './regras';

/**
 * Looks at the website a business lists on Google: one visit to its home page, like a person opening it.
 * No crawling, no other pages, nothing kept from the page itself; only the conclusions in plain words.
 * The link comes from a listing anyone can edit, so the visit never reaches an internal address: the
 * address is checked at the moment of connecting (no gap for a DNS answer to change), on every redirect.
 */

export interface Checagem {
  categoria: Categoria;
  sinais: string[];
}

const AGENTE = 'GrowliftLeadFinder/1.0 (+https://growlift.com.br; checagem unica da pagina inicial)';
const ESPERA_MS = 10_000;
/** The whole check, redirects included. */
const ESPERA_TOTAL_MS = 20_000;
const LENTO_MS = 6_000;
const MAX_BYTES = 400_000;
const MAX_REDIRECIONAMENTOS = 5;

function ipv4Interno([a, b, c]: number[]): boolean {
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  );
}

/** The 16 bytes of an IPv6 address, including forms with a dotted IPv4 tail. */
function bytesIpv6(ip: string): number[] | null {
  let s = ip.toLowerCase().replace(/%.*$/, '');
  const v4 = /(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (v4) {
    const p = v4[1].split('.').map(Number);
    s = `${s.slice(0, -v4[1].length)}${((p[0] << 8) | p[1]).toString(16)}:${((p[2] << 8) | p[3]).toString(16)}`;
  }
  const [cabeca, cauda, ...resto] = s.split('::');
  if (resto.length) return null;
  const grupos = (t: string) => (t ? t.split(':') : []);
  const h = grupos(cabeca);
  const t = cauda === undefined ? [] : grupos(cauda);
  const todos = cauda === undefined ? h : [...h, ...Array(8 - h.length - t.length).fill('0'), ...t];
  if (todos.length !== 8) return null;
  return todos.flatMap((g) => {
    const n = parseInt(g, 16);
    return [n >> 8, n & 0xff];
  });
}

/** Addresses a public site can never be on: loopback, private networks, link-local (cloud metadata), reserved ranges, in IPv4 or any IPv6 wrapping. */
export function ipInterno(ip: string): boolean {
  if (isIP(ip) === 4) return ipv4Interno(ip.split('.').map(Number));
  const b = bytesIpv6(ip);
  if (!b) return true;
  const zeros = (de: number, ate: number) => b.slice(de, ate).every((x) => x === 0);
  // IPv4-mapped (::ffff:a.b.c.d), IPv4-compatible (::a.b.c.d, which also covers :: and ::1) and NAT64 (64:ff9b::a.b.c.d).
  if (zeros(0, 10) && ((b[10] === 0xff && b[11] === 0xff) || (b[10] === 0 && b[11] === 0))) return ipv4Interno(b.slice(12));
  if (b[0] === 0x00 && b[1] === 0x64 && b[2] === 0xff && b[3] === 0x9b) return ipv4Interno(b.slice(12));
  if (b[0] === 0x20 && b[1] === 0x02) return ipv4Interno(b.slice(2, 6)); // 6to4
  if (b[0] === 0x20 && b[1] === 0x01 && (b[2] === 0 && b[3] === 0)) return true; // Teredo
  if (b[0] === 0x20 && b[1] === 0x01 && b[2] === 0x0d && b[3] === 0xb8) return true; // documentation
  return (b[0] & 0xfe) === 0xfc || (b[0] === 0xfe && (b[1] & 0xc0) !== 0) || b[0] === 0xff; // unique local, link/site-local, multicast
}

class EnderecoInterno extends Error {
  code = 'EINTERNO';
}

/** DNS lookup used for the connection itself: refuses the connection when any answer is internal. */
export const lookupPublico: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, enderecos) => {
    if (err) return callback(err, '', 0);
    if (!enderecos.length || enderecos.some((e) => ipInterno(e.address))) return callback(new EnderecoInterno('endereço interno'), '', 0);
    if (options.all) (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, enderecos);
    else callback(null, enderecos[0].address, enderecos[0].family);
  });
};

/** Names that can only be internal, and literal addresses (which skip the DNS lookup). */
function hostAceito(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, '').toLowerCase();
  if (isIP(h)) return !ipInterno(h);
  return h.includes('.') && !h.endsWith('.localhost') && !h.endsWith('.local') && !h.endsWith('.internal') && h !== 'localhost';
}

export interface Abertura {
  status: number;
  location: string | null;
  html: string;
}

/** One GET through Node's http(s), so the connection uses `lookupPublico`. Reads at most MAX_BYTES of the body. */
export function abrirPagina(url: URL, signal: AbortSignal): Promise<Abertura> {
  const mod = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = mod.request(url, { method: 'GET', headers: { 'User-Agent': AGENTE, Accept: 'text/html' }, lookup: lookupPublico, signal }, (res) => {
      const status = res.statusCode ?? 0;
      const location = res.headers.location ?? null;
      if (status >= 300) {
        res.destroy();
        return resolve({ status, location, html: '' });
      }
      const partes: Buffer[] = [];
      let total = 0;
      const fim = () => resolve({ status, location, html: Buffer.concat(partes).toString('utf8') });
      res.on('data', (c: Buffer) => {
        partes.push(c);
        total += c.length;
        if (total >= MAX_BYTES) {
          res.destroy();
          fim();
        }
      });
      res.on('end', fim);
      res.on('close', fim);
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

const PARADO = /(dom[ií]nio|domain)[^<]{0,40}(est[aá] )?(à venda|a venda|for sale)|this domain (is|may be) (parked|for sale)|parked (free|domain)|em constru[cç][aã]o|under construction|coming soon|site em manuten[cç][aã]o|account (has been )?suspended|conta suspensa|hostinger.{0,40}(parked|default)/i;

function codigo(err: unknown): string {
  const e = err as { name?: string; code?: string; cause?: { code?: string; name?: string } };
  return e?.code ?? e?.cause?.code ?? e?.name ?? e?.cause?.name ?? '';
}

const NAO_PUBLICO: Checagem = { categoria: 'incerta', sinais: ['O link aponta para um endereço que não é público; conferir à mão.'] };

/** Opens the home page and turns what it sees into a category and plain-word signals. */
export async function checarSite(inicial: URL, abrir = abrirPagina): Promise<Checagem> {
  let url = inicial;
  const comeco = Date.now();
  const total = AbortSignal.timeout(ESPERA_TOTAL_MS);
  try {
    for (let salto = 0; ; salto++) {
      if (url.port && url.port !== '80' && url.port !== '443') return { categoria: 'incerta', sinais: ['O link usa uma porta incomum; conferir à mão.'] };
      if (!hostAceito(url.hostname)) return NAO_PUBLICO;
      const res = await abrir(url, AbortSignal.any([total, AbortSignal.timeout(ESPERA_MS)]));
      if (res.status >= 300 && res.status < 400 && res.location) {
        if (salto >= MAX_REDIRECIONAMENTOS) return { categoria: 'site-com-problemas', sinais: ['O site fica redirecionando sem parar.'] };
        url = new URL(res.location, url);
        // Each hop is checked again, so a redirect cannot lead the check to an internal address.
        const rede = redeDoHost(url.hostname);
        if (rede) return { categoria: 'so-rede-social', sinais: [`O site cadastrado redireciona para o ${rede}.`] };
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return { categoria: 'incerta', sinais: ['O site redireciona para um endereço estranho; conferir à mão.'] };
        continue;
      }
      if (res.status >= 400 || res.status < 200) return { categoria: 'site-com-problemas', sinais: [`O site responde com erro ${res.status}.`] };
      const tempo = Date.now() - comeco;
      const sinais: string[] = [];
      if (url.protocol === 'http:') sinais.push('Sem cadeado (o site abre sem HTTPS).');
      if (!/<meta[^>]+name=["']?viewport/i.test(res.html)) sinais.push('Sem versão para celular (falta a marcação viewport).');
      if (PARADO.test(res.html)) sinais.push('Parece página parada: em construção, à venda ou suspensa.');
      else if (res.html.replace(/<[^>]*>/g, '').trim().length < 200) sinais.push('Página inicial quase vazia.');
      if (tempo > LENTO_MS) sinais.push(`Demorou ${Math.round(tempo / 1000)} s para abrir.`);
      return sinais.length ? { categoria: 'site-com-problemas', sinais } : { categoria: 'site-proprio', sinais: ['O site abriu com cadeado (HTTPS) e versão para celular.'] };
    }
  } catch (err) {
    const c = codigo(err);
    if (c === 'EINTERNO') return NAO_PUBLICO;
    if (c === 'ENOTFOUND') return { categoria: 'site-com-problemas', sinais: ['O endereço do site não existe (domínio não encontrado).'] };
    if (c === 'ECONNREFUSED') return { categoria: 'site-com-problemas', sinais: ['O site não abre (conexão recusada).'] };
    if (/CERT|SSL|TLS|SELF_SIGNED|UNABLE_TO_VERIFY/i.test(c)) return { categoria: 'site-com-problemas', sinais: ['O certificado de segurança (HTTPS) do site está com problema.'] };
    if (c === 'TimeoutError' || c === 'AbortError' || c === 'ABORT_ERR') return { categoria: 'incerta', sinais: ['O site demorou demais para responder; conferir à mão.'] };
    return { categoria: 'incerta', sinais: ['Não deu para abrir o site agora; conferir à mão.'] };
  }
}

/** The whole automatic reading of a listing's website link. */
export async function checarLink(site: string | undefined, abrir = abrirPagina): Promise<Checagem> {
  const link = lerLink(site);
  if (link.tipo === 'nenhum') return { categoria: 'sem-site', sinais: ['O perfil no Google não tem site cadastrado.'] };
  if (link.tipo === 'invalido') return { categoria: 'incerta', sinais: ['O link do perfil no Google não é um endereço válido.'] };
  if (link.tipo === 'rede') return { categoria: 'so-rede-social', sinais: [`O link do perfil no Google leva ao ${link.rede}.`] };
  return checarSite(link.url, abrir);
}

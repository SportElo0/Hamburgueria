import 'server-only';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { lerLink, redeDoHost, type Categoria } from './regras';

/**
 * Looks at the website a business lists on Google: one visit to its home page, like a person opening it.
 * No crawling, no other pages, nothing kept from the page itself; only the conclusions in plain words.
 */

export interface Checagem {
  categoria: Categoria;
  sinais: string[];
}

const AGENTE = 'GrowliftLeadFinder/1.0 (+https://growlift.com.br; checagem unica da pagina inicial)';
const ESPERA_MS = 10_000;
const LENTO_MS = 6_000;
const MAX_BYTES = 400_000;
const MAX_REDIRECIONAMENTOS = 5;

/** Addresses a public site can never be on: loopback, private networks, link-local (cloud metadata) and the like. */
export function ipInterno(ip: string): boolean {
  const v4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (isIP(v4) === 4) {
    const [a, b] = v4.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  const v6 = ip.toLowerCase();
  return v6 === '::' || v6 === '::1' || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6);
}

/** The host must be a public name whose every address is public; a listing could point anywhere. */
async function hostPublico(host: string): Promise<boolean> {
  const h = host.replace(/^\[|\]$/g, '');
  if (isIP(h)) return !ipInterno(h);
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal') || !h.includes('.')) return false;
  const enderecos = await lookup(h, { all: true });
  return enderecos.length > 0 && enderecos.every((e) => !ipInterno(e.address));
}

async function lerCorpo(res: Response): Promise<string> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    partes.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(partes));
}

const PARADO = /(dom[ií]nio|domain)[^<]{0,40}(est[aá] )?(à venda|a venda|for sale)|this domain (is|may be) (parked|for sale)|parked (free|domain)|em constru[cç][aã]o|under construction|coming soon|site em manuten[cç][aã]o|account (has been )?suspended|conta suspensa|hostinger.{0,40}(parked|default)/i;

function codigo(err: unknown): string {
  const e = err as { name?: string; code?: string; cause?: { code?: string; name?: string } };
  return e?.cause?.code ?? e?.code ?? e?.cause?.name ?? e?.name ?? '';
}

/** Opens the home page and turns what it sees into a category and plain-word signals. */
export async function checarSite(inicial: URL): Promise<Checagem> {
  let url = inicial;
  const comeco = Date.now();
  try {
    for (let salto = 0; ; salto++) {
      if (url.port && url.port !== '80' && url.port !== '443') return { categoria: 'incerta', sinais: ['O link usa uma porta incomum; conferir à mão.'] };
      if (!(await hostPublico(url.hostname))) return { categoria: 'incerta', sinais: ['O link aponta para um endereço que não é público; conferir à mão.'] };
      const res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': AGENTE, Accept: 'text/html' }, signal: AbortSignal.timeout(ESPERA_MS), cache: 'no-store' });
      const destino = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
      if (destino) {
        await res.body?.cancel().catch(() => {});
        if (salto >= MAX_REDIRECIONAMENTOS) return { categoria: 'site-com-problemas', sinais: ['O site fica redirecionando sem parar.'] };
        url = new URL(destino, url);
        // Each hop is checked again, so a redirect cannot lead the check to an internal address.
        const rede = redeDoHost(url.hostname);
        if (rede) return { categoria: 'so-rede-social', sinais: [`O site cadastrado redireciona para o ${rede}.`] };
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return { categoria: 'incerta', sinais: ['O site redireciona para um endereço estranho; conferir à mão.'] };
        continue;
      }
      if (res.status >= 400) {
        await res.body?.cancel().catch(() => {});
        return { categoria: 'site-com-problemas', sinais: [`O site responde com erro ${res.status}.`] };
      }
      const html = await lerCorpo(res);
      const tempo = Date.now() - comeco;
      const sinais: string[] = [];
      if (url.protocol === 'http:') sinais.push('Sem cadeado (o site abre sem HTTPS).');
      if (!/<meta[^>]+name=["']?viewport/i.test(html)) sinais.push('Sem versão para celular (falta a marcação viewport).');
      if (PARADO.test(html)) sinais.push('Parece página parada: em construção, à venda ou suspensa.');
      else if (html.replace(/<[^>]*>/g, '').trim().length < 200) sinais.push('Página inicial quase vazia.');
      if (tempo > LENTO_MS) sinais.push(`Demorou ${Math.round(tempo / 1000)} s para abrir.`);
      return sinais.length ? { categoria: 'site-com-problemas', sinais } : { categoria: 'site-proprio', sinais: ['O site abriu com cadeado (HTTPS) e versão para celular.'] };
    }
  } catch (err) {
    const c = codigo(err);
    if (c === 'ENOTFOUND') return { categoria: 'site-com-problemas', sinais: ['O endereço do site não existe (domínio não encontrado).'] };
    if (c === 'ECONNREFUSED') return { categoria: 'site-com-problemas', sinais: ['O site não abre (conexão recusada).'] };
    if (/CERT|SSL|TLS/i.test(c)) return { categoria: 'site-com-problemas', sinais: ['O certificado de segurança (HTTPS) do site está com problema.'] };
    if (c === 'TimeoutError' || c === 'AbortError') return { categoria: 'incerta', sinais: [`O site não respondeu em ${ESPERA_MS / 1000} s; conferir à mão.`] };
    return { categoria: 'incerta', sinais: ['Não deu para abrir o site agora; conferir à mão.'] };
  }
}

/** The whole automatic reading of a listing's website link. */
export async function checarLink(site: string | undefined): Promise<Checagem> {
  const link = lerLink(site);
  if (link.tipo === 'nenhum') return { categoria: 'sem-site', sinais: ['O perfil no Google não tem site cadastrado.'] };
  if (link.tipo === 'invalido') return { categoria: 'incerta', sinais: ['O link do perfil no Google não é um endereço válido.'] };
  if (link.tipo === 'rede') return { categoria: 'so-rede-social', sinais: [`O link do perfil no Google leva ao ${link.rede}.`] };
  return checarSite(link.url);
}

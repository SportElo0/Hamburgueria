import 'server-only';
import { abrirPagina, checarSite, type Abertura } from './oportunidades/site';
import { redeDoHost } from './oportunidades/regras';
import { gravacaoPermitida } from './ambiente';
import { ConflictError, storage } from './storage';
import { listDiagnosisRequests, saveDiagnosisAnalysis, type DiagnosisAnalysis, type DiagnosisRequest } from './diagnostics';

/**
 * The automatic first look at a free-diagnosis request: one visit to the home page of the site the person wrote in the
 * form (free, through the Lead Finder's safe fetch, which never reaches an internal address), turned into a list of
 * things to improve in plain words. No AI, no paid API. Every morning at 6:30 (São Paulo) the team gets one Telegram
 * message with the new requests, only when there are any.
 */

const TZ = 'America/Sao_Paulo';

// ---------------------------------------------------------------------------------------------
// What the person wrote under "Instagram ou site"

export type Presenca = { site?: URL; redes: string[]; instagram?: string };

/** Reads the free text of the form: the first website link, and which social networks it mentions. */
export function lerPresenca(texto: string): Presenca {
  const redes = new Set<string>();
  let site: URL | undefined;
  let instagram: string | undefined;
  const t = (texto ?? '').slice(0, 300);
  const arroba = /(?:^|\s)@([a-z0-9._]{2,30})\b/i.exec(t);
  if (arroba && !/\.(com|br|net)/i.test(arroba[1])) {
    redes.add('Instagram');
    instagram = arroba[1];
  }
  for (const pedaco of t.split(/[\s,;|]+/)) {
    const p = pedaco.replace(/^[(<"']+|[)>"'.]+$/g, '');
    if (!/^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(p)) continue;
    let url: URL;
    try {
      url = new URL(/^https?:\/\//i.test(p) ? p : `https://${p}`);
    } catch {
      continue;
    }
    const rede = redeDoHost(url.hostname);
    if (rede) {
      redes.add(rede);
      if (rede === 'Instagram' && !instagram) instagram = url.pathname.split('/').filter(Boolean)[0];
      continue;
    }
    site ??= url;
  }
  if (!site && /\binsta(gram)?\b/i.test(t)) redes.add('Instagram');
  return { site, redes: [...redes], instagram };
}

// ---------------------------------------------------------------------------------------------
// What the home page shows

/** What to improve, read from the home page's HTML. Each point is a sentence the team can send almost as is. */
export function lerHtml(html: string): { pontos: string[]; ok: string[] } {
  const pontos: string[] = [];
  const ok: string[] = [];
  const texto = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  const tem = (re: RegExp, alvo = html) => re.test(alvo);

  const titulo = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1].trim() ?? '';
  if (!titulo || /^(home|in[ií]cio|index|site|my site|meu site|untitled)$/i.test(titulo)) pontos.push('Sem um título bom para o Google (o nome e o que vende na aba do navegador).');
  if (!tem(/<meta[^>]+name=["']?description["']?[^>]+content=["'][^"']{20,}/i) && !tem(/<meta[^>]+content=["'][^"']{20,}["'][^>]+name=["']?description/i))
    pontos.push('Sem descrição para aparecer no Google (a frase embaixo do nome na busca).');

  const pdf = tem(/href=["'][^"']+\.pdf(\?[^"']*)?["']/i);
  const cardapio = tem(/card[aá]pio|menu/i, texto);
  if (pdf) pontos.push('Cardápio em PDF: ruim de ler no celular e o Google não lê os pratos.');
  else if (!cardapio) pontos.push('Não achei cardápio na página inicial.');
  else ok.push('Fala de cardápio na página inicial.');
  if (!tem(/R\$\s?\d/, texto)) pontos.push('Sem preços à vista na página inicial.');

  if (!tem(/wa\.me\/|api\.whatsapp\.com|whatsapp:\/\/|web\.whatsapp\.com/i)) pontos.push('Sem botão de WhatsApp para pedir ou tirar dúvida.');
  else ok.push('Tem botão de WhatsApp.');
  if (!tem(/google\.[a-z.]+\/maps|maps\.google\.|goo\.gl\/maps|maps\.app\.goo\.gl/i)) pontos.push('Sem mapa ou botão "como chegar".');
  if (!tem(/(seg|ter|qua|qui|sex|s[áa]b|dom)[a-zç-]*\.?[^<\n]{0,40}\d{1,2}\s?(h|:\d{2})/i, texto)) pontos.push('Sem horário de funcionamento visível.');
  if (!tem(/application\/ld\+json[\s\S]{0,4000}?(Restaurant|FoodEstablishment|LocalBusiness|Bakery|CafeOrCoffeeShop|BarOrPub|Store)/i))
    pontos.push('Sem dados estruturados para o Google (endereço, horário e tipo de negócio "por baixo" do site).');
  if (!tem(/instagram\.com\//i)) pontos.push('Não leva ao Instagram.');
  return { pontos, ok };
}

// ---------------------------------------------------------------------------------------------
// The whole analysis of one request

export async function analisarPedido(r: Pick<DiagnosisRequest, 'presence'>, abrir = abrirPagina, agora = new Date()): Promise<DiagnosisAnalysis> {
  const em = agora.toISOString();
  const p = lerPresenca(r.presence);
  if (!p.site) {
    return {
      tipo: 'sem-site',
      redes: p.redes,
      ...(p.instagram ? { instagram: p.instagram } : {}),
      pontos: [p.redes.length ? `Não tem site: só ${p.redes.join(' e ')}. Fazer a prévia do site.` : 'Não tem site (ou não informou). Fazer a prévia do site.'],
      ok: [],
      em,
    };
  }
  // The same safe visit as the Lead Finder; the wrapper keeps the last page it read, to look at its content too.
  let ultima: Abertura | null = null;
  const espiar = async (url: URL, signal: AbortSignal) => (ultima = await abrir(url, signal));
  const base = await checarSite(p.site, espiar);
  const pagina = ultima as Abertura | null;
  const site = p.site.hostname.replace(/^www\./, '');
  if (base.categoria !== 'site-proprio' && base.categoria !== 'site-com-problemas') {
    return { tipo: base.categoria === 'so-rede-social' ? 'sem-site' : 'conferir', site, redes: p.redes, pontos: base.sinais, ok: [], em };
  }
  const html = pagina && pagina.status >= 200 && pagina.status < 300 ? lerHtml(pagina.html) : { pontos: [], ok: [] };
  const problemasBase = base.categoria === 'site-com-problemas' ? base.sinais : [];
  return {
    tipo: 'site',
    site,
    redes: p.redes,
    pontos: [...problemasBase, ...html.pontos],
    ok: [...(base.categoria === 'site-proprio' ? base.sinais : []), ...html.ok],
    em,
  };
}

/** Analyses the requests that still have none (newest first, a few at a time). Returns how many were done. */
export async function analisarPendentes(limite = 6, abrir = abrirPagina, agora = new Date()): Promise<number> {
  if (!gravacaoPermitida()) return 0;
  const pendentes = (await listDiagnosisRequests(7, agora)).filter((r) => !r.analysis && r.status !== 'descartado').slice(0, limite);
  await Promise.all(
    pendentes.map(async (r) => {
      try {
        await saveDiagnosisAnalysis(r.id, await analisarPedido(r, abrir, agora));
      } catch (err) {
        console.error('diagnostico: análise', r.id, err instanceof Error ? err.message : err);
      }
    }),
  );
  return pendentes.length;
}

// ---------------------------------------------------------------------------------------------
// The 6:30 summary

const RESUMO = 'diagnosticos/resumo.json';
interface EstadoResumo {
  dia: string;
  ate: string;
}

const diaSP = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const minutosSP = (d: Date) => {
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d).split(':').map(Number);
  return h * 60 + m;
};
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * The Telegram text (HTML mode). No phone number and nothing the person typed freely ("O que quer melhorar" may carry
 * personal data and stays in the panel): names, what to improve and the panel link. Whole requests are left out when
 * the message would pass Telegram's 4096-character limit, never cut in the middle of a tag.
 */
export function textoResumo(pedidos: DiagnosisRequest[], painel: string): string {
  const topo = `☀️ <b>Bom dia! ${pedidos.length === 1 ? '1 pedido novo' : `${pedidos.length} pedidos novos`} de diagnóstico</b>`;
  const fim = `Abrir no painel: ${painel}/painel/diagnosticos`;
  const blocos = pedidos.map((r, i) => {
    const a = r.analysis;
    const onde = [r.segment, r.city].filter(Boolean).join(', ');
    const linhas = [`<b>${i + 1}. ${esc(r.business.slice(0, 80))}</b>${onde ? ` (${esc(onde.slice(0, 120))})` : ''}`];
    if (!a) linhas.push('Ainda sem análise: conferir no painel.');
    else if (a.tipo === 'sem-site') linhas.push(`🆕 Não tem site${a.instagram ? ` (Instagram @${esc(a.instagram)})` : a.redes.length ? ` (${esc(a.redes.join(', '))})` : ''}. Fazer a prévia.`);
    else {
      if (a.site) linhas.push(`🌐 ${esc(a.site)}`);
      if (a.pontos.length) linhas.push(...a.pontos.slice(0, 6).map((p) => `• ${esc(p)}`), ...(a.pontos.length > 6 ? [`• e mais ${a.pontos.length - 6} no painel`] : []));
      else linhas.push('Nada grave na página inicial: olhar o Google e o Instagram dele.');
    }
    return linhas.join('\n');
  });
  const partes = [topo];
  let tamanho = topo.length + fim.length + 80;
  let n = 0;
  for (const b of blocos) {
    if (tamanho + b.length + 2 > 3900) break;
    partes.push(b);
    tamanho += b.length + 2;
    n++;
  }
  if (n < blocos.length) partes.push(`… e mais ${blocos.length - n} no painel.`);
  partes.push(fim);
  return partes.join('\n\n');
}

export const telegramConfigurado = () => Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim());

async function enviarTelegram(texto: string, envio: typeof fetch = fetch) {
  const token = process.env.TELEGRAM_BOT_TOKEN!.trim();
  const res = await envio(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID!.trim(), text: texto, parse_mode: 'HTML', disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10_000),
  });
  // Never log the URL: it carries the bot token.
  if (!res.ok) throw new Error(`Telegram respondeu ${res.status}`);
}

export interface ResultadoResumo {
  feito: 'cedo' | 'ja-enviado' | 'sem-telegram' | 'sem-pedidos' | 'enviado' | 'nao-e-producao';
  pedidos?: number;
}

/**
 * Called every few minutes (the publisher's tick). From 6:30 in São Paulo, once a day: analyses what is missing and
 * sends one message with the requests that arrived since the last summary (none → nothing is sent). The day is claimed
 * with a conditional write first, so two ticks at the same moment never send twice.
 */
export async function resumoDaManha(painel: string, agora = new Date(), envio: typeof fetch = fetch, abrir = abrirPagina): Promise<ResultadoResumo> {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') return { feito: 'nao-e-producao' };
  if (!gravacaoPermitida()) return { feito: 'nao-e-producao' };
  if (minutosSP(agora) < 6 * 60 + 30) return { feito: 'cedo' };
  if (!telegramConfigurado()) return { feito: 'sem-telegram' };
  const hoje = diaSP(agora);
  const doc = await storage().readJSON<EstadoResumo>(RESUMO);
  if (doc?.data.dia === hoje) return { feito: 'ja-enviado' };
  try {
    await storage().writeJSON<EstadoResumo>(RESUMO, { dia: hoje, ate: agora.toISOString() }, doc ? doc.etag : null);
  } catch (err) {
    if (err instanceof ConflictError) return { feito: 'ja-enviado' };
    throw err;
  }
  const desde = doc?.data.ate ?? new Date(agora.getTime() - 86_400_000).toISOString();
  await analisarPendentes(6, abrir, agora);
  const novos = (await listDiagnosisRequests(7, agora)).filter((r) => r.createdAt > desde && r.createdAt <= agora.toISOString() && r.status !== 'descartado').reverse();
  if (!novos.length) return { feito: 'sem-pedidos', pedidos: 0 };
  try {
    await enviarTelegram(textoResumo(novos, painel), envio);
  } catch (err) {
    // Give the day back, so the next tick tries again.
    const atual = await storage().readJSON<EstadoResumo>(RESUMO);
    if (atual?.data.dia === hoje) await storage().writeJSON<EstadoResumo>(RESUMO, doc?.data ?? { dia: '', ate: desde }, atual.etag).catch(() => {});
    throw err;
  }
  return { feito: 'enviado', pedidos: novos.length };
}

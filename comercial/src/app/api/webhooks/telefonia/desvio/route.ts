import { after } from 'next/server';
import { createHmac } from 'node:crypto';
import { FRASE_DESVIO_LIGACAO, VERSAO_FRASE_DESVIO, normalizarTelefone } from '@/server/config';
import { segredoSessao } from '@/server/chaves';
import { empresaPorId, type Empresa } from '@/server/empresas';
import { ErroDeUso } from '@/server/erros';
import { celular, empresaDaChaveTelefonia, registrarLigacaoPerdida } from '@/server/ligacoes';
import { iguais } from '@/server/segredos';
import { processarFila } from '@/server/trabalhos';
import { chaveDe } from '../comum';

/**
 * Missed call by carrier forwarding ("desvio quando não atende"). The company keeps its own number and sets the carrier
 * to forward unanswered calls to a number of the telephony service (Twilio), whose "a call comes in" webhook is this
 * route. So only missed calls reach us. Three steps, all TwiML over form posts:
 *   inicio (company key, Basic auth in the URL): one recorded-voice sentence asking to press 1 to get a WhatsApp message;
 *   resposta (Gather action, signed per call): records the missed call, with consent only when the caller pressed 1;
 *   fim (the number's "call status changes" webhook, company key): a caller who hung up during the sentence still
 *     becomes a call-back task. Repeated notices of the same call do nothing (the call id is unique per company).
 * No AI voice: a fixed sentence, recorded word for word with each consent (frase versão 2).
 */

const VOZ = 'language="pt-BR" voice="Polly.Camila"';
/** No promise of a call back (the task exists, but a spoken promise would bind the company): only what is true. */
const SEM_ATENDER = 'Tudo bem. Avisamos a equipe da sua ligação.';
/** The signed answer step is valid for this long after the sentence starts. */
const VALIDADE_MS = 10 * 60_000;
const STATUS_FIM = new Set(['completed', 'no-answer', 'busy', 'canceled', 'failed']);

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const twiml = (corpo: string, status = 200) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${corpo}</Response>`, { status, headers: { 'Content-Type': 'text/xml; charset=utf-8', 'Cache-Control': 'no-store' } });
const falar = (texto: string) => `<Say ${VOZ}>${xml(texto)}</Say>`;
const encerrar = (texto: string) => twiml(`${falar(texto)}<Hangup/>`);

/**
 * Signature of the Gather action for one call, from one number, of one company, valid for a few minutes: the answer
 * step needs no company key in the URL, and a leaked URL cannot record consent for another phone or later on.
 */
const assinatura = (segredo: string, empresaId: string, chamada: string, tel: string, expira: number) =>
  createHmac('sha256', segredo).update(`desvio:${empresaId}:${chamada}:${tel}:${expira}`).digest('base64url');

async function campos(req: Request): Promise<Record<string, string> | null> {
  if (Number(req.headers.get('content-length') ?? 0) > 20_000) return null;
  const bruto = await req.text();
  if (bruto.length > 20_000) return null;
  return Object.fromEntries(new URLSearchParams(bruto));
}

async function empresaDoPedido(req: Request, etapa: string, chamada: string, tel: string | null): Promise<Empresa | null> {
  if (etapa === 'resposta') {
    const u = new URL(req.url);
    const id = u.searchParams.get('e') ?? '';
    const t = u.searchParams.get('t') ?? '';
    const expira = Number(u.searchParams.get('x') ?? 0);
    const segredo = segredoSessao();
    if (!segredo || !id || !t || !chamada || !tel || !(expira > Date.now()) || !iguais(t, assinatura(segredo, id, chamada, tel, expira))) return null;
    return empresaPorId(id).catch(() => null);
  }
  return empresaDaChaveTelefonia(chaveDe(req));
}

export async function POST(req: Request) {
  const etapa = new URL(req.url).searchParams.get('etapa') ?? 'inicio';
  if (!['inicio', 'resposta', 'fim'].includes(etapa)) return new Response('Etapa inválida.', { status: 400 });
  const d = await campos(req);
  if (!d) return new Response('Grande demais.', { status: 413 });
  const chamada = (d.CallSid ?? '').trim().slice(0, 120);
  const tel = normalizarTelefone(d.From ?? '');
  const empresa = await empresaDoPedido(req, etapa, chamada, tel);
  if (!empresa) return new Response('Chave inválida.', { status: 401 });
  const registrar = (aceite: boolean) => registrarLigacaoPerdida(empresa, { telefone: d.From ?? '', idExterno: chamada, aceiteWhatsapp: aceite, versaoFrase: VERSAO_FRASE_DESVIO });

  try {
    if (etapa === 'fim') {
      // Hung up during the sentence (no answer step): the call still becomes a call-back task, without consent.
      if (tel && chamada && STATUS_FIM.has((d.CallStatus ?? '').toLowerCase())) await registrar(false);
      return twiml('');
    }
    // Hidden number: nobody to answer or call back.
    if (!tel || !chamada) return encerrar('Não conseguimos atender agora. Por favor, ligue de novo mais tarde.');

    if (etapa === 'inicio') {
      // Nothing to offer by WhatsApp (answer switched off, a landline, or no server secret to sign the answer step):
      // just the call-back task.
      const segredo = segredoSessao();
      if (!empresa.config.regras.ligacao_auto || !celular(tel) || !segredo) {
        await registrar(false);
        return encerrar(SEM_ATENDER);
      }
      const base = (process.env.APP_URL || new URL(req.url).origin).replace(/\/$/, '');
      const expira = Date.now() + VALIDADE_MS;
      const acao = `${base}/api/webhooks/telefonia/desvio?etapa=resposta&e=${encodeURIComponent(empresa.id)}&x=${expira}&t=${assinatura(segredo, empresa.id, chamada, tel, expira)}`;
      // No key pressed within the timeout: Twilio goes on to the Redirect, the same answer step without Digits.
      return twiml(`<Gather input="dtmf" numDigits="1" timeout="6" method="POST" action="${xml(acao)}">${falar(FRASE_DESVIO_LIGACAO(empresa.nome))}</Gather><Redirect method="POST">${xml(acao)}</Redirect>`);
    }

    // resposta: only a "1" pressed after this exact sentence is consent.
    const r = await registrar((d.Digits ?? '').trim() === '1');
    after(async () => { await processarFila(10).catch(() => {}); });
    return encerrar(r.resultado === 'mensagem_agendada' ? 'Combinado! Já te mandamos a mensagem no WhatsApp.' : SEM_ATENDER);
  } catch (err) {
    // Never leave the caller in silence: the sentence is said even when recording failed.
    if (!(err instanceof ErroDeUso)) console.error('[webhook desvio]', err instanceof Error ? err.message : err);
    return etapa === 'fim' ? twiml('') : encerrar(SEM_ATENDER);
  }
}

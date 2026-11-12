import { after } from 'next/server';
import { ErroDeUso } from '@/server/erros';
import { empresaDaChaveTelefonia, registrarLigacaoPerdida } from '@/server/ligacoes';
import { processarFila } from '@/server/trabalhos';

/** Statuses that mean nobody answered (ours and the common ones of telephony services). */
const NAO_ATENDIDA = new Set(['nao_atendida', 'no-answer', 'no_answer', 'busy', 'missed', 'unanswered', 'canceled', 'cancelled', 'failed']);

const responder = (corpo: unknown, status = 200) => Response.json(corpo, { status, headers: { 'Cache-Control': 'no-store' } });

/** The company's key, sent as "Authorization: Bearer <key>" or as the password of HTTP Basic auth (services that only allow a URL). */
function chaveDe(req: Request): string {
  const h = req.headers.get('authorization') ?? '';
  if (/^bearer /i.test(h)) return h.slice(7).trim();
  if (/^basic /i.test(h)) {
    try {
      const t = Buffer.from(h.slice(6).trim(), 'base64').toString('utf8');
      return t.slice(t.indexOf(':') + 1);
    } catch {
      return '';
    }
  }
  return '';
}

/**
 * Notice from the company's telephony service that a call was not answered.
 * JSON or form fields: de (or From), id (or CallSid), status (or DialCallStatus / CallStatus), aceite_whatsapp (true only when the caller pressed 1 in the consent menu), quando.
 */
export async function POST(req: Request) {
  if (Number(req.headers.get('content-length') ?? 0) > 20_000) return responder({ erro: 'Grande demais.' }, 413);
  const empresa = await empresaDaChaveTelefonia(chaveDe(req));
  if (!empresa) return responder({ erro: 'Chave inválida.' }, 401);
  try {
    const bruto = await req.text();
    if (bruto.length > 20_000) return responder({ erro: 'Grande demais.' }, 413);
    let d: Record<string, unknown>;
    if ((req.headers.get('content-type') ?? '').includes('application/x-www-form-urlencoded')) d = Object.fromEntries(new URLSearchParams(bruto));
    else {
      try {
        d = JSON.parse(bruto);
      } catch {
        return responder({ erro: 'Formato inválido: envie JSON ou formulário.' }, 400);
      }
      if (!d || typeof d !== 'object' || Array.isArray(d)) return responder({ erro: 'Formato inválido.' }, 400);
    }
    const txt = (...k: string[]) => String(k.map((x) => d[x]).find((v) => v !== undefined && v !== null && v !== '') ?? '').trim();
    const status = txt('status', 'DialCallStatus', 'CallStatus').toLowerCase();
    if (!NAO_ATENDIDA.has(status)) return responder({ ok: true, ignorado: 'A ligação foi atendida ou o status não é de ligação perdida.' });
    // Only the explicit field, sent by the rule of the consent menu: a "1" pressed in some other menu is never consent.
    const aceite = d.aceite_whatsapp === true || ['true', 'sim'].includes(txt('aceite_whatsapp').toLowerCase());
    const quando = txt('quando') ? new Date(txt('quando')) : undefined;
    const r = await registrarLigacaoPerdida(empresa, { telefone: txt('de', 'From', 'from', 'caller'), idExterno: txt('id', 'CallSid', 'call_id'), quando, aceiteWhatsapp: aceite });
    // The WhatsApp answer and the phone alerts go out right after this response.
    after(async () => { await processarFila(10).catch(() => {}); });
    return responder({ ok: true, resultado: r.resultado });
  } catch (err) {
    if (err instanceof ErroDeUso) return responder({ erro: err.message }, err.status);
    console.error('[webhook telefonia]', err instanceof Error ? err.message : err);
    return responder({ erro: 'Erro ao processar.' }, 500);
  }
}

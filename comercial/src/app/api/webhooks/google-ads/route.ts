import { after } from 'next/server';
import { ErroDeUso } from '@/server/erros';
import { empresaDaChaveGoogle, receberLeadGoogle } from '@/server/google-ads';
import { processarFila } from '@/server/trabalhos';

const responder = (corpo: unknown, status = 200) => Response.json(corpo, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * Lead form of a Google ad (Google Ads "webhook integration"). The company's key comes in the body (google_key).
 * Google expects 200 with {} on success; 4xx means "do not resend" and 5xx means "try again later".
 */
export async function POST(req: Request) {
  if (Number(req.headers.get('content-length') ?? 0) > 50_000) return responder({ message: 'Grande demais.' }, 413);
  try {
    const bruto = await req.text();
    if (bruto.length > 50_000) return responder({ message: 'Grande demais.' }, 413);
    let corpo: unknown;
    try {
      corpo = JSON.parse(bruto);
    } catch {
      return responder({ message: 'Envie JSON.' }, 400);
    }
    const chave = corpo && typeof corpo === 'object' && !Array.isArray(corpo) ? String((corpo as Record<string, unknown>).google_key ?? '') : '';
    const empresa = await empresaDaChaveGoogle(chave);
    if (!empresa) return responder({ message: 'Chave inválida.' }, 401);
    const r = await receberLeadGoogle(empresa, corpo);
    // Phone alerts for the new request go out right after the answer.
    if (r.resultado === 'criado') after(async () => { await processarFila(10).catch(() => {}); });
    return responder({});
  } catch (err) {
    if (err instanceof ErroDeUso) return responder({ message: err.message }, err.status);
    console.error('[webhook google ads]', err instanceof Error ? err.message : err);
    return responder({ message: 'Erro ao processar.' }, 500);
  }
}

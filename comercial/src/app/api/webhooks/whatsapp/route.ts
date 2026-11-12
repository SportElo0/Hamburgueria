import { assinaturaValida } from '@/server/canais/whatsapp-cloud';
import { processarWebhookWhatsApp } from '@/server/conversas';
import { iguais } from '@/server/segredos';

/** Meta checks the address once, with the token configured on both sides. */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const esperado = process.env.WHATSAPP_VERIFY_TOKEN;
  if (p.get('hub.mode') === 'subscribe' && esperado && iguais(p.get('hub.verify_token') ?? '', esperado)) {
    return new Response(p.get('hub.challenge') ?? '', { status: 200 });
  }
  return new Response('Recusado.', { status: 403 });
}

/**
 * Messages and delivery reports from WhatsApp. The body is only read after its signature is verified with the app secret;
 * each event goes to the company that owns the receiving number, once. Replies are produced by the worker.
 */
export async function POST(req: Request) {
  if (Number(req.headers.get('content-length') ?? 0) > 500_000) return new Response('Grande demais.', { status: 413 });
  const bruto = await req.text();
  if (bruto.length > 500_000) return new Response('Grande demais.', { status: 413 });
  if (!assinaturaValida(bruto, req.headers.get('x-hub-signature-256'), process.env.WHATSAPP_APP_SECRET)) return new Response('Assinatura inválida.', { status: 401 });
  try {
    await processarWebhookWhatsApp(JSON.parse(bruto));
  } catch (err) {
    // A 5xx makes Meta deliver again later; events already stored are skipped by their id.
    console.error('[webhook whatsapp]', err instanceof Error ? err.message : err);
    return new Response('Erro ao processar.', { status: 500 });
  }
  return new Response('ok', { status: 200 });
}

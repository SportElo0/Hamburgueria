// Server-side delivery of quotes and contact messages by e-mail (Resend REST API, no SDK).
// Configured only through environment variables on Vercel; without them the routes answer 503 and the page
// offers WhatsApp, e-mail and copy instead. Nothing is stored.
import 'server-only';

export const envioConfigurado = () => Boolean(process.env.RESEND_API_KEY && process.env.COTACAO_REMETENTE && process.env.COTACAO_DESTINO);

const escapar = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function enviarEmail({ assunto, texto, responderPara }: { assunto: string; texto: string; responderPara: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.COTACAO_REMETENTE,
      to: process.env.COTACAO_DESTINO!.split(',').map((s) => s.trim()).filter(Boolean),
      reply_to: responderPara,
      // the subject carries form text: keep it on one line
      subject: assunto.replace(/[\r\n]+/g, ' ').slice(0, 180),
      text: texto,
      html: `<pre style="font:14px/1.5 system-ui,sans-serif;white-space:pre-wrap">${escapar(texto)}</pre>`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Resend respondeu ${res.status}`);
}

// A small per-instance limit: serverless instances do not share it, so it only slows down bursts.
const vistos = new Map<string, number[]>();
export function dentroDoLimite(chave: string, max = 5, janelaMs = 10 * 60 * 1000): boolean {
  const agora = Date.now();
  const lista = (vistos.get(chave) ?? []).filter((t) => agora - t < janelaMs);
  if (lista.length >= max) return false;
  lista.push(agora);
  vistos.set(chave, lista);
  if (vistos.size > 5000) vistos.clear();
  return true;
}

/** Same-origin check for browser posts (the forms live on this site). */
export function origemValida(req: Request): boolean {
  const origem = req.headers.get('origin');
  if (!origem) return false;
  try {
    return new URL(origem).host === new URL(req.url).host || new URL(origem).host === req.headers.get('host');
  } catch {
    return false;
  }
}

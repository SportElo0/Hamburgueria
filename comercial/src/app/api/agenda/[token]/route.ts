import { calendarioDoLink } from '@/server/agenda';

/** Private calendar address (Google Calendar "From URL"): the token is the only key, so it is never shown again. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const corpo = await calendarioDoLink((await params).token, process.env.APP_URL ?? '');
  if (!corpo) return new Response('Agenda não encontrada.', { status: 404 });
  return new Response(corpo, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'no-referrer' } });
}

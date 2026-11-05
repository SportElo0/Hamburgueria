import { after, NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { runAgenda } from '@/lib/agenda';
import { resumoDaManha } from '@/lib/diagnostico-auto';
import { limpezaDiaria } from '@/lib/limpeza';
import { publicOrigin } from '@/lib/origem';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * The agenda's publisher, called every few minutes by a scheduler (Vercel Cron and/or an external pinger such as
 * cron-job.org) with `Authorization: Bearer <CRON_SECRET>`. Publishes only posts the team already approved.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET ?? '';
  const got = Buffer.from(request.headers.get('authorization') ?? '');
  const want = Buffer.from(`Bearer ${secret}`);
  if (secret.length < 32 || got.length !== want.length || !timingSafeEqual(got, want)) return new NextResponse('Não autorizado', { status: 401 });
  const origin = publicOrigin(request.url);
  // The same tick also sends the 6:30 diagnosis summary (once a day, only when there are new requests).
  after(() => resumoDaManha(origin).catch((err) => console.error('diagnostico: resumo', err instanceof Error ? err.message : err)));
  // And, once a day, erases old personal data of bookings and the waiting list (see limpeza.ts).
  after(() => limpezaDiaria().catch((err) => console.error('limpeza', err instanceof Error ? err.message : err)));
  const result = await runAgenda(origin);
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}

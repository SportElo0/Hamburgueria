import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { runAgenda } from '@/lib/agenda';
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
  if (!secret || got.length !== want.length || !timingSafeEqual(got, want)) return new NextResponse('Não autorizado', { status: 401 });
  const result = await runAgenda(publicOrigin(request.url));
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}

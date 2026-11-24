import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { gravacaoPermitida } from '@/lib/ambiente';

export const dynamic = 'force-dynamic';

/**
 * For an uptime monitor (e.g. UptimeRobot, free): 200 when the panel and its database answer, 503 otherwise.
 * Says nothing about any store.
 */
export async function GET() {
  try {
    await storage().readJSON('sistema/saude.json');
    // Cached at the edge for a few seconds, so a loop of requests doesn't turn into a loop of database reads.
    return NextResponse.json({ ok: true, gravacao: gravacaoPermitida() }, { headers: { 'Cache-Control': 'public, s-maxage=15, max-age=0' } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

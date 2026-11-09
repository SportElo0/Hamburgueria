import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { isTeam } from '@/lib/session';
import { countNewDiagnoses } from '@/lib/diagnostics';

/** The panel's red badge polls this: how many diagnosis requests nobody has handled yet. Team only. */
export async function GET() {
  const user = await currentUser();
  if (!user || !isTeam(user)) return NextResponse.json({ error: 'Sem acesso.' }, { status: 401 });
  return NextResponse.json({ count: await countNewDiagnoses() }, { headers: { 'Cache-Control': 'no-store' } });
}

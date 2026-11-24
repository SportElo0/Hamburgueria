import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { isTeam } from '@/lib/session';
import { dayWindow } from '@/lib/limits';
import { listarLeads } from '@/lib/oportunidades/dados';
import { csv, linhasCsv } from '@/lib/oportunidades/regras';

// The team's findings as a spreadsheet. ?categoria=, ?cidade=, ?segmento=, ?situacao= narrow it down;
// "não contatar" is left out unless asked for by name.
export async function GET(request: Request) {
  const user = await currentUser();
  if (!user || !isTeam(user)) return new NextResponse('Não autorizado', { status: 401 });
  const q = new URL(request.url).searchParams;
  const leads = (await listarLeads()).filter(
    (l) =>
      (!q.get('categoria') || l.categoria === q.get('categoria')) &&
      (!q.get('cidade') || l.cidade === q.get('cidade')) &&
      (!q.get('segmento') || l.segmento === q.get('segmento')) &&
      (q.get('situacao') ? l.situacao === q.get('situacao') : l.situacao !== 'nao-contatar'),
  );
  return new NextResponse(csv(linhasCsv(leads)), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="oportunidades-${dayWindow()}.csv"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

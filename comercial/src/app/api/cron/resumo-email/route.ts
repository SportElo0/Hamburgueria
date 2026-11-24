import { after } from 'next/server';
import { segredoAgendador } from '@/server/chaves';
import { enviarAvisosCelular } from '@/server/push';
import { gerarResumoEmail } from '@/server/resumo-email';
import { iguais } from '@/server/segredos';

export const maxDuration = 60;

/** Once a day (06:00 in Brasília; the host fires it within that hour): the summary of the team's inbox. Only the scheduler may call it. */
export async function GET(req: Request) {
  const segredo = segredoAgendador();
  const enviado = req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  if (!segredo || !iguais(enviado, segredo)) return new Response('Não autorizado.', { status: 401 });
  try {
    const r = await gerarResumoEmail();
    after(() => enviarAvisosCelular().catch(() => {}));
    return Response.json({ total: r.total, importantes: r.importantes, motivo: r.motivo ?? null });
  } catch {
    // The failure is already recorded in the panel; the response never carries message content.
    return Response.json({ erro: 'Não foi possível gerar o resumo.' }, { status: 500 });
  }
}

import { segredoAgendador } from '@/server/chaves';
import { iguais } from '@/server/segredos';
import { processarFila, varrerAutomacoes } from '@/server/trabalhos';

export const maxDuration = 60;

/**
 * Runs the automation queue once. On a host without a permanent process (Vercel), a scheduled call to this address
 * replaces the worker. Only the scheduler may call it: it sends CRON_SECRET as a bearer token.
 */
export async function GET(req: Request) {
  const segredo = segredoAgendador();
  const enviado = req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  if (!segredo || !iguais(enviado, segredo)) return new Response('Não autorizado.', { status: 401 });
  const iniciados = await varrerAutomacoes();
  const n = await processarFila(50);
  return Response.json({ iniciados, processados: n });
}

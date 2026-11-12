import { iguais } from '@/server/segredos';
import { processarFila } from '@/server/trabalhos';

export const maxDuration = 60;

/**
 * Runs the automation queue once. On a host without a permanent process (Vercel), a scheduled call to this address
 * replaces the worker. Only the scheduler may call it: it sends CRON_SECRET as a bearer token.
 */
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  const enviado = req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  if (!segredo || !iguais(enviado, segredo)) return new Response('Não autorizado.', { status: 401 });
  const n = await processarFila(50);
  return Response.json({ processados: n });
}

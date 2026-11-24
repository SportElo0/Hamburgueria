import { segredoAgendador } from './chaves';

/**
 * On Vercel's free plan a cron job runs at most once a day, so reminders and follow-ups could wait up to a day.
 * The Supabase database has a scheduler of its own (pg_cron) and can make HTTP calls (pg_net): this schedules a call
 * to /api/cron/fila every 5 minutes, with the queue secret as a bearer token. It is set up during `npm run migrar` on
 * Vercel production builds only; anywhere else (a laptop, the test database, a Postgres without those extensions) it is skipped.
 * The secret ends up in the scheduler's job table, readable only by the database administrator.
 */
export const NOME_TAREFA = 'growlift-fila';
export const INTERVALO = '*/5 * * * *';

type Consulta = (sql: string, params?: unknown[]) => Promise<unknown>;

export function deveAgendar(env: Record<string, string | undefined> = process.env): { ok: true; url: string } | { ok: false; motivo: string } {
  if (env.FILA_NO_BANCO === '0') return { ok: false, motivo: 'desligado por FILA_NO_BANCO=0' };
  if (env.VERCEL !== '1') return { ok: false, motivo: 'fora da Vercel' };
  // Preview builds share the database: only the production build may point the job (and the secret) somewhere.
  if (env.VERCEL_ENV !== 'production') return { ok: false, motivo: 'só no build de produção' };
  const base = (env.APP_URL ?? '').replace(/\/+$/, '');
  if (!/^https:\/\/[^\s/]+$/.test(base)) return { ok: false, motivo: 'APP_URL ausente ou sem https' };
  return { ok: true, url: `${base}/api/cron/fila` };
}

/** Creates (or replaces) the every-5-minutes job. Never throws: a database without pg_cron just reports why. */
export async function agendarFilaNoBanco(q: Consulta, env: Record<string, string | undefined> = process.env): Promise<string> {
  const d = deveAgendar(env);
  if (!d.ok) return `agendador do banco: não configurado (${d.motivo})`;
  const segredo = segredoAgendador();
  if (!segredo) return 'agendador do banco: não configurado (sem segredo da fila)';
  try {
    await q('create extension if not exists pg_cron');
    await q('create extension if not exists pg_net');
    await q('select cron.unschedule(jobid) from cron.job where jobname = $1', [NOME_TAREFA]);
    await q(
      `select cron.schedule($1, $2, format('select net.http_get(url := %L, headers := jsonb_build_object(%L, %L), timeout_milliseconds := 55000)', $3::text, 'Authorization', $4::text))`,
      [NOME_TAREFA, INTERVALO, d.url, `Bearer ${segredo}`],
    );
    return `agendador do banco: fila a cada 5 minutos (${d.url})`;
  } catch (e) {
    return `agendador do banco: não foi possível agendar (${(e as Error).message.slice(0, 160)}); a fila segue com o agendamento diário da Vercel`;
  }
}

/**
 * Runs the job queue inside the web server, so automations work with a single process (npm run dev / start).
 * The standalone worker (npm run worker) can run at the same time: each job is claimed by one of them only.
 */
const g = globalThis as unknown as { __filaEmbutida?: boolean };

export function iniciarFilaEmbutida() {
  if (g.__filaEmbutida) return;
  g.__filaEmbutida = true;
  let ocupado = false;
  let ultimaLimpeza = 0;
  const volta = async () => {
    if (ocupado) return;
    ocupado = true;
    try {
      const { processarFila } = await import('./trabalhos');
      await processarFila(20);
      if (Date.now() - ultimaLimpeza > 3_600_000) {
        ultimaLimpeza = Date.now();
        const { q } = await import('./db');
        await q(`delete from limites where janela < now() - interval '1 day'`);
        await q(`delete from eventos_webhook where recebido_em < now() - interval '30 days'`);
        await q(`delete from emails_simulados where criado_em < now() - interval '1 day'`);
      }
    } catch (err) {
      console.error('[fila]', err instanceof Error ? err.message : err);
    } finally {
      ocupado = false;
    }
  };
  setInterval(volta, 2000).unref();
}

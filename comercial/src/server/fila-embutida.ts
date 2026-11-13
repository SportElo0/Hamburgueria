/**
 * Runs the job queue inside the web server, so automations work with a single process (npm run dev / start).
 * The standalone worker (npm run worker) can run at the same time: each job is claimed by one of them only.
 */
const g = globalThis as unknown as { __filaEmbutida?: boolean };

export function iniciarFilaEmbutida() {
  if (g.__filaEmbutida) return;
  g.__filaEmbutida = true;
  let ocupado = false;
  let ultimaVarredura = 0;
  const volta = async () => {
    if (ocupado) return;
    ocupado = true;
    try {
      const { processarFila } = await import('./trabalhos');
      await processarFila(20);
      if (Date.now() - ultimaVarredura > 5 * 60_000) {
        ultimaVarredura = Date.now();
        const { varrerAutomacoes } = await import('./trabalhos');
        await varrerAutomacoes();
      }
    } catch (err) {
      console.error('[fila]', err instanceof Error ? err.message : err);
    } finally {
      ocupado = false;
    }
  };
  setInterval(volta, 2000).unref();
}

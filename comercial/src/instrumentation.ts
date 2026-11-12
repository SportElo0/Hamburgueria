/** Server start: turn the automation queue on (set FILA_EMBUTIDA=0 to run it only in the separate worker). */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.FILA_EMBUTIDA === '0' || process.env.NEXT_PHASE === 'phase-production-build') return;
  if (!process.env.DATABASE_URL) return;
  const { iniciarFilaEmbutida } = await import('./server/fila-embutida');
  iniciarFilaEmbutida();
}

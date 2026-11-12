import { carregarEnv } from './env';

carregarEnv();

/**
 * Worker: runs the jobs kept in the database (assistant replies, WhatsApp sends, alerts, follow-ups).
 * It can be stopped and started at any time: pending jobs stay in the table and each one runs once.
 */
async function main() {
  const { processarFila } = await import('../src/server/trabalhos');
  const { fecharPool, q } = await import('../src/server/db');
  let rodando = true;
  const parar = () => (rodando = false);
  process.on('SIGINT', parar);
  process.on('SIGTERM', parar);
  console.log('Worker iniciado. Ctrl+C para parar.');
  let ultimaLimpeza = 0;
  while (rodando) {
    try {
      const n = await processarFila(20);
      if (n) console.log(new Date().toISOString(), `${n} trabalho(s) processado(s)`);
      if (Date.now() - ultimaLimpeza > 3_600_000) {
        ultimaLimpeza = Date.now();
        await q(`delete from limites where janela < now() - interval '1 day'`);
        await q(`delete from eventos_webhook where recebido_em < now() - interval '30 days'`);
        await q(`delete from emails_simulados where criado_em < now() - interval '1 day'`);
      }
    } catch (err) {
      console.error('Erro no worker (segue tentando):', err instanceof Error ? err.message : err);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  await fecharPool();
  console.log('Worker parado.');
}

main();

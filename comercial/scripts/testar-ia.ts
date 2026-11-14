import { carregarEnv } from './env';

carregarEnv();

/** Runs the real-assistant checks (costs a few cents). Usage: npm run testar-ia [modelo] */
async function main() {
  const { checarAssistente } = await import('../src/server/ia/checagem');
  const r = await checarAssistente(process.argv[2] || process.env.IA_MODELO_PADRAO || 'claude-haiku-5-5');
  for (const c of r.casos) console.log(`${c.ok ? 'ok    ' : 'FALHOU'} ${c.nome}${c.motivo ? ` (${c.motivo})` : ''}\n       cliente: ${c.cliente}\n       assistente: ${c.assistente.replace(/\n/g, ' ')}${c.acoes.length ? `\n       ações: ${c.acoes.join(', ')}` : ''}\n`);
  const falhas = r.casos.filter((c) => !c.ok).length;
  console.log(`Modelo: ${r.modelo}. Tokens: ${r.tokensEntrada} de entrada, ${r.tokensSaida} de saída. Custo estimado: ${r.custoUsd == null ? 'preço não cadastrado' : `US$ ${r.custoUsd.toFixed(4)}`}.`);
  console.log(falhas ? `${falhas} de ${r.casos.length} verificações falharam.` : `Todas as ${r.casos.length} verificações passaram.`);
  process.exit(falhas ? 1 : 0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

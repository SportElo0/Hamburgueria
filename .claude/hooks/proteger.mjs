// PreToolUse (Edit|Write|MultiEdit): blocks what must never be written by hand in this repo.
// - CPFs: the business rule is that no CPF is ever saved in a file.
// - .env files: secrets live in the hosts' environment variables (.env.example is fine).
// - Lock files: they only change through npm.
// Exit 2 blocks the tool call and shows the message to Claude.
let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let input = {};
  try {
    input = JSON.parse(raw).tool_input ?? {};
  } catch {
    process.exit(0);
  }
  const file = String(input.file_path ?? '');
  const name = file.split(/[\\/]/).pop();
  const text = [input.content, input.new_string, ...(input.edits ?? []).map((e) => e.new_string)].filter(Boolean).join('\n');

  const block = (msg) => {
    console.error(msg);
    process.exit(2);
  };

  if (/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/.test(text)) block('Bloqueado: o texto parece ter um CPF. Regra do projeto: CPF não fica salvo em arquivo nenhum.');
  if (/^\.env/.test(name) && name !== '.env.example') block(`Bloqueado: ${name} guarda segredos. Segredos ficam nas variáveis de ambiente da Vercel/Cloudflare, não editados aqui.`);
  if (/^(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(name)) block(`Bloqueado: ${name} só muda pelo npm (npm install / npm update).`);
});

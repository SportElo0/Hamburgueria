// Marca um roteiro como aprovado e grava a impressão digital do texto.
// Depois disso, qualquer mudança no roteiro trava o render (a conferência acusa "trava"),
// e as preferências novas deixam de valer para ele.
//   node aprovar.mjs a-conte-os-toques "Lucas"
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashRoteiro } from './conferir.mjs';

const [slug, quem] = process.argv.slice(2);
if (!slug || !quem) {
  console.error('Use: node aprovar.mjs <slug> "<quem aprovou>"');
  process.exit(1);
}
const arq = path.join(path.dirname(fileURLToPath(import.meta.url)), 'roteiros', `${slug}.json`);
const r = JSON.parse(await fs.readFile(arq, 'utf8'));
r.status = 'aprovado';
r.aprovado = { por: quem, em: new Date().toISOString(), hash: hashRoteiro(r) };
await fs.writeFile(arq, JSON.stringify(r, null, 2) + '\n');
console.log(`${slug} aprovado por ${quem} (impressão ${r.aprovado.hash}).`);

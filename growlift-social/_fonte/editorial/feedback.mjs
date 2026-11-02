// Registra uma preferência do Lucas ou do Antônio sobre capas, textos ou layouts.
// Ela orienta os PRÓXIMOS carrosséis (roteiros em rascunho) e nunca muda um roteiro já aprovado.
//   node feedback.mjs capa "Gostei mais de capa com objeto real do que com celular" --capa-com cardapio
//   node feedback.mjs texto "Não usar a palavra 'dicas'" --evitar dicas
//   node feedback.mjs layout "Menos telas de celular seguidas" --sem-componente celular
//   node feedback.mjs geral "Fechos mais curtos"
//   node feedback.mjs listar
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARQ = path.join(path.dirname(fileURLToPath(import.meta.url)), 'preferencias.json');
const prefs = JSON.parse(await fs.readFile(ARQ, 'utf8'));
const [sobre, nota, ...resto] = process.argv.slice(2);

if (!sobre || sobre === 'listar') {
  for (const r of prefs.regras) console.log(`${r.id} · ${r.data} · ${r.sobre}: ${r.nota}${r.verificar ? `  [confere: ${r.verificar.tipo} = ${r.verificar.valor}]` : ''}`);
  process.exit(0);
}
if (!['capa', 'texto', 'layout', 'geral'].includes(sobre) || !nota) {
  console.error('Use: node feedback.mjs <capa|texto|layout|geral> "o que vocês acharam" [--evitar palavra | --max-capa N | --sem-componente nome | --capa-com componente]');
  process.exit(1);
}
const flag = (f) => {
  const i = resto.indexOf(f);
  return i >= 0 ? resto[i + 1] : undefined;
};
let verificar = null;
if (flag('--evitar')) verificar = { tipo: 'palavra-evitar', valor: flag('--evitar') };
else if (flag('--max-capa')) verificar = { tipo: 'max-palavras-capa', valor: Number(flag('--max-capa')) };
else if (flag('--sem-componente')) verificar = { tipo: 'componente-evitar', valor: flag('--sem-componente') };
else if (flag('--capa-com')) verificar = { tipo: 'capa-com', valor: flag('--capa-com') };

const id = `p${prefs.regras.length + 1}`;
const data = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
prefs.regras.push({ id, data, sobre, nota, verificar });
await fs.writeFile(ARQ, JSON.stringify(prefs, null, 2) + '\n');
console.log(`Registrado ${id} (${sobre}): ${nota}${verificar ? ` · a conferência vai avisar (${verificar.tipo}: ${verificar.valor})` : ''}`);

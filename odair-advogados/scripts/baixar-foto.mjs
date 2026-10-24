// Baixa a foto da abertura no build quando ela ainda não está em public/.
// Roda antes de `next build` (script "prebuild"). Nunca derruba o build: se não
// conseguir baixar, avisa e segue (a abertura continua legível sobre o marinho).
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = join(import.meta.dirname, "..");
const config = await readFile(join(root, "config/site.ts"), "utf8");
const block = config.slice(config.indexOf("heroPhoto:"));
const src = block.match(/src:\s*"([^"]+)"/)?.[1];
const remote = block.match(/remote:\s*\n?\s*"([^"]+)"/)?.[1];

if (!src || !remote) {
  console.log("[foto] sem download configurado.");
  process.exit(0);
}

const target = join(root, "public", src);
if (existsSync(target)) {
  console.log(`[foto] ${src} já existe.`);
  process.exit(0);
}

try {
  const res = await fetch(remote, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await res.arrayBuffer()));
  console.log(`[foto] baixada em public${src}.`);
} catch (error) {
  console.warn(`[foto] não foi possível baixar (${error.message}). O build segue sem a foto.`);
}

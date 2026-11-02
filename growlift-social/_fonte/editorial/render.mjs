// Gera os carrosséis editoriais a partir dos roteiros (JSON), confere cada slide e grava o relatório.
//   node growlift-social/_fonte/editorial/render.mjs            → todos os roteiros
//   node growlift-social/_fonte/editorial/render.mjs a b        → só os que começam com "a" e "b"
// Saída: editorial/saida/<slug>/NN.png (fora das pastas que vão para o painel) + saida/relatorio.json.
// Não mexe nos 12 carrosséis antigos (carrosseis.mjs → 09-carrosseis/).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { renderSlide, W, H } from './nucleo.mjs';
import { conferirRoteiro, conferirTela, dhash, distancia } from './conferir.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SAIDA = path.join(HERE, 'saida');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ler = async (f) => JSON.parse(await fs.readFile(f, 'utf8'));

const fatos = await ler(path.join(HERE, 'fatos.json'));
const preferencias = await ler(path.join(HERE, 'preferencias.json'));
const filtro = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const arquivos = (await fs.readdir(path.join(HERE, 'roteiros'))).filter((f) => f.endsWith('.json') && (!filtro.length || filtro.some((p) => f.startsWith(p)))).sort();

const browser = await chromium.launch({ executablePath: CHROME });
const pg = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
const relatorio = { geradoEm: new Date().toISOString(), carrosseis: [] };
let erros = 0;

for (const f of arquivos) {
  const r = await ler(path.join(HERE, 'roteiros', f));
  const achados = conferirRoteiro(r, { fatos, preferencias });
  const dir = path.join(SAIDA, r.slug);
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(path.join(dir, 'html'), { recursive: true });
  const pngs = [];
  for (let i = 0; i < r.slides.length; i++) {
    const n = i + 1;
    const html = renderSlide(r.slides[i], { n, total: r.slides.length, serie: r.serie });
    const htmlPath = path.join(dir, 'html', `${String(n).padStart(2, '0')}.html`);
    await fs.writeFile(htmlPath, html);
    await pg.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    for (const a of await pg.evaluate(conferirTela)) achados.push({ ...a, slide: n });
    const png = path.join(dir, `${String(n).padStart(2, '0')}.png`);
    await pg.screenshot({ path: png });
    pngs.push(png);
  }
  // Slides quase idênticos (imagem), dentro do carrossel.
  const hashes = await Promise.all(pngs.map((p) => dhash(sharp, p)));
  for (let i = 1; i < hashes.length; i++) {
    const d = distancia(hashes[i], hashes[i - 1]);
    if (d <= 6) achados.push({ nivel: 'aviso', slide: i + 1, regra: 'parecido', msg: `Muito parecido com o slide ${i} (diferença ${d}/64).` });
  }
  const e = achados.filter((a) => a.nivel === 'erro').length;
  erros += e;
  relatorio.carrosseis.push({ slug: r.slug, status: r.status, slides: r.slides.length, erros: e, avisos: achados.length - e, achados });
  console.log(`\n${r.slug} · ${r.slides.length} slides · ${e} erro(s), ${achados.length - e} aviso(s)`);
  for (const a of achados.sort((x, y) => x.slide - y.slide)) console.log(`  ${a.nivel === 'erro' ? '✗' : '·'} slide ${a.slide || '-'} [${a.regra}] ${a.msg}`);
}
await browser.close();
await fs.mkdir(SAIDA, { recursive: true });
await fs.writeFile(path.join(SAIDA, 'relatorio.json'), JSON.stringify(relatorio, null, 2));
console.log(`\n${erros ? `✗ ${erros} erro(s): corrija antes de aprovar.` : '✓ Nenhum erro.'} Relatório: ${path.relative(process.cwd(), path.join(SAIDA, 'relatorio.json'))}`);
process.exitCode = erros ? 1 : 0;

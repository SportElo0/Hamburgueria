// Review boards for the Reel v3, built from renders/v3/quadros (reel3.mjs --quadros) and storyboard-v3.json:
//   previews/v3-storyboard.png    the 17 frames in order, with time, project, text and what changed
//   previews/v3-antes-depois.png  v2 (delivered) next to v3, scene by scene
//   node growlift-social/_fonte/reel-premium/v2/source/pranchas3.mjs
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const V2 = path.join(ROOT, 'renders', 'quadros');
const V3 = path.join(ROOT, 'renders', 'v3', 'quadros');
const OUT = path.join(ROOT, 'previews');
const FONT = path.join(ROOT, 'assets', 'fontes', 'inter-latin-wght-normal.woff2');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const sb = JSON.parse(fs.readFileSync(path.join(ROOT, 'storyboard-v3.json'), 'utf8'));

const img = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
const sec = (s) => `${s.toFixed(2).replace(/0$/, '').replace('.', ',')} s`;
const BASE = `@font-face{font-family:Inter;font-weight:100 900;src:url(${img(FONT).replace('image/png', 'font/woff2')}) format('woff2')}
:root{--bg:#06080d;--line:rgba(255,255,255,.1);--text:#f3f5f9;--soft:#c6cede;--muted:#a9b3c7;--blue:#0865fe;--blue-hi:#4d8dff}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
h1{font-size:60px;font-weight:800;letter-spacing:-.04em}.sub{margin-top:14px;font-size:25px;color:var(--soft)}
img{display:block;width:100%;border-radius:16px;box-shadow:0 0 0 1px var(--line)}`;

const sheet = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}
body{width:3000px;padding:80px}
.grid{margin-top:52px;display:grid;grid-template-columns:repeat(6,1fr);gap:40px 28px}
.f{position:relative}.n{position:absolute;left:12px;top:12px;font:800 24px/1 Inter;background:rgba(0,0,0,.65);padding:8px 12px;border-radius:10px}
figcaption{margin-top:14px;display:flex;flex-direction:column;gap:6px}
b{font-size:23px}span{font-size:19px;color:var(--blue-hi);font-weight:600}
em{font-style:normal;font-size:18px;color:var(--soft);line-height:1.35}i{font-style:normal;font-size:17px;color:var(--muted);line-height:1.35}
</style></head><body>
<h1>Sua marca merece mais. · Storyboard v3 (revisão)</h1>
<div class="sub">${sb.duracao.toString().replace('.', ',')} s · ${sb.formato} · ${sb.ritmo} · quadros tirados do vídeo de revisão · projetos conceito com nome fictício</div>
<div class="grid">${sb.quadros.map((q) => `<figure class="f"><img src="${img(path.join(V3, q.arquivo))}"><span class="n">${q.n}</span>
<figcaption><b>${q.nome}</b><span>${sec(q.inicio)} – ${sec(q.fim)} · ${q.projeto}</span>${q.texto ? `<em>“${q.texto}”</em>` : ''}<i>${q.mudou}</i></figcaption></figure>`).join('')}</div>
</body></html>`;

const ba = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}
body{width:2400px;padding:70px}
.rows{margin-top:44px;display:grid;grid-template-columns:repeat(3,1fr);gap:56px 44px}
h2{font-size:26px;font-weight:700}p{margin-top:8px;font-size:19px;line-height:1.4;color:var(--soft);min-height:54px}
.two{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:14px}.two div{position:relative}
.two span{position:absolute;left:10px;top:10px;font:700 16px/1 Inter;letter-spacing:.08em;text-transform:uppercase;padding:8px 11px;border-radius:999px;background:rgba(0,0,0,.65)}
.two div+div span{background:var(--blue)}
</style></head><body><h1>Antes e depois · v2 entregue → v3 revisão</h1><div class="rows">
${sb.comparacao.map(([a, b, t, why]) => `<div><h2>${t}</h2><p>${why}</p><div class="two"><div><img src="${img(path.join(V2, a))}"><span>v2</span></div><div><img src="${img(path.join(V3, b))}"><span>v3</span></div></div></div>`).join('')}
</div></body></html>`;

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 3000, height: 1000 } });
for (const [html, file, width] of [[sheet, 'v3-storyboard.png', 3000], [ba, 'v3-antes-depois.png', 2400]]) {
  await page.setViewportSize({ width, height: 1000 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, file), fullPage: true, type: 'png' });
  console.log(file);
}
await browser.close();

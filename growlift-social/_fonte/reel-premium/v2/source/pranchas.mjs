// Approval boards for the Reel v2, built from keyframes/ and storyboard.json:
//   previews/storyboard-contact-sheet.png   every frame in order, with time, project, text and the colour run
//   previews/antes-depois.png               old storyboard (v1) next to the new one, scene by scene
//   previews/storyboard-preview.html        one self-contained page to step through the frames (no video)
//   node growlift-social/_fonte/reel-premium/v2/source/pranchas.mjs
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KF = path.join(ROOT, 'keyframes');
const OUT = path.join(ROOT, 'previews');
const V1 = path.join(ROOT, '..', 'styleframes');
const FONT = path.join(ROOT, 'assets', 'fontes', 'inter-latin-wght-normal.woff2');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const sb = JSON.parse(fs.readFileSync(path.join(ROOT, 'storyboard.json'), 'utf8'));
fs.mkdirSync(OUT, { recursive: true });

// JPEG copies (for the self-contained page) and each frame's average colour (for the colour run), via Pillow.
const tmp = fs.mkdtempSync(path.join(OUT, '_tmp-'));
const info = JSON.parse(execFileSync('python3', ['-c', `
import json, sys
from PIL import Image, ImageStat
out = {}
for f in sys.argv[2:]:
    im = Image.open(f).convert('RGB')
    im.resize((720, 1280), Image.LANCZOS).save(sys.argv[1] + '/' + f.split('/')[-1].replace('.png', '.jpg'), quality=86)
    r, g, b = [int(v) for v in ImageStat.Stat(im.resize((54, 96))).median]
    out[f.split('/')[-1]] = '#%02x%02x%02x' % (r, g, b)
print(json.dumps(out))`, tmp, ...sb.quadros.map((q) => path.join(KF, q.arquivo))]).toString());
const jpg = (q) => `data:image/jpeg;base64,${fs.readFileSync(path.join(tmp, q.arquivo.replace('.png', '.jpg'))).toString('base64')}`;
const fontData = `data:font/woff2;base64,${fs.readFileSync(FONT).toString('base64')}`;
const sec = (s) => `${s.toFixed(1).replace('.', ',')} s`;

const BASE = `@font-face{font-family:Inter;font-weight:100 900;src:url(${fontData}) format('woff2')}
:root{--bg:#06080d;--panel:#0f1520;--line:rgba(255,255,255,.1);--text:#f3f5f9;--soft:#c6cede;--muted:#a9b3c7;--blue:#0865fe;--blue-hi:#4d8dff}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}`;

// A. Contact sheet.
const card = (q) => `<figure class="f${q.tipo === 'transicao' ? ' t' : ''}">
  <div class="img"><img src="${jpg(q)}"><span class="n">${q.n}</span>${q.tipo === 'transicao' ? '<span class="tt">Transição</span>' : ''}</div>
  <figcaption><b>${q.nome}</b><span>${sec(q.inicio)} – ${sec(q.fim)} · ${q.projeto}</span><em>${q.texto}</em></figcaption></figure>`;
const run = sb.quadros.map((q) => `<i style="flex:${q.fim - q.inicio};background:${info[q.arquivo]}" title="${q.n}"></i>`).join('');
const sheet = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}
body{width:3000px;padding:80px}
h1{font-size:64px;font-weight:800;letter-spacing:-.04em}
.sub{margin-top:14px;font-size:26px;color:var(--soft)}
.grid{margin-top:56px;display:grid;grid-template-columns:repeat(7,1fr);gap:36px 28px}
.f .img{position:relative;border-radius:18px;overflow:hidden;box-shadow:0 0 0 1px var(--line)}
.f.t .img{box-shadow:0 0 0 3px var(--blue-hi)}
.f img{display:block;width:100%}
.n{position:absolute;left:12px;top:12px;font:800 26px/1 Inter;background:rgba(0,0,0,.6);padding:8px 12px;border-radius:10px}
.tt{position:absolute;right:12px;top:12px;font:700 17px/1 Inter;letter-spacing:.08em;text-transform:uppercase;background:var(--blue);padding:9px 12px;border-radius:999px}
figcaption{margin-top:14px;display:flex;flex-direction:column;gap:6px}
figcaption b{font-size:23px;letter-spacing:-.01em}
figcaption span{font-size:19px;color:var(--blue-hi);font-weight:600}
figcaption em{font-style:normal;font-size:18px;color:var(--muted);line-height:1.35}
.run{margin-top:56px}
.run h2{font-size:24px;font-weight:700;color:var(--soft);margin-bottom:14px}
.bar{display:flex;height:46px;border-radius:12px;overflow:hidden;box-shadow:0 0 0 1px var(--line)}
.ticks{display:flex;margin-top:10px;font-size:18px;color:var(--muted)}
.ticks i{font-style:normal}
</style></head><body>
<h1>Sua marca merece mais. · Storyboard v2</h1>
<div class="sub">Reel Growlift · 25 s · 1080×1920 · ${sb.quadros.length} quadros (8 cenas e 5 transições, com borda azul) · projetos conceito com nome fictício</div>
<div class="grid">${sb.quadros.map(card).join('')}</div>
<div class="run"><h2>Progressão de cor ao longo dos 25 s (largura = tempo na tela)</h2><div class="bar">${run}</div>
<div class="ticks">${sb.quadros.map((q) => `<i style="flex:${q.fim - q.inicio}">${q.n}</i>`).join('')}</div></div>
</body></html>`;

// C. Before and after, scene by scene.
const PAIRS = [
  ['01-hook.png', '01-hook.png', 'Abertura', 'MAIS. ganha o dobro do tamanho e a marca Growlift entra no topo; a linha de luz decorativa saiu.'],
  ['02-provocacao.png', '02-transicao-hook-salinho.png', 'Segundo momento', 'A frase "Não basta estar online…" saiu (repetia o hook e atrasava os sites). O ponto azul vira a tela da Salinho.'],
  ['03-salinho-janela.png', '03-salinho-entrada.png', 'Salinho · entrada', 'Captura 4× sem a margem creme, sem barra de navegador falsa; legenda no sistema Growlift.'],
  ['04-salinho-celular.png', '04-salinho-principal.png', 'Salinho · principal', 'A interface desmontada em camadas, no fundo exato do site; nada pixelado.'],
  ['06-chapa77.png', '07-chapa77.png', 'Chapa 77', 'Mostra a história em cores do site (5 capítulos), não um recorte isolado do lanche.'],
  ['07-transicao-amarelo.png', '08-transicao-chapa77-swellclub.png', 'Chapa 77 → Swell Club', 'A ponte usa o verde-água que os dois sites já têm, no lugar de um amarelo inventado.'],
  ['10-fornada.png', '11-fornada.png', 'Fornada', 'Fundo creme e tipografia editorial do próprio site, com a fotografia.'],
  ['12-assinatura.png', '13-assinatura.png', 'Assinatura', 'Logotipo oficial (símbolo + GROWLIFT) como protagonista, com chamada e endereço.'],
];
const b64 = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
const ba = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}
body{width:2400px;padding:70px}
h1{font-size:56px;font-weight:800;letter-spacing:-.04em}
.rows{margin-top:44px;display:grid;grid-template-columns:repeat(3,1fr);gap:56px 44px}
.p h2{font-size:26px;font-weight:700}.p p{margin-top:8px;font-size:19px;line-height:1.4;color:var(--soft);min-height:54px}
.two{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
.two div{position:relative}.two img{display:block;width:100%;border-radius:14px;box-shadow:0 0 0 1px var(--line)}
.two span{position:absolute;left:10px;top:10px;font:700 16px/1 Inter;letter-spacing:.08em;text-transform:uppercase;padding:8px 11px;border-radius:999px;background:rgba(0,0,0,.65)}
.two div+div span{background:var(--blue)}
</style></head><body><h1>Antes e depois · storyboard v1 → v2</h1><div class="rows">
${PAIRS.map(([a, b, t, why]) => `<div class="p"><h2>${t}</h2><p>${why}</p><div class="two"><div><img src="${b64(path.join(V1, a))}"><span>Antes</span></div><div><img src="${b64(path.join(KF, b))}"><span>Depois</span></div></div></div>`).join('')}
</div></body></html>`;

// E. Navigable preview: one file, frames embedded, plays with the planned timing.
const data = sb.quadros.map((q) => ({ ...q, src: jpg(q), cor_media: info[q.arquivo] }));
const preview = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reel Growlift · prévia</title><style>${BASE}
body{min-height:100vh;display:grid;grid-template-columns:minmax(0,auto) minmax(300px,420px);gap:32px;padding:24px;align-items:start;justify-content:center}
.stage{position:relative;height:calc(100vh - 140px);max-height:1100px;aspect-ratio:9/16}
.stage img{position:absolute;inset:0;width:100%;height:100%;border-radius:22px;object-fit:cover;box-shadow:0 0 0 1px var(--line);transition:opacity .25s}
.ctrl{grid-column:1;display:flex;gap:10px;align-items:center;margin-top:12px}
button{font:600 15px/1 Inter;color:var(--text);background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:12px 18px;cursor:pointer}
button:hover{border-color:var(--blue-hi)}button:focus-visible{outline:2px solid var(--blue-hi);outline-offset:2px}
button.on{background:var(--blue);border-color:var(--blue)}
.time{margin-left:auto;font:600 15px/1 Inter;color:var(--muted);font-variant-numeric:tabular-nums}
.tl{display:flex;gap:3px;margin-top:12px;height:34px}
.tl button{padding:0;border-radius:6px;flex:var(--d);min-width:0;font-size:12px;color:var(--muted)}
.tl button.cur{background:var(--blue);color:#fff}
aside{background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:26px;position:sticky;top:24px}
aside h1{font-size:28px;letter-spacing:-.03em;line-height:1.1}
aside .meta{margin-top:8px;color:var(--blue-hi);font-weight:600;font-size:15px}
dl{margin-top:20px;display:grid;gap:12px}dt{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}dd{font-size:15px;line-height:1.45;color:var(--soft)}
.sw{display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-1px;margin-right:6px}
@media (max-width:820px){body{grid-template-columns:1fr;padding:16px}.stage{height:auto;width:100%}aside{position:static}}
</style></head><body>
<div><div class="stage"><img id="img" alt=""></div>
<div class="ctrl"><button id="prev" aria-label="Quadro anterior">←</button><button id="play">▶ Tocar com o tempo do vídeo</button><button id="next" aria-label="Próximo quadro">→</button><span class="time" id="time"></span></div>
<div class="tl" id="tl"></div></div>
<aside><h1 id="name"></h1><div class="meta" id="meta"></div><dl id="dl"></dl></aside>
<script>
const Q = ${JSON.stringify(data)};
let i = 0, timer = null;
const $ = (id) => document.getElementById(id);
const tl = $('tl');
Q.forEach((q, k) => { const b = document.createElement('button'); b.textContent = q.n; b.style.setProperty('--d', q.fim - q.inicio); b.title = q.nome; b.onclick = () => { stop(); show(k); }; tl.appendChild(b); });
const s = (v) => v.toFixed(1).replace('.', ',') + ' s';
const ROWS = [['Texto na tela', 'texto'], ['Objetivo', 'objetivo'], ['Composição', 'composicao'], ['Câmera', 'camera'], ['Profundidade', 'profundidade'], ['Entra', 'entrada'], ['Sai', 'saida'], ['Elemento que liga', 'preservado'], ['Técnica da animação', 'tecnica'], ['Arquivos de origem', 'origem'], ['Status', 'status']];
function show(k) {
  i = (k + Q.length) % Q.length; const q = Q[i];
  $('img').src = q.src; $('img').alt = q.nome;
  $('name').textContent = q.n + ' · ' + q.nome;
  $('meta').textContent = s(q.inicio) + ' – ' + s(q.fim) + ' · ' + q.projeto;
  $('time').textContent = (i + 1) + '/' + Q.length;
  $('dl').innerHTML = '<dt>Cor</dt><dd><span class="sw" style="background:' + q.cor_media + '"></span>' + q.cor + '</dd>' + ROWS.map(([t, key]) => '<dt>' + t + '</dt><dd>' + [].concat(q[key]).join('<br>') + '</dd>').join('');
  [...tl.children].forEach((b, n) => b.classList.toggle('cur', n === i));
}
function stop() { clearTimeout(timer); timer = null; $('play').classList.remove('on'); $('play').textContent = '▶ Tocar com o tempo do vídeo'; }
function tick() { const q = Q[i]; timer = setTimeout(() => { if (i === Q.length - 1) return stop(); show(i + 1); tick(); }, (q.fim - q.inicio) * 1000); }
$('play').onclick = () => { if (timer) return stop(); if (i === Q.length - 1) show(0); $('play').classList.add('on'); $('play').textContent = '❚❚ Pausar'; tick(); };
$('prev').onclick = () => { stop(); show(i - 1); }; $('next').onclick = () => { stop(); show(i + 1); };
addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') $('next').click(); if (e.key === 'ArrowLeft') $('prev').click(); if (e.key === ' ') { e.preventDefault(); $('play').click(); } });
show(0);
</script></body></html>`;
fs.writeFileSync(path.join(OUT, 'storyboard-preview.html'), preview);

const browser = await chromium.launch({ executablePath: CHROME });
const page = await (await browser.newContext({ viewport: { width: 3000, height: 1000 }, deviceScaleFactor: 1 })).newPage();
for (const [html, file, width] of [[sheet, 'storyboard-contact-sheet.png', 3000], [ba, 'antes-depois.png', 2400]]) {
  await page.setViewportSize({ width, height: 1000 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, file), fullPage: true });
  console.log(file);
}
// The preview page must open and step through every frame without errors.
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`file://${path.join(OUT, 'storyboard-preview.html')}`);
for (let k = 0; k < sb.quadros.length; k++) await page.click('#next');
await page.screenshot({ path: path.join(tmp, 'preview-check.png') });
await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log('storyboard-preview.html', errors.length ? `ERROS: ${errors.join(' | ')}` : 'sem erros');

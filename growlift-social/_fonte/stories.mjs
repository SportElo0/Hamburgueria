// Stories of the day (one-off, not highlights): node growlift-social/_fonte/stories.mjs
// Writes the PNGs to growlift-social/11-stories/. Poll stories leave an empty area for the Instagram poll sticker
// (the sticker texts go in 11-stories/stories.md, ready to copy).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { page, MARK, TOKENS } from './pecas.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../11-stories');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const CSS = `
body{background:#06080d;overflow:hidden}
.glow{position:absolute;border-radius:50%;filter:blur(40px)}
.brand{position:absolute;left:96px;top:250px;display:flex;align-items:center;gap:16px;font-size:28px;font-weight:700;letter-spacing:.14em;color:#e8eefa}
.brand svg{height:30px;width:auto}
.pill{display:inline-flex;align-items:center;gap:12px;height:62px;padding:0 28px;border-radius:999px;font-size:28px;font-weight:700;color:#cfe0ff;background:rgba(8,101,254,.22);border:1.5px solid rgba(77,141,255,.55)}
h1{font-size:104px;font-weight:800;letter-spacing:-.04em;line-height:1;color:#fff}
h1 .b{color:${TOKENS.blueBright}}
.lead{font-size:40px;line-height:1.3;color:#c6cede;font-weight:500}
.res{border-radius:34px;background:#0f1520;border:1.5px solid rgba(255,255,255,.12);box-shadow:0 50px 100px -40px rgba(0,0,0,.95);overflow:hidden}
.search{display:flex;align-items:center;gap:20px;margin:26px;padding:22px 30px;border-radius:999px;background:#1a2231;font-size:32px;color:#c6cede}
.row{display:flex;align-items:center;gap:22px;padding:22px 34px;border-top:1px solid rgba(255,255,255,.07);font-size:36px;font-weight:600;color:#f3f5f9}
.row i{flex:none;width:58px;height:58px;border-radius:18px;display:grid;place-items:center;font-style:normal;font-size:30px;font-weight:800}
.ok{background:rgba(20,184,154,.18);color:#4fe0bf}.q{background:rgba(255,210,63,.16);color:#ffd23f}
.hint{position:absolute;left:0;right:0;text-align:center;font-size:36px;font-weight:600;color:#e3ebfb}
`;

const enquete = page(1080, 1920, `
  <div class="glow" style="right:-260px;top:-200px;width:760px;height:760px;background:radial-gradient(closest-side,rgba(8,101,254,.55),rgba(8,101,254,0))"></div>
  <div class="brand">${MARK}GROWLIFT</div>
  <div style="position:absolute;left:96px;right:96px;top:350px">
    <span class="pill">Pergunta rápida</span>
    <h1 style="margin-top:34px">Se alguém procurar o seu negócio <span class="b">agora…</span></h1>
    <p class="lead" style="margin-top:26px">o que aparece no Google?</p>
  </div>
  <div class="res" style="position:absolute;left:96px;right:96px;top:900px">
    <div class="search"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#8db8ff" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>o seu negócio perto de mim</div>
    <div class="row"><i class="q">?</i>Fotos do lugar e dos produtos</div>
    <div class="row"><i class="q">?</i>Horário certo de hoje</div>
    <div class="row"><i class="q">?</i>Botão de WhatsApp ou de rota</div>
  </div>
  <p class="hint" style="top:1380px">Responde aqui embaixo 👇</p>
`, CSS);

const pieces = [['2026-11-22-enquete-google.png', enquete]];
await fs.mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [file, html] of pieces) {
  const tmp = path.join(HERE, 'html', `story-${file.replace('.png', '.html')}`);
  await fs.mkdir(path.dirname(tmp), { recursive: true });
  await fs.writeFile(tmp, html);
  await pg.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: path.join(OUT, file) });
  console.log(path.join(OUT, file));
}
await browser.close();

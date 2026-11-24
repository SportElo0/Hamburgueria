// Stories of the day (one-off, not highlights): node growlift-social/_fonte/stories.mjs
// Writes the PNGs to growlift-social/11-stories/. Poll stories leave an empty area for the Instagram poll sticker
// (the sticker texts go in 11-stories/stories.md, ready to copy).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { page, MARK, TOKENS, linkSlot } from './pecas.mjs';

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

const ASSETS = pathToFileURL(path.join(HERE, 'assets', 'stories') + '/').href;
const A = (f) => ASSETS + f;
const GLOW = `<div class="glow" style="right:-260px;top:-220px;width:760px;height:760px;background:radial-gradient(closest-side,rgba(8,101,254,.55),rgba(8,101,254,0))"></div>`;
const BRAND = `<div class="brand">${MARK}GROWLIFT</div>`;

// 22/11 · 1 of 2: the poll. Four real pains, each with the screen of what we build for it; the Instagram poll goes below.
const DORES = [
  ['tela-whatsapp.webp', 'object-position:20% 20%', 'Mensagem que fica sem resposta'],
  ['tela-torpedo.png', 'object-position:50% 30%', 'Cliente que pede uma vez e some'],
  ['tela-painel.webp', 'object-position:60% 30%', 'Não saber o que dá lucro'],
  ['tela-crm.png', 'object-position:0% 0%', 'Clientes perdidos no caderno'],
];
const enquete = page(1080, 1920, `
  ${GLOW}${BRAND}
  <div style="position:absolute;left:96px;right:96px;top:340px">
    <span class="pill">Enquete</span>
    <h1 style="margin-top:28px;font-size:86px">Qual é a maior <span class="b">dor</span> do seu negócio hoje?</h1>
  </div>
  <div style="position:absolute;left:96px;right:96px;top:745px;display:grid;grid-template-columns:1fr 1fr;gap:22px">
    ${DORES.map(([img, pos, txt], i) => `<div class="tile">
      <div class="shot"><img src="${A(img)}" style="${pos}"></div>
      <p><b>${i + 1}</b>${txt}</p></div>`).join('')}
  </div>
  <p class="hint" style="top:1255px">Vota aqui embaixo 👇</p>
`, CSS + `
.tile{border-radius:30px;background:#0f1520;border:1.5px solid rgba(255,255,255,.12);overflow:hidden;box-shadow:0 40px 80px -40px rgba(0,0,0,.9)}
.tile .shot{height:128px;overflow:hidden;background:#111827}
.tile .shot img{width:100%;height:100%;object-fit:cover;opacity:.92}
.tile p{display:flex;gap:16px;align-items:flex-start;padding:18px 22px 22px;font-size:31px;font-weight:700;line-height:1.18;color:#f3f5f9}
.tile p b{flex:none;width:44px;height:44px;border-radius:14px;display:grid;place-items:center;font-size:24px;background:${TOKENS.blue};color:#fff}
`);

// 22/11 · 2 of 2: the answer. What we build for each pain (our real product screens, example data), link to the site.
const SOLUCOES = [
  ['tela-whatsapp.webp', 'object-position:20% 20%', 'Atendente de IA no WhatsApp', 'Responde de madrugada com os seus preços e marca o horário.'],
  ['tela-torpedo.png', 'object-position:50% 30%', 'Torpedo com IA', 'Prepara a mensagem pra chamar de volta quem sumiu.'],
  ['tela-painel.webp', 'object-position:60% 30%', 'Painel do lucro', 'Quanto sobra de cada prato, sem planilha.'],
  ['tela-crm.png', 'object-position:0% 0%', 'CRM dos seus clientes', 'Quem comprou, quanto, o que falta receber.'],
];
const solucoes = page(1080, 1920, `
  ${GLOW}${BRAND}
  <div style="position:absolute;left:96px;right:96px;top:340px">
    <span class="pill">Pra cada dor, uma solução</span>
    <h1 style="margin-top:30px;font-size:92px">A gente monta o sistema <span class="b">do seu jeito.</span></h1>
  </div>
  <div style="position:absolute;left:96px;right:96px;top:650px;display:grid;gap:18px">
    ${SOLUCOES.map(([img, pos, t, d]) => `<div class="sol">
      <div class="shot"><img src="${A(img)}" style="${pos}"></div>
      <div><b>${t}</b><span>${d}</span></div></div>`).join('')}
  </div>
  <p style="position:absolute;left:0;right:0;top:1318px;text-align:center;font-size:24px;color:#7d879c">Telas de exemplo · dados fictícios</p>
  ${linkSlot('Toque no link e veja funcionando', 1385)}
`, CSS + `
.sol{display:flex;gap:26px;align-items:center;padding:16px;border-radius:30px;background:#0f1520;border:1.5px solid rgba(255,255,255,.12)}
.sol .shot{flex:none;width:250px;height:120px;border-radius:20px;overflow:hidden;background:#111827}
.sol .shot img{width:100%;height:100%;object-fit:cover}
.sol b{display:block;font-size:36px;font-weight:800;color:#fff;letter-spacing:-.01em}
.sol span{display:block;font-size:27px;line-height:1.25;color:#c6cede;margin-top:6px}
`);

const pieces = [['2026-11-22-1-enquete-maior-dor.png', enquete], ['2026-11-22-2-pra-cada-dor.png', solucoes]];
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

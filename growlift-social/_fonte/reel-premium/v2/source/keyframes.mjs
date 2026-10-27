// Keyframes of the Reel v2, 1080×1920, drawn in HTML from the real captures and rendered with Playwright.
// Every image comes from v2/assets (captures, cuts, the Salinho site's own product files, the Growlift logo):
// nothing is generated and nothing loads from the internet.
//   node growlift-social/_fonte/reel-premium/v2/source/keyframes.mjs [01 07 …]   → v2/keyframes/NN-name.png
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'keyframes');
const A = (f) => `file://${path.join(ROOT, 'assets', f)}`;
const CUT = (f) => A(`_recortes/${f}.png`);
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Growlift tokens, taken from growlift/styles.css (the live site), not from the brief's approximations.
const T = { bg: '#06080d', bg2: '#0b0f17', blue: '#0865fe', blueHi: '#4d8dff', text: '#f3f5f9', soft: '#c6cede', muted: '#a9b3c7' };
// Each site's own colours, sampled from the captures.
const C = { salinho: '#35312b', salinhoGreen: '#227a4b', chapa: '#a3171c', teal: '#0c6d69', swell: '#0c4b71', petrol: '#086d75', fornadaDark: '#241a14', fornadaCream: '#f4ede0' };

const MARK_PATHS = '<path d="M280 48H410L190 450H55Z"/><path fill-rule="evenodd" d="M470 130L570 450H258Z M418 220L480 380H309Z"/>';
const mark = (w, color = T.blue) => `<svg viewBox="50 40 530 415" width="${w}" height="${Math.round((w * 415) / 530)}" fill="${color}" aria-hidden="true">${MARK_PATHS}</svg>`;
const MARK_MASK = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='50 40 530 415'>${MARK_PATHS}</svg>`)}")`;

const head = `<style>
@font-face{font-family:Inter;font-weight:100 900;src:url(${A('fontes/inter-latin-wght-normal.woff2')}) format('woff2');unicode-range:U+0000-00FF,U+2000-206F}
@font-face{font-family:Inter;font-weight:100 900;src:url(${A('fontes/inter-latin-ext-wght-normal.woff2')}) format('woff2');unicode-range:U+0100-02BA,U+1E00-1E9F}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden}
body{position:relative;font-family:Inter,sans-serif;color:${T.text};background:${T.bg};-webkit-font-smoothing:antialiased}
.abs{position:absolute}
img{display:block}
.screen{position:absolute;border-radius:40px;overflow:hidden;box-shadow:0 60px 120px -40px rgba(0,0,0,.65),0 0 0 1.5px rgba(255,255,255,.12)}
.screen>img{width:100%;height:100%;object-fit:cover}
.phone{position:absolute;border-radius:66px;padding:14px;background:#0b0d12;box-shadow:0 70px 120px -40px rgba(0,0,0,.75),inset 0 0 0 1.5px rgba(255,255,255,.16)}
.phone>img{width:100%;border-radius:53px}
.lift{box-shadow:0 40px 70px -24px rgba(0,0,0,.55),0 8px 18px -8px rgba(0,0,0,.35)}
.lock{display:inline-flex;align-items:center;gap:14px;font:700 21px/1 Inter;letter-spacing:.2em;color:rgba(243,245,249,.78)}
.cap{position:absolute;left:72px;bottom:360px;max-width:820px;z-index:20}
.cap .name{margin-top:20px;font:800 92px/.94 Inter;letter-spacing:-.045em}
.cap .desc{margin-top:16px;font:500 31px/1.3 Inter;color:${T.soft};letter-spacing:-.01em}
.cap .tag{display:inline-block;margin-top:22px;padding:10px 18px;border-radius:999px;border:1.5px solid rgba(243,245,249,.3);font:600 19px/1 Inter;letter-spacing:.14em;text-transform:uppercase;color:rgba(243,245,249,.82)}
.cap.dark .lock{color:rgba(36,26,20,.75)}.cap.dark .name{color:#241a14}.cap.dark .desc{color:#5b4a3d}.cap.dark .tag{color:#4a3a2e;border-color:rgba(36,26,20,.3)}
.scrim{position:absolute;left:0;right:0;bottom:0;height:900px;background:linear-gradient(rgba(6,8,13,0),rgba(6,8,13,.88) 62%);z-index:10}
</style>`;

const caption = (name, desc, dark = false) => `<div class="cap${dark ? ' dark' : ''}">
  <div class="lock">${mark(34, dark ? '#241a14' : T.blueHi)}GROWLIFT</div>
  <div class="name">${name}</div><div class="desc">${desc}</div>
  <div class="tag">Projeto conceito · nome fictício</div></div>`;

const FRAMES = [
  ['01-hook', `
    <div class="abs" style="inset:0;background:radial-gradient(120% 60% at 20% 100%,${T.bg2},${T.bg} 70%)"></div>
    <div class="abs" style="left:72px;top:250px">${'<div class="lock">' + mark(40, T.blue) + 'GROWLIFT</div>'}</div>
    <div class="abs" style="left:66px;top:660px;font:800 158px/.9 Inter;letter-spacing:-.055em">SUA MARCA<br>MERECE</div>
    <div class="abs" style="left:58px;top:948px;font:800 338px/.86 Inter;letter-spacing:-.06em;color:${T.blueHi}">MAIS.</div>`],

  ['02-transicao-hook-salinho', `
    <div class="abs" style="inset:0;background:${T.bg}"></div>
    <div class="abs" style="left:58px;top:250px;font:800 338px/.86 Inter;letter-spacing:-.06em;color:${T.blueHi}">MAIS</div>
    <div class="screen" style="left:72px;top:600px;width:936px;height:1000px;border-radius:44px;box-shadow:0 0 0 5px ${T.blueHi},0 60px 140px -30px rgba(8,101,254,.45)">
      <img src="${CUT('salinho-cartao')}" style="object-position:53% 50%"></div>`],

  ['03-salinho-entrada', `
    <div class="abs" style="inset:0;background:radial-gradient(90% 55% at 50% 38%,#3b372f,${T.bg} 78%)"></div>
    <div class="screen" style="left:-20px;top:250px;width:1450px;height:894px"><img src="${CUT('salinho-cartao')}"></div>
    ${caption('Salinho', 'Moda de linho · site com reserva da peça pelo WhatsApp')}`],

  ['04-salinho-principal', `
    <div class="abs" style="inset:0;background:${C.salinho}"></div>
    <div class="abs" style="inset:0;background:radial-gradient(55% 32% at 62% 56%,rgba(255,240,215,.13),transparent 70%),linear-gradient(transparent 70%,rgba(0,0,0,.35))"></div>
    <img class="abs" src="${CUT('salinho-titulo')}" style="left:60px;top:250px;width:600px">
    <img class="abs" src="${A('salinho/pecas/linen-short.webp')}" style="left:300px;top:540px;width:720px;filter:drop-shadow(0 60px 50px rgba(0,0,0,.45))">
    <img class="abs lift" src="${CUT('salinho-miniaturas')}" style="left:72px;top:1300px;width:470px;border-radius:12px">
    <img class="abs lift" src="${CUT('salinho-botao')}" style="left:72px;top:1450px;width:600px;border-radius:12px">`],

  ['05-salinho-celular', `
    <div class="abs" style="inset:0;background:radial-gradient(90% 55% at 50% 45%,#2f2c26,${T.bg} 80%)"></div>
    <div class="phone" style="left:-60px;top:430px;width:430px;filter:brightness(.55)"><img src="${A('salinho/cel-hero-peca-3.png')}"></div>
    <div class="phone" style="left:710px;top:430px;width:430px;filter:brightness(.55)"><img src="${A('salinho/cel-hero-peca-4.png')}"></div>
    <div class="phone" style="left:270px;top:280px;width:540px"><img src="${A('salinho/cel-hero.png')}"></div>`],

  ['06-transicao-salinho-chapa77', `
    <div class="abs" style="inset:0"><img src="${CUT('salinho-cartao')}" style="width:100%;height:100%;object-fit:cover;object-position:78% 50%;filter:brightness(.32) blur(6px)"></div>
    <div class="screen" style="left:72px;top:330px;width:936px;height:1270px;background:${C.chapa};border-radius:28px;box-shadow:0 0 0 0 transparent,0 60px 140px -30px rgba(0,0,0,.7)">
      <img src="${CUT('salinho-botao')}" style="position:absolute;left:0;top:0;width:936px;height:auto;object-fit:initial">
      <div class="abs" style="left:0;right:0;top:242px;bottom:0;background:radial-gradient(70% 60% at 50% 50%,#c11d23,${C.chapa})"></div>
      <img src="${CUT('chapa77-burger')}" style="position:absolute;left:-20px;top:380px;width:976px;height:auto;object-fit:initial;-webkit-mask-image:radial-gradient(closest-side,#000 82%,transparent)">
    </div>`],

  ['07-chapa77', `
    <div class="abs" style="inset:0;background:radial-gradient(90% 60% at 50% 40%,#c11d23,${C.chapa} 50%,#5e0a0e)"></div>
    ${[5, 4, 3, 2].map((n, i) => `<div class="screen" style="left:${72 + (4 - i) * 0}px;top:${300 + i * 62}px;width:936px;height:585px;transform:scale(${0.8 + i * 0.05});transform-origin:50% 0;filter:brightness(${0.55 + i * 0.1})"><img src="${A(`chapa77/pc-historia-${n}.png`)}"></div>`).join('')}
    <div class="screen" style="left:72px;top:548px;width:936px;height:585px"><img src="${A('chapa77/pc-historia-1.png')}"></div>
    ${caption('Chapa 77', 'Hamburgueria · a história do lanche contada na rolagem, com cardápio e pedido')}`],

  ['08-transicao-chapa77-swellclub', `
    <div class="abs" style="inset:0;background:${C.teal}"></div>
    <div class="abs" style="inset:0;clip-path:polygon(0 0,100% 0,100% 38%,0 62%)"><img src="${A('chapa77/cel-historia-6.png')}" style="width:1150px;margin-left:-20px;margin-top:-470px"></div>
    <div class="abs" style="inset:0;clip-path:polygon(0 62%,100% 38%,100% 100%,0 100%)"><img src="${A('swellclub/cel-pranchas.png')}" style="width:1080px;margin-top:150px"></div>
    <div class="abs" style="left:0;right:0;top:0;height:260px;background:linear-gradient(${C.teal} 55%,rgba(12,109,105,0))"></div>
    <div class="abs" style="left:-60px;width:1200px;top:959px;height:2px;background:rgba(255,255,255,.8);transform:rotate(-23.07deg);box-shadow:0 0 16px rgba(255,255,255,.45)"></div>`],

  ['09-swellclub', `
    <div class="abs" style="inset:0;background:radial-gradient(90% 60% at 50% 35%,#0f5f86,${C.swell} 45%,#04131c)"></div>
    <div class="screen" style="left:72px;top:250px;width:936px;height:860px"><img src="${A('swellclub/cel-hero.png')}" style="object-position:50% 15%"></div>
    ${[['pc-pranchas', 0], ['pc-aluguel', 1], ['pc-session', 2]].map(([f, i]) => `<div class="screen lift" style="left:${150 + i * 470}px;top:990px;width:440px;height:275px;border-radius:22px"><img src="${A(`swellclub/${f}.png`)}" style="object-position:0 0"></div>`).join('')}
    ${caption('Swell Club', 'Surf shop · pranchas, aluguel por diária e kit montado no site')}`],

  ['10-transicao-swellclub-fornada', `
    <div class="abs" style="inset:0;background:${C.fornadaDark}"></div>
    <img class="abs" src="${CUT('fornada-bebida')}" style="left:-30px;top:520px;width:1140px">
    <div class="abs" style="left:0;right:0;top:0;height:1180px;-webkit-mask-image:linear-gradient(#000 62%,transparent)"><img src="${CUT('swellclub-espuma')}" style="height:1180px;margin-left:-560px;filter:saturate(.85)"></div>
    <div class="abs" style="left:0;right:0;top:640px;height:560px;backdrop-filter:blur(16px);-webkit-mask-image:linear-gradient(transparent,#000 45%,#000 55%,transparent)"></div>`],

  ['11-fornada', `
    <div class="abs" style="inset:0;background:${C.fornadaCream}"></div>
    <img class="abs" src="${CUT('fornada-titulo')}" style="left:72px;top:250px;width:620px">
    <div class="phone" style="left:72px;top:520px;width:470px;background:#1b1410"><img src="${A('fornada/cel-historia-4.png')}"></div>
    <img class="abs lift" src="${CUT('fornada-folhado')}" style="left:590px;top:560px;width:418px;border-radius:6px">
    <img class="abs" src="${CUT('fornada-folhado-legenda')}" style="left:586px;top:1132px;width:230px">
    <div class="cap dark" style="left:590px;bottom:360px;max-width:420px">
      <div class="lock">${mark(34, '#241a14')}GROWLIFT</div>
      <div class="name" style="font-size:80px">Fornada</div>
      <div class="desc" style="font-size:28px">Padaria · reserva do café da manhã pelo site</div>
      <div class="tag" style="font-size:16px">Projeto conceito · nome fictício</div></div>`],

  ['12-transicao-convergencia', `
    <div class="abs" style="inset:0;background:${T.bg}"></div>
    <div class="abs" style="left:60px;top:250px;width:960px;display:grid;grid-template-columns:1fr 1fr;gap:24px;opacity:.07;filter:grayscale(.5)">
      ${['salinho', 'chapa77', 'swellclub', 'fornada'].map((s) => `<div style="height:670px;border-radius:28px;overflow:hidden"><img src="${A(`${s}/cel-hero.png`)}" style="width:100%"></div>`).join('')}</div>
    <style>.mk{-webkit-mask:${MARK_MASK} center/contain no-repeat;mask:${MARK_MASK} center/contain no-repeat}</style>
    <div class="abs mk" style="left:60px;top:584px;width:960px;height:752px;display:flex">
      ${['salinho/cel-hero.png', 'chapa77/cel-historia-1.png', 'swellclub/cel-hero.png', 'fornada/cel-historia-4.png'].map((f) => `<div style="flex:1;overflow:hidden"><img src="${A(f)}" style="height:100%;width:100%;object-fit:cover"></div>`).join('')}</div>`],

  ['13-assinatura', `
    <div class="abs" style="inset:0;background:radial-gradient(70% 45% at 50% 42%,#0b1a3a,${T.bg} 70%)"></div>
    <div class="abs" style="left:0;right:0;top:420px;display:flex;justify-content:center">${mark(360)}</div>
    <div class="abs" style="left:0;right:0;top:704px;display:flex;justify-content:center;transform:scaleY(-1);opacity:.14;-webkit-mask-image:linear-gradient(transparent 40%,#000)">${mark(360)}</div>
    <div class="abs" style="left:0;right:0;top:860px;text-align:center;font:700 118px/1 Inter;letter-spacing:.08em;padding-left:.08em">GROWLIFT</div>
    <div class="abs" style="left:0;right:0;top:1010px;text-align:center;font:600 46px/1 Inter;letter-spacing:-.02em;color:${T.soft}">Sua marca merece mais.</div>
    <div class="abs" style="left:0;right:0;top:1190px;display:flex;justify-content:center"><div style="padding:26px 44px;border-radius:999px;background:${T.blue};font:700 36px/1 Inter;letter-spacing:-.01em">Peça seu diagnóstico grátis</div></div>
    <div class="abs" style="left:0;right:0;top:1320px;text-align:center;font:600 40px/1 Inter;color:${T.text}">growlift.com.br</div>`],
];

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
const page = await (await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })).newPage();
const only = process.argv.slice(2);
let problems = 0;
for (const [name, body] of FRAMES) {
  if (only.length && !only.some((o) => name.startsWith(o))) continue;
  const file = path.join(OUT, `_${name}.html`);
  fs.writeFileSync(file, `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">${head}</head><body>${body}</body></html>`);
  await page.goto(`file://${file}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  // Quality gate: every image decoded and the brand font in use, or the frame is reported.
  const check = await page.evaluate(async () => {
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
    return { broken: [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src.split('/').slice(-2).join('/')), inter: document.fonts.check('800 40px Inter') };
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  fs.unlinkSync(file);
  const bad = check.broken.length || !check.inter;
  problems += bad ? 1 : 0;
  console.log(name, bad ? `PROBLEMA ${JSON.stringify(check)}` : 'ok');
}
await browser.close();
if (problems) process.exit(1);

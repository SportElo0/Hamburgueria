// Reel 001 "Sua marca merece mais." · v3 (review cut, 25.5 s, 1080×1920, 30 fps).
// Same engine as reel.mjs (v2, kept as it was): one HTML page, window.render(t) places every layer, Playwright
// shoots each frame and ffmpeg encodes. What changed in v3, from the client's review:
//   · Chapa 77 shows the real order flow (burger → add-ons → bag → order message) instead of zooms over screens;
//   · Swell Club moves sideways at a constant scale (a strip of screens, real board swipes);
//   · the Salinho → Chapa 77 bridge is a plain shape (the reserve button loses its text before it grows);
//   · "SWELL" leaves the screen before the Fornada scene comes in (the Fornada scene itself is unchanged, only shifted);
//   · the ending says "SEU PRÓXIMO SITE COMEÇA AQUI." and keeps moving; sound comes from audio3.py.
//   node growlift-social/_fonte/reel-premium/v2/source/reel3.mjs              → renders/v3/revisao-v3.mp4 (+ -capa.png)
//   node growlift-social/_fonte/reel-premium/v2/source/reel3.mjs 9.5 12.6    → renders/v3/_teste/t-….png
//   node growlift-social/_fonte/reel-premium/v2/source/reel3.mjs --quadros   → renders/v3/quadros/NN-….png
import { chromium } from 'playwright-core';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'renders', 'v3');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const FPS = 30, W = 1080, H = 1920, DURATION = 25.5, COVER = 1.6;
const A = (f) => pathToFileURL(path.join(ROOT, 'assets', f)).href;
const CUT = (f) => A(`_recortes/${f}.png`);

const REC = Object.fromEntries(['salinho', 'chapa77pedido', 'swellclub', 'swellpranchas', 'fornada'].map((id) => {
  const dir = path.join(ROOT, 'assets', '_gravacoes', `rec-${id}`);
  if (!fs.existsSync(dir)) throw new Error(`Falta a gravação ${id}: rode source/gravacoes.mjs`);
  return [id, { url: pathToFileURL(dir).href, count: fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).length }];
}));
const recSrc = (id, n = 0) => `${REC[id].url}/${String(n).padStart(5, '0')}.jpg`;

const T = { bg: '#06080d', bg2: '#0b0f17', blue: '#0865fe', blueHi: '#4d8dff', text: '#f3f5f9', soft: '#c6cede' };
const MARK_PATHS = '<path d="M280 48H410L190 450H55Z"/><path fill-rule="evenodd" d="M470 130L570 450H258Z M418 220L480 380H309Z"/>';
const mark = (w, color) => `<svg viewBox="50 40 530 415" width="${w}" height="${Math.round((w * 415) / 530)}" fill="${color}" aria-hidden="true">${MARK_PATHS}</svg>`;
const MARK_MASK = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='50 40 530 415'>${MARK_PATHS}</svg>`)}")`;

// Timeline anchors (s). The Fornada scene is v2's, moved by FO; nothing inside it changed.
const FO = 2.15;
const CH = 8.3, CH_SPEED = 1.15; // Chapa 77 order recording: starts at CH, played 15 % faster
const SW = 13.0; // Chapa 77 → Swell Club push

const caption = (id, name, desc, dark = false, style = '') => `<div class="cap${dark ? ' dark' : ''}" id="${id}" style="${style}">
  <div class="lock cp">${mark(36, dark ? '#241a14' : T.blueHi)}GROWLIFT</div>
  <div class="name cp">${name}</div><div class="desc cp">${desc}</div></div>`;
const phone = (id, img, style, rec = '') => `<div class="phone" id="${id}" style="${style}"><img ${rec ? `data-rec="${rec}"` : ''} src="${img}"></div>`;

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
@font-face{font-family:Inter;font-weight:100 900;src:url(${A('fontes/inter-latin-wght-normal.woff2')}) format('woff2');unicode-range:U+0000-00FF,U+2000-206F}
@font-face{font-family:Inter;font-weight:100 900;src:url(${A('fontes/inter-latin-ext-wght-normal.woff2')}) format('woff2');unicode-range:U+0100-02BA,U+1E00-1E9F}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${T.bg}}
body{position:relative;font-family:Inter,sans-serif;color:${T.text};-webkit-font-smoothing:antialiased}
.L{position:absolute;left:0;top:0;will-change:transform,opacity}
.full{position:absolute;inset:0}
img{display:block}
.fit{width:100%;height:100%;object-fit:cover}
.lock{display:inline-flex;align-items:center;gap:14px;font:700 22px/1 Inter;letter-spacing:.2em;color:rgba(243,245,249,.8)}
.ln{position:absolute;overflow:hidden}
.ln>span{display:block;white-space:nowrap}
.phone{position:absolute;border-radius:66px;padding:14px;background:#0b0d12;box-shadow:0 70px 120px -40px rgba(0,0,0,.75),inset 0 0 0 1.5px rgba(255,255,255,.16)}
.phone>img{width:100%;height:100%;object-fit:cover;object-position:50% 0;border-radius:53px}
.shot{position:absolute;overflow:hidden;box-shadow:0 60px 120px -40px rgba(0,0,0,.65),0 0 0 1.5px rgba(255,255,255,.12)}
.lift{box-shadow:0 40px 70px -24px rgba(0,0,0,.55),0 8px 18px -8px rgba(0,0,0,.35)}
.cap{position:absolute;left:96px;bottom:414px;max-width:830px;z-index:60}
.cap .name{margin-top:20px;font:800 96px/.94 Inter;letter-spacing:-.045em}
.cap .desc{margin-top:16px;font:500 36px/1.28 Inter;color:${T.soft};letter-spacing:-.015em}
.cap.dark .lock{color:rgba(36,26,20,.78)}.cap.dark .name{color:#241a14}.cap.dark .desc{color:#5b4a3d}
#tagPC{position:absolute;left:96px;top:1530px;z-index:90;padding:13px 20px;border-radius:999px;white-space:nowrap;background:rgba(6,8,13,.66);backdrop-filter:blur(12px);border:1.5px solid rgba(255,255,255,.22);font:700 24px/1 Inter;letter-spacing:.1em;text-transform:uppercase;color:#f3f5f9}
.mk{-webkit-mask:${MARK_MASK} center/contain no-repeat;mask:${MARK_MASK} center/contain no-repeat}
.scene{position:absolute;inset:0;overflow:hidden}
</style></head><body>

<div class="full" id="bgHook" style="background:radial-gradient(120% 60% at 20% 100%,${T.bg2},${T.bg} 70%)"></div>
<div class="full" id="glow" style="background:radial-gradient(50% 22% at 30% 62%,rgba(8,101,254,.30),transparent 70%)"></div>
<div class="full" id="bgSal" style="background:radial-gradient(90% 55% at 50% 38%,#3b372f,${T.bg} 78%)"></div>
<div class="full" id="bgSalSolid" style="background:radial-gradient(55% 32% at 62% 56%,rgba(255,240,215,.13),transparent 70%),linear-gradient(transparent 70%,rgba(0,0,0,.35)),#35312b"></div>
<div class="full" id="bgEnd" style="background:radial-gradient(70% 45% at 50% 30%,#0b1a3a,${T.bg} 70%)"></div>

<!-- 01 · Hook -->
<div class="L" id="hookLock" style="left:96px;top:250px;z-index:10"><div class="lock">${mark(40, T.blue)}GROWLIFT</div></div>
<div class="ln" id="l1" style="left:90px;top:660px;height:150px;font:800 158px/.9 Inter;letter-spacing:-.055em;z-index:10"><span>SUA MARCA</span></div>
<div class="ln" id="l2" style="left:90px;top:802px;height:150px;font:800 158px/.9 Inter;letter-spacing:-.055em;z-index:10"><span>MERECE</span></div>
<div class="ln" id="l3" style="left:84px;top:948px;height:290px;font:800 320px/.86 Inter;letter-spacing:-.06em;color:${T.blueHi};z-index:10"><span><span id="mais">MAIS</span><span id="dotG">.<i id="dotBase" style="display:inline-block;width:0;height:0;vertical-align:baseline"></i></span></span></div>

<!-- 02–05 · Salinho (v2 composition) -->
<div class="phone L" id="phL" style="width:430px;height:898px;z-index:11"><img src="${CUT('salinho-look-topo')}"></div>
<div class="phone L" id="phR" style="width:430px;height:898px;z-index:11"><img src="${CUT('salinho-selecao-topo')}"></div>
<div class="phone L" id="phC" style="width:540px;height:1136px;z-index:14"><img data-rec="salinho" src="${recSrc('salinho')}"></div>
<div class="L" id="scr" style="overflow:hidden;z-index:13;background:${T.blueHi}"><img id="scrDesk" class="fit" src="${CUT('salinho-cartao')}" style="position:absolute;inset:0"></div>
<img class="L" id="pTitle" src="${CUT('salinho-titulo')}" style="width:600px;z-index:14">
<img class="L" id="pShirt" src="${A('salinho/pecas/linen-short.webp')}" style="width:680px;z-index:15;filter:drop-shadow(0 60px 50px rgba(0,0,0,.45))">
<img class="L lift" id="pMini" src="${CUT('salinho-miniaturas')}" style="width:470px;border-radius:12px;z-index:16">
<img class="L" id="btnImg" src="${CUT('salinho-botao')}" style="width:600px;border-radius:12px;z-index:17">
<!-- 06 · the reserve button without its words: a shape that grows into the Chapa 77 red -->
<div class="L" id="shape" style="z-index:18;background:#237647"></div>

<!-- 07–10 · Chapa 77: the order, on the phone -->
<div class="scene" id="scChapa" style="z-index:20">
  <div class="full" style="background:radial-gradient(90% 60% at 50% 40%,#c11d23,#a3171c 50%,#5e0a0e)"></div>
  <img class="L" id="chBurger" src="${CUT('chapa77-burger')}" style="width:960px">
  <div class="shot L" id="chCard" style="left:72px;top:250px;width:936px;height:1000px;border-radius:40px;background:#f6efe2"><img id="chRec" data-rec="chapa77pedido" src="${recSrc('chapa77pedido')}" style="position:absolute;left:0;top:0;width:936px"></div>
  ${caption('capCha', 'Chapa 77', 'Hamburgueria · cardápio com adicionais e sacola de pedido')}
  ${caption('capCha2', 'Chapa 77', 'Do lanche à sacola: o pedido sai pronto em mensagem para a loja')}
</div>

<!-- 11–14 · Swell Club: a strip of screens, the camera moves sideways at a constant scale -->
<div class="scene" id="scSwell" style="z-index:21">
  <div class="full" style="background:radial-gradient(90% 60% at 50% 35%,#0f7d86,#086d75 45%,#03191c)"></div>
  <div class="L" id="swGhost" style="top:560px;white-space:nowrap;font:800 360px/1 Inter;letter-spacing:-.05em;color:transparent;-webkit-text-stroke:2px rgba(255,255,255,.12)">SWELL CLUB · SWELL CLUB</div>
  <div class="L" id="strip">
    <div class="shot L" id="sw0" style="left:0;top:250px;width:462px;height:1000px;border-radius:36px"><img class="fit" data-rec="swellclub" src="${recSrc('swellclub')}" style="object-position:50% 0"></div>
    <div class="shot L" id="sw1" style="left:520px;top:250px;width:462px;height:1000px;border-radius:36px"><img class="fit" data-rec="swellpranchas" src="${recSrc('swellpranchas')}" style="object-position:50% 0"></div>
    <div class="shot L" id="sw2" style="left:1040px;top:250px;width:462px;height:1000px;border-radius:36px"><img class="fit" src="${A('swellclub/cel-aluguel.png')}" style="object-position:50% 0"></div>
  </div>
  ${caption('capSwe', 'Swell Club', 'Surf shop · pranchas, aluguel por diária e kit montado no site')}
</div>
<!-- the cream footer card: last card of the strip, it grows into the cream page (above the strip, below Fornada) -->
<div class="shot L" id="sw3" style="z-index:22;background:linear-gradient(#f3f0e5 32%,#f4ede0 42%)"><img class="L" id="swLetters" src="${CUT('swellclub-letras')}"></div>

<!-- 15 · Fornada (v2 scene, unchanged inside) -->
<div class="full" id="foScene" style="z-index:30;transform-origin:0 0">
  <div class="full" id="foBg" style="background:#f4ede0"></div>
  <img class="L" id="foTitle" src="${CUT('fornada-reserva-titulo')}" style="width:620px">
  ${phone('foPhone', recSrc('fornada'), 'left:0;top:0;width:470px;height:985px;background:#1b1410', 'fornada')}
  <img class="L lift" id="foCard" src="${A('fornada/pc-cafe-selecao.png')}" style="width:420px;border-radius:4px">
  ${caption('capFor', 'Fornada', 'Padaria · reserva do café da manhã pelo site', true, 'max-width:450px')}
</div>

<!-- 16 · the four projects become the mark -->
${[['salinho/cel-hero.png', 60, 250], ['chapa77/cel-hero.png', 552, 250], ['swellclub/cel-historia-1.png', 60, 944]].map(([f, x, y], i) => `<div class="shot L" id="tl${i}" style="width:468px;height:670px;border-radius:28px;z-index:31" data-x="${x}" data-y="${y}"><img class="fit" src="${A(f)}" style="object-position:50% 0"></div>`).join('')}
<div class="L mk" id="mkBox" style="width:960px;height:752px;z-index:32;display:flex">
  ${[A('salinho/cel-hero.png'), A('chapa77/cel-historia-1.png'), A('swellclub/cel-historia-1.png'), CUT('fornada-reserva-cel')].map((u) => `<div style="flex:1;overflow:hidden"><img class="fit" src="${u}"></div>`).join('')}
  <div class="full" id="mkFill" style="background:${T.blue}"></div>
  <div class="full" id="mkSweep" style="background:linear-gradient(105deg,transparent 42%,rgba(255,255,255,.5) 50%,transparent 58%);background-size:300% 100%"></div>
</div>

<!-- 17 · signature -->
<div class="L" id="endGroup" style="width:1080px;z-index:33">
  <div class="L" id="endRefl" style="left:360px;top:704px;transform:scaleY(-1);-webkit-mask-image:linear-gradient(transparent 40%,#000)">${mark(360, T.blue)}</div>
  <div class="L" id="endWord" style="width:1080px;top:850px;text-align:center;font:700 112px/1 Inter">GROWLIFT</div>
  <div class="L" id="endLine1" style="width:1080px;top:1030px;text-align:center;font:800 78px/1 Inter;letter-spacing:-.04em">SEU PRÓXIMO SITE</div>
  <div class="L" id="endLine2" style="width:1080px;top:1116px;text-align:center;font:800 78px/1 Inter;letter-spacing:-.04em">COMEÇA <span style="color:${T.blueHi}">AQUI.</span></div>
  <div class="L" id="endUrl" style="width:1080px;top:1262px;text-align:center;font:600 40px/1 Inter;color:${T.soft}">growlift.com.br</div>
</div>

${caption('capSal', 'Salinho', 'Moda de linho · site com reserva da peça pelo WhatsApp')}
<div id="tagPC">Projeto conceito · nome fictício</div>

<script>
const REC = ${JSON.stringify(REC)};
const FO = ${FO}, CH = ${CH}, CH_SPEED = ${CH_SPEED}, SW = ${SW};
const clamp = (x) => Math.max(0, Math.min(1, x));
const E = {
  lin: (p) => p,
  out: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  in: (p) => p * p * p,
  io: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
};
const P = (t, a, b, e = 'io') => E[e](clamp((t - a) / (b - a)));
const L = (x, y, p) => x + (y - x) * p;
const $ = (id) => document.getElementById(id);
/** Value at time t of a list of [time, value] keys, eased in-out between neighbours. */
function track(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return L(keys[i - 1][1], keys[i][1], E.io((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
  return keys[keys.length - 1][1];
}
function put(el, s) {
  if (typeof el === 'string') el = $(el);
  const st = el.style;
  if (s.x !== undefined) st.left = s.x + 'px';
  if (s.y !== undefined) st.top = s.y + 'px';
  if (s.w !== undefined) st.width = s.w + 'px';
  if (s.h !== undefined) st.height = s.h + 'px';
  if (s.r !== undefined) st.borderRadius = s.r + 'px';
  if (s.o !== undefined) { st.opacity = s.o; st.visibility = s.o <= 0.002 ? 'hidden' : 'visible'; }
  if (s.tx !== undefined || s.ty !== undefined || s.s !== undefined || s.rot !== undefined) {
    const tf = [];
    if (s.tx || s.ty) tf.push('translate(' + (s.tx || 0) + 'px,' + (s.ty || 0) + 'px)');
    if (s.s !== undefined && s.s !== 1) tf.push('scale(' + s.s + ')');
    if (s.rot) tf.push('rotate(' + s.rot + 'deg)');
    st.transform = tf.join(' ');
  }
  if (s.origin) st.transformOrigin = s.origin;
  if (s.f !== undefined) st.filter = s.f;
}
const pending = [];
function play(img, rt) {
  if (typeof img === 'string') img = $(img);
  const r = REC[img.dataset.rec];
  const n = Math.max(0, Math.min(r.count - 1, Math.floor(rt * 30)));
  const src = r.url + '/' + String(n).padStart(5, '0') + '.jpg';
  if (img.getAttribute('src') !== src) { img.src = src; pending.push(img.decode().catch(() => {})); }
}
function cap(id, tin, tout, t) {
  const parts = $(id).querySelectorAll('.cp');
  const gone = P(t, tout, tout + 0.22, 'in');
  parts.forEach((el, k) => {
    const p = P(t, tin + k * 0.08, tin + k * 0.08 + 0.55, 'out');
    put(el, { o: p * (1 - gone), ty: (1 - p) * 30 - gone * 16 });
  });
  put($(id), { o: t >= tin - 0.01 && t <= tout + 0.25 ? 1 : 0 });
}
let DOT;
function measure() {
  const g = $('dotG'), cs = getComputedStyle(g);
  const c = document.createElement('canvas').getContext('2d');
  c.font = cs.fontWeight + ' ' + cs.fontSize + ' Inter';
  const m = c.measureText('.');
  const box = g.getBoundingClientRect(), base = $('dotBase').getBoundingClientRect().top;
  DOT = { x: box.left - m.actualBoundingBoxLeft, y: base - m.actualBoundingBoxAscent, w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent };
}
const mix = (a, b, p) => 'rgb(' + a.map((v, i) => Math.round(L(v, b[i], p))).join(',') + ')';

window.render = async (t) => {
  if (!DOT) measure();
  pending.length = 0;

  const bg = { bgHook: [-1, 0, 3.3], bgSal: [2.7, 3.2, 6.4], bgSalSolid: [5.95, 6.25, 7.8], bgEnd: [19.3 + FO, 19.6 + FO, 99] };
  for (const id in bg) { const [a, b, z] = bg[id]; put(id, { o: t > z ? 0 : P(t, a, b, 'lin') }); }
  // the blue light of the opening breathes with the words, then goes
  put('glow', { o: (0.55 + 0.45 * P(t, 0.72, 1.1, 'out')) * (1 - P(t, 2.0, 2.6, 'lin')) });

  // ---- 01 · Hook (0–2.3): three hits, then MAIS climbs and its dot becomes the first screen
  put('hookLock', { o: P(t, 1.05, 1.45, 'out') * (1 - P(t, 2.0, 2.3, 'lin')), ty: (1 - P(t, 1.05, 1.45, 'out')) * 14 });
  for (const [id, a, out] of [['l1', -0.08, 1.82], ['l2', 0.34, 1.88]]) {
    const inP = P(t, a, a + 0.45, 'out'), outP = P(t, out, out + 0.32, 'in');
    put($(id).firstChild, { ty: (1 - inP) * 200 - outP * 170 });
    put(id, { o: t < 2.45 ? 1 : 0 });
  }
  {
    const inP = P(t, 0.72, 1.22, 'out');
    const up = P(t, 2.1, 2.58, 'io'), gone = P(t, 2.62, 2.95, 'in');
    put('l3', { y: L(948, 250, up), o: t < 3.0 ? 1 : 0 });
    put($('l3').firstChild, { ty: (1 - inP) * 380 - gone * 300, s: L(0.94, 1, inP), origin: '0 100%' });
    $('dotG').style.opacity = t < 2.0 ? 1 : 0;
  }

  // ---- 02–04 · Salinho: the dot becomes the site; a sideways pan; the phone rises in its place
  {
    const scr = $('scr');
    let x, y, w, h, r;
    const grow = P(t, 2.05, 2.8, 'io'), wide = P(t, 2.8, 3.3, 'io'), pan = P(t, 3.3, 4.3, 'io'), away = P(t, 4.3, 4.65, 'in');
    x = L(DOT.x, 72, grow); y = L(DOT.y, 600, grow); w = L(DOT.w, 936, grow); h = L(DOT.h, 1000, grow); r = L(DOT.w * 0.28, 44, grow);
    if (t >= 2.8) { x = L(72, -20, wide); y = L(600, 250, wide); w = L(936, 1450, wide); h = L(1000, 894, wide); r = L(44, 40, wide); }
    if (t >= 3.3) { x = L(-20, -300, pan); y = 250; w = 1450; h = 894; }   // pans from the headline to the shirt and its panel
    if (t >= 4.3) { y = L(250, -420, away); }
    const ring = P(t, 2.05, 2.3, 'lin') * (1 - P(t, 2.85, 3.2, 'lin'));
    put(scr, { x, y, w, h, r, o: t < 2.0 ? 0 : 1 - P(t, 4.35, 4.65, 'lin') });
    scr.style.boxShadow = '0 0 0 ' + (5 * ring) + 'px ${T.blueHi}, 0 60px 140px -30px rgba(8,101,254,' + (0.45 * ring) + '), 0 0 0 1.5px rgba(255,255,255,' + (0.12 * (1 - ring)) + ')';
    scr.style.background = t < 2.35 ? '${T.blueHi}' : '#111';
    put('scrDesk', { o: P(t, 2.3, 2.6, 'lin') });
    const rise = P(t, 4.4, 4.95, 'out'), exit = P(t, 6.0, 6.35, 'in');
    put('phC', { x: 270, y: 280, ty: (1 - rise) * 520 - exit * 70, o: P(t, 4.4, 4.5, 'lin') * (1 - exit), s: L(0.94, 1, rise), origin: '270px 568px' });
    play($('phC').firstElementChild, t - 4.5);
    const side = P(t, 4.7, 5.25, 'out'), sideOut = P(t, 5.95, 6.3, 'in');
    put('phL', { x: L(325, -60, side) - sideOut * 260, y: 430, o: side * (1 - sideOut), f: 'brightness(.62)' });
    put('phR', { x: L(325, 710, side) + sideOut * 260, y: 430, o: side * (1 - sideOut), f: 'brightness(.62)' });
  }
  cap('capSal', 3.2, 4.25, t);

  // ---- 05 · Salinho, the interface taken apart (6.1–7.0)
  const drift = P(t, 6.75, 7.0, 'lin');
  {
    const p1 = P(t, 6.1, 6.7, 'out'), p2 = P(t, 6.17, 6.7, 'out'), p3 = P(t, 6.3, 6.85, 'out');
    const away = P(t, 6.95, 7.2, 'in');
    put('pTitle', { x: 60, y: 250, o: p2 * (1 - away), ty: (1 - p2) * 50 - drift * 16 - away * 40 });
    put('pShirt', { x: 330, y: 540, o: p1 * (1 - away), s: L(0.72, 1, p1) * L(1, 0.96, away), ty: (1 - p1) * 80 - drift * 10, origin: '50% 50%' });
    put('pMini', { x: 72, y: 1180, o: p3 * (1 - away), ty: (1 - p3) * 90 - drift * 26 + away * 40 });
  }

  // ---- 06 · Salinho → Chapa 77: the button loses its words, becomes a shape, grows and turns red
  {
    const p4 = P(t, 6.37, 6.9, 'out');
    const bx = 72, by = 1330 - drift * 34, bw = 600, bh = 600 * 268 / 1036;
    put('btnImg', { x: bx, y: by, o: p4 * (1 - P(t, 7.0, 7.12, 'lin')), ty: (1 - p4) * 90 });
    const g = P(t, 7.1, 7.6, 'io'), col = P(t, 7.25, 7.6, 'lin');
    put('shape', { x: L(bx, 0, g), y: L(by, 0, g), w: L(bw, 1080, g), h: L(bh, 1920, g), r: L(12, 0, g), o: P(t, 7.0, 7.1, 'lin') * (1 - P(t, 7.62, 7.72, 'lin')) });
    $('shape').style.background = mix([35, 118, 71], [176, 26, 33], col);
  }

  // ---- 07–10 · Chapa 77 (7.6–13.0): the burger, then the real order on the phone
  {
    const push = P(t, SW, SW + 0.5, 'io');
    put('scChapa', { o: t >= 7.58 && t < SW + 0.55 ? 1 : 0, tx: -1080 * push });
    const bIn = P(t, 7.6, 7.95, 'out'), bOut = P(t, 8.1, 8.45, 'in');
    put('chBurger', { x: 60, y: 560, o: bIn * (1 - bOut), ty: -20 * P(t, 7.6, 8.45, 'lin') - 80 * bOut });
    const cIn = P(t, 8.0, 8.45, 'out');
    put('chCard', { ty: (1 - cIn) * 1400, o: P(t, 8.0, 8.1, 'lin') });
    const rt = (t - CH) * CH_SPEED;
    play('chRec', rt);
    // the camera follows the flow inside the screen (vertical pans only, scale fixed): card → sheet → add-ons → button → bag → total
    const camY = track([[0, 100], [0.55, 100], [0.8, 60], [1.2, 60], [1.5, 420], [3.65, 420], [3.85, 0], [4.15, 0], [4.35, 420], [6, 420]], rt);
    put('chRec', { ty: -camY * 2.4 });
    cap('capCha', 7.8, 9.3, t);
    cap('capCha2', 11.9, 12.85, t);
  }

  // ---- 11–14 · Swell Club (13.0–17.2): sideways only
  {
    const push = P(t, SW, SW + 0.5, 'io');
    put('scSwell', { o: t >= SW && t < 17.3 ? 1 : 0, tx: 1080 * (1 - push) });
    // the strip's position: hero card centred, then the boards, then on to the cream footer card
    const sx = track([[0, 309], [14.45, 309], [14.95, -211], [16.2, -211], [16.7, -1251]], t);
    put('strip', { tx: sx });
    put('swGhost', { tx: 120 + (sx - 309) * 0.4 });   // the outline name drifts at 40 %: depth without zoom
    play($('sw0').firstElementChild, t - 13.2);
    play($('sw1').firstElementChild, t - 14.65);
    cap('capSwe', 13.55, 14.9, t);
    // the cream footer card rides with the strip, then opens into the page; SWELL leaves before Fornada comes
    const grow = P(t, 16.7, 17.2, 'io');
    const cx = sx + 1560 + 1080 * (1 - push);
    put('sw3', { x: L(cx, 0, grow), y: L(250, 0, grow), w: L(462, 1080, grow), h: L(1000, 1920, grow), r: L(36, 0, grow), o: t >= SW && t < 18.4 ? 1 : 0 });
    const up = P(t, 17.25, 17.55, 'in');
    put('swLetters', { x: L(24, 40, grow), y: L(110, 250, grow) - up * 700, w: L(760, 1600, grow), o: 1 - P(t, 17.4, 17.55, 'lin') });
  }

  // ---- 15 · Fornada: the v2 scene, every time moved by FO
  {
    const sc = $('foScene');
    put('foBg', { o: P(t, 15.85 + FO, 16.15 + FO, 'lin') });
    const fdrift = P(t, 16.8 + FO, 19.4 + FO, 'lin');
    put('foTitle', { x: 72, y: L(1150, 250, P(t, 15.45 + FO, 16.25 + FO, 'io')) - fdrift * 10, o: P(t, 15.4 + FO, 15.7 + FO, 'lin') });
    put('foCard', { x: 72, y: L(1500, 560, P(t, 15.55 + FO, 16.35 + FO, 'io')) - fdrift * 34, o: P(t, 15.5 + FO, 15.8 + FO, 'lin') });
    put('foPhone', { x: 538, y: L(1950, 520, P(t, 16.0 + FO, 16.7 + FO, 'out')) - fdrift * 24, o: t > 15.95 + FO ? 1 : 0 });
    play($('foPhone').firstElementChild, t - (16.3 + FO));
    cap('capFor', 16.8 + FO, 19.12 + FO, t);
    const k = 468 / 1080, p = P(t, 19.3 + FO, 19.85 + FO, 'io'), dim = P(t, 20.0 + FO, 20.4 + FO, 'io'), gone = P(t, 20.6 + FO, 20.9 + FO, 'lin');
    const inset = 187 * p;
    sc.style.transform = 'translate(' + (552 * p) + 'px,' + (863 * p) + 'px) scale(' + L(1, k, p) + ')';
    sc.style.clipPath = 'inset(' + inset + 'px 0 ' + inset + 'px 0 round ' + (65 * p) + 'px)';
    put(sc, { o: (t < 15.3 + FO ? 0 : 1) * L(1, 0.07, dim) * (1 - gone) });
  }

  // ---- 16 · the four projects become the mark
  {
    const dim = P(t, 20.0 + FO, 20.4 + FO, 'io'), gone = P(t, 20.6 + FO, 20.9 + FO, 'lin');
    [0, 1, 2].forEach((i) => {
      const el = $('tl' + i), p = P(t, 19.55 + FO + i * 0.06, 19.95 + FO + i * 0.06, 'out');
      put(el, { x: +el.dataset.x, y: +el.dataset.y, o: p * L(1, 0.07, dim) * (1 - gone), s: L(0.92, 1, p), origin: '50% 50%' });
    });
    const show = P(t, 20.0 + FO, 20.45 + FO, 'out'), shrink = P(t, 20.5 + FO, 21.0 + FO, 'io');
    const float = -12 * P(t, 21.0 + FO, 25.5, 'lin');
    put('mkBox', { x: 60, y: 584, o: show, s: L(0.7, 1, show) * L(1, 0.375, shrink), ty: L(0, -399, shrink) + float, origin: '50% 50%' });
    put('mkFill', { o: P(t, 20.45 + FO, 20.8 + FO, 'lin') });
    $('mkSweep').style.backgroundPosition = L(120, -20, P(t, 24.2, 25.0, 'io')) + '% 0';
    put('mkSweep', { o: t > 24.15 && t < 25.05 ? 1 : 0 });
  }
  put('tagPC', { o: P(t, 3.0, 3.25, 'lin') * (1 - P(t, 20.45 + FO, 20.75 + FO, 'lin')) });

  // ---- 17 · signature (23.1–25.5): logo, the new line, the address; the group keeps a slow rise
  {
    put('endGroup', { ty: -12 * P(t, 23.1, 25.5, 'lin') });
    put('endRefl', { o: 0.14 * P(t, 23.15, 23.5, 'lin') });
    const wp = P(t, 23.15, 23.7, 'out');
    put('endWord', { o: wp, ty: (1 - wp) * 20 });
    $('endWord').style.letterSpacing = L(0.26, 0.08, wp) + 'em';
    $('endWord').style.paddingLeft = L(0.26, 0.08, wp) + 'em';
    for (const [id, a] of [['endLine1', 23.5], ['endLine2', 23.62], ['endUrl', 24.0]]) {
      const p = P(t, a, a + 0.45, 'out');
      put(id, { o: p, ty: (1 - p) * 26 });
    }
  }

  await Promise.all(pending);
  await Promise.all([...document.images].filter((i) => !i.complete).map((i) => i.decode().catch(() => {})));
};
</script></body></html>`;

// ---------------------------------------------------------------------------------------------
const KEY = [
  [1.6, '01-abertura'], [2.55, '02-mais-vira-tela'], [3.45, '03-salinho-site'], [5.6, '04-salinho-pecas-no-celular'],
  [6.85, '05-salinho-composicao'], [7.35, '06-transicao-forma'], [7.9, '07-chapa77-produto'], [10.6, '08-chapa77-adicionais'],
  [11.75, '09-chapa77-sacola'], [12.75, '10-chapa77-mensagem'], [13.25, '11-transicao-lateral'], [14.0, '12-swell-hero'],
  [15.55, '13-swell-pranchas'], [17.3, '14-swell-sai-fornada-entra'], [21.15, '15-fornada-preservada'], [22.35, '16-grid-marca'],
  [24.6, '17-assinatura'],
];

async function open() {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  fs.mkdirSync(path.join(OUT, '_tmp'), { recursive: true });
  const file = path.join(OUT, '_tmp', 'reel.html');
  fs.writeFileSync(file, html);
  await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => { await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  return { browser, page, errors };
}

const args = process.argv.slice(2);
const { browser, page, errors } = await open();
const shot = async (t, file, type = 'png') => {
  await page.evaluate((t) => window.render(t), t);
  await page.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 95 } : {}) });
};

if (args.length && args[0] !== '--quadros') {
  fs.mkdirSync(path.join(OUT, '_teste'), { recursive: true });
  for (const a of args) await shot(+a, path.join(OUT, '_teste', `t-${(+a).toFixed(2)}.png`));
  console.log('quadros de teste em renders/v3/_teste');
} else if (args[0] === '--quadros') {
  fs.mkdirSync(path.join(OUT, 'quadros'), { recursive: true });
  for (const [t, name] of KEY) await shot(t, path.join(OUT, 'quadros', `${name}.png`));
  fs.writeFileSync(path.join(OUT, 'quadros', 'tempos.json'), JSON.stringify(Object.fromEntries(KEY.map(([t, n]) => [n, t])), null, 2));
  console.log(`${KEY.length} quadros em renders/v3/quadros`);
} else {
  const work = path.join(OUT, '_tmp', 'frames');
  fs.rmSync(work, { recursive: true, force: true });
  fs.mkdirSync(work, { recursive: true });
  const frames = Math.round(DURATION * FPS);
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    await shot(i / FPS, path.join(work, `${String(i).padStart(5, '0')}.jpg`), 'jpeg');
    if (i % 150 === 0) console.log(`  ${i}/${frames} · ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  const out = path.join(OUT, 'revisao-v3');
  const audio = path.join(OUT, 'trilha-v3.wav');
  const withAudio = fs.existsSync(audio);
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(work, '%05d.jpg'),
    ...(withAudio ? ['-i', audio] : []),
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-r', String(FPS),
    // loudness of the Reels on Instagram: about -14 LUFS, true peak under -1.5 dB
    ...(withAudio ? ['-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
    '-movflags', '+faststart', `${out}.mp4`], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg falhou');
  await shot(COVER, `${out}-capa.png`);
  fs.rmSync(work, { recursive: true, force: true });
  console.log(`revisao-v3.mp4 · ${DURATION} s · ${frames} quadros · ${withAudio ? 'com áudio' : 'SEM áudio'} · ${Math.round((Date.now() - t0) / 1000)} s`);
}
await browser.close();
if (errors.length) { console.error('ERROS NA PÁGINA:', [...new Set(errors)].join(' | ')); process.exit(1); }

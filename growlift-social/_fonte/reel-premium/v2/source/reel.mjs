// The premium Reel "Sua marca merece mais." (25 s, 1080×1920, 30 fps, no sound), rendered from one HTML
// page whose window.render(t) places every layer for time t. Real site recordings play inside the screens
// (gravacoes.mjs); everything else comes from v2/assets. Same approach as the Reels engine (motor.mjs):
// one screenshot per frame, then ffmpeg.
//   node growlift-social/_fonte/reel-premium/v2/source/reel.mjs              → renders/sua-marca-merece-mais.mp4 (+ -capa.png)
//   node growlift-social/_fonte/reel-premium/v2/source/reel.mjs 2.4 9.7     → renders/_teste/t-2.40.png … (single frames)
//   node growlift-social/_fonte/reel-premium/v2/source/reel.mjs --quadros   → renders/quadros/NN-….png (the 13 key moments)
import { chromium } from 'playwright-core';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'renders');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const FPS = 30, W = 1080, H = 1920, DURATION = 25, COVER = 1.9;
const A = (f) => pathToFileURL(path.join(ROOT, 'assets', f)).href;
const CUT = (f) => A(`_recortes/${f}.png`);

// Recorded frame sequences: directory URL and frame count.
const REC = Object.fromEntries(['salinho', 'chapa77', 'swellclub', 'fornada'].map((id) => {
  const dir = path.join(ROOT, 'assets', '_gravacoes', `rec-${id}`);
  if (!fs.existsSync(dir)) throw new Error(`Falta a gravação ${id}: rode source/gravacoes.mjs`);
  return [id, { url: pathToFileURL(dir).href, count: fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).length }];
}));
const recSrc = (id, n = 0) => `${REC[id].url}/${String(n).padStart(5, '0')}.jpg`;

const T = { bg: '#06080d', bg2: '#0b0f17', blue: '#0865fe', blueHi: '#4d8dff', text: '#f3f5f9', soft: '#c6cede' };
const MARK_PATHS = '<path d="M280 48H410L190 450H55Z"/><path fill-rule="evenodd" d="M470 130L570 450H258Z M418 220L480 380H309Z"/>';
const mark = (w, color) => `<svg viewBox="50 40 530 415" width="${w}" height="${Math.round((w * 415) / 530)}" fill="${color}" aria-hidden="true">${MARK_PATHS}</svg>`;
const MARK_MASK = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='50 40 530 415'>${MARK_PATHS}</svg>`)}")`;

const caption = (id, name, desc, dark = false, style = '') => `<div class="cap${dark ? ' dark' : ''}" id="${id}" style="${style}">
  <div class="lock cp">${mark(36, dark ? '#241a14' : T.blueHi)}GROWLIFT</div>
  <div class="name cp">${name}</div><div class="desc cp">${desc}</div>
  <div class="tag cp">Projeto conceito · nome fictício</div></div>`;

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
.cap{position:absolute;left:96px;bottom:340px;max-width:830px;z-index:60}
.cap .name{margin-top:20px;font:800 96px/.94 Inter;letter-spacing:-.045em}
.cap .desc{margin-top:16px;font:500 36px/1.28 Inter;color:${T.soft};letter-spacing:-.015em}
.cap .tag{display:inline-block;margin-top:24px;padding:11px 18px;border-radius:999px;border:1.5px solid rgba(243,245,249,.32);font:600 22px/1 Inter;letter-spacing:.12em;text-transform:uppercase;color:rgba(243,245,249,.85)}
.cap.dark .lock{color:rgba(36,26,20,.78)}#capFor .tag{white-space:nowrap}.cap.dark .name{color:#241a14}.cap.dark .desc{color:#5b4a3d}.cap.dark .tag{color:#4a3a2e;border-color:rgba(36,26,20,.32)}
.mk{-webkit-mask:${MARK_MASK} center/contain no-repeat;mask:${MARK_MASK} center/contain no-repeat}
</style></head><body>

<!-- Stage backgrounds, one per world; each covers the one before. -->
<div class="full" id="bgHook" style="background:radial-gradient(120% 60% at 20% 100%,${T.bg2},${T.bg} 70%)"></div>
<div class="full" id="bgSal" style="background:radial-gradient(90% 55% at 50% 38%,#3b372f,${T.bg} 78%)"></div>
<div class="full" id="bgSalSolid" style="background:radial-gradient(55% 32% at 62% 56%,rgba(255,240,215,.13),transparent 70%),linear-gradient(transparent 70%,rgba(0,0,0,.35)),#35312b"></div>
<div class="full" id="bgChapa" style="background:radial-gradient(90% 60% at 50% 40%,#c11d23,#a3171c 50%,#5e0a0e)"></div>
<div class="full" id="bgTeal" style="background:radial-gradient(70% 50% at 50% 30%,#187471,#13726e 55%,#0d6d69)"></div>
<div class="full" id="bgSwell" style="background:radial-gradient(90% 60% at 50% 35%,#0f7d86,#086d75 45%,#03191c)"></div>
<div class="full" id="bgCream" style="background:linear-gradient(#f3f0e5 32%,#f4ede0 42%)"></div>
<div class="full" id="bgEnd" style="background:radial-gradient(70% 45% at 50% 30%,#0b1a3a,${T.bg} 70%)"></div>

<!-- 07 · Chapa 77: the scroll story's chapters stacked behind the front card. -->
${[5, 4, 3, 2].map((n, i) => `<div class="shot L" id="bc${i}" style="width:936px;height:585px;border-radius:40px"><img class="fit" src="${A(`chapa77/pc-historia-${n}.png`)}"></div>`).join('')}

<!-- 05 → 06 → 07 · Salinho's reserve button grows into the Chapa 77 window, then into the front story card. -->
<div class="shot L" id="t2" style="z-index:5">
  <img id="t2btn" src="${CUT('salinho-botao')}" style="position:absolute;left:0;top:0;width:100%">
  <div id="t2red" style="position:absolute;left:0;right:0;bottom:0;overflow:hidden;background:radial-gradient(70% 60% at 50% 50%,#c11d23,#a3171c)">
    <img id="t2burger" src="${CUT('chapa77-burger')}" style="position:absolute;width:976px;left:-20px;-webkit-mask-image:radial-gradient(closest-side,#000 82%,transparent)">
    <img id="t2rec" class="fit" data-rec="chapa77" src="${recSrc('chapa77')}" style="position:absolute;inset:0">
    <div id="t2fade" style="position:absolute;left:0;right:0;top:89%;bottom:0;background:linear-gradient(rgba(19,114,110,0),#13726e 27%)"></div>
  </div>
</div>

<!-- 01 · Hook -->
<div class="L" id="hookLock" style="left:96px;top:250px;z-index:10"><div class="lock">${mark(40, T.blue)}GROWLIFT</div></div>
<div class="ln" id="l1" style="left:90px;top:660px;height:150px;font:800 158px/.9 Inter;letter-spacing:-.055em;z-index:10"><span>SUA MARCA</span></div>
<div class="ln" id="l2" style="left:90px;top:802px;height:150px;font:800 158px/.9 Inter;letter-spacing:-.055em;z-index:10"><span>MERECE</span></div>
<div class="ln" id="l3" style="left:84px;top:948px;height:290px;font:800 320px/.86 Inter;letter-spacing:-.06em;color:${T.blueHi};z-index:10"><span><span id="mais">MAIS</span><span id="dotG">.<i id="dotBase" style="display:inline-block;width:0;height:0;vertical-align:baseline"></i></span></span></div>

<!-- 02 → 04 · The travelling screen: the blue dot of MAIS., then the Salinho site, then the phone. -->
<div class="phone L" id="phL" style="width:430px;height:898px;z-index:11"><img src="${CUT('salinho-look-topo')}"></div>
<div class="phone L" id="phR" style="width:430px;height:898px;z-index:11"><img src="${CUT('salinho-selecao-topo')}"></div>
<div class="phone L" id="phC" style="width:540px;height:1136px;z-index:14"><img data-rec="salinho" src="${recSrc('salinho')}"></div>
<div class="L" id="scr" style="overflow:hidden;z-index:13;background:${T.blueHi}">
  <img id="scrDesk" class="fit" src="${CUT('salinho-cartao')}" style="position:absolute;inset:0">
</div>

<!-- 05 · Salinho, the interface taken apart -->
<img class="L" id="pTitle" src="${CUT('salinho-titulo')}" style="width:600px;z-index:14">
<img class="L" id="pShirt" src="${A('salinho/pecas/linen-short.webp')}" style="width:720px;z-index:15;filter:drop-shadow(0 60px 50px rgba(0,0,0,.45))">
<img class="L lift" id="pMini" src="${CUT('salinho-miniaturas')}" style="width:470px;border-radius:12px;z-index:16">

<!-- 08 · Chapa 77 → Swell Club: one teal, a diagonal cut -->
<div class="full" id="t3cha" style="z-index:20;overflow:hidden;background:radial-gradient(70% 50% at 50% 30%,#187471,#13726e 55%,#0d6d69)">
  <img data-rec="chapa77" src="${recSrc('chapa77', 54)}" style="position:absolute;width:2000px;left:-460px;top:-290px;-webkit-mask-image:linear-gradient(#000 89%,transparent 92%)">
</div>
<div class="full" id="t3swe" style="z-index:21;overflow:hidden;background:#086d75">
  <img src="${A('swellclub/cel-pranchas.png')}" style="position:absolute;width:1080px;left:0;top:150px">
</div>
<div class="L" id="t3line" style="width:1200px;height:2px;z-index:22;background:rgba(255,255,255,.8);box-shadow:0 0 16px rgba(255,255,255,.45)"></div>

<!-- 09 · Swell Club -->
<div class="shot L" id="swCard" style="width:936px;height:860px;border-radius:40px;z-index:23"><img class="fit" data-rec="swellclub" src="${recSrc('swellclub')}" style="object-position:50% 12%"></div>
${['pc-aluguel', 'pc-session', 'pc-rodape'].map((f, i) => `<div class="shot lift L" id="k${i}" style="width:440px;height:275px;border-radius:22px;z-index:24;background:linear-gradient(#f3f0e5 32%,#f4ede0 42%)"><img class="fit" id="k${i}img" src="${A(`swellclub/${f}.png`)}" style="object-position:0 0">${i === 2 ? `<img class="L" id="swLetters" src="${CUT('swellclub-letras')}">` : ''}</div>`).join('')}

<!-- 10 → 11 · Fornada (one container, so it can shrink into the grid) -->
<div class="full" id="foScene" style="z-index:30;transform-origin:0 0">
  <div class="full" id="foBg" style="background:#f4ede0"></div>
  <img class="L" id="foTitle" src="${CUT('fornada-titulo')}" style="width:620px">
  ${phone('foPhone', recSrc('fornada'), 'left:0;top:0;width:470px;height:985px;background:#1b1410', 'fornada')}
  <img class="L lift" id="foPhoto" src="${CUT('fornada-folhado')}" style="width:418px;border-radius:6px">
  <img class="L" id="foLegend" src="${CUT('fornada-folhado-legenda')}" style="width:230px">
  ${caption('capFor', 'Fornada', 'Padaria · reserva do café da manhã pelo site', true, 'max-width:450px')}
</div>

<!-- 12 · the four projects become the mark -->
${[['salinho/cel-hero.png', 60, 250], ['chapa77/cel-hero.png', 552, 250], ['swellclub/cel-historia-1.png', 60, 944]].map(([f, x, y], i) => `<div class="shot L" id="tl${i}" style="width:468px;height:670px;border-radius:28px;z-index:31" data-x="${x}" data-y="${y}"><img class="fit" src="${A(f)}" style="object-position:50% 0"></div>`).join('')}
<div class="L mk" id="mkBox" style="width:960px;height:752px;z-index:32;display:flex">
  ${['salinho/cel-hero.png', 'chapa77/cel-historia-1.png', 'swellclub/cel-historia-1.png', 'fornada/cel-historia-4.png'].map((f) => `<div style="flex:1;overflow:hidden"><img class="fit" src="${A(f)}"></div>`).join('')}
  <div class="full" id="mkFill" style="background:${T.blue}"></div>
  <div class="full" id="mkSweep" style="background:linear-gradient(105deg,transparent 42%,rgba(255,255,255,.5) 50%,transparent 58%);background-size:300% 100%"></div>
</div>

<!-- 13 · signature -->
<div class="L" id="endRefl" style="left:360px;top:704px;z-index:33;transform:scaleY(-1);-webkit-mask-image:linear-gradient(transparent 40%,#000)">${mark(360, T.blue)}</div>
<div class="L" id="endWord" style="width:1080px;top:860px;text-align:center;font:700 118px/1 Inter;z-index:33">GROWLIFT</div>
<div class="L" id="endTag" style="width:1080px;top:1010px;text-align:center;font:600 46px/1 Inter;letter-spacing:-.02em;color:${T.soft};z-index:33">Sua marca merece mais.</div>
<div class="L" id="endCta" style="width:1080px;top:1190px;display:flex;justify-content:center;z-index:33"><div style="padding:26px 44px;border-radius:999px;background:${T.blue};font:700 36px/1 Inter;letter-spacing:-.01em">Peça seu diagnóstico grátis</div></div>
<div class="L" id="endUrl" style="width:1080px;top:1320px;text-align:center;font:600 40px/1 Inter;z-index:33">growlift.com.br</div>

${caption('capSal', 'Salinho', 'Moda de linho · site com reserva da peça pelo WhatsApp')}
${caption('capCha', 'Chapa 77', 'Hamburgueria · a história do lanche contada na rolagem, com cardápio e pedido')}
${caption('capSwe', 'Swell Club', 'Surf shop · pranchas, aluguel por diária e kit montado no site')}

<script>
const REC = ${JSON.stringify(REC)};
const clamp = (x) => Math.max(0, Math.min(1, x));
const E = {
  lin: (p) => p,
  out: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  in: (p) => p * p * p,
  io: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
};
/** Eased progress of t between a and b. */
const P = (t, a, b, e = 'io') => E[e](clamp((t - a) / (b - a)));
const L = (x, y, p) => x + (y - x) * p;
const $ = (id) => document.getElementById(id);
/** Places an element: left/top/width/height in px, opacity, and a transform. */
function put(el, s) {
  if (typeof el === 'string') el = $(el);
  const st = el.style;
  if (s.x !== undefined) st.left = s.x + 'px';
  if (s.y !== undefined) st.top = s.y + 'px';
  if (s.w !== undefined) st.width = s.w + 'px';
  if (s.h !== undefined) st.height = s.h + 'px';
  if (s.r !== undefined) st.borderRadius = s.r + 'px';
  if (s.o !== undefined) { st.opacity = s.o; st.visibility = s.o <= 0.002 ? 'hidden' : 'visible'; }
  // The transform is only touched when the call moves the element (some layers set their own).
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
/** Plays a recording in an <img data-rec>: frame for time-in-recording rt (s), held at the ends. */
const pending = [];
function play(img, rt) {
  if (typeof img === 'string') img = $(img);
  const r = REC[img.dataset.rec];
  const n = Math.max(0, Math.min(r.count - 1, Math.floor(rt * 30)));
  const src = r.url + '/' + String(n).padStart(5, '0') + '.jpg';
  if (img.getAttribute('src') !== src) { img.src = src; pending.push(img.decode().catch(() => {})); }
}
/** Caption parts come in one after another and leave together. */
function cap(id, tin, tout, t) {
  const parts = $(id).querySelectorAll('.cp');
  const gone = P(t, tout, tout + 0.22, 'in');
  parts.forEach((el, k) => {
    const p = P(t, tin + k * 0.08, tin + k * 0.08 + 0.55, 'out');
    put(el, { o: p * (1 - gone), ty: (1 - p) * 30 - gone * 16 });
  });
  put($(id), { o: t >= tin - 0.01 && t <= tout + 0.25 ? 1 : 0 });
}

// The dot of "MAIS." measured from the font itself, so the shape that grows out of it starts exactly on it.
let DOT;
function measure() {
  const g = $('dotG'), cs = getComputedStyle(g);
  const c = document.createElement('canvas').getContext('2d');
  c.font = cs.fontWeight + ' ' + cs.fontSize + ' Inter';
  const m = c.measureText('.');
  const box = g.getBoundingClientRect(), base = $('dotBase').getBoundingClientRect().top;
  DOT = { x: box.left - m.actualBoundingBoxLeft, y: base - m.actualBoundingBoxAscent, w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent };
}

const BG = ['bgHook', 'bgSal', 'bgSalSolid', 'bgChapa', 'bgTeal', 'bgSwell', 'bgCream', 'bgEnd'];

window.render = async (t) => {
  if (!DOT) measure();
  pending.length = 0;

  // Backgrounds: [fade in from, to, gone after]
  const bg = { bgHook: [-1, 0, 3.3], bgSal: [2.7, 3.2, 6.6], bgSalSolid: [6.2, 6.5, 9.1], bgChapa: [8.55, 8.95, 11.7], bgTeal: [11.3, 11.5, 12.9], bgSwell: [12.5, 12.75, 15.35], bgCream: [14.95, 15.25, 19.7], bgEnd: [19.3, 19.6, 99] };
  for (const id of BG) { const [a, b, z] = bg[id]; put(id, { o: t > z ? 0 : P(t, a, b, 'lin') }); }

  // ---- 01 · Hook (0–2.0)
  put('hookLock', { o: P(t, 1.05, 1.45, 'out') * (1 - P(t, 2.0, 2.3, 'lin')), ty: (1 - P(t, 1.05, 1.45, 'out')) * 14 });
  for (const [id, a, out] of [['l1', -0.08, 1.82], ['l2', 0.34, 1.88]]) {
    const inP = P(t, a, a + 0.45, 'out'), outP = P(t, out, out + 0.32, 'in');
    put($(id).firstChild, { ty: (1 - inP) * 200 - outP * 170 });
    put(id, { o: t < 2.45 ? 1 : 0 });
  }
  {
    const inP = P(t, 0.72, 1.22, 'out');
    const up = P(t, 2.1, 2.58, 'io');                  // the word climbs to the top
    const gone = P(t, 2.62, 2.95, 'in');               // and leaves through its own mask
    put('l3', { y: L(948, 250, up), o: t < 3.0 ? 1 : 0 });
    put($('l3').firstChild, { ty: (1 - inP) * 380 - gone * 300, s: L(0.94, 1, inP), origin: '0 100%' });
    $('dotG').style.opacity = t < 2.0 ? 1 : 0;
  }

  // ---- 02 → 04 · the travelling screen (dot → Salinho on the computer → Salinho on the phone)
  {
    const scr = $('scr');
    let x, y, w, h, r, o = 1, ring = 0, desk = 1, s = 1, origin = '50% 50%';
    if (t < 2.0) o = 0;
    const grow = P(t, 2.05, 2.8, 'io');                // dot → tall screen
    const wide = P(t, 2.8, 3.3, 'io');                 // tall screen → the whole site card
    const dolly = P(t, 3.3, 4.4, 'lin');               // slow camera drift
    const away = P(t, 4.4, 4.78, 'in');                // the computer screen leaves upwards
    x = L(DOT.x, 72, grow); y = L(DOT.y, 600, grow); w = L(DOT.w, 936, grow); h = L(DOT.h, 1000, grow); r = L(DOT.w * 0.28, 44, grow);
    if (t >= 2.8) { x = L(72, -20, wide); y = L(600, 250, wide); w = L(936, 1450, wide); h = L(1000, 894, wide); r = L(44, 40, wide); }
    if (t >= 3.3) { x = -20; y = L(250, 238, dolly); w = L(1450, 1490, dolly); h = L(894, 919, dolly); }
    if (t >= 4.4) { y = L(238, -420, away); }
    desk = P(t, 2.3, 2.6, 'lin');
    ring = P(t, 2.05, 2.3, 'lin') * (1 - P(t, 2.85, 3.2, 'lin'));
    o = t < 2.0 ? 0 : 1 - P(t, 4.45, 4.78, 'lin');
    s = L(1, 0.9, away);
    put(scr, { x, y, w, h, r, o, s, origin });
    scr.style.boxShadow = '0 0 0 ' + (5 * ring) + 'px ${T.blueHi}, 0 60px 140px -30px rgba(8,101,254,' + (0.45 * ring) + '), 0 0 0 1.5px rgba(255,255,255,' + (0.12 * (1 - ring)) + ')';
    scr.style.background = t < 2.35 ? '${T.blueHi}' : '#111';
    put('scrDesk', { o: desk });
    // 04: the phone rises where the computer screen was; 04 → 05: it comes towards the camera and opens into the pieces
    const rise = P(t, 4.55, 5.1, 'out'), exit = P(t, 6.2, 6.6, 'in');
    put('phC', { x: 270, y: 280, ty: (1 - rise) * 520, o: P(t, 4.55, 4.65, 'lin') * (1 - P(t, 6.35, 6.6, 'lin')), s: L(0.94, 1, rise) * L(1, 1.45, exit), origin: '270px 568px' });
    play($('phC').firstElementChild, t - 4.6);
    // side phones slide out from behind the centre one, then leave
    const side = P(t, 4.85, 5.4, 'out'), sideOut = P(t, 6.15, 6.5, 'in');
    put('phL', { x: L(325, -60, side) - sideOut * 260, y: 430, o: side * (1 - sideOut), f: 'brightness(.62)' });
    put('phR', { x: L(325, 710, side) + sideOut * 260, y: 430, o: side * (1 - sideOut), f: 'brightness(.62)' });
  }

  // ---- 03 · caption Salinho
  cap('capSal', 3.25, 4.25, t);

  // ---- 05 · Salinho, the interface taken apart (6.4–8.0)
  {
    const p1 = P(t, 6.35, 6.95, 'out'), p2 = P(t, 6.42, 6.95, 'out'), p3 = P(t, 6.55, 7.1, 'out');
    const drift = P(t, 7.0, 8.0, 'lin');
    const away = P(t, 7.82, 8.12, 'in');                  // everything but the button leaves
    put('pTitle', { x: 60, y: 250, o: p2 * (1 - away), ty: (1 - p2) * 50 - drift * 16 - away * 40 });
    put('pShirt', { x: 300, y: 540, o: p1 * (1 - away), s: L(0.72, 1, p1) * L(1, 0.96, away), ty: (1 - p1) * 80 - drift * 10, rot: -1.2 * drift, origin: '50% 50%' });
    put('pMini', { x: 72, y: 1300, o: p3 * (1 - away), ty: (1 - p3) * 90 - drift * 26 + away * 40 });
  }

  // ---- 05 → 06 → 07 · the reserve button grows into the Chapa 77 window, then the front story card
  {
    const p4 = P(t, 6.62, 7.15, 'out'), drift = P(t, 7.0, 8.0, 'lin');
    const lift = P(t, 7.95, 8.3, 'io');                   // button to the top, full width
    const open = P(t, 8.2, 8.66, 'out');                  // and it opens downwards into a red window
    const card = P(t, 8.8, 9.25, 'io');                   // the window becomes the front card of the story
    const big = P(t, 11.3, 11.6, 'io');                   // the teal card fills the screen
    let x = 72, y = 1450 - drift * 34, w = L(600, 600, 0), h, r = 12;
    const btnH = (ww) => ww * 268 / 1036;
    w = L(600, 936, lift); y = L(1450 - 34, 330, lift); h = btnH(w) + L(0, 1028, open); r = L(12, 28, lift);
    if (t >= 8.8) { x = 72; y = L(330, 548, card); w = 936; h = L(btnH(936) + 1028, 585, card); r = L(28, 40, card); }
    // framed so the site's title stays above the screen and the burger in layers fills the top half
    if (t >= 11.3) { x = L(72, -460, big); y = L(548, -290, big); w = L(936, 2000, big); h = L(585, 1250, big); r = L(40, 0, big); }
    put('t2', { x, y, w, h, r, o: p4 * (t > 11.7 ? 0 : 1), ty: (1 - p4) * 90 });
    put('t2btn', { o: 1 - P(t, 8.8, 9.0, 'lin') });
    $('t2red').style.top = (t < 8.8 ? btnH(w) : L(btnH(936), 0, card)) + 'px';
    put('t2red', { o: t < 8.18 ? 0 : 1 });
    put('t2burger', { y: 380 - btnH(936), o: P(t, 8.3, 8.6, 'lin') * (1 - P(t, 8.85, 9.1, 'lin')), s: L(1.12, 1, P(t, 8.3, 8.8, 'out')), origin: '50% 40%' });
    put('t2rec', { o: P(t, 8.85, 9.1, 'lin') });
    put('t2fade', { o: P(t, 11.35, 11.6, 'lin') });          // the site's order button fades into the teal
    // the recording slows a little so the card hands over on the burger taken apart in layers (teal)
    play('t2rec', Math.min(1.8, Math.max(0, (t - 9.05) * 0.78)));
  }

  // ---- 07 · the story's chapters behind the front card; each leaves when the front card reaches its colour
  {
    const reach = [10.88, 10.63, 10.42, 10.08];          // teal, purple, green, orange
    [0, 1, 2, 3].forEach((i) => {
      const inP = P(t, 9.0 + (3 - i) * 0.05, 9.5 + (3 - i) * 0.05, 'out');
      const go = P(t, reach[i] - 0.05, reach[i] + 0.22, 'io');
      put('bc' + i, { x: 72, y: 300 + i * 62, s: L(0.8 + i * 0.05, 1, go), origin: '50% 0', ty: (1 - inP) * 220 + go * (548 - 300 - i * 62), o: inP * (1 - go), f: 'brightness(' + (0.55 + i * 0.1) + ')' });
    });
  }
  cap('capCha', 9.3, 11.2, t);

  // ---- 08 · Chapa 77 → Swell Club (11.6–12.4): the diagonal cut rises through the same teal
  {
    const d = L(1000, 0, P(t, 11.6, 12.0, 'out')) + L(0, -1500, P(t, 12.12, 12.5, 'in'));
    const y1 = 1190 + d, y2 = 730 + d;
    put('t3cha', { o: t >= 11.6 && t <= 12.6 ? 1 : 0 });
    play($('t3cha').firstElementChild, 1.8);
    $('t3cha').style.clipPath = 'polygon(0 0,100% 0,100% ' + y2 + 'px,0 ' + y1 + 'px)';
    const zoom = P(t, 12.3, 12.72, 'in');
    put('t3swe', { o: t < 11.6 ? 0 : 1 - P(t, 12.62, 12.72, 'lin'), s: L(1, 1.9, zoom), origin: '590px 1313px' });
    $('t3swe').style.clipPath = 'polygon(0 ' + y1 + 'px,100% ' + y2 + 'px,100% 100%,0 100%)';
    $('t3swe').firstElementChild.style.transform = 'translateY(' + (L(260, 0, P(t, 11.75, 12.3, 'out'))) + 'px)';
    put('t3line', { x: -60, y: (y1 + y2) / 2 - 1, rot: -23.07, o: t > 11.6 && t < 12.45 ? 1 : 0, origin: '50% 50%' });
  }

  // ---- 09 · Swell Club (12.4–15.2): same yellow board, now under the surfer
  {
    const zin = P(t, 12.62, 13.15, 'out');
    const fade = P(t, 14.6, 14.9, 'lin');
    put('swCard', { x: 72, y: 250, o: P(t, 12.62, 12.72, 'lin') * (1 - fade), s: L(1.7, 1, zin), origin: '588px 633px' });
    play($('swCard').firstElementChild, t - 12.85);
    const off = L(900, -380, P(t, 13.1, 14.6, 'io'));
    const grow = P(t, 14.65, 15.25, 'io');
    for (const i of [0, 1, 2]) {
      const x0 = off + i * 470;
      if (i < 2) { put('k' + i, { x: x0, y: 990, o: (t > 13.05 ? 1 : 0) * (1 - fade) }); continue; }
      // the last card (the cream footer) grows to fill the screen
      put('k2', { x: L(x0, 0, grow), y: L(990, 0, grow), w: L(440, 1080, grow), h: L(275, 1920, grow), r: L(22, 0, grow), o: (t > 13.05 ? 1 : 0) * (t > 16.2 ? 0 : 1) });
      put('k2img', { o: 1 - P(t, 14.7, 14.95, 'lin') });
    }
    // the giant SWELL of that footer: from its place in the card to the top of the cream page, then out
    const lx = L(-70, 40, grow), ly = L(95, 250, grow), lw = L(625, 1600, grow);      // in the card's own coordinates
    const up = P(t, 15.55, 16.05, 'in');
    put('swLetters', { x: lx, y: ly - up * 700, w: lw, o: P(t, 14.7, 14.95, 'lin') * (1 - P(t, 15.85, 16.05, 'lin')) });
  }
  cap('capSwe', 13.1, 14.5, t);

  // ---- 10 → 11 · Fornada (15.2–19.4): the same cream; the page rises, the phone pours
  {
    const sc = $('foScene');
    put('foBg', { o: P(t, 15.85, 16.15, 'lin') });
    const drift = P(t, 16.8, 19.4, 'lin');
    put('foTitle', { x: 72, y: L(1150, 250, P(t, 15.45, 16.25, 'io')) - drift * 10, o: P(t, 15.4, 15.7, 'lin') });
    put('foPhoto', { x: 72, y: L(1500, 540, P(t, 15.55, 16.35, 'io')) - drift * 40, o: P(t, 15.5, 15.8, 'lin') });
    put('foLegend', { x: 68, y: 1112 - drift * 40, o: P(t, 16.45, 16.8, 'lin') });
    put('foPhone', { x: 538, y: L(1950, 520, P(t, 16.0, 16.7, 'out')) - drift * 24, o: t > 15.95 ? 1 : 0 });
    play($('foPhone').firstElementChild, t - 16.2);
    cap('capFor', 16.8, 19.05, t);
    // 11 → 12: the whole page shrinks into the bottom-right tile of a 2×2 grid
    const k = 468 / 1080, p = P(t, 19.3, 19.85, 'io'), dim = P(t, 20.0, 20.4, 'io'), gone = P(t, 20.6, 20.9, 'lin');
    const inset = 187 * p;
    sc.style.transform = 'translate(' + (552 * p) + 'px,' + (863 * p) + 'px) scale(' + L(1, k, p) + ')';
    sc.style.clipPath = 'inset(' + inset + 'px 0 ' + inset + 'px 0 round ' + (65 * p) + 'px)';
    put(sc, { o: (t < 15.3 ? 0 : 1) * L(1, 0.07, dim) * (1 - gone) });
  }

  // ---- 12 · the four projects become the mark (19.4–21.0)
  {
    const dim = P(t, 20.0, 20.4, 'io'), gone = P(t, 20.6, 20.9, 'lin');
    [0, 1, 2].forEach((i) => {
      const el = $('tl' + i), p = P(t, 19.55 + i * 0.06, 19.95 + i * 0.06, 'out');
      put(el, { x: +el.dataset.x, y: +el.dataset.y, o: p * L(1, 0.07, dim) * (1 - gone), s: L(0.92, 1, p), origin: '50% 50%' });
    });
    const show = P(t, 20.0, 20.45, 'out'), shrink = P(t, 20.5, 21.0, 'io');
    put('mkBox', { x: 60, y: 584, o: show, s: L(0.7, 1, show) * L(1, 0.375, shrink), ty: L(0, -399, shrink), origin: '50% 50%' });
    put('mkFill', { o: P(t, 20.45, 20.8, 'lin') });
    $('mkSweep').style.backgroundPosition = L(120, -20, P(t, 23.0, 23.9, 'io')) + '% 0';
    put('mkSweep', { o: t > 22.95 && t < 23.95 ? 1 : 0 });
  }

  // ---- 13 · signature (21.0–25.0)
  {
    put('endRefl', { o: 0.14 * P(t, 21.0, 21.4, 'lin'), s: 1 });
    $('endRefl').style.transform = 'scaleY(-1)';
    const wp = P(t, 21.15, 21.75, 'out');
    put('endWord', { o: wp, ty: (1 - wp) * 20 });
    $('endWord').style.letterSpacing = L(0.26, 0.08, wp) + 'em';
    $('endWord').style.paddingLeft = L(0.26, 0.08, wp) + 'em';
    for (const [id, a] of [['endTag', 21.6], ['endCta', 22.05], ['endUrl', 22.25]]) {
      const p = P(t, a, a + 0.5, 'out');
      put(id, { o: p, ty: (1 - p) * 22 });
    }
  }

  await Promise.all(pending);
  await Promise.all([...document.images].filter((i) => !i.complete).map((i) => i.decode().catch(() => {})));
};
</script></body></html>`;

// ---------------------------------------------------------------------------------------------
const KEY = [
  [1.9, '01-hook'], [2.55, '02-transicao-hook-salinho'], [3.9, '03-salinho-entrada'], [5.9, '04-salinho-celular'],
  [7.6, '05-salinho-principal'], [8.6, '06-transicao-salinho-chapa77'], [9.75, '07-chapa77'], [11.95, '08-transicao-chapa77-swellclub'],
  [13.9, '09-swellclub'], [15.62, '10-transicao-swellclub-fornada'], [18.8, '11-fornada'], [20.3, '12-transicao-convergencia'], [24.2, '13-assinatura'],
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
  console.log('quadros de teste em renders/_teste');
} else if (args[0] === '--quadros') {
  fs.mkdirSync(path.join(OUT, 'quadros'), { recursive: true });
  for (const [t, name] of KEY) await shot(t, path.join(OUT, 'quadros', `${name}.png`));
  fs.writeFileSync(path.join(OUT, 'quadros', 'tempos.json'), JSON.stringify(Object.fromEntries(KEY.map(([t, n]) => [n, t])), null, 2));
  console.log('13 quadros em renders/quadros');
} else {
  const work = path.join(OUT, '_tmp', 'frames');
  fs.rmSync(work, { recursive: true, force: true });
  fs.mkdirSync(work, { recursive: true });
  const frames = Math.round(DURATION * FPS);
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    await shot(i / FPS, path.join(work, `${String(i).padStart(5, '0')}.jpg`), 'jpeg');
    if (i % 75 === 0) console.log(`  ${i}/${frames} · ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  const out = path.join(OUT, 'sua-marca-merece-mais');
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(work, '%05d.jpg'),
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow',
    '-r', String(FPS), '-movflags', '+faststart', `${out}.mp4`], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg falhou');
  await shot(COVER, `${out}-capa.png`);
  fs.rmSync(work, { recursive: true, force: true });
  console.log(`sua-marca-merece-mais.mp4 · ${DURATION} s · ${frames} quadros · ${Math.round((Date.now() - t0) / 1000)} s`);
}
await browser.close();
if (errors.length) { console.error('ERROS NA PÁGINA:', [...new Set(errors)].join(' | ')); process.exit(1); }

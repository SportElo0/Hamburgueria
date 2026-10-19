// Downtown Burger: Instagram feed posts (1080x1350) modelled on the "Marketing hamburgueria" Pinterest board.
//   node build.mjs            -> renders out/*.png
// Food pictures are cut from the printed menu (public/photos); the badge is the site's vector redraw of the menu logo.
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const A = (f) => 'file://' + path.join(HERE, 'assets', f);
const W = 1080;
const H = 1350;

const C = {
  cream: '#f3e9d6', paper: '#fbf6ec', ink: '#1d1712', brand: '#a61e22', mustard: '#f4b740',
  red: '#a3171c', orange: '#cf5a17', onDark: '#fbf3e4',
};

// ── Shared pieces ──────────────────────────────────────────────────────────
function badge(size, color = C.onDark) {
  const r = 150, a = (25 * Math.PI) / 180;
  const x0 = 200 - r * Math.cos(a), x1 = 200 + r * Math.cos(a), y = 200 + r * Math.sin(a);
  const id = 'arc' + Math.random().toString(36).slice(2, 8);
  return `<svg width="${size}" height="${size}" viewBox="0 0 400 400" style="color:${color}">
  <defs><path id="${id}" d="M${x0} ${y} A${r} ${r} 0 0 0 ${x1} ${y}"/></defs>
  <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" stroke-width="7"/>
  <circle cx="200" cy="200" r="176" fill="none" stroke="currentColor" stroke-width="2.5"/>
  <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M62 176H338"/><path d="M78 176v-38h16v38M94 176v-58h18v58M112 176v-30h12v30"/>
    <path d="M124 176v-72h20v72M130 112h8M130 124h8M130 136h8M130 148h8"/><path d="M144 176v-46h14v46"/>
    <path d="M158 176V96l10-10 10 10v80M162 104h12M162 118h12M162 132h12M162 146h12M162 160h12"/>
    <path d="M178 176V78h12V62l6-8V36m0 18 6 8v16h12v98"/><path d="M184 92h24M184 108h24M184 124h24M184 140h24M184 156h24"/>
    <path d="M214 176v-64h18v64M219 122h8M219 136h8M219 150h8"/><path d="M232 176v-40h12v40"/>
    <path d="M248 176v-52M248 124h6v52M262 176v-52M256 124h6"/>
    <path d="M244 124c16 12 30 24 50 30M262 124c20 14 40 26 70 34M248 132l84 26"/><path d="M294 176v-34M320 176v-22"/>
  </g>
  <g fill="currentColor" style="font-family:'Big Shoulders';font-variation-settings:'opsz' 72">
    <text x="200" y="256" text-anchor="middle" font-size="96" font-weight="900" textLength="372" lengthAdjust="spacingAndGlyphs">DOWNTOWN</text>
    <text x="200" y="314" text-anchor="middle" font-size="54" font-weight="800" letter-spacing="6">BURGER</text>
  </g>
  <text fill="currentColor" font-size="19" font-weight="700" letter-spacing="3" style="font-family:'Barlow Condensed'">
    <textPath href="#${id}" startOffset="50%" text-anchor="middle">BURGERS • STEAKS • FRIES • SHAKES</textPath></text>
</svg>`;
}

const star = (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path fill="${c}" d="M12 1.8l2.9 6.6 7.2.6-5.5 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L1.9 9l7.2-.6L12 1.8Z"/></svg>`;

/** A clawed hand silhouette (SVG markup): forearm from the top, wide palm, long bony fingers bent at the joints.
 *  Drawn around the palm centre (0,0), fingers pointing down. */
function clawHand(seed = 1) {
  let s = seed;
  const j = (v) => v + (((s = (s * 9301 + 49297) % 233280) / 233280) - 0.5) * 14;
  // [points from knuckle to fingertip], stroke widths per phalanx
  const fingers = [
    [[-96, -60], [-150, 30], [-170, 110], [-150, 160]], // thumb
    [[-78, 40], [-104, 170], [-112, 270], [-92, 330]],
    [[-26, 56], [-34, 210], [-38, 320], [-20, 380]],
    [[30, 54], [40, 200], [46, 310], [34, 362]],
    [[80, 36], [104, 150], [114, 236], [100, 284]],
  ];
  const widths = [[46, 38, 30], [40, 33, 26], [42, 34, 27], [40, 33, 26], [36, 30, 24]];
  let g = '<path d="M-74 -760 L74 -760 L86 -140 C140 -110 148 -10 120 60 C70 84 -70 84 -120 60 C-148 -10 -140 -110 -86 -140 Z"/>';
  fingers.forEach((pts, i) => {
    const p = pts.map(([x, y], k) => (k ? [j(x), j(y)] : [x, y]));
    for (let k = 0; k < 3; k++) {
      g += `<path d="M${p[k][0]} ${p[k][1]} L${p[k + 1][0]} ${p[k + 1][1]}" stroke-width="${widths[i][k]}" stroke-linecap="round"/>`;
    }
    // pointed nail continuing the last phalanx
    const [ax, ay] = p[2], [bx, by] = p[3];
    const len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len, w = widths[i][2] / 2;
    g += `<path d="M${bx - uy * w} ${by + ux * w} L${bx + ux * 54} ${by + uy * 54} L${bx + uy * w} ${by - ux * w} Z"/>`;
  });
  return g;
}

/** Blurred hand shadow cast on a wall. */
function shadowHand({ x, y, rot = 0, scale = 1, blur = 10, opacity = 0.55, seed = 1, flip = false }) {
  return `<svg class="abs" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="filter:blur(${blur}px);opacity:${opacity}">
    <g fill="#1a0800" stroke="#1a0800" transform="translate(${x} ${y}) rotate(${rot}) scale(${flip ? -scale : scale} ${scale})">${clawHand(seed)}</g></svg>`;
}

/** The hero burger (menu photo), bottom-anchored at (cx, bottom). */
function burger({ cx, bottom, width, shadow = true, rot = 0, stick = false, extra = '' }) {
  // holyfield.webp: 1200 canvas, burger box x 7–93 %, y 17.9–93 %
  const img = width / 0.86;
  const left = cx - img / 2, top = bottom - img * 0.93;
  return `
  ${shadow ? `<div class="abs" style="left:${cx - width * 0.46}px;top:${bottom - width * 0.06}px;width:${width * 0.92}px;height:${width * 0.13}px;border-radius:50%;background:radial-gradient(closest-side,rgb(0 0 0/.55),rgb(0 0 0/.25) 60%,transparent);filter:blur(6px)"></div>` : ''}
  ${stick ? `<div class="abs" style="left:${cx - 5 + width * 0.04}px;top:${bottom - width * 0.98}px;width:10px;height:${width * 0.42}px;border-radius:5px;background:linear-gradient(90deg,#b98b52,#e2c08c 45%,#9c7240);transform:rotate(6deg);box-shadow:2px 0 4px rgb(0 0 0/.25)"></div>` : ''}
  <img class="abs" src="${A('holyfield.webp')}" style="left:${left}px;top:${top}px;width:${img}px;transform:rotate(${rot}deg);${extra}">`;
}

const base = `
@import url('https://fonts.googleapis.com/css2?family=Big+Shoulders:opsz,wght@10..72,700..900&family=Barlow+Condensed:wght@600;700&family=Fraunces:opsz,wght,SOFT,WONK@9..144,600..900,0..100,0..1&family=Nunito:wght@500;600;700;800;900&family=Yellowtail&display=block');
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;font-family:Nunito,sans-serif;-webkit-font-smoothing:antialiased}
.abs{position:absolute}
/* Ad typography: soft heavy serif (Fields-like) + rounded sans (Proxima Soft-like) + retro script (Espiritu Script-like). */
.display{font-family:Fraunces;font-variation-settings:'opsz' 144,'SOFT' 100,'WONK' 0;font-weight:900;line-height:.9;letter-spacing:-.02em}
.cond{font-family:Nunito;font-weight:800;text-transform:uppercase}
.script{font-family:Yellowtail;font-weight:400;line-height:1}
/* The badge lockup keeps the Downtown logo lettering. */
.logo-display{font-family:'Big Shoulders';font-variation-settings:'opsz' 72;font-weight:900;text-transform:uppercase;line-height:.86}
.logo-cond{font-family:'Barlow Condensed';text-transform:uppercase}
.grain::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.08;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
`;

const lockup = (color = C.onDark, size = 92) => `
  <div style="display:flex;align-items:center;gap:16px;color:${color}">
    ${badge(size, color)}
    <div style="display:flex;flex-direction:column;line-height:.85">
      <span class="logo-display" style="font-size:${size * 0.5}px">Downtown</span>
      <span class="logo-cond" style="font-weight:700;font-size:${size * 0.2}px;letter-spacing:.42em">Burger</span>
    </div>
  </div>`;

// ── Posts ──────────────────────────────────────────────────────────────────
const posts = {};

// 1 · "Trick or Eat?" → orange wall, yellow table, shadow claws
posts['01-gostosura-ou-travessura'] = `
<body class="grain" style="background:linear-gradient(180deg,#e0731c 0%,#d9661a 60%,#c95714 100%)">
  <div class="abs" style="left:0;right:0;bottom:0;height:430px;background:linear-gradient(180deg,#f2b322,#e6a017);clip-path:polygon(0 18%,100% 0,100% 100%,0 100%)"></div>
  <div class="abs" style="left:0;right:0;bottom:0;height:430px;background:linear-gradient(90deg,rgb(0 0 0/.12),transparent 40%);clip-path:polygon(0 18%,100% 0,100% 100%,0 100%)"></div>
  ${shadowHand({ x: 240, y: 110, rot: 24, scale: 0.78, blur: 8, opacity: 0.5, seed: 3 })}
  ${shadowHand({ x: 960, y: 420, rot: 64, scale: 0.8, blur: 11, opacity: 0.42, seed: 7, flip: true })}
  <h1 class="abs display" style="left:0;right:0;top:220px;text-align:center;color:#fff8ec;font-size:128px;text-shadow:0 4px 18px rgb(80 20 0/.3)">Gostosura<p class="script" style="font-size:84px;letter-spacing:0;margin-top:-6px">ou travessura?</p></h1>
  ${burger({ cx: 540, bottom: 1080, width: 560, stick: true })}
  <div class="abs" style="left:0;right:0;bottom:64px;display:flex;justify-content:space-between;align-items:flex-end;padding:0 64px">
    ${lockup(C.ink, 84)}
    <div class="cond" style="text-align:right;color:${C.ink};font-weight:700;letter-spacing:.12em;font-size:26px;line-height:1.15">Holyfield<br><span class="display" style="font-size:56px;letter-spacing:-.01em;text-transform:none">R$ 69,90</span></div>
  </div>
</body>`;

// 2 · Ghosts with sunglasses → "Nesse Halloween…"
const ghost = (x, y, s, flip = false, seed = 0) => `
  <svg class="abs" style="left:${x}px;top:${y}px;transform:scaleX(${flip ? -1 : 1})" width="${420 * s}" height="${720 * s}" viewBox="0 0 420 720">
    <defs>
      <linearGradient id="gs${seed}" x1="0" x2="1"><stop offset="0" stop-color="#9aa1ad"/><stop offset=".35" stop-color="#f4f5f7"/><stop offset=".62" stop-color="#ffffff"/><stop offset="1" stop-color="#a7aebb"/></linearGradient>
      <radialGradient id="gh${seed}" cx=".45" cy=".18" r=".5"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <filter id="soft${seed}"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <path fill="url(#gs${seed})" d="M210 18 C120 18 82 100 80 190 C78 300 60 420 30 560 C20 610 6 660 0 700 C40 690 70 704 104 694 C140 684 160 706 196 698 C232 690 256 712 292 700 C326 690 356 708 388 696 C404 690 414 700 420 700 C410 640 392 560 372 470 C350 370 344 280 342 190 C338 96 300 18 210 18 Z"/>
    <path fill="url(#gh${seed})" d="M210 18 C120 18 82 100 80 190 C80 240 340 240 342 190 C338 96 300 18 210 18 Z" opacity=".8"/>
    <g fill="none" stroke="#7d8594" stroke-width="10" stroke-linecap="round" opacity=".35" filter="url(#soft${seed})">
      <path d="M120 300 C110 420 90 540 70 680"/><path d="M200 330 C196 460 200 580 196 690"/><path d="M290 300 C300 420 318 560 340 680"/><path d="M150 250 C200 268 250 268 300 250"/>
    </g>
    <g transform="translate(0 4)">
      <path fill="#0d0d10" d="M96 150 C96 138 104 132 116 132 L190 132 C200 132 206 140 204 150 L196 192 C192 210 178 220 160 220 L134 220 C112 220 98 206 96 188 Z"/>
      <path fill="#0d0d10" d="M224 150 C222 140 228 132 238 132 L312 132 C324 132 332 138 332 150 L330 188 C328 206 314 220 292 220 L268 220 C250 220 236 210 232 192 Z"/>
      <path d="M196 146 C206 140 222 140 232 146" stroke="#0d0d10" stroke-width="10" fill="none"/>
      <path d="M86 140 L60 132 M342 140 L366 132" stroke="#0d0d10" stroke-width="9" stroke-linecap="round"/>
      <path d="M116 144 L150 144 L132 196 Z" fill="#ffffff" opacity=".16"/><path d="M244 144 L278 144 L260 196 Z" fill="#ffffff" opacity=".16"/>
    </g>
  </svg>`;
posts['02-nesse-halloween'] = `
<body style="background:radial-gradient(ellipse at 50% 40%,#2a3448 0%,#141a26 55%,#07090e 100%)">
  <div class="abs" style="inset:0;background:radial-gradient(ellipse 60% 30% at 30% 30%,rgb(170 185 210/.18),transparent),radial-gradient(ellipse 50% 25% at 75% 55%,rgb(170 185 210/.14),transparent);filter:blur(20px)"></div>
  <div class="abs" style="left:56px;top:56px">${badge(120, C.onDark)}</div>
  <h1 class="abs" style="right:64px;top:84px;text-align:right;color:#fff;text-shadow:0 6px 24px rgb(0 0 0/.5)"><span class="script" style="display:block;font-size:84px;margin-right:8px">Nesse</span><span class="display" style="display:block;font-size:122px;margin-top:-6px">Halloween…</span></h1>
  ${ghost(40, 330, 1.02, false, 1)}
  ${ghost(600, 300, 1.08, true, 2)}
  <div class="abs" style="left:0;right:0;top:1000px;height:170px;background:linear-gradient(180deg,#5a3a22,#3a2414 60%,#24160c);box-shadow:0 -10px 30px rgb(0 0 0/.5)"></div>
  <div class="abs" style="left:0;right:0;top:1000px;height:6px;background:rgb(255 220 180/.18)"></div>
  <img class="abs" src="${A('classic-fries.webp')}" style="left:660px;top:742px;width:330px;filter:drop-shadow(0 18px 18px rgb(0 0 0/.5))">
  ${burger({ cx: 470, bottom: 1030, width: 460 })}
  <div class="abs" style="left:0;right:0;top:1170px;bottom:0;background:#07090e;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:0 70px;text-align:center">
    <p class="display" style="color:#fff;font-size:44px;letter-spacing:-.01em">Um sabor de outro mundo espera por você…</p>
    <p style="color:#c9cfdb;font-weight:600;font-size:18px;line-height:1.35">Holyfield: pão brioche, dois blends bovinos de 130 g cada, queijo prato, bacon, alface americana, tomate,<br>cebola roxa e maionese da casa. Imagem ilustrativa.</p>
  </div>
</body>`;

// 3 · BK style → orange, reaching shadows, lowercase tagline
posts['03-nem-os-fantasmas-resistem'] = `
<body class="grain" style="background:radial-gradient(ellipse at 50% 55%,#f08a2c 0%,#e2711c 45%,#c85410 100%)">
  ${shadowHand({ x: 250, y: 120, rot: 34, scale: 0.86, blur: 6, opacity: 0.62, seed: 11 })}
  ${shadowHand({ x: 840, y: 150, rot: -32, scale: 0.86, blur: 7, opacity: 0.6, seed: 5, flip: true })}
  <div class="abs" style="left:52px;top:52px">${badge(130, C.ink)}</div>
  ${burger({ cx: 540, bottom: 1010, width: 640 })}
  <p class="abs display" style="left:0;right:0;top:1050px;text-align:center;color:${C.ink};font-size:72px">Nem os fantasmas</p>
  <p class="abs script" style="left:0;right:0;top:1118px;text-align:center;color:#fff6e6;font-size:76px;text-shadow:0 3px 12px rgb(80 20 0/.25)">resistem</p>
  <p class="abs" style="left:0;right:0;top:1232px;text-align:center;color:${C.ink};font-weight:800;font-size:30px">#HalloweenDowntown</p>
</body>`;

// 4 · "Você é bom em matemática?" → emoji equation over a blurred burger
posts['04-matematica'] = `
<body style="background:#6b4a1c">
  <img class="abs" src="${A('holyfield.webp')}" style="left:-540px;top:-260px;width:2200px;filter:blur(38px) saturate(1.1) brightness(.78)">
  <div class="abs" style="inset:0;background:radial-gradient(ellipse at 50% 55%,rgb(0 0 0/0),rgb(40 20 0/.45))"></div>
  <h1 class="abs" style="left:0;right:0;top:150px;text-align:center;color:#fff;text-shadow:0 4px 20px rgb(0 0 0/.35)"><span class="script" style="display:block;font-size:76px">Você é bom em</span><span class="display" style="display:block;font-size:112px;margin-top:-2px">matemática?</span></h1>
  <div class="abs" style="left:0;right:0;top:540px;height:420px;display:flex;align-items:center;justify-content:center;gap:26px;color:#fff;font-family:Nunito;font-weight:900;font-size:96px">
    <span style="font-size:150px;line-height:1;font-family:'Noto Color Emoji'">☹️</span><span>+</span><span style="width:420px"></span><span>=</span><span style="font-size:150px;line-height:1;font-family:'Noto Color Emoji'">😁</span>
  </div>
  ${burger({ cx: 540, bottom: 930, width: 400, stick: true, shadow: false, extra: 'filter:drop-shadow(0 26px 24px rgb(0 0 0/.45))' })}
  <div class="abs" style="left:0;right:0;bottom:64px;display:flex;flex-direction:column;align-items:center;gap:14px">
    ${badge(110, '#fff')}
    <p class="cond" style="color:#fff;font-size:22px;letter-spacing:.18em">Holyfield · Downtown Burger</p>
  </div>
</body>`;

// 5 · "Penso, logo peço!" → Descartes (Frans Hals, public domain) holding the burger
posts['05-penso-logo-peco'] = `
<body style="background:#1a1c17">
  <img class="abs" src="${A('descartes.jpg')}" style="left:-170px;top:-190px;width:1264px">
  <div class="abs" style="inset:0;background:linear-gradient(180deg,rgb(0 0 0/0) 55%,rgb(10 10 8/.75) 92%)"></div>
  <div class="abs" style="right:52px;top:48px">${badge(132, C.mustard)}</div>
  ${burger({ cx: 930, bottom: 1240, width: 370, shadow: false, rot: -4, extra: 'filter:drop-shadow(0 26px 22px rgb(0 0 0/.65))' })}
  <div class="abs" style="left:64px;bottom:96px;color:${C.mustard}">
    <p class="display" style="font-size:138px;line-height:.88">“Penso,</p><p class="script" style="font-size:104px;margin:-6px 0 4px 8px">logo</p>
    <p class="display" style="font-size:138px;line-height:.88"><span style="position:relative;display:inline-block">peço!”
      <svg style="position:absolute;left:-14px;top:-8px;width:calc(100% + 40px);height:calc(100% + 22px);overflow:visible" viewBox="0 0 100 40" preserveAspectRatio="none"><ellipse cx="50" cy="20" rx="49" ry="19" fill="none" stroke="${C.mustard}" vector-effect="non-scaling-stroke" stroke-width="4" transform="rotate(-3 50 20)"/></svg>
    </span></p>
  </div>
</body>`;

// 6 · "SEXTOU!" quiz
const opt = (k, t, on = false) => `
  <div style="display:flex;align-items:center;width:520px;height:66px;border-radius:40px;background:${on ? C.brand : '#fff'};overflow:hidden">
    <span class="cond" style="display:grid;place-items:center;width:84px;height:100%;background:${C.brand};color:#fff;font-weight:900;font-size:30px;border-right:${on ? '2px solid rgb(255 255 255/.35)' : 'none'}">${k}</span>
    <span style="padding-left:26px;font-weight:800;font-size:31px;color:${on ? '#fff' : C.ink}">${t}</span>
  </div>`;
posts['06-sextou'] = `
<body style="background:#121012">
  <div class="abs" style="left:-250px;top:430px;width:560px;height:560px;overflow:hidden">
    <img src="${A('holyfield.webp')}" style="position:absolute;left:-60px;top:-110px;width:680px;filter:drop-shadow(0 30px 30px rgb(0 0 0/.6))">
  </div>
  <div class="abs" style="right:-250px;top:430px;width:560px;height:560px;overflow:hidden">
    <img src="${A('holyfield.webp')}" style="position:absolute;left:-60px;top:-110px;width:680px;transform:scaleX(-1);filter:drop-shadow(0 30px 30px rgb(0 0 0/.6))">
  </div>
  <div class="abs" style="left:0;right:0;top:70px;display:flex;justify-content:center;gap:10px">${star(30, C.brand)}${star(30, C.brand)}${star(30, C.brand)}</div>
  <div class="abs" style="left:0;right:0;top:140px;display:flex;flex-direction:column;align-items:center">
    <span class="display" style="color:#fff;font-size:230px;line-height:.82">Sex</span>
    <span class="display" style="color:${C.brand};font-size:230px;line-height:.82;margin-top:6px">tou!</span>
  </div>
  <p class="abs" style="left:0;right:0;top:696px;text-align:center;color:#fff;font-weight:700;font-size:34px;line-height:1.25">O que não pode faltar na sua<br>sexta-feira perfeita?</p>
  <div class="abs" style="left:0;right:0;top:820px;display:flex;flex-direction:column;align-items:center;gap:16px">
    ${opt('A', 'Burger artesanal')}${opt('B', 'Os amigos')}${opt('C', 'Batata frita')}${opt('D', 'Tudo junto', true)}
  </div>
  <p class="abs cond" style="left:0;right:0;top:1150px;text-align:center;color:#fff;font-size:23px;letter-spacing:.12em"><span style="color:${C.brand}">Marca o amigo</span> que completa essa lista.</p>
  <div class="abs" style="left:0;right:0;bottom:44px;display:flex;justify-content:center">${lockup('#fff', 72)}</div>
</body>`;

// 7 · "Let the spooky season begin"
posts['07-temporada-do-terror'] = `
<body class="grain" style="background:linear-gradient(180deg,#e8761e 0%,#dc6a18 55%,#e8a01f 100%)">
  <div class="abs" style="left:0;right:0;bottom:0;height:520px;background:linear-gradient(180deg,rgb(244 183 64/0),rgb(244 183 64/.85) 40%,#f2b13a)"></div>
  ${shadowHand({ x: 230, y: 90, rot: 20, scale: 0.9, blur: 8, opacity: 0.55, seed: 21 })}
  ${shadowHand({ x: 870, y: 120, rot: -22, scale: 0.88, blur: 9, opacity: 0.5, seed: 13, flip: true })}
  ${burger({ cx: 540, bottom: 990, width: 660 })}
  <div class="abs cond" style="right:48px;top:470px;color:${C.brand};font-weight:800;font-size:28px;letter-spacing:.12em;line-height:1.05;text-align:left">Holyfield<br><span class="display" style="font-size:46px;letter-spacing:-.01em;text-transform:none">R$ 69,90</span></div>
  <p class="abs" style="left:0;right:0;top:1030px;text-align:center;color:${C.brand}"><span class="script" style="display:block;font-size:66px">Que comece a</span><span class="display" style="display:block;font-size:76px;margin-top:-4px">temporada do terror</span></p>
  <div class="abs" style="left:0;right:0;bottom:46px;display:flex;justify-content:center">${lockup(C.brand, 70)}</div>
</body>`;

// ── Render ─────────────────────────────────────────────────────────────────
const out = path.join(HERE, 'out');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const only = process.argv[2];
for (const [name, body] of Object.entries(posts)) {
  if (only && !name.startsWith(only)) continue;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${base}</style></head>${body}</html>`;
  await fs.writeFile(path.join(out, `${name}.html`), html);
  await page.goto('file://' + path.join(out, `${name}.html`), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log('ok', name);
}
await browser.close();

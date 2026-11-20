// Carrosséis diários da Growlift (a partir de 02/11/2026): um carrossel por dia, junto com o Reel do dia.
// Formato editorial 1080×1350: capa que promete uma coisa concreta, slide 2 que segura sozinho (o Instagram
// pode mostrar o carrossel de novo a partir dele), uma ideia por slide, slide-resumo para salvar e um único pedido no
// fim. Números só de pesquisa com fonte escrita no próprio slide. Nada de cliente, depoimento ou resultado inventado.
//   node growlift-social/_fonte/carrosseis.mjs            → todos
//   node growlift-social/_fonte/carrosseis.mjs 01 03      → só esses (prefixo da pasta)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { page, TOKENS, MARK, icon } from './pecas.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = '09-carrosseis';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const B = (t) => `<span class="b">${t}</span>`;
const GREEN = '#22c55e';
const RED = '#ff6b5b';
const AMBER = '#ffc94d';

// ---------------------------------------------------------------------------------------------
// Kit

const CSS = `
body{background:${TOKENS.bg}}
.glow{position:absolute;border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,rgba(8,101,254,.45),rgba(8,101,254,0) 70%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:72px 72px;-webkit-mask-image:radial-gradient(ellipse 80% 70% at 30% 20%,#000,transparent 75%)}
.k{font-size:26px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${TOKENS.eyebrow}}
.t{font-weight:800;letter-spacing:-.04em;line-height:1;color:#fff}
.b{color:${TOKENS.blueBright}}
.p{font-size:40px;line-height:1.36;color:#dfe5f0;font-weight:450}
.s{font-size:26px;line-height:1.35;color:${TOKENS.muted}}
.pill{display:inline-flex;align-items:center;gap:12px;height:60px;padding:0 26px;border-radius:999px;font-size:26px;font-weight:700;color:#cfe0ff;background:rgba(8,101,254,.2);border:1.5px solid rgba(77,141,255,.5)}
.card{position:relative;background:${TOKENS.surface};border:1.5px solid rgba(255,255,255,.1);border-radius:34px}
.row{display:flex;gap:26px;align-items:flex-start}
.ck{flex:none;width:56px;height:56px;border-radius:16px;display:grid;place-items:center}
.ill{font-size:22px;font-weight:700;letter-spacing:.04em;color:${TOKENS.dim}}
`;

function slide(inner, { n, total, kicker, glow = 'tl' }) {
  const g = {
    tl: 'left:-480px;top:-520px',
    tr: 'right:-480px;top:-520px',
    br: 'right:-520px;bottom:-560px',
    bl: 'left:-520px;bottom:-560px',
  }[glow];
  const dots = Array.from({ length: total }, (_, i) => `<i style="display:block;height:8px;border-radius:4px;width:${i + 1 === n ? 46 : 14}px;background:${i + 1 === n ? TOKENS.blue : 'rgba(255,255,255,.22)'}"></i>`).join('');
  return page(
    1080,
    1350,
    `<div class="glow" style="width:1250px;height:1250px;${g};opacity:.6"></div><div class="grid"></div>
    <div style="position:absolute;left:88px;right:88px;top:84px;display:flex;justify-content:space-between;align-items:center">
      <span class="k">${kicker}</span><span style="font-size:26px;font-weight:600;color:${TOKENS.muted}">@growlift.ai</span></div>
    <div style="position:absolute;left:88px;right:88px;top:170px;bottom:150px">${inner}</div>
    <div style="position:absolute;left:88px;right:88px;bottom:64px;display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;align-items:center;gap:14px;font-size:26px;font-weight:700;letter-spacing:.12em;color:#e8eefa"><span style="display:inline-block;height:27px">${MARK.replace('<svg ', '<svg height="27" ')}</span>GROWLIFT</div>
      <div style="display:flex;align-items:center;gap:8px">${dots}</div>
      <span style="font-size:26px;font-weight:700;color:#aeb8cc">${n}/${total}</span></div>`,
    CSS,
  );
}

const stars = (k, size = 34, empty = 'rgba(255,255,255,.18)') =>
  `<span style="display:inline-flex;gap:4px">${Array.from({ length: 5 }, (_, i) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="${i < k ? AMBER : empty}"/></svg>`).join('')}</span>`;

const cover = ({ title, sub, visual = '', note = '' }) =>
  `<div style="position:absolute;left:0;right:0;top:0">${visual}</div>
   <div style="position:absolute;left:0;right:0;bottom:0">
     ${note ? `<span class="ill" style="display:inline-block;margin-bottom:22px">${note}</span>` : ''}
     <h1 class="t" style="font-size:104px">${title}</h1>
     <p class="p" style="margin-top:26px">${sub}</p>
     <span class="pill" style="margin-top:34px">Arraste para o lado →</span>
   </div>`;

const stat = ({ number, label, body = '', source }) =>
  `<div style="position:absolute;left:0;right:0;top:40px">
     <div style="font-size:300px;font-weight:900;letter-spacing:-.06em;line-height:.9;background:linear-gradient(180deg,#8db8ff,#0865fe);-webkit-background-clip:text;color:transparent">${number}</div>
     <h2 class="t" style="font-size:76px;margin-top:30px">${label}</h2>
     ${body ? `<p class="p" style="margin-top:28px">${body}</p>` : ''}
   </div>
   <p class="s" style="position:absolute;left:0;right:0;bottom:0;border-top:1.5px solid rgba(255,255,255,.12);padding-top:22px">Fonte: ${source}</p>`;

const step = ({ n, title, body, visual = '', tag = '' }) =>
  `<div style="display:flex;align-items:center;gap:26px">
     <span style="font-size:120px;font-weight:900;letter-spacing:-.05em;line-height:.85;color:transparent;-webkit-text-stroke:3px ${TOKENS.blueBright}">${String(n).padStart(2, '0')}</span>
     ${tag ? `<span class="pill">${tag}</span>` : ''}
   </div>
   <h2 class="t" style="font-size:84px;margin-top:34px">${title}</h2>
   <p class="p" style="margin-top:26px">${body}</p>
   <div style="position:absolute;left:0;right:0;bottom:0">${visual}</div>`;

const review = ({ k, label, text, reply, who = 'Cliente' }) =>
  `<span class="pill">${label}</span>
   <div class="card" style="margin-top:34px;background:#f4f6fa;color:#121826;padding:34px 38px">
     <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:30px">${who}</b>${stars(k, 36, '#d5dbe5')}</div>
     <p style="font-size:34px;line-height:1.4;margin-top:16px;color:#2b3446">“${text}”</p>
   </div>
   <div style="display:flex;align-items:center;gap:14px;margin:30px 0 0 30px" class="k">${icon('contato', { size: 34, color: TOKENS.eyebrow, width: 2 })}Sua resposta (copie e adapte)</div>
   <div class="card" style="margin-top:18px;padding:34px 38px;border-color:rgba(77,141,255,.55);background:rgba(8,101,254,.14)">
     <p style="font-size:34px;line-height:1.45;color:#eef3ff">${reply}</p>
   </div>`;

const checklist = ({ title, items, cols = 1, lead = '' }) =>
  `<h2 class="t" style="font-size:84px">${title}</h2>
   ${lead ? `<p class="p" style="margin-top:20px">${lead}</p>` : ''}
   <div style="position:absolute;left:0;right:0;top:${lead ? 300 : 230}px;bottom:0;display:grid;align-content:center;grid-template-columns:repeat(${cols},1fr);gap:${cols > 1 ? '20px 26px' : '24px'}">
     ${items
       .map(
         (it) => `<div class="card" style="display:flex;align-items:center;gap:24px;padding:${cols > 1 ? '24px 22px' : '32px 34px'}">
       <span class="ck" style="border:3px solid ${TOKENS.blueBright};width:${cols > 1 ? 46 : 56}px;height:${cols > 1 ? 46 : 56}px">${icon('check', { size: cols > 1 ? 30 : 36, color: TOKENS.blueBright, width: 3 })}</span>
       <span style="font-size:${cols > 1 ? 32 : 42}px;font-weight:700;line-height:1.22;color:#f3f6fb">${it}</span></div>`,
       )
       .join('')}
   </div>`;

const dodont = ({ title, dos, donts }) =>
  `<h2 class="t" style="font-size:84px">${title}</h2>
   <div style="position:absolute;left:0;right:0;bottom:0;display:grid;gap:24px">
     <div class="card" style="padding:30px 34px;border-color:rgba(34,197,94,.45)">
       <div class="k" style="color:${GREEN}">Faça</div>
       ${dos.map((d) => `<div class="row" style="margin-top:20px"><span class="ck" style="background:rgba(34,197,94,.18);width:48px;height:48px">${icon('check', { size: 30, color: GREEN, width: 3 })}</span><span style="font-size:36px;font-weight:650;line-height:1.3">${d}</span></div>`).join('')}
     </div>
     <div class="card" style="padding:30px 34px;border-color:rgba(255,107,91,.45)">
       <div class="k" style="color:${RED}">Evite</div>
       ${donts.map((d) => `<div class="row" style="margin-top:20px"><span class="ck" style="background:rgba(255,107,91,.18);width:48px;height:48px"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${RED}" stroke-width="3.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></span><span style="font-size:36px;font-weight:650;line-height:1.3">${d}</span></div>`).join('')}
     </div>
   </div>`;

const compare = ({ title, a, b, rows }) =>
  `<h2 class="t" style="font-size:84px">${title}</h2>
   <div class="card" style="position:absolute;left:0;right:0;bottom:0;padding:10px 0">
     <div style="display:grid;grid-template-columns:1.3fr 1fr 1fr;padding:20px 30px;font-size:30px;font-weight:800;color:${TOKENS.eyebrow};letter-spacing:.06em;text-transform:uppercase"><span></span><span style="text-align:center">${a}</span><span style="text-align:center">${b}</span></div>
     ${rows
       .map(
         ([label, x, y]) => `<div style="display:grid;grid-template-columns:1.3fr 1fr 1fr;align-items:center;padding:22px 30px;border-top:1.5px solid rgba(255,255,255,.08)">
       <span style="font-size:32px;font-weight:700;line-height:1.25">${label}</span>
       ${[x, y].map((v) => `<span style="text-align:center">${v === true ? `<span class="ck" style="display:inline-grid;background:rgba(34,197,94,.18);width:52px;height:52px">${icon('check', { size: 32, color: GREEN, width: 3 })}</span>` : v === false ? `<span style="font-size:44px;font-weight:800;color:${TOKENS.dim}">—</span>` : `<span style="font-size:28px;font-weight:700;color:${AMBER}">${v}</span>`}</span>`).join('')}
     </div>`,
       )
       .join('')}
   </div>`;

const cta = ({ title, body, word, save = true }) =>
  `<div style="position:absolute;left:0;right:0;top:20px">
     ${save ? `<div class="card" style="display:inline-flex;align-items:center;gap:20px;padding:22px 30px"><svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M6 3.5h12v17l-6-4.2-6 4.2z"/></svg><span style="font-size:32px;font-weight:700">Salve para consultar depois</span></div>` : ''}
     <h2 class="t" style="font-size:100px;margin-top:60px">${title}</h2>
     <p class="p" style="margin-top:26px">${body}</p>
   </div>
   <div style="position:absolute;left:0;right:0;bottom:10px;text-align:center">
     <p style="font-size:56px;font-weight:800;color:#c6cede">Comenta</p>
     <span style="display:inline-block;margin-top:14px;font-size:120px;font-weight:900;letter-spacing:-.02em;border-radius:36px;padding:6px 48px 16px;background:${TOKENS.blue};color:#fff;box-shadow:0 0 0 10px rgba(8,101,254,.2),0 30px 70px -20px rgba(8,101,254,1)">${word}</span>
     <p class="s" style="margin-top:26px;font-size:28px">e a gente te manda no direct</p>
   </div>`;

// Illustrations (drawn, nothing copied).
const phoneSearch = ({ query, name, rating, meta, chips = [], tag = '' }) =>
  `<div style="position:relative;width:340px;margin-left:auto;margin-top:-30px;border-radius:56px;padding:14px;background:#1a2130;box-shadow:0 50px 100px -40px rgba(8,101,254,.7),0 0 0 2px rgba(255,255,255,.08)">
    <div style="border-radius:44px;overflow:hidden;background:#f4f6fa;color:#121826;padding:40px 22px 26px">
      <div style="height:58px;border-radius:999px;background:#fff;border:1px solid #dce2ec;display:flex;align-items:center;gap:12px;padding:0 20px;font-size:22px;font-weight:600;color:#4a5568">${icon('google', { size: 26, color: '#6a7385', width: 2 })}${query}</div>
      <div style="margin-top:18px;background:#fff;border:1px solid #dce2ec;border-radius:24px;padding:20px">
        <div style="font-size:27px;font-weight:800">${name}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;font-size:21px;color:#4a5568;white-space:nowrap"><b>${rating}</b>${stars(Math.round(parseFloat(rating.replace(',', '.'))), 22, '#d5dbe5')}<span>${meta}</span></div>
        <div style="display:flex;gap:8px;margin-top:14px">${['#ffe8cc', '#fde2e2', '#dbeafe'].map((c) => `<div style="flex:1;height:84px;border-radius:14px;background:${c}"></div>`).join('')}</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px">${chips.map((c) => `<span style="padding:8px 14px;border-radius:999px;background:#eef2f8;font-size:19px;font-weight:700;color:#334">${c}</span>`).join('')}</div>
      </div>
      ${tag ? `<div style="margin-top:14px;text-align:center;font-size:21px;font-weight:800;color:#4a5568">${tag}</div>` : ''}
    </div>
  </div>`;

const sunWindow = `<svg width="904" height="330" viewBox="0 0 904 330">
  <rect x="40" y="30" width="300" height="270" rx="18" fill="#101826" stroke="#2a3446" stroke-width="6"/>
  <rect x="58" y="48" width="264" height="234" rx="8" fill="#16243d"/>
  <line x1="190" y1="48" x2="190" y2="282" stroke="#2a3446" stroke-width="6"/><line x1="58" y1="165" x2="322" y2="165" stroke="#2a3446" stroke-width="6"/>
  <circle cx="120" cy="105" r="34" fill="${AMBER}"/>
  <path d="M340 70 L640 160 L640 300 L340 280 Z" fill="rgba(255,201,77,.12)"/>
  <ellipse cx="700" cy="250" rx="150" ry="40" fill="#f4f6fa"/><ellipse cx="700" cy="242" rx="104" ry="24" fill="#e8a54b"/><circle cx="672" cy="236" r="12" fill="#e8483b"/><circle cx="716" cy="244" r="12" fill="#4dbb5c"/>
  <text x="600" y="60" fill="${AMBER}" font-family="Inter" font-weight="800" font-size="30">luz da janela</text>
</svg>`;

const angles = `<svg width="904" height="360" viewBox="0 0 904 360">
  <g transform="translate(40,20)">
    <ellipse cx="180" cy="270" rx="150" ry="36" fill="#f4f6fa"/><ellipse cx="180" cy="262" rx="104" ry="22" fill="#e8a54b"/>
    <rect x="150" y="20" width="60" height="96" rx="12" fill="#1a2130" stroke="#4d8dff" stroke-width="4"/>
    <path d="M180 120 V230" stroke="#4d8dff" stroke-width="4" stroke-dasharray="12 10"/>
    <text x="180" y="340" text-anchor="middle" fill="#f3f5f9" font-family="Inter" font-weight="800" font-size="30">De cima: prato raso</text>
  </g>
  <g transform="translate(470,20)">
    <rect x="120" y="170" width="140" height="100" rx="18" fill="#e8a54b"/><rect x="110" y="200" width="160" height="22" rx="8" fill="#6b3a1f"/><rect x="116" y="160" width="148" height="30" rx="15" fill="#f0c27a"/>
    <rect x="320" y="40" width="60" height="96" rx="12" fill="#1a2130" stroke="#4d8dff" stroke-width="4" transform="rotate(35 350 88)"/>
    <path d="M318 120 L250 190" stroke="#4d8dff" stroke-width="4" stroke-dasharray="12 10"/>
    <text x="200" y="340" text-anchor="middle" fill="#f3f5f9" font-family="Inter" font-weight="800" font-size="30">45°: lanche alto</text>
  </g>
</svg>`;

const clutter = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:26px">
  ${[
    ['Com bagunça', RED, true],
    ['Fundo limpo', GREEN, false],
  ]
    .map(
      ([l, c, mess]) => `<div class="card" style="padding:22px;border-color:${c}66"><div class="k" style="color:${c}">${l}</div>
    <svg width="400" height="230" viewBox="0 0 400 230" style="margin-top:14px"><rect width="400" height="230" rx="18" fill="${mess ? '#2a2f38' : '#efe6d8'}"/>
      ${mess ? '<rect x="20" y="20" width="60" height="110" rx="10" fill="#4a5262"/><rect x="300" y="30" width="70" height="40" rx="8" fill="#5b6475"/><circle cx="330" cy="170" r="30" fill="#6b7385"/><rect x="40" y="160" width="90" height="16" rx="8" fill="#5b6475"/>' : ''}
      <ellipse cx="200" cy="140" rx="110" ry="40" fill="#fff"/><ellipse cx="200" cy="132" rx="76" ry="24" fill="#e8a54b"/><circle cx="182" cy="128" r="9" fill="#e8483b"/><circle cx="214" cy="136" r="9" fill="#4dbb5c"/></svg></div>`,
    )
    .join('')}
</div>`;

const zoom = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:26px">
  <div class="card" style="padding:22px;border-color:${RED}66"><div class="k" style="color:${RED}">Zoom no celular</div>
    <svg width="400" height="230" viewBox="0 0 400 230" style="margin-top:14px;filter:blur(3px)"><rect width="400" height="230" rx="18" fill="#3a3024"/><ellipse cx="200" cy="130" rx="150" ry="60" fill="#d8c8b0"/><ellipse cx="200" cy="120" rx="110" ry="36" fill="#c98a3c"/></svg></div>
  <div class="card" style="padding:22px;border-color:${GREEN}66"><div class="k" style="color:${GREEN}">Chegue perto</div>
    <svg width="400" height="230" viewBox="0 0 400 230" style="margin-top:14px"><rect width="400" height="230" rx="18" fill="#efe6d8"/><ellipse cx="200" cy="130" rx="150" ry="60" fill="#fff"/><ellipse cx="200" cy="120" rx="110" ry="36" fill="#e8a54b"/><circle cx="170" cy="112" r="12" fill="#e8483b"/><circle cx="226" cy="124" r="12" fill="#4dbb5c"/></svg></div>
</div>`;

const siteVsInsta = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px">
  <div class="card" style="padding:26px;text-align:center">
    <div style="width:110px;height:110px;margin:0 auto;border-radius:30px;background:#1f2838;border:1.5px solid rgba(255,255,255,.18);display:grid;place-items:center">${icon('phone', { size: 62, color: '#c6cede', width: 1.8 })}</div>
    <div style="font-size:40px;font-weight:800;margin-top:20px">Instagram</div><div class="s" style="font-size:28px;margin-top:6px">a vitrine do dia a dia</div></div>
  <div class="card" style="padding:26px;text-align:center;border-color:rgba(77,141,255,.55)">
    <div style="width:110px;height:110px;margin:0 auto;border-radius:30px;background:${TOKENS.blue};display:grid;place-items:center">${icon('site', { size: 62, color: '#fff', width: 2 })}</div>
    <div style="font-size:40px;font-weight:800;margin-top:20px">Site</div><div class="s" style="font-size:28px;margin-top:6px">o endereço que é seu</div></div>
</div>`;


// Week 2 helpers.
const menuMock = (marks = false) =>
  `<div class="card" style="margin-left:auto;width:520px;padding:26px 30px;background:#fbf7ee;color:#2b2118;transform:rotate(2deg)">
    <div style="font-size:34px;font-weight:900;font-style:italic">Cardápio</div>
    ${['Prato do dia', 'Porção da casa', 'Sobremesa', 'Bebidas'].map((n, i) => `<div style="display:flex;justify-content:space-between;align-items:center;font-size:28px;padding:12px 0;border-top:1.5px dashed #d9cdb4"><span>${n}</span>${marks && i % 2 === 0 ? `<span style="color:${RED};font-weight:900">✕</span>` : '<span style="color:#9a8b70">…</span>'}</div>`).join('')}
  </div>`;

const badGood = (bad, good) =>
  `<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px">
    <div class="card" style="padding:24px;border-color:${RED}66"><div class="k" style="color:${RED}">Antes</div><div style="font-size:32px;font-weight:700;margin-top:12px;line-height:1.3">${bad}</div></div>
    <div class="card" style="padding:24px;border-color:${GREEN}66"><div class="k" style="color:${GREEN}">Melhor</div><div style="font-size:32px;font-weight:700;margin-top:12px;line-height:1.3">${good}</div></div>
  </div>`;

const formula = (parts, result) =>
  `<div class="card" style="padding:26px 30px;display:flex;flex-wrap:wrap;align-items:center;gap:14px;font-size:32px;font-weight:800">
    ${parts.map((p) => `<span style="padding:12px 18px;border-radius:16px;background:rgba(8,101,254,.2);color:#cfe0ff">${p}</span>`).join(`<span class="b">${parts.length === 2 ? '×' : '+'}</span>`)}
    <span class="b">=</span><span style="color:${AMBER}">${result}</span>
  </div>`;

const qr = () => `<svg width="300" height="300" viewBox="0 0 25 25" shape-rendering="crispEdges">${Array.from({ length: 625 }, (_, i) => {
  const x = i % 25, y = Math.floor(i / 25);
  const inF = (fx, fy) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7;
  const finder = inF(0, 0) || inF(18, 0) || inF(0, 18);
  let on;
  if (finder) { const lx = x % 18 % 7, ly = y % 18 % 7; on = lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4); }
  else on = (x * 31 + y * 17 + x * y * 7) % 5 < 2;
  return on ? `<rect x="${x}" y="${y}" width="1" height="1" fill="#121826"/>` : '';
}).join('')}</svg>`;

const chat = (msgs) =>
  `<div style="margin-left:auto;width:560px;border-radius:40px;padding:26px;background:#0b141a;box-shadow:0 50px 100px -40px rgba(34,197,94,.45)">
    ${msgs.map(([side, txt]) => `<div style="display:flex;justify-content:${side === 'in' ? 'flex-start' : 'flex-end'};margin:12px 0"><span style="max-width:82%;padding:16px 22px;border-radius:${side === 'in' ? '22px 22px 22px 6px' : '22px 22px 6px 22px'};background:${side === 'in' ? '#202c33' : '#005c4b'};font-size:32px;line-height:1.35;color:#e9edef">${txt}</span></div>`).join('')}
  </div>`;

const reply = (shortcut, q, a, note = 'Modelo: troque o que está entre colchetes pelos dados da sua loja') =>
  `<span class="pill">${shortcut}</span>
   <h2 class="t" style="font-size:76px;margin-top:30px">“${q}”</h2>
   <div style="position:absolute;left:0;right:0;bottom:0">
     ${chat([['in', q], ['out', a]]).replace('margin-left:auto;width:560px', 'width:100%')}
     <div class="ill" style="margin-top:14px">${note}</div>
   </div>`;

// ---------------------------------------------------------------------------------------------
// Conteúdo

const SRC_RA = 'Reclame AQUI e Abrasel, pesquisa com mais de 400 consumidores na plataforma do Reclame AQUI, agosto de 2024.';
const SRC_HARMO = 'Abrasel e Harmo, 279 mil avaliações de 3.006 bares e restaurantes associados à Abrasel no Google, jan/2023 a set/2024.';

const CARROSSEIS = [
  {
    slug: '01-antes-de-ir',
    kicker: 'O que o cliente olha',
    slides: [
      (o) => slide(cover({ title: `O que ele confere ${B('antes de ir.')}`, sub: 'O que uma pesquisa mostra sobre quem escolhe onde comer.', visual: phoneSearch({ query: 'restaurante perto', name: 'Restaurante Exemplo', rating: '4,6', meta: '', chips: ['Cardápio', 'Fotos'] }) }), { ...o, glow: 'tr' }),
      (o) => slide(stat({ number: '63%', label: 'escolhem onde comer pelas avaliações de outros clientes.', body: 'Antes da sua comida, ele prova a opinião de quem já foi.', source: SRC_RA }), o),
      (o) => slide(step({ n: 1, title: `As ${B('avaliações.')}`, body: 'Peça avaliação a todos os clientes (um QR no balcão ajuda) e responda todas, as boas e as ruins.', tag: '24% buscam', visual: `<div class="card" style="padding:28px 32px;display:flex;align-items:center;gap:24px"><span style="font-size:72px;font-weight:900">4,6</span>${stars(5, 48)}<span class="s" style="font-size:28px">exemplo</span></div>` }), { ...o, glow: 'br' }),
      (o) => slide(step({ n: 2, title: `A ${B('faixa de preço.')}`, body: 'Preço em texto no cardápio online ajuda a evitar a pergunta “quanto custa?” e a desistência por dúvida.', tag: '23% buscam', visual: `<div class="card" style="padding:26px 32px">${[['Prato do dia', 'R$ 00,00'], ['Porção', 'R$ 00,00'], ['Bebida', 'R$ 00,00']].map(([a, b], i) => `<div style="display:flex;justify-content:space-between;font-size:36px;font-weight:700;padding:12px 0;${i ? 'border-top:1.5px solid rgba(255,255,255,.08)' : ''}"><span>${a}</span><span style="color:${TOKENS.blueSoft}">${b}</span></div>`).join('')}<div class="ill" style="margin-top:8px">Exemplo de cardápio com preço em texto</div></div>` }), o),
      (o) => slide(step({ n: 3, title: `Fotos dos pratos e ${B('do ambiente.')}`, body: 'Fotos reais, com boa luz. O que chega na mesa precisa ser igual ao que aparece na foto.', tag: '18% buscam', visual: `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">${['#e8a54b', '#e86a9a', '#2fae78'].map((c) => `<div style="height:220px;border-radius:26px;background:linear-gradient(160deg,${c},#1a2130)"></div>`).join('')}</div>` }), { ...o, glow: 'bl' }),
      (o) => slide(step({ n: 4, title: `O ${B('cardápio online.')}`, body: 'Cardápio só em foto no Instagram é difícil de ler e não aparece como texto na busca. Coloque num lugar que abre com um toque.', tag: '13% buscam', visual: `<div class="card" style="padding:24px 30px;display:flex;align-items:center;gap:22px">${icon('pedido', { size: 70, color: TOKENS.blueBright, width: 1.8 })}<span style="font-size:36px;font-weight:700">seunegocio.com.br/cardapio</span></div>` }), o),
      (o) => slide(stat({ number: '40%', label: 'dizem que a resposta à crítica é fundamental pra decidir.', body: 'Responder bem, com educação, pode fazer diferença.', source: SRC_RA }), { ...o, glow: 'tr' }),
      (o) => slide(checklist({ title: `Confira o ${B('seu hoje.')}`, items: ['Avaliações respondidas, as boas e as ruins', 'Preço em texto no cardápio online', 'Fotos reais dos pratos e do ambiente', 'Cardápio que abre com um toque', 'Endereço e horário certos'] }), o),
      (o) => slide(cta({ title: `Quer deixar o seu perfil ${B('em dia?')}`, body: 'A gente te manda no direct o básico pra quem procura onde comer encontrar tudo certo.', word: 'GOOGLE' }), { ...o, glow: 'br' }),
    ],
    caption: `O que o seu cliente confere antes de sair de casa? Salve este carrossel e confira o seu 👇

Numa pesquisa da Reclame AQUI com a Abrasel (agosto de 2024, mais de 400 consumidores na plataforma do Reclame AQUI), 63% disseram que escolhem bares e restaurantes pelas avaliações de outros clientes. Na mesma pesquisa, antes de ir ao restaurante, 24% buscam as avaliações, 23% a faixa de preço, 18% as fotos dos pratos e do ambiente e 13% o cardápio online (além de endereço e horário). E 40% consideram a resposta do restaurante a uma crítica um fator fundamental pra decidir.

Ou seja: antes da comida, o cliente prova o que encontra no celular.

Comenta GOOGLE que a gente te manda no direct o básico pra deixar o seu perfil em dia pra quem procura onde comer.

#restaurante #marketingpararestaurantes #avaliacoesgoogle #cardapiodigital #growlift`,
    alt: 'Capa de carrossel: "O que ele confere antes de ir", com um celular mostrando a busca "restaurante perto de mim" (tela ilustrativa).',
  },
  {
    slug: '02-avaliacao-ruim',
    kicker: 'Modelos prontos',
    slides: [
      (o) => slide(cover({ title: `Recebeu 1 estrela. ${B('E agora?')}`, sub: '3 respostas prontas pra copiar e adaptar.', visual: `<div class="card" style="margin-left:auto;width:720px;background:#f4f6fa;color:#121826;padding:30px 34px;transform:rotate(-3deg)"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:28px">Cliente</b>${stars(1, 36, '#d5dbe5')}</div><p style="font-size:32px;line-height:1.4;margin-top:14px;color:#2b3446">“Demorou demais e a comida chegou fria.”</p></div>` }), { ...o, glow: 'tr' }),
      (o) => slide(stat({ number: '27%', label: 'das avaliações de 3.006 bares e restaurantes analisados no Google tiveram resposta.', body: 'E, pra 40% dos clientes, a resposta à crítica é fundamental pra decidir (Reclame AQUI e Abrasel, 2024).', source: SRC_HARMO }), o),
      (o) => slide(step({ n: 1, title: `Antes de ${B('responder.')}`, body: 'Respire, leia de novo e responda o quanto antes. Curto, educado e sem brigar: quem lê é o próximo cliente.', visual: `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">${['Agradeça', 'Reconheça', 'Resolva', 'Convide'].map((t, i) => `<div class="card" style="padding:22px 14px;text-align:center"><div style="font-size:52px;font-weight:900;color:${TOKENS.blueBright}">${i + 1}</div><div style="font-size:28px;font-weight:800;margin-top:6px">${t}</div></div>`).join('')}</div>` }), { ...o, glow: 'br' }),
      (o) => slide(review({ k: 5, label: 'Avaliação boa', text: 'Comida ótima e atendimento rápido. Voltaremos!', reply: 'Que alegria ler isso, [nome]! Obrigado por escolher a gente. O [prato] é feito todo dia aqui na casa. Esperamos vocês de volta!' }), o),
      (o) => slide(review({ k: 3, label: 'Avaliação média', text: 'Comida boa, mas o lugar estava cheio e barulhento.', reply: 'Obrigado pela visita e pela sinceridade, [nome]. Nos fins de semana a casa enche mesmo: de [dia] a [dia] é mais tranquilo. Fica o convite pra voltar!' }), { ...o, glow: 'bl' }),
      (o) => slide(review({ k: 1, label: 'Avaliação ruim', text: 'Demorou demais e a comida chegou fria.', reply: 'Sentimos muito, [nome]. Não é o que queremos pra você. Pode nos chamar no WhatsApp [número]? Queremos entender o que aconteceu e resolver.' }), o),
      (o) => slide(dodont({ title: `O que ${B('não fazer.')}`, dos: ['Responder todas, com o nome da pessoa', 'Levar o problema pro privado'], donts: ['Discutir ou acusar o cliente', 'A mesma resposta copiada pra todos', 'Expor dados do cliente na resposta', 'Oferecer brinde pra mudar a nota'] }), { ...o, glow: 'tr' }),
      (o) => slide(checklist({ title: `A resposta ${B('em 4 passos.')}`, items: ['Agradeça pelo comentário, pelo nome', 'Reconheça o que deu errado, sem desculpa pronta', 'Leve a solução pro WhatsApp ou telefone', 'Convide a pessoa pra voltar'] }), o),
      (o) => slide(cta({ title: `Quer mais ${B('modelos assim?')}`, body: 'A gente te manda o básico pra cuidar do seu perfil no Google.', word: 'GOOGLE' }), { ...o, glow: 'br' }),
    ],
    caption: `Recebeu uma avaliação de 1 estrela? Não apaga o app. Salve estas 3 respostas prontas 👇

Num estudo da Abrasel com a Harmo, só 27% das avaliações de 3.006 bares e restaurantes associados à Abrasel tinham resposta no Google (279 mil avaliações, de jan/2023 a set/2024). E, numa pesquisa da Reclame AQUI com a Abrasel (2024), 40% dos clientes consideram a resposta à crítica um fator fundamental pra decidir.

Quem lê a sua resposta é o próximo cliente. Agradeça, reconheça, leve a solução pro privado e convide pra voltar.

Comenta GOOGLE que a gente te manda mais dicas no direct.

#restaurante #avaliacoesgoogle #atendimentoaocliente #marketingpararestaurantes #growlift`,
    alt: 'Capa de carrossel: "Recebeu 1 estrela. E agora?", com um cartão de avaliação de exemplo com uma estrela.',
  },
  {
    slug: '03-perfil-google-checklist',
    kicker: 'Checklist',
    slides: [
      (o) => slide(cover({ title: `Seu perfil no Google tem ${B('estes 10 itens?')}`, sub: 'O checklist que a gente confere antes de qualquer coisa.', visual: phoneSearch({ query: 'pizzaria aberta', name: 'Pizzaria Exemplo', rating: '4,5', meta: '', chips: ['Rota', 'Site'] }) }), { ...o, glow: 'tr' }),
      (o) => slide(stat({ number: '4,3', label: 'é a nota média de 3.006 bares e restaurantes analisados no Google.', body: 'Nota é só uma parte. O resto do perfil é o que você controla hoje.', source: SRC_HARMO }), o),
      (o) => slide(checklist({ title: `1 a 3: ${B('quem é você.')}`, items: ['Nome igual ao da fachada, sem palavra-chave inventada', 'Categoria certa (ex.: hamburgueria, pizzaria)', 'Endereço e pino do mapa no lugar certo'] }), { ...o, glow: 'br' }),
      (o) => slide(checklist({ title: `4 a 6: ${B('quando abre.')}`, items: ['Horário de cada dia da semana', 'Horário especial de feriado (fácil de esquecer)', 'Opções certas: delivery, retirada, no local'] }), o),
      (o) => slide(checklist({ title: `7 e 8: ${B('como falar com você.')}`, items: ['Telefone ou WhatsApp que alguém atende', 'Link do site ou do cardápio que abre no celular'] }), { ...o, glow: 'bl' }),
      (o) => slide(checklist({ title: `9 e 10: ${B('o que ele vê.')}`, items: ['Fotos reais: fachada, pratos e ambiente', 'Avaliações respondidas e um QR no balcão pra pedir novas'] }), o),
      (o) => slide(checklist({ title: `Os ${B('10, num lugar só.')}`, cols: 2, items: ['Nome da fachada', 'Categoria', 'Endereço e pino', 'Horário', 'Feriados', 'Delivery e retirada', 'Telefone', 'Site ou cardápio', 'Fotos reais', 'Avaliações'] }), { ...o, glow: 'tr' }),
      (o) => slide(cta({ title: `Quer que a gente ${B('confira o seu?')}`, body: 'A verificação do perfil é feita pelo próprio Google. O resto dá pra deixar em dia.', word: 'GOOGLE' }), { ...o, glow: 'br' }),
    ],
    caption: `Seu Perfil da Empresa no Google (o antigo Google Meu Negócio) tem estes 10 itens? Salve e confira hoje 👇

1. Nome igual ao da fachada
2. Categoria certa
3. Endereço e pino do mapa no lugar
4. Horário de cada dia
5. Horário especial de feriado
6. Delivery, retirada ou no local
7. Telefone ou WhatsApp que alguém atende
8. Link do site ou do cardápio
9. Fotos reais da fachada, dos pratos e do ambiente
10. Avaliações respondidas

Num estudo com 3.006 bares e restaurantes associados à Abrasel (Abrasel e Harmo, 279 mil avaliações), a nota média no Google foi 4,3. A nota é só uma parte: o resto do perfil você controla hoje. A verificação é feita pelo Google.

Comenta GOOGLE que a gente te mostra como deixar o seu perfil em dia.

#perfildaempresanogoogle #googlemeunegocio #restaurante #marketinglocal #growlift`,
    alt: 'Capa de carrossel: "Seu perfil no Google tem estes 10 itens?", com um celular mostrando uma pizzaria de exemplo numa busca (tela ilustrativa).',
  },
  {
    slug: '04-foto-de-prato',
    kicker: 'Foto com o celular',
    slides: [
      (o) => slide(cover({ title: `O prato é lindo. ${B('A foto, nem sempre.')}`, sub: '5 ajustes pra fotografar com o celular que você já tem.', visual: `<div style="margin-left:auto;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff7ec,#efe0c8);display:grid;place-items:center;box-shadow:0 60px 120px -50px rgba(255,201,77,.6)"><svg width="420" height="420" viewBox="0 0 100 100"><ellipse cx="50" cy="56" rx="40" ry="14" fill="#fff"/><ellipse cx="50" cy="52" rx="28" ry="9" fill="#e8a54b"/><circle cx="42" cy="49" r="4" fill="#e8483b"/><circle cx="56" cy="53" r="4" fill="#4dbb5c"/><circle cx="50" cy="47" r="3" fill="#ffd27a"/></svg></div>` }), { ...o, glow: 'tr' }),
      (o) => slide(stat({ number: '18%', label: 'olham as fotos dos pratos e do ambiente antes de escolher.', body: 'Foto escura ou borrada faz o prato parecer pior do que é.', source: SRC_RA }), o),
      (o) => slide(step({ n: 1, title: `Luz da janela, ${B('sem flash.')}`, body: 'Coloque o prato perto de uma janela, com a luz vindo de lado. Flash achata a comida e deixa brilho estourado.', visual: sunWindow }), { ...o, glow: 'br' }),
      (o) => slide(step({ n: 2, title: `O ângulo ${B('certo.')}`, body: 'Prato raso, pizza e porções: de cima. Lanche, bolo e drinque: na altura de 45°.', visual: angles }), o),
      (o) => slide(step({ n: 3, title: `Fundo ${B('limpo.')}`, body: 'Tire da foto o que não é comida: guardanapo usado, garrafa, celular. Uma mesa de madeira ou uma toalha lisa já resolvem.', visual: clutter }), { ...o, glow: 'bl' }),
      (o) => slide(step({ n: 4, title: `Chegue perto, ${B('sem zoom.')}`, body: 'O zoom do celular perde nitidez. Aproxime o aparelho e limpe a lente na camiseta antes.', visual: zoom }), o),
      (o) => slide(step({ n: 5, title: `Foto ${B('de verdade.')}`, body: 'Filtro leve, nada de mudar a comida. O cliente tem que reconhecer na mesa o prato que viu na foto.', visual: `<div class="card" style="padding:26px 30px;display:flex;align-items:center;gap:22px;border-color:rgba(34,197,94,.45)"><span class="ck" style="background:rgba(34,197,94,.18)">${icon('check', { size: 36, color: GREEN, width: 3 })}</span><span style="font-size:34px;font-weight:700">O que chega na mesa = o que está na foto</span></div>` }), { ...o, glow: 'tr' }),
      (o) => slide(checklist({ title: `Antes de ${B('fotografar.')}`, items: ['Perto da janela, flash desligado', 'De cima ou a 45°, conforme o prato', 'Fundo limpo, só a comida', 'Lente limpa e sem zoom', 'Filtro leve: igual ao que chega na mesa'] }), o),
      (o) => slide(cta({ title: `Manda pra quem ${B('tira as fotos aí.')}`, body: 'E se quiser ver essas fotos num site com a cara do seu restaurante:', word: 'SITE', save: true }), { ...o, glow: 'br' }),
    ],
    caption: `O prato é lindo. A foto, nem sempre. 5 ajustes pra fotografar com o celular que você já tem 👇

1. Luz da janela, sem flash
2. De cima pra prato raso; a 45° pra lanche, bolo e drinque
3. Fundo limpo, só a comida
4. Chegue perto em vez de usar zoom (e limpe a lente)
5. Filtro leve: o que chega na mesa tem que ser igual à foto

Numa pesquisa da Reclame AQUI com a Abrasel (agosto de 2024), 18% dos consumidores disseram que olham as fotos dos pratos e do ambiente antes de escolher onde comer.

Salve e manda pra quem cuida das fotos aí. E se quiser ver essas fotos num site com a cara do seu restaurante, comenta SITE.

#fotografiadecomida #restaurante #dicasdefoto #marketingpararestaurantes #growlift`,
    alt: 'Capa de carrossel: "O prato é lindo. A foto, nem sempre.", com a ilustração de um prato sobre fundo claro.',
  },
  {
    slug: '05-site-ou-instagram',
    kicker: 'Site ou Instagram?',
    slides: [
      (o) => slide(cover({ title: `Só o Instagram ${B('basta?')}`, sub: 'O que cada um faz pelo seu restaurante, sem exagero.', visual: siteVsInsta }), { ...o, glow: 'tr' }),
      (o) => slide(step({ n: 1, title: `Não é ${B('um ou outro.')}`, body: 'O Instagram mostra o dia a dia pra quem já te segue. O site organiza tudo pra quem procura você agora, no Google ou no link que você manda.', visual: `<div class="card" style="padding:26px 30px"><p class="s" style="font-size:28px">Na pesquisa da Reclame AQUI com a Abrasel (2024), ao ver uma crítica, 59% leem opiniões de outros clientes, 14% procuram o restaurante nas redes sociais e 11% vão ao site oficial.</p></div>` }), o),
      (o) => slide(checklist({ title: `O Instagram ${B('faz bem.')}`, items: ['Mostrar pratos, bastidores e novidades', 'Reels que alcançam quem ainda não te segue', 'Conversa rápida pelo direct'] }), { ...o, glow: 'br' }),
      (o) => slide(dodont({ title: `Onde ele ${B('não alcança.')}`, dos: ['Use o Instagram pra mostrar e conversar'], donts: ['Cardápio só em foto (difícil de ler)', 'Depender só do algoritmo pra ser achado', 'Endereço e horário perdidos nos posts'] }), o),
      (o) => slide(checklist({ title: `O site ${B('faz bem.')}`, items: ['Cardápio com preço em texto', 'Endereço, mapa e horário num lugar', 'Botão de WhatsApp ou de pedido', 'Domínio com o nome do seu negócio'] }), { ...o, glow: 'bl' }),
      (o) => slide(compare({ title: `Lado a ${B('lado.')}`, a: 'Instagram', b: 'Site', rows: [['Fotos e Reels do dia a dia', true, 'algumas'], ['Cardápio com preço em texto', false, true], ['Endereço, mapa e horário fixos', 'na bio', true], ['Pedido ou WhatsApp com um toque', 'no perfil', true], ['O nome do negócio no endereço', false, true]] }), o),
      (o) => slide(checklist({ title: `O ${B('combo')} que funciona.`, items: ['Instagram pra mostrar e atrair', 'Link da bio levando pro seu site', 'Site com cardápio, horário e botão de contato', 'Perfil no Google apontando pro mesmo site'] }), { ...o, glow: 'tr' }),
      (o) => slide(cta({ title: `Quer ver como ${B('ficaria o seu?')}`, body: 'A gente te manda exemplos de site pra restaurante.', word: 'SITE' }), { ...o, glow: 'br' }),
    ],
    caption: `Só o Instagram basta pro seu restaurante? A resposta honesta: não é um ou outro 👇

O Instagram é ótimo pra mostrar pratos, bastidores e novidades, e os Reels chegam em quem ainda não te segue. O site organiza o que o cliente procura na hora de decidir: cardápio com preço em texto, endereço, horário e um botão pra falar com você, num endereço com o nome do seu negócio.

Numa pesquisa da Reclame AQUI com a Abrasel (2024), ao encontrar uma crítica, 59% leem as opiniões de outros clientes, 14% procuram o restaurante nas redes sociais e 11% vão ao site oficial. Tem gente que procura nas redes e gente que procura no site.

Salve pra lembrar do combo. E se quiser ver exemplos, comenta SITE.

#sitepararestaurante #instagramparanegocios #restaurante #marketingpararestaurantes #growlift`,
    alt: 'Capa de carrossel: "Só o Instagram basta?", com dois cartões lado a lado, Instagram e Site.',
  },
  {
    slug: '06-cardapio-erros',
    kicker: 'Cardápio online',
    slides: [
      (o) => slide(cover({ title: `6 erros no cardápio que ${B('afastam o cliente.')}`, sub: 'Confira se o seu tem algum.', visual: menuMock(true) }), { ...o, glow: 'tr' }),
      (o) => slide(stat({ number: '13%', label: 'buscam o cardápio online antes de ir ao restaurante.', body: 'E 23% buscam a faixa de preço. As duas coisas moram no mesmo lugar: o cardápio.', source: SRC_RA }), o),
      (o) => slide(step({ n: 1, title: `Só foto ${B('no Instagram.')}`, body: 'Difícil de ler, some no meio dos posts e não aparece como texto na busca. Coloque em texto, num link que abre com um toque.', visual: badGood('Foto do cardápio no feed', 'Cardápio em texto, num link') }), { ...o, glow: 'br' }),
      (o) => slide(step({ n: 2, title: `Sem ${B('preço.')}`, body: 'Quem não vê o preço fica com a dúvida. Preço em texto e atualizado, junto de cada prato.', visual: badGood('“Consulte”', 'Prato do dia · R$ 00,00') }), o),
      (o) => slide(step({ n: 3, title: `PDF ${B('pesado.')}`, body: 'Demora pra abrir no celular e obriga a dar zoom. Uma página que se ajusta à tela é mais fácil de ler.', visual: badGood('cardapio_final_v3.pdf · 18 MB', 'Página que cabe na tela') }), { ...o, glow: 'bl' }),
      (o) => slide(step({ n: 4, title: `Cardápio ${B('desatualizado.')}`, body: 'Prato que acabou ou preço antigo frustra na hora do pedido. Atualize junto com o cardápio do balcão.', visual: badGood('Preço de 2024', 'Atualizado com o balcão') }), o),
      (o) => slide(step({ n: 5, title: `Sem jeito ${B('de pedir.')}`, body: 'Viu, gostou e agora? Um botão de WhatsApp ou de pedido logo no cardápio encurta o caminho.', visual: `<div class="card" style="padding:26px 30px;display:flex;align-items:center;justify-content:center;gap:16px;background:${TOKENS.blue};border:none"><span style="font-size:40px;font-weight:800">Pedir pelo WhatsApp</span></div>` }), { ...o, glow: 'tr' }),
      (o) => slide(step({ n: 6, title: `Sem horário ${B('e endereço.')}`, body: 'O cardápio convence. Mas ele ainda precisa saber se você está aberto e como chegar.', visual: `<div class="card" style="padding:26px 30px;display:grid;gap:14px">${[['google', 'Rua Exemplo, 123'], ['calendario', 'Ter a dom · 11h às 23h']].map(([ic, t]) => `<div style="display:flex;align-items:center;gap:18px;font-size:36px;font-weight:700">${icon(ic, { size: 48, color: TOKENS.blueBright, width: 1.8 })}${t}</div>`).join('')}</div>` }), o),
      (o) => slide(checklist({ title: `O cardápio ${B('que ajuda.')}`, items: ['Em texto, num link que abre fácil', 'Com preço atualizado', 'Que cabe na tela do celular', 'Com botão de pedido ou WhatsApp', 'Com horário e endereço'] }), { ...o, glow: 'br' }),
      (o) => slide(cta({ title: `Quer ver um ${B('cardápio assim?')}`, body: 'A gente te manda exemplos de site com cardápio pra restaurante.', word: 'CARDÁPIO' }), { ...o, glow: 'bl' }),
    ],
    caption: `6 erros no cardápio online que afastam o cliente. Salve e confira o seu 👇

1. Só foto no Instagram
2. Sem preço
3. PDF pesado que não abre bem no celular
4. Preço ou prato desatualizado
5. Nenhum botão pra pedir
6. Sem horário e endereço por perto

Numa pesquisa da Reclame AQUI com a Abrasel (agosto de 2024, mais de 400 consumidores na plataforma do Reclame AQUI), antes de ir a um restaurante, 13% buscam o cardápio online e 23% buscam a faixa de preço.

Comenta CARDÁPIO que a gente te manda exemplos de site com cardápio no direct.

#cardapiodigital #restaurante #sitepararestaurante #marketingpararestaurantes #growlift`,
    alt: 'Capa de carrossel: "6 erros no cardápio que afastam o cliente", com a ilustração de um cardápio de exemplo com marcações de erro.',
  },
  {
    slug: '07-antes-de-contratar',
    kicker: 'Antes de contratar',
    slides: [
      (o) => slide(cover({ title: `7 perguntas antes de ${B('contratar um site.')}`, sub: 'Pra saber o que está incluso e não ter surpresa depois.', visual: `<div style="margin-left:auto;width:520px;display:grid;gap:16px">${['Domínio?', 'Celular?', 'Prazo?', 'Alterações?', 'Fidelidade?'].map((q, i) => `<div class="card" style="padding:18px 26px;font-size:36px;font-weight:800;transform:translateX(${i % 2 ? 40 : 0}px)"><span class="b">?</span> ${q}</div>`).join('')}</div>` }), { ...o, glow: 'tr' }),
      (o) => slide(step({ n: 1, title: `O domínio fica ${B('em nome de quem?')}`, body: 'Pergunte em nome de quem o endereço (seunegocio.com.br) é registrado e o que acontece com ele se você cancelar.' }), o),
      (o) => slide(step({ n: 2, title: `Funciona bem ${B('no celular?')}`, body: 'Muita gente vai abrir pelo celular. Peça pra ver um exemplo no seu próprio telefone.' }), { ...o, glow: 'br' }),
      (o) => slide(step({ n: 3, title: `Em quanto tempo ${B('fica no ar?')}`, body: 'Peça o prazo por escrito, e a partir de quando ele conta (em geral, de quando você manda fotos e textos).' }), o),
      (o) => slide(step({ n: 4, title: `Quantas alterações ${B('estão inclusas?')}`, body: 'Preço muda, prato novo entra. Saiba quantas mudanças por mês estão no plano e em quanto tempo ficam prontas.' }), { ...o, glow: 'bl' }),
      (o) => slide(step({ n: 5, title: `Tem fidelidade ${B('ou multa?')}`, body: 'Pergunte o tempo mínimo de contrato e quanto custa cancelar antes dele.' }), o),
      (o) => slide(step({ n: 6, title: `Quem vai ${B('te atender?')}`, body: 'Saiba com quem falar quando precisar mudar algo, por qual canal e em quanto tempo respondem.' }), { ...o, glow: 'tr' }),
      (o) => slide(step({ n: 7, title: `Cobra ${B('por pedido?')}`, body: 'Se o site recebe pedidos, pergunte se existe taxa por pedido além da mensalidade.' }), o),
      (o) => slide(checklist({ title: `As 7, ${B('pra levar.')}`, cols: 1, items: ['Domínio em nome de quem?', 'Funciona no celular?', 'Prazo por escrito', 'Alterações por mês', 'Fidelidade e multa', 'Quem atende', 'Taxa por pedido'] }), { ...o, glow: 'br' }),
      (o) => slide(cta({ title: `Quer as respostas ${B('da Growlift?')}`, body: 'As principais estão no site e no contrato. Se quiser, a gente te manda exemplos e explica como funciona.', word: 'SITE' }), { ...o, glow: 'bl' }),
    ],
    caption: `Vai contratar um site pro seu negócio? Salve estas 7 perguntas e faça pra qualquer empresa, inclusive pra gente 👇

1. O domínio fica em nome de quem?
2. Funciona bem no celular?
3. Em quanto tempo fica no ar (por escrito)?
4. Quantas alterações por mês estão inclusas?
5. Tem fidelidade ou multa?
6. Quem vai te atender, e por onde?
7. Cobra alguma taxa por pedido?

As principais respostas da Growlift estão no site e no contrato: link na bio.

Comenta SITE que a gente te manda exemplos e explica como funciona.

#criacaodesites #sitepararestaurante #negocioslocais #dicasdenegocio #growlift`,
    alt: 'Capa de carrossel: "7 perguntas antes de contratar um site", com cartões de perguntas como Domínio, Celular, Prazo, Alterações e Fidelidade.',
  },
  {
    slug: '08-faca-a-conta',
    kicker: 'Faça a conta',
    slides: [
      (o) => slide(cover({ title: `Quanto cada pedido pelo app ${B('te custa?')}`, sub: 'Uma conta de 3 linhas pra fazer com os seus números.', visual: `<div class="card" style="margin-left:auto;width:560px;padding:30px 34px;font-family:ui-monospace,Menlo,monospace;font-size:34px;line-height:1.7"><div>custo do app</div><div style="border-top:3px solid #fff;margin:6px 0"></div><div>vendas no app</div><div style="margin-top:10px;color:${AMBER}">= __% de cada pedido</div></div>` }), { ...o, glow: 'tr' }),
      (o) => slide(step({ n: 1, title: `Não é pra ${B('largar o app.')}`, body: 'O app traz cliente que ainda não te conhece. A conta serve pra saber quanto custa cada pedido e se vale ter um canal seu também.' }), o),
      (o) => slide(step({ n: 2, title: `Some o que ${B('o app cobra.')}`, body: 'Comissão, taxa de pagamento e mensalidade do plano, se houver. Está no seu contrato ou no extrato do mês.', visual: formula(['Comissão', 'Taxa de pagamento', 'Mensalidade'], 'Custo do app no mês') }), { ...o, glow: 'br' }),
      (o) => slide(step({ n: 3, title: `Veja quanto ${B('vendeu pelo app.')}`, body: 'O total de vendas pelo app no mesmo mês. Também aparece no extrato.', visual: formula(['Pedidos do mês', 'Valor de cada um'], 'Vendas pelo app') }), o),
      (o) => slide(step({ n: 4, title: `Divida ${B('um pelo outro.')}`, body: 'Custo do app dividido pelas vendas no app. O resultado é quanto fica de cada pedido.', visual: `<div class="card" style="padding:26px 30px"><div style="font-size:36px;font-weight:800">Exemplo com números redondos</div><div class="p" style="font-size:34px;margin-top:10px">Se o app custou R$ 1.000 num mês com R$ 5.000 em vendas: 1.000 ÷ 5.000 = <b style="color:${AMBER}">20% de cada pedido</b>.</div></div>` }), { ...o, glow: 'bl' }),
      (o) => slide(step({ n: 5, title: `E no ${B('seu site?')}`, body: 'No pedido pelo próprio site você paga a mensalidade do serviço e, se a sua conta cobrar, a tarifa do Pix. Na Growlift não tem comissão por pedido (plano Grow).' }), o),
      (o) => slide(checklist({ title: `Os dois ${B('juntos.')}`, items: ['App pra ser descoberto por quem não te conhece', 'Seu site pra quem já é cliente pedir direto', 'Divulgue o site no Instagram, no Google e no balcão', 'Refaça a conta todo mês'] }), { ...o, glow: 'tr' }),
      (o) => slide(checklist({ title: `A conta ${B('em 3 linhas.')}`, items: ['Custo do app no mês', 'Vendas pelo app no mês', 'Custo ÷ vendas = % de cada pedido'] }), o),
      (o) => slide(cta({ title: `Quer ver o pedido ${B('pelo seu site?')}`, body: 'A gente te mostra como funciona: Pix na hora, mensalidade fixa e sem comissão por pedido.', word: 'PEDIDO' }), { ...o, glow: 'br' }),
    ],
    caption: `Quanto cada pedido pelo app de delivery te custa de verdade? Faça a conta com os seus números 👇

1. Some o que o app cobra no mês: comissão, taxa de pagamento e mensalidade, se houver.
2. Veja quanto você vendeu pelo app no mesmo mês.
3. Divida o custo pelas vendas: é quanto fica de cada pedido.

Não é pra largar o app: ele traz cliente que ainda não te conhece. A ideia é saber o custo e ter também um canal seu, pra quem já é cliente pedir direto.

No pedido pelo próprio site (plano Grow), a Growlift não cobra comissão por pedido: você paga a mensalidade e, se a sua conta cobrar, a tarifa do Pix. Valores e condições: link na bio.

Comenta PEDIDO que a gente te mostra como funciona.

#delivery #restaurante #pedidoonline #gestaoderestaurante #growlift`,
    alt: 'Capa de carrossel: "Quanto cada pedido pelo app te custa?", com uma fração: custo do app sobre vendas no app igual à porcentagem de cada pedido.',
  },
  {
    slug: '09-dominio',
    kicker: 'Seu endereço',
    slides: [
      (o) => slide(cover({ title: `seunegocio${B('.com.br')}: por que ter o seu?`, sub: 'O endereço com o nome do seu negócio, e não um emprestado.', visual: `<div class="card" style="margin-left:auto;width:640px;padding:24px 28px;display:flex;align-items:center;gap:16px;font-size:36px;font-weight:700"><span style="width:18px;height:18px;border-radius:50%;background:${GREEN}"></span>seunegocio.com.br</div>` }), { ...o, glow: 'tr' }),
      (o) => slide(step({ n: 1, title: `Endereço ${B('emprestado.')}`, body: 'Link de rede social ou de plataforma segue as regras de outra empresa. O domínio é um endereço com o seu nome, que aponta pra onde você quiser.' }), o),
      (o) => slide(step({ n: 2, title: `Fácil de ${B('falar.')}`, body: '“Acessa seunegocio.com.br” cabe na placa, na sacola, no cardápio e no áudio do WhatsApp.' }), { ...o, glow: 'br' }),
      (o) => slide(step({ n: 3, title: `O mesmo nome ${B('da fachada.')}`, body: 'Quem viu a placa digita o nome e cai no seu site. Sem precisar adivinhar o @ certo.' }), o),
      (o) => slide(step({ n: 4, title: `Como funciona ${B('o .com.br.')}`, body: 'Os domínios .com.br são registrados no Registro.br, com CPF ou CNPJ. Pergunte sempre em nome de quem o seu fica registrado.' }), { ...o, glow: 'bl' }),
      (o) => slide(step({ n: 5, title: `Cuidado com ${B('o vencimento.')}`, body: 'O domínio é renovado de tempos em tempos. Se vencer e não for renovado, o site sai do ar e o nome pode ficar livre pra outra pessoa.' }), o),
      (o) => slide(checklist({ title: `Antes de ${B('registrar.')}`, items: ['Nome igual ao da fachada', 'Curto e fácil de falar', 'Em nome de quem? Pergunte', 'Renovação lembrada todo ano'] }), { ...o, glow: 'tr' }),
      (o) => slide(cta({ title: `Quer o seu ${B('endereço?')}`, body: 'No plano Start, o domínio com o nome do seu negócio e a hospedagem ficam por nossa conta.', word: 'SITE' }), { ...o, glow: 'br' }),
    ],
    caption: `seunegocio.com.br: por que ter um endereço com o nome do seu negócio? 👇

1. Link de rede social ou de plataforma segue as regras de outra empresa; o domínio é seu endereço.
2. É fácil de falar: cabe na placa, na sacola e no cardápio.
3. Quem viu a fachada digita o nome e encontra o seu site.

Os domínios .com.br são registrados no Registro.br, com CPF ou CNPJ. Pergunte sempre em nome de quem o seu fica, e não deixe vencer.

No plano Start, o domínio com o nome do seu negócio e a hospedagem ficam por nossa conta. Valores e condições: link na bio.

Comenta SITE que a gente te manda exemplos no direct.

#dominio #criacaodesites #negocioslocais #sitepararestaurante #growlift`,
    alt: 'Capa de carrossel: "seunegocio.com.br: por que ter o seu?", com uma barra de endereço de site.',
  },
  {
    slug: '10-pedir-avaliacao',
    kicker: 'Avaliações',
    slides: [
      (o) => slide(cover({ title: `Como pedir avaliação ${B('sem parecer chato.')}`, sub: 'A hora certa, a frase pronta e o QR no lugar certo.', visual: `<div style="margin-left:auto;width:360px;height:360px;border-radius:40px;background:#fff;padding:30px;box-shadow:0 50px 100px -40px rgba(8,101,254,.7)">${qr()}</div>` }), { ...o, glow: 'tr' }),
      (o) => slide(stat({ number: '63%', label: 'escolhem onde comer pelas avaliações de outros clientes.', body: 'Ter avaliações recentes ajuda quem ainda não te conhece a decidir.', source: SRC_RA }), o),
      (o) => slide(step({ n: 1, title: `Peça ${B('a todos.')}`, body: 'Não escolha só quem elogiou. Peça a todo cliente, do mesmo jeito: é o que as regras do Google pedem e o que é justo com quem lê.' }), { ...o, glow: 'br' }),
      (o) => slide(step({ n: 2, title: `Na ${B('hora certa.')}`, body: 'No fim da refeição, junto com a conta ou na entrega, enquanto a experiência ainda está fresca.' }), o),
      (o) => slide(step({ n: 3, title: `QR no balcão ${B('e na sacola.')}`, body: 'Um QR que abre direto a tela de avaliação no Google. Sem precisar procurar o nome.' }), { ...o, glow: 'bl' }),
      (o) => slide(step({ n: 4, title: `A ${B('frase pronta.')}`, body: 'Curta, sem pressão e sem prometer nada em troca.', visual: `<div class="card" style="padding:30px 34px;border-color:rgba(77,141,255,.55);background:rgba(8,101,254,.14)"><p style="font-size:40px;line-height:1.4;font-weight:600;color:#eef3ff">“Se puder, avalia a gente no Google? É rapidinho pelo QR e ajuda muito quem ainda não conhece a casa.”</p></div>` }), o),
      (o) => slide(dodont({ title: `Pode e ${B('não pode.')}`, dos: ['Pedir a todos os clientes', 'Agradecer quem avaliou'], donts: ['Dar desconto ou brinde em troca', 'Pressionar ou pagar pra apagar avaliação ruim', 'Avaliação de quem não foi cliente'] }), { ...o, glow: 'tr' }),
      (o) => slide(checklist({ title: `Pra ${B('começar hoje.')}`, items: ['QR de avaliação no balcão e na sacola', 'Frase pronta pra equipe', 'Pedir a todo cliente, sem brinde', 'Responder cada avaliação'] }), o),
      (o) => slide(cta({ title: `Quer o seu ${B('QR de avaliação?')}`, body: 'No plano Start, o QR de avaliação do Google pro balcão e pra sacola já está incluso.', word: 'GOOGLE' }), { ...o, glow: 'br' }),
    ],
    caption: `Como pedir avaliação no Google sem parecer chato 👇

1. Peça a todos os clientes, do mesmo jeito (não só a quem elogiou).
2. Na hora certa: fim da refeição, junto com a conta ou na entrega.
3. QR no balcão e na sacola, que abre direto a tela de avaliação.
4. Uma frase curta, sem pressão e sem nada em troca.

E o que não pode: dar desconto ou brinde em troca de avaliação, pressionar alguém a apagar uma avaliação ruim ou usar avaliação de quem não foi cliente, como amigo ou funcionário. Isso vai contra as regras do Google e pode derrubar avaliações do seu perfil.

Numa pesquisa da Reclame AQUI com a Abrasel (agosto de 2024), 63% disseram que escolhem onde comer pelas avaliações de outros clientes. No plano Start, o QR de avaliação pro balcão e pra sacola já está incluso.

Comenta GOOGLE que a gente te manda o básico do perfil no direct.

#avaliacoesgoogle #restaurante #perfildaempresanogoogle #marketingpararestaurantes #growlift`,
    alt: 'Capa de carrossel: "Como pedir avaliação sem parecer chato", com um QR code ilustrativo.',
  },
  {
    slug: '11-whatsapp-respostas',
    kicker: 'WhatsApp',
    slides: [
      (o) => slide(cover({ title: `5 perguntas que o seu WhatsApp ${B('responde todo dia.')}`, sub: 'Deixe as respostas prontas e ganhe tempo no pico.', visual: chat([['in', 'Que horas abre hoje?'], ['in', 'Tem cardápio?'], ['in', 'Entrega no meu bairro?']]) }), { ...o, glow: 'tr' }),
      (o) => slide(step({ n: 1, title: `Respostas ${B('rápidas.')}`, body: 'No WhatsApp Business dá pra salvar textos e chamar cada um com uma barra: digite / e escolha a resposta.', visual: `<div class="card" style="padding:24px 30px;font-size:34px;font-weight:700">${['/horario', '/cardapio', '/entrega', '/pix', '/endereco'].map((s) => `<span style="display:inline-block;margin:6px 10px 6px 0;padding:10px 18px;border-radius:14px;background:rgba(8,101,254,.2);color:#cfe0ff">${s}</span>`).join('')}</div>` }), o),
      (o) => slide(reply('/horario', 'Que horas abre hoje?', 'Oi! Hoje a gente abre das [hora] às [hora]. Quer o cardápio?'), { ...o, glow: 'br' }),
      (o) => slide(reply('/cardapio', 'Tem cardápio?', 'Tem sim! Está aqui, com fotos e preços: [link do cardápio]'), o),
      (o) => slide(reply('/entrega', 'Entrega no meu bairro?', 'Entregamos em [bairros]. A taxa é [valor] e o tempo médio fica entre [x] e [y] minutos.', 'Modelo: use só taxa e prazo reais, que a loja consegue cumprir'), { ...o, glow: 'bl' }),
      (o) => slide(reply('/pix', 'Aceita Pix?', 'Aceitamos! A chave é [chave Pix da loja]. Depois é só mandar o comprovante aqui.', 'Modelo: prefira chave de CNPJ, e-mail ou aleatória, não o seu CPF'), o),
      (o) => slide(reply('/endereco', 'Onde fica?', 'Estamos na [rua, número, bairro]. No mapa: [link do Google Maps].'), { ...o, glow: 'tr' }),
      (o) => slide(checklist({ title: `As 5 ${B('pra salvar.')}`, items: ['/horario: que horas abre', '/cardapio: link com preços', '/entrega: bairros, taxa e tempo', '/pix: chave e comprovante', '/endereco: rua e mapa'] }), o),
      (o) => slide(cta({ title: `Quer o link do cardápio ${B('com cara de site?')}`, body: 'A gente te manda exemplos de site pra restaurante.', word: 'SITE' }), { ...o, glow: 'br' }),
    ],
    caption: `5 perguntas que o WhatsApp do seu restaurante responde todo dia. Deixe as respostas prontas 👇

/horario: que horas abre hoje
/cardapio: o link do cardápio com preços
/entrega: bairros, taxa e tempo médio
/pix: a chave e o pedido de comprovante
/endereco: a rua e o link do mapa

No WhatsApp Business, as respostas rápidas ficam salvas e aparecem quando você digita a barra (/). Os textos do carrossel são modelos: troque o que está entre colchetes pelos seus dados (taxa e prazo de entrega só os reais; no Pix, prefira chave de CNPJ, e-mail ou aleatória).

Salve e manda pra quem atende o WhatsApp aí. Se quiser um cardápio com cara de site pra mandar no /cardapio, comenta SITE.

#whatsappbusiness #restaurante #atendimentoaocliente #delivery #growlift`,
    alt: 'Capa de carrossel: "5 perguntas que o seu WhatsApp responde todo dia", com balões de conversa perguntando horário, cardápio e entrega.',
  },
  {
    slug: '12-feriado',
    kicker: 'Feriados',
    slides: [
      (o) => slide(cover({ title: `Feriado chegando. Seu horário no Google ${B('está certo?')}`, sub: 'Os feriados nacionais até o fim do ano e como ajustar.', visual: `<div style="margin-left:auto;width:360px;border-radius:34px;overflow:hidden;background:#fff;color:#121826;text-align:center;box-shadow:0 50px 100px -40px rgba(8,101,254,.7)"><div style="background:${RED};color:#fff;font-size:34px;font-weight:800;padding:16px">NOVEMBRO</div><div style="font-size:150px;font-weight:900;line-height:1.1">20</div><div style="font-size:28px;font-weight:700;padding-bottom:22px">sexta-feira</div></div>` }), { ...o, glow: 'tr' }),
      (o) => slide(step({ n: 1, title: `Aberto no Google, ${B('fechado na porta.')}`, body: 'É a frustração mais fácil de evitar. O Google tem um campo só pra isso: o horário especial.' }), o),
      (o) => slide(checklist({ title: `Feriados ${B('nacionais.')}`, lead: 'Até o começo de 2027. Feriados da sua cidade e do seu estado contam também.', items: ['Dom 15/11 · Proclamação da República', 'Sex 20/11 · Zumbi e Consciência Negra', 'Sex 25/12 · Natal', 'Sex 01/01 · Confraternização Universal'] }), { ...o, glow: 'br' }),
      (o) => slide(step({ n: 2, title: `Como ${B('ajustar.')}`, body: 'No seu Perfil da Empresa no Google: Editar perfil, Horário, Horário especial. Escolha a data e marque fechado, ou aberto com o horário do dia.', visual: `<div class="card" style="padding:24px 30px;display:flex;justify-content:space-between;align-items:center;font-size:36px;font-weight:700"><span>Sex, 20 de nov.</span><span style="color:${AMBER}">18h às 23h</span></div><div class="ill" style="margin-top:10px">O caminho no Google pode mudar um pouco</div>` }), o),
      (o) => slide(step({ n: 3, title: `Abrir normal ${B('também conta.')}`, body: 'Se vai abrir no horário de sempre, confirme mesmo assim no horário especial. Assim o Google pode deixar de mostrar o aviso de que o horário pode ser diferente.' }), { ...o, glow: 'bl' }),
      (o) => slide(step({ n: 4, title: `Avise ${B('em todo lugar.')}`, body: 'Story no Instagram, mensagem de ausência no WhatsApp e o horário no site. Quem procura em qualquer canal vê a mesma informação.' }), o),
      (o) => slide(checklist({ title: `Pra fazer ${B('esta semana.')}`, items: ['Horário especial de 15/11 e 20/11', 'Natal e Ano-Novo já cadastrados', 'Feriados da sua cidade', 'Story e WhatsApp avisando'] }), { ...o, glow: 'tr' }),
      (o) => slide(cta({ title: `Quer o perfil ${B('em dia?')}`, body: 'A gente te manda o básico pra quem procura encontrar tudo certo.', word: 'GOOGLE' }), { ...o, glow: 'br' }),
    ],
    caption: `Feriado chegando: o seu horário no Google está certo? Salve e confira 👇

Feriados nacionais até o começo de 2027:
Dom 15/11 · Proclamação da República
Sex 20/11 · Dia Nacional de Zumbi e da Consciência Negra
Sex 25/12 · Natal
Sex 01/01 · Confraternização Universal
(Os feriados da sua cidade e do seu estado contam também.)

No Perfil da Empresa no Google: Editar perfil, Horário, Horário especial. Escolha a data e marque fechado, ou aberto com o horário do dia. Vai abrir normal? Confirme mesmo assim: o Google pode deixar de mostrar o aviso de que o horário pode ser diferente.

Comenta GOOGLE que a gente te manda o básico pra deixar o seu perfil em dia.

#feriado #perfildaempresanogoogle #restaurante #googlemeunegocio #growlift`,
    alt: 'Capa de carrossel: "Feriado chegando. Seu horário no Google está certo?", com uma folha de calendário marcando sexta-feira, 20 de novembro.',
  },
];

// ---------------------------------------------------------------------------------------------
// Render

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(CARROSSEIS.map((c) => ({ slug: c.slug, caption: c.caption, alt: c.alt, count: c.slides.length }))));
  process.exit(0);
}
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const SCALE = Number(process.env.ESCALA || 2);
const browser = await chromium.launch({ executablePath: CHROME });
const pg = await (await browser.newContext({ deviceScaleFactor: SCALE })).newPage();
let count = 0;
for (const c of CARROSSEIS) {
  if (ONLY.length && !ONLY.some((o) => c.slug.startsWith(o))) continue;
  const total = c.slides.length;
  for (let i = 0; i < total; i++) {
    const html = c.slides[i]({ n: i + 1, total, kicker: c.kicker });
    const file = `${OUT}/${c.slug}/${String(i + 1).padStart(2, '0')}.png`;
    const htmlPath = path.join(HERE, 'html', file.replace(/\.png$/, '.html'));
    await fs.mkdir(path.dirname(htmlPath), { recursive: true });
    await fs.writeFile(htmlPath, html);
    await pg.setViewportSize({ width: 1080, height: 1350 });
    await pg.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    const out = path.join(ROOT, file);
    await fs.mkdir(path.dirname(out), { recursive: true });
    await pg.screenshot({ path: out });
    count++;
  }
}
await browser.close();
console.log(`${count} slides gerados`);


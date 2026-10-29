// Growlift social: one design system for highlight covers, stories and carousels.
// Every piece is an HTML page built from the same tokens as the website (growlift/styles.css)
// and rendered to PNG by gerar.mjs. Edit the texts here and run gerar.mjs again.

export const TOKENS = {
  bg: '#06080d',
  bg2: '#0b0f17',
  surface: '#0f1520',
  line: 'rgba(255,255,255,0.10)',
  text: '#f3f5f9',
  soft: '#c6cede',
  muted: '#a9b3c7',
  dim: '#8790a6',
  blue: '#0865fe',
  blueBright: '#4d8dff',
  blueSoft: '#8db8ff',
  eyebrow: '#6ea6ff',
};

// The official mark, exactly as in the site (viewBox 50 40 530 415).
export const MARK = `<svg viewBox="50 40 530 415" xmlns="http://www.w3.org/2000/svg"><path fill="#0865FE" d="M280 48H410L190 450H55Z"/><path fill="#0865FE" fill-rule="evenodd" d="M470 130L570 450H258Z M418 220L480 380H309Z"/></svg>`;

// Line icons on a 24 grid, drawn for this set so stroke and corners match.
export const ICONS = {
  grafico: '<path d="M3 20.5h18"/><path d="M6 16.5v-4M10.5 16.5v-8M15 16.5v-6M19.5 16.5V4.5"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="m9 15 2 2 4-4"/>',
  projetos: '<rect x="2.5" y="3.5" width="19" height="13" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/><path d="M6 7.5h5.5v5.5H6z"/><path d="M14 8h4M14 10.75h4M14 13.5h2.5"/>',
  servicos: '<path d="M12 3 2.5 8 12 13l9.5-5L12 3z"/><path d="m2.5 12.5 9.5 5 9.5-5"/><path d="m2.5 16.5 9.5 5 9.5-5"/>',
  clientes: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="m17.5 4 .9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.5 2.1-.3z"/>',
  design: '<circle cx="7.5" cy="7.5" r="4"/><rect x="13" y="13" width="8" height="8" rx="1.5"/><path d="M17.5 3 21.5 10h-8z"/><path d="M5 16.5h5.5v4.5H5z"/>',
  processo: '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18.5" r="2.5"/><path d="M7.5 6h9M6.3 8.2l4.4 7.9M17.7 8.2l-4.4 7.9"/>',
  contato: '<path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.5-4.7A8.5 8.5 0 1 1 20.5 11.5z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" stroke-width="2.6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  site: '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M2.5 8.5h19M6 6.25h.01M8.5 6.25h.01"/>',
  google: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  pedido: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  lista: '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.5L3.5 20.5 5 15.8a8.5 8.5 0 1 1 16-4.3z"/><path d="M8.5 11.5l2.3 2.3 4.7-4.6"/>',
  phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
  type: '<path d="M4 7V5h16v2M12 5v14M9 19h6"/>',
  motion: '<path d="M3 12c3-6 6-6 9 0s6 6 9 0"/><path d="M3 6.5h4M17 17.5h4"/>',
};

export const icon = (name, { size = 64, color = TOKENS.blueBright, width = 1.6 } = {}) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// Inter served from the site's own files, so every render uses exactly the site's font.
const FONTS = new URL('../../growlift/fonts/', import.meta.url).href;
const FONT = `<style>@font-face{font-family:Inter;font-weight:100 900;src:url(${FONTS}inter-latin-wght-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}@font-face{font-family:Inter;font-weight:100 900;src:url(${FONTS}inter-latin-ext-wght-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+20A0-20AB,U+20AD-20C0,U+2C60-2C7F,U+A720-A7FF}</style>`;

const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:var(--w);height:var(--h);overflow:hidden}
body{position:relative;font-family:Inter,system-ui,sans-serif;color:${TOKENS.text};background:${TOKENS.bg};-webkit-font-smoothing:antialiased}
.glow{position:absolute;border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,rgba(8,101,254,.42),rgba(8,101,254,0) 70%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:72px 72px;-webkit-mask-image:radial-gradient(ellipse at 50% 45%,#000 25%,transparent 72%)}
.eyebrow{font-size:28px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${TOKENS.eyebrow}}
.h1{font-weight:800;letter-spacing:-.035em;line-height:.98}
.blue{color:${TOKENS.blueBright}}
.lead{color:${TOKENS.soft};line-height:1.4}
.muted{color:${TOKENS.muted}}
.chip{display:inline-flex;align-items:center;gap:12px;border:1px solid rgba(141,184,255,.35);color:${TOKENS.blueSoft};border-radius:999px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
.btn{display:inline-flex;align-items:center;justify-content:center;background:${TOKENS.blue};color:#fff;border-radius:999px;font-weight:700;box-shadow:0 24px 50px -20px rgba(8,101,254,.9)}
.card{background:${TOKENS.surface};border:1px solid ${TOKENS.line};border-radius:32px}
.brand{display:flex;align-items:center;gap:16px;font-weight:700;letter-spacing:.12em}
.brand svg{height:1.05em;width:auto}
.browser{border-radius:26px;overflow:hidden;background:${TOKENS.surface};border:1px solid ${TOKENS.line};box-shadow:0 -30px 90px -30px rgba(8,101,254,.55),0 40px 80px -40px rgba(0,0,0,.9)}
.browser .bar{display:flex;align-items:center;gap:10px;height:54px;padding:0 22px;border-bottom:1px solid rgba(255,255,255,.08)}
.browser .bar i{width:14px;height:14px;border-radius:50%;background:#2a3344}
.browser .bar span{margin-left:14px;font-size:20px;color:#7d879c;background:#161d2a;padding:6px 18px;border-radius:999px}
.browser img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top}
.phone{border-radius:64px;padding:16px;background:#1a2130;box-shadow:0 50px 90px -40px rgba(0,0,0,.95),0 0 0 2px rgba(255,255,255,.06)}
.phone img{display:block;width:100%;border-radius:50px}
.tag-conceito{display:inline-block;font-size:22px;font-weight:600;letter-spacing:.06em;color:${TOKENS.dim};border:1px dashed rgba(255,255,255,.22);border-radius:999px;padding:8px 18px}
`;

export function page(w, h, body, css = '') {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">${FONT}<style>:root{--w:${w}px;--h:${h}px}${BASE_CSS}${css}</style></head><body>${body}</body></html>`;
}

const brandRow = (size = 30) => `<div class="brand" style="font-size:${size}px">${MARK}GROWLIFT</div>`;

// ---------------------------------------------------------------------------------------
// Highlight covers (1080x1920; Instagram shows the centre as a circle).
export function cover(name, variant) {
  if (variant === 'A') {
    return page(1080, 1920, `
      <div class="glow" style="width:1100px;height:1100px;left:-10px;top:410px;opacity:.55"></div>
      <div style="position:absolute;left:50%;top:50%;width:860px;height:860px;margin:-430px 0 0 -430px;border-radius:50%;border:3px solid rgba(77,141,255,.24)"></div>
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)">${icon(name, { size: 500, width: 1.05 })}</div>`,
      `body{background:radial-gradient(circle at 50% 50%,#0c1630 0%,${TOKENS.bg} 62%)}`);
  }
  // B: technological; white icon, blue node accents, the site's grid.
  return page(1080, 1920, `
    <div class="grid"></div>
    <div class="glow" style="width:900px;height:900px;left:90px;top:510px;opacity:.6"></div>
    <div style="position:absolute;left:50%;top:50%;width:700px;height:700px;margin:-350px 0 0 -350px;border-radius:60px;transform:rotate(45deg);border:2px solid rgba(255,255,255,.08)"></div>
    <div style="position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;transform:translate(0,-495px);border-radius:50%;background:${TOKENS.blueBright};box-shadow:0 0 24px ${TOKENS.blueBright}"></div>
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)">${icon(name, { size: 480, color: '#ffffff', width: 1.1 })}</div>`);
}

// ---------------------------------------------------------------------------------------
// Stories (1080x1920). Safe area: content between y=250 and y=1560.
function storyShell(inner, { glow = 'top', footer = true } = {}) {
  const glowPos = glow === 'top' ? 'left:-260px;top:-380px' : 'right:-320px;bottom:-200px';
  return page(1080, 1920, `
    <div class="glow" style="width:1300px;height:1300px;${glowPos};opacity:.5"></div>
    <div style="position:absolute;left:96px;right:96px;top:250px;bottom:330px;display:flex;flex-direction:column">${inner}</div>
    ${footer ? `<div style="position:absolute;left:96px;right:96px;bottom:250px;display:flex;justify-content:space-between;align-items:center;color:${TOKENS.dim};font-size:26px">${brandRow(26)}<span>growlift.com.br</span></div>` : ''}`);
}

export const storyTitle = ({ eyebrow, title, lead, iconName }) =>
  storyShell(`
    <div style="margin-top:auto">
      ${iconName ? `<div style="margin-bottom:56px">${icon(iconName, { size: 120, width: 1.4 })}</div>` : ''}
      <p class="eyebrow">${eyebrow}</p>
      <h1 class="h1" style="font-size:118px;margin-top:28px">${title}</h1>
      ${lead ? `<p class="lead" style="font-size:42px;margin-top:40px;max-width:820px">${lead}</p>` : ''}
    </div>`);

export const storyProject = ({ index, name, segment, img, features, note = 'Projeto conceito · nome fictício' }) =>
  storyShell(`
    <div style="display:flex;justify-content:space-between;align-items:center">
      <p class="eyebrow">${segment}</p><span class="muted" style="font-size:28px;font-weight:600">${index}</span>
    </div>
    <h1 class="h1" style="font-size:96px;margin-top:22px">${name}</h1>
    <div style="margin-top:22px"><span class="tag-conceito">${note}</span></div>
    <div class="browser" style="margin:auto -40px 0"><div class="bar"><i></i><i></i><i></i><span>seunegocio.com.br</span></div><img src="${img}"></div>
    <ul style="list-style:none;margin-top:auto;display:grid;gap:22px">
      ${features.map((f) => `<li style="display:flex;gap:20px;align-items:center;font-size:38px;color:${TOKENS.soft}">${icon('check', { size: 40, width: 2.2 })}${f}</li>`).join('')}
    </ul>`, { glow: 'bottom' });

export const storyService = ({ index, iconName, title, lead, items }) =>
  storyShell(`
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="width:132px;height:132px;border-radius:36px;display:grid;place-items:center;background:rgba(8,101,254,.14);border:1px solid rgba(77,141,255,.35)">${icon(iconName, { size: 72, width: 1.6 })}</div>
      <span class="muted" style="font-size:28px;font-weight:600">${index}</span>
    </div>
    <div style="margin:auto 0">
    <h1 class="h1" style="font-size:104px">${title}</h1>
    <p class="lead" style="font-size:42px;margin-top:36px">${lead}</p>
    <ul style="list-style:none;margin-top:72px;display:grid;gap:26px">
      ${items.map((f) => `<li class="card" style="display:flex;gap:22px;align-items:center;font-size:36px;padding:30px 34px;color:${TOKENS.soft}">${icon('check', { size: 40, width: 2.2 })}${f}</li>`).join('')}
    </ul>
    </div>`);

export const storyStep = ({ n, total, title, lead, detail }) =>
  storyShell(`
    <p class="eyebrow">Como funciona · ${n} de ${total}</p>
    <div style="margin:auto 0">
    <div class="h1" style="font-size:420px;line-height:.8;color:transparent;-webkit-text-stroke:3px ${TOKENS.blueBright}">${n}</div>
    <h1 class="h1" style="font-size:104px;margin-top:70px">${title}</h1>
    <p class="lead" style="font-size:42px;margin-top:36px">${lead}</p>
    ${detail ? `<p class="card" style="margin-top:60px;font-size:34px;padding:32px 36px;color:${TOKENS.muted}">${detail}</p>` : ''}
    </div>
    <div style="display:flex;gap:12px">${Array.from({ length: total }, (_, i) => `<i style="height:10px;border-radius:9px;background:${i + 1 === n ? TOKENS.blueBright : 'rgba(255,255,255,.18)'};width:${i + 1 === n ? 70 : 28}px"></i>`).join('')}</div>`);

export const storyVisual = ({ eyebrow, title, lead, visual }) =>
  storyShell(`
    <p class="eyebrow">${eyebrow}</p>
    <h1 class="h1" style="font-size:96px;margin-top:24px">${title}</h1>
    ${lead ? `<p class="lead" style="font-size:40px;margin-top:30px">${lead}</p>` : ''}
    <div style="margin-top:auto">${visual}</div>`, { glow: 'bottom' });

export const storyContact = ({ title, lead, rows, cta }) =>
  storyShell(`
    <div>${icon('contato', { size: 120, width: 1.4 })}</div>
    <h1 class="h1" style="font-size:110px;margin-top:56px">${title}</h1>
    <p class="lead" style="font-size:42px;margin-top:36px">${lead}</p>
    <div style="margin-top:auto;display:grid;gap:22px">
      ${rows.map(([label, value]) => `<div class="card" style="padding:30px 36px"><p style="font-size:26px;letter-spacing:.12em;text-transform:uppercase;color:${TOKENS.dim};font-weight:600">${label}</p><p style="font-size:44px;font-weight:700;margin-top:8px">${value}</p></div>`).join('')}
    </div>
    ${cta ? `<div class="btn" style="margin-top:40px;height:120px;font-size:40px">${cta}</div>` : ''}`);

// ---------------------------------------------------------------------------------------
// Carousel slides (1080x1350).
function slideShell(inner, { n, total, glow = 'top', footer = true } = {}) {
  const glowPos = glow === 'top' ? 'left:-300px;top:-460px' : glow === 'right' ? 'right:-420px;top:200px' : 'left:-200px;bottom:-560px';
  return page(1080, 1350, `
    <div class="glow" style="width:1250px;height:1250px;${glowPos};opacity:.5"></div>
    <div style="position:absolute;left:88px;right:88px;top:96px;bottom:150px;display:flex;flex-direction:column">${inner}</div>
    ${footer ? `<div style="position:absolute;left:88px;right:88px;bottom:72px;display:flex;justify-content:space-between;align-items:center;color:${TOKENS.dim};font-size:24px">${brandRow(24)}<span>${n ? `${n}/${total}` : ''}</span></div>` : ''}`);
}

export const slideCover = ({ kicker, title, sub, n, total, art = '' }) =>
  slideShell(`
    ${art}
    <div style="position:relative;margin-top:auto">
      <p class="eyebrow">${kicker}</p>
      <h1 class="h1" style="font-size:118px;margin-top:28px">${title}</h1>
      ${sub ? `<p class="lead" style="font-size:38px;margin-top:34px;max-width:820px">${sub}</p>` : ''}
      <p style="margin-top:48px;font-size:28px;color:${TOKENS.blueSoft};font-weight:600">Arraste para o lado →</p>
    </div>`, { n, total });

export const slideText = ({ eyebrow, title, body, n, total, extra = '', glow }) =>
  slideShell(`
    <p class="eyebrow">${eyebrow}</p>
    <h2 class="h1" style="font-size:84px;margin-top:26px">${title}</h2>
    ${body ? `<p class="lead" style="font-size:38px;margin-top:34px">${body}</p>` : ''}
    ${extra}`, { n, total, glow });

export const slideList = ({ eyebrow, title, items, n, total, glow }) =>
  slideText({
    eyebrow, title, n, total, glow,
    extra: `<ul style="list-style:none;margin-top:auto;display:grid;gap:20px">${items
      .map(([ic, t, d]) => `<li class="card" style="display:flex;gap:26px;align-items:center;padding:28px 32px"><div style="flex:none;width:84px;height:84px;border-radius:24px;display:grid;place-items:center;background:rgba(8,101,254,.14);border:1px solid rgba(77,141,255,.3)">${icon(ic, { size: 46, width: 1.7 })}</div><div><p style="font-size:36px;font-weight:700">${t}</p>${d ? `<p style="font-size:28px;color:${TOKENS.muted};margin-top:4px">${d}</p>` : ''}</div></li>`)
      .join('')}</ul>`,
  });

export const slideProject = ({ name, segment, img, features, n, total }) =>
  slideShell(`
    <div style="display:flex;justify-content:space-between;align-items:baseline"><p class="eyebrow">${segment}</p><span class="tag-conceito">Projeto conceito</span></div>
    <h2 class="h1" style="font-size:88px;margin-top:22px">${name}</h2>
    <div class="browser" style="margin-top:44px"><div class="bar"><i></i><i></i><i></i><span>seunegocio.com.br</span></div><img src="${img}"></div>
    <div style="margin-top:auto;display:flex;flex-wrap:wrap;gap:14px">${features.map((f) => `<span class="chip" style="font-size:24px;padding:14px 22px">${f}</span>`).join('')}</div>`, { n, total, glow: 'right' });

export const slideCta = ({ title, body, button, url, n, total }) =>
  slideShell(`
    <div style="margin-top:auto">
      ${icon('contato', { size: 110, width: 1.4 })}
      <h2 class="h1" style="font-size:96px;margin-top:44px">${title}</h2>
      <p class="lead" style="font-size:38px;margin-top:30px">${body}</p>
      <div class="btn" style="margin-top:56px;height:112px;padding:0 56px;font-size:38px">${button}</div>
      <p style="margin-top:28px;font-size:30px;color:${TOKENS.muted}">${url}</p>
    </div>`, { n, total, glow: 'bottom' });

// Profile photo: the mark alone, centred, legible as a 110px circle.
export const profilePhoto = () =>
  page(1080, 1080, `
    <div class="glow" style="width:1200px;height:1200px;left:-60px;top:-40px;opacity:.55"></div>
    <div style="position:absolute;left:50%;top:50%;width:560px;transform:translate(-50%,-52%)">${MARK.replace('<svg ', '<svg width="560" ')}</div>`,
    `body{background:radial-gradient(circle at 50% 46%,#0f1d3d 0%,${TOKENS.bg} 66%)}`);

// ---------------------------------------------------------------------------------------
// Stories, second generation (Projetos first). Every frame is filled edge to edge: the glass
// mark or the project's own colours behind, nothing left as a flat black void. Type is larger
// and brighter than the first set: titles 112 px and up, text 44 px and up, near-white.
const V2_CSS = `
.t-title{font-weight:800;letter-spacing:-.04em;line-height:.98;color:#fff}
.t-lead{font-size:46px;line-height:1.32;color:#dfe5f0;font-weight:450}
.pill{display:inline-flex;align-items:center;gap:14px;height:64px;padding:0 28px;border-radius:999px;font-size:28px;font-weight:600;letter-spacing:.02em;color:#e8eefa;background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.18);backdrop-filter:blur(18px)}
.pill.blue{color:#cfe0ff;background:rgba(8,101,254,.22);border-color:rgba(77,141,255,.55)}
.foot{position:absolute;left:84px;right:84px;top:1628px;display:flex;justify-content:space-between;align-items:center;font-size:28px;color:#aeb8cc}
.foot .brand{color:#e8eefa;font-size:28px}
.win{border-radius:30px;overflow:hidden;background:#0f1520;border:1.5px solid rgba(255,255,255,.14);box-shadow:0 60px 120px -40px rgba(0,0,0,.95),0 0 0 1px rgba(0,0,0,.4)}
.win .bar{display:flex;align-items:center;gap:12px;height:66px;padding:0 26px;background:#121a27;border-bottom:1px solid rgba(255,255,255,.08)}
.win .bar i{width:16px;height:16px;border-radius:50%;background:#2c3648}
.win .bar span{margin-left:16px;font-size:24px;color:#9aa6bd;background:#1a2333;padding:8px 22px;border-radius:999px}
.win img{display:block;width:100%}
.feat{display:flex;align-items:center;gap:24px;font-size:44px;font-weight:600;color:#f3f6fb;line-height:1.2}
.feat b{flex:none;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:${TOKENS.blue};box-shadow:0 10px 30px -8px rgba(8,101,254,.9)}
`;

const foot = () => `<div class="foot">${brandRow(28)}<span>growlift.com.br</span></div>`;
const check = () => `<b>${icon('check', { size: 34, color: '#fff', width: 2.6 })}</b>`;

/** Opening story: the glass mark from the site fills the lower half, the headline sits above it. */
export const storyOpenV2 = ({ title, lead, plate }) =>
  page(1080, 1920, `
    <img src="${plate}" style="position:absolute;left:0;top:150px;width:1080px;height:1910px;object-fit:cover;object-position:50% 100%">
    <div style="position:absolute;inset:0 0 auto 0;height:420px;background:linear-gradient(180deg,#02050f 35%,rgba(2,5,15,0))"></div>
    <div style="position:absolute;left:84px;right:84px;top:250px">
      ${brandRow(30)}
      <h1 class="t-title" style="font-size:112px;margin-top:64px">${title}</h1>
      <p class="t-lead" style="margin-top:34px;max-width:900px">${lead}</p>
    </div>`,
    `body{background:#02050f}${V2_CSS}`);

/** One concept project: its own colours fill the frame, the site sits big in a browser window. */
export const storyShowcaseV2 = ({ index, segment, name, img, features, note = 'Projeto conceito · nome fictício' }) =>
  page(1080, 1920, `
    <img src="${img}" style="position:absolute;left:-200px;top:-200px;width:1480px;height:2320px;object-fit:cover;filter:blur(90px) saturate(1.35);opacity:.75">
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,8,13,.55) 0%,rgba(6,8,13,.35) 40%,rgba(6,8,13,.86) 70%,rgba(6,8,13,.94) 100%)"></div>
    <div style="position:absolute;left:84px;right:84px;top:250px;display:flex;justify-content:space-between;align-items:center">
      <span class="pill">${segment}</span><span style="font-size:32px;font-weight:700;color:#e8eefa">${index}</span>
    </div>
    <h1 class="t-title fit" style="position:absolute;left:84px;right:84px;top:360px;font-size:120px;white-space:nowrap">${name}</h1>
    <script>for (const el of document.querySelectorAll('.fit')) { let s = 120; while (el.scrollWidth > el.clientWidth && s > 60) el.style.fontSize = (s -= 2) + 'px'; }</script>
    <div style="position:absolute;left:84px;top:516px"><span class="pill blue">${note}</span></div>
    <div class="win" style="position:absolute;left:40px;right:40px;top:640px"><div class="bar"><i></i><i></i><i></i><span>seunegocio.com.br</span></div><img src="${img}"></div>
    <ul style="position:absolute;left:84px;right:84px;top:1352px;list-style:none;display:grid;gap:30px">
      ${features.map((f) => `<li class="feat">${check()}${f}</li>`).join('')}
    </ul>
    ${foot()}`,
    `body{background:${TOKENS.bg}}${V2_CSS}`);


const CHEVRON = '<svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
const WHATS = '<svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.86 9.86 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/></svg>';

/**
 * Where the Instagram link sticker goes. Instagram cannot lay a sticker over text in the picture,
 * so the place is left empty on purpose: a short line pointing down and a pool of blue light, with
 * no words inside, sized for the sticker. When posting, the sticker sits in the light.
 */
export const linkSlot = (hint, top, { whatsapp = false } = {}) => `
    <div style="position:absolute;left:0;right:0;top:${top}px;text-align:center">
      <p style="display:inline-flex;align-items:center;gap:16px;font-size:36px;font-weight:600;color:#e3ebfb">${whatsapp ? `<span style="width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:#25d366;color:#fff">${WHATS.replace(/44/g, '36')}</span>` : ''}${hint}</p>
      <div style="margin:6px auto 0;width:54px;color:${TOKENS.blueBright}">${CHEVRON}</div>
      <div style="position:relative;margin:4px auto 0;width:860px;height:150px">
        <div style="position:absolute;inset:-70px -60px;border-radius:50%;background:radial-gradient(closest-side,rgba(8,101,254,.5),rgba(8,101,254,.16) 55%,rgba(8,101,254,0))"></div>
      </div>
    </div>`;

/** Our own site, on the computer and on the phone at once, with the link button below. */
export const storySiteV2 = ({ chip, title, lead, desktop, mobile, link }) =>
  page(1080, 1920, `
    <img src="${desktop}" style="position:absolute;left:-200px;top:-200px;width:1480px;height:2320px;object-fit:cover;filter:blur(90px) saturate(1.4);opacity:.8">
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,5,15,.6) 0%,rgba(2,5,15,.35) 40%,rgba(2,5,15,.88) 68%,#02050f 100%)"></div>
    <div style="position:absolute;left:84px;right:84px;top:250px">
      <span class="pill blue">${chip}</span>
      <h1 class="t-title" style="font-size:120px;margin-top:36px">${title}</h1>
    </div>
    <div class="win" style="position:absolute;left:40px;width:840px;top:640px"><div class="bar"><i></i><i></i><i></i><span>growlift.com.br</span></div><img src="${desktop}"></div>
    <div style="position:absolute;right:40px;top:860px;width:310px;padding:12px;border-radius:52px;background:#151c29;box-shadow:0 0 0 2px rgba(255,255,255,.12),0 50px 100px -30px rgba(0,0,0,.95),0 0 80px -20px rgba(8,101,254,.6)">
      <img src="${mobile}" style="display:block;width:100%;height:500px;object-fit:cover;object-position:top;border-radius:42px">
    </div>
    <p class="t-lead" style="position:absolute;left:84px;width:640px;top:1280px;font-size:40px;font-weight:600;color:#fff">${lead}</p>
    ${link ? linkSlot(link.hint, 1400) : ''}`,
    `body{background:#02050f}${V2_CSS}`);

/** The free diagnosis: three short steps, the glass mark behind, the button to the form. */
export const storyDiagnosisV2 = ({ chip, title, lead, steps, plate, link }) =>
  page(1080, 1920, `
    <img src="${plate}" style="position:absolute;left:-60px;top:380px;width:1200px;height:2122px;object-fit:cover;opacity:.5">
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,#02050f 18%,rgba(2,5,15,.55) 50%,rgba(2,5,15,.85) 72%,#02050f 100%)"></div>
    <div style="position:absolute;left:84px;right:84px;top:250px">
      <span class="pill blue">${chip}</span>
      <h1 class="t-title" style="font-size:120px;margin-top:36px">${title}</h1>
      <p class="t-lead" style="margin-top:26px">${lead}</p>
    </div>
    <ol style="position:absolute;left:84px;right:84px;top:820px;list-style:none;display:grid;gap:22px">
      ${steps.map(([t, d], i) => `<li style="display:flex;gap:28px;align-items:center;padding:30px 34px;border-radius:34px;background:rgba(15,21,32,.72);border:1.5px solid rgba(255,255,255,.12);backdrop-filter:blur(20px)">
        <span style="flex:none;width:84px;height:84px;border-radius:26px;display:grid;place-items:center;font-size:44px;font-weight:800;color:#fff;background:${TOKENS.blue};box-shadow:0 14px 34px -10px rgba(8,101,254,.9)">${i + 1}</span>
        <span><span style="display:block;font-size:42px;font-weight:700;color:#fff;letter-spacing:-.01em">${t}</span><span style="display:block;font-size:32px;color:#c6cede;margin-top:4px">${d}</span></span>
      </li>`).join('')}
    </ol>
    ${linkSlot(link.hint, 1400)}`,
    `body{background:#02050f}${V2_CSS}`);

/** WhatsApp contact without photos: the glass mark centre stage, the number large, the button below. */
export const storyWhatsV2 = ({ title, number, note, plate, link }) =>
  page(1080, 1920, `
    <img src="${plate}" style="position:absolute;left:0;top:-200px;width:1080px;height:1910px;object-fit:cover">
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,#02050f 12%,rgba(2,5,15,.2) 32%,rgba(2,5,15,0) 50%,rgba(2,5,15,.78) 66%,#02050f 84%)"></div>
    <div style="position:absolute;left:84px;right:84px;top:250px">
      <h1 class="t-title" style="font-size:120px">${title}</h1>
    </div>
    <div style="position:absolute;left:84px;right:84px;top:1190px;text-align:center">
      <p style="font-size:76px;font-weight:800;letter-spacing:-.02em;color:#fff">${number}</p>
      <p style="font-size:34px;color:#c6cede;margin-top:6px">${note}</p>
    </div>
    ${linkSlot(link.hint, 1400, { whatsapp: true })}`,
    `body{background:#02050f}${V2_CSS}`);

/**
 * One service: which plans include it, a large picture of the service at work (a real capture or a
 * labelled demonstration), and three short points. `bg` is the capture whose colours fill the frame.
 */
export const storyServiceV2 = ({ index, plan, title, lead, visual, items, bg }) =>
  page(1080, 1920, `
    <img src="${bg}" style="position:absolute;left:-200px;top:-200px;width:1480px;height:2320px;object-fit:cover;filter:blur(90px) saturate(1.35);opacity:.7">
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,8,13,.6) 0%,rgba(6,8,13,.4) 40%,rgba(6,8,13,.88) 70%,rgba(6,8,13,.96) 100%)"></div>
    <div style="position:absolute;left:84px;right:84px;top:250px;display:flex;justify-content:space-between;align-items:center">
      <span class="pill blue">${plan}</span><span style="font-size:32px;font-weight:700;color:#e8eefa">${index}</span>
    </div>
    <h1 class="t-title fit" style="position:absolute;left:84px;right:84px;top:360px;font-size:120px;white-space:nowrap">${title}</h1>
    <script>for (const el of document.querySelectorAll('.fit')) { let s = 120; while (el.scrollWidth > el.clientWidth && s > 60) el.style.fontSize = (s -= 2) + 'px'; }</script>
    <p class="t-lead" style="position:absolute;left:84px;right:84px;top:500px;font-size:42px">${lead}</p>
    <div style="position:absolute;left:40px;right:40px;top:640px;height:680px">${visual}</div>
    <ul style="position:absolute;left:84px;right:84px;top:1360px;list-style:none;display:grid;gap:28px">
      ${items.map((f) => `<li class="feat" style="font-size:40px">${check()}${f}</li>`).join('')}
    </ul>
    ${foot()}`,
    `body{background:${TOKENS.bg}}${V2_CSS}`);

/** The three plans side by side in words, with the button to the plans on the site. */
export const storyPlansV2 = ({ title, lead, plans, plate, link }) =>
  page(1080, 1920, `
    <img src="${plate}" style="position:absolute;left:-60px;top:420px;width:1200px;height:2122px;object-fit:cover;opacity:.45">
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,#02050f 18%,rgba(2,5,15,.55) 50%,rgba(2,5,15,.85) 72%,#02050f 100%)"></div>
    <div style="position:absolute;left:84px;right:84px;top:250px">
      <h1 class="t-title" style="font-size:120px">${title}</h1>
      <p class="t-lead" style="margin-top:26px">${lead}</p>
    </div>
    <ol style="position:absolute;left:84px;right:84px;top:720px;list-style:none;display:grid;gap:22px">
      ${plans.map(([name, tag, desc], i) => `<li style="padding:32px 36px;border-radius:34px;background:${i === 1 ? 'rgba(8,101,254,.22)' : 'rgba(15,21,32,.75)'};border:1.5px solid ${i === 1 ? 'rgba(77,141,255,.7)' : 'rgba(255,255,255,.12)'};backdrop-filter:blur(20px)">
        <p style="display:flex;align-items:baseline;gap:18px"><span style="font-size:52px;font-weight:800;letter-spacing:-.02em;color:#fff">${name}</span><span style="font-size:34px;font-weight:600;color:${TOKENS.blueSoft}">${tag}</span></p>
        <p style="font-size:32px;color:#c6cede;margin-top:8px;line-height:1.3">${desc}</p>
      </li>`).join('')}
    </ol>
    ${linkSlot(link.hint, 1400)}`,
    `body{background:#02050f}${V2_CSS}`);

/**
 * Highlight cover, second generation: square, so it drops straight into Instagram's circle. A disc of
 * the brand blue fills the frame and a thick white icon sits in it, readable at the profile's ~64 pt.
 * No words: Instagram prints the highlight's name under the circle.
 */
export const coverV2 = (name) =>
  page(1080, 1080, `
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 34% 26%,#4d8dff 0%,#0865fe 40%,#0544b8 76%,#04307f 100%)"></div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 34% at 40% 12%,rgba(255,255,255,.32),rgba(255,255,255,0) 70%)"></div>
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)">${icon(name, { size: 470, color: '#ffffff', width: 1.9 })}</div>`,
    `body{background:#0865fe}`);

// ---------------------------------------------------------------------------------------
// Carousel slides, second generation (1080×1350). Same rules as the new stories: frames filled
// edge to edge, titles 88 px and up, text 38 px and up, near-white. Feed posts take no link
// sticker, so the last slide sends people to the link in the bio.
function slideV2(inner, { n, total, bg = '', plate = '', plateTop = -620 } = {}) {
  return page(1080, 1350, `
    ${plate ? `<img src="${plate}" style="position:absolute;left:0;top:${plateTop}px;width:1080px;height:1910px;object-fit:cover">` : ''}
    ${bg ? `<img src="${bg}" style="position:absolute;left:-200px;top:-200px;width:1480px;height:1750px;object-fit:cover;filter:blur(90px) saturate(1.35);opacity:.7">` : ''}
    ${!plate && !bg ? '<div class="glow" style="width:1300px;height:1300px;left:-420px;top:-560px;opacity:.55"></div><div class="glow" style="width:1000px;height:1000px;right:-520px;bottom:-520px;opacity:.35"></div>' : ''}
    <div style="position:absolute;inset:0;background:${plate ? 'linear-gradient(180deg,rgba(2,5,15,.15) 0%,rgba(2,5,15,0) 35%,rgba(2,5,15,.82) 58%,#02050f 80%)' : bg ? 'linear-gradient(180deg,rgba(6,8,13,.6),rgba(6,8,13,.88) 60%,rgba(6,8,13,.96))' : 'transparent'}"></div>
    <div style="position:absolute;left:88px;right:88px;top:96px;bottom:150px">${inner}</div>
    <div style="position:absolute;left:88px;right:88px;bottom:62px;display:flex;justify-content:space-between;align-items:center;font-size:26px;color:#aeb8cc"><div class="brand" style="font-size:26px;color:#e8eefa">${MARK}GROWLIFT</div><span style="font-weight:600">${n}/${total}</span></div>`,
    `body{background:#02050f}${V2_CSS}`);
}

export const slideCoverV2 = ({ n, total, title, sub, plate }) =>
  slideV2(`
    <div style="position:absolute;left:0;right:0;bottom:0">
      <h1 class="t-title" style="font-size:108px">${title}</h1>
      <p class="t-lead" style="font-size:40px;margin-top:26px">${sub}</p>
      <span class="pill blue" style="margin-top:36px">Arraste para o lado →</span>
    </div>`, { n, total, plate });

export const slideTextV2 = ({ n, total, title, body, visual = '', bg = '' }) =>
  slideV2(`
    <h2 class="t-title" style="font-size:88px">${title}</h2>
    ${body ? `<p class="t-lead" style="font-size:38px;margin-top:26px">${body}</p>` : ''}
    <div style="position:absolute;left:0;right:0;bottom:0">${visual}</div>`, { n, total, bg });

/** Numbered or pictured rows: [picture-or-number, title, detail], large enough to fill the slide. */
export const slideRowsV2 = ({ n, total, title, lead = '', rows, bg = '' }) =>
  slideV2(`
    <h2 class="t-title" style="font-size:88px">${title}</h2>
    ${lead ? `<p class="t-lead" style="font-size:38px;margin-top:22px">${lead}</p>` : ''}
    <ol style="position:absolute;left:0;right:0;bottom:0;list-style:none;display:grid;gap:22px">
      ${rows.map(([pic, t, d]) => `<li style="display:flex;gap:30px;align-items:center;padding:26px;border-radius:36px;background:rgba(15,21,32,.8);border:1.5px solid rgba(255,255,255,.12)">
        ${typeof pic === 'number'
          ? `<span style="flex:none;width:132px;height:132px;margin:8px 4px 8px 8px;border-radius:36px;display:grid;place-items:center;font-size:66px;font-weight:800;color:#fff;background:${TOKENS.blue};box-shadow:0 16px 40px -10px rgba(8,101,254,.9)">${pic}</span>`
          : `<img src="${pic}" style="flex:none;width:300px;height:188px;object-fit:cover;object-position:top;border-radius:24px;border:1.5px solid rgba(255,255,255,.14)">`}
        <span><span style="display:block;font-size:46px;font-weight:800;color:#fff;letter-spacing:-.02em">${t}</span><span style="display:block;font-size:34px;color:#c6cede;margin-top:8px">${d}</span></span>
      </li>`).join('')}
    </ol>`, { n, total, bg });

export const slideCtaV2 = ({ n, total, title, body, button, plate, plateTop = -660 }) =>
  slideV2(`
    <div style="position:absolute;left:0;right:0;bottom:0">
      <h2 class="t-title" style="font-size:104px">${title}</h2>
      <p class="t-lead" style="font-size:40px;margin-top:24px">${body}</p>
      <div style="margin-top:40px;height:112px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:700;color:#fff;background:${TOKENS.blue};box-shadow:0 0 0 8px rgba(8,101,254,.18),0 30px 70px -20px rgba(8,101,254,.95)">${button}</div>
      <p style="margin-top:22px;font-size:32px;font-weight:600;color:#cfe0ff;text-align:center">growlift.com.br · link na bio</p>
    </div>`, { n, total, plate, plateTop });

/** Portfolio cover: the four concept sites as a tilted wall of browser windows, the title below. */
export const slideCoverWallV2 = ({ n, total, title, sub, imgs, note }) =>
  slideV2(`
    <div style="position:absolute;left:-150px;right:-150px;top:-140px;height:760px;transform:rotate(-7deg);display:grid;grid-template-columns:1fr 1fr;gap:28px;-webkit-mask-image:linear-gradient(180deg,#000 62%,transparent 100%)">
      ${imgs.map((src) => `<div class="win" style="box-shadow:0 40px 80px -30px rgba(0,0,0,.9)"><div class="bar" style="height:44px"><i></i><i></i><i></i></div><img src="${src}"></div>`).join('')}
    </div>
    <div style="position:absolute;left:0;right:0;bottom:0">
      <span class="pill" style="height:54px;font-size:24px">${note}</span>
      <h1 class="t-title" style="font-size:96px;margin-top:24px">${title}</h1>
      <p class="t-lead" style="font-size:38px;margin-top:22px">${sub}</p>
      <span class="pill blue" style="margin-top:30px">Arraste para o lado →</span>
    </div>`, { n, total });

/** One concept project in the feed: its colours behind, the site large, features as chips. */
export const slideProjectV2 = ({ n, total, name, segment, img, chips, note = 'Projeto conceito · nome fictício' }) =>
  slideV2(`
    <div style="display:flex;gap:14px;flex-wrap:wrap"><span class="pill">${segment}</span><span class="pill blue">${note}</span></div>
    <h2 class="t-title fit" style="font-size:100px;margin-top:26px;white-space:nowrap">${name}</h2>
    <script>for (const el of document.querySelectorAll('.fit')) { let s = 100; while (el.scrollWidth > el.clientWidth && s > 56) el.style.fontSize = (s -= 2) + 'px'; }</script>
    <div class="win" style="position:absolute;left:-48px;right:-48px;top:250px"><div class="bar"><i></i><i></i><i></i><span>seunegocio.com.br</span></div><img src="${img}"></div>
    <div style="position:absolute;left:0;right:0;bottom:0;display:flex;flex-wrap:wrap;gap:14px">${chips.map((c) => `<span style="height:74px;padding:0 24px;border-radius:999px;display:inline-flex;align-items:center;gap:10px;font-size:30px;font-weight:600;color:#fff;background:rgba(8,101,254,.25);border:1.5px solid rgba(77,141,255,.6)">${icon('check', { size: 30, color: '#8db8ff', width: 2.8 })}${c}</span>`).join('')}</div>`, { n, total, bg: img });

/** Our own site, computer and phone, for the feed. */
export const slideSiteV2 = ({ n, total, title, chip, desktop, mobile }) =>
  slideV2(`
    <span class="pill blue">${chip}</span>
    <h2 class="t-title" style="font-size:92px;margin-top:26px">${title}</h2>
    <div class="win" style="position:absolute;left:-48px;width:840px;top:470px"><div class="bar"><i></i><i></i><i></i><span>growlift.com.br</span></div><img src="${desktop}"></div>
    <div style="position:absolute;right:-30px;top:600px;width:290px;padding:12px;border-radius:50px;background:#151c29;box-shadow:0 0 0 2px rgba(255,255,255,.12),0 50px 100px -30px rgba(0,0,0,.95),0 0 80px -20px rgba(8,101,254,.6)">
      <img src="${mobile}" style="display:block;width:100%;height:500px;object-fit:cover;object-position:top;border-radius:40px">
    </div>`, { n, total, bg: desktop });

/** Services cover: the three plans as stacked glass cards under the title (no prices: they live on the site). */
export const slidePlansCoverV2 = ({ n, total, title, sub, plans }) =>
  slideV2(`
    <h1 class="t-title" style="font-size:108px">${title}</h1>
    <p class="t-lead" style="font-size:40px;margin-top:26px">${sub}</p>
    <ol style="position:absolute;left:0;right:0;bottom:118px;list-style:none;display:grid;gap:20px">
      ${plans.map(([name, tag], i) => `<li style="display:flex;align-items:center;justify-content:space-between;gap:24px;padding:30px 36px;border-radius:34px;background:${i === plans.length - 1 ? 'rgba(8,101,254,.26)' : 'rgba(15,21,32,.78)'};border:1.5px solid ${i === plans.length - 1 ? 'rgba(77,141,255,.75)' : 'rgba(255,255,255,.13)'};box-shadow:${i === plans.length - 1 ? '0 30px 80px -30px rgba(8,101,254,.95)' : 'none'}">
        <span style="font-size:54px;font-weight:800;letter-spacing:-.02em;color:#fff">${name}</span>
        <span style="font-size:36px;font-weight:600;color:${i === plans.length - 1 ? '#e8efff' : TOKENS.blueSoft}">${tag}</span>
      </li>`).join('')}
    </ol>
    <span class="pill blue" style="position:absolute;left:0;bottom:0">Arraste para o lado →</span>`, { n, total });

/** One plan (or the rules for all plans): a pill, the promise, and rows with an icon tile each. */
export const slidePlanV2 = ({ n, total, pill, title, lead = '', rows, featured = false }) =>
  slideV2(`
    <span class="pill${featured ? ' blue' : ''}">${pill}</span>
    <h2 class="t-title" style="font-size:96px;margin-top:30px">${title}</h2>
    ${lead ? `<p class="t-lead" style="font-size:38px;margin-top:22px">${lead}</p>` : ''}
    <ol style="position:absolute;left:0;right:0;bottom:0;list-style:none;display:grid;gap:20px">
      ${rows.map(([ic, t, d]) => `<li style="display:flex;gap:30px;align-items:center;padding:26px 30px;border-radius:34px;background:rgba(15,21,32,.8);border:1.5px solid rgba(255,255,255,.12)">
        <span style="flex:none;width:108px;height:108px;border-radius:30px;display:grid;place-items:center;background:rgba(8,101,254,.18);border:1.5px solid rgba(77,141,255,.45)">${icon(ic, { size: 58, color: '#8db8ff', width: 1.7 })}</span>
        <span><span style="display:block;font-size:44px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1.1">${t}</span>${d ? `<span style="display:block;font-size:33px;color:#c6cede;margin-top:8px;line-height:1.25">${d}</span>` : ''}</span>
      </li>`).join('')}
    </ol>`, { n, total });

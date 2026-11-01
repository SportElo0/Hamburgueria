// Shared pieces for Reels 11-13: one page per reel, every element driven by window.render(t) (seconds).
// Drawn in SVG (people, storefront, phone, clock) so nothing depends on photos or third-party brands.
import { MARK } from '../../pecas.mjs';

export const FONT = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">';

// Runtime helpers available to every reel script.
export const RUNTIME = `
const clamp=(x)=>Math.max(0,Math.min(1,x));
const eo=(x)=>1-Math.pow(1-clamp(x),3);
const eio=(x)=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
const back=(x)=>{x=clamp(x);const c=1.7;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const $=(id)=>document.getElementById(id);
// Visible from a to b, fading/rising in and out. Returns the "in" progress (0..1).
function show(id,t,a,b,o={}){
  const el=typeof id==='string'?$(id):id; if(!el)return 0;
  const fi=o.fi??.35, fo=o.fo??.3, dy=o.dy??40, sc=o.sc??0, x=o.x??0;
  const kin=o.pop?back((t-a)/fi):eo((t-a)/fi), kout=b===undefined?1:eo((b-t)/fo);
  const k=Math.min(kin,kout); const vis=t>=a&&(b===undefined||t<b);
  el.style.opacity=vis?Math.max(0,Math.min(1,k)):0;
  el.style.visibility=vis&&k>0?'visible':'hidden';
  const s=sc?(1-sc+sc*kin):1;
  el.style.transform=(o.base||'')+' translate('+((1-kin)*x)+'px,'+((1-kin)*dy)+'px) scale('+s+')';
  return vis?kin:0;
}
// Captions: [start,end,text,highlight]; the highlighted words get the accent box.
function captions(t,list){
  const el=$('cap'); const c=list.find(x=>t>=x[0]&&t<x[1]);
  if(!c){el.style.opacity=0;return}
  const k=back((t-c[0])/.22);
  el.style.opacity=1; el.style.transform='translateX(-50%) scale('+(.86+.14*k)+')';
  if(el.dataset.k!==String(c[0])){
    el.dataset.k=String(c[0]);
    let html=c[2].replace(/[&<>]/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
    if(c[3])html=html.replace(c[3],'<span class="hl">'+c[3]+'</span>');
    el.innerHTML=html;
  }
}
`;

export const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden}
body{position:relative;font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.abs{position:absolute}
.hide{opacity:0;visibility:hidden}
#cap{position:absolute;left:50%;top:1310px;transform:translateX(-50%);z-index:50;width:max-content;max-width:940px;text-align:center;line-height:1.25;font-weight:800;font-size:58px;letter-spacing:-.02em;padding:14px 30px;border-radius:22px}
#cap .hl{padding:2px 16px;border-radius:14px}
.brandmark{position:absolute;left:84px;top:150px;display:flex;align-items:center;gap:14px;font-size:26px;font-weight:800;letter-spacing:.14em;z-index:40}
.brandmark svg{height:30px;width:auto}
`;

export function page({ css, body, script, captions, brandColor = '#c6cede', theme = 'dark' }) {
  const capCss =
    theme === 'dark'
      ? '#cap{color:#f3f5f9;background:rgba(6,8,13,.78);border:1px solid rgba(255,255,255,.10)}#cap .hl{background:#0865fe;color:#fff}'
      : '#cap{color:#121826;background:rgba(255,255,255,.92);border:1px solid #dce2ec;box-shadow:0 18px 40px -24px rgba(18,24,38,.35)}#cap .hl{background:#0865fe;color:#fff}';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">${FONT}<style>${BASE_CSS}${capCss}${css}</style></head><body>
<div class="brandmark" style="color:${brandColor}">${MARK}GROWLIFT</div>
${body}
<div id="cap"></div>
<script>${RUNTIME}
const CAPS=${JSON.stringify(captions)};
${script}
const draw=window.draw;
window.render=async(t)=>{draw(t);captions(t,CAPS);};
</script></body></html>`;
}

// ---------------------------------------------------------------------------------------------
// Drawings

/** A person from the chest up. mood: 'ok' | 'happy' | 'sad'. Both mouths are drawn; the reel toggles them by id. */
export function person(id, shirt, { hair = '#2b2118', skin = '#f1c39c', size = 250 } = {}) {
  return `<svg id="${id}" class="abs" width="${size}" height="${size * 1.1}" viewBox="0 0 200 220" style="overflow:visible">
  <path d="M22 220c4-52 36-78 78-78s74 26 78 78z" fill="${shirt}"/>
  <path d="M84 132h32v22c0 9-7 14-16 14s-16-5-16-14z" fill="${skin}"/>
  <circle cx="100" cy="88" r="52" fill="${skin}"/>
  <path d="M48 84c0-34 22-54 52-54s54 18 54 50c-10-6-22-16-28-26-16 14-44 22-78 30z" fill="${hair}"/>
  <circle cx="44" cy="96" r="9" fill="${skin}"/><circle cx="156" cy="96" r="9" fill="${skin}"/>
  <ellipse cx="80" cy="96" rx="6" ry="7.5" fill="#1a1410"/><ellipse cx="120" cy="96" rx="6" ry="7.5" fill="#1a1410"/>
  <ellipse cx="66" cy="114" rx="9" ry="5" fill="#f08a7e" opacity=".55"/><ellipse cx="134" cy="114" rx="9" ry="5" fill="#f08a7e" opacity=".55"/>
  <path id="${id}-happy" d="M82 116c8 12 28 12 36 0" stroke="#1a1410" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path id="${id}-sad" d="M84 124c8-9 24-9 32 0" stroke="#1a1410" stroke-width="5" fill="none" stroke-linecap="round" opacity="0"/>
  <path id="${id}-brow" d="M70 80l18 4M130 80l-18 4" stroke="#1a1410" stroke-width="4" stroke-linecap="round" opacity="0"/>
</svg>`;
}

/** A small storefront: sign, striped awning, window, door. */
export function store(id, label, stripe, { w = 330, dark = '#1b2230', sign = '' } = {}) {
  const stripes = Array.from({ length: 6 }, (_, i) => `<rect x="${15 + i * 45}" y="62" width="45" height="46" fill="${i % 2 ? '#ffffff' : stripe}"/>`).join('');
  const scallops = Array.from({ length: 6 }, (_, i) => `<path d="M${15 + i * 45} 108a22.5 22.5 0 0 0 45 0z" fill="${i % 2 ? '#ffffff' : stripe}"/>`).join('');
  return `<svg id="${id}" class="abs" width="${w}" height="${w * 0.9}" viewBox="0 0 300 270">
  <rect x="70" y="8" width="160" height="44" rx="10" fill="#ffffff" stroke="${stripe}" stroke-width="4"/>
  <text x="150" y="38" text-anchor="middle" font-family="Inter" font-weight="800" font-size="20" letter-spacing="2" fill="#121826">${label}</text>
  <rect x="25" y="104" width="250" height="160" fill="${dark}"/>
  ${stripes}${scallops}
  <rect x="45" y="146" width="120" height="78" rx="6" fill="#2a3446"/>
  <rect x="58" y="190" width="18" height="26" rx="3" fill="#ff6b5b"/><rect x="84" y="182" width="18" height="34" rx="3" fill="#ffc94d"/><rect x="110" y="194" width="18" height="22" rx="3" fill="#4dd6a0"/><rect x="136" y="186" width="18" height="30" rx="3" fill="#4d8dff"/>
  <rect x="190" y="150" width="62" height="114" rx="4" fill="#2a3446"/><circle cx="240" cy="210" r="4" fill="#c6cede"/>
  <g id="${id}-sign">${sign}</g>
</svg>`;
}

export const svgIcon = (paths, size = 56, color = '#4d8dff', width = 2) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

export const ICON = {
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-8 8"/>',
  menu: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4-7 8-7s7 2.5 8 7"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  chat: '<path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.5-4.7A8.5 8.5 0 1 1 20.5 11.5z"/>',
  bag: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  bike: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-8h5l3 8M10 9l-1-3H7"/>',
};

/** A food photo drawn flat (burger, fries, drink, combo), for the mock menus. */
export function food(kind, size = 120) {
  const bg = { burger: '#ffe8cc', fries: '#fff1c2', drink: '#dbeafe', salad: '#dcfce7' }[kind] || '#f1f5f9';
  const art = {
    burger:
      '<path d="M22 54c0-16 14-26 38-26s38 10 38 26z" fill="#e8a54b"/><circle cx="44" cy="40" r="2" fill="#fff6dc"/><circle cx="62" cy="36" r="2" fill="#fff6dc"/><circle cx="76" cy="42" r="2" fill="#fff6dc"/><rect x="18" y="56" width="84" height="7" rx="3.5" fill="#5ac46a"/><rect x="20" y="64" width="80" height="12" rx="6" fill="#6b3a22"/><path d="M18 78h84l-6 6H24z" fill="#ffc94d"/><path d="M22 86h76c0 8-10 12-38 12s-38-4-38-12z" fill="#e8a54b"/>',
    fries:
      '<path d="M34 50h52l-6 46H40z" fill="#e8483b"/><g fill="#ffc94d"><rect x="38" y="22" width="8" height="34" rx="3"/><rect x="50" y="16" width="8" height="40" rx="3"/><rect x="62" y="20" width="8" height="36" rx="3"/><rect x="74" y="24" width="8" height="32" rx="3"/></g><path d="M34 50h52l-2 14H36z" fill="#c9372c"/>',
    drink: '<path d="M40 34h40l-5 62H45z" fill="#4d8dff"/><rect x="36" y="28" width="48" height="10" rx="4" fill="#ffffff"/><path d="M62 28l8-18" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>',
    salad: '<path d="M20 60h80c0 22-18 36-40 36S20 82 20 60z" fill="#ffffff"/><circle cx="44" cy="54" r="12" fill="#5ac46a"/><circle cx="62" cy="50" r="13" fill="#4dbb5c"/><circle cx="78" cy="56" r="10" fill="#e8483b"/>',
  }[kind];
  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120"><rect width="120" height="120" rx="18" fill="${bg}"/>${art}</svg>`;
}

// Reel 1 (estilo história, 01/11): "Quatro negócios". Four shops open in the morning; across town someone looks on the
// phone; who shows up, and with the face of the business (the four concept sites, marked fictitious). No outcome is
// promised. Timed to narracao-1-eleven.mp3.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page, person, store, svgIcon, ICON, comentaBlock } from './base.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const img = (f) => pathToFileURL(path.resolve(HERE, '../../assets/hd', f)).href;

export const DURATION = 31;
export const COVER = 6.9;

const CAPS = [
  [0.0, 2.85, 'Quatro negócios abriram as portas hoje cedo', 'Quatro negócios'],
  [3.2, 4.1, 'uma hamburgueria', 'hamburgueria'],
  [4.39, 5.2, 'um restaurante', 'restaurante'],
  [5.5, 6.5, 'uma confeitaria', 'confeitaria'],
  [6.79, 7.9, 'e um escritório', 'escritório'],
  [8.22, 9.6, 'Do outro lado da cidade', 'outro lado'],
  [9.77, 11.85, 'alguém pega o celular pra procurar', 'celular'],
  [13.85, 16.3, 'Quem aparece, e com a cara do negócio', 'aparece'],
  [16.65, 18.1, 'o cardápio da hamburgueria', 'cardápio'],
  [18.33, 19.6, 'a varanda do restaurante', 'varanda'],
  [19.76, 21.15, 'o bolo da confeitaria', 'bolo'],
  [21.47, 23.15, 'a confiança do escritório', 'confiança'],
  [23.63, 25.9, 'Cada negócio pede um site diferente', 'site diferente'],
];

const SHOPS = [
  { id: 'a', label: 'BURGER', name: 'Hamburgueria', color: '#ff8a3d', x: 110, y: 470, at: 3.2, site: 'burger.png', site_at: 16.65 },
  { id: 'b', label: 'BISTRÔ', name: 'Restaurante', color: '#2fae78', x: 640, y: 470, at: 4.39, site: 'restaurante.png', site_at: 18.33 },
  { id: 'c', label: 'DOCES', name: 'Confeitaria', color: '#e86a9a', x: 110, y: 860, at: 5.5, site: 'confeitaria.png', site_at: 19.76 },
  { id: 'd', label: 'ADVOCACIA', name: 'Escritório', color: '#c8a14a', x: 640, y: 860, at: 6.79, site: 'advocacia.png', site_at: 21.47 },
];

const css = `
body{background:#06080d;color:#f3f5f9}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.09) 1.6px,transparent 1.6px);background-size:44px 44px}
.glowB{position:absolute;width:1300px;height:1300px;border-radius:50%;background:radial-gradient(closest-side,rgba(8,101,254,.30),transparent 70%)}
.glowY{position:absolute;width:1000px;height:1000px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,201,77,.22),transparent 70%)}
.pill{position:absolute;left:50%;transform:translateX(-50%);display:inline-flex;align-items:center;gap:12px;padding:14px 28px;border-radius:999px;background:#0f1520;border:1px solid rgba(255,255,255,.12);font-size:28px;font-weight:700;white-space:nowrap}
.pill i{width:12px;height:12px;border-radius:50%;background:#0865fe;display:inline-block}
.chip{position:absolute;padding:14px 26px;border-radius:999px;font-size:32px;font-weight:800;background:#0f1520;border:1px solid rgba(255,255,255,.14);white-space:nowrap}
.big{position:absolute;left:60px;right:60px;text-align:center;font-weight:900;letter-spacing:-.04em;line-height:1.02}
.browser{position:absolute;left:60px;right:60px;border-radius:30px;overflow:hidden;background:#0f1520;border:1px solid rgba(255,255,255,.12);box-shadow:0 60px 120px -50px rgba(8,101,254,.7)}
.browser .bar{height:58px;display:flex;align-items:center;gap:12px;padding:0 24px;border-bottom:1px solid rgba(255,255,255,.08)}
.browser .bar i{width:14px;height:14px;border-radius:50%;background:#2a3344;display:inline-block}
.browser .bar span{margin-left:16px;font-size:22px;color:#8790a6;background:#151c29;border-radius:999px;padding:6px 18px}
.shot{position:absolute;inset:58px 0 0 0;width:100%;height:calc(100% - 58px);object-fit:cover;object-position:top}
.tag{position:absolute;padding:10px 20px;border-radius:999px;background:rgba(6,8,13,.85);border:1px solid rgba(255,255,255,.18);font-size:24px;font-weight:700;color:#e6eaf2;white-space:nowrap}
.thumb{position:absolute;width:440px;height:275px;border-radius:22px;overflow:hidden;border:2px solid rgba(255,255,255,.14);box-shadow:0 30px 60px -30px rgba(0,0,0,.9)}
.thumb img{width:100%;height:100%;object-fit:cover;object-position:top}
.thumb b{position:absolute;left:14px;bottom:14px;padding:8px 16px;border-radius:999px;background:rgba(6,8,13,.85);font-size:24px;font-weight:800}
.disc{position:absolute;left:70px;right:70px;top:250px;text-align:center;font-size:30px;font-weight:700;color:#c6cede;z-index:45;line-height:1.3}
`;

const sun = `<svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#ffc94d" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.5" fill="#ffc94d"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>`;

const body = `
<div class="dots"></div>
<div class="glowY" style="left:40px;top:120px"></div>
<div class="glowB" style="right:-600px;top:520px"></div>

<!-- Scene 1: four shops open -->
<div id="pillA" class="pill" style="top:400px;display:none"><i style="background:#ffc94d"></i>Hoje cedo</div>
<div id="sun" class="abs" style="left:900px;top:380px">${sun}</div>
${SHOPS.map(
  (s) => `<div id="shop${s.id}" class="abs" style="left:${s.x}px;top:${s.y}px">${store(`st${s.id}`, s.label, s.color, { w: 330 })}</div>
  <div id="chip${s.id}" class="chip" style="left:${s.x + 30}px;top:${s.y + 300}px;border-color:${s.color}">${s.name}</div>`,
).join('')}

<!-- Scene 2: across town, someone looks on the phone -->
<div id="pillB" class="pill" style="top:400px"><i></i>Do outro lado da cidade</div>
<div id="city" class="abs" style="left:0;right:0;top:0;bottom:0">
  <svg class="abs" style="left:0;top:980px" width="1080" height="260" viewBox="0 0 1080 260">
    ${[[0, 120, 90], [100, 60, 150], [210, 140, 110], [330, 30, 160], [450, 100, 120], [580, 50, 150], [720, 130, 100], [830, 70, 140], [960, 110, 120]]
      .map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${260 - y}" fill="#121a28"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${x + 16 + (i % 3) * 30}" y="${y + 20 + Math.floor(i / 3) * 40}" width="14" height="18" fill="#ffc94d" opacity=".35"/>`).join('')}`)
      .join('')}
  </svg>
  <div class="abs" style="left:90px;top:600px">${person('pc', '#0865fe', { size: 380, hair: '#3a2a1e' })}</div>
</div>
<div id="phone" class="abs" style="left:560px;top:480px;width:420px;height:760px;border-radius:60px;background:#1a2130;padding:14px;box-shadow:0 60px 120px -40px rgba(8,101,254,.7),0 0 0 2px rgba(255,255,255,.08)">
  <div style="position:relative;width:392px;height:732px;border-radius:48px;overflow:hidden;background:#f4f6fa;color:#121826">
    <div style="margin:70px 22px 0;height:66px;border-radius:999px;background:#fff;border:1px solid #dce2ec;display:flex;align-items:center;gap:12px;padding:0 22px;font-size:24px;font-weight:600;color:#4a5568">${svgIcon(ICON.search, 28, '#6a7385')}<span id="q"></span><span id="caret" style="width:2px;height:28px;background:#0865fe;display:inline-block"></span></div>
    ${[0, 1, 2, 3].map((i) => `<div id="sk${i}" style="margin:22px 22px 0;height:112px;border-radius:22px;background:#fff;border:1px solid #e3e8f0;padding:20px;display:flex;gap:16px"><div style="width:72px;height:72px;border-radius:16px;background:#e3e8f0"></div><div style="flex:1"><div style="height:18px;width:70%;border-radius:9px;background:#dfe5ee"></div><div style="height:14px;width:45%;border-radius:7px;background:#eef1f6;margin-top:14px"></div></div></div>`).join('')}
  </div>
</div>

<!-- Scene 3: who will he find? -->
<div id="ask" class="big" style="top:640px;font-size:120px">Quem ele vai<br><span style="color:#4d8dff">encontrar?</span></div>
<div id="askI" class="abs" style="left:470px;top:460px">${svgIcon(ICON.search, 140, '#4d8dff', 2.2)}</div>

<!-- Scene 4: the ones who show up, with the face of the business -->
<div id="pillC" class="pill" style="top:400px"><i></i>Quem aparece, com a cara do negócio</div>
<div id="grid">${SHOPS.map(
  (s, i) => `<div id="th${s.id}" class="thumb" style="left:${i % 2 ? 580 : 60}px;top:${i < 2 ? 490 : 830}px;border-color:${s.color}"><img src="${img(s.site)}"><b>${s.name}</b></div>`,
).join('')}</div>
<div id="win" class="browser" style="top:490px;height:620px">
  <div class="bar"><i></i><i></i><i></i><span>seunegocio.com.br</span></div>
  ${SHOPS.map((s) => `<img id="shot${s.id}" class="shot" src="${img(s.site)}">`).join('')}
</div>
${SHOPS.map((s) => `<div id="lbl${s.id}" class="chip" style="left:90px;top:1135px;border-color:${s.color};color:#fff"><span style="color:${s.color}">●</span> ${s.name}</div>`).join('')}
<div id="tagC" class="tag" style="left:560px;top:1145px">Projeto conceito</div>

<!-- Scene 5: each business, a different site -->
<div id="diff" class="big" style="top:480px;font-size:96px">Cada negócio,<br><span style="color:#4d8dff">um site diferente.</span></div>
<div id="row">${SHOPS.map(
  (s, i) => `<div id="rw${s.id}" class="thumb" style="width:230px;height:144px;left:${60 + i * 245}px;top:840px;border-color:${s.color}"><img src="${img(s.site)}"></div>`,
).join('')}</div>

${comentaBlock('Quer ver como ficaria o seu?', 'SITE')}
`;

const script = `
const SH=${JSON.stringify(SHOPS.map((s) => ({ id: s.id, at: s.at, site: s.site_at })))};
window.draw=(t)=>{
  // Scene 1
  show('pillA',t,0.05,7.95,{dy:-20,base:'translateX(-50%)'});
  show('sun',t,0.2,7.95,{pop:true,sc:.4}); $('sun').style.transform+=' rotate('+(t*20)+'deg)';
  SH.forEach((s,i)=>{ show('shop'+s.id,t,0.15+i*.25,7.95,{pop:true,sc:.25,fi:.5}); show('chip'+s.id,t,s.at,7.95,{pop:true,sc:.4});
    const g=$('st'+s.id+'-sign'); if(g) g.innerHTML=t>s.at?'<rect x="176" y="156" width="96" height="30" rx="6" fill="#22c55e"/><text x="224" y="177" text-anchor="middle" font-family="Inter" font-weight="900" font-size="17" fill="#06210f">ABERTO</text>':''; });
  // Scene 2
  show('pillB',t,8.2,12.25,{dy:-20,base:'translateX(-50%)'}); show('city',t,8.2,12.25,{dy:0,fi:.4});
  show('phone',t,9.6,12.25,{dy:120,fi:.5});
  const query='perto de mim', n=Math.floor(clamp((t-10.0)/1.2)*query.length);
  $('q').textContent=query.slice(0,n); $('caret').style.opacity=(Math.floor(t*3)%2||n<query.length)?1:0;
  for(let i=0;i<4;i++) show('sk'+i,t,11.2+i*.12,12.25,{dy:20,fi:.25});
  // Scene 3
  show('ask',t,12.3,13.8,{pop:true,sc:.3,dy:0}); show('askI',t,12.3,13.8,{pop:true,sc:.5,dy:0});
  // Scene 4
  show('pillC',t,13.85,23.2,{dy:-20,base:'translateX(-50%)'});
  show('grid',t,13.85,16.6,{dy:0,fi:.01});
  SH.forEach((s,i)=>show('th'+s.id,t,14.0+i*.35,16.6,{pop:true,sc:.25}));
  show('win',t,16.6,23.2,{dy:60,fi:.45});
  SH.forEach((s,i)=>{ const end=i<3?SH[i+1].site:23.2; show('shot'+s.id,t,s.site,end,{dy:0,fi:.3,fo:.01}); show('lbl'+s.id,t,s.site,end,{pop:true,sc:.4,fo:.01}); });
  show('tagC',t,16.9,23.2,{dy:10});
  // Scene 5
  show('diff',t,23.6,25.95,{dy:40}); show('row',t,23.6,25.95,{dy:0,fi:.01});
  SH.forEach((s,i)=>show('rw'+s.id,t,23.9+i*.18,25.95,{pop:true,sc:.3}));
  // Scene 6: Comenta SITE
  comenta(t,26.0,28.2,'SITE');
};
`;

export const html = () => page({ css, body, script, captions: CAPS });

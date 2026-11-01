// Reel 2 (estilo história, 01/11): "A confeitaria que ninguém achava". Bia bakes the prettiest cake in the neighbourhood,
// but the shop is empty and whoever searches nearby doesn't find hers; the brand takes shape (colours, name, photos) in a
// site with an order button (Doce Ateliê, concept project). Fictional, no outcome promised. Timed to narracao-2-eleven.mp3.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page, person, store, svgIcon, ICON, comentaBlock } from './base.mjs';
import { CSS, BG, RED, phone, TYPE } from './estilo.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const img = (f) => pathToFileURL(path.resolve(HERE, '../../assets/hd', f)).href;

export const DURATION = 27;
export const COVER = 1.2;

const PINK = '#e86a9a';

const CAPS = [
  [0.0, 2.6, 'A Bia faz o bolo mais bonito do bairro', 'mais bonito'],
  [2.98, 4.35, 'Mas a vitrine fica vazia', 'vazia'],
  [4.63, 6.2, 'e o celular, parado', 'parado'],
  [6.6, 9.4, 'Quem procura confeitaria por perto não acha a dela', 'não acha'],
  [9.91, 11.65, 'Então a marca ganha forma:', 'marca'],
  [11.96, 12.6, 'as cores', 'cores'],
  [12.76, 13.3, 'o nome', 'nome'],
  [13.49, 14.8, 'as fotos dos bolos', 'fotos'],
  [15.21, 17.5, 'Tudo num site com a cara da confeitaria', 'cara da confeitaria'],
  [17.72, 19.05, 'com um botão pra encomendar', 'encomendar'],
  [19.62, 23.2, 'Agora, quem encontra a Bia vê o bolo antes de chegar', 'antes de chegar'],
];

const cake = (s = 1) => `<svg width="${200 * s}" height="${200 * s}" viewBox="0 0 100 100">
  <rect x="18" y="52" width="64" height="34" rx="6" fill="#fbe3ec"/><rect x="18" y="52" width="64" height="9" rx="4" fill="${PINK}"/>
  <rect x="28" y="30" width="44" height="24" rx="5" fill="#fff4f8"/><rect x="28" y="30" width="44" height="7" rx="3" fill="${PINK}"/>
  <circle cx="40" cy="26" r="5" fill="#e8483b"/><circle cx="52" cy="24" r="5" fill="#e8483b"/><circle cx="62" cy="27" r="5" fill="#e8483b"/>
  <rect x="10" y="85" width="80" height="5" rx="2.5" fill="#c6cede"/></svg>`;

const results = ['Confeitaria A', 'Confeitaria B', 'Confeitaria C']
  .map(
    (n, i) => `<div id="r${i}" style="margin:18px 22px 0;background:#fff;border:1px solid #e3e8f0;border-radius:22px;padding:18px;display:flex;gap:14px;align-items:center">
  <div style="width:70px;height:70px;border-radius:16px;background:#fbe3ec;display:grid;place-items:center">${svgIcon(ICON.pin, 34, PINK)}</div>
  <div><div style="font-size:24px;font-weight:800">${n}</div><div style="font-size:19px;color:#6a7385;margin-top:4px">${['700 m', '1,1 km', '1,8 km'][i]}</div></div></div>`,
  )
  .join('');

const browser = (id, imgId, top, h) => `<div id="${id}" class="abs" style="left:60px;right:60px;top:${top}px;height:${h}px;border-radius:30px;overflow:hidden;background:#0f1520;border:1px solid rgba(255,255,255,.12);box-shadow:0 60px 120px -50px rgba(232,106,154,.6)">
  <div style="height:58px;display:flex;align-items:center;padding:0 24px;border-bottom:1px solid rgba(255,255,255,.08)"><span style="font-size:22px;color:#8790a6;background:#151c29;border-radius:999px;padding:6px 18px">exemplo.com.br</span></div>
  <img id="${imgId}" src="${img('confeitaria.png')}" style="position:absolute;inset:58px 0 0 0;width:100%;height:calc(100% - 58px);object-fit:cover;object-position:top">
</div>`;

const body = `
${BG}
<div class="disc">História fictícia · projeto conceito. Tela ilustrativa, não é do Google.<br>Não garantimos clientes nem posição no Google.</div>

<div id="hook" class="hook">O bolo é lindo.<br><span style="color:${PINK}">Quase ninguém viu.</span></div>
<div id="bia" class="abs" style="left:110px;top:700px">${person('pb', PINK, { size: 360, hair: '#3a2a1e' })}</div>
<div id="bName" class="chip" style="left:180px;top:1100px">Bia</div>
<div id="cake" class="abs" style="left:620px;top:700px">${cake(1.7)}</div>

<!-- empty shop, idle phone -->
<div id="shop" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="abs" style="left:110px;top:440px">${store('stB', 'DOCES', PINK, { w: 420 })}</div>
  <div class="chip" style="left:130px;top:830px;color:#8790a6">vitrine vazia</div>
  <div class="card" style="left:620px;top:470px;width:340px;height:520px;display:grid;place-items:center;text-align:center">
    <div>${svgIcon(ICON.chat, 110, '#3b4250', 1.6)}<div style="font-size:34px;font-weight:900;color:#8790a6;margin-top:18px">0 mensagens</div></div>
  </div>
</div>

<!-- someone searches nearby -->
${phone('ph', { left: 330, top: 430, h: 700, inner: results })}
<div id="nope" class="abs" style="left:300px;top:1150px;padding:14px 28px;border-radius:14px;background:${RED};color:#fff;font-size:36px;font-weight:900;transform:rotate(-3deg)">A da Bia não aparece</div>

<!-- the brand takes shape -->
<div id="brand" class="card" style="left:90px;top:440px;width:900px;height:760px;padding:44px 50px">
  <div style="font-size:30px;font-weight:900;letter-spacing:.1em;color:#ffc4d8">A MARCA GANHA FORMA</div>
  <div id="bCol" style="display:flex;gap:22px;margin-top:40px">${['#e86a9a', '#fbe3ec', '#6b3a1f', '#ffffff'].map((c) => `<span style="width:150px;height:110px;border-radius:24px;background:${c};border:2px solid rgba(255,255,255,.2)"></span>`).join('')}</div>
  <div id="bNam" style="margin-top:44px;font-size:96px;font-family:Georgia,'Times New Roman',serif;font-style:italic;color:#ffc4d8">Doce Ateliê</div>
  <div id="bFot" style="display:flex;gap:22px;margin-top:36px">${[0, 1, 2].map(() => `<span style="width:240px;height:190px;border-radius:24px;background:#fbf2f6;display:grid;place-items:center">${cake(0.9)}</span>`).join('')}</div>
</div>

<!-- the site, with the order button -->
${browser('win', 'shotA', 430, 640)}
<div id="ring" class="abs" style="left:792px;top:494px;width:230px;height:76px;border-radius:999px;border:6px solid #ffd27a;box-shadow:0 0 40px rgba(255,210,122,.8)"></div>
<div id="enc" class="chip" style="left:90px;top:1100px;color:#ffd27a;border-color:#ffd27a">Botão pra encomendar</div>
<div id="tagD" class="tag" style="left:620px;top:1110px">Projeto conceito · nome fictício</div>

<!-- whoever finds her sees the cake first -->
<div id="find" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="abs" style="left:60px;right:60px;top:430px;height:540px;border-radius:30px;overflow:hidden;border:2px solid ${PINK}"><img src="${img('confeitaria.png')}" style="width:100%;height:100%;object-fit:cover;object-position:top"></div>
  <div class="abs" style="left:90px;top:900px">${person('pc', '#2fae78', { size: 300, hair: '#2b2118' })}</div>
  <div class="chip" style="left:420px;top:1080px;color:#ffc4d8;border-color:${PINK}">Vê o bolo antes de chegar</div>
</div>

${comentaBlock('Quer o seu?', 'SITE')}
`;

const script = `
${TYPE}
window.draw=(t)=>{
  show('hook',t,0,2.95,{dy:0,fi:.01});
  show('bia',t,0.05,2.95,{dy:60,fi:.3}); show('bName',t,0.4,2.95,{pop:true,sc:.4}); show('cake',t,0.2,2.95,{pop:true,sc:.3,dy:0});
  show('shop',t,2.98,6.55,{dy:40});
  show('ph',t,6.6,9.88,{dy:120,fi:.5}); typeQ(t,6.9,1.3,'confeitaria perto de mim');
  for(let i=0;i<3;i++) show('r'+i,t,8.0+i*.15,9.88,{dy:20,fi:.25});
  show('nope',t,8.7,9.88,{pop:true,sc:.4,dy:0,base:'rotate(-3deg)'});
  show('brand',t,9.91,15.18,{dy:60,fi:.45});
  show('bCol',t,11.96,15.18,{dy:20}); show('bNam',t,12.76,15.18,{pop:true,sc:.3,dy:0}); show('bFot',t,13.49,15.18,{dy:20});
  show('win',t,15.21,19.6,{dy:60,fi:.45}); show('tagD',t,15.6,19.6,{dy:10});
  const r=show('ring',t,17.72,19.6,{pop:true,sc:.4,dy:0}); if(t>18.2&&t<19.6) $('ring').style.transform='scale('+(1+.05*Math.sin((t-18.2)*7))+')';
  show('enc',t,17.8,19.6,{pop:true,sc:.4});
  show('find',t,19.62,23.5,{dy:40});
  comenta(t,23.5,24.45,'SITE');
};
`;

export const html = () => page({ css: CSS, body, script, captions: CAPS });

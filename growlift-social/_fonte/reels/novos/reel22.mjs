// Reel 22 (09/11): "O site no celular". A premium burger site (Brasa Burger, concept project with a fictitious name)
// shown inside a phone that turns in 3D: the burger assembles layer by layer, the menu with photo, description and
// example prices, the order with delivery or pickup, Pix (demo QR) and address, hours and WhatsApp in one tap.
// Burger images are Growlift's own procedural 3D renders (public/renders, "not AI-generated"). Prices are examples.
// Timed to narracao-22-eleven.mp3.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page, comentaBlock, svgIcon, ICON } from './base.mjs';

export const DURATION = 26.0;
export const COVER = 4.6;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const R = path.resolve(HERE, '../../../../public/renders');
const img = (p) => pathToFileURL(path.join(R, p)).href;

const ORANGE = '#ff6a1f';
const CREAM = '#f6ece2';

const CAPS = [
  [0.1, 2.3, 'O site da Brasa Burger', 'Brasa Burger'],
  [2.64, 5.6, 'O lanche se monta na tela', 'se monta'],
  [5.86, 8.85, 'Cardápio com foto e preço', 'foto e preço'],
  [9.13, 9.9, 'Escolheu?', 'Escolheu?'],
  [9.93, 12.7, 'Entrega ou retirada', 'retirada'],
  [12.85, 14.7, 'Paga no Pix ali mesmo', 'Pix'],
  [14.88, 18.0, 'Endereço, horário e WhatsApp', 'WhatsApp'],
];

// Holyfield layers (box in % of a square stage), from src/content/renders.json.
const LAYERS = [
  ['00-bun-bottom', 17.875, 59, 64.375, 28.25],
  ['01-lettuce', 13.125, 56.688, 72.75, 29.063],
  ['02-patty-35', 19.375, 52, 61.563, 25.438],
  ['03-patty-36', 19.313, 46.563, 61.938, 24.313],
  ['04-cheese', 14.75, 45.813, 69.5, 30.062],
  ['05-bacon', 15.375, 41.688, 68.25, 21.5],
  ['06-tomato', 17.625, 39.625, 65.25, 17.25],
  ['07-onion', 22.125, 39.188, 57.688, 16.875],
  ['08-mayo', 21.625, 39.563, 55.188, 17.938],
  ['09-bun-top', 16.188, 23.875, 67.625, 30.875],
];
const stack = LAYERS.map(([f, x, y, w, h], i) => `<img id="ly${i}" src="${img(`burgers/holyfield/${f}.webp`)}" style="position:absolute;left:${x}%;top:${y}%;width:${w}%;height:${h}%;z-index:${i + 1}" alt="">`).join('');

const MENU = [
  ['holyfield', 'Duplo da Brasa', 'Dois blends de 130 g, queijo prato, bacon, alface, tomate e cebola roxa.', '42,90'],
  ['downtown-classic', 'Clássico da Casa', 'Blend de 160 g, queijo prato e maionese da casa no pão brioche.', '29,90'],
  ['the-bacon-street', 'Bacon & Salada', 'Blend de 160 g, queijo, bacon, alface, tomate e cebola roxa.', '36,90'],
  ['australian-cheddar', 'Defumado', 'Pão australiano, blend de 160 g, cheddar e bacon crocante.', '38,90'],
];
const card = ([id, name, desc, price], i) => `
<div id="mc${i}" style="position:absolute;left:16px;right:16px;top:${132 + i * 158}px;height:146px;border-radius:22px;background:#1b1410;border:1px solid rgba(255,255,255,.07);display:flex;gap:12px;padding:12px">
  <div style="flex:none;width:122px;height:122px;border-radius:16px;background:radial-gradient(circle at 50% 60%,#3a2418,#160f0b 75%);display:grid;place-items:center"><img src="${img(`burgers/${id}/card.webp`)}" style="width:132px;height:132px" alt=""></div>
  <div style="flex:1;min-width:0;display:flex;flex-direction:column">
    <div style="font-size:18px;font-weight:800;color:${CREAM};letter-spacing:-.01em">${name}</div>
    <div style="font-size:12.5px;line-height:1.38;color:#b8a798;margin-top:5px">${desc}</div>
    <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:19px;font-weight:900;color:${ORANGE}">R$ ${price}</span>
      <span id="add${i}" style="width:38px;height:38px;border-radius:50%;background:${ORANGE};color:#1a0d05;display:grid;place-items:center;font-size:26px;font-weight:800;line-height:1">+</span>
    </div>
  </div>
</div>`;

// Deterministic demo QR pattern (not a payable code; stamped "demonstração").
function qr() {
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const n = 25;
  let cells = '';
  const finder = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && rnd() > 0.5) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  const f = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  return `<svg viewBox="-1 -1 27 27" width="210" height="210" shape-rendering="crispEdges" fill="#111">${cells}${f(0, 0)}${f(n - 7, 0)}${f(0, n - 7)}</svg>`;
}

const flame = (s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z" fill="${ORANGE}"/><path d="M12 12c1 2 3 3 3 5a3 3 0 0 1-6 0c0-1 1-2 1-3 1 1 2 0 2-2z" fill="#ffc46b"/></svg>`;

const SCREEN = `
<div id="pg" style="position:absolute;left:0;top:0;width:390px;height:2430px">
  <!-- hero -->
  <div style="position:absolute;left:0;top:0;width:390px;height:844px;background:radial-gradient(120% 70% at 50% 58%,#3b1c0c 0%,#140c08 55%,#0c0806 100%)">
    <div style="position:absolute;left:24px;right:24px;top:96px;display:flex;justify-content:center"><span style="font-size:10.5px;font-weight:700;letter-spacing:.08em;color:#d9c6b4;border:1px dashed rgba(255,255,255,.28);border-radius:999px;padding:4px 10px">PROJETO CONCEITO · NOME FICTÍCIO</span></div>
    <div id="h1" style="position:absolute;left:22px;top:128px;font-family:Anton,Impact,sans-serif;font-size:70px;line-height:.92;letter-spacing:.005em;color:${CREAM}">FEITO NA<br><span style="color:${ORANGE}">BRASA.</span></div>
    <div id="h2" style="position:absolute;left:24px;right:120px;top:282px;font-size:14.5px;line-height:1.45;color:#cdbcab">Blend na brasa, pão brioche e molho da casa. Montado na hora.</div>
    <div id="emb" style="position:absolute;left:45px;top:420px;width:300px;height:300px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,106,31,.55),rgba(255,106,31,0) 72%)"></div>
    <div id="stg" style="position:absolute;left:15px;top:318px;width:360px;height:360px">${stack}</div>
    <div id="cta" style="position:absolute;left:22px;right:22px;top:700px;height:56px;border-radius:999px;background:${ORANGE};color:#1a0d05;display:flex;align-items:center;justify-content:center;gap:10px;font-size:17px;font-weight:800">Pedir agora <span style="font-size:20px">→</span></div>
    <div style="position:absolute;left:0;right:0;top:772px;display:flex;justify-content:center;gap:8px;font-size:12px;font-weight:700;color:#cdbcab">
      <span style="padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.07)">Delivery</span><span style="padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.07)">Retirada</span><span style="padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.07)">Pix</span>
    </div>
  </div>
  <!-- cardápio -->
  <div style="position:absolute;left:0;top:844px;width:390px;height:800px;background:#0f0a07">
    <div style="position:absolute;left:20px;top:28px;font-family:Anton,Impact,sans-serif;font-size:40px;color:${CREAM};letter-spacing:.01em">CARDÁPIO</div>
    <div style="position:absolute;right:18px;top:42px;font-size:11px;font-weight:700;color:#ffc46b;border:1px solid rgba(255,196,107,.4);border-radius:999px;padding:4px 10px">preços de exemplo</div>
    <div style="position:absolute;left:20px;top:86px;display:flex;gap:8px;font-size:13px;font-weight:800">
      <span style="padding:7px 14px;border-radius:999px;background:${CREAM};color:#140c08">Lanches</span><span style="padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.07);color:#cdbcab">Porções</span><span style="padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.07);color:#cdbcab">Bebidas</span>
    </div>
    ${MENU.map(card).join('')}
  </div>
  <!-- onde estamos -->
  <div style="position:absolute;left:0;top:1644px;width:390px;height:786px;background:#140d09">
    <div style="position:absolute;left:20px;top:30px;font-family:Anton,Impact,sans-serif;font-size:36px;color:${CREAM}">ONDE ESTAMOS</div>
    <div style="position:absolute;left:16px;right:16px;top:88px;height:170px;border-radius:22px;overflow:hidden;background:#221812">
      <svg width="358" height="170" viewBox="0 0 358 170"><g stroke="#3a2b21" stroke-width="10" fill="none"><path d="M-10 40h380M-10 118h380M70-10v190M210-10v190M300-10v190"/></g><g stroke="#2d2119" stroke-width="5"><path d="M-10 80h380M140-10v190M250-10v190"/></g><path d="M210 40 300 118" stroke="#4a2a16" stroke-width="12"/></svg>
      <div id="pin" style="position:absolute;left:162px;top:44px">${svgIcon(ICON.pin, 46, ORANGE, 2.4)}</div>
    </div>
    <div id="ad" style="position:absolute;left:16px;right:16px;top:274px;display:flex;gap:12px;align-items:center;padding:14px;border-radius:18px;background:#1b1410">
      ${svgIcon(ICON.pin, 26, ORANGE, 2.2)}<div><div style="font-size:15px;font-weight:800;color:${CREAM}">Endereço de exemplo, 77</div><div style="font-size:12.5px;color:#b8a798">São Paulo · SP</div></div>
    </div>
    <div id="hr" style="position:absolute;left:16px;right:16px;top:346px;display:flex;gap:12px;align-items:center;padding:14px;border-radius:18px;background:#1b1410">
      ${svgIcon(ICON.clock, 26, ORANGE, 2.2)}<div><div style="font-size:15px;font-weight:800;color:${CREAM}">Terça a domingo</div><div style="font-size:12.5px;color:#b8a798">18h às 23h30</div></div><span style="margin-left:auto;font-size:11.5px;font-weight:800;color:#22c55e">● Aberto</span>
    </div>
    <div id="wa" style="position:absolute;left:16px;right:16px;top:428px;height:56px;border-radius:999px;background:#22c55e;color:#06210f;display:flex;align-items:center;justify-content:center;gap:10px;font-size:17px;font-weight:800">${svgIcon(ICON.chat, 24, '#06210f', 2.4)}Chamar no WhatsApp</div>
    <div style="position:absolute;left:16px;right:16px;top:496px;height:52px;border-radius:999px;border:1.5px solid rgba(255,255,255,.2);color:${CREAM};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800">Como chegar</div>
    <div style="position:absolute;left:0;right:0;top:600px;text-align:center;font-size:11px;line-height:1.6;color:#8c7b6c">Brasa Burger · projeto conceito, nome fictício<br>Site por Growlift</div>
  </div>
</div>
<!-- fixed: status bar + nav -->
<div style="position:absolute;left:0;top:0;width:390px;height:100px;z-index:20;background:linear-gradient(#0c0806 90%,rgba(12,8,6,0))">
  <div style="position:absolute;left:30px;top:14px;font-size:15px;font-weight:700;color:#fff">21:14</div>
  <div style="position:absolute;right:28px;top:17px;display:flex;gap:6px;align-items:center"><span style="width:17px;height:10px;border-radius:2px;background:#fff;opacity:.9"></span><span style="width:24px;height:11px;border-radius:3px;border:1.5px solid #fff;opacity:.9"></span></div>
  <div style="position:absolute;left:20px;top:50px;display:flex;align-items:center;gap:7px">${flame(24)}<span style="font-family:Anton,Impact,sans-serif;font-size:22px;letter-spacing:.04em;color:${CREAM}">BRASA <span style="color:${ORANGE}">BURGER</span></span></div>
  <div style="position:absolute;right:18px;top:46px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.08);display:grid;place-items:center">${svgIcon(ICON.bag, 20, CREAM, 2.2)}<span id="badge" style="position:absolute;right:-3px;top:-3px;width:18px;height:18px;border-radius:50%;background:${ORANGE};color:#1a0d05;font-size:11px;font-weight:900;display:grid;place-items:center">1</span></div>
</div>
<!-- flying item to the bag -->
<img id="fly" src="${img('burgers/holyfield/card.webp')}" style="position:absolute;left:0;top:0;width:90px;height:90px;z-index:25" alt="">
<!-- cart sheet -->
<div id="dim" style="position:absolute;inset:0;z-index:28;background:rgba(0,0,0,.55)"></div>
<div id="sheet" style="position:absolute;left:0;right:0;bottom:0;height:430px;z-index:30;border-radius:28px 28px 0 0;background:#17110d;border-top:1px solid rgba(255,255,255,.08);padding:12px 18px 0">
  <div style="width:44px;height:5px;border-radius:5px;background:rgba(255,255,255,.2);margin:0 auto 16px"></div>
  <div style="font-size:20px;font-weight:900;color:${CREAM}">Seu pedido</div>
  <div style="display:flex;align-items:center;gap:12px;margin-top:14px;padding:10px;border-radius:16px;background:#211812">
    <img src="${img('burgers/holyfield/card.webp')}" style="width:64px;height:64px" alt=""><div style="flex:1"><div style="font-size:15px;font-weight:800;color:${CREAM}">Duplo da Brasa</div><div style="font-size:12px;color:#b8a798">1 unidade</div></div><span style="font-size:16px;font-weight:900;color:${ORANGE}">R$ 42,90</span>
  </div>
  <div style="position:relative;margin-top:16px;height:50px;border-radius:999px;background:#211812;display:flex;font-size:15px;font-weight:800">
    <span id="seg" style="position:absolute;top:4px;bottom:4px;left:4px;width:calc(50% - 4px);border-radius:999px;background:${ORANGE}"></span>
    <span id="segA" style="position:relative;flex:1;display:grid;place-items:center">Entrega</span><span id="segB" style="position:relative;flex:1;display:grid;place-items:center">Retirada</span>
  </div>
  <div id="segNote" style="margin-top:10px;font-size:12.5px;color:#b8a798;height:18px">Entrega no seu endereço</div>
  <div style="display:flex;justify-content:space-between;margin-top:14px;font-size:16px;font-weight:800;color:${CREAM}"><span>Total</span><span>R$ 42,90</span></div>
  <div id="payBtn" style="margin-top:16px;height:54px;border-radius:999px;background:${ORANGE};color:#1a0d05;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900">Pagar com Pix</div>
</div>
<!-- pix -->
<div id="pix" style="position:absolute;inset:0;z-index:32;background:#f7f3ef;color:#17110d">
  <div style="position:absolute;left:0;right:0;top:64px;text-align:center;font-size:18px;font-weight:900">Pagamento</div>
  <div style="position:absolute;left:0;right:0;top:112px;text-align:center;font-size:14px;color:#5d4f45">Escaneie ou copie o código Pix</div>
  <div style="position:absolute;left:75px;top:150px;width:240px;height:240px;border-radius:18px;background:#fff;display:grid;place-items:center;box-shadow:0 10px 30px -12px rgba(0,0,0,.25)">${qr()}
    <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-12deg);font-size:13px;font-weight:900;letter-spacing:.06em;color:#d4380d;border:2px solid #d4380d;border-radius:8px;padding:4px 8px;background:rgba(255,255,255,.92);white-space:nowrap">PIX DE DEMONSTRAÇÃO</span></div>
  <div style="position:absolute;left:0;right:0;top:410px;text-align:center;font-size:26px;font-weight:900">R$ 42,90</div>
  <div style="position:absolute;left:40px;right:40px;top:460px;height:52px;border-radius:999px;border:2px solid #17110d;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800">Copiar código Pix</div>
  <div id="ok" style="position:absolute;left:24px;right:24px;top:540px;padding:18px;border-radius:20px;background:#dcfce7;display:flex;gap:14px;align-items:center">
    <span style="flex:none;width:44px;height:44px;border-radius:50%;background:#16a34a;display:grid;place-items:center">${svgIcon(ICON.check, 26, '#fff', 3)}</span>
    <div><div style="font-size:16px;font-weight:900;color:#14532d">Pagamento recebido!</div><div style="font-size:13px;color:#166534">Seu pedido já foi pra cozinha.</div></div>
  </div>
</div>
<div id="tap" style="position:absolute;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;z-index:40;background:rgba(255,255,255,.5);border:2px solid #fff;box-shadow:0 0 0 7px rgba(255,255,255,.18)"></div>
`;

// Floating 3D ingredients around the phone (reel coordinates, depth: 0 far … 1 near).
const FLOATS = [
  ['float-lettuce', 70, 420, 190, 0.9, -18],
  ['float-tomato', 850, 520, 170, 0.8, 22],
  ['float-bacon', 820, 1080, 200, 1, -12],
  ['float-cheese', 40, 1000, 180, 0.95, 16],
  ['float-onion', 880, 300, 140, 0.55, 8],
  ['float-sesame', 150, 1250, 110, 0.5, 0],
  ['float-fry-a', 900, 1300, 150, 0.7, 40],
  ['float-fry-b', 30, 690, 130, 0.6, -30],
];
const floats = FLOATS.map(([f, x, y, s, d, r], i) => `<img id="fl${i}" class="fl" src="${img(`props/${f}.webp`)}" style="left:${x}px;top:${y}px;width:${s}px;z-index:${d > 0.75 ? 12 : 3};filter:${d < 0.75 ? `blur(${((0.75 - d) * 10).toFixed(1)}px) brightness(.8)` : 'drop-shadow(0 30px 30px rgba(0,0,0,.5))'}" data-d="${d}" data-r="${r}" alt="">`).join('');

const css = `
body{background:#0a0705;color:#f3f5f9}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.06) 1.6px,transparent 1.6px);background-size:44px 44px}
#ember{position:absolute;left:-260px;top:300px;width:1600px;height:1600px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,106,31,.32),rgba(255,106,31,0) 70%)}
#stage{position:absolute;left:0;top:0;width:1080px;height:1920px;perspective:2600px;perspective-origin:50% 40%;z-index:10}
#phone{position:absolute;left:263px;top:262px;width:554px;height:1172px;border-radius:84px;transform-style:preserve-3d;
  background:linear-gradient(145deg,#4a4f58 0%,#1c1f25 30%,#0d0f13 60%,#3b4048 100%);padding:12px;
  box-shadow:0 80px 140px -40px rgba(0,0,0,.9),0 0 0 2px rgba(255,255,255,.10) inset,0 40px 120px -30px rgba(255,106,31,.45)}
#phone:before{content:"";position:absolute;right:-5px;top:300px;width:6px;height:120px;border-radius:4px;background:#2b2f36}
#phone:after{content:"";position:absolute;left:-5px;top:260px;width:6px;height:80px;border-radius:4px;background:#2b2f36}
#scr{position:relative;width:530px;height:1148px;border-radius:72px;overflow:hidden;background:#0c0806}
#vp{position:absolute;left:0;top:0;width:390px;height:844px;transform-origin:0 0;transform:scale(1.3590);overflow:hidden}
#island{position:absolute;left:50%;top:16px;width:150px;height:42px;margin-left:-75px;border-radius:30px;background:#000;z-index:60}
#glare{position:absolute;inset:0;border-radius:72px;z-index:61;pointer-events:none;background:linear-gradient(115deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,0) 32%,rgba(255,255,255,0) 70%,rgba(255,255,255,.06) 100%)}
#shadow{position:absolute;left:290px;top:1470px;width:500px;height:70px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.75),rgba(0,0,0,0));z-index:2}
.fl{position:absolute;pointer-events:none}
#tagc{position:absolute;left:84px;top:200px;z-index:41;padding:8px 18px;border-radius:999px;background:rgba(10,7,5,.8);border:1px dashed rgba(255,255,255,.3);font-size:23px;font-weight:700;color:#e6dcd2}
#cap{top:1478px}
#cap .hl{background:${ORANGE};color:#160b04}
#closing{position:absolute;left:60px;right:60px;top:300px;text-align:center;font-weight:900;letter-spacing:-.04em;line-height:1.02;font-size:84px;z-index:20}
`;

const body = `
<div class="dots"></div><div id="ember"></div>
<div id="tagc">Projeto conceito · nome fictício</div>
${floats}
<div id="shadow"></div>
<div id="stage"><div id="phone"><div id="scr"><div id="vp">${SCREEN}</div><div id="island"></div><div id="glare"></div></div></div></div>
<div id="closing">Sua hamburgueria<br><span style="color:${ORANGE}">no celular do cliente.</span></div>
${comentaBlock('Quer um site assim?', 'SITE', 'dark', 560)}
`;

const script = `
window.MOTION=2;
const L=(a,b,x)=>a+(b-a)*x;
const p=(t,a,d)=>eioS((t-a)/d);
const N=${LAYERS.length};
// layer i lands at 2.75 + i*.27 s
const land=(i)=>2.75+i*0.27;
const SCROLL=[[0,0],[5.95,0],[6.95,700],[14.95,700],[15.9,1586],[18.25,1586],[19.1,0]];
function scrollAt(t){for(let i=1;i<SCROLL.length;i++){const [a,va]=SCROLL[i-1],[b,vb]=SCROLL[i];if(t<b)return L(va,vb,eioS((t-a)/(b-a)));}return SCROLL[SCROLL.length-1][1];}
function tap(t,x,y,a){const k=t>=a&&t<a+.5?1-(t-a)/.5:0;const el=$('tap');el.style.opacity=k;el.style.left=x+'px';el.style.top=y+'px';el.style.transform='scale('+(1.2-0.4*k)+')';return t>=a;}
window.draw=(t)=>{
  // phone in 3D
  const fin=eoS(t/1.3);
  let ry=L(-34,-10,fin)+3*Math.sin(t*.7), rx=L(26,5,fin), ty=L(520,0,fin), sc=L(.82,1,fin), op=1;
  const turn=p(t,5.9,2.6); ry+=L(0,20,turn);
  const flat=p(t,9.0,.8)*(1-p(t,18.2,.8)); ry=L(ry,-3+1.2*Math.sin(t*.7),flat); rx=L(rx,2,flat);
  const back=p(t,18.3,1.1); ry=L(ry,-16+2*Math.sin(t*.7),back); sc=L(sc,.74,back); ty=L(ty,250,back); rx=L(rx,8,back);
  const out=p(t,21.85,.5); op=1-out; ty+=out*120;
  $('phone').style.transform='translateY('+ty+'px) rotateX('+rx+'deg) rotateY('+ry+'deg) scale('+sc+')';
  $('phone').style.opacity=op; $('shadow').style.opacity=op*(1-back*.4); $('shadow').style.transform='translateY('+(back*170)+'px) scaleX('+(sc)+')';
  $('glare').style.backgroundPosition=(ry*4)+'px 0';
  $('glare').style.opacity=.6+ry/60;
  // page scroll
  $('pg').style.transform='translateY('+(-scrollAt(t))+'px)';
  // hero entrance
  show('h1',t,.35,undefined,{dy:24}); show('h2',t,.7,undefined,{dy:16}); show('cta',t,.95,undefined,{dy:16});
  // burger builds layer by layer, top bun last; then gently breathes
  for(let i=0;i<N;i++){const a=land(i)-.42;const k=eoS((t-a)/.42);const el=$('ly'+i);
    el.style.opacity=t<a?0:Math.min(1,k*1.6);
    const breathe=t>6?Math.sin(t*1.6)*1.4*(i-N/2)/N:0;
    el.style.transform='translateY('+((1-k)*-260+breathe)+'%)';}
  $('emb').style.opacity=.35+.45*eoS((t-2.6)/3)+.08*Math.sin(t*3);
  // menu cards stagger in as the menu arrives
  for(let i=0;i<4;i++) show('mc'+i,t,6.45+i*.18,undefined,{dy:40});
  // add to bag
  const addA=9.25; tap(t,350,844+132+146-30-700+ (0),addA);
  const fk=p(t,addA+.1,.65); const fly=$('fly');
  fly.style.opacity=t>addA+.1&&fk<1?1:0;
  fly.style.transform='translate('+L(44,309,fk)+'px,'+L(304,19,fk)+'px) scale('+L(1,.25,fk)+')';
  const bk=t>addA+.7?back2(t-addA-.7):0; $('badge').style.opacity=t>addA+.7?1:0; $('badge').style.transform='scale('+(bk)+')';
  // cart sheet
  const sh=eoS((t-9.95)/.5)*(1-eoS((t-14.85)/.35));
  $('sheet').style.transform='translateY('+((1-sh)*440)+'px)'; $('dim').style.opacity=sh*(t<13.1?1:0);
  const sw=p(t,11.85,.35); $('seg').style.transform='translateX('+(sw*100)+'%)';
  $('segA').style.color=sw<.5?'#1a0d05':'#cdbcab'; $('segB').style.color=sw<.5?'#cdbcab':'#1a0d05';
  $('segNote').textContent=sw<.5?'Entrega no seu endereço':'Retirada no balcão';
  tap(t,290,610,11.75);
  // pix
  tap(t,195,742,12.9);
  const px=eoS((t-13.15)/.4)*(1-eoS((t-14.85)/.35)); $('pix').style.opacity=px; $('pix').style.visibility=px>0?'visible':'hidden';
  $('pix').style.transform='translateY('+((1-px)*40)+'px)';
  show('ok',t,14.0,undefined,{dy:18});
  // info: highlight address, hours, WhatsApp
  const hl=(id,a)=>{const k=eoS((t-a)/.3)*(1-eoS((t-a-1.2)/.4));$(id).style.boxShadow='0 0 0 '+(2*k)+'px ${ORANGE}';};
  hl('ad',16.0); hl('hr',16.55);
  $('pin').style.transform='translateY('+(-10*Math.abs(Math.sin(t*4))*(t>15.9&&t<17?1:0))+'px)';
  tap(t,195,428+28+(1644-1590),17.25);
  const wk=t>=17.25&&t<17.75?1-(t-17.25)/.5:0; $('wa').style.transform='scale('+(1-.04*wk)+')';
  // floating ingredients: drift in with depth parallax, pulled with the phone's turn
  document.querySelectorAll('.fl').forEach((el,i)=>{const d=+el.dataset.d, r=+el.dataset.r;
    const top=+el.style.top.replace('px','');const vis=eoS((t-2.6-i*.08)/.9)*(1-p(t,9.0,.6))+(top>760?eoS((t-18.4-i*.05)/.8)*(1-p(t,21.85,.4)):0);
    const x=(ry)*-6*d, y=Math.sin(t*.9+i)*16*d-(t*14*d);
    el.style.opacity=Math.min(1,vis); el.style.transform='translate('+x+'px,'+(y+(1-Math.min(1,vis))*80)+'px) rotate('+(r+Math.sin(t*.6+i)*8)+'deg) scale('+(.7+.3*Math.min(1,vis))+')';});
  show('tagc',t,.2,21.85,{dy:0});
  show('closing',t,18.35,21.85,{dy:30});
  comenta(t,22.17,23.3,'SITE');
};
function back2(x){x=Math.max(0,Math.min(1,x/.35));const c=1.7;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2);}
`;

const FONT2 = '<link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet">';
export const html = () => page({ css, body, script, captions: CAPS }).replace('<style>', `${FONT2}<style>`);

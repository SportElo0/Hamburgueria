// Reel 13: "A porta que fica aberta". Dark, black and white with the Growlift blue: the shutter comes down at
// night but people keep asking; the site stays open (menu with photos, hours, address) and, when the restaurant
// opens, orders land on the store screen with Pix. Timed to narracao-13-eleven.mp3. Nothing claims orders while
// closed: during closed hours the site shows the menu and the hours.
import { MARK } from '../../pecas.mjs';
import { page, svgIcon, ICON, food } from './base.mjs';

export const DURATION = 26.4;
export const COVER = 12.6;

const BLUE = '#0865fe';

// Title lines, revealed word by word while they are spoken (unspoken words stay grey).
const TITLES = [
  [0.0, 2.3, 'Todo restaurante tem hora pra fechar.'],
  [2.3, 5.3, 'A porta desce, mas a fome continua.'],
  [5.3, 9.0, 'Que horas abre amanhã? Tem cardápio? Faz entrega?'],
  [9.0, 11.5, 'Um site é a porta que fica aberta.'],
  [11.5, 15.5, 'O cliente vê o cardápio com foto, o horário e onde fica.'],
  [15.5, 20.6, 'E quando vocês abrem, o pedido cai na tela da loja, com Pix na hora.'],
  [20.6, 23.55, 'Sua vitrine aberta, o tempo todo.'],
];
// When each title's words are spoken (start, end of speech), from the narration's pauses.
const SPOKEN = [[0, 1.98], [2.39, 5.04], [5.45, 8.55], [9.09, 11.28], [11.59, 15.26], [15.61, 20.4], [20.74, 23.27]];

const css = `
body{background:#0c0c0e;color:#f5f5f5}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,rgba(255,255,255,.07),transparent 62%)}
.title{position:absolute;left:84px;right:150px;top:236px;font-weight:800;font-size:76px;line-height:1.08;letter-spacing:-.035em}
.title span{transition:none}
.clock{position:absolute;right:84px;top:150px;font-size:34px;font-weight:700;color:#bdbdbd;font-variant-numeric:tabular-nums;letter-spacing:.02em}
.storeW{position:absolute;left:140px;top:640px;width:800px}
.sign{height:120px;background:#f5f5f5;color:#0c0c0e;display:flex;align-items:center;justify-content:center;font-size:58px;font-weight:900;letter-spacing:.12em}
.awn{height:70px;background:repeating-linear-gradient(135deg,#f5f5f5 0 34px,#0c0c0e 34px 68px);clip-path:polygon(0 0,100% 0,100% 100%,96% 70%,92% 100%,88% 70%,84% 100%,80% 70%,76% 100%,72% 70%,68% 100%,64% 70%,60% 100%,56% 70%,52% 100%,48% 70%,44% 100%,40% 70%,36% 100%,32% 70%,28% 100%,24% 70%,20% 100%,16% 70%,12% 100%,8% 70%,4% 100%,0 70%)}
.front{position:relative;height:520px;background:#1c1c20;margin:0 30px;overflow:hidden}
.win{position:absolute;left:40px;top:60px;width:440px;height:380px;background:#e9e9ec;display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:30px}
.door{position:absolute;right:40px;top:60px;width:180px;height:460px;background:#e9e9ec}
.tagO{position:absolute;right:70px;top:120px;background:#0c0c0e;color:#f5f5f5;font-size:24px;font-weight:800;letter-spacing:.1em;padding:8px 14px}
.shutter{position:absolute;left:0;right:0;top:0;height:520px;background:repeating-linear-gradient(#8a8a90 0 26px,#6d6d73 26px 30px);display:flex;align-items:center;justify-content:center;font-size:84px;font-weight:900;letter-spacing:.14em;color:#4d4d52}
.q{position:absolute;background:#f5f5f5;color:#0c0c0e;font-size:34px;font-weight:800;padding:16px 26px;border-radius:18px;white-space:nowrap;box-shadow:0 18px 40px -16px rgba(0,0,0,.8);z-index:10}
.br{position:absolute;left:140px;top:600px;width:800px;background:#f5f5f5;color:#121826;border-radius:30px;overflow:hidden;box-shadow:0 50px 120px -30px rgba(8,101,254,.55)}
.bar{height:76px;background:#e6e8ee;display:flex;align-items:center;gap:12px;padding:0 26px}
.bar i{width:16px;height:16px;border-radius:50%;background:#c4c8d2;display:inline-block}
.url{flex:1;margin-left:14px;height:46px;border-radius:999px;background:#fff;display:flex;align-items:center;gap:10px;padding:0 20px;font-size:24px;font-weight:600;color:#4a5568}
.dish{background:#fff;border:2px solid #e3e6ee;border-radius:22px;padding:14px;font-size:24px;font-weight:700}
.dish small{display:block;font-size:20px;color:#6a7385;font-weight:600;margin-top:4px}
.info{display:flex;align-items:center;gap:12px;font-size:26px;font-weight:700;color:#4a5568;margin-top:14px}
.panel{position:absolute;left:140px;top:600px;width:800px;height:760px;background:#16171b;border:2px solid rgba(255,255,255,.12);border-radius:34px;padding:36px}
.ord{display:flex;align-items:center;justify-content:space-between;background:#212228;border:2px solid rgba(255,255,255,.08);border-radius:24px;padding:24px 28px;margin-top:20px;font-size:30px;font-weight:700}
.paid{display:inline-flex;align-items:center;gap:8px;font-size:24px;font-weight:800;color:#06210f;background:#4ade80;padding:8px 16px;border-radius:999px}
`;

const shop = `
<div id="shop" class="storeW">
  <div class="sign">SEU RESTAURANTE</div>
  <div class="awn"></div>
  <div class="front">
    <div class="win">${food('burger', 180)}${food('fries', 180)}${food('drink', 180)}${food('salad', 180)}</div>
    <div class="door"></div><div class="tagO">ABERTO</div>
    <div id="shutter" class="shutter">FECHADO</div>
  </div>
</div>`;

const body = `
<div class="vig"></div>
<div id="title" class="title"></div>
<div id="ilus" class="abs" style="left:84px;bottom:420px;font-size:24px;font-weight:600;color:#77777f;letter-spacing:.02em">Exemplo ilustrativo · nome e endereço fictícios</div>
<div id="clock" class="clock">18:00</div>
${shop}
<div id="q1" class="q" style="left:90px;top:900px">Que horas abre amanhã?</div>
<div id="q2" class="q" style="left:650px;top:1010px">Tem cardápio?</div>
<div id="q3" class="q" style="left:140px;top:1160px">Faz entrega?</div>

<div id="site" class="br">
  <div class="bar"><i></i><i></i><i></i><div class="url">${svgIcon('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 26, '#16a34a')}seurestaurante.exemplo</div></div>
  <div style="padding:30px 34px 34px">
    <div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:44px;font-weight:900;letter-spacing:-.02em">Seu Restaurante</div><div style="font-size:22px;font-weight:800;letter-spacing:.08em;color:#fff;background:${BLUE};padding:10px 16px;border-radius:999px">SITE NO AR</div></div>
    <div id="sMenu" style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:26px">
      <div class="dish">${food('burger', 300).replace('width="300" height="300"', 'width="100%" height="200" preserveAspectRatio="xMidYMid slice"')}Burger da casa<small>Pão, carne e queijo</small></div>
      <div class="dish">${food('fries', 300).replace('width="300" height="300"', 'width="100%" height="200" preserveAspectRatio="xMidYMid slice"')}Batata<small>Porção para dois</small></div>
    </div>
    <div id="sInfo">
      <div class="info" style="margin-top:24px">${svgIcon(ICON.clock, 34, BLUE, 2.4)}Hoje: abre às 18h · fecha às 23h</div>
      <div class="info">${svgIcon(ICON.pin, 34, BLUE, 2.4)}Rua Exemplo, 100 · ver no mapa</div>
    </div>
  </div>
</div>

<div id="panel" class="panel">
  <div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:40px;font-weight:900">Pedidos</div><div style="display:flex;align-items:center;gap:10px;font-size:26px;font-weight:700;color:#4ade80"><span style="width:14px;height:14px;border-radius:50%;background:#4ade80;display:inline-block"></span>Loja aberta</div></div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><div style="font-size:24px;color:#9a9aa3">Tela da loja · os pedidos do site chegam aqui</div><div style="font-size:20px;font-weight:800;letter-spacing:.08em;color:#fff;background:${BLUE};padding:8px 14px;border-radius:999px">PLANO GROW</div></div>
  <div id="o1" class="ord"><span>#27 · Combo da casa</span><span class="paid">${svgIcon(ICON.check, 24, '#06210f', 3)}Pix pago</span></div>
  <div id="o2" class="ord"><span>#28 · 2× Burger</span><span class="paid">${svgIcon(ICON.check, 24, '#06210f', 3)}Pix pago</span></div>
  <div id="o3" class="ord"><span>#29 · Batata + refri</span><span class="paid">${svgIcon(ICON.check, 24, '#06210f', 3)}Pix pago</span></div>
  <div id="bell" class="abs" style="right:40px;bottom:36px">${svgIcon('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>', 64, '#ffc94d', 2.2)}</div>
</div>

<div id="end" class="abs" style="inset:0;background:#0c0c0e;z-index:45">
  <div class="abs" style="left:84px;right:84px;top:560px">
    <div style="width:170px">${MARK}</div>
    <div style="font-size:104px;font-weight:900;letter-spacing:-.04em;line-height:1.02;margin-top:56px">Sua vitrine aberta,<br><span style="color:#4d8dff">o tempo todo.</span></div>
    <div style="font-size:38px;font-weight:600;color:#bdbdbd;margin-top:30px">Sites para restaurantes · Growlift</div>
    <div style="display:inline-flex;margin-top:60px;padding:26px 50px;border-radius:999px;background:${BLUE};color:#fff;font-size:44px;font-weight:800;box-shadow:0 26px 60px -20px rgba(8,101,254,.9)">Link na bio</div>
    <div style="font-size:32px;font-weight:600;color:#9a9aa3;margin-top:34px">@growlift.ai · growlift.com.br</div>
  </div>
</div>
`;

const script = `
const TITLES=${JSON.stringify(TITLES)}, SPOKEN=${JSON.stringify(SPOKEN)};
let lastT=-1;
function title(t){
  const i=TITLES.findIndex(x=>t>=x[0]&&t<x[1]); const el=$('title');
  if(i<0){el.style.opacity=0;return}
  el.style.opacity=1;
  if(el.dataset.i!==String(i)){el.dataset.i=String(i);el.innerHTML=TITLES[i][2].split(' ').map(w=>'<span>'+w+'</span>').join(' ');}
  const spans=el.children, n=spans.length, [a,b]=SPOKEN[i];
  const k=clamp((t-a)/(b-a)), lit=Math.ceil(k*n);
  for(let j=0;j<n;j++) spans[j].style.color=j<lit||t>=b?'#f5f5f5':'#4a4a50';
}
const pad=(x)=>String(x).padStart(2,'0');
function clock(t){
  // Evening, then the night goes by fast while closed, then 18:00 when it opens again.
  let m;
  if(t<2.4) m=22*60+52+t*3;
  else if(t<15.5) m=23*60+(t-2.4)*60;           // 23:00 → about 12:00 next day
  else if(t<16.2) m=17*60+59;
  else if(t<20.6) m=18*60+(t-16.2)*8;
  else m=(18*60+40+(t-20.6)*300);
  m=Math.floor(m)%(24*60); $('clock').textContent=pad(Math.floor(m/60))+':'+pad(m%60);
}
window.draw=(t)=>{
  title(t); clock(t);
  show('shop',t,0,9.25,{pop:true,sc:.12,fi:.5,dy:0});
  const ks=eio((t-2.45)/.9); $('shutter').style.transform='translateY('+((ks-1)*100)+'%)';
  show('q1',t,5.45,9.2,{pop:true,sc:.5}); show('q2',t,6.82,9.2,{pop:true,sc:.5}); show('q3',t,7.84,9.2,{pop:true,sc:.5});
  // The site: the open door
  show('site',t,9.1,15.6,{pop:true,sc:.2,fi:.55,dy:0});
  show('sMenu',t,11.6,15.6,{dy:30}); show('sInfo',t,13.7,15.6,{dy:30});
  // Store screen when it opens
  show('panel',t,15.6,20.65,{dy:80,fi:.5});
  show('o1',t,16.9,20.65,{x:-200,dy:0,pop:true}); show('o2',t,18.0,20.65,{x:-200,dy:0,pop:true}); show('o3',t,19.1,20.65,{x:-200,dy:0,pop:true});
  const ring=[16.9,18.0,19.1].some(a=>t>=a&&t<a+.5); $('bell').style.transform='rotate('+(ring?Math.sin(t*60)*16:0)+'deg)';
  // Shop open again, the site in front
  if(t>=20.65&&t<23.55){
    // Night again: the shutter is down, the site keeps the window open.
    show('shop',t,20.65,23.55,{dy:0}); $('shutter').style.transform='translateY(0)';
    show('site',t,20.9,23.55,{pop:true,sc:.2,dy:0,base:'translateY(330px) scale(.8)'});
    for(const id of ['sMenu','sInfo']){const e=$(id);e.style.opacity=1;e.style.visibility='visible';e.style.transform='none';}
  }
  const ke=eio((t-23.55)/.55); $('end').style.clipPath='inset('+((1-ke)*100)+'% 0 0 0)'; $('end').style.visibility=t>=23.55?'visible':'hidden';
};
`;

export const html = () => page({ css, body, script, captions: [], brandColor: '#bdbdbd' });

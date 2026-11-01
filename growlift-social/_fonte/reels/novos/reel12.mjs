// Reel 12: "O seu cardápio, completo". Light, with an original chef mascot: the paper menu answers little; the
// customer wants to know more; a site shows photos, address and hours, and a button to order. Timed to
// narracao-12-eleven.mp3. Headings carry the words (no bottom captions).
import { MARK } from '../../pecas.mjs';
import { page, svgIcon, ICON, food } from './base.mjs';

export const DURATION = 27.2;
export const COVER = 16.2;

const INK = '#121826';
const BLUE = '#0865fe';

const css = `
body{background:#f4f6fa;color:${INK}}
.stripes{position:absolute;inset:0;background:repeating-linear-gradient(135deg,rgba(18,24,38,.035) 0 22px,transparent 22px 44px)}
.head{position:absolute;left:70px;right:70px;top:250px;text-align:center;font-weight:900;font-size:72px;line-height:1.08;letter-spacing:-.035em}
.head .box{background:${INK};color:#fff;padding:0 16px;border-radius:12px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.head .boxb{background:${BLUE};color:#fff;padding:0 16px;border-radius:12px}
.menu{position:absolute;left:300px;top:500px;width:580px;height:600px;background:#fffdf7;border:5px solid ${INK};border-radius:30px;box-shadow:14px 14px 0 ${INK};padding:40px 44px}
.menu h3{font-size:44px;font-weight:900;letter-spacing:.14em;text-align:center}
.menu .row{display:flex;align-items:center;gap:14px;margin-top:30px;font-size:32px;font-weight:700}
.menu .row i{flex:1;border-bottom:4px dotted rgba(18,24,38,.35);transform:translateY(-6px)}
.bub{position:absolute;z-index:30;background:#fff;border:4px solid ${INK};border-radius:22px;padding:14px 26px;font-size:36px;font-weight:800;white-space:nowrap;box-shadow:6px 6px 0 ${INK}}
.phone{position:absolute;left:390px;top:500px;width:560px;height:760px;background:#fff;border:6px solid ${INK};border-radius:64px;box-shadow:16px 16px 0 ${INK};overflow:hidden}
.ph-top{display:flex;justify-content:space-between;align-items:center;padding:56px 36px 18px;font-size:32px;font-weight:900}
.sec{margin:14px 30px 0;font-size:20px;font-weight:800;letter-spacing:.14em;color:#6a7385}
.grid2{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:12px 30px 0}
.map{margin:12px 30px 0;height:150px;border-radius:20px;border:3px solid #dce2ec;background:linear-gradient(90deg,#eef2f8 2px,transparent 2px) 0 0/44px 44px,linear-gradient(#eef2f8 2px,transparent 2px) 0 0/44px 44px,#f8fafc;position:relative;overflow:hidden}
.open{display:flex;align-items:center;gap:10px;margin:14px 30px 0;font-size:24px;font-weight:700;color:#4a5568}
.open b{width:14px;height:14px;border-radius:50%;background:#16a34a;display:inline-block}
.cta{margin:22px 30px 0;height:86px;border-radius:999px;background:${BLUE};color:#fff;display:flex;align-items:center;justify-content:center;gap:14px;font-size:32px;font-weight:800}
.ring{position:absolute;border:5px solid ${BLUE};border-radius:26px;pointer-events:none}
.toast{position:absolute;left:480px;top:1196px;background:${INK};color:#fff;border-radius:22px;padding:20px 26px;font-size:28px;font-weight:600;line-height:1.3;box-shadow:0 20px 40px -20px rgba(0,0,0,.5)}
.tap{position:absolute;width:80px;height:80px;border-radius:50%;background:rgba(18,24,38,.18);border:4px solid ${INK}}
#end{position:absolute;inset:0;background:${BLUE};color:#fff;z-index:45}
`;

// Original mascot: a round little chef with a tall toque and a blue neckerchief. Two arm poses (hold / point).
const chef = `
<svg id="chef" class="abs" width="380" height="520" viewBox="0 0 200 274" style="overflow:visible">
  <ellipse cx="100" cy="266" rx="70" ry="8" fill="rgba(18,24,38,.12)"/>
  <path d="M40 262c0-58 26-92 60-92s60 34 60 92z" fill="#ffffff" stroke="${INK}" stroke-width="5"/>
  <circle cx="100" cy="205" r="4.5" fill="${BLUE}"/><circle cx="100" cy="228" r="4.5" fill="${BLUE}"/>
  <path d="M74 170l26 22 26-22-8 26H82z" fill="${BLUE}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="100" cy="122" r="48" fill="#f4c9a4" stroke="${INK}" stroke-width="5"/>
  <path d="M56 86c-14-4-20-22-8-32 6-18 30-22 40-10 10-14 34-12 40 4 18-4 30 16 18 30-4 6-12 10-18 8H64c-3 0-6 0-8 0z" fill="#ffffff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M60 86h80v10H60z" fill="#ffffff" stroke="${INK}" stroke-width="5"/>
  <ellipse cx="84" cy="122" rx="6" ry="8" fill="${INK}"/><ellipse cx="116" cy="122" rx="6" ry="8" fill="${INK}"/>
  <circle cx="86" cy="119" r="2" fill="#fff"/><circle cx="118" cy="119" r="2" fill="#fff"/>
  <ellipse cx="72" cy="138" rx="8" ry="5" fill="#f08a7e" opacity=".6"/><ellipse cx="128" cy="138" rx="8" ry="5" fill="#f08a7e" opacity=".6"/>
  <path d="M88 142c6 9 18 9 24 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M84 150c8 4 24 4 32 0" stroke="${INK}" stroke-width="0" fill="none"/>
  <g id="armsHold">
    <path d="M52 200c-14 10-16 26-6 34 10 6 24-2 34-14" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M148 200c14 10 16 26 6 34-10 6-24-2-34-14" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
  </g>
  <g id="armsPoint" opacity="0">
    <path d="M52 200c-14 10-16 26-6 34 10 6 24-2 34-14" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M150 196c18-8 36-12 52-12" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>
    <path d="M150 196c18-8 36-12 52-12" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
    <circle cx="208" cy="183" r="10" fill="#f4c9a4" stroke="${INK}" stroke-width="5"/>
  </g>
</svg>`;

const body = `
<div class="stripes"></div>
<div id="h1" class="head">O cardápio de papel<br>fica no balcão.</div>
<div id="h2" class="head">Mas o seu cliente quer<br>saber <span id="h2b">muito mais.</span></div>
<div id="h3" class="head">E se ele visse tudo isso<br><span class="boxb">antes de sair de casa?</span></div>
<div id="h4" class="head">Fotos dos pratos.</div>
<div id="h5" class="head">Endereço e horário.</div>
<div id="h6" class="head">E um botão pra<br>pedir na hora.</div>
<div id="h7" class="head">Quem procura encontra<br><span id="h7b">tudo num lugar só.</span></div>
<div id="h8" class="head">Um site é o seu<br>cardápio, <span id="h8b">completo.</span></div>

<div id="menu" class="menu">
  <h3>CARDÁPIO</h3>
  <div class="row">Burger da casa<i></i></div>
  <div class="row">Batata<i></i></div>
  <div class="row">Refrigerante<i></i></div>
  <div class="row">Sobremesa<i></i></div>
  <div class="row">Combo<i></i></div>
</div>
<div id="b1" class="bub" style="left:110px;top:560px;transform:rotate(-5deg)">Tem entrega?</div>
<div id="b2" class="bub" style="left:690px;top:640px;transform:rotate(4deg)">Quanto custa?</div>
<div id="b3" class="bub" style="left:70px;top:800px;transform:rotate(3deg)">Onde fica?</div>
<div id="b4" class="bub" style="left:650px;top:1040px;transform:rotate(-4deg)">Tá aberto agora?</div>

<div id="phone" class="phone">
  <div class="ph-top"><span>Seu Restaurante</span>${svgIcon('<path d="M4 7h16M4 12h16M4 17h16"/>', 40, INK, 2.6)}</div>
  <div id="pPh"><div class="sec">FOTOS</div><div class="grid2">${food('burger', 154)}${food('fries', 154)}${food('drink', 154)}</div></div>
  <div id="pMap"><div class="sec">ONDE FICA</div><div class="map"><svg class="abs" style="left:0;top:0" width="490" height="150"><path d="M0 120C120 90 200 140 300 80S460 40 490 60" stroke="#c6d4ea" stroke-width="18" fill="none"/></svg><div class="abs" style="left:210px;top:30px">${svgIcon(ICON.pin, 70, BLUE, 2.4)}</div></div>
    <div class="open"><b></b>Aberto agora · 18h às 23h</div></div>
  <div id="pCta" class="cta">${svgIcon(ICON.chat, 38, '#fff', 2.4)}Pedir agora</div>
</div>
<div id="r1" class="ring" style="left:412px;top:616px;width:516px;height:204px"></div>
<div id="r2" class="ring" style="left:412px;top:826px;width:516px;height:262px"></div>
<div id="r3" class="ring" style="left:414px;top:1084px;width:512px;height:100px;border-radius:999px"></div>
<div id="tap" class="tap"></div>
<div id="toast" class="toast">Oi! Vi o cardápio de vocês<br>e quero fazer um pedido.</div>
<div id="chefW" class="abs" style="left:50px;top:930px">${chef}</div>
<div id="ilus" class="abs" style="right:90px;top:1290px;font-size:24px;font-weight:600;color:#6a7385">Exemplo ilustrativo</div>
<div id="spk" class="abs" style="left:900px;top:470px">${svgIcon('<path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" fill="#ffc94d" stroke="none"/>', 70)}</div>

<div id="end">
  <div class="abs" style="left:0;right:0;top:600px;text-align:center">
    <div style="width:200px;margin:0 auto;filter:brightness(0) invert(1)">${MARK}</div>
    <div style="font-size:120px;font-weight:900;letter-spacing:-.04em;margin-top:50px">Growlift</div>
    <div style="font-size:56px;font-weight:700;margin-top:18px;opacity:.92">Sites para restaurantes</div>
    <div style="display:inline-block;margin-top:60px;padding:24px 46px;border-radius:999px;background:#fff;color:${BLUE};font-size:40px;font-weight:800">Link na bio</div>
    <div style="font-size:32px;font-weight:600;margin-top:34px;opacity:.85">@growlift.ai · growlift.com.br</div>
  </div>
</div>
`;

const script = `
window.draw=(t)=>{
  const H=[['h1',0,2.42],['h2',2.42,9.1],['h3',9.1,12.2],['h4',12.2,13.6],['h5',13.6,15.2],['h6',15.2,17.4],['h7',17.4,20.4],['h8',20.4,23.55]];
  for(const [id,a,b] of H) show(id,t,a,b,{dy:30,fi:.3,fo:.2});
  const box=(id,a)=>{$(id).className=t>=a?'box':''};
  box('h2b',3.55); box('h7b',18.95); $('h8b').className=t>=22.6?'boxb':'';
  // Paper menu, then it turns into the phone
  show('menu',t,0.1,9.6,{pop:true,sc:.3,fi:.55,base:'rotate(-3deg)'});
  show('b1',t,5.08,9.3,{pop:true,sc:.5,base:'rotate(-5deg)'}); show('b2',t,6.04,9.3,{pop:true,sc:.5,base:'rotate(4deg)'});
  show('b3',t,7.0,9.3,{pop:true,sc:.5,base:'rotate(3deg)'}); show('b4',t,7.97,9.3,{pop:true,sc:.5,base:'rotate(-4deg)'});
  show('phone',t,9.5,23.55,{pop:true,sc:.25,fi:.6,dy:0}); show('ilus',t,9.8,23.55,{dy:0});
  show('pPh',t,12.27,23.55,{dy:30}); show('pMap',t,13.69,23.55,{dy:30}); show('pCta',t,15.28,23.55,{pop:true,sc:.4});
  // A tap on "Pedir agora" and the message it opens
  const tapK=(t>=16.2&&t<16.9)?1-Math.abs((t-16.55)/.35):0; const tp=$('tap'); tp.style.left='630px'; tp.style.top='1110px'; tp.style.opacity=Math.max(0,tapK); tp.style.transform='scale('+(.7+.3*Math.max(0,tapK))+')';
  show('toast',t,16.6,18.15,{pop:true,sc:.4});
  // "Tudo num lugar só": highlight each part in turn
  show('r1',t,17.9,18.7,{pop:true,sc:.1,dy:0,fi:.2}); show('r2',t,18.7,19.5,{pop:true,sc:.1,dy:0,fi:.2}); show('r3',t,19.5,20.4,{pop:true,sc:.1,dy:0,fi:.2});
  // Chef: holds the menu, then walks left and points at the phone
  const kc=show('chefW',t,0.3,23.55,{dy:80,fi:.5});
  const walk=eio((t-9.2)/.8); const bob=Math.sin(t*5)*6;
  $('chefW').style.transform='translate('+(-40*walk)+'px,'+((1-kc)*80+bob)+'px)';
  $('armsHold').style.opacity=t<9.4?1:0; $('armsPoint').style.opacity=t<9.4?0:1;
  show('spk',t,22.6,23.55,{pop:true,sc:.6,dy:0}); $('spk').style.transform+=' rotate('+(t*90)+'deg)';
  // End card: wipes in as a growing circle
  const ke=eio((t-23.55)/.6); $('end').style.clipPath='circle('+(ke*150)+'% at 50% 60%)'; $('end').style.visibility=t>=23.55?'visible':'hidden';
};
`;

export const html = () => page({ css, body, script, captions: [], brandColor: INK, theme: 'light' });

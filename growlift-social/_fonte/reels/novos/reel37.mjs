// Reel 37 (26/11): "13 anos de espera". Começa só sobre o GTA 6 (13 anos de espera, recordes, empresa que deu folga)
// e vira para o cliente: "pelo jogo o mundo espera; pelo seu negócio, ninguém espera". Diorama 3D próprio
// (diorama37.js: cidade de praia ao pôr do sol, fila de bonequinhos, escritório vazio) + celular e boneco em SVG.
// Nada do jogo: sem imagem, logo, fonte ou arte dele; o nome aparece só como notícia. Fatos: GTA V 2013, GTA 6 em
// 19/11/2026, recorde de pré-venda na PlayStation Store (Sony), empresa que deu folga (Folha PE).
// Tempos (T) provisórios: são ajustados pela transcrição da voz do Antônio (mix37.py).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { page, comentaBlock } from './base.mjs';
import { pessoa, MOOD } from './elenco.mjs';

export const DURATION = 36;
export const COVER = 4.2;
export const AUDIO = '../narracao-37-eleven.mp3';

// Momentos da fala (início de cada frase). Atualizados depois da voz.
export const T = {
  treze: 0.3, esperou: 2.2, trailer: 6.2, prevenda: 8.4, folga: 10.6, ninguem: 13.6, porque: 16.4, igual: 18.0,
  cliente: 20.6, cinco: 24.2, concorrente: 26.6, jogo: 29.0, segue: 32.0, fim: 36,
};

const HERE = path.dirname(fileURLToPath(import.meta.url));
const bundle = () =>
  buildSync({ entryPoints: [path.join(HERE, 'diorama37.js')], bundle: true, format: 'iife', write: false, minify: true, logLevel: 'error', absWorkingDir: path.resolve(HERE, '../../../..') }).outputFiles[0].text;

const css = `
body{background:#120a24}
#gl{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:1}
#hud{position:absolute;inset:0;z-index:15;visibility:hidden;pointer-events:none}
#map{position:absolute;left:60px;bottom:230px;width:250px;height:250px;border-radius:50%;border:6px solid rgba(0,0,0,.65);background:radial-gradient(circle at 50% 50%,#3d6b5a 0 6%,#2b3a55 7% 100%);overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.5)}
#map i{position:absolute;left:50%;top:50%;width:0;height:0;border-left:16px solid transparent;border-right:16px solid transparent;border-bottom:30px solid #fff;transform:translate(-50%,-60%)}
#map b{position:absolute;height:14px;background:#6b6f8a;left:-20px;right:-20px}
#map u{position:absolute;width:20px;height:20px;border-radius:50%;background:#ffd36b;border:3px solid #000}
#money{position:absolute;right:60px;top:240px;font-size:64px;font-weight:900;color:#7dffa0;letter-spacing:.02em;text-shadow:3px 3px 0 #000,-2px -2px 0 #000;font-variant-numeric:tabular-nums}
#mission{position:absolute;left:60px;right:60px;top:1240px;text-align:center}
#mission small{display:block;font-size:30px;font-weight:900;letter-spacing:.25em;color:#ffd36b;text-shadow:2px 2px 0 #000}
#mission b{display:block;font-size:56px;font-weight:900;color:#fff;margin-top:8px;text-shadow:3px 3px 0 #000}
#vig{position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(110% 70% at 50% 48%,rgba(0,0,0,0) 50%,rgba(10,4,24,.75) 100%)}
.big{position:absolute;left:0;right:0;text-align:center;z-index:20;visibility:hidden;color:#fff;font-weight:900;letter-spacing:-.05em}
#n13{top:420px;font-size:520px;line-height:1;text-shadow:-10px 0 rgba(255,60,140,.85),10px 0 rgba(40,220,255,.85),0 20px 80px rgba(0,0,0,.6)}
#ano{top:300px;font-size:190px;font-variant-numeric:tabular-nums;text-shadow:0 10px 50px rgba(0,0,0,.55)}
#ano small{display:block;font-size:40px;letter-spacing:.3em;font-weight:800;color:#ffd0e6;margin-top:10px}
.stat{position:absolute;left:70px;right:70px;z-index:20;visibility:hidden;padding:30px 36px;border-radius:34px;background:rgba(20,8,40,.78);border:2px solid rgba(255,120,190,.5);box-shadow:0 30px 80px -30px #000;color:#fff}
.stat small{display:block;font-size:30px;font-weight:700;color:#ffb3d6;letter-spacing:.04em}
.stat b{display:block;font-size:76px;font-weight:900;letter-spacing:-.03em;line-height:1.05;margin-top:6px}
.stat i{font-style:normal;color:#ffd36b}
#s1{top:330px}#s2{top:600px}
#folga{position:absolute;left:70px;right:70px;top:330px;z-index:20;visibility:hidden;text-align:center}
#folga span{display:inline-block;padding:18px 34px;border-radius:999px;background:#ffd36b;color:#1a1030;font-size:46px;font-weight:900}
#black{position:absolute;inset:0;z-index:30;background:#000;visibility:hidden}
#pq{top:860px;font-size:110px;z-index:31}
#scene2{position:absolute;inset:0;z-index:25;visibility:hidden;background:radial-gradient(90% 60% at 50% 40%,#1b2a52,#070b18 75%)}
#phone{position:absolute;left:300px;top:420px;width:560px;height:1060px;border-radius:70px;border:14px solid #161a26;background:#0b141a;box-shadow:0 0 0 3px #2c3446,0 60px 120px -30px #000;overflow:hidden}
#phone .hd{height:150px;background:#1f2c34;display:flex;align-items:flex-end;padding:0 30px 24px;gap:18px;color:#e9edef}
#phone .hd i{width:62px;height:62px;border-radius:50%;background:#53bdeb;display:block}
#phone .hd b{font-size:30px}#phone .hd small{display:block;font-size:22px;color:#8696a0;font-weight:500}
.msg{position:absolute;left:28px;max-width:420px;padding:18px 22px;border-radius:22px 22px 22px 6px;background:#202c33;color:#e9edef;font-size:30px;line-height:1.3;visibility:hidden}
.msg small{display:block;text-align:right;font-size:20px;color:#8696a0;margin-top:6px}
#m1{top:240px}
#clock{position:absolute;right:28px;top:200px;z-index:2;padding:12px 22px;border-radius:999px;background:#ff3b30;color:#fff;font-size:30px;font-weight:900;font-variant-numeric:tabular-nums;visibility:hidden}
#seen{position:absolute;left:28px;right:28px;bottom:40px;text-align:center;font-size:26px;color:#8696a0;visibility:hidden}
#cli{position:absolute;left:-30px;top:980px;z-index:3}
#rival{position:absolute;left:40px;top:560px;width:250px;height:470px;border-radius:44px;border:10px solid #161a26;background:#0b141a;visibility:hidden;box-shadow:0 0 60px rgba(47,255,160,.45)}
#rival div{position:absolute;left:16px;right:16px;top:70px;padding:14px;border-radius:18px;background:#005c4b;color:#fff;font-size:22px;line-height:1.3}
#rival small{position:absolute;left:0;right:0;bottom:26px;text-align:center;color:#8ef0c4;font-size:22px;font-weight:800}
#tag{position:absolute;left:0;right:0;top:300px;text-align:center;z-index:26;visibility:hidden}
#tag span{display:inline-block;padding:14px 30px;border-radius:999px;background:rgba(0,0,0,.6);border:2px solid rgba(255,255,255,.2);color:#fff;font-size:40px;font-weight:900}
#split{position:absolute;inset:0;z-index:27;visibility:hidden;display:grid;grid-template-rows:1fr 1fr}
#split div{display:flex;align-items:flex-end;justify-content:center;padding-bottom:60px;font-size:64px;font-weight:900;color:#fff;letter-spacing:-.03em;text-shadow:0 8px 40px rgba(0,0,0,.8)}
#split .a{background:linear-gradient(180deg,rgba(255,79,139,.0),rgba(255,79,139,.35))}
#split .b{background:linear-gradient(180deg,rgba(7,11,24,.88),#070b18)}
#split .b em{font-style:normal;color:#ff5a5a}
#dim{position:absolute;inset:0;z-index:44;background:rgba(8,6,20,.94);visibility:hidden}
#nota{position:absolute;left:60px;right:60px;bottom:200px;z-index:47;text-align:center;font-size:21px;font-weight:600;color:#9a90b5;visibility:hidden}
#cap{top:1480px!important}
`;

const body = `
<canvas id="gl" width="1080" height="1920"></canvas>
<div id="vig"></div>
<div id="hud"><div id="map"><b style="top:40%"></b><b style="top:70%;transform:rotate(30deg)"></b><u style="left:65%;top:22%"></u><i></i></div><div id="money">$<span id="mon">0</span></div><div id="mission"><small>NOVA MISSÃO</small><b>Esperar 13 anos</b></div></div>
<div id="n13" class="big">13</div>
<div id="ano" class="big"><span id="anoN">2013</span><small>ESPERANDO…</small></div>
<div id="s1" class="stat"><small>TRAILER</small><b>Recorde de <i>visualizações</i></b></div>
<div id="s2" class="stat"><small>PLAYSTATION STORE</small><b>Maior <i>pré-venda</i> da história</b></div>
<div id="folga"><span>Empresa deu folga pra jogar 🎮</span></div>
<div id="scene2">
  <div id="rival"><div>Oi! Faço sim, posso ir amanhã às 9h 👍</div><small>CONCORRENTE · respondeu em 2 min</small></div>
  <div id="phone"><div class="hd"><i></i><div><b>Seu negócio</b><small>visto por último hoje às 18:02</small></div></div>
    <div id="m1" class="msg">Quanto fica o orçamento? Preciso pra amanhã<small>23:04</small></div>
    <div id="clock">⏱ <span id="ck">0 min</span></div>
    <div id="seen">Sem resposta</div></div>
  <div id="cli">${pessoa('cl', { skin: '#d9a07a', hair: '#2b2118', hairStyle: 'curto', shirt: '#ff7a3d', size: 380 })}</div>
</div>
<div id="tag"><span id="tagT"></span></div>
<div id="split"><div class="a">Pelo jogo, o mundo espera.</div><div class="b">Pelo seu negócio,&nbsp;<em>ninguém.</em></div></div>
<div id="black"></div>
<div id="pq" class="big">Sabe por quê?</div>
<div id="dim"></div>
${comentaBlock('Quer responder seu cliente na hora?', 'RESPOSTA', 'dark', 440, 'Segue e comenta')}
<div id="nota">GTA é marca da Rockstar Games / Take-Two. A Growlift não tem relação com elas. Cenas ilustrativas, feitas pela Growlift.<br>Seguir é opcional: o presente vale pra todo mundo que comentar.</div>
`;

const script = `
window.MOTION=2;
${MOOD}
const T=${JSON.stringify(T)};
const L=(a,b,x)=>a+(b-a)*x;
const C=(p,l,f)=>({pos:p,look:l,fov:f});
// câmeras: cidade do alto → descendo na loja → fila → escritório (x=120) → fila longe → caixa única (x=-120)
function cam(t){
  const k=(a,b)=>eioS(clamp((t-a)/(b-a)));
  if(t<T.esperou){const cx=-40+t*9;return C([cx-12,2.4,9.6],[cx+10,1.6,6.6],44);}
  if(t<T.trailer){const x=k(T.esperou,T.trailer);return C([L(-30,10,x),L(40,22,x),L(60,34,x)],[0,4,-10],42);}
  if(t<T.folga){const x=k(T.trailer,T.folga);return C([L(10,4,x),L(9,5,x),L(18,10,x)],[0,4,-6],38);}
  if(t<T.ninguem){const x=k(T.folga,T.ninguem);return C([120+L(-12,8,x),9,L(16,12,x)],[120,1.5,-2],44);}
  if(t<T.porque){const x=k(T.ninguem,T.porque);return C([L(-20,-26,x),L(5,9,x),L(26,30,x)],[4,1,-2],34);}
  if(t<T.jogo)return C([-120,3,L(14,8,k(T.igual,T.cliente))],[-120,2.6,0],36);
  return C([-20,4,22],[2,1.5,-3],34);
}
function show2(id,t,a,b,o){return show(id,t,a,b,o);}
window.draw=(t)=>{
  const only=t>=T.porque&&t<T.jogo;
  window.cena37(t,{carX:t<T.esperou?-40+t*9+1.5:200,cam:cam(t),queueWave:1,officeLights:t<T.folga+0.8?1:Math.max(0,1-(t-T.folga-0.8)/0.6),chairsSpin:t>=T.folga?(t-T.folga)*1.6:0,glow:t>=T.igual?eoS(clamp((t-T.igual)/.6)):0,only});
  // HUD de jogo genérico na abertura
  show('hud',t,0,T.esperou,{dy:0,fi:.2});
  $('mon').textContent=Math.floor(t*4300).toLocaleString('en-US');
  // 13 gigante
  show('n13',t,T.treze+0.6,T.esperou,{sc:.06,dy:0});
  $('n13').style.transform+=' translateX('+(Math.sin(t*40)*(t<T.treze+.4?8:0))+'px)';
  // ano subindo 2013 → 2026
  show('ano',t,T.esperou,T.trailer,{dy:20});
  $('anoN').textContent=String(2013+Math.min(13,Math.floor(clamp((t-T.esperou-.3)/(T.trailer-T.esperou-1.2))*13)));
  show('s1',t,T.trailer,T.folga,{x:-60,dy:0});
  show('s2',t,T.prevenda,T.folga,{x:60,dy:0});
  show('folga',t,T.folga+.2,T.ninguem,{dy:20,sc:.05});
  // "Sabe por quê?": preto
  show('black',t,T.porque,T.igual,{dy:0,fi:.15});
  show('pq',t,T.porque+.15,T.igual,{dy:0,sc:.05});
  // celular e cliente
  const s2=show('scene2',t,T.cliente,T.jogo,{dy:0,fi:.3});
  show('m1',t,T.cliente+.4,undefined,{dy:20});
  show('clock',t,T.cinco-.2,undefined,{dy:0,sc:.05});
  const mins=t<T.cinco?0:t<T.cinco+.9?5:t<T.cinco+1.8?20:60;
  $('ck').textContent=mins>=60?'1 hora':mins+' min';
  show('seen',t,T.cinco+1.8,undefined,{dy:0});
  show('rival',t,T.concorrente,undefined,{x:-60,dy:0});
  mood('cl',t<T.cinco?'happy':t<T.concorrente?'sad':'happy');
  $('cli').style.transform='translateX('+(t>=T.concorrente?-1*eoS(clamp((t-T.concorrente)/.5))*40:0)+'px) scaleX('+(t>=T.concorrente+.3?-1:1)+')';
  $('tagT').textContent=t<T.concorrente?'23:04 · a mensagem chega':'Ele fechou com outro';
  show('tag',t,T.cliente+.2,T.jogo,{dy:0});
  show('split',t,T.jogo,T.segue,{dy:0,fi:.3});
  // final
  show('dim',t,T.segue-.1,undefined,{dy:0,fi:.4});
  if(t>=T.segue-.1)comenta(t,T.segue,T.segue+1.4,'RESPOSTA');
  show('nota',t,T.segue+1.0,undefined,{dy:0});
};
`;

export const html = (caps = []) => {
  const p = page({ css, body, script, captions: caps, brandColor: '#f0e6ff' });
  const b = bundle();
  return p.replace('<script>', () => `<script>${b}</script><script>`);
};

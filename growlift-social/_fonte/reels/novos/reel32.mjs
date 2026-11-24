// Reel 32 (22/11): "O balão". Tension hook like the reference Antônio sent (a balloon about to be popped by a needle,
// filmed like a macro lens with a frame countdown), rebuilt as our own 3D (diorama32.js): we do not use any frame of
// the third-party video. Then the reveal: "você está olhando um balão há X segundos" (real time of the video), "um
// balão que nem existe" (the wireframe), "e você continua aqui, esperando ele estourar"; the bridge: "agora imagina se
// fosse o seu negócio" with a phone showing a site, a 3D menu and the store app (example screens), the pop, and the end
// "Comenta PLANO" (gift: the free diagnosis + plan on growlift.com.br). No narration: sound made in code (som32.py).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { page, comentaBlock } from './base.mjs';

export const DURATION = 27;
export const COVER = 5.6;
export const AUDIO = '../som-32.mp3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const bundle = () =>
  buildSync({ entryPoints: [path.join(HERE, 'diorama32.js')], bundle: true, format: 'iife', write: false, minify: true, logLevel: 'error', absWorkingDir: path.resolve(HERE, '../../../..') }).outputFiles[0].text;
const img = (f) => `data:image/jpeg;base64,${fs.readFileSync(path.join(HERE, 'img32', f)).toString('base64')}`;

const css = `
body{background:#050302}
#gl{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:1}
#vig{position:absolute;inset:0;background:radial-gradient(120% 75% at 50% 45%,rgba(0,0,0,0) 55%,rgba(0,0,0,.55) 100%);pointer-events:none;z-index:2}
#flash{position:absolute;inset:0;background:#fff3e8;z-index:20;opacity:0}
.brandmark{color:#f1e7e0}
#hud{position:absolute;inset:0;z-index:25;pointer-events:none;font-family:ui-monospace,Menlo,Consolas,monospace;color:#f1e7e0;visibility:hidden}
#hud .tl{position:absolute;left:84px;top:236px;font-size:26px;letter-spacing:.06em;display:flex;align-items:center;gap:12px}
#hud .tl i{width:14px;height:14px;border-radius:50%;background:#ff3b1f;box-shadow:0 0 14px #ff3b1f}
#hud .tr{position:absolute;right:84px;top:236px;font-size:24px;letter-spacing:.12em;color:#cbbfb6}
#hud .br{position:absolute;width:70px;height:70px;border-color:rgba(255,255,255,.75);border-style:solid;border-width:0}
#hud .c1{left:60px;top:290px;border-left-width:3px;border-top-width:3px}#hud .c2{right:60px;top:290px;border-right-width:3px;border-top-width:3px}
#hud .c3{left:60px;bottom:250px;border-left-width:3px;border-bottom-width:3px}#hud .c4{right:60px;bottom:250px;border-right-width:3px;border-bottom-width:3px}
#hud .ct{position:absolute;left:0;right:0;top:1350px;text-align:center}
#hud .ct small{display:block;font-family:Inter,sans-serif;font-size:24px;font-weight:700;letter-spacing:.24em;color:#d9cdc4}
#hud .ct b{display:block;font-size:150px;font-weight:800;letter-spacing:.04em;line-height:1;margin-top:8px;font-variant-numeric:tabular-nums;color:#fff;text-shadow:0 10px 40px rgba(0,0,0,.6)}
#hud .ct b.hot{color:#ff6a2b}
#hook{position:absolute;left:70px;right:70px;top:420px;z-index:30;text-align:center;font-weight:900;font-size:82px;line-height:1.04;letter-spacing:-.035em;color:#fff;text-shadow:0 10px 40px rgba(0,0,0,.7);visibility:hidden}
#hook em{font-style:normal;color:#ff6a2b}
#watch{position:absolute;left:50%;top:150px;z-index:40;transform:translateX(-50%);display:flex;align-items:center;gap:14px;padding:12px 26px;border-radius:999px;background:rgba(20,12,9,.72);border:1px solid rgba(255,255,255,.12);font-size:30px;font-weight:700;color:#d8cfc9;font-variant-numeric:tabular-nums;white-space:nowrap;visibility:hidden}
#watch i{width:14px;height:14px;border-radius:50%;background:#ff3b1f;box-shadow:0 0 18px #ff3b1f}
#watch b{color:#fff;font-weight:900}
#lineBg{position:absolute;left:0;right:0;top:1100px;bottom:0;z-index:29;background:linear-gradient(180deg,rgba(5,3,2,0),rgba(5,3,2,.85) 35%,rgba(5,3,2,.95));visibility:hidden}
.line{position:absolute;left:60px;right:60px;top:1380px;z-index:30;text-align:center;visibility:hidden}
.line p{font-size:52px;font-weight:800;color:#eee4dd;letter-spacing:-.02em;line-height:1.15}
.line b{display:block;margin-top:10px;font-size:104px;font-weight:900;letter-spacing:-.045em;color:#fff;font-variant-numeric:tabular-nums;line-height:1.02}
.line b em{font-style:normal;color:#ff6a2b}
#meta{position:absolute;left:84px;bottom:270px;z-index:30;font-family:ui-monospace,Menlo,monospace;font-size:22px;line-height:1.6;color:#ff9a6a;opacity:.85;visibility:hidden}
#dimBg{position:absolute;inset:0;z-index:3;background:rgba(5,3,2,.78);visibility:hidden}
#title{position:absolute;left:60px;right:60px;top:250px;z-index:30;text-align:center;font-size:74px;font-weight:900;letter-spacing:-.035em;line-height:1.06;color:#fff;visibility:hidden}
#title em{font-style:normal;color:#ff6a2b}
#phone{position:absolute;left:250px;top:520px;width:580px;height:1120px;z-index:30;border-radius:74px;border:14px solid #1b1716;background:#0f0b0a;box-shadow:0 0 0 3px #3a302c,0 60px 120px -30px #000;visibility:hidden;overflow:hidden}
#island{position:absolute;left:50%;top:18px;transform:translateX(-50%);width:170px;height:46px;border-radius:30px;background:#000;z-index:9}
.scr{position:absolute;inset:0;visibility:hidden;border-radius:60px;overflow:hidden}
#sSite{background:#f3f7f8}
#sSite .hero{height:560px;background:linear-gradient(160deg,#0f8f86,#0b5d73);padding:120px 38px 0;color:#fff}
#sSite small{font-size:22px;font-weight:800;letter-spacing:.14em;opacity:.85}
#sSite h3{font-size:56px;line-height:1.02;font-weight:900;letter-spacing:-.03em;margin-top:16px}
#sSite .cta{margin-top:30px;display:inline-block;padding:18px 30px;border-radius:18px;background:#fff;color:#0b5d73;font-size:26px;font-weight:900}
#sSite .card{margin:28px 30px 0;padding:24px;border-radius:24px;background:#fff;box-shadow:0 14px 30px -18px rgba(0,0,0,.35);font-size:26px;font-weight:700;color:#12323a}
#sSite .card span{display:block;font-size:22px;color:#5b7480;font-weight:600;margin-top:6px}
#sMenu{background:radial-gradient(90% 60% at 50% 40%,#2a1610,#0f0b0a 70%)}
#sMenu .top{position:absolute;left:34px;right:34px;top:96px;display:flex;justify-content:space-between;align-items:center;color:#fff}
#sMenu .top b{font-size:30px}#sMenu .top span{font-size:22px;font-weight:700;color:#ffb48f;padding:6px 14px;border-radius:999px;background:rgba(255,106,43,.16)}
#sMenu img{position:absolute;left:20px;top:250px;width:512px}
#sMenu .card{position:absolute;left:26px;right:26px;bottom:34px;padding:26px 28px;border-radius:34px;background:rgba(24,18,16,.92);border:1px solid rgba(255,255,255,.1)}
#sMenu .card b{display:block;font-size:34px;color:#fff;font-weight:900}#sMenu .card p{font-size:23px;color:#bdb2ab;font-weight:600;margin-top:6px}
#sMenu .card div{margin-top:18px;padding:18px;border-radius:22px;background:#ff6a2b;color:#fff;font-size:27px;font-weight:900;text-align:center}
#sApp{background:#f4f6fa;padding:100px 26px 0}
#sApp .hd b{font-size:34px;color:#121826;display:block}#sApp .hd span{font-size:22px;color:#6b7384;font-weight:600}
#sApp .nums{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:22px}
#sApp .nums div{background:#fff;border-radius:22px;padding:18px;box-shadow:0 10px 24px -18px rgba(0,0,0,.4)}
#sApp .nums small{display:block;font-size:19px;color:#6b7384;font-weight:700}#sApp .nums b{font-size:44px;color:#121826;font-weight:900}
#sApp .ia{margin-top:22px;background:#fff;border-radius:24px;padding:20px;box-shadow:0 10px 24px -18px rgba(0,0,0,.4)}
#sApp .ia p{font-size:22px;font-weight:800;color:#0865fe}
.bb{display:flex;margin-top:12px;visibility:hidden}.bb.out{justify-content:flex-end}
.bb>div{max-width:88%;padding:14px 18px;border-radius:20px;font-size:23px;line-height:1.3;font-weight:600}
.bb.in>div{background:#121826;color:#fff;border-bottom-right-radius:6px}.bb.out>div{background:#e9efff;color:#10204a;border-bottom-left-radius:6px}
#tag{position:absolute;left:50%;top:1680px;z-index:30;transform:translateX(-50%);padding:14px 30px;border-radius:999px;background:#ff6a2b;color:#fff;font-size:34px;font-weight:900;white-space:nowrap;visibility:hidden}
#note{position:absolute;left:0;right:0;top:1765px;z-index:30;text-align:center;font-size:22px;font-weight:600;color:#a99d96;visibility:hidden}
#dim{position:absolute;inset:0;z-index:44;background:rgba(5,3,2,.92);visibility:hidden}
#cap{display:none}
`;

const body = `
<canvas id="gl" width="1080" height="1920"></canvas>
<div id="vig"></div>
<div id="flash"></div>
<div id="hud"><div class="tl"><i></i>REC <span id="tc">00:00:00:00</span></div><div class="tr" id="lens">LENTE 35MM</div>
  <div class="br c1"></div><div class="br c2"></div><div class="br c3"></div><div class="br c4"></div>
  <div class="ct"><small>QUADROS PARA O ESTOURO</small><b id="fr">210</b></div></div>
<div id="hook">Espera ele <em>estourar</em>…</div>
<div id="watch"><i></i>assistindo <b id="wn">0,0 s</b></div>
<div id="lineBg"></div>
<div id="L1" class="line"><p>Você está olhando um balão</p><b>há <em id="n1">7,0</em> segundos.</b></div>
<div id="L2" class="line"><p>Um balão que</p><b><em>nem existe.</em></b></div>
<div id="L3" class="line"><p>E você continua aqui,</p><b>esperando ele <em>estourar.</em></b></div>
<div id="meta">balao_latex.malha · 57.600 faces<br>agulha_aco.malha · animação 3D<br>sem câmera · sem balão de verdade</div>
<div id="dimBg"></div>
<div id="title"></div>
<div id="phone"><div id="island"></div>
  <div id="sSite" class="scr"><div class="hero"><small>CLÍNICA EXEMPLO</small><h3>Cuidando de você, com hora marcada.</h3><div class="cta">Agendar pelo WhatsApp</div></div>
    <div class="card">Horários desta semana<span>Seg a sex, 8h às 19h · Sáb, 8h às 12h</span></div><div class="card">Como chegar<span>Mapa, estacionamento e acessibilidade</span></div></div>
  <div id="sMenu" class="scr"><div class="top"><b>Cardápio</b><span>3D · gire o lanche</span></div><img src="${img('burger.jpg')}" alt=""><div class="card"><b>Smash da Casa</b><p>Pão brioche, blend, cheddar, alface e tomate</p><div>Ver na minha mesa (AR)</div></div></div>
  <div id="sApp" class="scr"><div class="hd"><b>Loja Exemplo</b><span>App da loja · clientes</span></div>
    <div class="nums"><div><small>Clientes</small><b>320</b></div><div><small>Sumidos 1 a 4 meses</small><b>111</b></div></div>
    <div class="ia"><p>✦ Torpedo com IA</p>
      <div id="a1" class="bb in"><div>O bacon não tá saindo, quero promoção hoje</div></div>
      <div id="a2" class="bb out"><div>Boa! Por quanto vai sair e até quando vale?</div></div>
      <div id="a3" class="bb in"><div>R$ 25, hoje e amanhã, delivery</div></div>
      <div id="a4" class="bb out"><div>Pronto, deixei a mensagem preparada ✓</div></div></div></div>
</div>
<div id="tag"></div>
<div id="note">Telas de exemplo · nomes e números fictícios</div>
<div id="dim"></div>
${comentaBlock('Quer um plano sob medida pro seu negócio?', 'PLANO', 'dark', 450, 'Comenta')}
`;

const script = `
window.MOTION=2;
const L=(a,b,x)=>a+(b-a)*x;
const C=(p,l,f)=>({pos:p,look:l,fov:f});
const SHOTS=[
  [0.0,C([0,0.0,9.4],[0,0.05,0],30)],
  [2.15,C([0,0.05,8.6],[0,0.1,0],30)],
  [2.2,C([0,1.66,0.92],[0,0.9,0],34)],
  [7.0,C([0,1.58,0.8],[0,0.9,0],34)],
  [10.6,C([0,1.56,0.78],[0,0.89,0],34)],
  [11.4,C([0.2,0.9,5.4],[0,0.2,0],32)],
  [13.6,C([0.25,0.9,5.0],[0,0.2,0],32)],
  [14.1,C([0,1.54,0.76],[0,0.88,0],34)],
  [21.9,C([0,1.5,0.72],[0,0.87,0],34)],
  [21.95,C([0,0.45,5.0],[0,0.35,0],31)],
  [22.6,C([0,0.42,4.6],[0,0.35,0],31)],
  [27,C([0,0.42,4.6],[0,0.35,0],31)],
];
function camAt(t){
  let i=0; while(i<SHOTS.length-1&&SHOTS[i+1][0]<=t)i++;
  const [ta,A]=SHOTS[i],[tb,B]=SHOTS[Math.min(i+1,SHOTS.length-1)];
  const k=(tb-ta)<0.1?1:eioS(clamp((t-ta)/(tb-ta)));
  const lp=(a,b)=>a.map((v,j)=>L(v,b[j],k));
  return {pos:lp(A.pos,B.pos),look:lp(A.look,B.look),fov:L(A.fov,B.fov,k)};
}
const fmt=(x)=>x.toFixed(1).replace('.',',');
const pad=(n,w=2)=>String(n).padStart(w,'0');
window.draw=(t)=>{
  const POP=22.6;
  // how deep the needle presses: touches at 2.6 s, then deeper and deeper, never through until the pop
  let press=t<2.6?0:t<7?0.3*eoS((t-2.6)/4.4):t<POP?0.3+0.55*clamp((t-7)/(POP-7)):1;
  const needleUp=t<2.6?0.06*(1-clamp(t/2.6)):0;
  const wire=t<10.6?0:t<11.4?eioS((t-10.6)/.8):t<13.6?1:t<14.1?1-eioS((t-13.6)/.5):0;
  const pop=t>=POP?t-POP:-1;
  const macro=t>=2.2&&!(t>=11.2&&t<13.9)&&t<21.95;
  const cam=camAt(t);
  if(t>POP&&t<POP+.45){const s=(1-(t-POP)/.45)*.02; cam.pos=[cam.pos[0]+Math.sin(t*95)*s,cam.pos[1]+Math.cos(t*80)*s,cam.pos[2]];}
  window.balao(t,{cam,press,needleUp,wire,pop,focus:macro?Math.hypot(cam.pos[0],cam.pos[1]-1,cam.pos[2]):6.1,aperture:macro?0.012:0.0015,maxblur:macro?0.018:0.006,hide:t>=POP+2.2});
  $('flash').style.opacity=t>=POP&&t<POP+.3?String(.6*(1-(t-POP)/.3)):'0';
  // HUD (0–7 s): timecode, lens, frame countdown to the pop
  show('hud',t,0.0,7.0,{dy:0,fi:.2});
  const f=Math.floor(t*30); $('tc').textContent='00:00:'+pad(Math.floor(t))+':'+pad(f%30);
  $('lens').textContent=t<2.2?'LENTE 35MM':'MACRO 100MM';
  const fr=Math.max(1,Math.round((7-t)*30)); const fe=$('fr'); fe.textContent=pad(fr,3); fe.className=fr<=40?'hot':'';
  show('hook',t,0.0,2.15,{dy:20,fi:.25});
  // the reveal
  $('wn').textContent=fmt(t)+' s';
  show('watch',t,7.0,16.2,{dy:-10,fi:.3,base:'translateX(-50%)'});
  show('lineBg',t,6.95,16.2,{dy:0,fi:.4});
  show('L1',t,7.1,10.6,{dy:30}); $('n1').textContent=fmt(Math.min(t,10.6));
  show('L2',t,11.0,13.6,{dy:30});
  show('meta',t,11.4,13.6,{dy:10});
  show('L3',t,13.9,16.2,{dy:30});
  // imagine: the phone
  show('dimBg',t,16.2,21.3,{dy:0,fi:.4});
  const ti=$('title');
  const tt=t<18.0?'Agora imagina se fosse<br><em>o seu negócio.</em>':'Site, cardápio e app<br>pra <em>prender a atenção.</em>';
  if(ti.dataset.t!==tt){ti.dataset.t=tt;ti.innerHTML=tt;}
  show('title',t,16.3,21.3,{dy:20});
  show('phone',t,16.7,21.3,{dy:60,fi:.6});
  show('sSite',t,16.9,18.5,{dy:0,fi:.25,x:60});
  show('sMenu',t,18.5,19.9,{dy:0,fi:.25,x:60});
  show('sApp',t,19.9,21.3,{dy:0,fi:.25,x:60});
  show('a1',t,20.05,undefined,{dy:12}); show('a2',t,20.4,undefined,{dy:12}); show('a3',t,20.7,undefined,{dy:12}); show('a4',t,21.0,undefined,{dy:12});
  const tag=$('tag'); const lab=t<18.5?'Site':t<19.9?'Cardápio 3D':'App da loja com IA';
  if(tag.dataset.l!==lab){tag.dataset.l=lab;tag.textContent=lab;}
  show('tag',t,17.0,21.3,{dy:20,base:'translateX(-50%)'});
  show('note',t,17.0,21.3,{dy:0});
  // ending
  show('dim',t,POP+1.0,undefined,{dy:0,fi:.5});
  comenta(t,POP+1.05,POP+2.0,'PLANO');
};
`;

export const html = () => {
  const p = page({ css, body, script, captions: [], brandColor: '#f1e7e0' });
  const b = bundle();
  return p.replace('<script>', () => `<script>${b}</script><script>`);
};

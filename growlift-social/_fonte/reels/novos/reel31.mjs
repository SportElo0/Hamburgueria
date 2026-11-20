// Reel 31 (20/11): "Você acabou de assistir um hambúrguer". Attention hook in the style Antônio sent (an object about
// to be cut, very slowly), then the reveal: the counter shows how long you have been watching, the burger bursts and
// comes back together inside a phone (a 3D menu), and the bridge to Growlift: 3D menus, sites and apps with AI made
// to stop the scroll. No narration: on-screen text + sound design (som-31.mp3, made in code by som31.py).
// 3D scene in diorama31.js. Gift for "3D": the link to the working example menu (cardapio-exemplo).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { page, comentaBlock, food } from './base.mjs';

export const DURATION = 23.6;
export const COVER = 6.2;
export const AUDIO = '../som-31.mp3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const bundle = () =>
  buildSync({ entryPoints: [path.join(HERE, 'diorama31.js')], bundle: true, format: 'iife', write: false, minify: true, logLevel: 'error', absWorkingDir: path.resolve(HERE, '../../../..') }).outputFiles[0].text;

const css = `
body{background:#0a0807}
#gl{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:1}
#bg{position:absolute;inset:0;background:radial-gradient(70% 45% at 50% 52%,#2a1610 0%,#0a0807 70%)}
#vig{position:absolute;inset:0;background:radial-gradient(120% 70% at 50% 48%,rgba(0,0,0,0) 55%,rgba(0,0,0,.6) 100%);pointer-events:none;z-index:2}
#flash{position:absolute;inset:0;background:#fff;z-index:20;opacity:0}
.brandmark{color:#f0e6df}
#watch{position:absolute;left:50%;top:150px;z-index:40;transform:translateX(-50%);display:flex;align-items:center;gap:14px;padding:12px 26px;border-radius:999px;background:rgba(20,14,12,.72);border:1px solid rgba(255,255,255,.12);font-size:30px;font-weight:700;color:#d8cfc9;font-variant-numeric:tabular-nums;white-space:nowrap}
#watch i{width:14px;height:14px;border-radius:50%;background:#ff4d2e;box-shadow:0 0 18px #ff4d2e}
#watch b{color:#fff;font-weight:900;min-width:3.2em;text-align:right}
#hook{position:absolute;left:70px;right:70px;top:300px;z-index:30;text-align:center;font-weight:900;font-size:84px;line-height:1.04;letter-spacing:-.035em;color:#fff;text-shadow:0 10px 40px rgba(0,0,0,.7);visibility:hidden}
#hook em{font-style:normal;color:#ff6a2b}
#impact{position:absolute;z-index:31;visibility:hidden;white-space:nowrap}
#impact span{display:inline-block;padding:8px 18px;border-radius:10px;background:#ff4d2e;color:#fff;font-size:26px;font-weight:900;letter-spacing:.02em}
#impact .br{position:absolute;width:150px;height:110px;left:-40px;top:58px;border:4px solid rgba(255,255,255,.85);border-image:linear-gradient(90deg,#fff 0 22%,transparent 22% 78%,#fff 78%) 1}
#lineBg{position:absolute;left:0;right:0;top:1080px;bottom:0;z-index:29;background:linear-gradient(180deg,rgba(10,8,7,0),rgba(10,8,7,.92) 28%,#0a0807 60%);visibility:hidden}
#line{position:absolute;left:60px;right:60px;top:1330px;z-index:30;text-align:center;visibility:hidden}
#line p{font-size:54px;font-weight:800;color:#e9e1dc;letter-spacing:-.02em;line-height:1.15}
#line b{display:block;margin-top:10px;font-size:112px;font-weight:900;letter-spacing:-.045em;color:#fff;font-variant-numeric:tabular-nums;line-height:1}
#line b em{font-style:normal;color:#ff6a2b}
#imag{position:absolute;left:60px;right:60px;top:250px;z-index:30;text-align:center;font-size:76px;font-weight:900;letter-spacing:-.035em;line-height:1.06;color:#fff;visibility:hidden}
#imag em{font-style:normal;color:#ff6a2b}
#phone{position:absolute;left:250px;top:470px;width:580px;height:1180px;z-index:3;border-radius:74px;border:14px solid #1b1716;box-shadow:0 0 0 3px #3a302c,0 60px 120px -30px #000,inset 0 0 0 2px rgba(255,255,255,.05);visibility:hidden;overflow:hidden}
#phone .bez{position:absolute;inset:0;border-radius:60px;background:radial-gradient(90% 60% at 50% 45%,rgba(255,106,43,.18),rgba(14,10,9,.0) 70%)}
#island{position:absolute;left:50%;top:18px;transform:translateX(-50%);width:170px;height:46px;border-radius:30px;background:#000;z-index:5}
#pTop{position:absolute;left:34px;right:34px;top:92px;z-index:4;display:flex;justify-content:space-between;align-items:center;color:#fff}
#pTop b{font-size:30px;font-weight:900}#pTop span{font-size:22px;font-weight:700;color:#ffb48f;padding:6px 14px;border-radius:999px;background:rgba(255,106,43,.16)}
#pCard{position:absolute;left:26px;right:26px;bottom:34px;z-index:4;padding:26px 28px;border-radius:34px;background:rgba(24,18,16,.92);border:1px solid rgba(255,255,255,.1)}
#pCard b{display:block;font-size:36px;color:#fff;font-weight:900}#pCard p{font-size:24px;color:#bdb2ab;font-weight:600;margin-top:6px}
#pCard .ar{margin-top:20px;display:flex;align-items:center;justify-content:center;gap:12px;padding:20px;border-radius:22px;background:#ff6a2b;color:#fff;font-size:28px;font-weight:900}
#p360{position:absolute;left:50%;top:790px;z-index:4;transform:translateX(-50%);font-size:22px;font-weight:800;color:#ffd7c4;letter-spacing:.12em}
.scr{position:absolute;inset:0;z-index:6;visibility:hidden;border-radius:60px;overflow:hidden}
#sSite{background:#f6f1ec}
#sSite .hero{height:520px;background:linear-gradient(160deg,#ff6a2b,#c2361a);padding:120px 38px 0;color:#fff}
#sSite .hero small{font-size:22px;font-weight:800;letter-spacing:.14em;opacity:.85}
#sSite .hero h3{font-size:58px;line-height:1;font-weight:900;letter-spacing:-.03em;margin-top:16px}
#sSite .hero div{margin-top:30px;display:inline-block;padding:18px 30px;border-radius:18px;background:#fff;color:#c2361a;font-size:26px;font-weight:900}
#sSite .row{display:flex;gap:16px;padding:30px 30px 0}
#sSite .row>div{flex:1;height:220px;border-radius:24px;overflow:hidden;box-shadow:0 14px 30px -18px rgba(0,0,0,.4)}#sSite .row svg{width:100%;height:100%}
#sSite .stars{padding:28px 30px 0;font-size:30px;font-weight:900;color:#1b1716}
#sChat{background:#0f0c0b;padding:110px 26px 0}
#sChat .hd{display:flex;align-items:center;gap:14px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.1)}
#sChat .hd i{width:56px;height:56px;border-radius:50%;background:#ff6a2b;display:grid;place-items:center;font-style:normal;color:#fff;font-weight:900;font-size:26px}
#sChat .hd b{font-size:28px;color:#fff;display:block}#sChat .hd span{font-size:20px;color:#a99d96;font-weight:700}
.bb{display:flex;margin-top:18px;visibility:hidden}.bb.out{justify-content:flex-end}
.bb>div{max-width:86%;padding:16px 22px;border-radius:24px;font-size:26px;line-height:1.3;font-weight:600}
.bb.in>div{background:#fff;color:#111;border-bottom-left-radius:8px}.bb.out>div{background:#ffd9c7;color:#3a1406;border-bottom-right-radius:8px}
#tag{position:absolute;left:50%;top:1680px;z-index:30;transform:translateX(-50%);padding:14px 30px;border-radius:999px;background:#ff6a2b;color:#fff;font-size:34px;font-weight:900;white-space:nowrap;visibility:hidden}
#dim{position:absolute;inset:0;z-index:44;background:rgba(10,8,7,.9);visibility:hidden}
#cap{display:none}
`;

const body = `
<div id="bg"></div>
<div id="phone"><div class="bez"></div><div id="island"></div>
  <div id="pTop"><b>Cardápio</b><span>3D · gire o lanche</span></div>
  <div id="p360">↻ ARRASTE PARA GIRAR</div>
  <div id="pCard"><b>Smash da Casa</b><p>Pão brioche, blend 160 g, cheddar, alface e tomate</p><div class="ar">Ver na minha mesa (AR)</div></div>
  <div id="sSite" class="scr"><div class="hero"><small>HAMBURGUERIA EXEMPLO</small><h3>O smash que você vai querer de novo.</h3><div>Pedir pelo WhatsApp</div></div><div class="row"><div>${food('burger',230)}</div><div>${food('fries',230)}</div></div><p class="stars">Peça pelo site ou WhatsApp</p></div>
  <div id="sChat" class="scr"><div class="hd"><i>A</i><div><b>Assistente · Loja Exemplo</b><span>online agora</span></div></div>
    <div id="c1" class="bb in"><div>Oi! Vocês entregam hoje à noite?</div></div>
    <div id="c2" class="bb out"><div>Entregamos sim, até às 23h! Quer ver o cardápio?</div></div>
    <div id="c3" class="bb in"><div>Quero!</div></div>
  </div>
</div>
<canvas id="gl" width="1080" height="1920"></canvas>
<div id="vig"></div>
<div id="flash"></div>
<div id="watch"><i></i>assistindo <b id="wn">0,0 s</b></div>
<div id="hook">Espera a faca <em>encostar</em>…</div>
<div id="impact"><span>quase encostando…</span><div class="br"></div></div>
<div id="lineBg"></div>
<div id="line"><p id="l1">Você acabou de assistir um hambúrguer</p><b id="l2">por <em id="ln">7,0</em> segundos.</b></div>
<div id="imag">Agora imagina se fosse<br>o <em>cardápio da sua loja.</em></div>
<div id="tag"></div>
<div id="dim"></div>
${comentaBlock('Quer ver um cardápio 3D funcionando?', '3D', 'dark', 470, 'Comenta')}
`;

const script = `
window.MOTION=2;
const L=(a,b,x)=>a+(b-a)*x;
const C=(p,l,f)=>({pos:p,look:l,fov:f});
// camera: wide → slow push-in on the tip of the knife → hold → burst → the phone framing
const SHOTS=[
  [0.0,C([0.4,3.0,9.6],[0,1.5,0],30)],
  [7.0,C([0.3,2.5,6.6],[0.02,1.15,0],30)],
  [11.0,C([0.28,2.45,6.2],[0.02,1.15,0],30)],
  [11.15,C([0.5,2.6,6.4],[0,1.7,0],32)],
  [12.6,C([0.6,3.2,8.6],[0,1.9,0],34)],
  [13.8,C([0,1.25,10.2],[0,0.62,0],28)],
  [23.6,C([0,1.25,10.2],[0,0.62,0],28)],
];
function camAt(t){
  let i=0; while(i<SHOTS.length-1&&SHOTS[i+1][0]<=t)i++;
  const [ta,A]=SHOTS[i],[tb,B]=SHOTS[Math.min(i+1,SHOTS.length-1)];
  const k=eioS(clamp((t-ta)/Math.max(.001,tb-ta)));
  const lp=(a,b)=>a.map((v,j)=>L(v,b[j],k));
  return {pos:lp(A.pos,B.pos),look:lp(A.look,B.look),fov:L(A.fov,B.fov,k)};
}
const fmt=(x)=>x.toFixed(1).replace('.',',');
window.draw=(t)=>{
  // knife: fast at first, then slower and slower, never touching (until 11.0, when it drops)
  let knife=1.80+3.6*Math.exp(-t*0.62);
  if(t>=11.0) knife=L(knife,-2.0,eoS((t-11.0)/0.14));
  if(t>=11.3) knife=99;
  const burst=t>=11.05?t-11.05:-1;
  const gather=t<12.55?0:eioS((t-12.55)/1.25);
  const press=t<11.0?clamp((t-5)/6)*.3:0;
  // shake on impact
  const cam=camAt(t); if(t>11.0&&t<11.5){const s=(1-(t-11)/.5)*.06; cam.pos=[cam.pos[0]+Math.sin(t*90)*s,cam.pos[1]+Math.cos(t*77)*s,cam.pos[2]];}
  const inPhone=t>=12.55;
  window.burger(t,{cam,knife,burst,gather,press,spin:inPhone?(t-12.55)*1.1:0,board:t<12.4?1:0,burgerScale:inPhone?L(1,0.6,gather):1,burgerPos:[0,0,0]});
  // flash
  $('flash').style.opacity=t>=11.0&&t<11.35?String(.55*(1-(t-11.0)/.35)):'0';
  // the watch counter (always the real time on screen)
  $('wn').textContent=fmt(t)+' s';
  show('watch',t,0.15,18.1,{dy:-10,fi:.3});
  // hook
  show('hook',t,0.0,6.95,{dy:20,fi:.25});
  // "1 frame para o impacto" next to the tip
  const ik=show('impact',t,5.6,7.0,{dy:0,fi:.2});
  if(ik){const p=window.burgerScreen(0.05,1.85,0); const el=$('impact'); el.style.left=(p.x+70)+'px'; el.style.top=(p.y-70)+'px';}
  // the reveal
  show('line',t,7.05,11.0,{dy:30}); show('lineBg',t,6.9,11.0,{dy:0,fi:.4});
  if(t>=7.05&&t<11){ $('l1').textContent=t<9.0?'Você acabou de assistir um hambúrguer':'E você continua assistindo.'; $('ln').textContent=fmt(t); }
  // imagine
  show('imag',t,12.0,13.75,{dy:30});
  // the phone with the 3D menu
  show('phone',t,12.75,18.1,{dy:60,fi:.6});
  show('pTop',t,13.2,undefined,{dy:10}); show('pCard',t,13.4,undefined,{dy:30}); show('p360',t,13.6,15.2,{dy:0,base:'translateX(-50%)'});
  const site=show('sSite',t,15.25,16.55,{dy:0,fi:.25,x:60});
  const chat=show('sChat',t,16.55,18.1,{dy:0,fi:.25,x:60});
  show('c1',t,16.75,undefined,{dy:14}); show('c2',t,17.2,undefined,{dy:14}); show('c3',t,17.65,undefined,{dy:14});
  // the 3D burger hides under the site and the chat screens
  $('gl').style.opacity=t>=15.3&&t<18.1?'0':'1';
  // the tag under the phone: what each screen is
  const tag=$('tag');
  const lab=t<15.25?'Cardápio 3D':t<16.55?'Site':'Atendimento com IA no WhatsApp';
  if(tag.dataset.l!==lab){tag.dataset.l=lab;tag.textContent=lab;}
  show('tag',t,13.8,18.1,{dy:20,base:'translateX(-50%)'});
  // headline over the phone
  const hd=$('imag');
  if(t>=13.75&&t<18.1){ hd.innerHTML='A gente faz isso pro<br><em>seu negócio.</em>'; show('imag',t,13.8,18.1,{dy:20}); }
  else if(t<13.75){ hd.innerHTML='Agora imagina se fosse<br>o <em>cardápio da sua loja.</em>'; }
  // ending
  show('dim',t,18.1,undefined,{dy:0,fi:.5});
  comenta(t,18.15,19.2,'3D');
};
`;

export const html = () => {
  const p = page({ css, body, script, captions: [], brandColor: '#f0e6df' });
  const b = bundle();
  return p.replace('<script>', () => `<script>${b}</script><script>`);
};

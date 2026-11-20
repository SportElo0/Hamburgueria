// Reel 25 (16/11): "O site da pousada". The Areia Clara concept site (fictitious inn, areia-clara/) recorded frame by
// frame on a phone (captura25.cjs) and edited to the narration narracao-25-eleven.mp3.
// The look follows the site, not the usual dark Growlift reel: sand, night and moss, Fraunces captions.
// Story: Friday 23:04, someone searches for an inn on the phone → the camera dives into the screen (full bleed) →
// the cover shrinks into a window while the reel pulls back into the phone (the same move, twice) → suites fan out as
// cards → the reel background follows the site's day (morning, afternoon, night) → the camera leans into the chat →
// a postcard stamped "projeto conceito" → "Comenta SITE".
// Frames: $R25_FRAMES/{c1,c2,c3,c5,c6,c7}/00000.jpg (1170×2532), made by captura25.cjs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { RUNTIME } from './base.mjs';
import { MARK } from '../../pecas.mjs';

export const DURATION = 32.0;
export const COVER = 12.4;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '../../../../areia-clara');
const FRAMES = process.env.R25_FRAMES || path.join(os.tmpdir(), 'r25-frames');
const url = (p) => pathToFileURL(p).href;
const siteImg = (f) => url(path.join(SITE, 'img', f));
const COUNTS = Object.fromEntries(['c1', 'c2', 'c3', 'c5', 'c6', 'c7'].map((c) => [c, fs.existsSync(path.join(FRAMES, c)) ? fs.readdirSync(path.join(FRAMES, c)).length : 1]));

// Captions synced to the narration (silences measured with ffmpeg silencedetect). *x* = italic accent.
const CAPS = [
  [2.24, 5.0, 'Alguém em São Paulo procura uma *pousada* pelo celular.'],
  [5.43, 6.95, 'Aí abre um site *assim.*'],
  [7.31, 9.0, 'A praia aparece *primeiro…*'],
  [9.16, 10.95, '…e a capa vira *janela.*'],
  [11.13, 13.55, 'As suítes chegam como *cartas* na mão.'],
  [13.77, 15.5, 'O dia passa na *tela:*'],
  [18.09, 19.2, 'Bateu uma *dúvida?*'],
  [19.25, 20.1, 'A assistente *responde*'],
  [20.12, 23.2, 'e já organiza o pedido de *cotação* para a equipe.'],
  [23.47, 25.75, 'Projeto *conceito* da Growlift,'],
  [25.8, 27.4, 'com uma pousada *fictícia.*'],
];
const capHtml = CAPS.map(([, , txt], i) => `<div class="cap" id="cap${i}">${txt.split(' ').map((w) => (/^\*.*\*$/.test(w) ? `<span class="w it">${w.slice(1, -1)}</span>` : `<span class="w">${w}</span>`)).join(' ')}</div>`).join('');

const css = `
@font-face{font-family:Fraunces;src:url("${url(path.join(SITE, 'fonts/fraunces-latin-full-normal.woff2'))}") format("woff2");font-weight:100 900;font-style:normal}
@font-face{font-family:Fraunces;src:url("${url(path.join(SITE, 'fonts/fraunces-latin-full-italic.woff2'))}") format("woff2");font-weight:100 900;font-style:italic}
@font-face{font-family:"Inter Tight";src:url("${url(path.join(SITE, 'fonts/inter-tight-latin-wght-normal.woff2'))}") format("woff2");font-weight:100 900}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden}
body{position:relative;font-family:"Inter Tight",system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:#0f1a1f;color:#18211d}
.abs{position:absolute}
#pre{position:absolute;left:-2000px;top:0;font-family:Fraunces}
#stars{position:absolute;inset:0;background-image:radial-gradient(rgba(242,236,226,.55) 1.3px,transparent 1.6px),radial-gradient(rgba(242,236,226,.35) 1px,transparent 1.3px);background-size:173px 211px,97px 131px;background-position:20px 40px,60px 10px;-webkit-mask-image:linear-gradient(#000 0%,rgba(0,0,0,.5) 55%,transparent 80%)}
#moon{position:absolute;left:190px;top:330px;width:700px;height:700px;border-radius:50%;background:radial-gradient(closest-side,rgba(226,176,100,.22),transparent 70%)}
#clock{position:absolute;left:0;right:0;top:560px;text-align:center;color:#f2ece2}
#clock .d{font-size:34px;font-weight:600;letter-spacing:.34em;text-transform:uppercase;color:#e2b064}
#clock .h{font-family:Fraunces;font-weight:300;font-size:300px;letter-spacing:-.04em;line-height:1;margin-top:18px;font-variant-numeric:lining-nums}
#clock .s{font-family:Fraunces;font-style:italic;font-weight:300;font-size:54px;color:rgba(242,236,226,.7);margin-top:26px}
#dev{position:absolute;left:0;top:0;transform-origin:50% 50%;z-index:10}
#scr{position:absolute;inset:0;overflow:hidden;background:#0f1a1f}
#rec{position:absolute;inset:0;width:100%;height:100%;display:block}
#hk{position:absolute;left:0;top:0;width:560px;height:1212px;transform-origin:0 0;background:#f6f3ee;font-family:"Inter Tight"}
#hk .sb{position:absolute;left:34px;right:34px;top:22px;display:flex;justify-content:space-between;font-size:21px;font-weight:700;color:#18211d}
#hk .q{position:absolute;left:24px;right:24px;top:84px;height:66px;border-radius:33px;background:#fff;border:1px solid #e3dccf;display:flex;align-items:center;gap:12px;padding:0 22px;font-size:24px;font-weight:500;color:#18211d;box-shadow:0 10px 24px -16px rgba(24,33,29,.35)}
#hk .caret{width:2px;height:28px;background:#187640;display:inline-block;margin-left:-8px}
#hk .r{position:absolute;left:24px;right:24px;height:150px;border-radius:22px;background:#fff;border:1px solid #ebe5da;display:flex;gap:18px;padding:22px;align-items:center}
#hk .r .t{width:106px;height:106px;border-radius:14px;background:#e7dccb;flex:none;object-fit:cover}
#hk .r .n{font-family:Fraunces;font-size:30px;letter-spacing:-.01em;color:#18211d}
#hk .r .m{font-size:18px;color:#545c56;margin-top:6px}
#hk .bar{height:16px;border-radius:8px;background:#ece6db;margin:8px 0}
#tap{position:absolute;width:90px;height:90px;margin:-45px 0 0 -45px;border-radius:50%;background:rgba(24,118,64,.25);border:3px solid rgba(24,118,64,.8);opacity:0}
.fan{position:absolute;width:300px;height:390px;margin:-195px 0 0 -150px;padding:14px 14px 54px;background:#faf7f2;border-radius:16px;box-shadow:0 40px 80px -30px rgba(24,33,29,.55);z-index:5;opacity:0}
.fan img{width:100%;height:100%;object-fit:cover;border-radius:8px;display:block}
.fan span{position:absolute;left:18px;bottom:14px;font-family:Fraunces;font-style:italic;font-size:26px;color:#24342b}
#band{position:absolute;left:0;right:0;top:0;height:600px;z-index:20;opacity:0}
#scrim{position:absolute;left:0;right:0;top:0;height:760px;z-index:20;background:linear-gradient(rgba(10,16,14,.72),rgba(10,16,14,.38) 55%,transparent);opacity:0}
.cap{position:absolute;left:70px;right:70px;top:250px;text-align:center;font-family:Fraunces;font-weight:400;font-size:80px;line-height:1.08;letter-spacing:-.025em;z-index:30;visibility:hidden}
.w{display:inline-block;will-change:transform,opacity,filter}
.w.it{font-style:italic;font-weight:350}
body[data-th="sand"] .cap{color:#18211d} body[data-th="sand"] .w.it{color:#187640}
body[data-th="night"] .cap{color:#f2ece2} body[data-th="night"] .w.it{color:#e2b064}
body[data-th="photo"] .cap{color:#fff;text-shadow:0 4px 30px rgba(0,0,0,.45)} body[data-th="photo"] .w.it{color:#f4d39b}
#demo{position:absolute;left:50%;top:462px;transform:translateX(-50%);z-index:31;padding:12px 26px;border-radius:999px;background:#24342b;color:#f2ece2;font-size:28px;font-weight:600;letter-spacing:.01em;white-space:nowrap;visibility:hidden}
#dayw{position:absolute;left:40px;right:40px;top:300px;text-align:center;font-family:Fraunces;font-style:italic;font-weight:350;font-size:118px;letter-spacing:-.03em;z-index:30;line-height:1}
#dayw span{display:inline-block;opacity:0}
#dayw .dot{font-style:normal;font-size:70px;margin:0 18px;vertical-align:middle}
body[data-th="sand"] #dayw{color:#187640} body[data-th="night"] #dayw{color:#e2b064}
.brand{position:absolute;left:84px;top:150px;display:flex;align-items:center;gap:14px;font-size:26px;font-weight:800;letter-spacing:.14em;z-index:60}
.brand svg{height:30px;width:auto}
body[data-th="sand"] .brand{color:#24342b} body[data-th="night"] .brand,body[data-th="photo"] .brand{color:#f2ece2}
.flag{position:absolute;right:60px;top:144px;z-index:60;padding:10px 20px;border-radius:999px;background:rgba(250,247,242,.92);border:1px solid rgba(24,33,29,.14);font-size:23px;font-weight:600;letter-spacing:.02em;color:#24342b;white-space:nowrap}
#pc{position:absolute;left:80px;top:640px;width:920px;height:620px;background:#faf7f2;border-radius:10px;box-shadow:0 60px 120px -40px rgba(24,33,29,.55),0 2px 0 rgba(24,33,29,.06);z-index:15;visibility:hidden}
#pc .ph{position:absolute;left:28px;top:28px;width:420px;height:564px;object-fit:cover;border-radius:4px}
#pc .div{position:absolute;left:474px;top:60px;bottom:60px;width:1px;background:rgba(24,33,29,.16)}
#pc .stamp{position:absolute;right:34px;top:32px;width:128px;height:156px;padding:8px;background:#fff;outline:3px dashed #d8ccb8;outline-offset:-3px;transform:rotate(3deg)}
#pc .stamp img{width:100%;height:100%;object-fit:cover;display:block}
#pc .pm{position:absolute;left:600px;top:96px;width:190px;height:190px;border-radius:50%;border:4px solid rgba(24,118,64,.85);color:rgba(24,118,64,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-weight:800;letter-spacing:.16em;font-size:19px;line-height:1.35;opacity:0}
#pc .pm b{display:block;font-family:Fraunces;font-style:italic;font-weight:400;letter-spacing:0;font-size:34px;margin:4px 0}
#pc .nm{position:absolute;left:506px;top:300px;font-family:Fraunces;font-size:66px;letter-spacing:-.025em;color:#18211d;line-height:1}
#pc .sub{position:absolute;left:508px;top:378px;font-family:Fraunces;font-style:italic;font-size:40px;color:#187640}
#pc .ln{position:absolute;left:506px;right:40px;height:1px;background:rgba(24,33,29,.22)}
#pc .lt{position:absolute;left:508px;font-family:Fraunces;font-style:italic;font-size:31px;color:#545c56}
#pc .gm{position:absolute;left:508px;bottom:40px;display:flex;align-items:center;gap:10px;font-size:20px;font-weight:800;letter-spacing:.14em;color:#24342b}
#pc .gm svg{height:22px;width:auto}
#cmt{position:absolute;left:60px;right:60px;top:520px;text-align:center;z-index:40;visibility:hidden}
#cmt .q{font-family:Fraunces;font-size:100px;line-height:1.04;letter-spacing:-.03em;color:#18211d}
#cmt .q i{font-weight:350;color:#187640}
#cmtC{font-family:Fraunces;font-style:italic;font-size:70px;color:#545c56;margin-top:70px}
#cmtK{position:relative;display:inline-block;margin-top:16px;font-size:140px;font-weight:800;letter-spacing:.02em;color:#fff;background:#187640;border-radius:40px;padding:4px 56px 14px;box-shadow:0 34px 70px -26px rgba(24,118,64,.9)}
#cmtR{position:absolute;inset:-14px;border-radius:52px;border:5px solid #187640;opacity:0}
#cmtF{margin:70px auto 0;width:840px;display:flex;align-items:center;gap:22px;padding:22px 26px;border-radius:999px;background:#fff;border:2px solid #e3dccf;box-shadow:0 30px 60px -30px rgba(24,33,29,.4)}
#cmtF .av{flex:none;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#e2b064,#187640)}
#cmtT{flex:1;text-align:left;font-size:42px;font-weight:700;color:#18211d}
#cmtS{flex:none;font-size:34px;font-weight:800;color:#187640}
`;

const body = `
<div id="pre">Aa <i>Aa</i> <b>Aa</b></div>
<div id="stars"></div><div id="moon"></div>
<div id="clock"><div class="d">Sexta-feira</div><div class="h">23:04</div><div class="s">e a viagem ainda sem lugar</div></div>
<div class="fan" id="f0"><img src="${siteImg('suite-mar-900.webp')}" alt=""><span>Suíte Mar</span></div>
<div class="fan" id="f1"><img src="${siteImg('suite-mata-900.webp')}" alt=""><span>Suíte Mata</span></div>
<div class="fan" id="f2"><img src="${siteImg('bangalo-900.webp')}" alt=""><span>Bangalô Jardim</span></div>
<div id="dev"><div id="scr">
  <img id="rec" alt="" src="${url(path.join(FRAMES, 'c1', '00000.jpg'))}">
  <div id="hk">
    <div class="sb"><span>23:04</span><span>●●● 82%</span></div>
    <div class="q"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#545c56" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><span id="qt"></span><span class="caret" id="caret"></span></div>
    <div class="r" id="r0" style="top:196px"><img class="t" src="${siteImg('praia-900.webp')}" alt=""><div><div class="n">Pousada Areia Clara</div><div class="m">Pé na areia · pousada fictícia</div></div></div>
    <div class="r" id="r1" style="top:366px"><div class="t"></div><div style="flex:1"><div class="bar" style="width:80%"></div><div class="bar" style="width:55%"></div></div></div>
    <div class="r" id="r2" style="top:536px"><div class="t"></div><div style="flex:1"><div class="bar" style="width:70%"></div><div class="bar" style="width:45%"></div></div></div>
    <div class="r" id="r3" style="top:706px"><div class="t"></div><div style="flex:1"><div class="bar" style="width:76%"></div><div class="bar" style="width:50%"></div></div></div>
    <div id="tap" style="left:280px;top:271px"></div>
  </div>
</div></div>
<div id="scrim"></div><div id="band"></div>
${capHtml}
<div id="demo">Nesta demonstração, nada é enviado</div>
<div id="dayw"><span id="d0">café</span><span class="dot" id="d0b">·</span><span id="d1">praia</span><span class="dot" id="d1b">·</span><span id="d2">fogueira</span></div>
<div id="pc">
  <img class="ph" src="${siteImg('praia-900.webp')}" alt="">
  <div class="div"></div>
  <div class="stamp"><img src="${siteImg('cafe-900.webp')}" alt=""></div>
  <div class="pm" id="pm">PROJETO<b>conceito</b>GROWLIFT</div>
  <div class="nm">Areia Clara</div>
  <div class="sub">pousada fictícia</div>
  <div class="lt" style="top:452px">um site de demonstração,</div><div class="ln" style="top:500px"></div>
  <div class="lt" style="top:516px">feito do zero.</div><div class="ln" style="top:564px"></div>
</div>
<div id="cmt">
  <p class="q">Quer um site assim<br>para a sua <i>pousada?</i></p>
  <p id="cmtC">Comenta</p>
  <div><span id="cmtK">SITE<span id="cmtR"></span></span></div>
  <div id="cmtF"><span class="av"></span><span id="cmtT">&nbsp;</span><span id="cmtS">Publicar</span></div>
</div>
<div class="brand">${MARK}GROWLIFT</div>
<div class="flag">Projeto conceito · pousada fictícia</div>`;

const script = `
window.MOTION=2;
const FR=${JSON.stringify(url(FRAMES))}, CNT=${JSON.stringify(COUNTS)}, CAPS=${JSON.stringify(CAPS.map(([a, b]) => [a, b]))};
const AR=2532/1170, lerp=(a,b,k)=>a+(b-a)*k;
// Device rect keys: x, y, w (screen), r (corner radius), b (bezel). P = phone, F = full bleed, Z = leaning into the chat.
const P={x:260,y:560,w:560,r:46,b:1}, F={x:0,y:-208.5,w:1080,r:0,b:0}, F2={x:-27,y:-267,w:1134,r:0,b:0}, Z={x:150,y:-115,w:780,r:62,b:1};
const KEYS=[[0,P],[5.05,P],[5.75,F],[9.8,F2],[10.9,P],[19.2,P],[19.95,Z],[24,Z]];
function rect(t){
  for(let i=0;i<KEYS.length-1;i++){const [a,A]=KEYS[i],[b,B]=KEYS[i+1];
    if(t<b){const k=(A===F&&B===F2)?(t-a)/(b-a):eioS((t-a)/(b-a));const o={};for(const p in A)o[p]=lerp(A[p],B[p],clamp(k));return o;}}
  return {...KEYS[KEYS.length-1][1]};
}
// Background colour keys.
const hex=(h)=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const BG=[[0,'#0f1a1f'],[9.4,'#0f1a1f'],[9.9,'#f2ece2'],[16.3,'#f2ece2'],[16.6,'#ead3b2'],[16.95,'#ead3b2'],[17.25,'#0f1a1f'],[18.05,'#0f1a1f'],[18.5,'#e7dccb'],[23.2,'#e7dccb'],[23.6,'#f2ece2'],[99,'#f2ece2']].map(([t,c])=>[t,hex(c)]);
function bg(t){for(let i=0;i<BG.length-1;i++){const [a,A]=BG[i],[b,B]=BG[i+1];if(t<b){const k=clamp((t-a)/(b-a));return A.map((v,j)=>Math.round(lerp(v,B[j],k)));}}return BG[BG.length-1][1];}
// Which recording plays, and from where.
function seq(t){
  if(t<5.0)return null;
  if(t<7.3)return ['c1',t-5.0];
  if(t<11.1)return ['c2',t-7.6];
  if(t<13.7)return ['c3',t-11.1];
  if(t<18.05)return ['c5',t-13.75];
  if(t<21.2)return ['c6',t-17.85];
  return ['c7',t-21.2];
}
const CUTS=[11.1,13.7,18.05,21.2];
const pend=[];
function setSrc(img,src){if(img.getAttribute('src')!==src){img.src=src;pend.push(img.decode().catch(()=>{}));}}
const caps=CAPS.map((c,i)=>({a:c[0],b:c[1],nx:CAPS[i+1]?CAPS[i+1][0]:99,el:$('cap'+i),ws:[...$('cap'+i).querySelectorAll('.w')]}));
function drawCaps(t){
  for(const c of caps){
    const vis=t>=c.a&&t<Math.min(c.b+.3,c.nx); c.el.style.visibility=vis?'visible':'hidden'; if(!vis)continue;
    const n=c.ws.length, stg=Math.min(.075,(c.b-c.a)*.45/n);
    const out=eoS((t-c.b)/.3);
    c.el.style.opacity=1-out; c.el.style.transform='translateY('+(-18*out)+'px)';
    c.ws.forEach((w,i)=>{const k=eoS((t-c.a-i*stg)/.5);w.style.opacity=k;w.style.transform='translateY('+((1-k)*34)+'px)';w.style.filter='blur('+((1-k)*8).toFixed(2)+'px)';});
  }
}
window.render=async(t)=>{
  const c=bg(t); document.body.style.background='rgb('+c.join(',')+')';
  const lum=(c[0]*.3+c[1]*.59+c[2]*.11)/255;
  const photo=t>=5.45&&t<9.95;
  document.body.dataset.th=photo?'photo':(lum>.5?'sand':'night');
  $('band').style.background='linear-gradient(rgb('+c.join(',')+') 82%,rgba('+c.join(',')+',0))';
  $('band').style.opacity=Math.max(clamp((t-9.85)/.25)*(1-clamp((t-10.95)/.3)),clamp((t-19.15)/.3)*(1-clamp((t-23.3)/.3)));
  $('scrim').style.opacity=clamp((t-5.3)/.4)*(1-clamp((t-9.9)/.4));
  // Night sky of the opening.
  const night=1-clamp((t-5.2)/.5); $('stars').style.opacity=night; $('moon').style.opacity=night;
  // Clock: there from the first frame, leaves as the phone rises.
  const ko=eoS((t-2.0)/.45);
  $('clock').style.opacity=1-ko; $('clock').style.transform='translateY('+(-120*ko)+'px) scale('+(1-.06*ko)+')';
  $('clock').querySelector('.s').style.opacity=eoS((t-.95)/.6);
  // Device.
  const R=rect(t), h=R.w*AR, dev=$('dev');
  let dy=0,op=1;
  if(t<2.85){dy=(1-eoS((t-2.0)/.85))*1500; op=t<2.0?0:1;}
  if(t>23.05){const k=eioS((t-23.05)/.5);dy=k*1100;op=1-k;}
  const phone=R.b, rot=phone*(.9*Math.sin(t*.8)), fl=phone*6*Math.sin(t*1.3);
  dev.style.width=R.w+'px';dev.style.height=h+'px';dev.style.left=R.x+'px';dev.style.top=R.y+'px';
  dev.style.opacity=op;dev.style.visibility=op>0?'visible':'hidden';
  dev.style.transform='translateY('+(dy+fl)+'px) rotate('+rot+'deg)';
  const bz=16*R.w/560;
  $('scr').style.borderRadius=R.r*R.w/560+'px';
  dev.style.borderRadius=(R.r*R.w/560+bz)+'px';
  dev.style.boxShadow='0 0 0 '+bz+'px rgba(17,22,20,'+R.b+'),0 0 0 '+(bz+2)+'px rgba(255,255,255,'+(.08*R.b)+'),0 60px 120px -30px rgba(10,16,14,'+(.55*R.b)+')';
  // Screen content: the search, then the recordings.
  const hk=$('hk'); hk.style.transform='scale('+(R.w/560)+')';
  hk.style.display=t<5.0?'block':'none';
  const qs='pousada pé na areia', n=Math.floor(clamp((t-2.65)/1.1)*qs.length);
  $('qt').textContent=qs.slice(0,n); $('caret').style.opacity=(n<qs.length||Math.floor(t*2.5)%2)?1:0;
  ['r0','r1','r2','r3'].forEach((id,i)=>show(id,t,3.9+i*.1,undefined,{dy:24,fi:.4}));
  const tk=clamp((t-4.5)/.45); $('tap').style.opacity=t>4.5&&t<5?String(Math.sin(tk*Math.PI)):'0'; $('tap').style.transform='scale('+(.6+.6*tk)+')';
  $('r0').style.background=t>4.7?'#eef4ee':'#fff';
  const s=seq(t), rec=$('rec');
  rec.style.visibility=s?'visible':'hidden';
  if(s){const [c,lt]=s;const i=Math.max(0,Math.min(CNT[c]-1,Math.floor(lt*30)));setSrc(rec,FR+'/'+c+'/'+String(i).padStart(5,'0')+'.jpg');}
  // Whip between recordings.
  let wf='none',wy=0;for(const tc of CUTS){const d=t-tc;if(Math.abs(d)<.13){const k=1-Math.abs(d)/.13;wf='blur('+(k*9).toFixed(1)+'px)';wy=(d<0?-1:1)*k*-70;}}
  rec.style.filter=wf;rec.style.transform='translateY('+wy+'px)';
  // Suites fan out like a hand of cards.
  const FAN=[[175,800,-13],[905,960,11],[170,1290,-6]];
  FAN.forEach(([x,y,r],i)=>{const k=eoS((t-11.3-i*.17)/.75),o=1-eioS((t-13.45)/.35),el=$('f'+i);
    el.style.opacity=t<11.3?0:Math.min(clamp(k*1.6),o);el.style.left=lerp(540,x,k)+'px';el.style.top=lerp(1150,y,k)+'px';el.style.transform='rotate('+lerp(0,r,k)+'deg) scale('+lerp(.7,1,k)+')';});
  // A day on the screen: café, praia, fogueira.
  const DW=[15.6,16.45,17.09]; $('dayw').style.visibility=t>=15.5&&t<18.3?'visible':'hidden';
  const dout=eoS((t-17.95)/.3);$('dayw').style.opacity=1-dout;
  DW.forEach((a,i)=>{const k=eoS((t-a)/.45),dim=i<2&&t>DW[i+1]?.38:1;const e=$('d'+i);e.style.opacity=k*dim;e.style.transform='translateY('+((1-k)*40)+'px)';e.style.filter='blur('+((1-k)*8).toFixed(1)+'px)';if(i<2)$('d'+i+'b').style.opacity=clamp((t-DW[i+1]+.15)/.3)*.5;});
  drawCaps(t);
  show('demo',t,20.6,23.25,{dy:16,base:'translateX(-50%)'});
  // Postcard with the "projeto conceito" postmark.
  const pc=$('pc'),pin=eoS((t-23.3)/.75),pout=eioS((t-27.35)/.55);
  pc.style.visibility=t>=23.3&&t<27.95?'visible':'hidden';
  pc.style.transform='translateY('+((1-pin)*1200-pout*1500)+'px) rotate('+(lerp(9,-2.5,pin)-pout*10)+'deg)';
  const pk=clamp((t-24.15)/.22),pm=$('pm');pm.style.opacity=t>24.15?.92:0;pm.style.transform='rotate(-14deg) scale('+(1.5-.5*eoS(pk))+')';
  pc.style.marginTop=(t>24.15&&t<24.4?Math.sin(clamp((t-24.15)/.25)*Math.PI)*8:0)+'px';
  // The ending.
  comenta(t,27.75,29.68,'SITE');
  await Promise.all(pend.splice(0));
};`;

export const html = () => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${css}</style></head><body data-th="night">
${body}
<script>${RUNTIME}${script}</script></body></html>`;

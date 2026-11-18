// Reel 28 (18/11): "O que acontece se você gritar no espaço?". Curiosity hook in the first 3 s, a true payoff
// (sound needs a medium; astronauts talk by radio), then the bridge: a message to a clinic at 23h that nobody answers
// is like shouting in space; in the demo, the assistant answers, offers times and reserves, and the team confirms.
// 3D space scene in diorama28.js (astronaut, Earth with night lights, sound rings that die, radio arcs).
// Legal review of 18/11 applied (demo framing, "um meio, como o ar", "a equipe confirma depois").
// Timed to narracao-28-eleven.mp3 (42.1 s).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { page, comentaBlock } from './base.mjs';

export const DURATION = 44.2;
export const COVER = 1.3;

const HERE = path.dirname(fileURLToPath(import.meta.url));

const SEG = [
  [2.93, 3.52, 'Nada.', 'Nada.'],
  [3.77, 4.71, 'Ninguém ouve.', 'Ninguém'],
  [5.15, 7.13, 'O som precisa de um meio pra andar,', 'meio'],
  [7.42, 7.92, 'como o ar.', 'ar.'],
  [8.42, 10.4, 'E lá fora quase não tem nada.', 'nada.'],
  [10.88, 13.32, 'É por isso que astronauta conversa por rádio:', 'rádio:'],
  [13.66, 16.35, 'a voz vira sinal e chega do outro lado.', 'sinal'],
  [16.97, 20.81, 'Agora imagina uma mensagem chegando numa clínica às onze da noite.', 'onze'],
  [21.41, 22.77, 'Oi, tem horário amanhã?', ''],
  [23.37, 24.52, 'Se ninguém responde…', 'ninguém'],
  [25.0, 26.58, 'é como gritar no espaço.', 'espaço.'],
  [27.14, 29.97, 'Na demonstração da assistente da Growlift no WhatsApp,', 'demonstração'],
  [30.2, 31.89, 'a mensagem tem quem responda:', 'responda:'],
  [32.3, 34.6, 'ela responde com as informações da clínica,', 'informações'],
  [34.82, 36.66, 'oferece horários e reserva.', 'reserva.'],
  [37.01, 38.73, 'E a equipe confirma depois.', 'equipe'],
];
function toCaps(seg) {
  const out = [];
  seg.forEach(([a, b, text, hl], i) => {
    const words = text.split(' ');
    const chunks = [];
    for (let k = 0; k < words.length; ) {
      let n = Math.min(3, words.length - k);
      if (words.length - k === 4) n = 2;
      chunks.push(words.slice(k, k + n).join(' '));
      k += n;
    }
    const total = chunks.reduce((s, c) => s + c.length, 0);
    const end = i + 1 < seg.length ? Math.min(seg[i + 1][0], b + 0.4) : b + 0.4;
    let t = a;
    chunks.forEach((c, j) => {
      const d = ((b - a) * c.length) / total;
      const words2 = c.split(' ');
      const h = hl.split(' ').filter((w) => w && words2.includes(w)).join(' ');
      out.push([+t.toFixed(2), +(j === chunks.length - 1 ? end : t + d).toFixed(2), c, h && c.includes(h) ? h : '']);
      t += d;
    });
  });
  return out;
}
const CAPS = toCaps(SEG);

const bundle = () =>
  buildSync({ entryPoints: [path.join(HERE, 'diorama28.js')], bundle: true, format: 'iife', write: false, minify: true, logLevel: 'error', absWorkingDir: path.resolve(HERE, '../../../..') }).outputFiles[0].text;

const bub = (id, side, text, time) => `<div id="${id}" class="bb ${side}"><div>${text}<small>${time}</small></div></div>`;

const css = `
body{background:#02040c}
#gl{position:absolute;left:0;top:0;width:1080px;height:1920px}
#vig{position:absolute;inset:0;background:radial-gradient(120% 70% at 50% 45%,rgba(0,0,0,0) 55%,rgba(0,0,0,.55) 100%);pointer-events:none;z-index:2}
.brandmark{color:#e6eaf2;padding:10px 18px;margin:-10px 0 0 -18px;border-radius:14px;background:rgba(6,9,22,.55)}
#hook{position:absolute;left:60px;right:60px;top:270px;z-index:30;text-align:center;font-weight:900;font-size:92px;line-height:1.02;letter-spacing:-.035em;color:#fff;text-shadow:0 8px 40px rgba(0,0,0,.6);visibility:hidden}
#hook em{font-style:normal;color:#ffd23f}
#nada{position:absolute;left:0;right:0;top:330px;z-index:30;text-align:center;visibility:hidden}
#nada b{display:inline-block;font-size:150px;font-weight:900;letter-spacing:-.04em;color:#fff}
#nada span{display:block;margin-top:10px;font-size:34px;font-weight:800;letter-spacing:.2em;color:#8fa6c8}
.pill{position:absolute;left:50%;z-index:30;padding:12px 28px;border-radius:14px;font-weight:800;font-size:36px;white-space:nowrap;box-shadow:0 14px 34px -16px #000;visibility:hidden}
.w{background:#fff;color:#111}.r{background:#e8384f;color:#fff}.y{background:#ffd23f;color:#111}.g{background:#14b89a;color:#fff}.b{background:#0865fe;color:#fff}.k{background:#0b0f1d;color:#fff;border:1px solid rgba(255,255,255,.18)}
#air{position:absolute;left:70px;top:300px;z-index:30;width:940px;height:760px;visibility:hidden}
#phone{position:absolute;left:150px;top:330px;width:780px;z-index:30;border-radius:44px;background:#0b1020;border:3px solid rgba(255,255,255,.14);box-shadow:0 50px 100px -30px #000;padding:22px 22px 30px;visibility:hidden}
.ph{display:flex;align-items:center;gap:16px;padding:6px 6px 18px;border-bottom:1px solid rgba(255,255,255,.1)}
.ph .av{width:64px;height:64px;border-radius:50%;background:#5b6b80;display:grid;place-items:center;font-weight:900;font-size:30px;color:#fff}
.ph b{display:block;font-size:31px;color:#fff}.ph span{font-size:23px;color:#9fb0c8;font-weight:600}
.demo{margin-left:auto;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.1);white-space:nowrap;font-size:18px;font-weight:800;color:#dfe6f2;visibility:hidden}
.bb{display:flex;margin-top:18px;visibility:hidden}.bb.out{justify-content:flex-end}
.bb>div{max-width:84%;padding:18px 24px;border-radius:26px;font-size:32px;line-height:1.3;font-weight:600}
.bb.in>div{background:#ffffff;color:#111;border-bottom-left-radius:8px}.bb.out>div{background:#d6e7ff;color:#0e2240;border-bottom-right-radius:8px}
.bb small{display:block;text-align:right;font-size:20px;color:#6b7280;margin-top:4px;font-weight:600}
.typing{display:flex;gap:9px;padding:22px 26px;border-radius:26px;background:#d6e7ff;margin:18px 0 0 auto;width:max-content;visibility:hidden}
.typing i{width:13px;height:13px;border-radius:50%;background:#5b7aa6}
#noans{margin-top:20px;font-size:28px;font-weight:800;color:#ff8a7a;visibility:hidden}
#ok{margin-top:22px;display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:18px;background:rgba(20,184,154,.16);color:#9ff0d8;font-size:30px;font-weight:800;visibility:hidden}
#ok i{width:40px;height:40px;border-radius:50%;background:#14b89a;color:#fff;font-style:normal;display:grid;place-items:center;font-size:24px}
#float{position:absolute;z-index:31;visibility:hidden;white-space:nowrap;padding:20px 28px;border-radius:28px;border-bottom-left-radius:8px;background:#fff;color:#111;font-size:40px;font-weight:600;box-shadow:0 30px 60px -20px rgba(0,0,0,.8)}
#cap{top:1500px}
#dim{position:absolute;inset:0;z-index:44;background:rgba(3,6,16,.86);visibility:hidden}
`;

const body = `
<canvas id="gl" width="1080" height="1920"></canvas>
<div id="vig"></div>
<div id="hook">O que acontece se você <em>gritar</em> no espaço?</div>
<div id="nada"><b>Nada.</b><span>NINGUÉM OUVE</span></div>
<canvas id="air" width="940" height="760"></canvas>
<div id="pRadio" class="pill b" style="top:300px">voz → sinal de rádio</div>
<div id="pClock" class="pill w" style="top:250px">23h04</div>
<div id="pSpace" class="pill k" style="top:1330px">é como gritar no espaço</div>
<div id="phone">
  <div class="ph"><span class="av" id="av">C</span><div><b>Clínica Exemplo</b><span id="st1">visto por último às 18h</span><span id="st2" style="display:none">assistente virtual · online</span></div><span class="demo" id="demo">Demonstração · dados fictícios</span></div>
  ${bub('m1', 'in', 'Oi! Tem horário amanhã?', '23:04')}
  <div id="noans">sem resposta…</div>
  <div id="ty" class="typing"><i></i><i></i><i></i></div>
  ${bub('m2', 'out', 'Oi! Aqui é a assistente virtual da Clínica Exemplo. Amanhã tenho 9h, 10h ou 15h. Qual fica melhor?', '23:04')}
  ${bub('m3', 'in', '9h', '23:05')}
  ${bub('m4', 'out', 'Reservei amanhã às 9h. A equipe da clínica confirma com você.', '23:05')}
  <div id="ok"><i>✓</i>A equipe confirma depois</div>
</div>
<div id="float">Oi! Tem horário amanhã?</div>
<div id="dim"></div>
${comentaBlock('Quer ver a demonstração?', 'AGENDA', 'dark', 470)}
`;

const script = `
window.MOTION=2;
const L=(a,b,x)=>a+(b-a)*x;
// camera keyframes [time reached, {pos, look, fov}]
const C=(p,l,f)=>({pos:p,look:l,fov:f});
const SHOTS=[
  [0.0,C([1.1,2.3,6.4],[0,1.75,0],36)],
  [2.4,C([0.8,2.2,5.2],[0,1.75,0],36)],
  [3.0,C([0.9,2.2,5.4],[0,1.75,0],36)],
  [4.8,C([1.0,2.0,6.0],[0,1.2,0],37)],
  [10.4,C([1.6,1.8,7.0],[0.6,0.6,0],38)],
  [11.6,C([2.3,2.6,13],[2.1,1.5,-1.75],40)],
  [16.3,C([1.9,2.5,12.2],[2.1,1.5,-1.75],40)],
  [17.6,C([6,2.0,8],[0,-10,-12],42)],
  [20.8,C([10.5,-11,3.2],[0,-16,-12],40)],
  [23.2,C([10.8,-11.2,3.6],[0,-16,-12],40)],
  [24.2,C([1.4,1.8,6.2],[0.6,0.9,0],38)],
  [26.8,C([1.2,1.7,5.6],[0.6,0.9,0],38)],
  [28.0,C([-3.5,3.4,11],[2,-0.5,-3],40)],
  [44.2,C([-4.5,3.9,12.5],[2,-0.8,-3],40)],
];
function camAt(t){
  let i=0; while(i<SHOTS.length-1&&SHOTS[i+1][0]<=t)i++;
  const [ta,A]=SHOTS[i], [tb,B]=SHOTS[Math.min(i+1,SHOTS.length-1)];
  const span=Math.max(.001,tb-ta), k=eioS(clamp((t-ta)/span));
  const lp=(a,b)=>a.map((v,j)=>L(v,b[j],k));
  return {pos:lp(A.pos,B.pos),look:lp(A.look,B.look),fov:L(A.fov,B.fov,k)};
}
// air vs space: two boxes, a longitudinal wave of particles on the left, almost nothing on the right
const AIR=$('air').getContext('2d');
function rr(x,y,w,h,r){AIR.beginPath();AIR.moveTo(x+r,y);AIR.arcTo(x+w,y,x+w,y+h,r);AIR.arcTo(x+w,y+h,x,y+h,r);AIR.arcTo(x,y+h,x,y,r);AIR.arcTo(x,y,x+w,y,r);AIR.closePath();}
function drawAir(t,k,sp){
  AIR.clearRect(0,0,940,760);
  const boxes=[[0,'NA TERRA','tem ar: o som passa',true],[400,'NO ESPAÇO','quase nada: o som morre',false]];
  // stacked: Terra on top, Espaço below
  [[0,0],[1,400]].forEach(([n,y0])=>{
    const [,title,sub,air]=boxes[n];
    AIR.globalAlpha=k;
    rr(0,y0,940,350,28); AIR.fillStyle='rgba(8,13,30,.95)'; AIR.fill(); AIR.strokeStyle='rgba(255,255,255,.14)'; AIR.lineWidth=2; AIR.stroke();
    AIR.fillStyle='#fff'; AIR.font='900 40px Inter'; AIR.fillText(title,34,y0+62);
    AIR.fillStyle=air?'#7fe3c4':'#ff8a7a'; AIR.font='800 28px Inter'; AIR.fillText(sub,34,y0+104);
    // speaker
    AIR.fillStyle='#ffd23f'; AIR.beginPath(); AIR.moveTo(40,y0+210); AIR.lineTo(70,y0+210); AIR.lineTo(105,y0+180); AIR.lineTo(105,y0+300); AIR.lineTo(70,y0+270); AIR.lineTo(40,y0+270); AIR.closePath(); AIR.fill();
    const tt=Math.max(0,t-sp);
    if(air){
      for(let r=0;r<6;r++)for(let c=0;c<20;c++){
        const x0=150+c*38+(r%2)*19, y=y0+160+r*30;
        const ph=x0*.035-tt*7; const amp=tt>0?14*Math.max(0,Math.min(1,(tt*260-(x0-150))/80)):0;
        const x=x0+Math.sin(ph)*amp; const dens=.55+.45*Math.cos(ph)*(amp/14);
        AIR.fillStyle='rgba(143,200,255,'+(.45+.5*dens)+')'; AIR.beginPath(); AIR.arc(x,y,7,0,Math.PI*2); AIR.fill();
      }
      // wave front arcs travelling right
      for(let j=0;j<3;j++){const R=((tt*260+j*90)%800); if(tt>0){AIR.strokeStyle='rgba(255,210,63,'+(.7*(1-R/800))+')'; AIR.lineWidth=5; AIR.beginPath(); AIR.arc(110,y0+240,R,-.5,.5); AIR.stroke();}}
    }else{
      [[300,190],[620,260],[820,180]].forEach(([x,y])=>{AIR.fillStyle='rgba(143,200,255,.55)'; AIR.beginPath(); AIR.arc(x,y0+y,7,0,Math.PI*2); AIR.fill();});
      for(let j=0;j<3;j++){const ph=((tt*1.4+j*.33)%1); const R=20+ph*70; AIR.strokeStyle='rgba(255,210,63,'+(.8*(1-ph))+')'; AIR.lineWidth=5; AIR.beginPath(); AIR.arc(110,y0+240,R,-.5,.5); AIR.stroke();}
      AIR.fillStyle='rgba(255,138,122,.9)'; AIR.font='900 34px Inter'; AIR.fillText('✕',245,y0+252);
    }
    AIR.globalAlpha=1;
  });
}
function pill(id,t,a,b){show(id,t,a,b,{dy:-16,base:'translateX(-50%)'});}
window.draw=(t)=>{
  const scream=t<2.38?-1:(t-2.38)/1.4;
  const mouth=t<1.9?0.12:t<2.38?eoS((t-1.9)/.3)*0.4:t<3.6?1:Math.max(.12,1-eoS((t-3.6)/.5));
  const radio=t<11.8?-1:(t-11.8)/4.6;
  const night=t<17.5?0:clamp((t-17.5)/2);
  const bubbleOut=t>=23.3&&t<27.1;
  window.espaco(t,{cam:camAt(t),scream,mouth,radio,armsUp:t>2.3&&t<3.8?eoS((t-2.3)/.3):0,waveB:t>15.2&&t<16.6?1:0,night,earthSpin:2.2,turnA:t>23&&t<27?0.15:0.35});
  // hook
  show('hook',t,0.0,2.85,{dy:20,fi:.25});
  show('nada',t,2.9,4.9,{dy:20,sc:.06});
  // air vs space
  const ak=show('air',t,5.05,10.5,{dy:30});
  if(t>=5&&t<10.6) drawAir(t,1,5.6);
  // radio
  pill('pRadio',t,13.6,16.6);
  // clinic at night
  pill('pClock',t,18.6,23.3);
  const ph=show('phone',t,19.4,23.4,{dy:40});
  show('m1',t,21.4,undefined,{dy:16}); show('noans',t,22.6,23.4,{dy:10});
  // the message floats away into space, next to the astronaut
  const fl=$('float');
  if(bubbleOut){const k=eoS((t-23.3)/3.6); const p=window.astroScreen('A',0.45); fl.style.visibility='visible'; fl.style.left=(p.x+90+k*140)+'px'; fl.style.top=(p.y-40-k*300)+'px'; fl.style.opacity=String(Math.min(1,(t-23.3)/.3)*(1-Math.max(0,(t-26.2)/.9))); fl.style.transform='rotate('+(-6+k*14)+'deg) scale('+(1-k*.25)+')';} else {fl.style.visibility='hidden';}
  
  // the demo: the same chat, now answered
  const demo=t>=27.1;
  $('st1').style.display=demo?'none':''; $('st2').style.display=demo?'':'none'; $('av').style.background=demo?'#0865fe':'#5b6b80'; $('av').textContent=demo?'A':'C';
  if(demo){ show('phone',t,27.15,39.1,{dy:40}); show('demo',t,27.4,undefined,{dy:0}); show('m1',t,27.2,undefined,{dy:0}); $('noans').style.visibility='hidden';
    show('ty',t,30.2,32.25,{dy:10,fi:.2}); show('m2',t,32.3,undefined,{dy:16}); show('m3',t,34.9,undefined,{dy:16}); show('m4',t,35.9,undefined,{dy:16}); show('ok',t,37.05,undefined,{dy:16});
  } else { $('demo').style.visibility='hidden'; ['ty','m2','m3','m4','ok'].forEach(id=>{$(id).style.visibility='hidden';}); }
  // ending
  show('dim',t,39.1,undefined,{dy:0,fi:.6});
  comenta(t,39.15,40.66,'AGENDA');
};
`;

export const html = () => {
  const p = page({ css, body, script, captions: CAPS, brandColor: '#e6eaf2' });
  const b = bundle();
  return p.replace('<script>', () => `<script>${b}</script><script>`);
};

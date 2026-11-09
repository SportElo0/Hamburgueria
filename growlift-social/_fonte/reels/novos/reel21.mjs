// Reel 21 (09/11): "A mesma noite, duas vezes". A 3D miniature (Three.js, diorama21.js) of a night street.
// Night A: Bia sends an audio to the clinic near home at 23h12, nobody answers, she books at another clinic.
// The tape rewinds. Night B: an AI attendant hears the audio, answers, checks the schedule, books Thursday 9h and
// reminds her the day before. People, clinic and times are fictional; no result promised.
// Timed to narracao-21-eleven.mp3.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { page, comentaBlock, svgIcon, ICON } from './base.mjs';

export const DURATION = 31.6;
export const COVER = 15.3;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BLUE = '#2f7bff';

const CAPS = [
  [0.12, 1.75, 'Terça, 23h12', '23h12'],
  [2.16, 6.35, 'Dor de dente. Ela manda um áudio', 'áudio'],
  [6.77, 7.6, 'Nada.', 'Nada.'],
  [7.66, 10.0, 'Ela marcou em outra clínica', 'outra clínica'],
  [10.34, 12.15, 'Agora, a mesma noite…', 'mesma noite'],
  [12.23, 14.45, 'com uma atendente de IA', 'atendente de IA'],
  [14.78, 15.85, 'Ouve o áudio', 'Ouve'],
  [15.91, 17.1, 'Responde na hora', 'na hora'],
  [17.22, 19.4, 'Olha a agenda e marca', 'marca'],
  [19.52, 23.3, 'Um dia antes, lembra', 'lembra'],
  [23.52, 24.9, 'A clínica dorme.', 'dorme'],
  [24.96, 26.5, 'O atendimento, não.', 'não.'],
];

const bundle = () =>
  buildSync({ entryPoints: [path.join(HERE, 'diorama21.js')], bundle: true, format: 'iife', write: false, minify: true, logLevel: 'error', absWorkingDir: path.resolve(HERE, '../../../..') }).outputFiles[0].text;

const bub = (id, side, inner, extra = '') => `<div id="${id}" style="display:flex;justify-content:${side === 'in' ? 'flex-start' : 'flex-end'};margin-top:14px;${extra}"><div style="max-width:86%;padding:16px 22px;border-radius:${side === 'in' ? '24px 24px 24px 8px' : '24px 24px 8px 24px'};background:${side === 'in' ? '#ffffff' : '#d7ecff'};color:#10213a;font-size:29px;line-height:1.32;font-weight:600">${inner}</div></div>`;
const audio = (id, side, dur) => bub(id, side, `<span style="display:flex;align-items:center;gap:14px"><span style="width:44px;height:44px;border-radius:50%;background:#1e83ce;display:grid;place-items:center;color:#fff;font-size:20px">▶</span><span style="display:flex;gap:4px;align-items:center">${[10, 22, 14, 30, 18, 26, 12, 24, 16, 28, 10, 20, 14, 8].map((h) => `<i style="display:block;width:5px;height:${h}px;border-radius:3px;background:#5b7a99"></i>`).join('')}</span><span style="font-size:22px;color:#5b7a99">${dur}</span></span>`);

const chatHead = (id, name, sub, color) => `<div id="${id}" style="display:flex;align-items:center;gap:16px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.12)">
  <span style="width:58px;height:58px;border-radius:50%;background:${color};display:grid;place-items:center">${svgIcon(ICON.user, 32, '#fff', 2.2)}</span>
  <div><div style="font-size:30px;font-weight:800;color:#fff">${name}</div><div class="sub" style="font-size:22px;color:#9fb0c8">${sub}</div></div></div>`;

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
const HOURS = ['8h', '9h', '10h', '14h'];
const BUSY = new Set(['0-0', '0-2', '1-1', '1-3', '2-0', '2-1', '2-3', '3-2', '4-0', '4-1', '4-3', '3-3']);
const cal = `<div style="display:grid;grid-template-columns:70px repeat(5,1fr);gap:8px;margin-top:16px">
  <span></span>${DAYS.map((d) => `<span style="text-align:center;font-size:22px;font-weight:800;color:${d === 'Qui' ? '#8ec2ff' : '#9fb0c8'}">${d}</span>`).join('')}
  ${HOURS.map((h, r) => `<span style="font-size:22px;font-weight:700;color:#9fb0c8;align-self:center">${h}</span>${DAYS.map((_, c) => {
    const k = `${c}-${r}`;
    if (k === '3-1') return `<span style="position:relative;height:56px;border-radius:12px;border:2px dashed rgba(142,194,255,.6)"><span id="slot" style="position:absolute;inset:-2px;border-radius:12px;background:${BLUE};color:#fff;font-size:20px;font-weight:800;display:grid;place-items:center">Bia</span></span>`;
    return `<span style="height:56px;border-radius:12px;background:${BUSY.has(k) ? 'rgba(255,255,255,.12)' : 'transparent'};border:${BUSY.has(k) ? 'none' : '2px dashed rgba(255,255,255,.14)'}"></span>`;
  }).join('')}`).join('')}
</div>`;

const css = `
body{background:#050914;color:#f3f5f9}
#sky{position:absolute;inset:0}
#stars{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.7) 1.4px,transparent 1.6px),radial-gradient(rgba(255,255,255,.45) 1px,transparent 1.2px);background-size:170px 190px,97px 113px;background-position:13px 29px,51px 7px;-webkit-mask-image:linear-gradient(#000 0%,#000 45%,transparent 75%)}
#gl{position:absolute;left:0;top:0;width:1080px;height:1920px}
#vig{position:absolute;inset:0;background:radial-gradient(120% 75% at 50% 38%,rgba(0,0,0,0) 55%,rgba(0,0,0,.55) 100%);pointer-events:none}
#clock{position:absolute;right:84px;top:132px;z-index:40;display:flex;align-items:baseline;gap:14px;padding:14px 26px;border-radius:24px;background:rgba(6,10,22,.78);border:1px solid rgba(255,255,255,.14)}
#clock .d{font-size:26px;font-weight:800;color:#9fb0c8;letter-spacing:.06em;text-transform:uppercase}
#clock .h{font-size:52px;font-weight:900;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.panel{position:absolute;left:70px;right:70px;top:1040px;z-index:35;padding:24px 28px 26px;border-radius:36px;background:rgba(10,16,32,.86);border:1px solid rgba(255,255,255,.14);box-shadow:0 40px 90px -30px rgba(0,0,0,.8);backdrop-filter:blur(12px)}
.pin{position:absolute;z-index:34;transform:translate(-50%,-100%);white-space:nowrap;padding:10px 20px;border-radius:999px;font-size:26px;font-weight:800;background:rgba(6,10,22,.85);border:1px solid rgba(255,255,255,.18)}
#rw{position:absolute;inset:0;z-index:38;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.07) 0 3px,transparent 3px 7px)}
#rwT{position:absolute;left:84px;top:236px;z-index:39;font-size:40px;font-weight:900;letter-spacing:.08em;color:#fff;text-shadow:3px 0 rgba(255,60,80,.8),-3px 0 rgba(60,200,255,.8)}
#cap{top:1488px}
#dim{position:absolute;inset:0;z-index:44;background:rgba(4,7,16,.82)}
`;

const body = `
<div id="sky"></div><div id="stars"></div>
<canvas id="gl" width="1080" height="1920"></canvas>
<div id="vig"></div>
<div id="clock"><span class="d" id="cD">Terça</span><span class="h" id="cH">23:12</span></div>
<div id="pinCli" class="pin">Clínica perto de casa</div>
<div id="pinCl2" class="pin" style="color:#bff5d9">Outra clínica ✓</div>
<div id="pinAi" class="pin" style="background:${BLUE};border-color:${BLUE}">● Atendente de IA</div>
<div id="rw"></div><div id="rwT">◀◀ REBOBINANDO</div>

<div id="chatA" class="panel">
  ${chatHead('hA', 'Clínica perto de casa', 'visto por último às 18h', '#5b6b80')}
  ${audio('aA', 'out', '0:09')}
  <div id="noA" style="margin-top:18px;font-size:24px;font-weight:700;color:#ff8a7a">Sem resposta…</div>
</div>
<div id="chatO" class="panel">
  ${chatHead('hO', 'Outra clínica', 'online', '#3e9b7c')}
  ${bub('oA', 'in', 'Oi! Temos horário amanhã às 8h. Pode ser?')}
  ${bub('oB', 'out', 'Pode! Obrigada!')}
</div>
<div id="chatB" class="panel">
  ${chatHead('hB', 'Clínica perto de casa', 'atendente de IA · online', BLUE)}
  ${audio('bA', 'out', '0:09')}
  <div id="bT" style="margin-top:10px;margin-left:auto;max-width:86%;font-size:23px;line-height:1.35;color:#9fb0c8;font-style:italic;text-align:right">“Tô com muita dor de dente… tem horário essa semana?”</div>
  ${bub('bR', 'in', 'Oi, Bia! Sinto muito pela dor. Tenho quinta às 9h. Posso marcar?')}
  ${bub('bS', 'out', 'Pode sim!')}
</div>
<div id="calB" class="panel">
  <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:28px;font-weight:800">Agenda da clínica</span><span style="font-size:22px;font-weight:700;color:#9fb0c8">esta semana</span></div>
  ${cal}
  <div id="okB" style="margin-top:18px;display:flex;align-items:center;gap:14px;font-size:28px;font-weight:800;color:#9fe3b8">${svgIcon(ICON.check, 34, '#22c55e', 3)}Agendado: quinta, 9h</div>
</div>
<div id="remB" class="panel">
  ${chatHead('hR', 'Clínica perto de casa', 'atendente de IA · online', BLUE)}
  ${bub('rA', 'in', 'Oi, Bia! Lembrete: amanhã, quinta, às 9h, você tem consulta. Confirma?')}
  ${bub('rB', 'out', 'Confirmo!')}
  <div id="rC" style="margin-top:14px;display:flex;align-items:center;gap:12px;font-size:25px;font-weight:800;color:#9fe3b8">${svgIcon(ICON.check, 30, '#22c55e', 3)}Consulta confirmada</div>
</div>
<div id="dim"></div>
${comentaBlock('Quer uma atendente assim na sua clínica?', 'CLÍNICA', 'dark', 470)}
`;

const script = `
window.MOTION=2;
const L=(a,b,x)=>a+(b-a)*x;
const mix=(c1,c2,k)=>c1.map((v,i)=>Math.round(L(v,c2[i],k)));
const rgb=(c)=>'rgb('+c.join(',')+')';
// sky stops: night, day, dusk
const NIGHT=[[5,9,24],[16,26,58]], DAY=[[120,182,240],[214,236,255]], DUSK=[[44,40,98],[240,140,110]];
function dayAt(t){ // 0 night … 1 day; the day passes between 19.5 and 23.3, back to night after
  if(t<19.5)return 0; if(t<20.3)return eioS((t-19.5)/.8); if(t<22.6)return 1-0.65*eioS((t-21.2)/1.4); return 0.35*(1-eioS((t-22.6)/.9));
}
function story(t){
  if(t<10.3)return{mode:'A',s:t};
  if(t<12.1)return{mode:'A',s:L(10.0,0,eioS((t-10.3)/1.8))};
  return{mode:'B',s:t};
}
function clockAt(t){
  const st=story(t);
  if(st.mode==='A'){const s=st.s; let m=12+(s<6.3?Math.min(1,s/6)*1:1+eioS((s-6.4)/1.2)*27)+(s>7.7?eioS((s-7.7)/2)*1:0); m=Math.floor(m); return ['Terça','23:'+String(m%60).padStart(2,'0')];}
  if(t<19.5){const m=12+Math.floor(Math.min(2,(t-12.1)/3.6)); return ['Terça','23:'+String(m).padStart(2,'0')];}
  if(t<20.6){const k=eioS((t-19.5)/1.1); const mins=23*60+14+k*(19*60-14+18*60-24*60+24*60-23*60); const h=Math.floor(mins/60)%24, m=Math.floor(mins%60); return [k>.35?'Quarta':'Terça',String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')];}
  if(t<23.4)return ['Quarta','18:00'];
  const k=eioS((t-23.4)/1.0); const mins=18*60+k*(5*60+30); return ['Quarta',String(Math.floor(mins/60)).padStart(2,'0')+':'+String(Math.floor(mins%60)).padStart(2,'0')];
}
function pinAt(id,anchor,t,a,b){const k=show(id,t,a,b,{dy:16});if(k>0||(t>=a&&t<b)){const p=window.project(window.ANCHORS[anchor]);const el=$(id);el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.transform='translate(-50%,-100%) translateY('+((1-k)*16)+'px)';}}
window.draw=(t)=>{
  const st=story(t);
  const day=dayAt(t);
  const top=day<.5?mix(NIGHT[0],DUSK[0],day*2):mix(DUSK[0],DAY[0],(day-.5)*2), bot=day<.5?mix(NIGHT[1],DUSK[1],day*2):mix(DUSK[1],DAY[1],(day-.5)*2);
  $('sky').style.background='linear-gradient('+rgb(top)+','+rgb(bot)+' 70%)';
  $('stars').style.opacity=1-Math.min(1,day*2.2);
  // camera: start close and low, settle; rewind swings back; pull back at the end
  const intro=eoS(t/2.4), rw=t>10.3&&t<12.1?Math.sin(Math.PI*(t-10.3)/1.8):0, end=eioS((t-23.5)/3);
  const cam={ang:L(.9,.5,intro)+.06*Math.sin(t*.25)-.3*rw+.2*end, dist:L(24,33,intro)+5*rw+5*end, h:L(12,21,intro)+3*end, ly:1.0, off:L(200,330,intro)};
  const ai=t<12.1?0:eoS((t-12.4)/1.2)*(t>23.4&&t<24?.6+.4*Math.abs(Math.cos((t-23.4)*6)):1);
  const sleep=t<23.6?0:eoS((t-23.6)/.6);
  window.diorama(t,{...st,day,ai,sleep,cam});
  const [d,h]=clockAt(t); $('cD').textContent=d; $('cH').textContent=h;
  // rewind look
  const rk=t>10.25&&t<12.2?Math.min(1,(t-10.25)/.15,(12.2-t)/.15):0;
  $('rw').style.opacity=rk; $('rwT').style.opacity=rk*(Math.floor(t*4)%2?1:.6);
  document.getElementById('gl').style.filter=rk?'saturate(.35) contrast(1.15) hue-rotate(-10deg)':'none';
  // pins
  pinAt('pinCli','cli',t,2.3,9.9); pinAt('pinCl2','cl2',t,9.0,10.25); pinAt('pinAi','cli',t,12.6,14.6);
  // night A chats
  show('chatA',t,2.4,7.6,{dy:40}); show('aA',t,2.9,undefined,{dy:20}); show('noA',t,6.7,undefined,{dy:12});
  show('chatO',t,7.7,10.2,{dy:40}); show('oA',t,8.5,undefined,{dy:20}); show('oB',t,9.25,undefined,{dy:20});
  // night B
  show('chatB',t,14.6,17.15,{dy:40}); show('bA',t,14.75,undefined,{dy:20}); show('bT',t,15.15,undefined,{dy:10}); show('bR',t,15.95,undefined,{dy:20}); show('bS',t,16.6,undefined,{dy:20});
  show('calB',t,17.2,19.5,{dy:40});
  const sk=eoS((t-18.25)/.45); $('slot').style.opacity=sk; $('slot').style.transform='translateY('+((1-sk)*-60)+'px) scale('+(1.15-.15*sk)+')';
  show('okB',t,18.6,undefined,{dy:12});
  show('remB',t,20.7,23.45,{dy:40}); show('rA',t,20.9,undefined,{dy:20}); show('rB',t,22.1,undefined,{dy:20}); show('rC',t,22.6,undefined,{dy:12});
  // ending
  show('dim',t,26.55,undefined,{dy:0,fi:.6});
  comenta(t,26.66,28.82,'CLÍNICA');
};
`;

export const html = () => {
  const p = page({ css, body, script, captions: CAPS });
  // the 3D bundle runs before the reel script (it defines window.diorama and window.project)
  const b = bundle();
  return p.replace('<script>', () => `<script>${b}</script><script>`);
};

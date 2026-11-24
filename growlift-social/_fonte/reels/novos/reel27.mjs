// Reel 27 (17/11): "6 passos pra clínica perder menos paciente no WhatsApp". One 3D world (Three.js, diorama27.js):
// a round platform, a giant tooth in the middle and six stations around it, one per thing the panel really does
// (answer, schedule, missed call with telephony, reminder for who accepted, pipeline, hand-off to the team).
// Modelled on a "strategy in N steps" Reel the partners sent: chapter tag + card that fills in + 2-3 word captions.
// Clearly an animation, no real people or data ("Clínica Exemplo"); legal review of 17/11 applied to the script.
// Timed to narracao-27-eleven.mp3 (55.5 s).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { page, comentaBlock } from './base.mjs';

export const DURATION = 58.0;
export const COVER = 19.2;

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Spoken phrases [start, end, text, highlighted word]; split below into captions of up to 3 words.
const SEG = [
  [0.0, 1.08, 'Onze da noite.', 'Onze'],
  [1.62, 3.76, 'Uma paciente manda mensagem pra clínica.', 'mensagem'],
  [4.09, 5.19, 'Ninguém responde…', 'Ninguém'],
  [5.53, 6.51, 'e ela marca em outra.', 'outra.'],
  [6.94, 10.28, 'Essa é uma forma de a clínica perder menos paciente no WhatsApp.', 'menos'],
  [10.85, 11.35, 'Passo um:', ''],
  [11.69, 12.93, 'resposta na hora.', 'na hora.'],
  [13.29, 15.45, 'A assistente responde até de madrugada,', 'madrugada,'],
  [15.63, 17.2, 'só com o que a clínica aprovou.', 'aprovou.'],
  [17.73, 18.48, 'Passo dois:', ''],
  [18.78, 19.38, 'agenda.', 'agenda.'],
  [19.74, 22.61, 'Ela oferece até três horários livres e reserva.', 'reserva.'],
  [22.92, 24.03, 'A equipe confirma.', 'confirma.'],
  [24.53, 25.25, 'Passo três:', ''],
  [25.52, 26.81, 'ligação perdida.', 'perdida.'],
  [27.22, 28.71, 'Com telefonia ligada ao painel,', 'telefonia'],
  [28.95, 30.95, 'quem não foi atendido aperta um', 'aperta um'],
  [31.1, 32.74, 'e recebe a resposta no WhatsApp.', 'WhatsApp.'],
  [33.25, 34.0, 'Passo quatro:', ''],
  [34.27, 35.01, 'lembrete.', 'lembrete.'],
  [35.35, 38.01, 'Um dia antes, só pra quem aceitou receber.', 'aceitou'],
  [38.53, 39.3, 'Passo cinco:', ''],
  [39.58, 40.25, 'o quadro.', 'quadro.'],
  [40.61, 43.32, 'Cada paciente numa etapa, com um responsável.', 'responsável.'],
  [43.81, 44.58, 'Passo seis:', ''],
  [44.87, 45.99, 'a pessoa certa.', 'certa.'],
  [46.35, 47.23, 'Não sabe responder?', 'Não sabe'],
  [47.57, 48.88, 'Ela chama alguém da equipe.', 'equipe.'],
  [49.25, 50.18, 'Seis passos,', 'Seis'],
  [50.39, 51.47, 'um sistema só.', 'sistema'],
];
function toCaps(seg) {
  const out = [];
  seg.forEach(([a, b, text, hl], i) => {
    const words = text.split(' ');
    const chunks = [];
    for (let k = 0; k < words.length; ) {
      let n = Math.min(3, words.length - k);
      if (words.length - k === 4) n = 2; // 4 left: 2 + 2, not 3 + 1
      chunks.push(words.slice(k, k + n).join(' '));
      k += n;
    }
    const total = chunks.reduce((s, c) => s + c.length, 0);
    const end = i + 1 < seg.length ? Math.min(seg[i + 1][0], b + 0.4) : b + 0.4;
    let t = a;
    chunks.forEach((c, j) => {
      const d = ((b - a) * c.length) / total;
      const h = hl.split(' ').find((w) => w && c.split(' ').includes(w)) ? hl.split(' ').filter((w) => c.split(' ').includes(w)).join(' ') : '';
      out.push([+t.toFixed(2), +(j === chunks.length - 1 ? end : t + d).toFixed(2), c, c.includes(h) ? h : '']);
      t += d;
    });
  });
  return out;
}
const CAPS = toCaps(SEG);

const bundle = () =>
  buildSync({ entryPoints: [path.join(HERE, 'diorama27.js')], bundle: true, format: 'iife', write: false, minify: true, logLevel: 'error', absWorkingDir: path.resolve(HERE, '../../../..') }).outputFiles[0].text;

const tag = (id, n, name) => `<div id="${id}" class="tag"><small>PASSO ${n}</small>${name}</div>`;
const item = (id, text, n) => `<div class="it" id="${id}"><span class="ck"><span class="v">✓</span></span>${text}<span class="n">${n}</span></div>`;
const head = (sub) => `<div class="ch"><span class="av">A</span><div><b>Clínica Exemplo</b><span>${sub}</span></div></div>`;
const bub = (id, side, text, time) => `<div id="${id}" class="bb ${side}"><div>${text}<small>${time}</small></div></div>`;

const css = `
body{background:#050a1e}
#sky{position:absolute;inset:0;background:linear-gradient(#050a1e 0%,#0b1442 calc(var(--hz,50%) - 30%),#26236e calc(var(--hz,50%) - 14%),#5a3486 calc(var(--hz,50%) - 6%),#c0607a calc(var(--hz,50%) - 1.5%),#f2956c var(--hz,50%),#2a1740 calc(var(--hz,50%) + 0.6%),#0d0a22 100%)}
#stars{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.75) 1.3px,transparent 1.6px),radial-gradient(rgba(255,255,255,.4) 1px,transparent 1.2px);background-size:170px 190px,97px 113px;-webkit-mask-image:linear-gradient(#000 0%,#000 calc(var(--hz,50%) - 25%),transparent calc(var(--hz,50%) - 8%))}
#gl{position:absolute;left:0;top:0;width:1080px;height:1920px}
#vig{position:absolute;inset:0;background:radial-gradient(120% 70% at 50% 45%,rgba(0,0,0,0) 60%,rgba(0,0,0,.45) 100%);pointer-events:none}
.brandmark{color:#e6eaf2;padding:10px 18px;margin:-10px 0 0 -18px;border-radius:14px;background:rgba(6,9,22,.55)}
.tag{position:absolute;left:50%;top:268px;z-index:30;padding:12px 36px 22px;border-radius:16px;background:#0b0f1d;color:#fff;font-weight:900;font-size:50px;letter-spacing:.03em;text-align:center;box-shadow:0 24px 50px -22px #000;white-space:nowrap;visibility:hidden}
.tag small{display:block;font-size:22px;letter-spacing:.2em;color:#8fb6ff;margin-bottom:2px}
.tag:after{content:"";position:absolute;left:50%;bottom:10px;width:64px;height:5px;margin-left:-32px;border-radius:3px;background:#3d8bff}
.pills{position:absolute;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:14px;z-index:30}
.pill{padding:12px 28px;border-radius:14px;font-weight:800;font-size:38px;box-shadow:0 14px 34px -16px #000;visibility:hidden;white-space:nowrap}
.w{background:#fff;color:#111}.r{background:#e8384f;color:#fff}.y{background:#ffd23f;color:#111}.g{background:#14b89a;color:#fff}.b{background:#0865fe;color:#fff}.k{background:#0b0f1d;color:#fff}
.card{position:absolute;left:100px;right:100px;top:440px;z-index:30;background:#fff;border-radius:28px;padding:26px 28px 28px;color:#121826;box-shadow:0 34px 70px -30px #000;visibility:hidden}
.card .h{display:flex;justify-content:space-between;font-size:21px;font-weight:800;letter-spacing:.1em;color:#6b7280;margin-bottom:4px}
.it{display:flex;align-items:center;gap:18px;margin-top:14px;padding:15px 18px;border-radius:16px;background:#f1f4f9;font-size:31px;font-weight:700;line-height:1.2}
.ck{position:relative;width:40px;height:40px;border-radius:50%;border:3px solid #c3cad6;flex:none;display:grid;place-items:center}
.ck .v{position:absolute;inset:-3px;border-radius:50%;background:#14b89a;color:#fff;display:grid;place-items:center;font-size:24px;font-weight:900;opacity:0}
.it .n{margin-left:auto;color:#9aa3b2;font-size:24px;padding-left:12px}
.ch{display:flex;align-items:center;gap:16px;padding-bottom:16px;border-bottom:1px solid #e5e9f0}
.ch .av{width:58px;height:58px;border-radius:50%;background:#0865fe;color:#fff;display:grid;place-items:center;font-weight:900;font-size:28px}
.ch b{display:block;font-size:30px;font-weight:800}.ch span{font-size:22px;color:#6b7280;font-weight:600}
.bb{display:flex;margin-top:16px;visibility:hidden}.bb.out{justify-content:flex-end}
.bb>div{max-width:86%;padding:16px 22px;border-radius:24px;font-size:29px;line-height:1.3;font-weight:600}
.bb.in>div{background:#eef1f6;border-bottom-left-radius:8px}.bb.out>div{background:#d6e7ff;border-bottom-right-radius:8px}
.bb small{display:block;text-align:right;font-size:19px;color:#7b8494;margin-top:4px;font-weight:600}
.typing{display:flex;gap:8px;padding:20px 24px;border-radius:24px;background:#d6e7ff;margin:16px 0 0 auto;width:max-content;visibility:hidden}
.typing i{width:12px;height:12px;border-radius:50%;background:#5b7aa6}
.kb{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:10px}
.col{background:#f1f4f9;border-radius:16px;padding:14px 12px 16px;min-height:250px}
.col b{display:block;font-size:22px;letter-spacing:.06em;color:#6b7280;margin-bottom:10px}
.kc{position:relative;background:#fff;border-radius:12px;padding:12px 12px;margin-top:10px;font-size:23px;font-weight:700;box-shadow:0 6px 14px -8px rgba(0,0,0,.35);display:flex;align-items:center;gap:10px}
.kc i{width:34px;height:34px;border-radius:50%;flex:none;color:#fff;font-style:normal;font-size:17px;font-weight:900;display:grid;place-items:center}
#mv{position:absolute;z-index:3}
#cap{top:1500px}
#dim{position:absolute;inset:0;z-index:44;background:rgba(5,8,20,.86);visibility:hidden}
`;

const body = `
<div id="sky"></div><div id="stars"></div>
<canvas id="gl" width="1080" height="1920"></canvas>
<div id="vig"></div>

<div class="pills" style="top:300px"><div id="p0" class="pill w">23h00</div><div id="p1" class="pill r">mensagem sem resposta</div><div id="p2" class="pill r">marcou em outra clínica</div></div>
<div class="pills" style="top:290px"><div id="w0" class="pill k" style="font-size:54px;padding:14px 36px">6 passos</div><div id="w1" class="pill y">pra perder menos paciente no WhatsApp</div></div>

${tag('t1', 1, 'RESPOSTA NA HORA')}
<div id="c1" class="card">
  ${head('assistente virtual · online')}
  ${bub('c1a', 'in', 'Oi! Vocês atendem sábado?', '23:04')}
  <div id="c1t" class="typing"><i></i><i></i><i></i></div>
  ${bub('c1b', 'out', 'Oi! Aqui é a assistente virtual da Clínica Exemplo. Sábado atendemos das 8h às 12h. Quer que eu veja um horário?', '23:04')}
  <div id="c1c" class="it" style="margin-top:18px;background:#e8f7f2"><span class="ck" style="border-color:#14b89a"><span class="v" style="opacity:1">✓</span></span>Só com o que a clínica aprovou</div>
</div>

${tag('t2', 2, 'AGENDA')}
<div id="c2" class="card"><div class="h"><span>AGENDA DA CLÍNICA</span><span>PELA ASSISTENTE</span></div>
  ${item('c2a', 'Oferece até 3 horários livres', 1)}${item('c2b', 'Reserva o escolhido', 2)}${item('c2c', 'A equipe confirma', 3)}</div>

${tag('t3', 3, 'LIGAÇÃO PERDIDA')}
<div id="c3" class="card"><div class="h"><span>LIGAÇÃO NÃO ATENDIDA</span><span>COM TELEFONIA</span></div>
  ${item('c3a', 'Quem ligou aperta 1', 1)}${item('c3b', 'Recebe a resposta no WhatsApp', 2)}${item('c3c', 'A equipe ganha a tarefa de retornar', 3)}</div>

${tag('t4', 4, 'LEMBRETE')}
<div id="c4" class="card">
  ${head('assistente virtual')}
  ${bub('c4a', 'out', 'Oi! Lembrete da sua consulta amanhã, às 9h, na Clínica Exemplo. Até lá!', '9:00')}
  ${bub('c4b', 'in', 'Obrigada! 😊', '9:02')}
  <div id="c4c" class="it" style="margin-top:18px;background:#fff7d6"><span class="ck" style="border-color:#e0b100"><span class="v" style="opacity:1;background:#e0b100">✓</span></span>Só pra quem aceitou receber</div>
</div>

${tag('t5', 5, 'O QUADRO')}
<div id="c5" class="card"><div class="h"><span>PACIENTES · CLÍNICA EXEMPLO</span><span>DADOS FICTÍCIOS</span></div>
  <div class="kb" style="position:relative">
    <div class="col"><b>NOVO</b><div class="kc"><i style="background:#ff8a5c">M</i>Marina</div><div class="kc"><i style="background:#7c8cff">J</i>João</div><div class="kc" id="s5a" style="visibility:hidden"><i></i>x</div></div>
    <div class="col"><b>AGENDADO</b><div class="kc"><i style="background:#14b89a">C</i>Carla</div><div class="kc" id="s5b" style="visibility:hidden"><i></i>x</div></div>
    <div class="col"><b>ATENDIDO</b><div class="kc"><i style="background:#ffb020">P</i>Pedro</div></div>
    <div id="mv" class="kc" style="margin:0"><i style="background:#e8384f">L</i>Lúcia</div>
  </div>
  <div id="c5r" class="it" style="margin-top:16px"><span class="ck" style="border-color:#14b89a"><span class="v" style="opacity:1">✓</span></span>Responsável: Recepção</div>
</div>

${tag('t6', 6, 'A PESSOA CERTA')}
<div id="c6" class="card">
  ${head('assistente virtual · online')}
  ${bub('c6a', 'in', 'Posso tomar o remédio antes da consulta?', '15:20')}
  ${bub('c6b', 'out', 'Essa pergunta é para a equipe da clínica. Já chamei alguém pra te responder, tá?', '15:20')}
  <div id="c6c" class="it" style="margin-top:18px;background:#e8f7f2"><span class="ck" style="border-color:#14b89a"><span class="v" style="opacity:1">✓</span></span>Sem diagnóstico nem orientação clínica</div>
</div>

<div class="pills" style="top:290px"><div id="e0" class="pill k" style="font-size:54px;padding:14px 36px">6 passos</div><div id="e1" class="pill b">um sistema só</div></div>

<div id="dim"></div>
${comentaBlock('Quer ver uma demonstração pra sua clínica?', 'AGENDA', 'dark', 470)}
`;

const script = `
window.MOTION=2;
const L=(a,b,x)=>a+(b-a)*x;
const TAU=Math.PI*2, SR=4.55;
const ang=(i)=>i/6*TAU;
// camera shots in cylindrical coords around the world centre: th (angle), r, h; look at radius lr, angle lth, height ly
const near=(i,d=0)=>({th:ang(i)+0.11+d,r:SR+5.3,h:2.3,lth:ang(i),lr:SR*0.78,ly:1.1,fov:40});
const SHOTS=[
  // [time the shot is reached, shot]
  [0.0,{th:ang(0)-0.12,r:SR+4.6,h:2.6,lth:ang(0),lr:SR*0.9,ly:1.0,fov:42}],
  [6.4,{th:ang(0)-0.04,r:SR+3.9,h:2.3,lth:ang(0),lr:SR*0.95,ly:0.9,fov:42}],
  [8.0,{th:ang(0)-0.35,r:17.5,h:9.6,lth:0,lr:0,ly:0.5,fov:44}],
  [10.2,{th:ang(0)-0.15,r:17,h:9.2,lth:0,lr:0,ly:0.5,fov:44}],
  [11.3,near(0)],[17.3,near(0,0.08)],
  [18.3,near(1)],[24.2,near(1,0.08)],
  [25.2,near(2)],[33.0,near(2,0.08)],
  [34.0,near(3)],[38.3,near(3,0.08)],
  [39.2,near(4)],[43.6,near(4,0.08)],
  [44.5,near(5)],[49.0,near(5,0.06)],
  [50.4,{th:ang(5)+0.5,r:17.5,h:9.8,lth:0,lr:0,ly:0.5,fov:44}],
  [58.0,{th:ang(5)+1.1,r:18.5,h:10.5,lth:0,lr:0,ly:0.5,fov:44}],
];
const lerpA=(a,b,k)=>{let d=b-a; while(d>Math.PI)d-=TAU; while(d<-Math.PI)d+=TAU; return a+d*k;};
function camAt(t){
  let i=0; while(i<SHOTS.length-1&&SHOTS[i+1][0]<=t)i++;
  const [ta,A]=SHOTS[i], nx=SHOTS[Math.min(i+1,SHOTS.length-1)], [tb,B]=nx;
  // holds drift slowly (the pairs with the same station); moves between stations take ~0.9 s
  const span=tb-ta, move=B.r!==A.r||Math.abs(B.lth-A.lth)>.01?Math.min(span,1.0):span;
  const k=span<=0?1:(move<span?eioS(clamp((t-(tb-move))/move)):clamp((t-ta)/span));
  const th=lerpA(A.th,B.th,k), r=L(A.r,B.r,k), h=L(A.h,B.h,k)+ (move<span? Math.sin(Math.PI*k)*1.2:0), lth=lerpA(A.lth,B.lth,k), lr=L(A.lr,B.lr,k), ly=L(A.ly,B.ly,k), fov=L(A.fov,B.fov,k);
  return {pos:[Math.sin(th)*r,h,Math.cos(th)*r],look:[Math.sin(lth)*lr,ly,Math.cos(lth)*lr],fov};
}
const pop=(t,a)=>clamp((t-a)/.5);
function tick(id,t,a){const v=$(id).querySelector('.v'); if(!v)return; const k=eoS((t-a)/.3); v.style.opacity=t>=a?k:0; v.style.transform='scale('+(t>=a?.7+.3*k:.7)+')';}
function chapter(n,t,a,b){show('t'+n,t,a,b,{dy:-20,base:'translateX(-50%)'}); return show('c'+n,t,a+.15,b,{dy:40});}
window.draw=(t)=>{
  const on=[1,0,0,0,0,0].map((v,i)=>i===0?1:eoS(pop(t,7.4+i*.32)));
  const away=t<5.5?0:t<10.6?eioS((t-5.5)/1.5):0;
  const ans=t<12.0?0:eoS((t-12.0)/.4);
  window.mundo(t,{cam:camAt(t),on,away,hideAssistant:t<10.6,ans,booked:t>=21.9,ring5:t>=46.3&&t<48.9?1:0,staff5:t<47.6?0:eioS((t-47.6)/1.2)});
  // intro
  show('p0',t,0.05,6.9,{dy:-16}); show('p1',t,4.1,6.9,{dy:-16}); show('p2',t,5.55,6.9,{dy:-16});
  show('w0',t,7.0,10.75,{dy:-16}); show('w1',t,7.5,10.75,{dy:-16});
  // 1 · answer
  chapter(1,t,10.85,17.55); show('c1a',t,11.4,undefined,{dy:16}); show('c1t',t,11.75,12.35,{dy:10,fi:.2});
  show('c1b',t,12.35,undefined,{dy:16}); show('c1c',t,15.65,undefined,{dy:16});
  // 2 · schedule
  chapter(2,t,17.75,24.4); tick('c2a',t,20.3); tick('c2b',t,21.9); tick('c2c',t,23.1);
  // 3 · missed call
  chapter(3,t,24.55,33.1); tick('c3a',t,29.9); tick('c3b',t,31.6); tick('c3c',t,32.3);
  // 4 · reminder
  chapter(4,t,33.25,38.4); show('c4a',t,34.4,undefined,{dy:16}); show('c4b',t,35.3,undefined,{dy:16}); show('c4c',t,36.4,undefined,{dy:16});
  // 5 · pipeline: Lúcia's card moves from NOVO to AGENDADO
  chapter(5,t,38.55,43.75);
  const mk=eioS((t-41.0)/.9), mv=$('mv'), A=$('s5a'), B=$('s5b'); mv.style.left=L(A.offsetLeft,B.offsetLeft,mk)+'px'; mv.style.top=L(A.offsetTop,B.offsetTop,mk)+'px'; mv.style.width=A.offsetWidth+'px';
  mv.style.boxShadow=mk>0&&mk<1?'0 18px 30px -10px rgba(0,0,0,.45)':''; mv.style.transform='rotate('+(Math.sin(Math.PI*mk)*-4)+'deg) scale('+(1+.06*Math.sin(Math.PI*mk))+')';
  show('c5r',t,42.2,undefined,{dy:16});
  // 6 · the right person
  chapter(6,t,43.85,49.2); show('c6a',t,44.4,undefined,{dy:16}); show('c6b',t,46.4,undefined,{dy:16}); show('c6c',t,47.7,undefined,{dy:16});
  // whole world
  show('e0',t,49.25,51.8,{dy:-16}); show('e1',t,50.4,51.8,{dy:-16});
  // ending
  show('dim',t,51.8,undefined,{dy:0,fi:.6});
  comenta(t,51.85,53.95,'AGENDA');
};
`;

export const html = () => {
  const p = page({ css, body, script, captions: CAPS, brandColor: '#e6eaf2' });
  const b = bundle();
  return p.replace('<script>', () => `<script>${b}</script><script>`);
};

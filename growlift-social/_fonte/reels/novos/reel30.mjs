// Reel 30 (19/11): "Quem acende o farol à noite?". Gancho de curiosidade com fato verdadeiro (Trinity House: os últimos
// faroleiros se despediram em 1998; os faróis acendem sozinhos e são acompanhados de longe), ponte para a clínica (a
// recepção é o faroleiro; às 18h ela vai embora) e a demonstração da Growlift: a automação responde, oferece horários e
// reserva, pede o aceite do lembrete e avisa a equipe. Fim: "Comenta FAROL" e o checklist grátis.
// 3D em diorama30.js. Revisão legal de 19/11 aplicada. Timed to narracao-30-eleven.mp3 (50.8 s), played at 1.2×.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { page, comentaBlock } from './base.mjs';

export const DURATION = 52.6;
export const COVER = 1.6;
export const SPEED = 1.2;

const HERE = path.dirname(fileURLToPath(import.meta.url));

const SEG = [
  [3.38, 3.95, 'Ninguém.', 'Ninguém.'],
  [4.3, 5.51, 'Ele acende sozinho.', 'sozinho.'],
  [6.15, 12.08, 'Na Inglaterra, os últimos faroleiros da Trinity House se despediram em 1998.', '1998.'],
  [12.49, 13.18, 'Desde então,', ''],
  [13.42, 15.0, 'a luz liga quando escurece,', 'sozinha'],
  [15.28, 17.4, 'e uma equipe acompanha tudo de longe.', 'longe.'],
  [17.93, 19.34, 'Agora pensa numa clínica.', 'clínica.'],
  [19.76, 21.53, 'A recepção é o faroleiro.', 'faroleiro.'],
  [21.97, 24.0, 'Quando ela vai embora, às seis da tarde,', 'seis'],
  [24.32, 26.33, 'quem guia o paciente que manda mensagem?', 'mensagem?'],
  [26.87, 30.4, 'Na demonstração da Growlift, a automação acende sozinha:', 'sozinha:'],
  [30.81, 32.79, 'responde com as informações da clínica,', 'responde'],
  [33.03, 34.63, 'oferece horários e reserva,', 'reserva,'],
  [34.9, 36.67, 'manda o lembrete pra quem aceitou,', 'aceitou,'],
  [36.96, 38.87, 'e chama a equipe quando precisa.', 'equipe'],
  [39.31, 40.65, 'A luz fica acesa.', 'acesa.'],
  [40.98, 42.69, 'E a equipe acompanha de longe.', 'longe.'],
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
      const w2 = c.split(' ');
      const h = hl.split(' ').filter((w) => w && w2.includes(w)).join(' ');
      out.push([+t.toFixed(2), +(j === chunks.length - 1 ? end : t + d).toFixed(2), c, h && c.includes(h) ? h : '']);
      t += d;
    });
  });
  return out;
}
const CAPS = toCaps(SEG);

const bundle = () =>
  buildSync({ entryPoints: [path.join(HERE, 'diorama30.js')], bundle: true, format: 'iife', write: false, minify: true, logLevel: 'error', absWorkingDir: path.resolve(HERE, '../../../..') }).outputFiles[0].text;

const bub = (id, side, text, time) => `<div id="${id}" class="bb ${side}"><div>${text}<small>${time}</small></div></div>`;

const css = `
body{background:linear-gradient(#030715 0%,#0a1638 45%,#13285a 62%,#0a1530 100%)}
#gl{position:absolute;left:0;top:0;width:1080px;height:1920px}
#vig{position:absolute;inset:0;background:radial-gradient(120% 75% at 50% 45%,rgba(0,0,0,0) 55%,rgba(0,0,0,.5) 100%);pointer-events:none}
.brandmark{color:#e6eaf2;padding:10px 18px;margin:-10px 0 0 -18px;border-radius:14px;background:rgba(6,9,22,.55)}
#hook{position:absolute;left:60px;right:60px;top:260px;z-index:30;text-align:center;font-weight:900;font-size:90px;line-height:1.02;letter-spacing:-.035em;color:#fff;text-shadow:0 8px 40px rgba(0,0,0,.7);visibility:hidden}
#hook em{font-style:normal;color:#ffd27a}
.pill{position:absolute;left:50%;z-index:30;padding:12px 28px;border-radius:14px;font-weight:800;font-size:38px;white-space:nowrap;box-shadow:0 14px 34px -16px #000;visibility:hidden}
.w{background:#fff;color:#111}.y{background:#ffd27a;color:#111}.k{background:rgba(6,9,22,.86);color:#fff;border:1px solid rgba(255,255,255,.2)}.b{background:#0865fe;color:#fff}.r{background:#e8384f;color:#fff}
#fact{position:absolute;left:80px;right:80px;top:280px;z-index:30;padding:30px 34px;border-radius:28px;background:rgba(6,10,24,.86);border:1px solid rgba(255,255,255,.16);visibility:hidden}
#fact .y1{font-size:118px;font-weight:900;letter-spacing:-.04em;color:#ffd27a;line-height:1}
#fact .t1{margin-top:8px;font-size:38px;font-weight:800;color:#fff;line-height:1.2}
#fact .src{margin-top:14px;font-size:21px;font-weight:600;color:#9fb0c8}
#phone{position:absolute;left:120px;top:300px;width:840px;z-index:30;border-radius:40px;background:#0b1020;border:3px solid rgba(255,255,255,.14);box-shadow:0 50px 100px -30px #000;padding:22px 22px 26px;visibility:hidden}
.ph{display:flex;align-items:center;gap:16px;padding:4px 6px 16px;border-bottom:1px solid rgba(255,255,255,.1)}
.ph .av{width:62px;height:62px;border-radius:50%;background:#5b6b80;display:grid;place-items:center;font-weight:900;font-size:30px;color:#fff;flex:none}
.ph b{display:block;font-size:30px;color:#fff}.ph span{font-size:22px;color:#9fb0c8;font-weight:600}
.demo{margin-left:auto;padding:8px 14px;border-radius:12px;background:rgba(255,255,255,.1);font-size:18px;font-weight:800;color:#dfe6f2;text-align:right;line-height:1.25;visibility:hidden}
.bb{display:flex;margin-top:16px;visibility:hidden}.bb.out{justify-content:flex-end}
.bb>div{max-width:84%;padding:16px 22px;border-radius:24px;font-size:30px;line-height:1.3;font-weight:600}
.bb.in>div{background:#ffffff;color:#111;border-bottom-left-radius:8px}.bb.out>div{background:#d6e7ff;color:#0e2240;border-bottom-right-radius:8px}
.bb small{display:block;text-align:right;font-size:19px;color:#6b7280;margin-top:4px;font-weight:600}
#noans{margin-top:18px;font-size:27px;font-weight:800;color:#ff8a7a;visibility:hidden}
#team{margin-top:18px;display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:16px;background:rgba(255,210,122,.14);color:#ffe3a8;font-size:27px;font-weight:800;visibility:hidden}
#team i{width:40px;height:40px;border-radius:50%;background:#ffd27a;color:#111;font-style:normal;display:grid;place-items:center;font-size:22px;flex:none}
#cap{top:1540px}
#dim{position:absolute;inset:0;z-index:44;background:rgba(3,6,16,.86);visibility:hidden}
#gift{position:absolute;left:50%;top:1330px;z-index:47;transform:translateX(-50%);text-align:center;font-size:30px;font-weight:800;color:#9ff0d8;white-space:nowrap;visibility:hidden}
`;

const body = `
<canvas id="gl" width="1080" height="1920"></canvas>
<div id="vig"></div>
<div id="hook">Quem acende o farol à noite, se <em>não tem mais faroleiro?</em></div>
<div id="pSoz" class="pill y" style="top:300px">acende sozinho</div>
<div id="fact"><div class="y1">1998</div><div class="t1">Os últimos faroleiros da Trinity House se despediram. Desde então, a luz liga sozinha e uma equipe acompanha de longe.</div><div class="src">Fonte: Trinity House (North Foreland, 1998)</div></div>
<div id="pRec" class="pill w" style="top:300px">a recepção = o faroleiro</div>
<div id="p18" class="pill r" style="top:300px">18h · recepção fechada</div>
<div id="phone">
  <div class="ph"><span class="av" id="av">C</span><div><b>Clínica Exemplo</b><span id="st1">visto por último às 18h</span><span id="st2" style="display:none">assistente virtual · online</span></div><span class="demo" id="demo">Projeto conceito<br>dados fictícios</span></div>
  ${bub('m1', 'in', 'Oi! Vocês atendem amanhã?', '19:42')}
  <div id="noans">sem resposta…</div>
  ${bub('m2', 'out', 'Oi! Aqui é a assistente virtual da Clínica Exemplo. Amanhã tenho 9h, 14h ou 16h. Qual fica melhor?', '19:42')}
  ${bub('m3', 'in', '14h', '19:43')}
  ${bub('m4', 'out', 'Reservei amanhã às 14h. A equipe da clínica confirma com você. Quer um lembrete um dia antes? Responda SIM.', '19:43')}
  ${bub('m5', 'in', 'SIM', '19:43')}
  <div id="team"><i>!</i>Equipe avisada: nova reserva para confirmar</div>
</div>
<div id="pAce" class="pill b" style="top:1380px">a luz fica acesa</div>
<div id="dim"></div>
${comentaBlock('Quer o checklist dos 7 pontos do WhatsApp da clínica?', 'FAROL', 'dark', 450)}
<div id="gift">A Growlift te manda grátis · vale pra todo mundo que comentar</div>
`;

const script = `
window.MOTION=2;
const L=(a,b,x)=>a+(b-a)*x;
const C=(p,l,f)=>({pos:p,look:l,fov:f});
const SHOTS=[
  [0.0,C([1.5,1.4,4.0],[-6,6.5,-14],44)],
  [3.2,C([0.5,1.6,2.5],[-6,7.0,-14],44)],
  [6.0,C([3.5,4.0,2.0],[-6,5.5,-14],42)],
  [12.2,C([-1.0,5.0,4.0],[-6,5.5,-14],42)],
  [17.5,C([2.0,6.5,14.0],[-4,4.0,-10],44)],
  [19.6,C([13.0,5.0,25.0],[6,2.2,4],38)],
  [26.4,C([13.5,5.2,26.5],[6,2.4,4],38)],
  [28.6,C([18.0,10.0,26.0],[-1,2.5,-5],42)],
  [38.6,C([20.0,11.0,29.0],[-1,2.5,-5],42)],
  [40.0,C([5.0,6.0,22.0],[-5,4.5,-10],46)],
  [43.0,C([4.5,6.2,21.0],[-5,4.8,-10],46)],
  [52.6,C([21.0,11.5,30.5],[-1,2.5,-5],42)],
];
function camAt(t){let i=0;while(i<SHOTS.length-1&&SHOTS[i+1][0]<=t)i++;const[ta,A]=SHOTS[i],[tb,B]=SHOTS[Math.min(i+1,SHOTS.length-1)];const span=Math.max(.001,tb-ta);const k=eioS(clamp((t-ta)/span));const lp=(a,b)=>a.map((v,j)=>L(v,b[j],k));return{pos:lp(A.pos,B.pos),look:lp(A.look,B.look),fov:L(A.fov,B.fov,k)};}
function pill(id,t,a,b){show(id,t,a,b,{dy:-16,base:'translateX(-50%)'});}
const WARM=[1,0.86,0.6], BLUE=[0.25,0.55,1];
window.draw=(t)=>{
  // beam: on in the hook, off on "Ninguém", back on "acende sozinho"; turns Growlift blue on the demo
  const beam=t<3.3?1:t<4.3?Math.max(0,1-(t-3.3)/.25):eoS((t-4.3)/.35);
  const kb=clamp((t-26.9)/1.2), col=WARM.map((v,i)=>L(v,BLUE[i],kb));
  const keeper=t>6.6&&t<10.0?1:t>=10&&t<10.6?1-(t-10)/.6:0;
  const lights=t<22.6?1:Math.max(0,1-(t-22.6)/.8);
  window.farol(t,{cam:camAt(t),beam,beamColor:col,keeper,clinicLights:lights,boats:clamp((t-26)/18)});
  // hook
  show('hook',t,0,3.3,{dy:20,fi:.25});
  pill('pSoz',t,4.35,6.0);
  show('fact',t,6.3,17.4,{dy:30});
  pill('pRec',t,19.8,22.0);
  pill('p18',t,22.0,24.3);
  // the patient's message, unanswered
  const demo=t>=26.9;
  show('phone',t,24.3,demo?39.2:26.9,{dy:40});
  show('m1',t,24.6,undefined,{dy:16});
  if(!demo){show('noans',t,25.6,undefined,{dy:10});} else {$('noans').style.visibility='hidden';}
  $('st1').style.display=demo?'none':''; $('st2').style.display=demo?'':'none'; $('av').style.background=demo?'#0865fe':'#5b6b80'; $('av').textContent=demo?'A':'C';
  if(demo){ show('demo',t,27.0,undefined,{dy:0}); show('m2',t,30.8,undefined,{dy:16}); show('m3',t,33.0,undefined,{dy:16}); show('m4',t,33.8,undefined,{dy:16}); show('m5',t,35.4,undefined,{dy:16}); show('team',t,37.0,undefined,{dy:16}); }
  else { ['demo','m2','m3','m4','m5','team'].forEach(id=>{$(id).style.visibility='hidden';}); }
  pill('pAce',t,39.3,43.0);
  // ending
  show('dim',t,43.1,undefined,{dy:0,fi:.6});
  comenta(t,43.15,47.56,'FAROL');
  show('gift',t,48.7,undefined,{dy:12,base:'translateX(-50%)'});
};
`;

export const html = () => {
  const p = page({ css, body, script, captions: CAPS, brandColor: '#e6eaf2' });
  const b = bundle();
  return p.replace('<script>', () => `<script>${b}</script><script>`);
};

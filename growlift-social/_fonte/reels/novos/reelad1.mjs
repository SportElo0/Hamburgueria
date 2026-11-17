// Anúncio 1 (17/11): "Quantas ficaram sem resposta?" — Reel made only for Meta ads, for dentists. Built from the
// patterns of the long-running ads in the Meta Ad Library (07-planejamento/pesquisa-anuncios-meta.md): niche in the
// first frame, a question that bothers the owner, a named assistant, a short checklist, a no-risk offer.
// Real footage only (Mixkit, Free License, cleared for ads; ids 12139, 39782, 12148), no AI images or AI people.
// The chat is a demonstration drawn in code and labeled as such. No voice: ads are mostly watched muted.
// Frames: $AD1_FRAMES/{dent,noite,luvas}/00001.jpg… (1080x1350, 30 fps), cut with ffmpeg from the Mixkit clips.
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { RUNTIME } from './base.mjs';
import { MARK } from '../../pecas.mjs';

export const DURATION = 20.5;
export const COVER = 1.8;
export const OUT = '../../../anuncios';

const FR = pathToFileURL(process.env.AD1_FRAMES || path.join(os.tmpdir(), 'ad1-frames')).href;
const COUNT = { dent: 360, noite: 359, luvas: 456 };

// Captions: [start, end, text]; *word* = yellow highlight. Words pop in one after another.
const CAPS = [
  [0.25, 3.15, 'Quantas mensagens ficaram *sem* *resposta* hoje?'],
  [3.35, 6.15, 'Cada uma é um *paciente* *esperando.*'],
  [6.45, 12.45, 'A Ana responde *na* *hora.*'],
  [12.75, 16.3, 'A equipe só *confirma.*'],
];
const capHtml = CAPS.map(([, , txt], i) => `<div class="cap" id="cap${i}">${txt.split(' ').map((w) => (/^\*.*\*$/.test(w) ? `<span class="w hl">${w.slice(1, -1)}</span>` : `<span class="w">${w}</span>`)).join(' ')}</div>`).join('');

const nota = (id, n, t, h) => `<div class="note" id="${id}"><div class="ic">✆</div><div><b>${n}</b><span>${t}</span></div><div class="t">${h}</div></div>`;
const msg = (id, side, t, hr) => `<div class="m ${side}" id="${id}">${t}<small>${hr}</small></div>`;

const css = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden}
body{position:relative;font-family:Inter,'Helvetica Neue',Arial,sans-serif;background:#06080d;color:#fff;-webkit-font-smoothing:antialiased}
.sc{position:absolute;inset:0;visibility:hidden}
.vid{position:absolute;left:0;top:300px;width:1080px;height:1350px;object-fit:cover}
.fade{position:absolute;left:0;right:0;top:300px;height:1350px;background:linear-gradient(rgba(6,8,13,.0) 55%,rgba(6,8,13,.85))}
.dark{position:absolute;inset:0;background:radial-gradient(900px 900px at 20% 25%,rgba(8,101,254,.30),transparent 70%),#06080d}
.brand{position:absolute;left:70px;top:150px;display:flex;gap:12px;align-items:center;font-weight:800;letter-spacing:.14em;font-size:24px;color:#e6eaf2;z-index:30}
.brand svg{height:30px;width:auto}
.demo{position:absolute;right:60px;top:146px;padding:10px 20px;border-radius:999px;background:rgba(6,8,13,.75);border:1px solid rgba(255,255,255,.25);font-size:23px;font-weight:700;color:#e6eaf2;z-index:30}
.niche{position:absolute;left:50%;top:222px;transform:translateX(-50%);padding:10px 26px;border-radius:999px;background:#ffd23f;color:#111;font-weight:900;font-size:34px;letter-spacing:.06em;z-index:30}
.cap{position:absolute;left:60px;right:60px;top:1330px;text-align:center;font-weight:900;font-size:78px;line-height:1.06;letter-spacing:-.03em;text-shadow:0 6px 30px rgba(0,0,0,.7);z-index:25;visibility:hidden}
.w{display:inline-block}.hl{color:#ffd23f}
.notes{position:absolute;left:80px;right:80px;top:400px;display:flex;flex-direction:column;gap:18px;z-index:20}
.note{background:rgba(245,247,250,.97);color:#121826;border-radius:30px;padding:22px 26px;display:flex;gap:18px;align-items:center;box-shadow:0 20px 50px -20px rgba(0,0,0,.7)}
.note .ic{width:62px;height:62px;border-radius:18px;background:#22c55e;flex:none;display:flex;align-items:center;justify-content:center;font-size:34px;color:#fff;font-weight:900}
.note b{font-size:28px;display:block}.note span{font-size:27px;color:#4a5568}
.note .t{margin-left:auto;font-size:24px;color:#e53e3e;font-weight:800;white-space:nowrap}
.badge{position:absolute;left:50%;top:420px;transform:translateX(-50%);padding:16px 32px;border-radius:999px;background:#e53e3e;font-size:42px;font-weight:900;white-space:nowrap;z-index:20}
.phone{position:absolute;left:50%;top:300px;width:700px;height:1000px;margin-left:-350px;border-radius:70px;background:#10151f;padding:18px;box-shadow:0 60px 140px -40px rgba(8,101,254,.7),0 0 0 2px rgba(255,255,255,.08)}
.scr{width:100%;height:100%;border-radius:54px;background:#ece5dd;overflow:hidden;position:relative}
.top{background:#0b5c4c;color:#fff;padding:52px 30px 20px;display:flex;gap:18px;align-items:center}
.top .av{width:68px;height:68px;border-radius:50%;background:#cfe9e1;color:#0b5c4c;font-weight:900;font-size:32px;display:flex;align-items:center;justify-content:center}
.top b{font-size:29px;display:block}.top span{font-size:21px;opacity:.8}
.msgs{padding:24px;display:flex;flex-direction:column;gap:14px}
.m{max-width:82%;padding:16px 22px;border-radius:22px;font-size:27px;line-height:1.3;color:#111b21;box-shadow:0 2px 0 rgba(0,0,0,.08)}
.m.in{background:#fff;align-self:flex-start;border-top-left-radius:6px}
.m.out{background:#d9fdd3;align-self:flex-end;border-top-right-radius:6px}
.m small{display:block;text-align:right;font-size:19px;color:#667781;margin-top:6px}
.typing{align-self:flex-end;background:#d9fdd3;border-radius:22px;padding:18px 24px;display:flex;gap:8px}
.typing i{width:12px;height:12px;border-radius:50%;background:#5f7c6e;display:block}
.card{position:absolute;left:90px;right:90px;top:430px;background:#fff;color:#121826;border-radius:36px;padding:38px;z-index:20;box-shadow:0 40px 80px -30px rgba(0,0,0,.7)}
.card .h{font-size:25px;color:#718096;font-weight:800;letter-spacing:.08em}
.it{display:flex;align-items:center;gap:18px;margin-top:18px;padding:18px 20px;border-radius:18px;background:#f1f4f9;font-size:32px;font-weight:700}
.ck{width:44px;height:44px;border-radius:50%;background:#14b89a;color:#fff;display:grid;place-items:center;font-size:26px;font-weight:900;flex:none}
.end .big{position:absolute;left:60px;right:60px;top:430px;text-align:center;font-weight:900;font-size:92px;line-height:1.06;letter-spacing:-.03em}
.end .sub{position:absolute;left:100px;right:100px;top:880px;text-align:center;font-size:42px;color:#c6cede;line-height:1.35}
.cta{position:absolute;left:50%;top:1120px;transform:translateX(-50%);padding:28px 54px;border-radius:999px;background:#25d366;color:#06331a;font-size:50px;font-weight:900;white-space:nowrap}
.cta-sub{position:absolute;left:0;right:0;top:1275px;text-align:center;font-size:32px;color:#c6cede}
.legal{position:absolute;left:0;right:0;top:1400px;text-align:center;font-size:25px;color:#8a94a6}
`;

const body = `
<div class="brand">${MARK}GROWLIFT</div><div class="demo" id="demo">Demonstração · cena ilustrativa</div>
<section class="sc" id="s1"><img class="vid" id="v1" alt=""><div class="fade"></div><div class="niche">DENTISTA</div>
  <div class="notes">${nota('n1', 'Paciente', 'Oi, tem horário amanhã?', 'há 2 h')}${nota('n2', 'Paciente', 'Quanto custa a limpeza?', 'há 3 h')}${nota('n3', 'Paciente', 'Vocês atendem convênio?', 'há 5 h')}</div></section>
<section class="sc" id="s2"><img class="vid" id="v2" alt=""><div class="fade"></div><div class="badge" id="b2">sem resposta há 3 h</div></section>
<section class="sc" id="s3"><div class="dark"></div><div class="phone"><div class="scr"><div class="top"><div class="av">A</div><div><b>Ana · Clínica Exemplo</b><span>assistente virtual</span></div></div>
  <div class="msgs">${msg('m1', 'in', 'Oi! Tem horário amanhã pra limpeza?', '21:41')}<div class="typing" id="ty1"><i></i><i></i><i></i></div>${msg('m2', 'out', 'Oi! Aqui é a Ana, assistente virtual da Clínica Exemplo. Amanhã tenho 10h, 15h ou 16h. Qual fica melhor?', '21:41')}${msg('m3', 'in', '15h', '21:42')}${msg('m4', 'out', 'Reservei amanhã às 15h para a limpeza. A equipe confirma com você de manhã.', '21:42')}</div></div></div></section>
<section class="sc" id="s4"><img class="vid" id="v4" alt="" style="filter:brightness(.45)"><div class="card"><div class="h">O QUE A ANA FAZ</div>
  <div class="it" id="i1"><span class="ck">✓</span>Responde a qualquer hora</div><div class="it" id="i2"><span class="ck">✓</span>Só com as informações da clínica</div><div class="it" id="i3"><span class="ck">✓</span>Oferece horários e reserva</div><div class="it" id="i4"><span class="ck">✓</span>Chama a equipe quando precisa</div></div></section>
<section class="sc end" id="s5"><div class="dark"></div><div class="big" id="e1">A gente <span class="hl">configura tudo.</span><br>Você só atende.</div>
  <div class="sub" id="e2">Atendimento com IA no WhatsApp<br>da sua clínica, pronto pra usar.</div>
  <div class="cta" id="e3">Peça uma demonstração</div><div class="cta-sub" id="e4">grátis, pelo WhatsApp</div><div class="legal" id="e5">Demonstração com dados fictícios</div></section>
${capHtml}`;

const script = `
window.MOTION=2;
const FR=${JSON.stringify(FR)}, CNT=${JSON.stringify(COUNT)}, CAPS=${JSON.stringify(CAPS.map(([a, b]) => [a, b]))};
const SC=[['s1',0,3.25],['s2',3.25,6.3],['s3',6.3,12.6],['s4',12.6,16.45],['s5',16.45,99]];
const pend=[];
function frame(img,clip,lt){const n=Math.max(1,Math.min(CNT[clip],1+Math.floor(lt*30)));const src=FR+'/'+clip+'/'+String(n).padStart(5,'0')+'.jpg';if(img.getAttribute('src')!==src){img.src=src;pend.push(img.decode().catch(()=>{}));}}
const caps=CAPS.map((c,i)=>({a:c[0],b:c[1],el:$('cap'+i),ws:[...$('cap'+i).querySelectorAll('.w')]}));
function drawCaps(t){for(const c of caps){const vis=t>=c.a&&t<c.b;c.el.style.visibility=vis?'visible':'hidden';if(!vis)continue;
  c.ws.forEach((w,i)=>{const k=eoS((t-c.a-i*0.06)/0.22);w.style.opacity=k;w.style.transform='translateY('+((1-k)*24)+'px) scale('+(0.9+0.1*k)+')';});}}
window.render=async(t)=>{
  for(const [id,a,b] of SC){const el=$(id);const vis=t>=a&&t<b;el.style.visibility=vis?'visible':'hidden';
    const k=Math.min(eoS((t-a)/0.18),id==='s5'?1:eoS((b-t)/0.18));el.style.opacity=vis?k:0;}
  if(t<3.25){frame($('v1'),'dent',t+1.0);['n1','n2','n3'].forEach((n,i)=>show(n,t,0.35+i*0.45,undefined,{dy:-30,fi:.35}));}
  else if(t<6.3){frame($('v2'),'noite',t-3.25+1.5);show('b2',t,3.6,undefined,{dy:20,fi:.3,base:'translateX(-50%)'});}
  else if(t<12.6){[['m1',6.6],['m2',8.3],['m3',9.9],['m4',10.9]].forEach(([m,a])=>show(m,t,a,undefined,{dy:20,fi:.3}));
    const ty=$('ty1');const tv=t>=7.2&&t<8.3;ty.style.display=tv?'flex':'none';if(tv)[...ty.children].forEach((d,i)=>d.style.opacity=0.35+0.65*Math.max(0,Math.sin(t*9-i*0.9)));
    $('m2').style.display=t>=8.3?'block':'none';$('m3').style.display=t>=9.9?'block':'none';$('m4').style.display=t>=10.9?'block':'none';}
  else if(t<16.45){frame($('v4'),'luvas',t-12.6+3);['i1','i2','i3','i4'].forEach((n,i)=>show(n,t,12.8+i*0.45,undefined,{dy:24,fi:.3}));}
  else{show('e1',t,16.6,undefined,{dy:30});show('e2',t,17.1,undefined,{dy:20});show('e3',t,17.6,undefined,{dy:20,base:'translateX(-50%)'});show('e4',t,17.8,undefined,{dy:10});show('e5',t,18.0,undefined,{dy:0});
    if(t>18.3){const p=1+0.035*Math.sin((t-18.3)*5);$('e3').style.transform='translateX(-50%) scale('+p+')';}}
  $('demo').style.visibility=t<16.45?'visible':'hidden';
  drawCaps(t);
  await Promise.all(pend.splice(0));
};`;

export const html = () => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap" rel="stylesheet"><style>${css}</style></head><body>${body}<script>${RUNTIME}${script}</script></body></html>`;

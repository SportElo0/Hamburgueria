// Anúncio 1 (17/11): "Quantos pacientes ficaram sem resposta?" — Reel made only for Meta ads, for dental clinics.
// Built from the patterns of the long-running ads in the Meta Ad Library (07-planejamento/pesquisa-anuncios-meta.md):
// niche in the first frame, a question that bothers the owner, a named assistant, a short checklist, a no-risk offer.
// Real footage only (Mixkit, Free License, cleared for ads; ids 12139, 39782, 12148), no AI images or AI people.
// The chat is a demonstration drawn in code (neutral app, not WhatsApp's look) and labeled as such the whole time.
// Legal review of 17/11 applied: demo label always on, no "configura tudo"/"pronto pra usar"/"a qualquer hora",
// "gratuita e sem compromisso". No voice: ads are mostly watched muted.
// Frames: $AD1_FRAMES/{dent,noite,luvas}/00001.jpg… (1080x1350, 30 fps), cut, sharpened and graded with ffmpeg.
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { RUNTIME } from './base.mjs';
import { MARK } from '../../pecas.mjs';

export const DURATION = 21.0;
export const COVER = 2.2;
export const OUT = '../../../anuncios';

const FR = pathToFileURL(process.env.AD1_FRAMES || path.join(os.tmpdir(), 'ad1-frames')).href;
const COUNT = { dent: 360, noite: 359, luvas: 456 };

// Captions: [start, end, text]; *word* = highlighted. Words pop in one after another.
const CAPS = [
  [0.3, 3.3, 'Quantos pacientes ficaram *sem* *resposta* hoje?'],
  [3.55, 6.3, 'Do outro lado, alguém *esperando.*'],
  [6.6, 9.55, 'A Ana responde *na* *hora*'],
  [9.7, 12.7, 'e *reserva* o horário.'],
  [13.0, 16.5, 'Sua equipe só *confirma.*'],
];
const capHtml = CAPS.map(([, , txt], i) => `<div class="cap" id="cap${i}">${txt.split(' ').map((w) => (/^\*.*\*$/.test(w) ? `<span class="w hl">${w.slice(1, -1)}</span>` : `<span class="w">${w}</span>`)).join(' ')}</div>`).join('');

const BUBBLE = '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.5-4.7A8.5 8.5 0 1 1 20.5 11.5z"/></svg>';
const CLOCK = '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const nota = (id, t, h) => `<div class="note" id="${id}"><div class="ic">${BUBBLE}</div><div class="tx"><b>Paciente</b><span>${t}</span></div><div class="t">${h}</div></div>`;
const msg = (id, side, t, hr) => `<div class="m ${side}" id="${id}">${t}<small>${hr}${side === 'out' ? ' <i class="tick">✓✓</i>' : ''}</small></div>`;
const dots = (id) => `<div class="typing" id="${id}"><i></i><i></i><i></i></div>`;

const css = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden}
body{position:relative;font-family:Inter,'Helvetica Neue',Arial,sans-serif;background:#05070c;color:#fff;-webkit-font-smoothing:antialiased}
.sc{position:absolute;inset:0;visibility:hidden;transform-origin:50% 45%}
.clip{position:absolute;left:0;top:300px;width:1080px;height:1350px;overflow:hidden;box-shadow:0 0 120px 40px rgba(5,7,12,.55)}
.vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:50% 40%}
.fade{position:absolute;left:0;right:0;top:300px;height:1350px;background:linear-gradient(rgba(5,7,12,.55) 0%,rgba(5,7,12,0) 18%,rgba(5,7,12,0) 48%,rgba(5,7,12,.92) 92%)}
.bgblur{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(26px) brightness(.32) saturate(1.2);transform:scale(1.2)}
.dark{position:absolute;inset:0;background:radial-gradient(1000px 900px at 18% 22%,rgba(8,101,254,.34),transparent 68%),radial-gradient(800px 800px at 90% 90%,rgba(8,101,254,.16),transparent 70%),#05070c}
.brand{position:absolute;left:66px;top:258px;display:flex;gap:12px;align-items:center;font-weight:800;letter-spacing:.14em;font-size:26px;color:#f3f5f9;z-index:30;text-shadow:0 2px 12px rgba(0,0,0,.6)}
.brand svg{height:32px;width:auto}
.demo{position:absolute;right:56px;top:250px;padding:10px 22px;border-radius:999px;background:rgba(5,7,12,.82);border:1px solid rgba(255,255,255,.3);font-size:30px;font-weight:700;color:#f3f5f9;z-index:30}
.niche{position:absolute;left:50%;top:352px;padding:12px 28px;border-radius:999px;background:#ffd23f;color:#111;font-weight:900;font-size:32px;letter-spacing:.06em;z-index:30;white-space:nowrap;box-shadow:0 14px 30px -14px rgba(0,0,0,.7)}
.cap{position:absolute;left:56px;right:56px;top:1350px;text-align:center;font-weight:900;font-size:80px;line-height:1.05;letter-spacing:-.035em;text-shadow:0 4px 24px rgba(0,0,0,.85),0 0 2px rgba(0,0,0,.6);z-index:25;visibility:hidden}
.w{display:inline-block}.hl{color:#ffd23f}
.notes{position:absolute;left:72px;right:72px;top:450px;display:flex;flex-direction:column;gap:16px;z-index:20}
.note{background:rgba(250,251,253,.94);color:#121826;border-radius:32px;padding:22px 24px;display:flex;gap:18px;align-items:center;box-shadow:0 24px 50px -20px rgba(0,0,0,.75);border:1px solid rgba(255,255,255,.6)}
.note .ic{width:64px;height:64px;border-radius:18px;background:linear-gradient(160deg,#3d8bff,#0865fe);flex:none;display:grid;place-items:center}
.note .tx{min-width:0}.note b{font-size:28px;display:block;font-weight:800}.note span{font-size:28px;color:#4a5568;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.note .t{margin-left:auto;font-size:24px;color:#e0344b;font-weight:800;white-space:nowrap;padding-left:12px}
.badge{position:absolute;left:50%;top:470px;display:flex;gap:14px;align-items:center;padding:16px 30px 16px 22px;border-radius:999px;background:#e0344b;font-size:42px;font-weight:900;white-space:nowrap;z-index:20;box-shadow:0 20px 40px -18px rgba(224,52,75,.8)}
.phone{position:absolute;left:50%;top:345px;width:720px;height:960px;margin-left:-360px;border-radius:72px;background:#0d1220;padding:16px;box-shadow:0 70px 140px -40px rgba(8,101,254,.75),0 0 0 2px rgba(255,255,255,.1);z-index:10}
.scr{width:100%;height:100%;border-radius:58px;background:#eef1f6;overflow:hidden;position:relative}
.top{background:#121a2e;color:#fff;padding:54px 30px 20px;display:flex;gap:18px;align-items:center}
.top .av{width:70px;height:70px;border-radius:50%;background:linear-gradient(160deg,#3d8bff,#0865fe);color:#fff;font-weight:900;font-size:32px;display:grid;place-items:center}
.top b{font-size:30px;display:block}.top span{font-size:22px;color:#9fb0c8}
.msgs{padding:26px 24px;display:flex;flex-direction:column;gap:16px}
.m{max-width:84%;padding:18px 22px;border-radius:24px;font-size:28px;line-height:1.32;color:#111827;box-shadow:0 2px 0 rgba(0,0,0,.06)}
.m.in{background:#fff;align-self:flex-start;border-top-left-radius:8px}
.m.out{background:#dbe8ff;align-self:flex-end;border-top-right-radius:8px}
.m small{display:block;text-align:right;font-size:19px;color:#6b7280;margin-top:6px}
.tick{font-style:normal;color:#0865fe;font-weight:800;letter-spacing:-.15em}
.typing{align-self:flex-end;background:#dbe8ff;border-radius:24px;padding:20px 24px;display:none;gap:9px}
.typing i{width:12px;height:12px;border-radius:50%;background:#4b6b9a;display:block}
.card{position:absolute;left:84px;right:84px;top:470px;background:#fff;color:#121826;border-radius:38px;padding:38px 36px;z-index:20;box-shadow:0 40px 90px -30px rgba(0,0,0,.8)}
.card .h{display:flex;align-items:center;gap:14px;font-size:26px;color:#64748b;font-weight:800;letter-spacing:.08em}
.card .h .av{width:46px;height:46px;border-radius:50%;background:linear-gradient(160deg,#3d8bff,#0865fe);color:#fff;font-size:22px;display:grid;place-items:center;letter-spacing:0}
.it{display:flex;align-items:center;gap:18px;margin-top:18px;padding:20px 20px;border-radius:20px;background:#f1f4f9;font-size:32px;font-weight:700}
.ck{width:46px;height:46px;border-radius:50%;background:#14b89a;color:#fff;display:grid;place-items:center;font-size:26px;font-weight:900;flex:none}
.end .mark{position:absolute;left:50%;top:330px;width:150px;margin-left:-75px}
.end .big{position:absolute;left:56px;right:56px;top:540px;text-align:center;font-weight:900;font-size:104px;line-height:1.02;letter-spacing:-.04em}
.end .sub{position:absolute;left:96px;right:96px;top:850px;text-align:center;font-size:40px;color:#c6cede;line-height:1.35}
.cta{position:absolute;left:50%;top:1120px;padding:30px 58px;border-radius:999px;background:#0865fe;color:#fff;font-size:52px;font-weight:900;white-space:nowrap;box-shadow:0 30px 70px -20px rgba(8,101,254,.95)}
.cta-sub{position:absolute;left:0;right:0;top:1282px;text-align:center;font-size:34px;color:#e6eaf2}
.legal{position:absolute;left:0;right:0;top:1400px;text-align:center;font-size:34px;color:#e6eaf2}
`;

const body = `
<div class="brand">${MARK}GROWLIFT</div><div class="demo">Demonstração · cena ilustrativa</div>
<section class="sc" id="s1"><img class="bgblur" id="v1b" alt=""><div class="clip"><img class="vid" id="v1" alt=""></div><div class="fade"></div><div class="niche" id="niche">CLÍNICAS ODONTOLÓGICAS</div>
  <div class="notes">${nota('n1', 'Oi, tem horário amanhã?', 'há 2 h')}${nota('n2', 'Quanto custa a limpeza?', 'há 3 h')}${nota('n3', 'Vocês atendem convênio?', 'há 5 h')}</div></section>
<section class="sc" id="s2"><img class="bgblur" id="v2b" alt=""><div class="clip"><img class="vid" id="v2" alt=""></div><div class="fade"></div><div class="badge" id="b2">${CLOCK}sem resposta há 3 h</div></section>
<section class="sc" id="s3"><img class="bgblur" id="v3" alt=""><div class="phone"><div class="scr"><div class="top"><div class="av">A</div><div><b>Ana · Clínica Exemplo</b><span>assistente virtual</span></div></div>
  <div class="msgs">${msg('m1', 'in', 'Oi! Tem horário amanhã pra limpeza?', '21:41')}${dots('ty1')}${msg('m2', 'out', 'Oi! Aqui é a Ana, assistente virtual da Clínica Exemplo. Amanhã tenho 10h, 15h ou 16h. Qual fica melhor?', '21:41')}${msg('m3', 'in', '15h, por favor', '21:42')}${dots('ty2')}${msg('m4', 'out', 'Reservei amanhã às 15h para a limpeza. A equipe confirma com você de manhã.', '21:42')}</div></div></div></section>
<section class="sc" id="s4"><img class="bgblur" id="v4b" alt=""><div class="clip"><img class="vid" id="v4" alt="" style="filter:brightness(.42)"></div><div class="fade"></div><div class="card"><div class="h"><span class="av">A</span>O QUE A ANA FAZ</div>
  <div class="it" id="i1"><span class="ck" id="k1">✓</span>Responde também fora do horário</div><div class="it" id="i2"><span class="ck" id="k2">✓</span>Usa só as informações da clínica</div><div class="it" id="i3"><span class="ck" id="k3">✓</span>Oferece horários livres e reserva</div><div class="it" id="i4"><span class="ck" id="k4">✓</span>Chama a equipe quando precisa</div></div></section>
<section class="sc end" id="s5"><div class="dark" id="glow"></div><div class="mark" id="e0">${MARK.replace('<svg ', '<svg width="150" ')}</div>
  <div class="big" id="e1">A gente <span class="hl">configura.</span><br>Você só atende.</div>
  <div class="sub" id="e2">Atendimento com IA no WhatsApp<br>da sua clínica, configurado por nós.</div>
  <div class="cta" id="e3">Peça uma demonstração</div><div class="cta-sub" id="e4">gratuita e sem compromisso, pelo WhatsApp</div><div class="legal" id="e5">Demonstração com dados fictícios</div></section>
${capHtml}`;

const script = `
window.MOTION=2;
const FR=${JSON.stringify(FR)}, CNT=${JSON.stringify(COUNT)}, CAPS=${JSON.stringify(CAPS.map(([a, b]) => [a, b]))};
const SC=[['s1',0,3.45],['s2',3.45,6.45],['s3',6.45,12.85],['s4',12.85,16.65],['s5',16.65,99]];
const pend=[];
function frame2(id,clip,lt){frame($(id),clip,lt);const b=$(id+'b');if(b)frame(b,clip,lt);}
function frame(img,clip,lt){const n=Math.max(1,Math.min(CNT[clip],1+Math.floor(lt*30)));const src=FR+'/'+clip+'/'+String(n).padStart(5,'0')+'.jpg';if(img.getAttribute('src')!==src){img.src=src;pend.push(img.decode().catch(()=>{}));}}
function kb(img,lt,dur,z0,z1,dx){const k=eioS(lt/dur);img.style.transform='translateX('+(dx*k)+'px) scale('+(z0+(z1-z0)*k)+')';}
const caps=CAPS.map((c,i)=>({a:c[0],b:c[1],el:$('cap'+i),ws:[...$('cap'+i).querySelectorAll('.w')]}));
function drawCaps(t){for(const c of caps){const vis=t>=c.a&&t<c.b;c.el.style.visibility=vis?'visible':'hidden';if(!vis)continue;
  const out=clamp((t-(c.b-0.15))/0.15);c.el.style.opacity=1-out;
  c.ws.forEach((w,i)=>{const k=eoS((t-c.a-i*0.055)/0.24);w.style.opacity=k;w.style.transform='translateY('+((1-k)*26)+'px) scale('+(0.88+0.12*k)+')';});}}
function pop(id,t,a){const el=$(id);const k=clamp((t-a)/0.28);const s=k<=0?0.6:(k<0.6?0.6+0.55*(k/0.6):1.15-0.15*((k-0.6)/0.4));el.style.transform='scale('+s+')';el.style.opacity=k>0?1:0;}
window.render=async(t)=>{
  for(const [id,a,b] of SC){const el=$(id);const vis=t>=a&&t<b;el.style.visibility=vis?'visible':'hidden';if(!vis)continue;
    const kin=eoS((t-a)/0.24),kout=id==='s5'?1:eoS((b-t)/0.16);el.style.opacity=Math.min(kin,kout);el.style.transform='scale('+(1+0.05*(1-kin))+')';}
  if(t<3.45){frame2('v1','dent',t+1.0);kb($('v1'),t,3.45,1.04,1.13,-20);show('niche',t,0.05,undefined,{dy:-16,fi:.3,base:'translateX(-50%)'});['n1','n2','n3'].forEach((n,i)=>show(n,t,0.4+i*0.42,undefined,{dy:-36,fi:.32}));}
  else if(t<6.45){const lt=t-3.45;frame2('v2','noite',lt+1.5);kb($('v2'),lt,3,1.0,1.1,12);show('b2',t,3.75,undefined,{dy:24,fi:.3,base:'translateX(-50%)'});}
  else if(t<12.85){const lt=t-6.45;frame($('v3'),'noite',lt+4.5);
    show('m1',t,6.7,undefined,{dy:20,fi:.3});
    const ty1=$('ty1'),ty2=$('ty2');const t1=t>=7.3&&t<8.4,t2=t>=10.25&&t<11.15;ty1.style.display=t1?'flex':'none';ty2.style.display=t2?'flex':'none';
    [ty1,ty2].forEach(ty=>[...ty.children].forEach((d,i)=>{d.style.transform='translateY('+(-6*Math.max(0,Math.sin(t*9-i*0.9)))+'px)';}));
    $('m2').style.display=t>=8.4?'block':'none';$('m3').style.display=t>=9.55?'block':'none';$('m4').style.display=t>=11.15?'block':'none';
    show('m2',t,8.4,undefined,{dy:18,fi:.28});show('m3',t,9.55,undefined,{dy:18,fi:.28});show('m4',t,11.15,undefined,{dy:18,fi:.28});}
  else if(t<16.65){const lt=t-12.85;frame2('v4','luvas',lt+3);kb($('v4'),lt,3.8,1.05,1.12,0);['i1','i2','i3','i4'].forEach((n,i)=>{show(n,t,13.05+i*0.42,undefined,{dy:26,fi:.3});pop('k'+(i+1),t,13.2+i*0.42);});}
  else{const lt=t-16.65;$('glow').style.transform='scale('+(1+0.04*Math.sin(lt*1.3))+')';
    show('e0',t,16.75,undefined,{dy:20});show('e1',t,16.95,undefined,{dy:34});show('e2',t,17.45,undefined,{dy:20});show('e3',t,17.85,undefined,{dy:20,base:'translateX(-50%)'});show('e4',t,18.05,undefined,{dy:10});show('e5',t,18.2,undefined,{dy:0});
    if(t>18.5){const p=1+0.03*Math.sin((t-18.5)*5);$('e3').style.transform='translateX(-50%) scale('+p+')';}}
  drawCaps(t);
  await Promise.all(pend.splice(0));
};`;

export const html = () => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap" rel="stylesheet"><style>${css}</style></head><body>${body}<script>${RUNTIME}${script}</script></body></html>`;

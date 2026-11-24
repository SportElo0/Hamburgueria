// Anúncio 1 (17/11, v2): "Sua clínica fecha. O atendimento, não." — Reel made only for Meta ads, for dental clinics.
// Story asked by Antônio: the clinic is closed at night, a patient messages, nobody answers, she messages another
// clinic, gets an answer and books there: you lost the patient without knowing. Then the same night with the Ana.
// Patterns of the long-running ads in the Meta Ad Library (07-planejamento/pesquisa-anuncios-meta.md): niche on the
// first frame, a scene at the moment of pain, a named assistant, a no-risk offer.
// Real footage only (Mixkit, Free License, cleared for ads; ids 49845, 39782, 39789, same actress in 39782/39789).
// No AI images or AI people. The on-screen dramatization line was removed at the partners' request (17/11);
// the ad text says the scene is dramatized, with fictitious data.
// Frames: $AD1_FRAMES/{cidade,noite,liga}/00001.jpg… (1080x1350, 30 fps), cut, sharpened and graded with ffmpeg.
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { RUNTIME } from './base.mjs';
import { MARK } from '../../pecas.mjs';

export const DURATION = 25.0;
export const COVER = 2.0;
export const OUT = '../../../anuncios';

const FR = pathToFileURL(process.env.AD1_FRAMES || path.join(os.tmpdir(), 'ad1-frames')).href;
const COUNT = { cidade: 180, noite: 359, liga: 350 };

// Captions: [start, end, text]; *word* = highlighted. Words pop in one after another.
const CAPS = [
  [0.3, 3.35, 'Fora do horário, a clínica está *fechada.*'],
  [3.6, 5.5, 'A paciente manda mensagem.'],
  [5.6, 7.35, '*Ninguém* *responde.*'],
  [7.6, 10.35, 'Ela chama *outra* *clínica…*'],
  [10.6, 13.15, '…e marca *lá.*'],
  [16.0, 18.5, 'Com a Ana, ela tem resposta *na* *hora*'],
  [18.6, 20.95, 'e o horário fica *reservado.*'],
];
const capHtml = CAPS.map(([, , txt], i) => `<div class="cap" id="cap${i}">${txt.split(' ').map((w) => (/^\*.*\*$/.test(w) ? `<span class="w hl">${w.slice(1, -1)}</span>` : `<span class="w">${w}</span>`)).join(' ')}</div>`).join('');

const CHECK = '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
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
.red{position:absolute;inset:0;background:radial-gradient(900px 900px at 50% 40%,rgba(224,52,75,.28),transparent 70%),#07050a}
.brand{position:absolute;left:66px;top:258px;display:flex;gap:12px;align-items:center;font-weight:800;letter-spacing:.14em;font-size:26px;color:#f3f5f9;z-index:30;text-shadow:0 2px 12px rgba(0,0,0,.6)}
.brand svg{height:32px;width:auto}
.dram{position:absolute;left:50%;top:312px;transform:translateX(-50%);padding:8px 22px;border-radius:12px;background:rgba(5,7,12,.72);font-size:34px;font-weight:700;color:#fff;z-index:30;white-space:nowrap}
.niche{position:absolute;left:50%;top:392px;padding:12px 28px;border-radius:999px;background:#ffd23f;color:#111;font-weight:900;font-size:32px;letter-spacing:.06em;z-index:30;white-space:nowrap;box-shadow:0 14px 30px -14px rgba(0,0,0,.7)}
.cap{position:absolute;left:56px;right:56px;top:1350px;text-align:center;font-weight:900;font-size:80px;line-height:1.05;letter-spacing:-.035em;text-shadow:0 4px 24px rgba(0,0,0,.85),0 0 2px rgba(0,0,0,.6);z-index:25;visibility:hidden}
.w{display:inline-block}.hl{color:#ffd23f}
.clock{position:absolute;left:0;right:0;top:500px;text-align:center;font-weight:200;font-size:230px;letter-spacing:-.04em;text-shadow:0 10px 40px rgba(0,0,0,.6);z-index:20}
.sign{position:absolute;left:50%;top:790px;padding:26px 46px;border-radius:26px;background:rgba(250,251,253,.96);color:#121826;text-align:center;z-index:20;box-shadow:0 30px 60px -24px rgba(0,0,0,.8)}
.sign b{display:block;font-size:64px;font-weight:900;letter-spacing:.12em;color:#e0344b}
.sign span{display:block;margin-top:6px;font-size:32px;font-weight:700;color:#4a5568}
.bub{position:absolute;max-width:760px;padding:22px 26px;border-radius:30px;font-size:34px;line-height:1.3;font-weight:600;z-index:20;box-shadow:0 24px 50px -20px rgba(0,0,0,.75)}
.bub small{display:block;text-align:right;font-size:22px;font-weight:600;margin-top:6px}
.bub.out{right:70px;background:#dbe8ff;color:#10213a;border-top-right-radius:8px}.bub.out small{color:#64748b}
.bub.in{left:70px;background:#fff;color:#10213a;border-top-left-radius:8px}.bub.in small{color:#64748b}
.bub .who{display:block;font-size:24px;font-weight:800;color:#64748b;margin-bottom:6px;letter-spacing:.02em}
.chip{position:absolute;left:50%;padding:14px 28px;border-radius:999px;font-size:34px;font-weight:800;white-space:nowrap;z-index:20}
.chip.grey{background:rgba(5,7,12,.82);border:1px solid rgba(255,255,255,.3);color:#e6eaf2}
.booked{position:absolute;left:90px;right:90px;top:470px;display:flex;gap:22px;align-items:center;padding:30px 32px;border-radius:32px;background:#fff;color:#121826;z-index:20;box-shadow:0 30px 60px -24px rgba(0,0,0,.8)}
.booked .ok{width:72px;height:72px;border-radius:50%;background:#14b89a;display:grid;place-items:center;flex:none}
.booked b{display:block;font-size:40px;font-weight:900}.booked span{display:block;font-size:30px;color:#4a5568;margin-top:4px}
.lost{position:absolute;left:60px;right:60px;top:560px;text-align:center;font-weight:900;font-size:96px;line-height:1.02;letter-spacing:-.04em}
.lost .hl{color:#ff5a6e}
.lost2{position:absolute;left:60px;right:60px;top:1060px;text-align:center;font-size:52px;font-weight:700;color:#c6cede}
.tag{position:absolute;left:50%;top:385px;padding:12px 28px;border-radius:999px;background:#0865fe;font-size:30px;font-weight:800;white-space:nowrap;z-index:20}
.phone{position:absolute;left:50%;top:455px;width:720px;height:870px;margin-left:-360px;border-radius:72px;background:#0d1220;padding:16px;box-shadow:0 70px 140px -40px rgba(8,101,254,.75),0 0 0 2px rgba(255,255,255,.1);z-index:10}
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
.end .mark{position:absolute;left:50%;top:390px;width:150px;margin-left:-75px}
.end .big{position:absolute;left:50px;right:50px;top:570px;text-align:center;font-weight:900;font-size:96px;line-height:1.02;letter-spacing:-.04em}
.end .sub{position:absolute;left:90px;right:90px;top:880px;text-align:center;font-size:36px;color:#c6cede;line-height:1.35}
.cta{position:absolute;left:50%;top:1190px;padding:30px 58px;border-radius:999px;background:#0865fe;color:#fff;font-size:52px;font-weight:900;white-space:nowrap;box-shadow:0 30px 70px -20px rgba(8,101,254,.95)}
.cta-sub{position:absolute;left:0;right:0;top:1352px;text-align:center;font-size:34px;color:#e6eaf2}
`;

const body = `
<div class="brand">${MARK}GROWLIFT</div>
<section class="sc" id="s1"><img class="bgblur" id="v1b" alt=""><div class="clip"><img class="vid" id="v1" alt=""></div><div class="fade"></div><div class="niche" id="niche">CLÍNICAS ODONTOLÓGICAS</div>
  <div class="clock" id="clk">21:47</div><div class="sign" id="sign"><b>FECHADO</b><span>Abrimos amanhã às 8h</span></div></section>
<section class="sc" id="s2"><img class="bgblur" id="v2b" alt=""><div class="clip"><img class="vid" id="v2" alt=""></div><div class="fade"></div>
  <div class="bub out" id="q1" style="top:470px">Oi! Tô com dor de dente. Tem horário amanhã?<small>21:48 ✓</small></div><div class="chip grey" id="nr" style="top:720px">sem resposta</div></section>
<section class="sc" id="s3"><img class="bgblur" id="v3b" alt=""><div class="clip"><img class="vid" id="v3" alt=""></div><div class="fade"></div>
  <div class="bub out" id="q2" style="top:440px">Oi! Tem horário amanhã?<small>21:52 ✓✓</small></div>
  <div class="bub in" id="a2" style="top:650px"><span class="who">OUTRA CLÍNICA</span>Temos amanhã às 9h. Posso marcar?<small>21:52</small></div></section>
<section class="sc" id="s4"><img class="bgblur" id="v4b" alt=""><div class="clip"><img class="vid" id="v4" alt=""></div><div class="fade"></div>
  <div class="booked" id="bk"><div class="ok">${CHECK}</div><div><b>Marcado · amanhã, 9h</b><span>na outra clínica</span></div></div></section>
<section class="sc" id="s5"><div class="red"></div><div class="lost" id="l1">E se ela tivesse mandado para a <span class="hl">sua</span> clínica?</div><div class="lost2" id="l2">Você nem ficaria sabendo.</div></section>
<section class="sc" id="s6"><img class="bgblur" id="v6" alt=""><div class="tag" id="tg">A mesma noite, com a Ana</div><div class="phone"><div class="scr"><div class="top"><div class="av">A</div><div><b>Ana · Clínica Exemplo</b><span>assistente virtual</span></div></div>
  <div class="msgs">${msg('m1', 'in', 'Oi! Tô com dor de dente. Tem horário amanhã?', '21:48')}${dots('ty1')}${msg('m2', 'out', 'Oi! Aqui é a Ana, assistente virtual da Clínica Exemplo. Amanhã tenho 9h, 10h ou 15h. Qual fica melhor?', '21:48')}${msg('m3', 'in', '9h', '21:49')}${dots('ty2')}${msg('m4', 'out', 'Reservei amanhã às 9h. A equipe confirma com você logo cedo.', '21:49')}</div></div></div></section>
<section class="sc end" id="s7"><div class="dark" id="glow"></div><div class="mark" id="e0">${MARK.replace('<svg ', '<svg width="150" ')}</div>
  <div class="big" id="e1">A clínica fecha.<br>O atendimento, <span class="hl">não.</span></div>
  <div class="sub" id="e2">Assistente virtual com IA no WhatsApp, configurada por nós: responde fora do horário com as informações da clínica, e a equipe confirma o horário.</div>
  <div class="cta" id="e3">Peça uma demonstração</div><div class="cta-sub" id="e4">gratuita e sem compromisso, pelo WhatsApp</div></section>
${capHtml}`;

const script = `
window.MOTION=2;
const FR=${JSON.stringify(FR)}, CNT=${JSON.stringify(COUNT)}, CAPS=${JSON.stringify(CAPS.map(([a, b]) => [a, b]))};
const SC=[['s1',0,3.45],['s2',3.45,7.45],['s3',7.45,10.45],['s4',10.45,13.25],['s5',13.25,15.75],['s6',15.75,21.1],['s7',21.1,99]];
const pend=[];
function frame(img,clip,lt){const n=Math.max(1,Math.min(CNT[clip],1+Math.floor(lt*30)));const src=FR+'/'+clip+'/'+String(n).padStart(5,'0')+'.jpg';if(img.getAttribute('src')!==src){img.src=src;pend.push(img.decode().catch(()=>{}));}}
function frame2(id,clip,lt){frame($(id),clip,lt);const b=$(id+'b');if(b)frame(b,clip,lt);}
function kb(img,lt,dur,z0,z1,dx){const k=eioS(lt/dur);img.style.transform='translateX('+(dx*k)+'px) scale('+(z0+(z1-z0)*k)+')';}
const caps=CAPS.map((c,i)=>({a:c[0],b:c[1],el:$('cap'+i),ws:[...$('cap'+i).querySelectorAll('.w')]}));
function drawCaps(t){for(const c of caps){const vis=t>=c.a&&t<c.b;c.el.style.visibility=vis?'visible':'hidden';if(!vis)continue;
  const out=clamp((t-(c.b-0.15))/0.15);c.el.style.opacity=1-out;
  c.ws.forEach((w,i)=>{const k=eoS((t-c.a-i*0.055)/0.24);w.style.opacity=k;w.style.transform='translateY('+((1-k)*26)+'px) scale('+(0.88+0.12*k)+')';});}}
function pop(id,t,a,base){const el=$(id);const k=clamp((t-a)/0.3);const s=k<=0?0.7:(k<0.6?0.7+0.42*(k/0.6):1.12-0.12*((k-0.6)/0.4));el.style.transform=(base||'')+' scale('+s+')';el.style.opacity=k>0?Math.min(1,k*3):0;el.style.visibility=k>0?'visible':'hidden';}
window.render=async(t)=>{
  for(const [id,a,b] of SC){const el=$(id);const vis=t>=a&&t<b;el.style.visibility=vis?'visible':'hidden';if(!vis)continue;
    const kin=eoS((t-a)/0.24),kout=id==='s7'?1:eoS((b-t)/0.16);el.style.opacity=Math.min(kin,kout);el.style.transform='scale('+(1+0.05*(1-kin))+')';}
  if(t<3.45){frame2('v1','cidade',t);kb($('v1'),t,3.45,1.05,1.14,-30);show('niche',t,0.05,undefined,{dy:-16,fi:.3,base:'translateX(-50%)'});show('clk',t,0.25,undefined,{dy:20,fi:.4});pop('sign',t,0.9,'translateX(-50%)');}
  else if(t<7.45){const lt=t-3.45;frame2('v2','noite',lt+1.0);kb($('v2'),lt,4,1.0,1.1,14);show('q1',t,3.8,undefined,{dy:30,fi:.3});pop('nr',t,5.65,'translateX(-50%)');}
  else if(t<10.45){const lt=t-7.45;frame2('v3','liga',lt+2.6);kb($('v3'),lt,3,1.02,1.1,-10);show('q2',t,7.7,undefined,{dy:30,fi:.3});show('a2',t,8.6,undefined,{dy:30,fi:.3});}
  else if(t<13.25){const lt=t-10.45;frame2('v4','liga',lt+7.4);kb($('v4'),lt,2.8,1.04,1.12,0);pop('bk',t,10.9,'');}
  else if(t<15.75){show('l1',t,13.4,undefined,{dy:34,fi:.4});show('l2',t,14.2,undefined,{dy:20,fi:.35});}
  else if(t<21.1){const lt=t-15.75;frame($('v6'),'noite',lt+4.5);show('tg',t,15.9,undefined,{dy:-14,fi:.3,base:'translateX(-50%)'});
    show('m1',t,16.15,undefined,{dy:20,fi:.3});
    const ty1=$('ty1'),ty2=$('ty2');const t1=t>=16.7&&t<17.7,t2=t>=19.0&&t<19.8;ty1.style.display=t1?'flex':'none';ty2.style.display=t2?'flex':'none';
    [ty1,ty2].forEach(ty=>[...ty.children].forEach((d,i)=>{d.style.transform='translateY('+(-6*Math.max(0,Math.sin(t*9-i*0.9)))+'px)';}));
    $('m2').style.display=t>=17.7?'block':'none';$('m3').style.display=t>=18.5?'block':'none';$('m4').style.display=t>=19.8?'block':'none';
    show('m2',t,17.7,undefined,{dy:18,fi:.28});show('m3',t,18.5,undefined,{dy:18,fi:.28});show('m4',t,19.8,undefined,{dy:18,fi:.28});}
  else{const lt=t-21.1;$('glow').style.transform='scale('+(1+0.04*Math.sin(lt*1.3))+')';
    show('e0',t,21.2,undefined,{dy:20});show('e1',t,21.4,undefined,{dy:34});show('e2',t,21.95,undefined,{dy:20});show('e3',t,22.35,undefined,{dy:20,base:'translateX(-50%)'});show('e4',t,22.55,undefined,{dy:10});
    if(t>23){const p=1+0.03*Math.sin((t-23)*5);$('e3').style.transform='translateX(-50%) scale('+p+')';}}
  drawCaps(t);
  await Promise.all(pend.splice(0));
};`;

export const html = () => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;400;600;700;800;900&display=swap" rel="stylesheet"><style>${css}</style></head><body>${body}<script>${RUNTIME}${script}</script></body></html>`;

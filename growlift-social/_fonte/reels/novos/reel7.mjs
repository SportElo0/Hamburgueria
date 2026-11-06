// Reel 7 (estilo história, 01/11): "Quem atende é quem faz". Rafael messages a company expecting tickets and queues;
// the one who answers is the one who will build his site. The Growlift pair is drawn (no photos: decision of 01/11).
// Fictional, no outcome promised. Timed to narracao-7-eleven.mp3.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page, person, store, svgIcon, ICON, comentaBlock } from './base.mjs';
import { CSS, BG, BLUE, phone } from './estilo.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const img = (f) => pathToFileURL(path.resolve(HERE, '../../assets/hd', f)).href;

export const DURATION = 25.5;
export const COVER = 1.2;

const CAPS = [
  [0.0, 2.85, 'O Rafael tem um restaurante e precisava de um site', 'precisava de um site'],
  [3.2, 6.0, 'Mandou mensagem pra uma empresa e já imaginou:', 'já imaginou'],
  [6.45, 7.15, 'protocolo', 'protocolo'],
  [7.32, 7.85, 'fila', 'fila'],
  [8.16, 8.85, 'espera…', 'espera'],
  [9.34, 12.8, 'Mas do outro lado, quem respondeu foi quem ia fazer o site dele', 'quem ia fazer o site'],
  [13.26, 14.5, 'Ele contou do restaurante', 'contou'],
  [14.65, 18.15, 'recebeu a prévia no WhatsApp e conversou direto com quem faz', 'direto com quem faz'],
  [18.48, 20.1, 'Na Growlift, quem atende é quem faz', 'quem atende é quem faz'],
];

const bub = (id, side, html, extra = '') =>
  `<div id="${id}" style="margin:16px ${side === 'r' ? '18px 0 70px' : '70px 0 18px'};padding:16px 20px;border-radius:${side === 'r' ? '22px 22px 6px 22px' : '22px 22px 22px 6px'};background:${side === 'r' ? '#d9fdd3' : '#fff'};font-size:22px;font-weight:600;line-height:1.35;box-shadow:0 8px 20px -12px rgba(0,0,0,.3);${extra}">${html}</div>`;

const chat = `
  <div style="height:118px;background:#0f6e5c;color:#fff;display:flex;align-items:flex-end;padding:0 24px 16px;gap:14px">
    <div style="width:54px;height:54px;border-radius:50%;background:#fff;display:grid;place-items:center;font-weight:900;color:${BLUE};font-size:26px">G</div>
    <div><div style="font-size:24px;font-weight:800">Growlift</div><div style="font-size:17px;opacity:.85">online</div></div>
  </div>
  <div style="padding-top:10px">
  ${bub('m1', 'r', 'Oi! Tenho um restaurante e preciso de um site.')}
  ${bub('m2', 'l', 'Oi, Rafael! Sou eu que vou fazer o seu site. Me conta do restaurante?')}
  ${bub('m3', 'r', 'Comida caseira, almoço e jantar.')}
  ${bub('m4', 'l', `<div style="border-radius:12px;overflow:hidden;height:150px"><img src="${img('restaurante.png')}" style="width:100%;height:100%;object-fit:cover;object-position:top"></div><div style="margin-top:8px;font-weight:800">Prévia do seu site</div><div style="font-size:20px;color:#6a7385;font-weight:700">Projeto conceito</div>`)}
  </div>`;

const body = `
${BG}

<div id="hook" class="hook">Quem responde<br><span style="color:#8db8ff">é quem faz.</span></div>
<div id="rest" class="abs" style="left:600px;top:700px">${store('stR', 'RESTAURANTE', '#2fae78', { w: 380 })}</div>
<div id="rafa" class="abs" style="left:110px;top:700px">${person('pr', BLUE, { size: 380, hair: '#2b2118' })}</div>
<div id="rName" class="chip" style="left:180px;top:1110px">Rafael</div>

${phone('ph', { left: 330, top: 420, h: 840, search: false, inner: chat })}
<div id="t1" class="chip" style="left:60px;top:520px;color:#8790a6">protocolo</div>
<div id="t2" class="chip" style="left:800px;top:690px;color:#8790a6">fila</div>
<div id="t3" class="chip" style="left:60px;top:860px;color:#8790a6">espera…</div>

<div id="team" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="card" style="left:60px;top:430px;width:960px;height:560px;padding:40px;border-color:rgba(77,141,255,.5)">
    <div style="font-size:30px;font-weight:900;letter-spacing:.1em;color:#8db8ff">DO OUTRO LADO</div>
    <div class="abs" style="left:110px;top:150px">${person('g1', BLUE, { size: 320, hair: '#2b2118' })}</div>
    <div class="abs" style="left:520px;top:150px">${person('g2', BLUE, { size: 320, hair: '#5a3a22' })}</div>
  </div>
  <div class="chip" style="left:330px;top:1030px;color:#8db8ff;border-color:#4d8dff">Quem faz o seu site</div>
</div>

<div id="motto" class="big" style="top:560px;font-size:100px">Na Growlift,<br><span style="color:#4d8dff">quem atende<br>é quem faz.</span></div>

${comentaBlock('Quer conversar com a gente?', 'SITE')}
`;

const script = `
window.draw=(t)=>{
  show('hook',t,0,3.15,{dy:0,fi:.01});
  show('rafa',t,0.1,3.15,{dy:80}); show('rName',t,0.5,3.15,{pop:true,sc:.4}); show('rest',t,0.3,3.15,{pop:true,sc:.3,dy:0});
  // chat: he writes, imagines the queue
  const onPh=(t>=3.2&&t<9.3)||(t>=13.2&&t<18.45);
  show('ph',t,3.2,onPh?18.45:9.3,{dy:120,fi:.5}); if(!onPh){$('ph').style.opacity=0;$('ph').style.visibility='hidden';}
  show('m1',t,3.9,18.45,{dy:20}); show('m2',t,9.5,18.45,{dy:20}); show('m3',t,13.3,18.45,{dy:20}); show('m4',t,14.9,18.45,{pop:true,sc:.3});
  show('t1',t,6.45,9.3,{pop:true,sc:.4}); show('t2',t,7.32,9.3,{pop:true,sc:.4}); show('t3',t,8.16,9.3,{pop:true,sc:.4});
  // the other side: the ones who build it
  show('team',t,9.34,13.2,{dy:40});
  // motto
  show('motto',t,18.48,20.25,{pop:true,sc:.3,dy:0});
  comenta(t,20.29,22.83,'SITE');
};
`;

export const html = () => page({ css: CSS, body, script, captions: CAPS });

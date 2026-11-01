// Reel 3 (estilo história, 01/11): "Dois minutos". 11:30, the grill is hot; Marcos has two minutes between orders, fills
// in the free diagnosis on the phone (example data), goes back to the grill; within 2 business days the preview reaches
// his WhatsApp. Fictional, no outcome promised. Timed to narracao-3-eleven.mp3.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page, person, svgIcon, ICON, comentaBlock } from './base.mjs';
import { CSS, BG, GREEN, BLUE, phone } from './estilo.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const img = (f) => pathToFileURL(path.resolve(HERE, '../../assets/hd', f)).href;

export const DURATION = 26.5;
export const COVER = 1.2;

const CAPS = [
  [0.0, 2.55, 'Onze e meia, a chapa já quente', 'chapa'],
  [3.15, 6.15, 'O Marcos tem dois minutos entre um pedido e outro', 'dois minutos'],
  [6.53, 7.55, 'Ele pega o celular', 'celular'],
  [7.84, 8.95, 'conta sobre o negócio', 'negócio'],
  [9.13, 11.0, 'autoriza o contato e envia', 'envia'],
  [11.46, 12.45, 'Volta pra chapa', 'chapa'],
  [12.89, 14.3, 'Em até dois dias úteis', 'dois dias úteis'],
  [14.51, 16.95, 'chega no WhatsApp dele uma prévia do site', 'prévia'],
  [17.16, 18.45, 'feita pro negócio dele', 'negócio dele'],
  [18.97, 20.0, 'Sem compromisso', 'Sem compromisso'],
  [20.26, 22.75, 'Diagnóstico grátis, direto do celular', 'grátis'],
];

const grill = (id) => `<div id="${id}" class="abs" style="left:90px;top:1000px;width:900px;height:230px">
  <svg class="abs steam" style="left:0;top:-110px" width="900" height="110" viewBox="0 0 900 110">${[160, 340, 520, 700]
    .map((x) => `<path d="M${x} 100c-20-20 20-40 0-60s20-40 0-40" stroke="rgba(255,255,255,.35)" stroke-width="6" fill="none" stroke-linecap="round"/>`)
    .join('')}</svg>
  <div style="position:absolute;inset:0;border-radius:26px;background:#2a2f38;border:4px solid #3b4250;box-shadow:inset 0 0 60px rgba(255,120,40,.35)"></div>
  ${[120, 300, 480, 660].map((x) => `<div style="position:absolute;left:${x}px;top:60px;width:120px;height:110px;border-radius:50%;background:radial-gradient(#7a3b16,#4a220c);box-shadow:0 0 30px rgba(255,140,40,.5)"></div>`).join('')}
</div>`;

const form = `
  <div style="margin:46px 26px 0;font-size:30px;font-weight:900">Diagnóstico grátis</div>
  <div style="margin:6px 26px 0;font-size:19px;color:#6a7385">Leva menos de 2 minutos · dados de exemplo</div>
  ${[
    ['f1', 'Seu negócio', 'Lanchonete Exemplo'],
    ['f2', 'Cidade', 'São Paulo'],
    ['f3', 'WhatsApp', '(11) 90000-0000'],
  ]
    .map(
      ([id, l, v]) => `<div style="margin:18px 26px 0"><div style="font-size:18px;font-weight:700;color:#6a7385">${l}</div>
    <div style="margin-top:6px;height:58px;border-radius:14px;background:#fff;border:1px solid #dce2ec;display:flex;align-items:center;padding:0 18px;font-size:22px;font-weight:700"><span id="${id}"></span></div></div>`,
    )
    .join('')}
  <div style="margin:22px 26px 0;display:flex;align-items:center;gap:14px;font-size:21px;font-weight:700"><span id="chk" style="width:36px;height:36px;border-radius:10px;border:3px solid #9aa4b6;display:grid;place-items:center;background:#fff"></span>Autorizo o contato</div>
  <div id="btn" style="margin:26px 26px 0;height:70px;border-radius:999px;background:${BLUE};color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800">Enviar</div>
  <div id="sent" style="position:absolute;inset:0;background:rgba(244,246,250,.96);display:grid;place-items:center;text-align:center">
    <div><div style="width:120px;height:120px;border-radius:50%;background:${GREEN};display:grid;place-items:center;margin:0 auto">${svgIcon(ICON.check, 70, '#06210f', 3)}</div>
    <div style="font-size:32px;font-weight:900;margin-top:24px">Enviado!</div></div>
  </div>`;

const chat = `
  <div style="height:120px;background:#0f6e5c;color:#fff;display:flex;align-items:flex-end;padding:0 26px 18px;gap:16px">
    <div style="width:56px;height:56px;border-radius:50%;background:#fff;display:grid;place-items:center;font-weight:900;color:${BLUE};font-size:26px">G</div>
    <div><div style="font-size:24px;font-weight:800">Growlift</div><div style="font-size:17px;opacity:.85">online</div></div>
  </div>
  <div id="msg" style="margin:26px 22px 0 60px;background:#fff;border-radius:22px 22px 22px 6px;padding:14px;box-shadow:0 10px 30px -14px rgba(0,0,0,.3)">
    <div style="border-radius:14px;overflow:hidden;height:210px"><img src="${img('burger.png')}" style="width:100%;height:100%;object-fit:cover;object-position:top"></div>
    <div style="font-size:22px;font-weight:800;margin-top:12px">Prévia do seu site</div>
    <div style="font-size:18px;color:#6a7385;margin-top:4px">Feita para o seu negócio</div><div style="font-size:16px;font-weight:700;color:#8790a6;margin-top:6px">Exemplo · projeto conceito, nome fictício</div>
  </div>`;

const body = `
${BG}
<div class="disc">História fictícia. Telas com dados de exemplo.<br>Não garantimos clientes nem posição no Google.</div>

<div id="hook" class="hook">Dois minutos.<br><span style="color:#8db8ff">É o que ele tinha.</span></div>
<div id="clock" class="card" style="left:110px;top:610px;width:360px;padding:26px 34px">
  <div style="font-size:30px;font-weight:800;color:#8790a6;letter-spacing:.12em">HOJE</div>
  <div style="font-size:120px;font-weight:900;letter-spacing:-.04em;line-height:1">11:30</div>
</div>
${grill('grillA')}

<div id="marcos" class="abs" style="left:560px;top:560px">${person('pm', '#ff8a3d', { size: 360, hair: '#2b2118' })}</div>
<div id="mName" class="chip" style="left:640px;top:940px">Marcos</div>
<div id="tickets" class="abs" style="left:110px;top:440px;width:420px;height:520px">
  ${[0, 1, 2].map((i) => `<div id="tk${i}" class="card" style="left:${i * 26}px;top:${i * 120}px;width:340px;padding:22px 26px;border-radius:22px;background:#f3f5f9;color:#121826"><div style="font-size:22px;font-weight:800;color:#6a7385">PEDIDO #${41 + i}</div><div style="font-size:30px;font-weight:900;margin-top:6px">${['2 x-burger', '1 combo', '3 x-salada'][i]}</div></div>`).join('')}
</div>
<div id="timer" class="abs" style="left:110px;top:840px;width:200px;height:200px">
  <svg width="200" height="200" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,.15)" stroke-width="8" fill="none"/><circle id="arc" cx="50" cy="50" r="44" stroke="#8db8ff" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="276.5" stroke-dashoffset="0" transform="rotate(-90 50 50)"/></svg>
  <div id="tm" class="abs" style="left:0;right:0;top:66px;text-align:center;font-size:52px;font-weight:900">2:00</div>
</div>

${phone('phF', { left: 330, top: 400, h: 860, search: false, inner: form })}


<div id="back" class="big" style="top:520px;font-size:96px">Volta pra chapa.</div>

<div id="days" class="chip" style="left:110px;top:420px;color:#8db8ff;font-size:36px">Em até 2 dias úteis</div>
${phone('phW', { left: 330, top: 520, h: 740, search: false, inner: chat })}


<div id="free1" class="big" style="top:520px;font-size:110px">Sem<br>compromisso.</div>
<div id="free2" class="big" style="top:820px;font-size:64px;color:#8db8ff">Diagnóstico grátis,<br>direto do celular.</div>

${comentaBlock('Quer o seu?', 'SITE')}
`;

const script = `
window.draw=(t)=>{
  show('hook',t,0,3.1,{dy:0,fi:.01});
  show('clock',t,0.05,3.1,{pop:true,sc:.3,dy:0});
  show('grillA',t,0.2,6.45,{dy:40}); document.querySelectorAll('.steam').forEach(s=>s.style.transform='translateY('+(-8*Math.sin(t*3))+'px)');
  show('marcos',t,1.4,6.45,{dy:80}); show('mName',t,1.8,6.45,{pop:true,sc:.4});
  // two minutes between orders
  show('tickets',t,3.1,6.45,{dy:0,fi:.01});
  for(let i=0;i<3;i++) show('tk'+i,t,3.2+i*.35,6.45,{pop:true,sc:.3,dy:-30});
  show('timer',t,4.6,6.45,{pop:true,sc:.4,dy:0});
  // form
  show('phF',t,6.5,11.42,{dy:120,fi:.5});
  const fill=(id,a,txt)=>{const n=Math.floor(clamp((t-a)/.6)*txt.length); $(id).textContent=txt.slice(0,n);};
  fill('f1',7.85,'Lanchonete Exemplo'); fill('f2',8.4,'São Paulo'); fill('f3',8.75,'(11) 90000-0000');
  $('chk').innerHTML=t>9.4?'${svgIcon(ICON.check, 26, BLUE, 3.4)}':''; $('chk').style.borderColor=t>9.4?'${BLUE}':'#9aa4b6';
  $('btn').style.transform='scale('+(t>10.2&&t<10.5?0.94:1)+')';
  show('sent',t,10.5,11.42,{pop:true,sc:.2,dy:0});
  // back to the grill
  show('back',t,11.46,12.85,{pop:true,sc:.3,dy:0});
  if(t>=11.46&&t<12.85){ $('grillA').style.opacity=1; $('grillA').style.visibility='visible'; $('grillA').style.transform='none'; $('marcos').style.opacity=1; $('marcos').style.visibility='visible'; $('marcos').style.transform='translate(0,120px)'; }
  // the preview arrives
  show('days',t,12.89,18.9,{pop:true,sc:.4});
  show('phW',t,13.2,18.9,{dy:120,fi:.5}); show('msg',t,14.6,18.9,{pop:true,sc:.3});
  // no strings attached
  show('free1',t,18.95,23.1,{pop:true,sc:.3,dy:0}); show('free2',t,20.25,23.1,{dy:30});
  comenta(t,23.15,24.06,'SITE');
};
`;

export const html = () => page({ css: CSS, body, script, captions: CAPS });

// Reel 15 (estilo história, 02/11): "O celular não para". Saturday 9 pm, Carla's oven is full and the WhatsApp keeps
// asking the same things; with quick replies and a menu link she answers fast and goes back to the oven. Fictional,
// no outcome promised. Timed to narracao-15-eleven.mp3.
import { page, person, food, svgIcon, ICON, comentaBlock } from './base.mjs';
import { CSS, BG, phone } from './estilo.mjs';

export const DURATION = 25.3;
export const COVER = 1.2;

const CAPS = [
  [0, 2.77, 'Sábado, nove da noite. O forno está cheio', 'forno'],
  [3.19, 4.78, 'e o celular da Carla não para', 'não para'],
  [4.78, 5.9, '“Tem entrega?”', 'entrega'],
  [6.2, 7.3, '“Que horas fecha?”', 'fecha'],
  [7.28, 8.45, '“Tem cardápio?”', 'cardápio'],
  [8.44, 11.0, 'Cada mensagem é um cliente esperando', 'esperando'],
  [11.03, 13.9, 'Com respostas prontas e um cardápio num link', 'respostas prontas'],
  [13.88, 16.7, 'ela responde rápido e volta pro forno', 'rápido'],
  [16.7, 20.45, 'O cliente vê o cardápio com preço e já sabe o que quer', 'com preço'],
];

const bubble = (id, side, txt) => `<div id="${id}" style="display:flex;justify-content:${side === 'in' ? 'flex-start' : 'flex-end'};margin:12px 0"><span style="max-width:84%;padding:16px 20px;border-radius:${side === 'in' ? '22px 22px 22px 6px' : '22px 22px 6px 22px'};background:${side === 'in' ? '#202c33' : '#005c4b'};font-size:27px;line-height:1.35;color:#e9edef">${txt}</span></div>`;
const chatScreen = (inner) => `<div style="height:100%;background:#0b141a;padding:56px 16px 0">${inner}</div>`;
const menuCard = `<div style="background:#fff;border-radius:18px;overflow:hidden;margin-top:8px;color:#121826">
  ${[['burger', 'Lanche da casa'], ['fries', 'Batata'], ['drink', 'Refrigerante']].map(([k, n]) => `<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-bottom:1px solid #eef1f6">${food(k, 60)}<span style="flex:1;font-size:22px;font-weight:800">${n}</span><span style="font-size:22px;font-weight:800;color:#0865fe">R$ 00,00</span></div>`).join('')}</div>`;

const body = `
${BG}
<div class="disc">História fictícia · telas de exemplo.<br>Não garantimos clientes nem vendas.</div>

<div id="hook" class="hook">O celular<br><span style="color:#ffb37a">não para.</span></div>
<div id="clock" class="card" style="left:110px;top:610px;width:360px;padding:26px 34px">
  <div style="font-size:30px;font-weight:800;color:#8790a6;letter-spacing:.12em">SÁBADO</div>
  <div style="font-size:120px;font-weight:900;letter-spacing:-.04em;line-height:1">21:00</div>
</div>
<div id="oven" class="abs" style="left:560px;top:620px;width:420px;height:320px;border-radius:30px;background:#2a2f38;border:4px solid #3b4250;box-shadow:inset 0 0 80px rgba(255,120,40,.55)"><div style="position:absolute;left:40px;right:40px;top:60px;bottom:60px;border-radius:20px;background:radial-gradient(#ff8a3d,#7a2e0c)"></div></div>
<div id="carla" class="abs" style="left:110px;top:900px">${person('pc', '#ff8a3d', { size: 330, hair: '#2b2118' })}</div>
<div id="cName" class="chip" style="left:170px;top:1240px">Carla</div>

${phone('ph', { left: 300, top: 430, w: 480, h: 820, search: false, inner: chatScreen(bubble('m1', 'in', 'Tem entrega?') + bubble('m2', 'in', 'Que horas fecha?') + bubble('m3', 'in', 'Tem cardápio?')) })}
<div id="badge" class="abs" style="left:740px;top:400px;width:90px;height:90px;border-radius:50%;background:#ff6b5b;display:grid;place-items:center;font-size:44px;font-weight:900;z-index:5">0</div>

<div id="wait" class="big" style="top:560px;font-size:96px">Cada mensagem<br><span style="color:#ffb37a">é um cliente<br>esperando.</span></div>

${phone('ph2', { left: 300, top: 430, w: 480, h: 820, search: false, inner: chatScreen(bubble('q1', 'in', 'Tem cardápio?') + `<div id="slash" style="margin:16px 0 0 auto;width:max-content;padding:10px 18px;border-radius:14px;background:rgba(8,101,254,.3);color:#cfe0ff;font-size:26px;font-weight:800">/cardapio</div>` + `<div id="q2" style="display:flex;justify-content:flex-end;margin:12px 0"><span style="max-width:88%;padding:14px;border-radius:22px 22px 6px 22px;background:#005c4b;font-size:26px;color:#e9edef">Tem sim! Com fotos e preços:${menuCard}</span></div>`) })}
<div id="back" class="chip" style="left:90px;top:1120px;color:#ffb37a;border-color:#ffb37a">e volta pro forno</div>

<div id="cust" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="abs" style="left:80px;top:860px">${person('pq', '#2fae78', { size: 300, hair: '#3a2a1e' })}</div>
  ${phone('ph3', { left: 470, top: 460, w: 520, h: 760, search: false, inner: `<div style="padding:50px 20px 0"><div style="font-size:30px;font-weight:900">Cardápio</div><div style="font-size:18px;color:#6a7385;margin-bottom:8px">Exemplo · nome fictício</div>${menuCard}</div>` })}
  <div id="pick" class="chip" style="left:90px;top:640px;color:#8db8ff;border-color:#4d8dff">já sabe o que quer</div>
</div>

${comentaBlock('Quer um cardápio com cara de site?', 'SITE')}
`;

const script = `
window.draw=(t)=>{
  show('hook',t,0,3.15,{dy:0,fi:.01});
  show('clock',t,0.05,3.15,{pop:true,sc:.3,dy:0}); show('oven',t,0.3,3.15,{pop:true,sc:.3,dy:0});
  show('carla',t,1.2,3.15,{dy:80}); show('cName',t,1.5,3.15,{pop:true,sc:.4});
  show('ph',t,3.19,8.44,{dy:120,fi:.5});
  show('m1',t,4.78,8.44,{pop:true,sc:.3}); show('m2',t,6.2,8.44,{pop:true,sc:.3}); show('m3',t,7.28,8.44,{pop:true,sc:.3});
  const b=show('badge',t,4.0,8.44,{pop:true,sc:.4,dy:0}); $('badge').textContent=String(t<4.78?1:t<6.2?3:t<7.28?6:9);
  show('wait',t,8.44,11.0,{pop:true,sc:.3,dy:0});
  show('ph2',t,11.03,16.7,{dy:120,fi:.5});
  show('q1',t,11.2,16.7,{dy:20}); show('slash',t,12.2,16.7,{pop:true,sc:.4}); show('q2',t,13.1,16.7,{pop:true,sc:.3});
  show('back',t,14.6,16.7,{pop:true,sc:.4});
  show('cust',t,16.7,20.45,{dy:40}); show('pick',t,18.4,20.45,{pop:true,sc:.4});
  comenta(t,20.46,23.26,'SITE');
};
`;

export const html = () => page({ css: CSS, body, script, captions: CAPS });

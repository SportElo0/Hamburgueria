// Reel 16 (estilo história, 02/11): "O cardápio em PDF". Lu finds a pizzeria on Instagram, taps the menu link: a heavy
// PDF that takes forever, opens tiny, no price in sight; she goes elsewhere and the owner never knows. A menu that opens
// at once, with photos and prices. Fictional, no outcome promised. Timed to narracao-16-eleven.mp3.
import { page, person, svgIcon, ICON, comentaBlock } from './base.mjs';
import { CSS, BG, RED, GREEN, phone } from './estilo.mjs';

export const DURATION = 26.2;
export const COVER = 1.2;

const CAPS = [
  [0, 3.53, 'A Lu está com fome e acha uma pizzaria no Instagram', 'pizzaria'],
  [3.53, 5.72, 'Toca no link do cardápio', 'link'],
  [5.72, 6.33, 'um PDF.', 'PDF'],
  [6.33, 9.16, 'Carregando… carregando…', 'Carregando'],
  [9.16, 10.21, 'Abre pequeno', 'pequeno'],
  [10.21, 11.21, 'ela dá zoom', 'zoom'],
  [11.21, 13.72, 'procura o preço e não acha', 'não acha'],
  [13.72, 15.25, 'Fecha e vai pra outra', 'vai pra outra'],
  [15.25, 16.99, 'O dono nunca soube', 'nunca soube'],
  [16.99, 20.4, 'Um cardápio que abre na hora, com foto e preço', 'abre na hora'],
  [20.62, 21.95, 'deixa o caminho curto', 'caminho curto'],
];

const pizza = (s = 70) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#e8a54b"/><circle cx="50" cy="50" r="36" fill="#e8483b"/><circle cx="50" cy="50" r="33" fill="#ffd27a"/><circle cx="38" cy="40" r="6" fill="#b3261e"/><circle cx="62" cy="46" r="6" fill="#b3261e"/><circle cx="48" cy="64" r="6" fill="#b3261e"/></svg>`;
const insta = `<div style="padding:56px 22px 0;text-align:center"><div style="width:110px;height:110px;margin:0 auto;border-radius:50%;background:#fde2e2;display:grid;place-items:center">${pizza(80)}</div><div style="font-size:28px;font-weight:900;margin-top:12px">Pizzaria Exemplo</div><div style="font-size:18px;color:#6a7385">perfil fictício</div><div id="lk" style="margin:22px auto 0;width:max-content;padding:12px 22px;border-radius:999px;background:#eef2f8;font-size:22px;font-weight:800;color:#0865fe">🔗 cardápio aqui</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:22px">${Array.from({ length: 6 }, (_, i) => `<div style="aspect-ratio:1;background:${['#ffe8cc', '#fde2e2', '#fff1c2'][i % 3]}"></div>`).join('')}</div></div>`;
const pdf = `<div style="height:100%;background:#525659;padding:50px 14px 0;color:#121826">
  <div style="display:flex;align-items:center;gap:10px;color:#fff;font-size:20px;font-weight:700;margin-bottom:14px">${svgIcon(ICON.menu, 26, '#fff')}cardapio_final_v3.pdf · 18 MB</div>
  <div id="load" style="height:12px;border-radius:6px;background:#3a3d40;overflow:hidden"><div id="bar" style="height:100%;width:0;background:#4d8dff"></div></div>
  <div id="sheet" style="margin:24px auto 0;width:300px;height:420px;background:#fff;padding:18px;transform-origin:30% 30%">
    <div style="font-size:16px;font-weight:900">CARDÁPIO</div>
    ${Array.from({ length: 14 }, () => `<div style="height:7px;border-radius:3px;background:#c9ced6;margin-top:9px;width:${50 + Math.round(Math.random() * 45)}%"></div>`).join('')}
  </div>
</div>`;
const good = `<div style="padding:50px 18px 0"><div style="font-size:30px;font-weight:900">Cardápio</div><div style="font-size:18px;color:#6a7385;margin-bottom:10px">Exemplo · nome fictício</div>
  ${['Margherita', 'Calabresa', 'Quatro queijos'].map((n) => `<div style="display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e3e8f0;border-radius:18px;padding:12px;margin-top:10px">${pizza(64)}<span style="flex:1;font-size:24px;font-weight:800">${n}</span><span style="font-size:24px;font-weight:800;color:#0865fe">R$ 00,00</span></div>`).join('')}
  <div style="margin-top:16px;height:64px;border-radius:999px;background:#0865fe;color:#fff;display:grid;place-items:center;font-size:24px;font-weight:800">Pedir pelo WhatsApp</div></div>`;

const body = `
${BG}
<div class="disc">História fictícia · telas de exemplo, nome fictício.<br>Não garantimos clientes nem vendas.</div>

<div id="hook" class="hook">O cardápio<br><span style="color:${RED}">que ninguém abriu.</span></div>
<div id="lu" class="abs" style="left:110px;top:780px">${person('pl', '#8b5cf6', { size: 340, hair: '#2b2118' })}</div>
<div id="lName" class="chip" style="left:180px;top:1170px">Lu</div>
${phone('ph', { left: 540, top: 640, w: 440, h: 620, search: false, inner: insta })}

${phone('ph2', { left: 300, top: 430, w: 480, h: 820, search: false, inner: pdf })}
<div id="spin" class="chip" style="left:90px;top:1120px;color:#8790a6">carregando…</div>
<div id="mag" class="abs" style="left:640px;top:760px">${svgIcon(ICON.search, 160, '#ffc94d', 2)}</div>
<div id="noprice" class="abs" style="left:780px;top:600px;font-size:160px;font-weight:900;color:${RED}">?</div>

<div id="away" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="lbl" style="left:110px;top:430px;color:#8790a6">FOI PRA OUTRA</div>
  <svg class="abs" style="left:110px;top:510px" width="860" height="60" viewBox="0 0 860 60"><line x1="0" y1="30" x2="810" y2="30" stroke="#8790a6" stroke-width="8" stroke-linecap="round" stroke-dasharray="26 20"/><path d="M800 8l40 22-40 22" fill="none" stroke="#8790a6" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  <div class="card" style="left:110px;top:660px;width:860px;height:560px;padding:40px">
    <div style="font-size:30px;font-weight:900;letter-spacing:.1em;color:${RED}">E O DONO NUNCA SOUBE</div>
    <div class="abs" style="left:60px;top:150px">${person('po', RED, { size: 320, hair: '#3a2a1e' })}</div>
  </div>
</div>

${phone('ph3', { left: 300, top: 430, w: 480, h: 820, search: false, inner: good })}
<div id="fast" class="chip" style="left:90px;top:520px;color:${GREEN};border-color:${GREEN}">abre na hora</div>
<div id="short" class="chip" style="left:800px;top:1000px;color:#8db8ff;border-color:#4d8dff">caminho curto</div>

${comentaBlock('Quer ver um assim?', 'CARDÁPIO')}
`;

const script = `
window.draw=(t)=>{
  show('hook',t,0,3.5,{dy:0,fi:.01});
  show('lu',t,0.1,5.7,{dy:80}); show('lName',t,0.5,5.7,{pop:true,sc:.4});
  show('ph',t,0.8,5.7,{dy:120,fi:.5});
  $('lk').style.transform='scale('+(t>4.4&&t<4.8?.9:1)+')'; $('lk').style.boxShadow=t>3.9?'0 0 0 6px rgba(8,101,254,.3)':'none';
  show('ph2',t,5.72,13.72,{dy:120,fi:.5});
  $('bar').style.width=(clamp((t-6.0)/3.3)*100)+'%';
  show('sheet',t,9.16,13.72,{dy:0,fi:.2});
  const z=t>10.21?1+eo((t-10.21)/.6)*.9:1; $('sheet').style.transform='scale('+z+')';
  show('spin',t,6.33,9.16,{pop:true,sc:.4});
  show('mag',t,11.21,13.72,{pop:true,sc:.4,dy:0}); if(t>11.6) $('mag').style.transform='translate('+(40*Math.sin(t*3))+'px,'+(30*Math.cos(t*2.4))+'px)';
  show('noprice',t,12.4,13.72,{pop:true,sc:.4,dy:0});
  show('away',t,13.72,16.99,{dy:40});
  show('ph3',t,16.99,22.15,{dy:120,fi:.3}); show('fast',t,17.4,22.15,{pop:true,sc:.4}); show('short',t,20.62,22.15,{pop:true,sc:.4});
  comenta(t,22.17,23.32,'CARDÁPIO');
};
`;

export const html = () => page({ css: CSS, body, script, captions: CAPS });

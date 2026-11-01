// Reel 4 (estilo história, 01/11): "Ela procurou e não achou". Saturday noon, Ana searches "hamburgueria perto de mim";
// seu João's place is two blocks away but does not show up; the three signs (menu only as Instagram photos, wrong hours
// on Google, ordering only by message); she goes elsewhere and he never knows. Fictional, no outcome promised.
// Timed to narracao-4-eleven.mp3.
import { page, person, store, svgIcon, ICON, comentaBlock } from './base.mjs';
import { CSS, BG, RED, phone, TYPE } from './estilo.mjs';

export const DURATION = 27.5;
export const COVER = 1.2;

const CAPS = [
  [0.0, 1.45, 'Sábado, meio-dia', 'meio-dia'],
  [1.92, 4.5, 'A Ana está com fome e digita no celular', 'fome'],
  [4.77, 6.1, '“hamburgueria perto de mim”', 'perto de mim'],
  [6.53, 9.2, 'A lanchonete do seu João fica a duas quadras…', 'duas quadras'],
  [9.73, 10.85, 'mas não aparece', 'não aparece'],
  [11.34, 13.6, 'O cardápio só existe em foto no Instagram', 'só em foto'],
  [13.97, 15.55, 'O horário no Google está errado', 'errado'],
  [15.97, 18.15, 'E pra pedir, só mandando mensagem', 'só mandando mensagem'],
  [18.68, 22.3, 'A Ana escolhe outro lugar, e o seu João nem sabe que ela procurou', 'nem sabe'],
];

const SIGNS = [
  ['sg1', 11.34, ICON.photo, 'Cardápio só em foto', 'no Instagram'],
  ['sg2', 13.97, ICON.clock, 'Horário errado', 'no Google'],
  ['sg3', 15.97, ICON.chat, 'Pra pedir?', 'Só mandando mensagem'],
];

const results = ['Hamburgueria A', 'Hamburgueria B', 'Hamburgueria C']
  .map(
    (n, i) => `<div id="r${i}" style="margin:18px 22px 0;background:#fff;border:1px solid #e3e8f0;border-radius:22px;padding:18px;display:flex;gap:14px;align-items:center">
  <div style="width:70px;height:70px;border-radius:16px;background:#ffe8cc;display:grid;place-items:center">${svgIcon(ICON.pin, 34, '#e8a54b')}</div>
  <div><div style="font-size:24px;font-weight:800">${n}</div><div style="font-size:19px;color:#6a7385;margin-top:4px">${['800 m', '1,2 km', '1,5 km'][i]} · aberto</div></div></div>`,
  )
  .join('');

const body = `
${BG}
<div class="disc">História fictícia. Tela ilustrativa, não é do Google.<br>Não garantimos clientes nem posição no Google.</div>

<div id="hook" class="hook">Ela procurou.<br><span style="color:${RED}">Não achou.</span></div>
<div id="clock" class="card" style="left:110px;top:610px;width:400px;padding:26px 34px">
  <div style="font-size:30px;font-weight:800;color:#8790a6;letter-spacing:.12em">SÁBADO</div>
  <div style="font-size:120px;font-weight:900;letter-spacing:-.04em;line-height:1">12:00</div>
</div>
<div id="ana" class="abs" style="left:110px;top:860px">${person('pa', '#e86a9a', { size: 330, hair: '#6b3a1f' })}</div>
<div id="aName" class="chip" style="left:170px;top:1225px">Ana</div>

${phone('ph', { left: 560, top: 600, h: 660, inner: results })}

<!-- seu João's place, two blocks away -->
<div id="joao" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="abs" style="left:110px;top:420px">${store('stJ', 'LANCHES', '#ffc94d', { w: 380 })}</div>
  <div class="chip" style="left:120px;top:780px;border-color:#ffc94d">Lanchonete do seu João</div>
  <div class="chip" style="left:120px;top:870px;color:#8db8ff">a 2 quadras</div>
</div>
<div id="miss" class="abs" style="left:170px;top:640px;padding:14px 30px;border-radius:14px;background:${RED};color:#fff;font-size:42px;font-weight:900;letter-spacing:.06em;transform:rotate(-6deg);z-index:20">NÃO APARECE</div>

<!-- the three signs -->
<div id="signs" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="lbl" style="left:110px;top:410px;color:#8790a6">TRÊS SINAIS</div>
  ${SIGNS.map(
    ([id, , ic, a, b], i) => `<div id="${id}" class="card" style="left:110px;top:${500 + i * 230}px;width:860px;height:200px;padding:34px 40px;display:flex;align-items:center;gap:30px;border-color:rgba(255,107,91,.45)">
      <div style="flex:none;width:110px;height:110px;border-radius:28px;background:rgba(255,107,91,.15);display:grid;place-items:center">${svgIcon(ic, 62, RED, 2.2)}</div>
      <div><div style="font-size:48px;font-weight:900;letter-spacing:-.02em">${a}</div><div style="font-size:34px;font-weight:700;color:#c6cede;margin-top:6px">${b}</div></div>
      <div style="margin-left:auto;font-size:60px;font-weight:900;color:${RED}">${i + 1}</div>
    </div>`,
  ).join('')}
</div>

<!-- she goes elsewhere; he never knows -->
<div id="away" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="lbl" style="left:110px;top:430px;color:#8790a6">FOI PRA OUTRO LUGAR</div>
  <svg class="abs" style="left:110px;top:510px" width="860" height="60" viewBox="0 0 860 60"><line x1="0" y1="30" x2="810" y2="30" stroke="#8790a6" stroke-width="8" stroke-linecap="round" stroke-dasharray="26 20"/><path d="M800 8l40 22-40 22" fill="none" stroke="#8790a6" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  <div class="card" style="left:110px;top:660px;width:860px;height:560px;padding:40px">
    <div style="font-size:30px;font-weight:900;letter-spacing:.1em;color:#ffc94d">ENQUANTO ISSO, O SEU JOÃO</div>
    <div class="abs" style="left:60px;top:150px">${person('pj', '#ffc94d', { size: 320, hair: '#9a9a9a' })}</div>
  </div>
</div>
<div id="bubJ" class="bubble" style="left:470px;top:860px">Ninguém procurou hoje…</div>

${comentaBlock('Reconheceu algum desses sinais?', 'GOOGLE')}
`;

const script = `
${TYPE}
window.draw=(t)=>{
  show('hook',t,0,4.45,{dy:0,fi:.01});
  show('clock',t,0.05,4.45,{pop:true,sc:.3,dy:0});
  show('ana',t,1.8,6.45,{dy:80}); show('aName',t,2.2,6.45,{pop:true,sc:.4});
  show('ph',t,2.4,6.45,{dy:120,fi:.5});
  typeQ(t,4.75,1.2,'hamburgueria perto de mim');
  for(let i=0;i<3;i++) show('r'+i,t,5.9+i*.15,6.45,{dy:20,fi:.25});
  // seu João
  show('joao',t,6.5,11.3,{dy:40});
  show('miss',t,9.7,11.3,{pop:true,sc:.5,dy:0,base:'rotate(-6deg)'});
  // signs
  show('signs',t,11.3,18.65,{dy:0,fi:.2});
  ${SIGNS.map(([id, a]) => `show('${id}',t,${a},18.65,{dy:30,x:-60});`).join('')}
  // away
  show('away',t,18.68,22.7,{dy:40});
  show('bubJ',t,20.4,22.7,{pop:true,sc:.4});
  comenta(t,22.7,24.86,'GOOGLE');
};
`;

export const html = () => page({ css: CSS, body, script, captions: CAPS });

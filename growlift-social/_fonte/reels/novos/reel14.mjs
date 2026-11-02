// Reel 14 (estilo história, 02/11): "Uma estrela". Zé gets a one-star review, wants to answer in anger, breathes and
// answers politely; days later someone looking for lunch reads the review and the reply. Fictional, no outcome promised.
// Timed to narracao-14-eleven.mp3.
import { page, person, svgIcon, ICON, comentaBlock } from './base.mjs';
import { CSS, BG, RED, phone } from './estilo.mjs';

export const DURATION = 27.4;
export const COVER = 1.2;

const CAPS = [
  [0, 2.33, 'Segunda de manhã, o Zé abre o celular', 'Zé'],
  [2.33, 3.43, 'uma estrela.', 'uma estrela'],
  [3.43, 5.35, '“Demorou e chegou frio.”', 'frio'],
  [5.35, 7.71, 'Dá vontade de responder no calor', 'no calor'],
  [7.71, 9.4, 'Ele respira e escreve', 'respira'],
  [9.4, 13.12, 'Sentimos muito, pode chamar a gente no WhatsApp?', 'Sentimos muito'],
  [13.48, 14.9, 'Queremos resolver.', 'resolver'],
  [14.97, 17.75, 'Dias depois, alguém procura onde almoçar', 'onde almoçar'],
  [17.79, 18.9, 'lê a crítica…', 'crítica'],
  [18.92, 19.9, 'e lê a resposta', 'a resposta'],
  [19.9, 22.9, 'Quem responde com educação mostra quem é', 'com educação'],
];

const star = (on, s = 46) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="${on ? '#ffc94d' : '#d5dbe5'}"/></svg>`;
const reviewCard = (id, top) => `<div id="${id}" class="card" style="left:90px;right:90px;top:${top}px;background:#f4f6fa;color:#121826;padding:34px 40px">
  <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:34px">Cliente fictício</b><span>${star(1)}${star(0)}${star(0)}${star(0)}${star(0)}</span></div>
  <p style="font-size:44px;font-weight:600;margin-top:16px;color:#2b3446">“Demorou e chegou frio.”</p></div>`;

const body = `
${BG}
<div class="disc">História fictícia · avaliação de exemplo.<br>Não garantimos clientes nem posição no Google.</div>

<div id="hook" class="hook">Uma estrela.<br><span style="color:${RED}">E agora?</span></div>
<div id="ze" class="abs" style="left:110px;top:760px">${person('pz', '#2fae78', { size: 360, hair: '#3a2a1e' })}</div>
<div id="zName" class="chip" style="left:180px;top:1160px">Zé</div>
${phone('ph', { left: 560, top: 700, h: 520, search: false, inner: `<div style="padding:60px 24px 0"><div style="font-size:24px;font-weight:800;color:#6a7385">Nova avaliação</div><div id="phStars" style="margin-top:16px">${star(1, 52)}${star(0, 52)}${star(0, 52)}${star(0, 52)}${star(0, 52)}</div><p style="font-size:28px;font-weight:600;margin-top:14px">“Demorou e chegou frio.”</p></div>` })}

${reviewCard('rev', 430)}
<div id="draft" class="card" style="left:90px;right:90px;top:760px;padding:30px 36px;border-color:rgba(255,107,91,.6)">
  <div class="lbl" style="position:relative;font-size:28px;color:${RED}">VONTADE DE RESPONDER</div>
  <p style="font-size:42px;font-weight:700;margin-top:14px">“Mentira! Aqui nunca atrasa!”</p>
  <div id="strike" style="position:absolute;left:30px;right:30px;top:118px;height:8px;border-radius:4px;background:${RED};transform-origin:left;transform:scaleX(0)"></div>
</div>

<div id="calm" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  ${reviewCard('rev2', 430)}
  <div class="card" style="left:90px;right:90px;top:740px;padding:30px 36px;border-color:rgba(77,141,255,.6);background:rgba(8,101,254,.16)">
    <div class="lbl" style="position:relative;font-size:28px;color:#8db8ff">RESPOSTA DO ZÉ</div>
    <p id="reply" style="font-size:42px;font-weight:600;line-height:1.35;margin-top:14px;color:#eef3ff;min-height:170px"></p>
  </div>
</div>

<div id="later" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="lbl" style="left:90px;top:420px;color:#8790a6">DIAS DEPOIS</div>
  <div class="abs" style="left:80px;top:820px">${person('pc', '#e86a9a', { size: 300, hair: '#6b3a1f' })}</div>
  ${phone('ph2', { left: 430, top: 490, w: 560, h: 760, search: false, inner: `<div style="padding:50px 22px 0">
    <div id="l1" style="background:#fff;border:1px solid #dce2ec;border-radius:22px;padding:20px"><div style="display:flex;justify-content:space-between"><b style="font-size:24px">Cliente fictício</b><span>${star(1, 26)}${star(0, 26)}${star(0, 26)}${star(0, 26)}${star(0, 26)}</span></div><p style="font-size:26px;margin-top:8px">“Demorou e chegou frio.”</p></div>
    <div id="l2" style="margin:14px 0 0 40px;background:#e8f0ff;border:2px solid #0865fe;border-radius:22px;padding:20px"><b style="font-size:22px;color:#0865fe">Resposta do proprietário</b><p style="font-size:24px;margin-top:8px;line-height:1.35">Sentimos muito. Pode chamar a gente no WhatsApp? Queremos resolver.</p></div>
  </div>` })}
</div>

<div id="motto" class="big" style="top:560px;font-size:96px">Quem responde<br><span style="color:#4d8dff">com educação<br>mostra quem é.</span></div>

${comentaBlock('Quer modelos de resposta?', 'GOOGLE')}
`;

const REPLY = 'Sentimos muito. Pode chamar a gente no WhatsApp? Queremos resolver.';
const script = `
window.draw=(t)=>{
  show('hook',t,0,3.4,{dy:0,fi:.01});
  show('ze',t,0.1,3.4,{dy:80}); show('zName',t,0.5,3.4,{pop:true,sc:.4});
  show('ph',t,1.0,3.4,{dy:120,fi:.5});
  const sad=t>2.4; $('pz-happy').style.opacity=sad?0:1; $('pz-sad').style.opacity=sad?1:0;
  show('rev',t,3.43,7.7,{dy:40});
  show('draft',t,5.35,7.7,{pop:true,sc:.3});
  $('strike').style.transform='scaleX('+eo((t-6.9)/.5)+')';
  show('calm',t,7.71,14.95,{dy:30});
  const R=${JSON.stringify(REPLY)}; const n=Math.floor(clamp((t-9.4)/4.2)*R.length); $('reply').textContent=R.slice(0,n);
  show('later',t,14.97,19.9,{dy:40});
  show('l1',t,15.5,19.9,{dy:20}); show('l2',t,18.92,19.9,{pop:true,sc:.3});
  show('motto',t,19.9,22.9,{pop:true,sc:.3,dy:0});
  comenta(t,22.93,25.15,'GOOGLE');
};
`;

export const html = () => page({ css: CSS, body, script, captions: CAPS });

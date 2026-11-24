// Reel 17 · Casa Cheia, ep. 1 (05/11): "Vendeu tanto. Cadê o dinheiro?" A parmegiana da Rosa vende muito, mas no
// fim do mês o dinheiro não aparece; a Mel faz a conta e explica o CMV. Restaurante e pessoas inventados.
// Timed to narracao-17-eleven.mp3.
import { page, store, comentaBlock } from './base.mjs';
import { CSS, BG, RED, GREEN } from './estilo.mjs';
import { pessoa, ELENCO, MOOD, selo, nome } from './elenco.mjs';

export const DURATION = 31.4;
export const COVER = 1.0;

const CAPS = [
  [0, 1.78, 'Sexta, onze da noite', 'onze da noite'],
  [2.29, 4.22, 'A Rosa fecha a Panela feliz', 'feliz'],
  [4.6, 6.6, 'parmegiana vendeu como nunca', 'como nunca'],
  [6.98, 8.55, 'Mas no fim do mês…', 'fim do mês'],
  [8.86, 9.75, 'cadê o dinheiro?', 'dinheiro'],
  [10.3, 12.39, 'A Mel, filha dela, faz a conta', 'faz a conta'],
  [12.85, 15.81, 'Ingrediente: R$ 22', 'R$ 22'],
  [16.14, 18.22, 'Preço: R$ 39,90', 'R$ 39,90'],
  [18.61, 22.63, 'CMV: o que vai em ingrediente', 'CMV'],
  [22.98, 24.69, 'Aqui, mais da metade!', 'mais da metade'],
  [25.05, 27.59, 'Quanto maior, menos sobra', 'menos sobra'],
];

const row = (id, label, value, color = '#f3f5f9') => `<div id="${id}" style="display:flex;justify-content:space-between;align-items:baseline;padding:18px 0;border-top:1px solid rgba(255,255,255,.1)"><span style="font-size:36px;font-weight:700;color:#c6cede">${label}</span><span style="font-size:52px;font-weight:900;color:${color};font-variant-numeric:tabular-nums">${value}</span></div>`;

const body = `
${BG}
${selo(1, 'CMV')}
<div id="hook" class="hook">Vendeu tanto.<br><span style="color:${RED}">Cadê o dinheiro?</span></div>

<div id="sceneA" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="abs" style="left:70px;top:700px">${store('loja', 'PANELA', '#e8483b', { w: 430 })}</div>
  <div id="clock" class="chip" style="left:120px;top:630px">SEX · 23:00</div>
  <div id="rosaA" class="abs" style="left:560px;top:780px">${pessoa('pr', { ...ELENCO.rosa, size: 330 })}</div>
  ${nome('rName', 'Rosa, a dona', 640, 1200)}
  <div id="count" class="card" style="left:600px;top:620px;padding:18px 28px;text-align:center"><div style="font-size:24px;font-weight:800;color:#8790a6;letter-spacing:.1em">PARMEGIANAS HOJE</div><div id="countN" style="font-size:72px;font-weight:900;line-height:1.1">0</div></div>
</div>

<div id="sceneB" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div id="cal" class="card" style="left:120px;top:640px;width:330px;overflow:hidden;text-align:center"><div style="background:${RED};padding:16px;font-size:30px;font-weight:900;letter-spacing:.12em">FIM DO MÊS</div><div style="font-size:150px;font-weight:900;line-height:1.2">31</div></div>
  <div id="rosaB" class="abs" style="left:560px;top:780px">${pessoa('pr2', { ...ELENCO.rosa, size: 330 })}</div>
  <div id="cash" class="card" style="left:120px;top:1000px;width:330px;padding:20px 26px"><div style="font-size:26px;font-weight:800;color:#8790a6">NO CAIXA</div><div style="font-size:64px;font-weight:900;color:${RED}">R$ ???</div></div>
</div>
<div id="cade" class="big" style="top:420px;font-size:100px">Cadê o<br><span style="color:${RED}">dinheiro?</span></div>

<div id="sceneC" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div id="melC" class="abs" style="left:40px;top:820px">${pessoa('pm', { ...ELENCO.mel, size: 320 })}</div>
  ${nome('mName', 'Mel, filha da Rosa', 60, 1220, '#3b2a8a')}
  <div id="rec" class="card" style="left:420px;top:440px;width:600px;padding:34px 40px">
    <div style="display:flex;justify-content:space-between"><span style="font-size:28px;font-weight:900;letter-spacing:.14em;color:#8db8ff">PARMEGIANA</span><span style="font-size:26px;font-weight:800;color:#ffc94d">exemplo</span></div>
    ${row('r1', 'Ingredientes', 'R$ 22,00', RED)}
    ${row('r2', 'Preço', 'R$ 39,90')}
  </div>
</div>

<div id="sceneD" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div id="cmvT" class="big" style="top:420px;font-size:150px;color:#4d8dff">CMV</div>
  <div id="cmvS" class="big" style="top:600px;font-size:40px;font-weight:700;color:#c6cede">Custo da Mercadoria Vendida</div>
  <div id="cmvE" class="big" style="top:420px;font-size:92px">CMV maior,<br><span style="color:${RED}">sobra menor.</span></div>
  <div id="barBox" class="abs" style="left:90px;top:760px;width:900px">
    <div style="display:flex;justify-content:space-between;font-size:30px;font-weight:800;color:#c6cede;margin-bottom:14px"><span>Preço da parmegiana</span><span>R$ 39,90</span></div>
    <div style="position:relative;height:120px;border-radius:24px;background:${GREEN};overflow:hidden">
      <div id="barR" style="position:absolute;left:0;top:0;bottom:0;width:0;background:${RED}"></div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:18px"><span id="lblR" style="font-size:34px;font-weight:900;color:${RED}">ingrediente</span><span id="lblG" style="font-size:34px;font-weight:900;color:${GREEN}">sobra</span></div>
  </div>
  <div id="pct" class="abs" style="left:0;right:0;top:1060px;text-align:center"><span class="chip" style="position:relative;font-size:48px;padding:16px 36px;border-color:${RED};color:${RED}" id="pctT">55% vai em ingrediente (exemplo)</span></div>
</div>

${comentaBlock('Quer a conta passo a passo?', 'MARGEM')}
`;

const script = `
${MOOD}
window.draw=(t)=>{
  show('hook',t,0,6.9,{dy:0,fi:.01});
  show('sceneA',t,0,6.9,{dy:40});
  show('clock',t,0.9,6.9,{pop:true,sc:.3,dy:0});
  show('rosaA',t,0.2,6.9,{dy:80}); show('rName',t,2.3,6.9,{pop:true,sc:.4});
  mood('pr','happy'); blink('pr',t);
  show('count',t,4.5,6.9,{pop:true,sc:.3,dy:0});
  $('countN').textContent=String(Math.round(48*eo((t-4.6)/1.9)));
  show('sceneB',t,6.98,10.2,{dy:40}); mood('pr2','sad'); blink('pr2',t);
  show('cade',t,8.86,10.2,{pop:true,sc:.3,dy:0});
  show('sceneC',t,10.3,18.55,{dy:40});
  talk('pm',t,10.3,12.4); if(t>=12.4) mood('pm','happy'); blink('pm',t);
  show('mName',t,10.6,18.55,{pop:true,sc:.4});
  show('rec',t,12.6,18.55,{dy:50}); show('r1',t,12.85,18.55,{dy:20}); show('r2',t,16.14,18.55,{dy:20});
  show('sceneD',t,18.6,27.9,{dy:30});
  show('cmvT',t,18.6,25.0,{pop:true,sc:.3,dy:0}); show('cmvS',t,19.0,25.0,{dy:20});
  show('cmvE',t,25.05,27.9,{pop:true,sc:.3,dy:0});
  show('barBox',t,20.0,27.9,{dy:30});
  const w=t<25.05?55*eo((t-20.3)/1.6):55+17*eo((t-25.3)/1.4);
  $('barR').style.width=w+'%';
  show('pct',t,22.98,25.0,{pop:true,sc:.3,dy:0});
  comenta(t,27.98,29.63,'MARGEM');
};
`;

export const html = () => page({ css: CSS, body, script, captions: CAPS });

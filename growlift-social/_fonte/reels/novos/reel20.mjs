// Reel 20 · Casa Cheia, ep. 4 (05/11, versão 2): "Dia 31: quanto sobrou de verdade?". A Panela vendeu R$ 50 mil;
// a Mel faz o fechamento completo (ingrediente, taxas, aluguel, salários com encargos e o salário da própria Rosa,
// contas, impostos e contador) e o lucro é R$ 3.500. Números de exemplo; restaurante e pessoas inventados.
// Timed to narracao-20-eleven.mp3 (v2).
import { page, comentaBlock } from './base.mjs';
import { CSS, BG, RED, GREEN } from './estilo.mjs';
import { pessoa, ELENCO, MOOD, selo, nome } from './elenco.mjs';

export const DURATION = 35.0;
export const COVER = 0.9;

const CAPS = [
  [0, 1.15, 'Dia 31', 'Dia 31'],
  [1.7, 4.52, 'Vendeu R$ 50 mil no mês', 'R$ 50 mil'],
  [4.96, 6.7, 'Quanto sobrou de verdade?', 'de verdade'],
  [7.28, 9.11, 'A conta com tudo', 'com tudo'],
  [9.45, 11.33, 'Sai o ingrediente', 'ingrediente'],
  [11.65, 14.26, 'Taxas do cartão e dos apps', 'Taxas'],
  [14.6, 15.22, 'O aluguel', 'aluguel'],
  [15.55, 19.15, 'Salários, até o da Rosa', 'até o da Rosa'],
  [19.56, 23.19, 'Contas, impostos, contador', 'impostos'],
  [23.65, 25.36, 'O que fica é o lucro', 'lucro'],
  [25.77, 27.81, 'Aqui, R$ 3.500', 'R$ 3.500'],
  [28.17, 30.58, 'Vender bem não é sobrar', 'sobrar'],
];

// [id, rótulo, valor, quando entra, restante depois desta linha]
const LINHAS = [
  ['l1', 'Ingredientes', '− R$ 17.000', 9.45, 33000],
  ['l2', 'Taxas do cartão e dos apps', '− R$ 2.500', 11.65, 30500],
  ['l3', 'Aluguel', '− R$ 6.000', 14.6, 24500],
  ['l4', 'Salários e encargos', '− R$ 14.000', 15.55, 10500],
  ['l5', 'Luz, gás e água', '− R$ 3.000', 19.56, 7500],
  ['l6', 'Impostos e contador', '− R$ 4.000', 20.94, 3500],
];
const linha = ([id, k, v]) => `<div id="${id}" style="display:flex;justify-content:space-between;align-items:baseline;padding:13px 0;border-top:1px solid rgba(255,255,255,.08)"><span style="font-size:32px;font-weight:700;color:#c6cede">${k}</span><span style="font-size:36px;font-weight:900;color:${RED};font-variant-numeric:tabular-nums;white-space:nowrap">${v}</span></div>`;

const body = `
${BG}
${selo(4, 'Fechamento do mês')}
<div id="hook" class="hook">Dia 31.<br><span style="color:#ffb37a">Quanto sobrou?</span></div>
<div id="intro" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div id="vendas" class="card" style="left:100px;top:660px;width:460px;padding:28px 34px"><div style="font-size:26px;font-weight:800;color:#8790a6;letter-spacing:.08em">VENDAS DO MÊS</div><div style="font-size:72px;font-weight:900;color:${GREEN};letter-spacing:-.02em;white-space:nowrap">R$ 50 mil</div></div>
  <div class="abs" style="left:600px;top:760px">${pessoa('pr', { ...ELENCO.rosa, size: 330 })}</div>
  ${nome('rName', 'Rosa', 700, 1190)}
  <div id="duvida" class="bubble" style="left:150px;top:960px">Quanto sobrou de verdade?</div>
</div>

<div id="conta" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="abs" style="left:0px;top:930px">${pessoa('pm', { ...ELENCO.mel, size: 250 })}</div>
  ${nome('mName', 'Mel', 70, 1255, '#3b2a8a')}
  <div class="card" style="left:270px;top:390px;width:770px;padding:28px 34px">
    <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:26px;font-weight:900;letter-spacing:.12em;color:#8db8ff">FECHAMENTO DO MÊS</span><span style="font-size:24px;font-weight:800;color:#ffc94d">números de exemplo</span></div>
    <div style="position:relative;height:30px;border-radius:10px;background:#1e2838;margin:16px 0 8px;overflow:hidden"><div id="bar" style="position:absolute;left:0;top:0;bottom:0;width:100%;background:${GREEN}"></div></div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;padding:12px 0"><span style="font-size:32px;font-weight:800">Vendas</span><span style="font-size:36px;font-weight:900;color:${GREEN}">R$ 50.000</span></div>
    ${LINHAS.slice(0, 4).map(linha).join('')}
    <div id="rosaSal" style="font-size:26px;font-weight:700;color:#ffb37a;margin:-4px 0 4px">↑ salários incluem o da própria Rosa</div>
    ${LINHAS.slice(4).map(linha).join('')}
    <div id="lucro" style="display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;padding:18px 20px;border-radius:20px;background:rgba(34,197,94,.14);border:2px solid ${GREEN}"><span style="font-size:36px;font-weight:900">Sobrou (lucro)</span><span style="font-size:48px;font-weight:900;color:${GREEN}">R$ 3.500</span></div>
    <div id="pct" style="text-align:right;font-size:28px;font-weight:800;color:#c6cede;margin-top:10px">7% do que vendeu</div>
  </div>
</div>

<div id="moral" class="big" style="top:520px;font-size:96px">Vender bem<br>não é o mesmo<br><span style="color:#ffb37a">que sobrar.</span></div>

${comentaBlock('Quer o modelo dessa conta?', 'RELATÓRIO')}
`;

const script = `
${MOOD}
const L=${JSON.stringify(LINHAS.map(([id, , , a, r]) => [id, a, r]))};
window.draw=(t)=>{
  show('hook',t,0,7.2,{dy:0,fi:.01});
  show('intro',t,0,7.2,{dy:40}); show('vendas',t,1.7,7.2,{pop:true,sc:.3,dy:0}); show('rName',t,0.4,7.2,{pop:true,sc:.4});
  mood('pr',t>4.96?'o':'happy'); blink('pr',t);
  show('duvida',t,4.96,7.2,{pop:true,sc:.3,dy:0});
  show('conta',t,7.28,28.1,{dy:30}); talk('pm',t,7.28,9.1); if(t>9.1)mood('pm','happy'); blink('pm',t);
  let rest=50000;
  for(const [id,a,r] of L){ show(id,t,a,28.1,{dy:14,x:-30}); if(t>=a) rest=r; }
  $('bar').style.width=(rest/500)+'%';
  show('rosaSal',t,17.37,28.1,{dy:10});
  show('lucro',t,24.76,28.1,{pop:true,sc:.3,dy:0}); show('pct',t,26.5,28.1,{dy:10});
  show('moral',t,28.17,31.0,{pop:true,sc:.3,dy:0});
  comenta(t,31.04,32.59,'RELATÓRIO');
};
`;

export const html = () => page({ css: CSS, body, script, captions: CAPS });

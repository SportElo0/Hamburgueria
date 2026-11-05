// Reel 20 · Casa Cheia, ep. 4 (05/11): "Dia 31". A Rosa abre a caixa de comandas sem saber quanto vendeu e quanto
// sobrou; a Mel resume em três números (vendas, custo dos ingredientes, ticket médio) e tira três testes para o mês
// seguinte. Fecho: no Scale (em breve) o relatório vem pronto. Pessoas, números e restaurante inventados.
// Timed to narracao-20-eleven.mp3.
import { page, comentaBlock } from './base.mjs';
import { CSS, BG, RED, GREEN, phone } from './estilo.mjs';
import { MARK } from '../../pecas.mjs';
import { pessoa, ELENCO, MOOD, selo, nome } from './elenco.mjs';

export const DURATION = 33.2;
export const COVER = 1.0;

const CAPS = [
  [0, 1.12, 'Dia 31', 'Dia 31'],
  [1.68, 4.93, 'Uma caixa cheia de comandas', 'comandas'],
  [5.32, 6.0, 'Quanto vendeu?', 'vendeu'],
  [6.41, 7.1, 'Quanto sobrou?', 'sobrou'],
  [7.68, 9.51, 'A Mel resume em 3 números', '3 números'],
  [9.85, 10.41, 'Vendas', 'Vendas'],
  [10.73, 12.02, 'Custo dos ingredientes', 'Custo'],
  [12.19, 13.16, 'Ticket médio', 'Ticket médio'],
  [13.43, 15.9, 'quanto cada mesa gastou', 'cada mesa'],
  [16.42, 19.19, '3 testes pro mês que vem', '3 testes'],
  [19.64, 21.27, 'Teste, não promessa', 'não promessa'],
  [21.68, 23.5, 'No outro mês, mede de novo', 'mede de novo'],
  [24.1, 27.01, 'No Scale, plano da Growlift', 'Scale'],
  [27.3, 29.48, 'vem pronto todo mês', 'todo mês'],
];

const papel = (i, x, y, r) => `<div id="p${i}" class="abs" style="left:${x}px;top:${y}px;width:120px;height:150px;border-radius:8px;background:#f3f5f9;transform:rotate(${r}deg);box-shadow:0 10px 20px rgba(0,0,0,.4);padding:14px"><div style="height:10px;width:70%;background:#c6cede;border-radius:4px"></div><div style="height:10px;width:90%;background:#dce2ec;border-radius:4px;margin-top:12px"></div><div style="height:10px;width:60%;background:#dce2ec;border-radius:4px;margin-top:12px"></div></div>`;
const numero = (id, label, valor, sub, top) => `<div id="${id}" class="card" style="left:420px;top:${top}px;width:600px;padding:24px 32px"><div style="font-size:28px;font-weight:800;color:#8790a6;letter-spacing:.06em">${label}</div><div style="display:flex;align-items:baseline;gap:18px"><span style="font-size:76px;font-weight:900;letter-spacing:-.02em">${valor}</span><span id="${id}s" style="font-size:28px;font-weight:700;color:#8db8ff">${sub}</span></div></div>`;
const teste = (id, n, txt, top) => `<div id="${id}" class="card" style="left:110px;top:${top}px;width:860px;padding:26px 32px;display:flex;align-items:center;gap:24px"><span style="flex:none;width:76px;height:76px;border-radius:50%;background:#0865fe;display:grid;place-items:center;font-size:40px;font-weight:900">${n}</span><span style="font-size:40px;font-weight:800">${txt}</span></div>`;
const zap = `<div style="height:100%;background:#0b141a;padding:50px 18px 0;color:#e9edef">
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px"><div style="width:62px;height:62px;border-radius:50%;background:#0865fe;display:grid;place-items:center"><div style="width:34px;filter:brightness(0) invert(1)">${MARK}</div></div><div><div style="font-size:28px;font-weight:800">Growlift</div><div style="font-size:22px;color:#8696a0">relatório do mês</div></div></div>
  <div id="z1" style="max-width:94%;padding:18px 20px;border-radius:22px 22px 22px 6px;background:#202c33;font-size:27px;line-height:1.4">Saiu o relatório do mês da Panela da Rosa:
    <div style="display:flex;align-items:flex-end;gap:10px;height:110px;margin:14px 0 6px">${[48, 62, 55, 78].map((h, i) => `<i id="zb${i}" style="flex:1;height:${h}%;border-radius:8px 8px 0 0;background:${i === 3 ? '#4d8dff' : '#3b6fb8'}"></i>`).join('')}</div>
  </div>
  <div id="z2" style="max-width:94%;margin-top:14px;padding:18px 20px;border-radius:22px 22px 22px 6px;background:#202c33;font-size:27px;line-height:1.45"><b>3 sugestões para testar</b><br>1. Combo do almoço com bebida<br>2. Picanha no topo do cardápio<br>3. Rever a porção da parmegiana</div>
</div>`;

const body = `
${BG}
${selo(4, 'Fechamento do mês')}
<div id="hook" class="hook">Dia 31.<br><span style="color:#ffb37a">E agora?</span></div>
<div id="cal" class="card" style="left:110px;top:640px;width:300px;overflow:hidden;text-align:center"><div style="background:${RED};padding:14px;font-size:28px;font-weight:900;letter-spacing:.12em">OUTUBRO</div><div id="calN" style="font-size:140px;font-weight:900;line-height:1.2">30</div></div>
<div id="rosa" class="abs" style="left:560px;top:760px">${pessoa('pr', { ...ELENCO.rosa, size: 320 })}</div>
${nome('rName', 'Rosa', 650, 1180)}
<div id="box" class="abs" style="left:150px;top:1010px;width:340px;height:170px;border-radius:14px;background:#a8743f;box-shadow:inset 0 -20px 0 rgba(0,0,0,.18)"><div style="position:absolute;left:-14px;right:-14px;top:-26px;height:40px;border-radius:10px;background:#c48a4e"></div><div style="position:absolute;left:0;right:0;top:66px;text-align:center;font-size:26px;font-weight:900;color:#5a3a1a;letter-spacing:.1em">COMANDAS</div></div>
${papel(0, 180, 900, -14)}${papel(1, 280, 860, 8)}${papel(2, 360, 920, -4)}${papel(3, 220, 820, 18)}${papel(4, 330, 800, -20)}
<div id="q1" class="bubble" style="left:470px;top:620px">Quanto vendeu?</div>
<div id="q2" class="bubble" style="left:560px;top:700px">Quanto sobrou?</div>

<div id="tres" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="abs" style="left:40px;top:820px">${pessoa('pm', { ...ELENCO.mel, size: 320 })}</div>
  ${nome('mName', 'Mel', 140, 1230, '#3b2a8a')}
  <div id="ex" class="chip" style="left:820px;top:400px;font-size:24px;color:#8790a6">exemplo</div>
  ${numero('n1', 'VENDAS DO MÊS', 'R$ 48 mil', '', 460)}
  ${numero('n2', 'INGREDIENTES', '34%', 'das vendas', 680)}
  ${numero('n3', 'TICKET MÉDIO', 'R$ 62', 'por mesa', 900)}
</div>

<div id="testes" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="big" style="top:400px;font-size:80px">3 testes pro<br><span style="color:#4d8dff">mês que vem</span></div>
  ${teste('t1', 1, 'Combo do almoço com bebida', 660)}
  ${teste('t2', 2, 'Picanha no topo do cardápio', 830)}
  ${teste('t3', 3, 'Rever a porção da parmegiana', 1000)}
</div>

<div id="stamp" class="big" style="top:520px;font-size:110px;line-height:1"><span style="display:inline-block;padding:20px 40px;border:10px solid #ffb37a;border-radius:30px;color:#ffb37a;transform:rotate(-6deg)">TESTE,<br>NÃO PROMESSA</span></div>
<div id="mede" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="big" style="top:440px;font-size:84px">No outro mês,<br><span style="color:${GREEN}">mede de novo.</span></div>
  <div class="card" style="left:290px;top:720px;width:500px;overflow:hidden;text-align:center"><div style="background:#0865fe;padding:14px;font-size:28px;font-weight:900;letter-spacing:.12em">NOVEMBRO</div><div style="font-size:120px;font-weight:900;line-height:1.25">30</div></div>
</div>

<div id="scale" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  ${phone('ph', { left: 230, top: 420, w: 620, h: 860, search: false, inner: zap })}
  <div id="em" class="chip" style="left:600px;top:380px;color:#8db8ff;border-color:#4d8dff">Plano Scale · em breve</div>
</div>

${comentaBlock('Quer o modelo do relatório?', 'RELATÓRIO')}
`;

const script = `
${MOOD}
window.draw=(t)=>{
  const A=t<7.6;
  show('hook',t,0,5.2,{dy:0,fi:.01});
  show('cal',t,0,1.7,{pop:true,sc:.3,dy:0}); $('calN').textContent=t>0.5?'31':'30';
  show('rosa',t,0.3,7.6,{dy:60}); show('rName',t,0.6,7.6,{pop:true,sc:.4}); blink('pr',t);
  mood('pr',t>1.6?(t>5.3?'o':'sad'):'happy');
  show('box',t,1.5,7.6,{pop:true,sc:.3,dy:0});
  for(let i=0;i<5;i++){const a=1.9+i*.5;const k=clamp((t-a)/.6);const el=$('p'+i);el.style.opacity=A&&t>a?1:0;
    el.style.transform='translateY('+(-140*Math.sin(k*Math.PI)*0+(1-eo(k))*180)+'px) rotate('+((i%2?1:-1)*(10+i*4))+'deg)';}
  show('q1',t,5.32,7.6,{pop:true,sc:.3,dy:0}); show('q2',t,6.41,7.6,{pop:true,sc:.3,dy:0});
  show('tres',t,7.68,16.3,{dy:30}); talk('pm',t,7.68,9.5); if(t>9.5)mood('pm','happy'); blink('pm',t);
  show('n1',t,9.85,16.3,{dy:30}); show('n2',t,10.73,16.3,{dy:30}); show('n3',t,12.19,16.3,{dy:30}); show('n3s',t,13.43,16.3,{dy:10});
  show('testes',t,16.42,19.6,{dy:30}); show('t1',t,17.0,19.6,{dy:30}); show('t2',t,17.6,19.6,{dy:30}); show('t3',t,18.2,19.6,{dy:30});
  show('stamp',t,19.64,21.6,{pop:true,sc:.4,dy:0});
  show('mede',t,21.68,24.0,{dy:30});
  show('scale',t,24.1,29.85,{dy:40}); show('em',t,24.5,29.85,{pop:true,sc:.4});
  show('z1',t,25.1,29.85,{pop:true,sc:.2,dy:20}); show('z2',t,27.3,29.85,{pop:true,sc:.2,dy:20});
  comenta(t,29.88,30.89,'RELATÓRIO');
};
`;

export const html = () => page({ css: CSS, body, script, captions: CAPS });

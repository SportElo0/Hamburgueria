// Reel 18 · Casa Cheia, ep. 2 (05/11): "Cada prato tem um papel". Os pratos da Rosa viram personagens da engenharia
// de cardápio: Estrela, Cavalo de batalha, Quebra-cabeça e Abacaxi. Restaurante e pratos inventados.
// Timed to narracao-18-eleven.mp3.
import { page, comentaBlock } from './base.mjs';
import { CSS, BG, RED, GREEN } from './estilo.mjs';
import { pessoa, prato, ELENCO, MOOD, selo, nome } from './elenco.mjs';

export const DURATION = 34.2;
export const COVER = 2.2;

const CAPS = [
  [0, 1.28, 'No cardápio da Rosa', 'Rosa'],
  [1.55, 3.05, 'cada prato tem um papel', 'um papel'],
  [3.52, 5.91, 'Vende muito, sobra muito', 'sobra muito'],
  [6.16, 7.96, 'É a Estrela. Não mexe!', 'Estrela'],
  [8.46, 11.12, 'Vende muito, sobra pouco', 'sobra pouco'],
  [11.44, 12.68, 'Cavalo de batalha', 'Cavalo de batalha'],
  [13.07, 14.36, 'Hora de rever a porção', 'rever a porção'],
  [14.84, 17.82, 'Sobra muito, pouco pedido', 'pouco pedido'],
  [18.15, 19.05, 'Quebra-cabeça', 'Quebra-cabeça'],
  [19.41, 20.77, 'Precisa de destaque', 'destaque'],
  [21.15, 23.92, 'E a sopa? Vende pouco, sobra pouco', 'pouco'],
  [24.2, 26.67, 'Abacaxi! Troca ou tira', 'Abacaxi'],
  [27.04, 29.47, 'Isso é engenharia de cardápio', 'engenharia de cardápio'],
];

const pips = (id) => Array.from({ length: 5 }, (_, i) => `<i id="${id}${i}" style="flex:1;height:44px;border-radius:12px;background:#1e2838;transition:none"></i>`).join('');
const meter = (k) => `<div id="${k}-m" class="card" style="left:110px;top:950px;width:860px;padding:26px 34px;display:grid;gap:18px">
  <div style="display:flex;align-items:center;gap:22px"><b style="width:160px;font-size:34px;letter-spacing:.08em;color:#c6cede">VENDE</b><div style="flex:1;display:flex;gap:10px">${pips(k + 'v')}</div></div>
  <div style="display:flex;align-items:center;gap:22px"><b style="width:160px;font-size:34px;letter-spacing:.08em;color:#c6cede">SOBRA</b><div style="flex:1;display:flex;gap:10px">${pips(k + 's')}</div></div>
</div>`;
const cena = (k, nomePrato, papel, cor, acao) => `<div id="${k}" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div id="${k}-n" class="big" style="top:390px;font-size:44px;font-weight:800;color:#c6cede">${nomePrato}</div>
  <div class="abs" style="left:310px;top:430px">${prato('d' + k, k, 460)}</div>
  <div id="${k}-p" class="big" style="top:820px;font-size:72px;color:${cor};text-shadow:0 10px 40px rgba(0,0,0,.6)">${papel}</div>
  ${meter(k)}
  <div id="${k}-a" class="chip" style="left:640px;top:520px;transform:rotate(6deg);font-size:44px;background:${cor};color:#06080d;border-color:${cor}">${acao}</div>
</div>`;

const quad = (k, nomeP, cor, left, top) => `<div class="card" style="left:${left}px;top:${top}px;width:440px;height:290px;border-color:${cor};text-align:center">
  <div class="abs" style="left:120px;top:0px">${prato('q' + k, k, 200)}</div>
  <div style="position:absolute;left:0;right:0;bottom:24px;font-size:40px;font-weight:900;color:${cor}">${nomeP}</div></div>`;

const body = `
${BG}
${selo(2, 'Engenharia de cardápio')}
<div id="hook" class="hook">Cada prato tem<br><span style="color:#4d8dff">um papel.</span></div>
<div id="intro" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div id="rosa" class="abs" style="left:60px;top:800px">${pessoa('pr', { ...ELENCO.rosa, size: 320 })}</div>
  ${nome('rName', 'Rosa', 140, 1210)}
  <div id="menu" class="card" style="left:420px;top:640px;width:580px;padding:30px;display:grid;grid-template-columns:1fr 1fr;gap:6px">
    <div style="grid-column:span 2;font-size:28px;font-weight:900;letter-spacing:.14em;color:#8db8ff">CARDÁPIO</div>
    <div style="position:relative;height:220px">${prato('i1', 'picanha', 240)}</div><div style="position:relative;height:220px">${prato('i2', 'parmegiana', 240)}</div><div style="position:relative;height:220px">${prato('i3', 'risoto', 240)}</div><div style="position:relative;height:220px">${prato('i4', 'sopa', 240)}</div>
  </div>
</div>
${cena('picanha', 'A picanha', 'ESTRELA', '#ffc94d', 'Mantém!')}
${cena('parmegiana', 'A parmegiana', 'CAVALO DE BATALHA', '#ff9a5b', 'Rever a porção')}
${cena('risoto', 'O risoto', 'QUEBRA-CABEÇA', '#8db8ff', 'Dar destaque')}
${cena('sopa', 'A sopa', 'ABACAXI', '#7ddc7d', 'Testar trocar')}
<div id="mat" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="big" style="top:390px;font-size:76px">Engenharia<br><span style="color:#4d8dff">de cardápio</span></div>
  <div class="lbl" style="left:70px;top:600px;font-size:26px;color:#8790a6">VENDE MUITO ↑</div>
  ${quad('parmegiana', 'Cavalo de batalha', '#ff9a5b', 60, 640)}
  ${quad('picanha', 'Estrela', '#ffc94d', 580, 640)}
  ${quad('sopa', 'Abacaxi', '#7ddc7d', 60, 950)}
  ${quad('risoto', 'Quebra-cabeça', '#8db8ff', 580, 950)}
</div>
${comentaBlock('Quer descobrir o papel dos seus pratos?', 'MARGEM')}
`;

const script = `
${MOOD}
const LV={picanha:[5,5],parmegiana:[5,1],risoto:[1,5],sopa:[1,1]};
function fill(k,t,a){const [v,s]=LV[k];for(let i=0;i<5;i++){const on1=i<v&&t>a+.25+i*.12, on2=i<s&&t>a+.9+i*.12;
  $(k+'v'+i).style.background=on1?'#4d8dff':'#1e2838';$(k+'s'+i).style.background=on2?(s>2?'${GREEN}':'${RED}'):'#1e2838';}}
function cena(k,t,a,p,ac,b){show(k,t,a,b,{dy:30});show(k+'-n',t,a,b,{dy:20});show(k+'-m',t,a+.2,b,{dy:30});fill(k,t,a);
  show(k+'-p',t,p,b,{pop:true,sc:.4,dy:0});show(k+'-a',t,ac,b,{pop:true,sc:.4,dy:0,base:'rotate(6deg)'});}
window.draw=(t)=>{
  show('hook',t,0,3.4,{dy:0,fi:.01});
  show('intro',t,0,3.4,{dy:40}); mood('pr','happy'); blink('pr',t);
  cena('picanha',t,3.45,6.16,7.2,8.4); mood('dpicanha','happy');
  cena('parmegiana',t,8.4,11.44,13.07,14.8); mood('dparmegiana',t>11.4?'o':'sad');
  cena('risoto',t,14.8,18.15,19.4,21.1); mood('drisoto',t>19.4?'happy':'sad');
  cena('sopa',t,21.1,24.2,25.53,27.0); mood('dsopa','sad');
  show('mat',t,27.0,29.85,{dy:30}); mood('qsopa','sad'); mood('qparmegiana','o');
  comenta(t,29.87,32.12,'MARGEM');
};
`;

export const html = () => page({ css: CSS, body, script, captions: CAPS });

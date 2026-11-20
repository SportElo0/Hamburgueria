// Reel 29 (18/11): "A conta da marmita". Quadro "Quanto sobra?", episódio 1: a marmita de R$ 22 no app desmonta e
// volta item por item (3D em diorama29.js) enquanto o cartão de cima desconta cada custo, até sobrar uns R$ 3 no exemplo.
// Depois: ficha técnica para acertar o preço e pedido direto pelo site da loja (sem comissão da Growlift sobre o pedido).
// Fim: "Comenta MARGEM" e a planilha grátis. Valores de exemplo; taxa do app conferida na página oficial em 18/11/2026.
// Revisão legal de 18/11 aplicada. Timed to narracao-29-eleven.mp3 (64.5 s), played at 1.2×.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { page, comentaBlock } from './base.mjs';

export const DURATION = 66.6;
export const COVER = 1.4;
export const SPEED = 1.2;

const HERE = path.dirname(fileURLToPath(import.meta.url));

const SEG = [
  [5.48, 6.37, 'Bora fazer a conta.', 'conta.'],
  [6.76, 7.28, 'O frango:', 'frango:'],
  [7.64, 8.5, 'três e trinta.', ''],
  [8.92, 10.05, 'Arroz e feijão:', 'feijão:'],
  [10.31, 11.25, 'oitenta centavos.', ''],
  [11.64, 12.77, 'Salada e farofa:', 'farofa:'],
  [13.07, 13.77, 'um e dez.', ''],
  [14.26, 16.09, 'Embalagem, talher e sacola:', 'sacola:'],
  [16.39, 17.25, 'um e cinquenta.', ''],
  [17.74, 19.65, 'Até aqui, parece que sobra bem, né?', 'né?'],
  [20.09, 22.55, 'Agora os custos que muita gente esquece:', 'esquece:'],
  [23.02, 24.59, 'gás, luz e água:', 'água:'],
  [24.86, 25.42, 'um real.', ''],
  [25.88, 26.62, 'O funcionário:', 'funcionário:'],
  [26.97, 28.34, 'três reais por marmita.', ''],
  [28.78, 29.32, 'O aluguel:', 'aluguel:'],
  [29.63, 30.4, 'um e vinte.', ''],
  [30.85, 31.51, 'O imposto:', 'imposto:'],
  [31.82, 33.09, 'um e trinta e dois.', ''],
  [33.53, 37.46, 'E a taxa do app, num plano com entrega, que cobra uns vinte e seis por cento:', 'app,'],
  [37.77, 39.43, 'cinco e setenta e seis.', 'setenta'],
  [39.87, 42.08, 'Neste exemplo, sobram uns três reais.', 'três'],
  [42.51, 46.99, 'Vendendo quarenta por dia, dá uns cento e vinte reais pro dia inteiro de cozinha.', 'inteiro'],
  [47.37, 48.12, 'Dá pra mudar:', 'mudar:'],
  [48.47, 51.13, 'com a ficha técnica, você acerta o preço.', 'preço.'],
  [51.5, 58.21, 'E o cliente que já conhece a sua marmita pode pedir direto pelo seu site, sem a Growlift cobrar comissão sobre o pedido.', 'site,'],
];
function toCaps(seg) {
  const out = [];
  seg.forEach(([a, b, text, hl], i) => {
    const words = text.split(' ');
    const chunks = [];
    for (let k = 0; k < words.length; ) {
      let n = Math.min(3, words.length - k);
      if (words.length - k === 4) n = 2;
      chunks.push(words.slice(k, k + n).join(' '));
      k += n;
    }
    const total = chunks.reduce((s, c) => s + c.length, 0);
    const end = i + 1 < seg.length ? Math.min(seg[i + 1][0], b + 0.4) : b + 0.4;
    let t = a;
    chunks.forEach((c, j) => {
      const d = ((b - a) * c.length) / total;
      const w2 = c.split(' ');
      const h = hl.split(' ').filter((w) => w && w2.includes(w)).join(' ');
      out.push([+t.toFixed(2), +(j === chunks.length - 1 ? end : t + d).toFixed(2), c, h && c.includes(h) ? h : '']);
      t += d;
    });
  });
  return out;
}
const CAPS = toCaps(SEG);

// cost lines: [time it lands, label, value, group]
const LINES = [
  [7.64, 'Frango (150 g)', 3.3, 'a'],
  [10.31, 'Arroz e feijão', 0.8, 'a'],
  [13.07, 'Salada e farofa', 1.1, 'a'],
  [16.39, 'Embalagem, talher e sacola', 1.5, 'a'],
  [24.86, 'Gás, luz e água', 1.0, 'b'],
  [26.97, 'Funcionário (por marmita)', 3.0, 'b'],
  [29.63, 'Aluguel (por marmita)', 1.2, 'b'],
  [31.82, 'Imposto (exemplo: 6%)', 1.32, 'b'],
  [37.77, 'Taxa do app (exemplo: 26,2%)', 5.76, 'b'],
];
const brl = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');

const bundle = () =>
  buildSync({ entryPoints: [path.join(HERE, 'diorama29.js')], bundle: true, format: 'iife', write: false, minify: true, logLevel: 'error', absWorkingDir: path.resolve(HERE, '../../../..') }).outputFiles[0].text;

const css = `
body{background:radial-gradient(120% 70% at 50% 62%,#16285e 0%,#0a1330 45%,#050a1c 100%)}
#gl{position:absolute;left:0;top:0;width:1080px;height:1920px}
.brandmark{color:#e6eaf2;padding:10px 18px;margin:-10px 0 0 -18px;border-radius:14px;background:rgba(6,9,22,.55)}
#hook{position:absolute;left:70px;right:70px;top:250px;z-index:30;visibility:hidden}
#hook h1{font-size:104px;font-weight:900;line-height:.98;letter-spacing:-.04em;color:#fff}
#hook h1 em{font-style:normal;color:#ffd23f}
#hook p{margin-top:22px;font-size:46px;font-weight:900;line-height:1.08;color:#ff6b6b;letter-spacing:-.02em;visibility:hidden}
#tag{position:absolute;left:660px;top:1020px;z-index:31;padding:12px 24px;border-radius:14px;background:#ffd23f;color:#111;font-size:46px;font-weight:900;transform:rotate(-6deg);box-shadow:0 18px 40px -16px #000;visibility:hidden}
#card{position:absolute;left:60px;right:60px;top:240px;z-index:30;background:#fff;border-radius:28px;padding:22px 28px 18px;color:#121826;box-shadow:0 34px 70px -28px #000;visibility:hidden}
#card .h{display:flex;justify-content:space-between;align-items:baseline;font-size:24px;font-weight:900;letter-spacing:.06em;color:#121826}
#card .h small{font-size:22px;font-weight:700;letter-spacing:0;color:#6b7280}
#card .ex{font-size:19px;font-weight:700;color:#9aa3b2;margin-top:2px}
.ln{display:flex;justify-content:space-between;align-items:baseline;font-size:28px;font-weight:700;padding:7px 0;border-bottom:1px solid #eef1f5;visibility:hidden}
.ln b{color:#e5484d;font-weight:800}
.ln.new{background:linear-gradient(90deg,#fff6d6,#fff);margin:0 -12px;padding:7px 12px;border-radius:10px}
.sec{margin-top:12px;font-size:20px;font-weight:900;letter-spacing:.1em;color:#d97706;visibility:hidden}
.fica{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding:14px 18px;border-radius:16px;background:#e8f7f2}
.fica span{font-size:24px;font-weight:900;letter-spacing:.06em;color:#0f766e}
.fica b{font-size:52px;font-weight:900;color:#0f9f6e;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.fica.bad{background:#fde8e8}.fica.bad span{color:#b42318}.fica.bad b{color:#e5484d}
#note{margin-top:8px;font-size:18px;font-weight:600;color:#8a93a3;line-height:1.3}
#big{position:absolute;left:60px;right:60px;top:300px;z-index:32;text-align:center;padding:40px 30px;border-radius:30px;background:rgba(40,8,14,.92);border:2px solid rgba(255,107,107,.5);visibility:hidden}
#big .a{font-size:36px;font-weight:800;color:#ffd0d0}
#big .b{margin-top:6px;font-size:120px;font-weight:900;letter-spacing:-.04em;color:#ff6b6b;line-height:1}
#big .c{margin-top:10px;font-size:36px;font-weight:900;color:#fff}
#big .d{margin-top:16px;font-size:20px;font-weight:600;color:#c9a9ad}
.fix{position:absolute;left:60px;right:60px;z-index:32;background:#fff;border-radius:26px;padding:26px 30px;color:#121826;box-shadow:0 30px 60px -28px #000;visibility:hidden}
.fix .n{display:inline-grid;place-items:center;width:52px;height:52px;border-radius:50%;background:#0865fe;color:#fff;font-size:28px;font-weight:900;margin-right:16px;vertical-align:middle}
.fix b{font-size:38px;font-weight:900;vertical-align:middle}
.fix p{margin-top:12px;font-size:28px;font-weight:600;color:#4b5563;line-height:1.3}
.fix small{display:block;margin-top:10px;font-size:19px;font-weight:600;color:#8a93a3;line-height:1.3}
#cap{top:1560px}
#dim{position:absolute;inset:0;z-index:44;background:rgba(5,9,22,.86);visibility:hidden}
#gift{position:absolute;left:50%;top:1340px;z-index:47;transform:translateX(-50%);font-size:30px;font-weight:800;color:#9ff0d8;white-space:nowrap;visibility:hidden}
`;

const lines = LINES.map(([, label, v, g], i) => `${g === 'b' && i === 4 ? '<div class="sec" id="sec">CUSTOS QUE MUITA GENTE ESQUECE</div>' : ''}<div class="ln" id="l${i}"><span>${label}</span><b>− ${brl(v)}</b></div>`).join('');

const body = `
<canvas id="gl" width="1080" height="1920"></canvas>
<div id="hook"><h1>Marmita a <em>R$ 22</em> no app?</h1><p id="hookP">Num exemplo, quase nada fica com você.</p></div>
<div id="tag">R$ 22,00</div>
<div id="card">
  <div class="h"><span>A CONTA DA MARMITA</span><small>vende a R$ 22,00</small></div>
  <div class="ex">Valores de exemplo, não são de nenhum restaurante.</div>
  ${lines}
  <div class="fica" id="fica"><span>FICA PRA VOCÊ</span><b id="ficaV">R$ 22,00</b></div>
  <div id="note"></div>
</div>
<div id="big"><div class="a">40 marmitas × R$ 3,02 =</div><div class="b">R$ 120,80</div><div class="c">pelo dia inteiro de cozinha</div><div class="d">Resultado de exemplo, não é promessa de ganho.</div></div>
<div class="fix" id="f1" style="top:300px"><span class="n">1</span><b>Ficha técnica</b><p>O custo de cada item no papel. Com ele, você acerta o preço.</p></div>
<div class="fix" id="f2" style="top:600px"><span class="n">2</span><b>Pedido direto pelo seu site</b><p>Quem já conhece a sua marmita pede direto, sem a Growlift cobrar comissão sobre o pedido.</p><small>Mensalidade do plano e taxas de pagamento e entrega à parte.</small></div>
<div id="dim"></div>
${comentaBlock('Quer a planilha da conta da sua marmita?', 'MARGEM', 'dark', 470)}
<div id="gift">A Growlift te manda grátis · vale pra todo mundo que comentar</div>
`;

const script = `
window.MOTION=2;
const L=(a,b,x)=>a+(b-a)*x;
const LINES=${JSON.stringify(LINES)};
const brl=(v)=>'R$ '+v.toFixed(2).replace('.',',');
const C=(p,l,f)=>({pos:p,look:l,fov:f});
const SHOTS=[
  [0.0,C([0,6.7,6.5],[0,0.1,-1.0],30)],
  [5.2,C([0,7.4,6.2],[0,0.1,-1.3],30)],
  [39.5,C([0,7.8,6.7],[0,0.1,-1.45],30)],
  [47.0,C([0,7.4,6.2],[0,0.1,-1.3],30)],
  [66.6,C([0,7.1,6.3],[0,0.1,-1.15],30)],
];
function camAt(t){let i=0;while(i<SHOTS.length-1&&SHOTS[i+1][0]<=t)i++;const[ta,A]=SHOTS[i],[tb,B]=SHOTS[Math.min(i+1,SHOTS.length-1)];const k=eioS(clamp((t-ta)/Math.max(.001,Math.min(1.2,tb-ta))));const lp=(a,b)=>a.map((v,j)=>L(v,b[j],k));return{pos:lp(A.pos,B.pos),look:lp(A.look,B.look),fov:L(A.fov,B.fov,k)};}
const pop=(t,a)=>t<a?0:eoS((t-a)/.5);
window.draw=(t)=>{
  // food: full during the hook, out at "bora fazer a conta", back item by item
  const out=t<5.5?1:Math.max(0,1-(t-5.5)/.5);
  const back=(a)=>Math.max(out, pop(t,a));
  const items={frango:back(7.5),arroz:back(10.2),feijao:back(10.45),salada:back(12.95),farofa:back(13.2)};
  const red=t<37.7?0:t<47.2?eoS((t-37.7)/.6):Math.max(0,1-(t-47.2)/.8);
  window.marmita(t,{cam:camAt(t),items,red,glow:t>37.7&&t<38.3?1:0});
  // hook
  show('hook',t,0,5.3,{dy:20,fi:.25});
  show('hookP',t,2.67,undefined,{dy:12});
  show('tag',t,0.4,5.3,{dy:20,base:'rotate(-6deg)'});
  // the bill
  show('card',t,5.6,42.45,{dy:30});
  let fica=22, last=-1;
  LINES.forEach(([a,,v],i)=>{const k=show('l'+i,t,a,undefined,{dy:10}); if(t>=a){fica-=v*clamp((t-a)/.45); last=i;} $('l'+i).classList.toggle('new',t>=a&&t<a+1.6);});
  show('sec',t,20.2,undefined,{dy:10});
  $('ficaV').textContent=brl(Math.max(0,fica)+1e-9);
  $('fica').classList.toggle('bad',t>=37.77);
  $('note').textContent=t>=37.77?'Taxa de exemplo: 26,2% (comissão de 23% + 3,2% de pagamento online, plano com entrega de app grande; tabela pública conferida em 18/11/2026). Confira a sua.':(t>=31.82?'Imposto de exemplo: 6% (Simples). Muda conforme a faixa e a atividade.':'');
  // 40 a day
  show('big',t,42.5,47.2,{dy:30,sc:.06});
  // what can change
  show('f1',t,47.4,58.6,{dy:30}); show('f2',t,51.5,58.6,{dy:30});
  // ending
  show('dim',t,58.6,undefined,{dy:0,fi:.6});
  comenta(t,58.65,61.23,'MARGEM');
  show('gift',t,62.4,undefined,{dy:12,base:'translateX(-50%)'});
};
`;

export const html = () => {
  const p = page({ css, body, script, captions: CAPS, brandColor: '#e6eaf2' });
  const b = bundle();
  return p.replace('<script>', () => `<script>${b}</script><script>`);
};

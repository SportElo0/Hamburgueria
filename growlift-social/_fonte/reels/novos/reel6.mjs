// Reel 6 (estilo história, 01/11): "Do zero, linha por linha". Júlia bakes beautiful cakes and arrives with a notebook
// full of ideas; the notebook becomes code written from scratch, then the look, then the photos (Doce Ateliê, concept
// project). Fictional, no outcome promised. Timed to narracao-6-eleven.mp3.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page, person, comentaBlock } from './base.mjs';
import { CSS, BG } from './estilo.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const img = (f) => pathToFileURL(path.resolve(HERE, '../../assets/hd', f)).href;

export const DURATION = 24.2;
export const COVER = 1.0;

const PINK = '#e86a9a';

const CAPS = [
  [0.0, 1.9, 'A Júlia faz bolos lindos', 'bolos lindos'],
  [2.04, 4.15, 'e chegou com um caderno cheio de ideias', 'caderno'],
  [4.4, 5.75, 'as cores da confeitaria', 'cores'],
  [5.9, 6.6, 'os sabores', 'sabores'],
  [6.79, 8.1, 'as fotos dos bolos', 'fotos'],
  [8.51, 10.3, 'Do caderno nasce o código', 'código'],
  [10.5, 12.65, 'escrito do zero, sem modelo pronto', 'do zero'],
  [12.96, 14.45, 'Depois vem o visual', 'visual'],
  [14.75, 16.15, 'Depois, as fotos', 'fotos'],
  [16.44, 18.45, 'E o site fica com a cara dela', 'cara dela'],
];

const cake = (s = 1) => `<svg width="${200 * s}" height="${200 * s}" viewBox="0 0 100 100">
  <rect x="18" y="52" width="64" height="34" rx="6" fill="#fbe3ec"/><rect x="18" y="52" width="64" height="9" rx="4" fill="${PINK}"/>
  <rect x="28" y="30" width="44" height="24" rx="5" fill="#fff4f8"/><rect x="28" y="30" width="44" height="7" rx="3" fill="${PINK}"/>
  <circle cx="40" cy="26" r="5" fill="#e8483b"/><circle cx="52" cy="24" r="5" fill="#e8483b"/><circle cx="62" cy="27" r="5" fill="#e8483b"/>
  <rect x="10" y="85" width="80" height="5" rx="2.5" fill="#c6cede"/></svg>`;

const CODE = [
  '<header class="topo">',
  '  <h1>Doce Ateliê</h1>',
  '  <a href="#bolos">Bolos</a>',
  '  <a class="botao">Fazer encomenda</a>',
  '</header>',
  '<section id="bolos">',
  '  <h2>Bolos que viram lembrança</h2>',
  '  <p>Receitas feitas à mão</p>',
  '</section>',
  ':root { --rosa: #e86a9a; }',
  '.botao { background: var(--rosa); }',
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const body = `
${BG}

<div id="hook" class="hook">Ela só tinha<br><span style="color:${PINK}">um caderno.</span></div>
<div id="julia" class="abs" style="left:110px;top:690px">${person('pj', PINK, { size: 360, hair: '#6b3a1f' })}</div>
<div id="jName" class="chip" style="left:170px;top:1090px">Júlia</div>
<div id="cake" class="abs" style="left:620px;top:700px">${cake(1.7)}</div>

<!-- the notebook -->
<div id="book" class="abs" style="left:120px;top:420px;width:840px;height:820px;border-radius:30px;background:#fbf7ee;color:#2b2118;box-shadow:0 50px 100px -40px rgba(0,0,0,.9);background-image:repeating-linear-gradient(transparent 0 58px,#e6dcc8 58px 60px);padding:50px 60px 0 110px">
  <div style="position:absolute;left:70px;top:0;bottom:0;width:3px;background:#f0a8a8"></div>
  <div style="font-size:46px;font-weight:900;font-style:italic">Ideias do site</div>
  <div id="nb1" style="margin-top:44px"><div style="font-size:30px;font-weight:800">Cores</div>
    <div style="display:flex;gap:18px;margin-top:14px">${['#e86a9a', '#fbe3ec', '#6b3a1f', '#ffffff'].map((c) => `<span style="width:80px;height:80px;border-radius:20px;background:${c};border:2px solid #d9cdb4"></span>`).join('')}</div></div>
  <div id="nb2" style="margin-top:34px"><div style="font-size:30px;font-weight:800">Sabores</div>
    <div style="font-size:30px;margin-top:8px;font-style:italic">chocolate · morango · limão</div></div>
  <div id="nb3" style="margin-top:34px"><div style="font-size:30px;font-weight:800">Fotos dos bolos</div>
    <div style="display:flex;gap:18px;margin-top:12px">${[0, 1, 2].map(() => `<span style="width:150px;height:130px;border-radius:16px;background:#fff;border:2px solid #d9cdb4;display:grid;place-items:center">${cake(0.62)}</span>`).join('')}</div></div>
</div>

<!-- the code -->
<div id="code" class="card" style="left:60px;right:60px;top:430px;height:720px;overflow:hidden;padding:0">
  <div style="height:60px;display:flex;align-items:center;padding:0 28px;border-bottom:1px solid rgba(255,255,255,.08);font-size:24px;color:#8790a6;font-family:ui-monospace,Menlo,monospace">confeitaria.html</div>
  <pre id="pre" style="margin:0;padding:28px;font:30px/1.55 ui-monospace,Menlo,Consolas,monospace;color:#c6cede;white-space:pre-wrap"></pre>
</div>
<div id="zero" class="chip" style="left:90px;top:1170px;color:#8db8ff;border-color:#4d8dff">Do zero · sem modelo pronto</div>

<!-- look, then photos -->
<div id="win" class="abs" style="left:60px;right:60px;top:430px;height:640px;border-radius:30px;overflow:hidden;background:#0f1520;border:1px solid rgba(255,255,255,.12);box-shadow:0 60px 120px -50px rgba(232,106,154,.6)">
  <div style="height:58px;display:flex;align-items:center;gap:12px;padding:0 24px;border-bottom:1px solid rgba(255,255,255,.08)"><span style="font-size:22px;color:#8790a6;background:#151c29;border-radius:999px;padding:6px 18px">exemplo.com.br</span></div>
  <img id="look" src="${img('confeitaria.png')}" style="position:absolute;inset:58px 0 0 0;width:100%;height:calc(100% - 58px);object-fit:cover;object-position:top;filter:grayscale(1) contrast(.8) brightness(1.15) blur(1.5px)">
  <img id="full" src="${img('confeitaria.png')}" style="position:absolute;inset:58px 0 0 0;width:100%;height:calc(100% - 58px);object-fit:cover;object-position:top">
</div>
<div id="sVis" class="chip" style="left:90px;top:1100px">O visual</div>
<div id="sFot" class="chip" style="left:90px;top:1100px;color:#ffc4d8;border-color:${PINK}">As fotos</div>
<div id="tagD" class="tag" style="left:620px;top:1110px">Projeto conceito</div>

<!-- her face -->
<div id="end" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="abs" style="left:60px;right:60px;top:430px;height:560px;border-radius:30px;overflow:hidden;border:2px solid ${PINK};box-shadow:0 60px 120px -40px rgba(232,106,154,.6)"><img src="${img('confeitaria.png')}" style="width:100%;height:100%;object-fit:cover;object-position:top"></div>
  <div class="abs" style="left:90px;top:900px">${person('pj2', PINK, { size: 300, hair: '#6b3a1f' })}</div>
  <div class="chip" style="left:420px;top:1080px;color:#ffc4d8;border-color:#e86a9a">Com a cara da confeitaria</div>
</div>

${comentaBlock('Quer um site feito do zero pro seu negócio?', 'SITE')}
`;

const script = `
const CODE=${JSON.stringify(CODE.map(esc))};
window.draw=(t)=>{
  show('hook',t,0,2.0,{dy:0,fi:.01});
  show('julia',t,0.05,2.0,{dy:60,fi:.3}); show('jName',t,0.3,2.0,{pop:true,sc:.4}); show('cake',t,0.2,2.0,{pop:true,sc:.3,dy:0});
  // notebook
  show('book',t,2.04,8.45,{dy:80,fi:.45});
  show('nb1',t,4.4,8.45,{dy:20}); show('nb2',t,5.9,8.45,{dy:20}); show('nb3',t,6.79,8.45,{dy:20});
  // code
  show('code',t,8.5,12.9,{dy:60,fi:.4});
  const n=Math.max(0,Math.ceil(CODE.length*clamp((t-8.7)/3.6)));
  $('pre').innerHTML=CODE.slice(0,n).join('\\n')+(t>8.7&&t<12.9?'<span style="background:#4d8dff">&nbsp;</span>':'');
  show('zero',t,10.5,12.9,{pop:true,sc:.4});
  // look, then photos
  show('win',t,12.96,16.4,{dy:60,fi:.45});
  const p=eo((t-14.75)/.8); $('full').style.opacity=t>14.75?p:0;
  show('sVis',t,12.96,14.75,{pop:true,sc:.4,fo:.15}); show('sFot',t,14.8,16.4,{pop:true,sc:.4}); show('tagD',t,13.3,16.4,{dy:10});
  // her face
  show('end',t,16.44,18.8,{dy:40});
  comenta(t,18.8,21.39,'SITE');
};
`;

export const html = () => page({ css: CSS, body, script, captions: CAPS });

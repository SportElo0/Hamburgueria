// Reel 33 (23/11, versão 3): "Quatro estrelas de diferença". The same story, shots and timing as the reference
// Antônio sent (a customer waits half an hour with his hand up, starts a one-star review, the waitress panics, he
// shows the PDF menu card and swaps it for the QR card, scans, sees the dish in 3D on his table, orders, the order
// flies to the kitchen, the waiter brings it, he takes a bite, pays at the table and gives five stars). One continuous
// first-person shot in our own 3D (diorama33.js), with only what our system really does (the AI assistant scene of the
// reference became "vejo a foto de cada prato"). Menu: Brasa Burger, a Growlift concept brand, with our own photos.
// Narration: Brazilian voices, local and free (narracao33.py, Piper pt_BR), each line at the second of the reference's
// line; captions coloured by who speaks. Ending: "Comenta 3D" + follow @growlift.ai.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { page, comentaBlock } from './base.mjs';

export const DURATION = 59.6;
export const COVER = 1.0;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const bundle = () =>
  buildSync({ entryPoints: [path.join(HERE, 'diorama33.js')], bundle: true, format: 'iife', write: false, minify: true, logLevel: 'error', absWorkingDir: path.resolve(HERE, '../../../..') }).outputFiles[0].text;
const GLB = path.resolve(HERE, '../../../../plataforma/public/3d/hamburguer-exemplo.glb');
const foto = (k) => `data:image/png;base64,${fs.readFileSync(path.join(HERE, 'img33', `foto-${k}.png`)).toString('base64')}`;

// captions from the real start and end of each line (voz33/falas.json), split in short chunks
const DESTAQUE = ['mão levantada', 'Já tô indo', 'Uma estrela', 'Pera, pera, pera!', 'meia hora', 'garçom', 'duas mãos', 'QR', 'PDF', 'esse aqui', 'cardápio', 'Sem baixar nada', 'cada prato', 'em cima da minha mesa', 'agora', 'sozinho', 'número da minha mesa', 'Com licença!', 'Hambúrguer clássico', 'que delícia', 'pago aqui', 'ninguém', 'cinco estrelas', 'Google', 'dar uma', 'Quatro estrelas de diferença', 'amigo', 'restaurante'];
function legendas() {
  const falas = JSON.parse(fs.readFileSync(path.resolve(HERE, '../voz33/falas.json'), 'utf8'));
  const out = [];
  for (const f of falas) {
    if (f.ini >= 55) continue; // the ending card says it on screen
    const words = f.texto.replace('três dê', '3D').split(' ');
    const chunks = [];
    let cur = [];
    for (const w of words) { cur.push(w); if (cur.length >= 4 || /[.:!?,]$/.test(w) && cur.length >= 2) { chunks.push(cur.join(' ')); cur = []; } }
    if (cur.length) chunks.push(cur.join(' '));
    const total = chunks.reduce((n, c) => n + c.length, 0);
    let t = f.ini;
    for (const c of chunks) {
      const d = ((f.fim - f.ini) * c.length) / total;
      out.push([+t.toFixed(2), +(t + d + 0.12).toFixed(2), c, f.quem]);
      t += d;
    }
  }
  return out;
}

const STAR = (id) => `<svg ${id ? `id="${id}" ` : ''}class="st" viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z"/></svg>`;

const css = `
body{background:#1a120c}
#gl,#bgblur{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:1}#bgblur{visibility:hidden}
#vig{position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(180deg,rgba(10,6,4,.55),rgba(10,6,4,0) 26%)}
#meta{position:absolute;left:0;right:0;top:226px;z-index:30;text-align:center;font-size:26px;font-weight:800;letter-spacing:.22em;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.6);visibility:hidden}
#timer{position:absolute;left:50%;top:272px;z-index:30;display:flex;align-items:center;gap:14px;padding:10px 28px;border-radius:999px;background:rgba(28,8,8,.55);border:4px solid #e5484d;color:#ff6b6b;font-size:24px;font-weight:900;letter-spacing:.08em;font-variant-numeric:tabular-nums;visibility:hidden}
#timer span{font-size:42px;letter-spacing:.02em}
#timer i{width:13px;height:13px;border-radius:50%;background:#ff4d4f}
#stars{position:absolute;left:50%;top:352px;z-index:30;display:flex;gap:10px;padding:10px 22px;border-radius:999px;background:rgba(10,6,4,.6);border:1px solid rgba(255,255,255,.14);visibility:hidden}
.st{width:46px;height:46px;fill:none;stroke:#f5c518;stroke-width:1.6}
.st.on{fill:#f5c518}
#later{position:absolute;left:50%;top:236px;z-index:30;color:#fff;font-size:26px;font-weight:800;letter-spacing:.18em;text-shadow:0 2px 10px rgba(0,0,0,.7);visibility:hidden}
#leg{position:absolute;left:60px;right:60px;top:440px;z-index:31;text-align:center;font-size:68px;font-weight:900;line-height:1.12;letter-spacing:-.015em;color:#fff;text-shadow:0 4px 0 rgba(0,0,0,.45),0 0 26px rgba(0,0,0,.6)}
#leg b{font-weight:900;color:#9fd8ff}
#leg.W{color:#ffd84d}#leg.W b{color:#ffd84d}
#leg.G{color:#8fd0ff}#leg.G b{color:#8fd0ff}
#leg .y{color:#ffd84d}
#dim{position:absolute;inset:0;z-index:44;background:linear-gradient(180deg,#0b1430,#060a18);opacity:0;visibility:hidden}
#cap{display:none}
`;

const body = `
<canvas id="gl" width="1080" height="1920"></canvas><canvas id="bgblur" width="1080" height="1920"></canvas>
<div id="vig"></div>
<div id="meta">SÁBADO · 22:40 · MESA 7</div>
<div id="timer"><i></i>ESPERANDO <span id="tm">29:57</span></div>
<div id="stars">${[1, 2, 3, 4, 5].map((i) => STAR('s' + i)).join('')}</div>
<div id="later">UM TEMPINHO DEPOIS</div>
<div id="leg"></div>
<div id="dim"></div>
${comentaBlock('Tem restaurante?<span style="display:block;margin-top:18px;font-size:40px;font-weight:700;color:#c6cede;letter-spacing:-.01em">Cardápio no QR, prato em 3D e Pix na mesa</span>', '3D', 'dark', 430, 'Segue e comenta')}
`;

const script = (LEG) => `
window.MOTION=2;
const LEG=${JSON.stringify(LEG)};
const HL=${JSON.stringify(DESTAQUE)};
const STARS=[[4.25,1],[24.5,2],[29.3,3],[36.4,4],[43.95,5]];
const esc=(s)=>s.replace(/[&<>]/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
window.draw=(t)=>{
  // the 3D scene; on the ending card a blurred still of it is drawn once
  if(t>=55.1){ if(!window._bk){ window.dio.draw(55.1); const g=$('bgblur').getContext('2d'); g.filter='blur(10px) brightness(.7)'; g.drawImage($('gl'),-30,-30,1140,1980); window._bk=1; } $('gl').style.visibility='hidden'; $('bgblur').style.visibility='visible'; }
  else { window.dio.draw(t); $('gl').style.visibility='visible'; $('bgblur').style.visibility='hidden'; }
  show('meta',t,0,3.4,{dy:-10});
  show('timer',t,0.05,16.45,{dy:-10,base:'translateX(-50%)'});
  const sec=Math.min(16,Math.floor(t)); const tot=29*60+57+sec; $('tm').textContent=Math.floor(tot/60)+':'+String(tot%60).padStart(2,'0');
  show('stars',t,4.1,55.1,{dy:-10,base:'translateX(-50%)'});
  let n=0; for(const [a,k] of STARS) if(t>=a) n=k;
  for(let i=1;i<=5;i++){const s=$('s'+i);s.classList.toggle('on',i<=n);const st=STARS.find(x=>x[1]===i);const kk=st&&t>=st[0]?eoS((t-st[0])/.35):1;s.style.transform='scale('+(i<=n?(1.4-.4*kk):1)+')';}
  show('later',t,31.5,33.3,{dy:-10,base:'translateX(-50%)'});
  // captions: white = the customer, yellow = the waiter, blue = the waitress
  const c=LEG.find(x=>t>=x[0]&&t<x[1]); const el=$('leg');
  if(c&&t<55.1){ const key=c[0]+c[2]; if(el.dataset.k!==key){ el.dataset.k=key; el.className=c[3]; let h=esc(c[2]); const w=HL.find(x=>h.includes(x)); if(w) h=h.replace(w,(w.startsWith('Quatro')?'<b class="y">':'<b>')+w+'</b>'); el.innerHTML=h; }
    const k=eoS((t-c[0])/.18); el.style.opacity=String(k); el.style.transform='scale('+(.92+.08*k)+')'; }
  else el.style.opacity='0';
  // ending
  show('dim',t,55.1,undefined,{dy:0,fi:.4}); if(t>=55.1) $('dim').style.opacity=String(Math.min(.92,eoS((t-55.1)/.4)*.92));
  comenta(t,55.2,56.6,'3D');
};
`;

export const html = () => {
  const p = page({ css, body, script: script(legendas()), captions: [], brandColor: '#ffffff' });
  const glb = fs.readFileSync(GLB).toString('base64');
  const fotos = Object.fromEntries(['duplo', 'classico', 'fritas', 'refri', 'sobremesa'].map((k) => [k, foto(k)]));
  return p
    .replace('<script>', () => `<script>window.BURGER_B64="${glb}";window.FOTOS=${JSON.stringify(fotos)};</script><script>${bundle()}</script><script>`)
    .replace('</body>', () => `<script>{const r=window.render;window.render=async(t)=>{await window.ready;return r(t);};}</script></body>`);
};

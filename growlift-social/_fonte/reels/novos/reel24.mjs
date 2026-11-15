// Reel 24 (15/11): "O funil furado". No characters: a glass funnel in a dark navy space, blue drops (requests)
// pouring in. Four holes leak red drops and a counter of what escaped goes up; the camera flies to each hole, a clean
// product card shows what patches it (missed call → WhatsApp, night message → AI attendant, forgotten quote →
// reminder + task, forgotten visit → reminder the day before) and the hole seals. Ends with the whole funnel flowing.
// Everything is a deterministic function of t (drawn on a canvas each frame). Captions are kinetic, word by word,
// mixing Inter with an italic serif accent. The product is shown as a demonstration (see the caption).
import { page, comentaBlock } from './base.mjs';

export const DURATION = 31.5;
export const COVER = 2.6;

// Funnel geometry (screen = world at the overview camera).
const G = { rimY: 520, l: 170, r: 910, neckY: 1080, nl: 476, nr: 604, spoutY: 1330 };
const holePt = (side, s) => (side === 'L' ? [G.l + s * (G.nl - G.l), G.rimY + s * (G.neckY - G.rimY)] : [G.r + s * (G.nr - G.r), G.rimY + s * (G.neckY - G.rimY)]);
// Timing synced to narracao-24-eleven.mp3: z = camera reaches the hole (problem line), c = product card (solution line), e = camera leaves.
const Z0 = 4.0;
const TEMPOS = [[4.0, 6.3, 9.95], [9.95, 12.75, 16.4], [16.4, 17.8, 20.7], [20.7, 22.55, 25.0]];
const FIM = 25.0;
const HOLES = [
  { side: 'L', s: 0.3, nome: 'LIGAÇÃO PERDIDA' },
  { side: 'R', s: 0.42, nome: 'WHATSAPP SEM RESPOSTA' },
  { side: 'L', s: 0.68, nome: 'ORÇAMENTO ESQUECIDO' },
  { side: 'R', s: 0.72, nome: 'VISITA ESQUECIDA' },
].map((h, k) => {
  const [x, y] = holePt(h.side, h.s);
  const [z, c, e] = TEMPOS[k];
  return { ...h, x, y, z, c, e, seal: c + 1.6 };
});

// Kinetic captions: [start, end, lines]; a word "*x*" is the italic serif accent, "[x]" the blue box, "!x!" red.
const FALAS = [
  [0.1, 1.57, ['O seu funil', '*tá* *furado.*']],
  [1.85, 3.87, ['Cada furo é um', 'cliente !indo! !embora.!']],
  [4.15, 6.32, ['O telefone tocou', 'e *ninguém* *atendeu.*']],
  [6.6, 9.84, ['Quem ligou pode apertar 1', 'e receber no [WhatsApp.]']],
  [10.12, 12.78, ['Mensagem às 23h,', '*sem* *resposta.*']],
  [13.06, 16.32, ['A [atendente] [de] [IA]', 'responde no WhatsApp.']],
  [16.6, 17.79, ['O orçamento', '*esquecido.*']],
  [18.07, 20.61, ['Lembrete pro cliente,', '[tarefa] pro vendedor.']],
  [20.89, 22.56, ['Marcou a visita', '*e* *esqueceu.*']],
  [22.84, 24.87, ['Um dia antes,', 'o [lembrete] chega.']],
  [25.15, 27.1, ['Cada pedido pode', '*chegar* *até* *alguém.*']],
];

const palavra = (w) => {
  if (/^\*.*\*$/.test(w)) return `<span class="w it">${w.slice(1, -1)}</span>`;
  if (/^\[.*\]$/.test(w)) return `<span class="w hl">${w.slice(1, -1)}</span>`;
  if (/^!.*!$/.test(w)) return `<span class="w red">${w.slice(1, -1)}</span>`;
  return `<span class="w">${w}</span>`;
};
const falasHtml = FALAS.map(([, , linhas], i) => `<div class="fala" id="fala${i}">${linhas.map((l) => `<div class="lin">${l.split(' ').map(palavra).join(' ')}</div>`).join('')}</div>`).join('');

const css = `
body{background:#05070c;color:#f3f5f9}
#cap{display:none}
#cv{position:absolute;left:0;top:0;width:1080px;height:1920px}
.fala{position:absolute;left:50px;right:50px;top:1452px;text-align:center;z-index:30}
.lin{font-size:66px;font-weight:900;letter-spacing:-.035em;line-height:1.12;margin:4px 0}
.w{display:inline-block;will-change:transform,opacity,filter}
.w.it{font-family:'Instrument Serif',serif;font-style:italic;font-weight:400;font-size:92px;letter-spacing:-.01em}
.w.hl{background:#0865fe;color:#fff;padding:0 14px;border-radius:12px;margin:0 -2px}
.w.red{color:#ff6b5b}
#hud{position:absolute;right:70px;top:150px;z-index:40;text-shadow:0 2px 14px #05070c,0 0 4px #05070c;text-align:right;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
#hud .t{font-size:20px;font-weight:700;letter-spacing:.18em;color:#6ea6ff}
#hud .n{font-size:84px;font-weight:800;line-height:1;color:#fff;font-variant-numeric:tabular-nums}
#chips{position:absolute;left:70px;right:70px;top:300px;z-index:40;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.chip{font-size:19px;font-weight:800;letter-spacing:.08em;padding:9px 16px;border-radius:999px;border:1.5px solid rgba(255,107,91,.55);color:#ffb4a8;background:rgba(255,107,91,.10);transition:none}
.chip.ok{border-color:#4d8dff;color:#dbe8ff;background:rgba(8,101,254,.22)}
.tagh{position:absolute;z-index:25;transform:translate(-50%,-50%);font-size:26px;font-weight:800;letter-spacing:.08em;padding:10px 18px;border-radius:999px;white-space:nowrap;background:rgba(40,8,8,.75);border:2px solid #ff6b5b;color:#ffc4bb}
.card{position:absolute;left:110px;right:110px;top:965px;z-index:28;background:#f6f8fc;color:#0b1220;border-radius:30px;padding:26px 28px;box-shadow:0 40px 90px -30px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.4);font-size:27px;line-height:1.35}
.card .top{display:flex;align-items:center;gap:12px;font-size:21px;font-weight:800;color:#5d6b82;letter-spacing:.02em;margin-bottom:14px}
.card .top i{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#fff;font-style:normal;font-size:18px}
.b{max-width:88%;padding:14px 18px;border-radius:20px;font-weight:600;margin-top:10px}
.b.in{background:#fff;border:1px solid #e3e8ef;border-bottom-left-radius:6px}
.b.out{background:#d9fdd3;margin-left:auto;border-bottom-right-radius:6px}
.row{display:flex;align-items:center;gap:12px;margin-top:12px;font-weight:700}
.ok2{width:34px;height:34px;border-radius:50%;background:#16a34a;color:#fff;display:grid;place-items:center;font-size:19px;flex:none}
.key{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;font-size:30px;font-weight:800;background:#e3e8ef;color:#0b1220}
#selo{position:absolute;left:84px;top:204px;z-index:47;font-size:19px;font-weight:800;letter-spacing:.14em;padding:8px 14px;border-radius:999px;border:1.5px solid rgba(255,255,255,.35);color:#dfe6f2;background:rgba(5,7,12,.85)}
#hud .t2{font-size:17px;font-weight:700;letter-spacing:.18em;color:#9aa6ba;margin-bottom:6px}
#dim{position:absolute;inset:0;z-index:44;background:rgba(3,5,10,.9)}
#veu{position:absolute;left:0;right:0;top:1330px;bottom:0;z-index:29;background:linear-gradient(rgba(4,6,11,0),rgba(4,6,11,.82) 30%,rgba(4,6,11,.9));pointer-events:none}
`;

const card = (id, icon, cor, titulo, inner) => `<div id="${id}" class="card"><div class="top"><i style="background:${cor}">${icon}</i>${titulo}</div>${inner}</div>`;

const body = `
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap" rel="stylesheet">
<canvas id="cv" width="1080" height="1920"></canvas>
<div id="selo">DEMONSTRAÇÃO · DADOS FICTÍCIOS</div>
<div id="hud"><div class="t2">EXEMPLO ILUSTRATIVO</div><div class="t">PEDIDOS QUE ESCAPARAM</div><div class="n" id="cont">0</div></div>
<div id="chips">${HOLES.map((h, k) => `<span class="chip" id="chip${k}">${['LIGAÇÃO', 'WHATSAPP', 'ORÇAMENTO', 'VISITA'][k]}</span>`).join('')}</div>
${HOLES.map((h, k) => `<div class="tagh" id="tag${k}">${h.nome}</div>`).join('')}
${card('k0', '☎', '#5d6b82', 'LIGAÇÃO NÃO ATENDIDA', `<div style="font-weight:600">“Se ninguém puder atender, quer receber uma mensagem no WhatsApp, neste número? Aperte 1.”</div><div style="display:flex;gap:14px;margin-top:16px"><span class="key" id="k0a">1</span><span class="key">2</span><span class="key">3</span></div><div class="b out" id="k0b">Oi! Aqui é a Ana, assistente virtual. Vi que você ligou e não conseguimos atender. Como posso te ajudar?</div>`)}
${card('k1', '✆', '#16a34a', 'WHATSAPP · 23:12', `<div class="b in" id="k1a">Vocês atendem no sábado?</div><div class="b out" id="k1b">Oi! Atendemos sim, das 8h às 12h. Quer que eu veja um horário pra você?</div><div style="margin-top:10px;font-size:20px;font-weight:800;color:#0865fe" id="k1c">● ATENDENTE DE IA · EXEMPLO DE RESPOSTA</div>`)}
${card('k2', '▤', '#0865fe', 'PROPOSTA SEM RESPOSTA · 2 DIAS', `<div class="row" id="k2a"><span class="ok2">✓</span>Lembrete ao cliente (se ele aceitou receber)</div><div class="row" id="k2b"><span class="ok2">✓</span>Tarefa: ligar para o Jorge hoje</div><div class="row" id="k2c" style="color:#5d6b82;font-weight:600">Some sozinho se o cliente responder.</div>`)}
${card('k3', '✆', '#16a34a', 'WHATSAPP · QUARTA, 18:00', `<div class="b out" id="k3a">Oi, Jorge! Lembrete: amanhã, quinta, às 9h, sua visita está marcada. Confirma?</div><div class="b in" id="k3b">Confirmo!</div><div id="k3c" style="margin-top:12px;font-size:20px;font-weight:600;color:#5d6b82">Só para quem aceitou receber lembretes. Responda SAIR para parar.</div>`)}
<div id="veu"></div>
${falasHtml}
<div id="dim"></div>
${comentaBlock('Quer ver a demonstração?', 'FUNIL', 'dark', 500)}
`;

const script = `
window.MOTION=2;
const G=${JSON.stringify(G)};
const H=${JSON.stringify(HOLES)};
const FALAS=${JSON.stringify(FALAS.map(([a, b]) => [a, b]))};
const Z0=${Z0}, FIM=${FIM};
const cv=$('cv'), c=cv.getContext('2d');
const L=(a,b,x)=>a+(b-a)*x;
const hash=(n)=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
// Camera: [x, y, scale] of the world point shown at screen (540, 860).
function camAt(t){
  const over=[540,930,1], hook=[540,760,1.22];
  if(t<3.2) return mixC(hook,over,eioS((t-1.4)/1.8));
  for(let k=0;k<4;k++){
    const h=H[k], z=h.z, zin=[h.x+(h.side==='L'?40:-40),h.y+110,2.05];
    if(t>=z-0.25&&t<h.e-0.25){
      const a=eioS((t-(z-0.25))/0.9), b=k===3?eioS((t-(h.e-1.2))/1.0):0;
      if(k<3&&t>h.e-0.95){const n=H[k+1], nz=[n.x+(n.side==='L'?40:-40),n.y+110,2.05]; return mixC(zin,nz,eioS((t-(h.e-0.95))/0.7));}
      return mixC(mixC(over,zin,a),over,b);
    }
  }
  if(t<Z0) return over;
  // Finale: slow push in, then out.
  return [540,930-30*Math.sin(Math.min(1,(t-FIM)/4)*Math.PI),1+0.06*Math.sin(Math.min(1,(t-FIM)/4)*Math.PI)];
}
function mixC(a,b,k){return [L(a[0],b[0],k),L(a[1],b[1],k),L(a[2],b[2],k)];}
let CAM=[540,930,1];
const sx=(x)=>(x-CAM[0])*CAM[2]+540, sy=(y)=>(y-CAM[1])*CAM[2]+860;

function fundo(t){
  const g=c.createRadialGradient(540,620,80,540,900,1300); g.addColorStop(0,'#0e2147'); g.addColorStop(.55,'#070c19'); g.addColorStop(1,'#04060b');
  c.fillStyle=g; c.fillRect(0,0,1080,1920);
  // light rays from the top
  c.save(); c.globalCompositeOperation='lighter';
  for(let i=0;i<5;i++){const x=200+i*170+Math.sin(t*.3+i)*30; const gr=c.createLinearGradient(x,0,x+80,1300); gr.addColorStop(0,'rgba(77,141,255,0.10)'); gr.addColorStop(1,'rgba(77,141,255,0)'); c.fillStyle=gr; c.beginPath(); c.moveTo(x-40,0); c.lineTo(x+60,0); c.lineTo(x+260,1400); c.lineTo(x-120,1400); c.fill();}
  c.restore();
  // dust
  for(let i=0;i<70;i++){const x=(hash(i)*1080+t*12*(hash(i+9)-.5))%1080, y=(hash(i+3)*1920-t*(10+hash(i+5)*25)+1920)%1920; c.fillStyle='rgba(180,205,255,'+(0.08+hash(i+7)*0.25)+')'; c.beginPath(); c.arc(x,y,1+hash(i+1)*2.2,0,7); c.fill();}
}
function funilPath(){c.beginPath(); c.moveTo(sx(G.l),sy(G.rimY)); c.lineTo(sx(G.nl),sy(G.neckY)); c.lineTo(sx(G.nl),sy(G.spoutY)); c.lineTo(sx(G.nr),sy(G.spoutY)); c.lineTo(sx(G.nr),sy(G.neckY)); c.lineTo(sx(G.r),sy(G.rimY)); c.closePath();}
function funil(t,cheio){
  c.save(); funilPath();
  const gr=c.createLinearGradient(sx(G.l),0,sx(G.r),0); gr.addColorStop(0,'rgba(77,141,255,0.16)'); gr.addColorStop(.5,'rgba(77,141,255,'+(0.05+0.18*cheio)+')'); gr.addColorStop(1,'rgba(77,141,255,0.16)');
  c.fillStyle=gr; c.fill();
  c.shadowColor='#2f7bff'; c.shadowBlur=30*CAM[2]; c.strokeStyle='rgba(120,170,255,0.95)'; c.lineWidth=6*CAM[2]; c.lineJoin='round'; c.stroke();
  c.shadowBlur=0; c.strokeStyle='rgba(255,255,255,0.35)'; c.lineWidth=2*CAM[2];
  c.beginPath(); c.moveTo(sx(G.l+30),sy(G.rimY+30)); c.lineTo(sx(G.nl+14),sy(G.neckY-20)); c.stroke();
  // rim ellipse
  c.strokeStyle='rgba(150,190,255,0.8)'; c.lineWidth=4*CAM[2]; c.beginPath(); c.ellipse(sx(540),sy(G.rimY),370*CAM[2],38*CAM[2],0,0,7); c.stroke();
  c.restore();
}
// Main flow: deterministic drops (requests) that fall in, slide to the neck and leave through the spout.
function gota(x,y,r,cor,a){c.globalAlpha=a; c.fillStyle=cor; c.beginPath(); c.moveTo(sx(x),sy(y-r*1.6)); c.bezierCurveTo(sx(x+r),sy(y-r*.4),sx(x+r),sy(y+r),sx(x),sy(y+r)); c.bezierCurveTo(sx(x-r),sy(y+r),sx(x-r),sy(y-r*.4),sx(x),sy(y-r*1.6)); c.fill(); c.globalAlpha=1;}
function fluxo(t){
  c.save(); c.globalCompositeOperation='lighter';
  const ini=Math.max(0,Math.floor((t-2.2)/0.085)), fim=Math.floor((t-0.25)/0.085);
  for(let i=ini;i<=fim;i++){
    const ts=0.25+i*0.085+hash(i)*0.05, u=t-ts; if(u<0) continue;
    const x0=300+hash(i+1)*480, xn=540+(hash(i+2)-.5)*40;
    let x,y,a=1;
    if(u<0.55){const k=u/0.55; x=x0; y=-60+580*k*k;}
    else if(u<1.35){const k=(u-.55)/0.8, e=k*k; x=L(x0,xn,e); y=L(G.rimY,G.neckY-6,e);}
    else if(u<1.75){const k=(u-1.35)/0.4; x=xn; y=L(G.neckY,G.spoutY+120,k); a=1-Math.max(0,(k-.6)/.4);}
    else continue;
    gota(x,y,9,'#4d8dff',0.9*a);
  }
  c.restore();
}
// Leaks: red drops thrown out of each hole until it is sealed. Count = how many escaped so far.
const PASSO=0.55;
function vaza(t){
  let total=0;
  c.save(); c.globalCompositeOperation='lighter';
  for(let k=0;k<4;k++){
    const h=H[k], dir=h.side==='L'?-1:1, n=Math.max(0,Math.floor((Math.min(t,h.seal)-1.0)/PASSO));
    total+=n;
    for(let j=Math.max(0,n-8);j<n;j++){
      const ts=1.0+j*PASSO, u=t-ts; if(u<0||u>1.6) continue;
      const vx=dir*(160+hash(k*99+j)*180), vy=40+hash(k*31+j)*160;
      gota(h.x+vx*u, h.y+vy*u+800*u*u, 10, '#ff5a4e', Math.max(0,1-u/1.5));
    }
  }
  c.restore();
  return total;
}
function furos(t){
  for(let k=0;k<4;k++){
    const h=H[k], x=sx(h.x), y=sy(h.y), r=16*CAM[2];
    if(t<h.seal){
      const p=.5+.5*Math.sin(t*7+k);
      c.save(); c.shadowColor='#ff5a4e'; c.shadowBlur=24+16*p; c.fillStyle='#08040a'; c.beginPath(); c.arc(x,y,r,0,7); c.fill();
      c.strokeStyle='rgba(255,90,78,'+(0.7+0.3*p)+')'; c.lineWidth=4*CAM[2]; c.stroke(); c.restore();
    } else {
      const u=t-h.seal;
      if(u<0.9){c.save(); c.strokeStyle='rgba(77,141,255,'+(1-u/0.9)+')'; c.lineWidth=6*CAM[2]; c.beginPath(); c.arc(x,y,r*(1+u*5),0,7); c.stroke(); c.restore();}
      const s=Math.min(1,eoS(u/0.35));
      c.save(); c.shadowColor='#2f7bff'; c.shadowBlur=26; c.fillStyle='#0865fe'; c.beginPath(); c.arc(x,y,r*1.25*s,0,7); c.fill();
      c.strokeStyle='#fff'; c.lineWidth=4*CAM[2]*s; c.lineCap='round'; c.beginPath(); c.moveTo(x-r*.5,y); c.lineTo(x-r*.1,y+r*.4); c.lineTo(x+r*.55,y-r*.4); c.stroke(); c.restore();
    }
  }
}
function falas(t){
  FALAS.forEach(([a,b],i)=>{
    const el=$('fala'+i); const vis=t>=a&&t<b+0.25; el.style.visibility=vis?'visible':'hidden'; if(!vis) return;
    const ws=el.querySelectorAll('.w'); const sai=b<t?eoS((t-b)/0.25):0;
    ws.forEach((w,j)=>{const k=eoS((t-(a+j*0.085))/0.42); w.style.opacity=Math.max(0,k-sai); w.style.transform='translateY('+((1-k)*36-sai*20)+'px) scale('+(0.92+0.08*k)+')'; w.style.filter='blur('+((1-k)*10)+'px)';});
  });
}
window.draw=(t)=>{
  CAM=camAt(t);
  fundo(t);
  const cheio=t>FIM?eioS((t-FIM)/1.2):0;
  funil(t,cheio);
  fluxo(t);
  const n=vaza(t);
  furos(t);
  $('cont').textContent=String(n);
  $('cont').style.color=t>H[3].seal?'#7fb2ff':'#fff';
  show('hud',t,0.6,27.2,{dy:-20}); show('chips',t,1.9,27.2,{dy:-16});
  H.forEach((h,k)=>{
    $('chip'+k).className='chip'+(t>=h.seal?' ok':'');
    const el=$('tag'+k), on=(t>1.95&&t<3.85)||(t>=h.z+0.3&&t<h.seal+0.4);
    el.style.opacity=on?1:0;
    const meio=el.offsetWidth/2+30, lx=sx(h.x)+(h.side==='L'?-1:1)*(t<h.z?150:250);
    el.style.left=Math.max(meio,Math.min(1080-meio,lx))+'px'; el.style.top=Math.max(420,sy(h.y)-(t<h.z?70:150))+'px';
    // product card that patches the hole
    show('k'+k,t,h.c,h.e-0.35,{dy:60,fi:.5});
  });
  // card details
  const p=(t>=H[0].c+0.8&&t<H[0].e)?1:0; $('k0a').style.background=p?'#0865fe':'#e3e8ef'; $('k0a').style.color=p?'#fff':'#0b1220';
  show('k0b',t,H[0].c+1.2,undefined,{dy:20});
  show('k1a',t,H[1].c+0.3,undefined,{dy:20}); show('k1b',t,H[1].c+1.1,undefined,{dy:20}); show('k1c',t,H[1].c+1.6,undefined,{dy:10});
  show('k2a',t,H[2].c+0.6,undefined,{dy:16}); show('k2b',t,H[2].c+1.1,undefined,{dy:16}); show('k2c',t,H[2].c+1.6,undefined,{dy:10});
  show('k3a',t,H[3].c+0.4,undefined,{dy:20}); show('k3b',t,H[3].c+1.0,undefined,{dy:20}); show('k3c',t,H[3].c+1.4,undefined,{dy:10});
  falas(t);
  show('dim',t,27.2,undefined,{dy:0,fi:.6});
  comenta(t,27.35,28.5,'FUNIL');
};
`;

export const html = () => page({ css, body, script, captions: [] });

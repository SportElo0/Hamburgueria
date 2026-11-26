// Reel 38 (26/11): "Montando o atendimento". Formato de "montar o funil peça por peça" (pedido do Antônio a partir de
// uma referência), refeito do zero no nosso 3D (diorama38.js): plataformas no vácuo, bordas de luz azul, bonequinhos
// lisos e bolinhas de contato. A história é a nossa: você sozinho → 50 contatos → atendente → a IA responde todos →
// filtra → agenda enche e metade falta → a IA lembra → o cliente some → a IA retoma → tudo junto. Sem número de
// faturamento nem promessa de resultado. Tempos (T) provisórios até a voz do Antônio; depois vêm de tempos38.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { page, comentaBlock } from './base.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TFILE = path.join(HERE, '../tempos38.json');
export const T = fs.existsSync(TFILE) ? JSON.parse(fs.readFileSync(TFILE, 'utf8')) : {
  sozinho: 0.2, cinquenta: 3.4, atendente: 7.0, ia: 11.2, filtro: 15.0, agenda: 19.0, lembrete: 22.0, some: 25.4, retoma: 27.6, junto: 30.4, segue: 34.6, fim: 39.5,
};
export const DURATION = T.fim;
export const SPEED = 1.15; // pedido do Antônio (26/11): o vídeo inteiro em 1,15x
export const COVER = T.ia + 1.2;
export const AUDIO = '../narracao-38-eleven.mp3';

const bundle = () =>
  buildSync({ entryPoints: [path.join(HERE, 'diorama38.js')], bundle: true, format: 'iife', write: false, minify: true, logLevel: 'error', absWorkingDir: path.resolve(HERE, '../../../..') }).outputFiles[0].text;

const css = `
body{background:#010204}
#gl{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:1}
.brandmark{display:none}
#top{position:absolute;left:60px;right:60px;top:200px;z-index:20;display:flex;justify-content:space-between;font-family:ui-monospace,Menlo,monospace;font-size:24px;letter-spacing:.18em;color:#9fb8e6}
#top b{color:#7fb2ff;font-weight:700}
#bar{position:absolute;left:60px;right:60px;top:246px;height:3px;background:#1a2440;z-index:20}
#bar i{display:block;height:100%;background:#2f7dff;box-shadow:0 0 12px #2f7dff;transform-origin:left;transform:scaleX(0)}
.card{position:absolute;z-index:22;visibility:hidden;font-family:ui-monospace,Menlo,monospace;color:#e6eeff;background:rgba(6,12,28,.82);border:2px solid #2f7dff;border-radius:16px;padding:14px 22px;box-shadow:0 0 30px rgba(47,125,255,.45)}
.card small{display:block;font-size:20px;letter-spacing:.2em;color:#7fb2ff}
.card b{display:block;font-size:56px;font-weight:800;letter-spacing:.04em}
#cnt{left:60px;top:330px}
#tm{right:60px;top:330px}#tm.red{border-color:#ff4d4d;box-shadow:0 0 30px rgba(255,77,77,.45)}#tm.red b{color:#ff8080}
#chk{left:60px;top:330px;padding:16px 22px}
#chk div{font-size:30px;font-weight:700;margin:6px 0;display:flex;gap:14px;align-items:center;visibility:hidden}
#chk div i{width:30px;height:30px;border-radius:6px;background:#2f7dff;color:#fff;font-style:normal;font-size:22px;display:grid;place-items:center}
#bell{left:50%;top:330px;transform:translateX(-50%);text-align:center}
#bell b{font-size:40px}
#iaTag{right:60px;top:330px}
#fim{position:absolute;inset:0;z-index:44;background:rgba(1,2,4,.9);visibility:hidden}
#nota{position:absolute;left:60px;right:60px;bottom:200px;z-index:47;text-align:center;font-size:21px;font-weight:600;color:#7f8db0;visibility:hidden}
#cap{top:1430px!important;background:none!important;border:0!important;color:#fff!important;font-size:60px!important;text-shadow:0 4px 24px rgba(0,0,0,.95)}
#cap .hl{background:#2f7dff!important;color:#fff!important;border-radius:10px}
`;

const body = `
<canvas id="gl" width="1080" height="1920"></canvas>
<div id="top"><span>MONTANDO O ATENDIMENTO</span><span>PEÇA <b id="pc">00</b>/05</span></div>
<div id="bar"><i id="barI"></i></div>
<div id="cnt" class="card"><small>CONTATOS HOJE</small><b id="cntN">3</b></div>
<div id="tm" class="card"><small id="tmS">ESPERANDO</small><b id="tmN">0:00</b></div>
<div id="iaTag" class="card"><small>ATENDENTE DE IA</small><b>ONLINE</b></div>
<div id="chk" class="card"><small>A IA PERGUNTA</small><div id="c1"><i>✓</i>Orçamento?</div><div id="c2"><i>✓</i>Urgência?</div><div id="c3"><i>✓</i>Quem decide?</div></div>
<div id="bell" class="card"><small>LEMBRETE NA VÉSPERA</small><b>🔔 Amanhã, 9h. Confirma?</b></div>
<div id="fim"></div>
${comentaBlock('Quer montar isso no seu negócio?', 'FUNIL', 'dark', 440, 'Segue e comenta')}
<div id="nota">Animação ilustrativa feita pela Growlift. Seguir é opcional: o presente vale pra todo mundo que comentar.</div>
`;

const script = `
window.MOTION=2;
const T=${JSON.stringify(T)};
const L=(a,b,x)=>a+(b-a)*x;
const C=(p,l,f)=>({pos:p,look:l,fov:f});
const R=(i)=>{const s=Math.sin(i*12.9898)*43758.5453;return s-Math.floor(s);};
// Degraus: Y e Z de cada andar (iguais ao diorama38.js). Os contatos andam pelo trilho de cada degrau, da esquerda
// para a direita, passam pela estação do degrau e sobem pela rampa até o próximo.
const SY=[0,1.7,3.4,5.1], SZ=[0,-2.9,-5.8,-8.7], LANE=0.55, OY=0.32;
function cam(t){
  // degrau 0 de perto; a partir do filtro, uma vista de 3/4 que mostra a escada e vai abrindo a cada degrau novo
  const P=[[T.filtro,C([8.5,6.2,9.5],[0,0.8,-1.6],34)],[T.agenda,C([9.5,8.2,11],[0,1.6,-3.1],34)],[T.some,C([10.5,10,12.5],[0,2.3,-4.3],34)],[T.junto,C([12.5,12.5,15.5],[0,2.4,-4.4],36)]];
  if(t<T.filtro){let c=C([6.5,5.6,12],[0,0.3,-0.6],32);if(t<T.cinquenta){const z=1-eoS(clamp(t/T.cinquenta));c.pos=[c.pos[0]-z*1.5,c.pos[1]-z*1.2,c.pos[2]-z*3];}
    const x=eioS(clamp((t-(T.filtro-.6))/.6));if(x>0){const B=P[0][1];c=C(c.pos.map((v,j)=>L(v,B.pos[j],x)),c.look.map((v,j)=>L(v,B.look[j],x)),L(32,34,x));}return c;}
  let i=0;while(i<P.length-1&&t>=P[i+1][0])i++;
  const A=P[i][1];if(i===P.length-1)return A;
  const B=P[i+1][1],x=eioS(clamp((t-(P[i+1][0]-.8))/.8));
  return C(A.pos.map((v,j)=>L(v,B.pos[j],x)),A.look.map((v,j)=>L(v,B.look[j],x)),L(A.fov,B.fov,x));
}
// posição no trilho do degrau i, u de 0 (esquerda) a 1 (direita)
const onStep=(i,u)=>({x:L(-3.6,3.6,u),y:SY[i]+OY,z:SZ[i]+LANE});
// fluxo por vários degraus: k de 0 a 1 percorre do degrau 0 ao último, com a subida entre eles
function flow(k,steps){const s=k*steps,i=Math.min(steps-1,Math.floor(s)),u=s-i;
  if(u<.85||i===steps-1)return onStep(i,Math.min(1,u/.85));
  const r=(u-.85)/.15;return {x:3.6+r*.2,y:L(SY[i]+OY,SY[i+1]+OY,r),z:L(SZ[i]+LANE,SZ[i+1]+LANE,r)};}
function orbsAt(t){
  const o=[];
  if(t<T.cinquenta){ // poucos contatos chegam até você e são atendidos
    for(let i=0;i<3;i++){const k=((t*.35+i/3)%1);const p=onStep(0,Math.min(.45,k));o.push({...p,a:k<.9?1:0});}
  } else if(t<T.atendente){ // 50 contatos: fila enorme parada no trilho
    const n=Math.min(50,Math.floor((t-T.cinquenta)*18)+3);
    for(let i=0;i<n;i++){const row=Math.floor(i/26),u=(i%26)/26*.48;o.push({x:L(-3.6,3.6,u),y:OY+row*.28,z:LANE+(row?-.25:0),a:1});}
  } else if(t<T.ia){ // o atendente demora: fila andando devagar, muitos cinzas
    for(let i=0;i<40;i++){const u=((i/40)*.5+(t-T.atendente)*.02)%.5;o.push({...onStep(0,u),c:R(i)<.5?0x56607a:0xdce8ff,a:1});}
  } else if(t<T.filtro){ // a IA responde todo mundo: fila passa rápido pela IA (no meio do trilho)
    for(let i=0;i<34;i++){const k=((t*.55+i/34)%1);o.push({...onStep(0,k),a:k<.96?1:0});}
  } else if(t<T.agenda){ // filtro no degrau 1: cinzas caem, azuis seguem
    for(let i=0;i<34;i++){const k=((t*.32+i/34)%1);const bad=R(i)<.45;const p=flow(k,2);
      let a=1;if(bad&&k>.75){const f=(k-.75)*4;p.y-=f*f*2.2;a=Math.max(0,1-f*1.4);}
      o.push({...p,c:bad?0x56607a:0xdce8ff,a});}
  } else if(t<T.some){ // agenda no degrau 2: azuis sobem e ocupam as cadeiras (metade, depois todas)
    for(let i=0;i<30;i++){const k=((t*.22+i/30)%1);o.push({...flow(Math.min(.66,k),3),a:k<.66?1:0});}
  } else if(t<T.junto){ // um contato sai do trilho e o anel traz de volta (degrau 3)
    const out=t<T.retoma?clamp((t-T.some)/1.3):1-clamp((t-T.retoma)/1.3);
    const p=onStep(3,.75);o.push({x:p.x+out*3.2,y:p.y+out*1.6,z:p.z+out*1.5,a:1,s:2.4,c:0xffd36b});
    for(let i=0;i<34;i++){const k=((t*.16+i/34)%1);o.push({...flow(k,4),a:1});}
  } else { // tudo junto: fluxo contínuo subindo a escada
    for(let i=0;i<70;i++){const k=((t*.18+i/70)%1);const bad=R(i)<.3;const p=flow(k,4);let a=1;
      if(bad&&k>.4&&k<.5){p.y-=(k-.4)*30;a=1-(k-.4)*10;} else if(bad&&k>=.5)a=0;
      o.push({...p,c:bad?0x56607a:0xdce8ff,a});}
  }
  return o;
}
window.draw=(t)=>{
  const floors=t<T.filtro?1:t<T.agenda?2:t<T.some?3:4;
  const people=[{x:-0.6,z:-0.9,show:true},{x:0.6,z:-0.9,show:t>=T.atendente&&t<T.ia}];
  const iaK=t<T.ia?0:eoS(clamp((t-T.ia)/.5));
  const filled=[1,0,1,0,0,1,0,1].map((v,i)=>t<T.lembrete?v:(clamp((t-T.lembrete-.3-i*.12)/.2)>0?1:v));
  window.cena38(t,{cam:cam(t),floors,people,ia:iaK,iaX:1.6,orbs:orbsAt(t),slots:t>=T.agenda?{floor:2,filled}:null,ring:t>=T.retoma?eoS(clamp((t-T.retoma)/.4)):0,ringFloor:3,iaFloor:t<T.filtro?0:1,iaX:t<T.filtro?1.5:-1.6,iaZ:t<T.filtro?-0.5:-0.7});
  // topo: peça e barra
  const pcs=[T.ia,T.filtro,T.lembrete,T.retoma,T.junto];const n=pcs.filter(x=>t>=x).length;
  $('pc').textContent='0'+n; $('barI').style.transform='scaleX('+(n/5)+')';
  // cards
  show('cnt',t,T.sozinho+.3,T.ia,{dy:0});
  $('cntN').textContent=String(t<T.cinquenta?3:Math.min(50,3+Math.floor((t-T.cinquenta)*18)));
  const waiting=t>=T.atendente&&t<T.ia;
  show('tm',t,T.atendente+.6,T.ia,{dy:0});
  $('tm').className='card'+(waiting?' red':'');
  $('tmN').textContent=Math.floor(clamp((t-T.atendente-.6)/2.5)*6)+':00';
  $('tmS').textContent='CLIENTE ESPERANDO';
  show('iaTag',t,T.ia+.3,T.filtro,{dy:0});
  show('chk',t,T.filtro+.2,T.agenda,{dy:0});
  ['c1','c2','c3'].forEach((id,i)=>show(id,t,T.filtro+.5+i*.45,T.agenda,{dy:10}));
  show('bell',t,T.lembrete+.1,T.some,{dy:0,base:'translateX(-50%)'});
  show('fim',t,T.segue-.1,undefined,{dy:0,fi:.4});
  if(t>=T.segue-.1)comenta(t,T.segue,T.segue+1.6,'FUNIL');
  show('nota',t,T.segue+1.2,undefined,{dy:0});
};
`;

const K = (a, b, txt, hl) => [T[a], (b ? T[b] : T.fim) - 0.08, txt, hl];
const CAPS = [K('sozinho','cinquenta','Você vende sozinho. Atende, explica, negocia e fecha.','sozinho.'),
  K('cinquenta','atendente','Até o dia em que chegam 50 contatos.','50 contatos.'), K('atendente','ia','Aí você contrata um atendente.','atendente.'),
  K('ia','filtro','Agora entra a IA. Ela responde todo mundo, na hora.','IA.'), K('filtro','agenda','Só passa quem está pronto pra comprar.','pronto pra comprar.'),
  K('agenda','lembrete','A agenda enche... e metade não aparece.','metade'), K('lembrete','some','A IA manda o lembrete na véspera.','lembrete'),
  K('some','retoma','O cliente pediu orçamento e sumiu?','sumiu?'), K('retoma','junto','A IA lembra dele.','lembra'),
  K('junto','segue','Resposta. Filtro. Lembrete. Retomada.','Retomada.')];
export const html = (caps = CAPS) => {
  const p = page({ css, body, script, captions: caps, brandColor: '#e6eaf2' });
  const b = bundle();
  return p.replace('<script>', () => `<script>${b}</script><script>`);
};

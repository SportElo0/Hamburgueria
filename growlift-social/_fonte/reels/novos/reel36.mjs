// Reel 36 (25/11): "A skill que acha as outras" (Skill da Semana). Clima de trailer: escuro, neon azul, granulado,
// faixas de cinema, glitches e cortes secos no som. Pouco texto: o que conta é a imagem e o som (som36.py).
// Dado: find-skills (Vercel) é a nº 1 do skills.sh, 4,5 mi de instalações em 25/11/2026. Sem mostrar como instalar:
// quem comenta SKILL recebe no privado. A narração (Google Chirp 3 HD) entra depois por cima do som.
import { page, comentaBlock } from './base.mjs';

export const DURATION = 30;
export const COVER = 4.9;
export const AUDIO = '../narracao-36-eleven.mp3';

const css = `
body{background:#000}
.brandmark{display:none}
#cap{top:300px!important;background:none!important;border:0!important;color:#fff!important;font-size:54px!important;font-weight:800!important;max-width:900px!important;text-shadow:0 4px 30px rgba(0,0,0,.95),0 0 18px rgba(0,0,0,.9)}
#cap .hl{background:none!important;color:#7fb2ff!important;padding:0!important;text-shadow:0 0 30px rgba(47,125,255,.9)}
#cv{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:1}
#grain{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:60;pointer-events:none;mix-blend-mode:screen;opacity:.06}
#bars:before,#bars:after{content:"";position:absolute;left:0;right:0;height:170px;background:#000;z-index:58}
#bars:before{top:0}#bars:after{bottom:0}
#vig{position:absolute;inset:0;z-index:57;pointer-events:none;background:radial-gradient(110% 70% at 50% 48%,rgba(0,0,0,0) 45%,rgba(0,0,0,.85) 100%)}
#flash{position:absolute;inset:0;z-index:56;background:#cfe0ff;opacity:0}
#num{position:absolute;left:0;right:0;top:760px;z-index:20;text-align:center;visibility:hidden}
#num b{display:block;font-size:200px;font-weight:900;letter-spacing:-.05em;color:#fff;font-variant-numeric:tabular-nums;line-height:1}
#num small{display:block;margin-top:26px;font-size:34px;font-weight:700;letter-spacing:.5em;color:#7fb2ff;text-indent:.5em}
.glitch{text-shadow:-6px 0 rgba(255,40,80,.85),6px 0 rgba(0,220,255,.85),0 0 60px rgba(47,125,255,.9)}
#acha{position:absolute;left:0;right:0;top:820px;z-index:20;text-align:center;font-size:150px;font-weight:900;letter-spacing:-.04em;color:#fff;visibility:hidden}
#acha em{font-style:normal;color:#7fb2ff;text-shadow:0 0 50px rgba(47,125,255,.9)}
#fim{position:absolute;inset:0;z-index:40;background:#000;visibility:hidden}
#nota{position:absolute;left:60px;right:60px;bottom:200px;z-index:59;text-align:center;font-size:21px;font-weight:600;line-height:1.5;color:#8f9bb5;visibility:hidden}
`;

const body = `
<canvas id="cv" width="1080" height="1920"></canvas>
<div id="num"><b id="nb">0</b><small>INSTALAÇÕES</small></div>
<div id="acha">ELA <em>ACHA.</em></div>
<div id="fim"></div>
${comentaBlock('Quer saber qual é?', 'SKILL', 'dark', 470, 'Comenta')}
<div id="nota">find-skills, da Vercel · funciona no Claude Code · nº 1 do skills.sh, 4,5 mi de instalações em 25/11/2026<br>A Growlift não tem relação com a Anthropic nem com a Vercel · Seguir é opcional: vale pra todo mundo que comentar</div>
<div id="flash"></div>
<div id="vig"></div>
<div id="bars"></div>
<canvas id="grain" width="540" height="960"></canvas>
`;

const script = `
window.MOTION=2;
const L=(a,b,x)=>a+(b-a)*x;
const cv=$('cv'), g=cv.getContext('2d'), W=1080, H=1920;
const gr=$('grain'), gg=gr.getContext('2d');
// deterministic noise
function rnd(s){s=Math.sin(s*12.9898+78.233)*43758.5453;return s-Math.floor(s);}
function grain(t){
  const f=Math.floor(t*24), img=gg.createImageData(540,960), d=img.data;
  for(let i=0;i<d.length;i+=4){const v=rnd(i*.013+f*7.31)*255;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255;}
  gg.putImageData(img,0,0);
}
const shake=(t,a,amp)=>t>=a&&t<a+.35?[Math.sin(t*90)*amp*(1-(t-a)/.35),Math.cos(t*77)*amp*(1-(t-a)/.35)]:[0,0];

// ---- cena 1: ponto de luz que pulsa (batida de coração)
function dot(t){
  const beat=Math.max(Math.exp(-((t%0.9))*7), 0);
  const r=10+beat*16+eoS(clamp((t-1.4)/.6))*60;
  const grd=g.createRadialGradient(W/2,H/2,0,W/2,H/2,r*9);
  grd.addColorStop(0,'rgba(170,205,255,'+(.95)+')');grd.addColorStop(.12,'rgba(47,125,255,.7)');grd.addColorStop(1,'rgba(47,125,255,0)');
  g.fillStyle=grd;g.beginPath();g.arc(W/2,H/2,r*9,0,7);g.fill();
}

// ---- cenas 3: ícones que levam um X (terminal, site, imagem)
function icon(kind,t,a){
  const k=eoS(clamp((t-a)/.25)), cx=W/2, cy=H/2-40, s=1.15-.15*k;
  g.save();g.translate(cx,cy);g.scale(s,s);
  g.strokeStyle='rgba(127,178,255,.95)';g.lineWidth=10;g.shadowColor='#2f7dff';g.shadowBlur=40;g.lineJoin='round';g.lineCap='round';
  if(kind===0){ // terminal
    g.strokeRect(-260,-190,520,380);g.beginPath();g.moveTo(-180,-70);g.lineTo(-90,0);g.lineTo(-180,70);g.moveTo(-50,80);g.lineTo(120,80);g.stroke();
  }else if(kind===1){ // site
    g.strokeRect(-280,-200,560,400);g.beginPath();g.moveTo(-280,-120);g.lineTo(280,-120);g.stroke();
    g.fillStyle='rgba(127,178,255,.9)';[-245,-205,-165].forEach(x=>{g.beginPath();g.arc(x,-160,12,0,7);g.fill()});
    g.strokeRect(-220,-70,200,200);g.beginPath();g.moveTo(30,-50);g.lineTo(220,-50);g.moveTo(30,10);g.lineTo(220,10);g.moveTo(30,70);g.lineTo(160,70);g.stroke();
  }else{ // imagem
    g.strokeRect(-260,-200,520,400);g.beginPath();g.arc(130,-90,46,0,7);g.stroke();
    g.beginPath();g.moveTo(-230,160);g.lineTo(-70,-20);g.lineTo(40,100);g.lineTo(110,30);g.lineTo(230,160);g.stroke();
  }
  // X vermelho batendo 0.45 s depois
  const kx=eoS(clamp((t-a-.45)/.12));
  if(kx>0){g.strokeStyle='rgba(255,59,48,'+kx+')';g.shadowColor='#ff3b30';g.lineWidth=26;
    g.beginPath();g.moveTo(-300*kx,-300*kx);g.lineTo(300*kx,300*kx);g.moveTo(300*kx,-300*kx);g.lineTo(-300*kx,300*kx);g.stroke();}
  g.restore();
  // fatias de glitch logo depois do X
  if(t>a+.45&&t<a+.75){for(let i=0;i<7;i++){const y=rnd(i+Math.floor(t*30))*H, h=20+rnd(i*3+t)*70, dx=(rnd(i*7+Math.floor(t*30))-.5)*120;
    g.drawImage(cv,0,y,W,h,dx,y,W,h);}}
}

// ---- cenas 5 a 7: o labirinto de skills (corredor de paredes feitas de caixinhas)
const TILES=[];
for(let side=-1;side<=1;side+=2)for(let z=0;z<46;z++)for(let y=0;y<9;y++){
  TILES.push({x:side*3.2,y:(y-4)*1.05,z:z*1.1+2,seed:TILES.length,side});
}
for(let x=-2;x<=2;x++)for(let y=0;y<9;y++)TILES.push({x:x*1.1,y:(y-4)*1.05,z:52,seed:TILES.length,side:0});
const CHOSEN=TILES.findIndex(q=>q.side===0&&Math.round(q.x/1.1)===0&&Math.round(q.y/1.05+4)===4);
let CP=null;
function maze(t,camZ,scan,dimAll,chosenFly){
  const f=1100, cx=W/2, cy=H/2-60;
  const list=TILES.map(q=>({q,z:q.z-camZ})).filter(o=>o.z>0.4).sort((a,b)=>b.z-a.z);
  for(const {q,z} of list){
    const s=f/z, x=cx+q.x*s, y=cy+q.y*s, w=.92*s, h=.92*s;
    if(x<-w||x>W+w||y<-h||y>H+h)continue;
    const fog=Math.max(0,1-z/50);
    let on=.35+.65*(rnd(q.seed+Math.floor(t*6+q.seed))>.82?1:.3);
    if(scan!==null){const dx=Math.abs(q.z-scan);on*=dx<1.6?2.2:1;}
    let a=on*fog*(1-dimAll);
    if(q.seed===CHOSEN){a=Math.max(a,dimAll>0?1:a);}
    if(q.seed===CHOSEN)CP={x,y,w};
    if(q.seed===CHOSEN&&chosenFly>0)continue;
    if(a<.02)continue;
    g.fillStyle='rgba(8,22,52,'+(.75*fog)+')';g.fillRect(x-w/2,y-h/2,w,h);
    const hot=q.seed===CHOSEN&&dimAll>0;
    g.strokeStyle=hot?'rgba(190,220,255,'+a+')':'rgba(47,125,255,'+a+')';g.lineWidth=Math.max(1,s*.035);
    g.shadowColor=hot?'#9cc4ff':'#2f7dff';g.shadowBlur=hot?60:18*a;
    g.strokeRect(x-w/2,y-h/2,w,h);
    if(hot){const p=.5+.5*Math.sin(t*9);g.strokeStyle='rgba(160,200,255,'+(.5*p)+')';g.lineWidth=Math.max(2,s*.05);g.strokeRect(x-w*.7,y-h*.7,w*1.4,h*1.4);}
    g.shadowBlur=0;g.fillStyle=hot?'rgba(230,240,255,'+a+')':'rgba(127,178,255,'+(a*.8)+')';
    const k=q.seed%4;g.beginPath();
    if(k===0)g.arc(x,y,w*.16,0,7);else if(k===1)g.rect(x-w*.15,y-w*.15,w*.3,w*.3);else if(k===2){g.moveTo(x,y-w*.18);g.lineTo(x+w*.18,y+w*.14);g.lineTo(x-w*.18,y+w*.14);g.closePath();}else{g.rect(x-w*.2,y-w*.05,w*.4,w*.1);}
    g.fill();
  }
  g.shadowBlur=0;
}
// silhueta de costas
function person(t,scale,yy){
  g.save();g.translate(W/2,yy);g.scale(scale,scale);
  const path=new Path2D('M0,-262c29,0,52,23,52,52s-23,56-52,56s-52,-27-52,-56s23,-52,52,-52z M-60,-150c-48,8-78,30-86,74l-22,130c-3,17,9,26,24,22l24,-106l6,98l-8,232h54l18,-190l18,190h54l-8,-232l6,-98l24,106c15,4,27,-5,24,-22l-22,-130c-8,-44,-38,-66,-86,-74c-20,10-40,12-60,0z');
  g.shadowColor='rgba(80,150,255,.8)';g.shadowBlur=40;g.fillStyle='#01030a';g.fill(path);
  g.shadowBlur=0;g.strokeStyle='rgba(120,175,255,.55)';g.lineWidth=3;g.stroke(path);
  g.restore();
}

window.draw=(t)=>{
  g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.fillStyle='#000';g.fillRect(0,0,W,H);
  let sh=[0,0];
  ['num','acha'].forEach(id=>{$(id).style.visibility='hidden'});
  // 0-2 ponto que pulsa
  if(t<2.05){dot(t);}
  // 2-5 contador
  if(t>=2.05&&t<5.0){
    const k=clamp((t-2.05)/2.5), v=Math.round(4500000*(t<4.55?Math.pow(k,2.2):1));
    $('num').style.visibility='visible';$('nb').textContent=v.toLocaleString('pt-BR');
    const z=1+.25*(1-eoS(clamp((t-2.05)/.4)));
    sh=shake(t,4.55,26);
    $('nb').className=(t>4.55&&t<4.9)||rnd(Math.floor(t*20))>.86?'glitch':'';
    $('num').style.transform='translate('+sh[0]+'px,'+sh[1]+'px) scale('+(t>4.55?1+.04*Math.exp(-(t-4.55)*6):z)+')';
    const grd=g.createRadialGradient(W/2,H/2,0,W/2,H/2,900);grd.addColorStop(0,'rgba(47,125,255,'+(.25+.25*(t>4.55?1:k))+')');grd.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=grd;g.fillRect(0,0,W,H);
  }
  // 5-9 três cortes com X
  if(t>=5.0&&t<6.2)icon(0,t,5.0); else if(t>=6.2&&t<7.4)icon(1,t,6.2); else if(t>=7.4&&t<8.75)icon(2,t,7.4);
  // 8.75-9.6 "ELA ACHA."; 9.6-11 silêncio no preto
  if(t>=8.85&&t<9.7){$('acha').style.visibility='visible';const k=eoS(clamp((t-8.85)/.2));$('acha').style.transform='scale('+(1.12-.12*k)+')';$('acha').style.opacity=t>9.5?String(1-(t-9.5)/.2):String(k);}
  // 11-22 labirinto
  if(t>=11&&t<22.6){
    const camZ=(t-11)*1.5+(t>19.3?eioS(clamp((t-19.3)/2.5))*30:0);
    const scan=t>=17&&t<21.2?2+ (t-17)/4.2*52:null;
    const dimAll=t>=19.5?eoS(clamp((t-19.5)/1.6)):0;
    const fly=t>=21.9?1:0;
    const intro=eoS(clamp((t-11)/.8));
    g.globalAlpha=intro;maze(t,camZ,scan,dimAll,fly);g.globalAlpha=1;
    if(scan!==null){ // feixe
      const k=(t-17)/4.2, y=H*.2+k*H*.6;
      const lg=g.createLinearGradient(0,y-120,0,y+120);lg.addColorStop(0,'rgba(47,125,255,0)');lg.addColorStop(.5,'rgba(140,190,255,.35)');lg.addColorStop(1,'rgba(47,125,255,0)');
      g.fillStyle=lg;g.fillRect(0,y-120,W,240);
    }
    person(t,1.25,H-430);
  }
  // 21.9-22.6 a caixinha voa até o personagem
  if(t>=21.9&&t<22.6){
    const p0=CP||{x:W/2,y:H/2-60,w:120};const k=eioS(clamp((t-21.9)/.6)), x=L(p0.x,W/2,k), y=L(p0.y,H-690,k), w=L(p0.w,170,k);
    g.shadowColor='#bcd6ff';g.shadowBlur=80;g.strokeStyle='#e6f0ff';g.lineWidth=8;g.strokeRect(x-w/2,y-w/2,w,w);
    g.fillStyle='#e6f0ff';g.beginPath();g.moveTo(x,y-w*.18);g.lineTo(x+w*.18,y+w*.14);g.lineTo(x-w*.18,y+w*.14);g.closePath();g.fill();g.shadowBlur=0;
  }
  // 22.6-25 explosão de luz
  if(t>=22.6&&t<25.2){
    const k=(t-22.6);
    for(let i=0;i<160;i++){const a=rnd(i)*6.283, sp=200+rnd(i*3)*1400, d=sp*eoS(clamp(k/1.6)), x=W/2+Math.cos(a)*d, y=H-690+Math.sin(a)*d*.8;
      g.fillStyle='rgba(170,205,255,'+Math.max(0,1-k/2.2)+')';g.fillRect(x,y,6,6);}
    const grd=g.createRadialGradient(W/2,H-690,0,W/2,H-690,1200*eoS(clamp(k/.8)));grd.addColorStop(0,'rgba(200,225,255,'+Math.max(0,1-k/1.6)+')');grd.addColorStop(1,'rgba(47,125,255,0)');g.fillStyle=grd;g.fillRect(0,0,W,H);
    person(t,1.25,H-430);
    sh=shake(t,22.6,30);
  }
  $('flash').style.opacity=t>=22.6&&t<22.9?String(.9*(1-(t-22.6)/.3)):t>=4.55&&t<4.75?String(.45*(1-(t-4.55)/.2)):'0';
  cv.style.transform='translate('+sh[0]+'px,'+sh[1]+'px)';
  // 25-30 fim
  show('fim',t,25.0,undefined,{dy:0,fi:.4});
  if(t>=25)comenta(t,25.3,26.6,'SKILL');
  show('nota',t,26.2,undefined,{dy:0});
  grain(t);
};
`;

export const html = () => page({ css, body, script, captions: [[0.25,1.95,"Existe uma skill...","skill"],[2.0,5.0,"que foi instalada mais de 4,5 milhões de vezes.","4,5 milhões"],[5.05,6.45,"Ela não escreve código."],[6.5,7.4,"Não faz site."],[7.45,8.9,"Não cria imagem."],[11.4,13.2,"São milhares de skills...","milhares"],[13.25,14.8,"E você não sabe qual é a sua.","a sua"],[17.4,18.9,"Ela procura por você...","você"],[22.75,24.2,"...e acha a certa.","a certa"]] });

// Reel 37 (26/11): "13 anos de espera". Começa só sobre o GTA 6 (13 anos de espera, recordes, empresa que deu folga)
// e vira para o cliente: "pelo jogo o mundo espera; pelo seu negócio, ninguém espera". Diorama 3D próprio
// (diorama37.js: cidade de praia ao pôr do sol, fila de bonequinhos, escritório vazio) + celular e boneco em SVG.
// Nada do jogo: sem imagem, logo, fonte ou arte dele; o nome aparece só como notícia. Fatos: GTA V 2013, GTA 6 em
// 19/11/2026, recorde de pré-venda na PlayStation Store (Sony), empresa que deu folga (Folha PE).
// Tempos (T) provisórios: são ajustados pela transcrição da voz do Antônio (mix37.py).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { page, comentaBlock } from './base.mjs';
import { pessoa, MOOD } from './elenco.mjs';

export const DURATION = 35.97;
export const COVER = 4.2;
export const AUDIO = '../narracao-37-eleven.mp3';

// Momentos da fala (início de cada frase). Atualizados pela transcrição da voz.
export const T = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../tempos37.json'), 'utf8'));

const HERE = path.dirname(fileURLToPath(import.meta.url));
const bundle = () =>
  buildSync({ entryPoints: [path.join(HERE, 'diorama37.js')], bundle: true, format: 'iife', write: false, minify: true, logLevel: 'error', absWorkingDir: path.resolve(HERE, '../../../..') }).outputFiles[0].text;

const css = `
body{background:#120a24}
#gl{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:1}
#hud{position:absolute;inset:0;z-index:15;visibility:hidden;pointer-events:none}
#map{position:absolute;left:60px;top:230px;width:200px;height:200px;border-radius:50%;border:6px solid rgba(0,0,0,.65);background:radial-gradient(circle at 50% 50%,#3d6b5a 0 6%,#2b3a55 7% 100%);overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.5)}
#map i{position:absolute;left:50%;top:50%;width:0;height:0;border-left:16px solid transparent;border-right:16px solid transparent;border-bottom:30px solid #fff;transform:translate(-50%,-60%)}
#map b{position:absolute;height:14px;background:#6b6f8a;left:-20px;right:-20px}
#map u{position:absolute;width:20px;height:20px;border-radius:50%;background:#ffd36b;border:3px solid #000}
#money{position:absolute;right:60px;top:240px;font-size:64px;font-weight:900;color:#7dffa0;letter-spacing:.02em;text-shadow:3px 3px 0 #000,-2px -2px 0 #000;font-variant-numeric:tabular-nums}
#mission{position:absolute;left:60px;right:60px;top:1240px;text-align:center}
#mission small{display:block;font-size:30px;font-weight:900;letter-spacing:.25em;color:#ffd36b;text-shadow:2px 2px 0 #000}
#mission b{display:block;font-size:56px;font-weight:900;color:#fff;margin-top:8px;text-shadow:3px 3px 0 #000}
#vig{position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(110% 70% at 50% 48%,rgba(0,0,0,0) 50%,rgba(10,4,24,.75) 100%)}
.big{position:absolute;left:0;right:0;text-align:center;z-index:20;visibility:hidden;color:#fff;font-weight:900;letter-spacing:-.05em}
#n13{top:420px;font-size:520px;line-height:1;text-shadow:-10px 0 rgba(255,60,140,.85),10px 0 rgba(40,220,255,.85),0 20px 80px rgba(0,0,0,.6)}
#ano{top:300px;font-size:190px;font-variant-numeric:tabular-nums;text-shadow:0 10px 50px rgba(0,0,0,.55)}
#ano small{display:block;font-size:40px;letter-spacing:.3em;font-weight:800;color:#ffd0e6;margin-top:10px}
.stat{position:absolute;left:70px;right:70px;z-index:20;visibility:hidden;padding:30px 36px;border-radius:34px;background:rgba(20,8,40,.78);border:2px solid rgba(255,120,190,.5);box-shadow:0 30px 80px -30px #000;color:#fff}
.stat small{display:block;font-size:30px;font-weight:700;color:#ffb3d6;letter-spacing:.04em}
.stat b{display:block;font-size:76px;font-weight:900;letter-spacing:-.03em;line-height:1.05;margin-top:6px}
.stat i{font-style:normal;color:#ffd36b}
#s1{top:330px}#s2{top:600px}
#folga{position:absolute;left:70px;right:70px;top:330px;z-index:20;visibility:hidden;text-align:center}
#folga span{display:inline-block;padding:18px 34px;border-radius:999px;background:#ffd36b;color:#1a1030;font-size:46px;font-weight:900}
#black{position:absolute;inset:0;z-index:30;background:#000;visibility:hidden}
#pq{top:860px;font-size:110px;z-index:31}
#scene2{position:absolute;inset:0;z-index:25;visibility:hidden;background:radial-gradient(90% 60% at 50% 40%,#1b2a52,#070b18 75%)}
#phone{position:absolute;left:300px;top:420px;width:560px;height:1060px;border-radius:70px;border:14px solid #161a26;background:#0b141a;box-shadow:0 0 0 3px #2c3446,0 60px 120px -30px #000;overflow:hidden}
#phone .hd{height:150px;background:#1f2c34;display:flex;align-items:flex-end;padding:0 30px 24px;gap:18px;color:#e9edef}
#phone .hd i{width:62px;height:62px;border-radius:50%;background:#53bdeb;display:block}
#phone .hd b{font-size:30px}#phone .hd small{display:block;font-size:22px;color:#8696a0;font-weight:500}
.msg{position:absolute;left:28px;max-width:420px;padding:18px 22px;border-radius:22px 22px 22px 6px;background:#202c33;color:#e9edef;font-size:30px;line-height:1.3;visibility:hidden}
.msg small{display:block;text-align:right;font-size:20px;color:#8696a0;margin-top:6px}
#m1{top:240px}
#clock{position:absolute;right:28px;top:200px;z-index:2;padding:12px 22px;border-radius:999px;background:#ff3b30;color:#fff;font-size:30px;font-weight:900;font-variant-numeric:tabular-nums;visibility:hidden}
#seen{position:absolute;left:28px;right:28px;bottom:40px;text-align:center;font-size:26px;color:#8696a0;visibility:hidden}
#cli{position:absolute;left:-30px;top:980px;z-index:3}
#rival{position:absolute;left:40px;top:560px;width:250px;height:470px;border-radius:44px;border:10px solid #161a26;background:#0b141a;visibility:hidden;box-shadow:0 0 60px rgba(47,255,160,.45)}
#rival div{position:absolute;left:16px;right:16px;top:70px;padding:14px;border-radius:18px;background:#005c4b;color:#fff;font-size:22px;line-height:1.3}
#rival small{position:absolute;left:0;right:0;bottom:26px;text-align:center;color:#8ef0c4;font-size:22px;font-weight:800}
#tag{position:absolute;left:0;right:0;top:300px;text-align:center;z-index:26;visibility:hidden}
#tag span{display:inline-block;padding:14px 30px;border-radius:999px;background:rgba(0,0,0,.6);border:2px solid rgba(255,255,255,.2);color:#fff;font-size:40px;font-weight:900}
#split{position:absolute;inset:0;z-index:27;visibility:hidden;display:grid;grid-template-rows:1fr 1fr}
#split div{display:flex;align-items:flex-end;justify-content:center;padding-bottom:60px;font-size:64px;font-weight:900;color:#fff;letter-spacing:-.03em;text-shadow:0 8px 40px rgba(0,0,0,.8)}
#split .a{background:linear-gradient(180deg,rgba(255,79,139,.0),rgba(255,79,139,.35))}
#split .b{background:linear-gradient(180deg,rgba(7,11,24,.88),#070b18)}
#split .b em{font-style:normal;color:#ff5a5a}
#dim{position:absolute;inset:0;z-index:44;background:rgba(8,6,20,.94);visibility:hidden}
#nota{position:absolute;left:60px;right:60px;bottom:200px;z-index:47;text-align:center;font-size:21px;font-weight:600;color:#9a90b5;visibility:hidden}
#cap{top:1480px!important}
#gta{top:640px;font-size:230px;line-height:1;font-style:italic;text-shadow:0 0 70px rgba(255,79,139,.9),0 12px 50px rgba(0,0,0,.6)}
#gta small{display:block;font-size:44px;font-style:normal;letter-spacing:.3em;color:#ffd0e6;margin-top:16px}
#att{top:420px;font-size:150px;line-height:.95;text-shadow:0 0 60px rgba(255,79,139,.8),0 10px 40px rgba(0,0,0,.6)}
#att span{font-size:60px;letter-spacing:0;color:#ffd0e6}
#s1{top:960px}
#route{position:absolute;left:50%;top:22%;width:6px;height:40%;background:#ffd36b;transform:translateX(-50%) rotate(28deg);transform-origin:top;box-shadow:0 0 12px #ffd36b;opacity:0}
#phone .me{left:auto;right:28px;background:#005c4b;border-radius:22px 22px 6px 22px}
#r1{top:400px}#m2{top:600px}#r2{top:680px}#m3{top:820px}#r3{top:900px}#m4{top:240px}
.call{position:absolute;left:28px;padding:14px 20px;border-radius:18px;background:#3a1d1d;color:#ffb3b3;font-size:26px;font-weight:700;visibility:hidden}
.card{position:absolute;left:28px;right:28px;padding:16px 20px;border-radius:18px;background:#2a2412;color:#ffd36b;font-size:24px;font-weight:700;visibility:hidden}
#ttl{position:absolute;left:0;right:0;top:300px;text-align:center;z-index:5}
#ttl span{display:inline-block;padding:14px 30px;border-radius:999px;background:rgba(0,0,0,.6);border:2px solid rgba(255,255,255,.2);color:#fff;font-size:42px;font-weight:900}
#toast{position:absolute;left:50%;top:1330px;z-index:28;transform:translateX(-50%);text-align:center;visibility:hidden;padding:18px 40px;border-radius:20px;background:rgba(0,0,0,.78);border:3px solid #ffd36b}
#toast small{display:block;font-size:26px;font-weight:900;letter-spacing:.25em;color:#ffd36b}
#toast b{display:block;font-size:46px;font-weight:900;color:#fff;margin-top:4px;white-space:nowrap}
`;

const body = `
<canvas id="gl" width="1080" height="1920"></canvas>
<div id="vig"></div>
<div id="hud"><div id="map"><b style="top:40%"></b><b style="top:70%;transform:rotate(30deg)"></b><u style="left:65%;top:22%"></u><i></i><s id="route"></s></div><div id="money">$<span id="mon">0</span></div>
  <div id="mission"><small id="msS">NOVA MISSÃO</small><b id="msB">Esperar 13 anos</b></div></div>
<div id="n13" class="big">13</div>
<div id="gta" class="big">GTA 6<small>19/11/2026</small></div>
<div id="ano" class="big"><span id="anoN">2013</span><small>ESPERANDO…</small></div>
<div id="s1" class="stat"><small>PLAYSTATION STORE</small><b>Maior <i>pré-venda</i> da história</b></div>
<div id="att" class="big">ATENÇÃO<br><span>do mundo inteiro</span></div>
<div id="black"></div>
<div id="pq" class="big">Sabe por quê?</div>
<div id="scene2">
  <div id="phone"><div class="hd"><i></i><div><b>Cliente</b><small id="hdS">online</small></div></div>
    <div id="m1" class="msg">Quanto fica o orçamento? Preciso pra amanhã<small>23:04</small></div>
    <div id="r1" class="msg me">Oi! Fica R$ 180 com a visita. Tenho amanhã às 9h, pode ser?<small>23:04 ✓✓</small></div>
    <div id="m2" class="call">📞 Chamada perdida · 14:32</div>
    <div id="r2" class="msg me">Vi que você ligou! Como posso ajudar?<small>14:33 ✓✓</small></div>
    <div id="m3" class="card">Orçamento enviado · sem resposta há 2 dias</div>
    <div id="r3" class="msg me">Conseguiu ver o orçamento? Ficou alguma dúvida?<small>09:00 ✓✓</small></div>
    <div id="m4" class="msg">Fechado! Pode vir amanhã 👍<small>09:12</small></div>
  </div>
  <div id="cli">${pessoa('cl', { skin: '#d9a07a', hair: '#2b2118', hairStyle: 'curto', shirt: '#ff7a3d', size: 380 })}</div>
  <div id="ttl"><span id="ttlT"></span></div>
</div>
<div id="toast"><small>MISSÃO COMPLETA</small><b id="toastT">Responder o cliente ✓</b></div>
<div id="dim"></div>
${comentaBlock('Quer prender a atenção do seu cliente?', 'RESPOSTA', 'dark', 440, 'Segue e comenta')}
<div id="nota">GTA é marca da Rockstar Games / Take-Two. A Growlift não tem relação com elas. Cenas ilustrativas, feitas pela Growlift; conversas fictícias.<br>Seguir é opcional: o presente vale pra todo mundo que comentar.</div>
`;

const script = `
window.MOTION=2;
${MOOD}
const T=${JSON.stringify(T)};
const L=(a,b,x)=>a+(b-a)*x;
const C=(p,l,f)=>({pos:p,look:l,fov:f});
const drive=(t,t0)=>{const cx=-40+(t-t0)*9;return {cam:C([cx-12,2.4,9.6],[cx+10,1.6,6.6],44),car:cx+1.5};};
function shot(t){
  const k=(a,b)=>eioS(clamp((t-a)/(b-a)));
  if(t<T.lancou)return drive(t,0);
  if(t<T.porque){const x=k(T.lancou,T.porque);return {cam:C([L(10,-22,x),L(9,7,x),L(18,28,x)],[3,1.5,-3],38),car:200};}
  if(t<T.cliente)return drive(t,T.perdido-1);
  if(t<T.prende)return {cam:C([-20,4,22],[2,1.5,-3],34),car:200};
  return drive(t,T.prende-2);
}
window.draw=(t)=>{
  const sh=shot(t);
  window.cena37(t,{carX:sh.car,cam:sh.cam,queueWave:1});
  // HUD de jogo: na abertura, na parte "no jogo você nunca fica perdido" e no fim
  const hudOn=(t<T.lancou)||(t>=T.perdido&&t<T.cliente)||(t>=T.prende&&t<T.segue);
  $('hud').style.visibility=hudOn?'visible':'hidden';
  $('mon').textContent=Math.floor(t*4300).toLocaleString('en-US');
  $('msS').textContent=t<T.perdido?'NOVA MISSÃO':t<T.prende?'PRÓXIMO PASSO':'MISSÃO COMPLETA';
  $('msB').textContent=t<T.perdido?'Esperar 13 anos':t<T.prende?'Siga o mapa até o cliente':'+1 cliente fiel';
  $('mission').style.opacity=(t<T.perdido)||(t>=T.missao)?1:0;
  const mapK=t>=T.mapa&&t<T.cliente?eoS(clamp((t-T.mapa)/.4)):0;
  $('map').style.transform='scale('+(1+mapK*.35)+')';$("map").style.transformOrigin="left top";
  $('route').style.opacity=String(mapK);
  // abertura
  show('n13',t,T.treze+0.15,T.esperou+0.3,{sc:.06,dy:0});
  show('ano',t,T.esperou+0.3,T.gta,{dy:20});
  $('anoN').textContent=String(2013+Math.min(13,Math.floor(clamp((t-T.esperou-0.3)/(T.gta-T.esperou-0.5))*13)));
  show('gta',t,T.gta,T.lancou,{sc:.08,dy:0});
  show('att',t,T.lancou+.2,T.porque,{sc:.05,dy:0});
  show('s1',t,T.lancou+1.2,T.porque,{dy:30});
  show('black',t,T.porque,T.perdido,{dy:0,fi:.15});
  show('pq',t,T.porque+.1,T.perdido,{dy:0,sc:.05});
  // celular
  show('scene2',t,T.cliente,T.prende,{dy:0,fi:.3});
  $('ttlT').textContent=t<T.msg?'Atenção, no tempo certo':t<T.liga?'Mandou mensagem?':t<T.orc?'Ligou e ninguém atendeu?':'Pediu orçamento e sumiu?';
  const sec=t<T.liga?1:t<T.orc?2:3;
  ['m1','r1'].forEach(id=>$(id).style.display=sec===1?'':'none');
  ['m2','r2'].forEach(id=>$(id).style.display=sec===2?'':'none');
  ['m3','r3','m4'].forEach(id=>$(id).style.display=sec===3?'':'none');
  show('m1',t,T.cliente+.5,undefined,{dy:20});
  show('r1',t,T.msg+.8,undefined,{dy:20});
  show('m2',t,T.liga+.1,undefined,{dy:20});
  show('r2',t,T.liga+1.2,undefined,{dy:20});
  show('m3',t,T.orc+.1,undefined,{dy:20});
  show('r3',t,T.orc+1.0,undefined,{dy:20});
  show('m4',t,T.orc+2.0,undefined,{dy:20});
  mood('cl',(sec===1&&t<T.msg+.8)?'sad':'happy');
  // avisos de missão completa
  const tw=[[T.msg+1.0,T.liga,'Responder o cliente ✓'],[T.liga+1.4,T.orc,'Retornar a ligação ✓'],[T.orc+2.2,T.prende,'Cliente fechou ✓']].find(w=>t>=w[0]&&t<w[1]);
  if(tw){$('toastT').textContent=tw[2];show('toast',t,tw[0],tw[1],{dy:0,sc:.06,base:'translateX(-50%)'});}else $('toast').style.visibility='hidden';
  // final
  show('dim',t,T.segue-.1,undefined,{dy:0,fi:.4});
  if(t>=T.segue-.1)comenta(t,T.segue,T.segue+1.4,'RESPOSTA');
  show('nota',t,T.segue+1.0,undefined,{dy:0});
};
`;

const CAPS = [[0.15, 1.26, "Treze anos.", "Treze"], [1.31, 2.8, "Foi o tempo que o mundo esperou", "esperou"], [3.8, 7.02, "E quando lançou, prendeu a atenção do mundo inteiro.", "atenção"], [8.26, 10.68, "Porque no jogo você nunca fica perdido.", "perdido."], [10.73, 12.07, "O mapa mostra o caminho.", "caminho."], [12.12, 14.24, "A missão diz o próximo passo.", "próximo passo."], [14.29, 15.61, "Tudo responde na hora.", "na hora."], [15.71, 19.89, "O seu cliente quer a mesma coisa: atenção, no tempo certo.", "no tempo certo."], [19.99, 22.17, "Mandou mensagem? Resposta na hora.", "na hora."], [22.27, 25.62, "Ligou e ninguém atendeu? Retorno no WhatsApp.", "WhatsApp."], [25.72, 28.19, "Pediu orçamento e sumiu? Alguém lembra dele.", "lembra"], [28.29, 30.97, "Quem dá atenção no tempo certo, prende o cliente.", "prende o cliente."]];
export const html = (caps = CAPS) => {
  const p = page({ css, body, script, captions: caps, brandColor: '#f0e6ff' });
  const b = bundle();
  return p.replace('<script>', () => `<script>${b}</script><script>`);
};

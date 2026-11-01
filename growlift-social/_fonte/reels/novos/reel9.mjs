// Reel 9 (estilo história, 01/11): "O lanche é bom. O site, nem tanto." Seu Toninho's burger is great; on the phone his
// place shows an old, crooked site with no photo; people who don't know him judge by what they see; a site with the face
// of the business (concept project, fictitious name). Fictional, no outcome promised. Timed to narracao-9-eleven.mp3.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page, person, food, svgIcon, ICON, comentaBlock } from './base.mjs';
import { CSS, BG, RED, phone } from './estilo.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const img = (f) => pathToFileURL(path.resolve(HERE, '../../assets/hd', f)).href;

export const DURATION = 27;
export const COVER = 1.2;

const CAPS = [
  [0.0, 2.4, 'O lanche do seu Toninho é caprichado', 'caprichado'],
  [2.87, 3.7, 'pão na chapa', 'pão na chapa'],
  [3.9, 4.95, 'queijo derretendo', 'queijo'],
  [5.43, 7.75, 'Mas quando alguém procura a lanchonete no celular…', 'celular'],
  [8.12, 9.75, 'aparece um site velho', 'velho'],
  [10.12, 10.6, 'torto', 'torto'],
  [10.76, 12.05, 'sem foto do lanche', 'sem foto'],
  [12.53, 14.7, 'E quem não conhece julga pelo que vê', 'julga pelo que vê'],
  [15.11, 19.85, 'Um site com a cara do negócio mostra o capricho antes da primeira mordida', 'antes da primeira mordida'],
  [20.22, 21.75, 'Sua marca merece mais', 'merece mais'],
];

const oldSite = `
  <div id="old" style="position:absolute;inset:0;background:#ffff99;font-family:'Times New Roman',serif;color:#0000cc;padding:30px 22px">
    <div id="o1" style="font-size:40px;font-weight:700;text-align:center;color:#cc0000;text-decoration:underline">Bem-vindo!!!</div>
    <div id="o2" style="margin-top:18px;font-size:22px;text-align:center">Lanchonete do Toninho - desde sempre</div>
    <div id="o3" style="margin:22px auto 0;width:300px;height:200px;border:3px dashed #999;display:grid;place-items:center;color:#999;font-size:24px;background:#fff">[ imagem ]</div>
    <div id="o4" style="margin-top:22px;font-size:22px;line-height:1.5"><u>Clique aqui</u> para o cardápio<br><u>Contato</u> | <u>Fotos</u> | <u>Links</u></div>
    <div id="o5" style="margin-top:20px;padding:10px;background:#ff9900;color:#000;font-size:20px;text-align:center">Site em construção</div>
    <div style="margin-top:16px;font-size:16px;color:#555;text-align:center">Atualizado em 2012</div>
  </div>`;

const body = `
${BG}
<div class="disc">História fictícia · projeto conceito, nome fictício.<br>Não garantimos clientes nem posição no Google.</div>

<div id="hook" class="hook">O lanche é bom.<br><span style="color:${RED}">O site… nem tanto.</span></div>
<div id="toni" class="abs" style="left:110px;top:660px">${person('pt', RED, { size: 380, hair: '#9a9a9a' })}</div>
<div id="tName" class="chip" style="left:170px;top:1080px">Seu Toninho</div>
<div id="burger" class="abs" style="left:600px;top:660px;border-radius:36px;overflow:hidden;box-shadow:0 40px 90px -30px rgba(255,160,60,.7)">${food('burger', 340)}</div>
<div id="c1" class="chip" style="left:600px;top:1030px;border-color:#ffc94d">pão na chapa</div>
<div id="c2" class="chip" style="left:600px;top:1110px;border-color:#ffc94d">queijo derretendo</div>

${phone('ph', { left: 300, top: 420, w: 480, h: 820, search: false, inner: oldSite })}
<div id="tg1" class="chip" style="left:60px;top:520px;color:${RED};border-color:${RED}">velho</div>
<div id="tg2" class="chip" style="left:810px;top:700px;color:${RED};border-color:${RED}">torto</div>
<div id="tg3" class="chip" style="left:60px;top:880px;color:${RED};border-color:${RED}">sem foto</div>

<div id="judge" class="big" style="top:560px;font-size:100px">Quem não conhece<br><span style="color:#8db8ff">julga pelo que vê.</span></div>

<div id="win" class="abs" style="left:60px;right:60px;top:430px;height:640px;border-radius:30px;overflow:hidden;background:#0f1520;border:1px solid rgba(255,255,255,.12);box-shadow:0 60px 120px -50px rgba(8,101,254,.7)">
  <div style="height:58px;display:flex;align-items:center;gap:12px;padding:0 24px;border-bottom:1px solid rgba(255,255,255,.08)"><i style="width:14px;height:14px;border-radius:50%;background:#2a3344;display:inline-block"></i><i style="width:14px;height:14px;border-radius:50%;background:#2a3344;display:inline-block"></i><i style="width:14px;height:14px;border-radius:50%;background:#2a3344;display:inline-block"></i><span style="margin-left:16px;font-size:22px;color:#8790a6;background:#151c29;border-radius:999px;padding:6px 18px">seunegocio.com.br</span></div>
  <div style="position:absolute;inset:58px 0 0 0">${oldSite.replace('id="old"', 'id="old2"').replace(/id="o\d"/g, '')}</div>
  <img id="newS" src="${img('burger.png')}" style="position:absolute;inset:58px 0 0 0;width:100%;height:calc(100% - 58px);object-fit:cover;object-position:top">
</div>
<div id="antes" class="chip" style="left:90px;top:1100px;color:${RED};border-color:${RED}">Antes</div>
<div id="depois" class="chip" style="left:90px;top:1100px;color:#8db8ff;border-color:#4d8dff">Com a cara do negócio</div>
<div id="tagN" class="tag" style="left:620px;top:1110px">Projeto conceito · nome fictício</div>

<div id="merece" class="big" style="top:600px;font-size:120px">Sua marca<br><span style="color:#4d8dff">merece mais.</span></div>

${comentaBlock('Quer ver como ficaria a sua?', 'SITE')}
`;

const script = `
window.draw=(t)=>{
  show('hook',t,0,5.4,{dy:0,fi:.01});
  show('toni',t,0.1,5.4,{dy:80}); show('tName',t,0.6,5.4,{pop:true,sc:.4});
  show('burger',t,0.4,5.4,{pop:true,sc:.3,dy:0}); if(t<5.4) $('burger').style.transform+=' rotate('+(3*Math.sin(t*2))+'deg)';
  show('c1',t,2.87,5.4,{pop:true,sc:.4}); show('c2',t,3.9,5.4,{pop:true,sc:.4});
  // the old site
  show('ph',t,5.45,12.5,{dy:120,fi:.5});
  const k=eo((t-10.12)/.5); ['o1','o3','o4','o5'].forEach((id,i)=>{$(id).style.transform='rotate('+(k*[-4,6,-3,5][i])+'deg) translateX('+(k*[18,-14,10,-20][i])+'px)';});
  show('tg1',t,8.12,12.5,{pop:true,sc:.4}); show('tg2',t,10.12,12.5,{pop:true,sc:.4}); show('tg3',t,10.76,12.5,{pop:true,sc:.4});
  // people judge by what they see
  show('judge',t,12.53,15.05,{pop:true,sc:.3,dy:0});
  // with the face of the business
  show('win',t,15.1,20.15,{dy:60,fi:.45});
  const w=eo((t-16.6)/.9); $('newS').style.clipPath='inset(0 '+((1-w)*100)+'% 0 0)';
  show('antes',t,15.3,16.7,{pop:true,sc:.4,fo:.15}); show('depois',t,16.9,20.15,{pop:true,sc:.4}); show('tagN',t,17.2,20.15,{dy:10});
  show('merece',t,20.2,22.2,{pop:true,sc:.3,dy:0});
  comenta(t,22.2,24.26,'SITE');
};
`;

export const html = () => page({ css: CSS, body, script, captions: CAPS });

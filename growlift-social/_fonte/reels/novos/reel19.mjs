// Reel 19 · Casa Cheia, ep. 3 (05/11): "Ela vem toda sexta". A dona Cida para de vir e ninguém percebe; a Mel explica
// CRM como a memória do restaurante, com permissão de cada cliente e mensagem só para quem aceitou (com SAIR).
// Restaurante e pessoas inventados. Timed to narracao-19-eleven.mp3.
import { page, comentaBlock } from './base.mjs';
import { CSS, BG, RED, GREEN, phone } from './estilo.mjs';
import { pessoa, ELENCO, MOOD, selo, nome } from './elenco.mjs';

export const DURATION = 27.8;
export const COVER = 2.6;

const CAPS = [
  [0, 0.85, 'Toda sexta', 'sexta'],
  [1.13, 4.72, 'mesa 4, frango com quiabo', 'frango com quiabo'],
  [5.17, 6.91, 'Um dia, ela para de vir', 'para de vir'],
  [7.27, 8.46, 'E ninguém percebe', 'ninguém'],
  [8.96, 9.83, 'A Mel explica', 'Mel'],
  [10.18, 12.59, 'CRM: memória da casa', 'CRM'],
  [12.91, 15.44, 'Quem veio e do que gosta', 'do que gosta'],
  [15.59, 18.51, 'Com permissão do cliente', 'permissão'],
  [18.93, 21.52, '“Sentimos sua falta”', 'Sentimos sua falta'],
  [21.74, 23.32, 'só pra quem aceitou receber', 'aceitou'],
];

const cell = (i) => `<div id="w${i}" style="flex:1;height:120px;border-radius:22px;background:#0f1520;border:2px solid #2a3446;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px"><b style="font-size:24px;color:#8790a6;letter-spacing:.1em">SEX</b><span id="w${i}m" style="font-size:44px;font-weight:900"></span></div>`;
const linha = (id, k, v) => `<div id="${id}" style="display:flex;gap:16px;padding:16px 0;border-top:1px solid rgba(255,255,255,.08)"><span style="width:250px;font-size:30px;font-weight:700;color:#8790a6">${k}</span><span style="flex:1;font-size:32px;font-weight:800">${v}</span></div>`;
const chat = `<div style="height:100%;background:#0b141a;padding:54px 18px 0;color:#e9edef">
  <div style="font-size:26px;font-weight:800;color:#8db8ff;margin-bottom:18px">Panela da Rosa → Dona Cida</div>
  <div id="msg" style="margin-left:auto;max-width:92%;padding:18px 22px;border-radius:22px 22px 6px 22px;background:#005c4b;font-size:28px;line-height:1.4">Oi, dona Cida! Sentimos sua falta por aqui. Sexta tem frango com quiabo.<br><span style="color:#b6e3d4;font-size:24px">Para não receber mais, responda SAIR.</span></div>
</div>`;
const pessoaLista = (id, nomeP, ok) => `<div id="${id}" style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-radius:20px;background:${ok ? 'rgba(34,197,94,.14)' : '#0f1520'};border:2px solid ${ok ? GREEN : '#2a3446'};margin-top:14px"><span style="font-size:30px;font-weight:800;color:${ok ? '#f3f5f9' : '#8790a6'}">${nomeP}</span><span style="font-size:26px;font-weight:800;color:${ok ? GREEN : '#8790a6'}">${ok ? 'aceitou ✓' : 'não aceitou'}</span></div>`;

const body = `
${BG}
${selo(3, 'CRM')}
<div id="hook" class="hook">Ela vem<br><span style="color:#ffb37a">toda sexta.</span></div>
<div id="weeks" class="abs" style="left:90px;right:90px;top:620px;display:flex;gap:14px">${[0, 1, 2, 3, 4, 5].map(cell).join('')}</div>
<div id="cida" class="abs" style="left:80px;top:800px">${pessoa('pc', { ...ELENCO.cida, size: 320 })}</div>
${nome('cName', 'Dona Cida', 120, 1190, '#7a2b4f')}
<div id="chair" class="abs" style="left:120px;top:900px;opacity:0"><svg width="240" height="300" viewBox="0 0 120 150"><rect x="20" y="10" width="80" height="70" rx="12" fill="#2a3446"/><rect x="12" y="78" width="96" height="16" rx="6" fill="#3b4558"/><rect x="18" y="94" width="10" height="52" fill="#2a3446"/><rect x="92" y="94" width="10" height="52" fill="#2a3446"/></svg></div>
<div id="mesa4" class="chip" style="left:430px;top:1130px">MESA 4</div>
<div id="bub" class="bubble" style="left:440px;top:830px;white-space:normal;width:520px;line-height:1.3">Frango com quiabo, por favor!</div>
<div id="busy" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="abs" style="left:470px;top:820px">${pessoa('pr', { ...ELENCO.rosa, size: 290 })}</div>
  <div class="abs" style="left:740px;top:840px">${pessoa('pb', { ...ELENCO.beto, size: 270 })}</div>
  <div id="corre" class="chip" style="left:560px;top:760px;color:#ffb37a;border-color:#ffb37a">Correria!</div>
</div>
<div id="crm" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="big" style="top:420px;font-size:170px;color:#4d8dff">CRM</div>
  <div class="big" style="top:640px;font-size:56px">a memória<br>do restaurante</div>
  <div class="big" style="top:800px;font-size:28px;font-weight:600;color:#8790a6">Customer Relationship Management</div>
  <div class="abs" style="left:380px;top:880px">${pessoa('pm', { ...ELENCO.mel, size: 300 })}</div>
  ${nome('mName', 'Mel', 470, 1250, '#3b2a8a')}
</div>
<div id="ficha" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div id="ghost2" class="card" style="left:150px;top:470px;width:820px;height:600px;opacity:.35;transform:rotate(-4deg)"></div>
  <div id="ghost1" class="card" style="left:130px;top:460px;width:820px;height:600px;opacity:.6;transform:rotate(3deg)"></div>
  <div class="card" style="left:110px;top:440px;width:860px;padding:34px 40px">
    <div style="display:flex;align-items:center;gap:22px;margin-bottom:12px"><div style="width:96px;height:96px;border-radius:50%;background:#e86a9a;display:grid;place-items:center;font-size:44px;font-weight:900">C</div><div><div style="font-size:44px;font-weight:900">Dona Cida</div><div style="font-size:26px;color:#8790a6;font-weight:700">cliente da casa</div></div></div>
    ${linha('f1', 'Vem', 'toda sexta, no jantar')}
    ${linha('f2', 'Última visita', 'há 3 semanas')}
    ${linha('f3', 'Gosta de', 'frango com quiabo · mesa 4')}
    <div id="f4" style="margin-top:18px;display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-radius:20px;background:rgba(34,197,94,.14);border:2px solid ${GREEN}"><span style="font-size:30px;font-weight:800">Aceitou receber mensagens</span><span style="font-size:34px;font-weight:900;color:${GREEN}">✓</span></div>
  </div>
  <div id="lista" class="chip" style="left:720px;top:400px;color:#8db8ff;border-color:#4d8dff">numa lista só</div>
</div>
<div id="envio" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  ${phone('ph', { left: 70, top: 440, w: 520, h: 800, search: false, inner: chat })}
  <div id="filtro" class="abs" style="left:620px;top:560px;width:400px">
    <div style="font-size:26px;font-weight:900;letter-spacing:.1em;color:#8db8ff">VAI PARA</div>
    ${pessoaLista('l1', 'Dona Cida', true)}
    ${pessoaLista('l2', 'Seu Jorge', false)}
    ${pessoaLista('l3', 'Lia', true)}
  </div>
</div>
${comentaBlock('Quer um modelo dessa mensagem?', 'CLIENTE')}
`;

const script = `
${MOOD}
window.draw=(t)=>{
  show('hook',t,0,5.1,{dy:0,fi:.01});
  show('weeks',t,0.1,8.9,{dy:30});
  for(let i=0;i<6;i++){const a=0.4+i*0.45, gone=i>=4; const m=$('w'+i+'m'); const on=gone?t>5.9+(i-4)*.4:t>a;
    m.textContent=on?(gone?'✗':'✓'):''; m.style.color=gone?'${RED}':'${GREEN}';
    $('w'+i).style.borderColor=on?(gone?'${RED}':'${GREEN}'):'#2a3446';}
  const cida=show('cida',t,0.2,5.9,{dy:60}); show('cName',t,0.5,5.9,{pop:true,sc:.4});
  $('chair').style.opacity=t>=5.9&&t<8.9?String(Math.min(1,(t-5.9)/.4)):'0';
  show('mesa4',t,0.6,8.9,{pop:true,sc:.4});
  show('bub',t,1.4,4.9,{pop:true,sc:.3,dy:0}); talk('pc',t,1.4,4.7); if(t>4.7)mood('pc','happy'); blink('pc',t);
  show('busy',t,7.27,8.9,{dy:40}); show('corre',t,7.5,8.9,{pop:true,sc:.4}); mood('pr','happy'); mood('pb','o'); blink('pr',t);
  show('crm',t,8.95,12.85,{dy:30}); talk('pm',t,8.95,9.85); if(t>9.85)mood('pm','happy'); blink('pm',t);
  show('ficha',t,12.9,18.9,{dy:40});
  show('f1',t,12.91,18.9,{dy:16}); show('f2',t,13.73,18.9,{dy:16}); show('f3',t,14.6,18.9,{dy:16});
  show('ghost1',t,15.6,18.9,{dy:0,base:'rotate(3deg)'}); show('ghost2',t,15.8,18.9,{dy:0,base:'rotate(-4deg)'});
  show('lista',t,15.6,18.9,{pop:true,sc:.4});
  show('f4',t,16.72,18.9,{pop:true,sc:.3,dy:0});
  show('envio',t,18.93,23.7,{dy:40}); show('msg',t,19.3,23.7,{pop:true,sc:.2,dy:20});
  show('filtro',t,21.74,23.7,{dy:30});
  comenta(t,23.72,25.39,'CLIENTE');
};
`;

export const html = () => page({ css: CSS, body, script, captions: CAPS });

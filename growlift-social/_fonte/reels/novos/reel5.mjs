// Reel 5 (estilo história, 01/11): "Aberto no Google, fechado na porta". Friday 10 pm, Carlos looks for a pizzeria;
// the profile says open until 11; the door is shut; he goes elsewhere and the owner never knows. Then the basics of the
// Google Business Profile. Fictional, no outcome promised. Timed to narracao-5-eleven.mp3.
import { page, person, store, svgIcon, ICON, comentaBlock } from './base.mjs';

export const DURATION = 29.5;
export const COVER = 1.2;

const CAPS = [
  [0.0, 1.65, 'Sexta, dez da noite', 'dez da noite'],
  [2.05, 4.45, 'O Carlos procura uma pizzaria no celular', 'pizzaria'],
  [4.99, 5.95, 'O Google diz:', 'Google'],
  [6.09, 7.5, 'aberto até as onze', 'aberto'],
  [8.02, 9.3, 'Ele chega com a família…', 'família'],
  [9.7, 11.0, 'e a porta está fechada', 'fechada'],
  [11.49, 14.5, 'Ele vai pra outro lugar, e o dono nem fica sabendo', 'nem fica sabendo'],
  [14.93, 17.2, 'Horário certo, inclusive no feriado', 'Horário certo'],
  [17.4, 18.35, 'fotos reais', 'fotos reais'],
  [18.55, 20.3, 'o nome igual ao da fachada', 'nome'],
  [20.62, 22.4, 'parece detalhe…', 'detalhe'],
  [22.4, 24.5, 'mas é o que o cliente vê antes de sair de casa', 'antes de sair de casa'],
];

const RED = '#ff6b5b';
const GREEN = '#22c55e';

const css = `
body{background:#06080d;color:#f3f5f9}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.08) 1.6px,transparent 1.6px);background-size:44px 44px}
.glowB{position:absolute;width:1300px;height:1300px;border-radius:50%;background:radial-gradient(closest-side,rgba(8,101,254,.28),transparent 70%)}
.glowR{position:absolute;width:1100px;height:1100px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,107,91,.20),transparent 70%)}
.pill{position:absolute;left:50%;transform:translateX(-50%);display:inline-flex;align-items:center;gap:12px;padding:14px 28px;border-radius:999px;background:#0f1520;border:1px solid rgba(255,255,255,.12);font-size:28px;font-weight:700;white-space:nowrap}
.pill i{width:12px;height:12px;border-radius:50%;background:#0865fe;display:inline-block}
.chip{position:absolute;padding:14px 26px;border-radius:999px;font-size:32px;font-weight:800;background:#0f1520;border:1px solid rgba(255,255,255,.14);white-space:nowrap}
.card{position:absolute;background:#0f1520;border:1px solid rgba(255,255,255,.10);border-radius:36px}
.bubble{position:absolute;background:#f3f5f9;color:#121826;font-weight:800;font-size:34px;padding:20px 30px;border-radius:28px;white-space:nowrap}
.bubble:after{content:"";position:absolute;left:40px;bottom:-18px;border:12px solid transparent;border-top:18px solid #f3f5f9}
.hook{position:absolute;left:60px;right:60px;top:385px;text-align:center;font-weight:900;letter-spacing:-.04em;line-height:1.02;font-size:88px}
.big{position:absolute;left:60px;right:60px;text-align:center;font-weight:900;letter-spacing:-.04em;line-height:1.04}
.disc{position:absolute;left:70px;right:70px;top:250px;text-align:center;font-size:30px;font-weight:700;color:#c6cede;z-index:45;line-height:1.3}
.row{display:flex;align-items:center;gap:22px;padding:24px 0;border-top:1px solid rgba(255,255,255,.08);font-size:40px;font-weight:800}
.row .ok{flex:none;width:64px;height:64px;border-radius:50%;background:${GREEN};display:grid;place-items:center}
`;

const pizza = (bg) => `<svg width="104" height="104" viewBox="0 0 120 120"><rect width="120" height="120" rx="18" fill="${bg}"/><circle cx="60" cy="62" r="40" fill="#e8a54b"/><circle cx="60" cy="62" r="33" fill="#e8483b"/><circle cx="60" cy="62" r="30" fill="#ffd27a" opacity=".85"/><circle cx="48" cy="52" r="6" fill="#b3261e"/><circle cx="70" cy="56" r="6" fill="#b3261e"/><circle cx="58" cy="74" r="6" fill="#b3261e"/><circle cx="74" cy="74" r="3" fill="#4dbb5c"/><circle cx="46" cy="68" r="3" fill="#4dbb5c"/></svg>`;
const moon = `<svg width="130" height="130" viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" fill="#ffd27a"/></svg>`;

const body = `
<div class="dots"></div>
<div class="glowB" style="left:-560px;top:380px"></div>
<div class="glowR" style="right:-520px;top:200px"></div>
<div class="disc">História fictícia. Tela ilustrativa, não é do Google.<br>Não garantimos clientes nem posição no Google.</div>

<!-- Hook on screen from frame 1 -->
<div id="hook" class="hook">Aberto no Google.<br><span style="color:${RED}">Fechado na porta.</span></div>

<!-- Scene 1: Friday night, Carlos -->
<div id="moon" class="abs" style="left:860px;top:610px">${moon}</div>
<div id="clock" class="card" style="left:110px;top:610px;width:430px;padding:26px 34px">
  <div style="font-size:30px;font-weight:800;color:#8790a6;letter-spacing:.12em">SEXTA</div>
  <div id="clockT" style="font-size:120px;font-weight:900;letter-spacing:-.04em;line-height:1">22:00</div>
</div>
<div id="carlos" class="abs" style="left:110px;top:860px">${person('pk', '#2fae78', { size: 330, hair: '#2b2118' })}</div>
<div id="kName" class="chip" style="left:160px;top:1225px">Carlos</div>

<!-- Scene 2: the phone says open -->
<div id="phone" class="abs" style="left:560px;top:640px;width:420px;height:640px;border-radius:60px;background:#1a2130;padding:14px;box-shadow:0 60px 120px -40px rgba(8,101,254,.7),0 0 0 2px rgba(255,255,255,.08)">
  <div style="position:relative;width:392px;height:612px;border-radius:48px;overflow:hidden;background:#f4f6fa;color:#121826">
    <div style="margin:56px 22px 0;height:62px;border-radius:999px;background:#fff;border:1px solid #dce2ec;display:flex;align-items:center;gap:12px;padding:0 20px;font-size:23px;font-weight:600;color:#4a5568">${svgIcon(ICON.search, 26, '#6a7385')}<span id="q"></span><span id="caret" style="width:2px;height:26px;background:#0865fe;display:inline-block"></span></div>
    <div id="res" style="margin:22px 22px 0;background:#fff;border:1px solid #dce2ec;border-radius:26px;padding:22px">
      <div style="font-size:28px;font-weight:800">Pizzaria Exemplo</div>
      <div style="font-size:21px;color:#6a7385;margin-top:4px">Pizzaria · 600 m</div>
      <div style="display:flex;gap:8px;margin-top:16px">${pizza('#ffe8cc')}${pizza('#fff1c2')}${pizza('#fde2e2')}</div>
      <div id="resOpen" style="display:flex;align-items:center;gap:10px;margin-top:18px;font-size:24px;font-weight:800;color:#15803d;background:#dcfce7;padding:10px 16px;border-radius:14px">${svgIcon(ICON.clock, 28, '#15803d')}Aberto · fecha às 23h</div>
    </div>
  </div>
</div>

<!-- Scene 3: the door is shut -->
<div id="door" class="abs" style="left:280px;top:440px">
  ${store('stP', 'PIZZARIA', RED, { w: 520 })}
  <div id="shutter" class="abs" style="left:43px;top:180px;width:434px;height:0;background:repeating-linear-gradient(#5b6475 0 16px,#4a5262 16px 20px);border-bottom:6px solid #2a3040"></div>
  <div id="closed" class="abs" style="left:150px;top:250px;padding:14px 30px;border-radius:14px;background:${RED};color:#fff;font-size:44px;font-weight:900;letter-spacing:.08em;transform:rotate(-6deg)">FECHADO</div>
</div>
<div id="fam" class="abs" style="left:0;top:880px;width:1080px;height:420px">
  <div class="abs" style="left:150px;top:0">${person('f1', '#2fae78', { size: 300 })}</div>
  <div class="abs" style="left:420px;top:90px">${person('f2', '#e86a9a', { size: 230, hair: '#6b3a1f' })}</div>
  <div class="abs" style="left:640px;top:150px">${person('f3', '#ffc94d', { size: 180, hair: '#3a2a1e' })}</div>
</div>
<div id="bubF" class="bubble" style="left:470px;top:820px">Mas dizia aberto…</div>

<!-- Scene 4: he goes elsewhere; the owner never knows -->
<div id="away" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="abs" style="left:110px;top:440px;font-size:40px;font-weight:900;color:#8790a6;letter-spacing:.06em">FOI PRA OUTRO LUGAR</div>
  <svg class="abs" style="left:110px;top:510px" width="860" height="60" viewBox="0 0 860 60"><line x1="0" y1="30" x2="810" y2="30" stroke="#8790a6" stroke-width="8" stroke-linecap="round" stroke-dasharray="26 20"/><path d="M800 8l40 22-40 22" fill="none" stroke="#8790a6" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  <div class="card" style="left:110px;top:660px;width:860px;height:560px;padding:40px">
    <div style="font-size:30px;font-weight:900;letter-spacing:.1em;color:${RED}">ENQUANTO ISSO, O DONO</div>
    <div class="abs" style="left:60px;top:150px">${person('po', RED, { size: 320, hair: '#3a2a1e' })}</div>
  </div>
</div>
<div id="bubO" class="bubble" style="left:470px;top:860px">Tudo tranquilo hoje…</div>

<!-- Scene 5: the basics -->
<div id="pillC" class="pill" style="top:400px"><i></i>Perfil da Empresa no Google</div>
<div id="list" class="card" style="left:90px;top:480px;width:900px;padding:20px 44px 10px">
  ${[
    ['li1', 'Horário certo, inclusive no feriado'],
    ['li2', 'Fotos reais'],
    ['li3', 'Nome igual ao da fachada'],
  ]
    .map(([id, txt]) => `<div id="${id}" class="row"><span class="ok">${svgIcon(ICON.check, 40, '#06210f', 3)}</span>${txt}</div>`)
    .join('')}
</div>
<div id="detail" class="big" style="top:930px;font-size:84px">Parece detalhe.</div>
<div id="detail2" class="big" style="top:1040px;font-size:60px;color:#8db8ff">É o que o cliente vê<br>antes de sair de casa.</div>

${comentaBlock('Quer saber como está o seu perfil?', 'GOOGLE')}
`;

const script = `
window.draw=(t)=>{
  const B={base:'translateX(-50%)'};
  show('hook',t,0,4.4,{dy:0,fi:.01});
  // Scene 1
  show('moon',t,0.1,2.4,{pop:true,sc:.4});
  show('clock',t,0.05,4.45,{pop:true,sc:.3,dy:0});
  show('carlos',t,1.9,7.95,{dy:80}); show('kName',t,2.3,7.95,{pop:true,sc:.4});
  // Scene 2
  show('phone',t,2.4,7.95,{dy:120,fi:.5});
  const query='pizzaria perto de mim', n=Math.floor(clamp((t-2.8)/1.5)*query.length);
  $('q').textContent=query.slice(0,n); $('caret').style.opacity=(Math.floor(t*3)%2||n<query.length)?1:0;
  show('res',t,4.95,7.95,{dy:40,fi:.4});
  const ko=show('resOpen',t,6.05,7.95,{pop:true,sc:.4});
  if(t>6.6&&t<7.95) $('resOpen').style.transform='scale('+(1+.04*Math.sin((t-6.6)*8))+')';
  // Scene 3
  show('door',t,8.0,11.4,{dy:40});
  const ks=eo((t-9.7)/.6); $('shutter').style.height=(t>9.7?277*ks:0)+'px';
  show('closed',t,10.25,11.4,{pop:true,sc:.5,dy:0,base:'rotate(-6deg)'});
  show('fam',t,8.0,11.4,{dy:0,x:-300,fi:.7});
  show('bubF',t,10.6,11.4,{pop:true,sc:.4});
  ['f1','f2','f3'].forEach(f=>{const s=t>10.2; $(f+'-happy').style.opacity=s?0:1; $(f+'-sad').style.opacity=s?1:0;});
  // Scene 4
  show('away',t,11.45,14.85,{dy:40});
  show('bubO',t,12.9,14.85,{pop:true,sc:.4});
  // Scene 5
  show('pillC',t,14.9,24.55,{dy:-20,...B});
  show('list',t,14.9,24.55,{dy:50});
  show('li1',t,14.95,24.55,{dy:20,x:-40}); show('li2',t,17.4,24.55,{dy:20,x:-40}); show('li3',t,18.55,24.55,{dy:20,x:-40});
  show('detail',t,20.6,24.55,{pop:true,sc:.3,dy:0}); show('detail2',t,22.4,24.55,{dy:30});
  // Scene 6: Comenta GOOGLE
  comenta(t,24.85,26.8,'GOOGLE');
};
`;

export const html = () => page({ css, body, script, captions: CAPS });

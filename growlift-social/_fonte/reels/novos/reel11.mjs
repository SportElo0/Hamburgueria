// Reel 11: "Dois amigos, duas hamburguerias". A fable (marked "Era uma vez" and "História fictícia" on screen): same
// food, same price; one waits for people to walk by, the other also shows up on the phone of whoever is looking. No
// outcome is promised (no "closing" or "hiring", no time frame). Timed to narracao-11-eleven.mp3 (v2, 01/11).
import { MARK } from '../../pecas.mjs';
import { page, person, store, svgIcon, ICON, food } from './base.mjs';

export const DURATION = 26.2;
export const COVER = 17.4;

const CAPS = [
  [0.0, 1.95, 'Era uma vez dois amigos', 'dois amigos'],
  [1.95, 4.75, 'uma hamburgueria na mesma rua', 'mesma rua'],
  [4.75, 6.95, 'mesmo lanche, mesmo preço', 'mesmo'],
  [6.95, 8.4, 'mesmo capricho', 'capricho'],
  [8.4, 11.1, 'Um deles esperava alguém passar na frente', 'esperava'],
  [11.1, 15.3, 'O outro aparecia no celular de quem procurava', 'celular'],
  [15.3, 18.7, 'no Google, com foto, horário e cardápio', 'Google'],
  [18.7, 22.55, 'Quem aparece em dia tem mais chance de ser encontrado', 'mais chance'],
  [22.55, 23.9, 'Quer ser encontrado?', 'encontrado'],
  [23.9, 26.2, 'Segue a Growlift!', 'Growlift'],
];

const RED = '#ff6b5b';
const BLUE = '#0865fe';

const css = `
body{background:#06080d;color:#f3f5f9}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.09) 1.6px,transparent 1.6px);background-size:44px 44px}
.glowR{position:absolute;width:1100px;height:1100px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,107,91,.20),transparent 70%)}
.glowB{position:absolute;width:1200px;height:1200px;border-radius:50%;background:radial-gradient(closest-side,rgba(8,101,254,.30),transparent 70%)}
.pill{position:absolute;left:50%;transform:translateX(-50%);display:inline-flex;align-items:center;gap:12px;padding:14px 28px;border-radius:999px;background:#0f1520;border:1px solid rgba(255,255,255,.12);font-size:28px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#c6cede;white-space:nowrap}
.pill i{width:12px;height:12px;border-radius:50%;background:${BLUE};display:inline-block}
.lbl{position:absolute;font-size:34px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}
.chip{position:absolute;padding:16px 28px;border-radius:999px;font-size:34px;font-weight:800;background:#0f1520;border:1px solid rgba(255,255,255,.14);white-space:nowrap}
.card{position:absolute;background:#0f1520;border:1px solid rgba(255,255,255,.10);border-radius:36px}
.bubble{position:absolute;background:#f3f5f9;color:#121826;font-weight:800;font-size:36px;padding:22px 32px;border-radius:28px;white-space:nowrap}
.bubble:after{content:"";position:absolute;left:40px;bottom:-18px;border:12px solid transparent;border-top:18px solid #f3f5f9}
.big{position:absolute;left:0;right:0;text-align:center;font-weight:900;letter-spacing:-.04em}
.ppl{position:absolute;width:64px;height:64px;border-radius:50%;background:#1a2435;border:2px solid rgba(77,141,255,.6);display:grid;place-items:center}
`;

const sparkle = (x, y, s = 1, c = '#ffc94d') => `<svg class="abs spark" style="left:${x}px;top:${y}px" width="${40 * s}" height="${40 * s}" viewBox="0 0 24 24"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" fill="${c}"/></svg>`;

const body = `
<div class="dots"></div>
<div class="glowR" style="left:-520px;top:200px"></div>
<div class="glowB" style="right:-560px;top:380px"></div>

<!-- Scene 1-2, 4: the two shops -->
<div id="pillA" class="pill" style="top:270px"><i></i>Era uma vez…</div>
<div id="shops">
  <div id="shopL" class="abs" style="left:110px;top:400px">${store('stL', 'LOJA 1', RED, { sign: '' })}</div>
  <div id="shopR" class="abs" style="left:640px;top:400px">${store('stR', 'LOJA 2', BLUE)}</div>
  <div id="pL" class="abs" style="left:150px;top:760px">${person('fa', RED)}</div>
  <div id="pR" class="abs" style="left:680px;top:760px">${person('fb', BLUE, { hair: '#4a2c1a' })}</div>
  <svg id="street" class="abs" style="left:90px;top:1060px" width="900" height="20"><line x1="0" y1="10" x2="900" y2="10" stroke="rgba(255,255,255,.25)" stroke-width="6" stroke-dasharray="40 26"/></svg>
  <div id="eq" class="abs" style="left:470px;top:520px;width:140px;height:140px;border-radius:50%;background:#0f1520;border:3px solid rgba(255,255,255,.35);display:grid;place-items:center;font-size:84px;font-weight:900;color:#f3f5f9">=</div>
</div>
<div id="chip1" class="chip" style="left:90px;top:1140px">mesmo lanche</div>
<div id="chip2" class="chip" style="left:400px;top:1140px">mesmo preço</div>
<div id="chip3" class="chip" style="left:680px;top:1140px">mesmo capricho</div>



<!-- Scene 6: the first one waits -->
<div id="pill1" class="pill" style="top:270px"><i style="background:${RED}"></i>Um deles</div>
<div id="waitTag" class="abs" style="left:640px;top:1000px;padding:10px 20px;border-radius:12px;background:${RED};color:#fff;font-size:30px;font-weight:900;letter-spacing:.08em;transform:rotate(-5deg)">ESPERANDO…</div>
<div id="wait">
  <div class="abs" style="left:380px;top:420px;width:320px;height:320px;border-radius:50%;background:#fff;box-shadow:0 30px 80px -30px rgba(0,0,0,.8)">
    <svg width="320" height="320" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="#121826" stroke-width="3"/>
      ${Array.from({ length: 12 }, (_, i) => `<line x1="50" y1="10" x2="50" y2="16" stroke="#121826" stroke-width="3" transform="rotate(${i * 30} 50 50)"/>`).join('')}
      <line id="hHour" x1="50" y1="50" x2="50" y2="30" stroke="#121826" stroke-width="5" stroke-linecap="round"/>
      <line id="hMin" x1="50" y1="50" x2="50" y2="18" stroke="${RED}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="4" fill="#121826"/></svg>
  </div>
  <div class="abs" style="left:415px;top:790px">${person('fw', RED, { size: 250 })}</div>
  <div class="abs" style="left:250px;top:1090px;width:580px;height:110px;border-radius:24px;background:#5a3a26;box-shadow:inset 0 10px 0 #6e4930"></div>
</div>
<div id="bubW" class="bubble" style="left:560px;top:760px">Alguém vai passar…</div>

<!-- Scene 7: the second one shows up on the phone -->
<div id="pill2" class="pill" style="top:270px"><i></i>O outro</div>
<div id="phone" class="abs" style="left:310px;top:380px;width:460px;height:820px;border-radius:64px;background:#1a2130;padding:14px;box-shadow:0 60px 120px -40px rgba(8,101,254,.6),0 0 0 2px rgba(255,255,255,.08)">
  <div style="position:relative;width:432px;height:792px;border-radius:52px;overflow:hidden;background:#f4f6fa;color:#121826">
    <div style="margin:64px 26px 0;height:70px;border-radius:999px;background:#fff;border:1px solid #dce2ec;display:flex;align-items:center;gap:14px;padding:0 24px;font-size:24px;font-weight:600;color:#4a5568">${svgIcon(ICON.search, 30, '#6a7385')}<span id="q"></span><span id="caret" style="width:2px;height:28px;background:#0865fe;display:inline-block"></span></div>
    <div id="res" style="margin:26px 26px 0;background:#fff;border:1px solid #dce2ec;border-radius:28px;padding:24px">
      <div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:30px;font-weight:800">Loja 2</div><div style="font-size:20px;font-weight:700;color:#15803d;background:#dcfce7;padding:6px 14px;border-radius:999px">Aberto agora</div></div>
      <div style="font-size:22px;color:#6a7385;margin-top:4px">Hamburgueria · na sua rua</div>
      <div id="resPh" style="display:flex;gap:10px;margin-top:18px">${food('burger', 118)}${food('fries', 118)}${food('drink', 118)}</div>
      <div id="resH" style="display:flex;align-items:center;gap:10px;margin-top:18px;font-size:22px;font-weight:600;color:#4a5568">${svgIcon(ICON.clock, 28, '#0865fe')}Seg a dom · 18h às 23h</div>
      <div id="resM" style="margin-top:20px;height:70px;border-radius:999px;background:#0865fe;color:#fff;display:flex;align-items:center;justify-content:center;gap:12px;font-size:26px;font-weight:800">${svgIcon(ICON.menu, 30, '#fff')}Ver cardápio</div>
    </div>
  </div>
</div>
<div id="crowd">${[
  [80, 420], [170, 640], [60, 900], [160, 1120], [900, 440], [960, 680], [880, 930], [940, 1150], [250, 1220], [800, 1240],
]
  .map(([x, y], i) => `<div class="ppl" id="pp${i}" style="left:${x}px;top:${y}px">${svgIcon(ICON.user, 36, '#8db8ff')}</div>`)
  .join('')}</div>
<div id="tG" class="chip" style="left:90px;top:520px;color:#8db8ff">Google</div>
<div id="tF" class="chip" style="left:800px;top:600px">foto</div>
<div id="tH" class="chip" style="left:60px;top:1000px">horário</div>
<div id="tM" class="chip" style="left:790px;top:1040px">cardápio</div>

<!-- Scene 8: wait vs found -->
<div id="cmpA" class="card" style="left:110px;top:330px;width:860px;height:330px;padding:34px 40px">
  <div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:30px;font-weight:900;letter-spacing:.1em;color:${RED}">UM ESPERA</div><div style="padding:8px 16px;border-radius:10px;background:${RED};color:#fff;font-size:24px;font-weight:900;letter-spacing:.06em">ESPERANDO…</div></div>
  <div style="display:flex;align-items:center;gap:30px;margin-top:40px">
    <div class="ppl" style="position:relative;width:110px;height:110px">${svgIcon(ICON.user, 60, '#c6cede')}</div>
    <svg width="300" height="20"><line x1="0" y1="10" x2="300" y2="10" stroke="rgba(255,255,255,.35)" stroke-width="5" stroke-dasharray="18 14"/></svg>
    <div style="font-size:90px;font-weight:900;color:${RED}">?</div>
    <div style="transform:scale(.55);transform-origin:left center;margin-left:-20px">${store('stC', 'LOJA 1', RED, { w: 260 })}</div>
  </div>
</div>
<div id="cmpB" class="card" style="left:110px;top:720px;width:860px;height:360px;padding:34px 40px;border-color:rgba(77,141,255,.5);box-shadow:0 30px 80px -40px rgba(8,101,254,.7)">
  <div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:30px;font-weight:900;letter-spacing:.1em;color:#8db8ff">O OUTRO APARECE</div><div style="padding:8px 16px;border-radius:10px;background:#22c55e;color:#06210f;font-size:24px;font-weight:900;letter-spacing:.06em">ENCONTRADO</div></div>
  <div style="display:flex;align-items:center;gap:26px;margin-top:40px">
    <div style="width:110px;height:180px;border-radius:24px;background:#1a2130;border:3px solid #4d8dff;display:grid;place-items:center">${svgIcon(ICON.pin, 54, '#4d8dff')}</div>
    <svg id="arrow" width="300" height="40" viewBox="0 0 300 40"><line x1="0" y1="20" x2="270" y2="20" stroke="#4d8dff" stroke-width="7" stroke-linecap="round"/><path d="M262 6l26 14-26 14" fill="none" stroke="#4d8dff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div style="display:flex;gap:10px">${[0, 1, 2].map(() => `<div class="ppl" style="position:relative">${svgIcon(ICON.user, 36, '#8db8ff')}</div>`).join('')}</div>
  </div>
</div>

<div id="disc" class="abs" style="left:0;right:0;top:1500px;text-align:center;font-size:24px;font-weight:600;color:#8790a6;z-index:30">História fictícia. Não garantimos clientes, vendas nem posição no Google.</div>
<!-- Scene 9: end -->
<div id="endc" class="abs" style="left:0;right:0;top:470px;text-align:center">
  <div style="width:180px;margin:0 auto">${MARK}</div>
  <div style="font-size:104px;font-weight:900;letter-spacing:-.04em;line-height:1.02;margin-top:56px">Quer ser<br><span style="color:#4d8dff">encontrado?</span></div>
  <div id="follow" style="display:inline-flex;align-items:center;justify-content:center;gap:16px;margin-top:60px;min-width:420px;height:110px;border-radius:999px;background:#0865fe;color:#fff;font-size:44px;font-weight:800;box-shadow:0 26px 60px -20px rgba(8,101,254,.9)"><span id="fIcon" style="display:none">${svgIcon(ICON.check, 44, '#fff', 3)}</span><span id="fTxt">Seguir</span></div>
  <div style="margin-top:36px;font-size:36px;font-weight:700;color:#c6cede">@growlift.ai · site, Google e pedidos para restaurantes</div>
</div>
<div id="tap" class="abs" style="width:90px;height:90px;border-radius:50%;background:rgba(255,255,255,.5);border:3px solid #fff;left:640px;top:880px"></div>
`;

const script = `
window.draw=(t)=>{
  // Shops (scenes 1-2)
  show('pillA',t,0.05,8.3,{dy:-20});
  show('shops',t,0,8.45,{dy:0,fi:.01});
  show('shopL',t,0.1,8.45,{pop:true,sc:.25,fi:.5}); show('shopR',t,0.35,8.45,{pop:true,sc:.25,fi:.5});
  show('pL',t,0.9,8.45,{dy:60}); show('pR',t,1.25,8.45,{dy:60});
  show('street',t,2.1,8.45,{dy:0});
  show('eq',t,4.9,8.45,{pop:true,sc:.6});
  show('chip1',t,4.95,8.4,{pop:true,sc:.4}); show('chip2',t,5.9,8.4,{pop:true,sc:.4}); show('chip3',t,7.05,8.4,{pop:true,sc:.4});
  // Scene 3: one of them waits
  show('pill1',t,8.5,11.15,{dy:-20}); show('wait',t,8.5,11.15,{dy:30});
  const ang=(t-8.5)*240; $('hMin').setAttribute('transform','rotate('+ang+' 50 50)'); $('hHour').setAttribute('transform','rotate('+(ang/12+60)+' 50 50)');
  show('bubW',t,8.9,11.15,{pop:true,sc:.4}); show('waitTag',t,9.6,11.15,{pop:true,sc:.5,base:'rotate(-5deg)'});
  // Scene 4: the other one also shows up on the phone
  show('pill2',t,11.2,18.75,{dy:-20});
  show('phone',t,11.2,18.75,{dy:120,fi:.5});
  const query='hamburgueria perto de mim', n=Math.floor(clamp((t-11.6)/1.5)*query.length);
  $('q').textContent=query.slice(0,n); $('caret').style.opacity=(Math.floor(t*3)%2||n<query.length)?1:0;
  show('res',t,13.4,18.75,{dy:40,fi:.4});
  show('resPh',t,16.3,18.75,{pop:true,sc:.3}); show('resH',t,17.0,18.75,{dy:20}); show('resM',t,17.6,18.75,{pop:true,sc:.3});
  for(let i=0;i<10;i++){const a=12.2+i*.42; const el=$('pp'+i); show(el,t,a,18.75,{pop:true,sc:.6,dy:0});
    const cx=540, cy=790, x=+el.style.left.replace('px',''), y=+el.style.top.replace('px',''); const d=eo((t-a)/3)*0.22;
    el.style.transform+=' translate('+((cx-x)*d)+'px,'+((cy-y)*d)+'px)';}
  show('tG',t,15.45,18.75,{pop:true,sc:.4}); show('tF',t,16.3,18.75,{pop:true,sc:.4}); show('tH',t,17.0,18.75,{pop:true,sc:.4}); show('tM',t,17.6,18.75,{pop:true,sc:.4});
  // Scene 5: wait vs show up
  show('cmpA',t,18.8,22.6,{dy:60}); show('cmpB',t,19.9,22.6,{dy:60});
  const ka=eo((t-20.2)/.5); $('arrow').style.clipPath='inset(0 '+((1-ka)*100)+'% 0 0)';
  // Scene 6: end
  show('endc',t,22.6,undefined,{dy:50,fi:.5});
  const tapK=t>=24.1&&t<24.75?1-Math.abs((t-24.4)/.3):0; $('tap').style.opacity=Math.max(0,tapK); $('tap').style.transform='scale('+(.7+.3*Math.max(0,tapK))+')';
  const followed=t>=24.35; $('fTxt').textContent=followed?'Seguindo':'Seguir'; $('fIcon').style.display=followed?'inline-flex':'none';
  $('follow').style.background=followed?'#0f1520':'#0865fe'; $('follow').style.border=followed?'3px solid #4d8dff':'0';
};
`;

export const html = () => page({ css, body, script, captions: CAPS });

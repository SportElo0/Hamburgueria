// Reel 23 (14/11): "O telefone tocou na escada". Edu, an air-conditioning technician (fictional), is up a ladder
// changing a unit; a new customer calls, nobody answers, the customer calls the next one on the list. Rewind: the
// same call with Growlift Comercial. The phone menu offers a WhatsApp answer (the customer presses 1, as in the
// product), Ana answers with the product's default missed-call text, books Thursday 9h in the agenda, and Edu's phone
// shows the task the product really creates ("Confirmar a visita…"). People, company and times are made up; no result
// is promised. Drawn in SVG/HTML, no AI images.
import { page, svgIcon, ICON, comentaBlock } from './base.mjs';
import { pessoa, MOOD } from './elenco.mjs';
import { CSS as ESTILO, BG } from './estilo.mjs';

// Timeline (seconds). Kept in one place so it can follow the narration once it exists.
const T = {
  ring: 3.0, // phone starts ringing
  miss: 6.4, // missed call
  cli: 7.3, // the customer appears
  list: 9.4, // he calls the next one on the list
  rw: 11.6, // rewind
  b: 13.4, // the same call, with Growlift
  menu: 14.6, // "press 1" menu
  zap: 17.2, // WhatsApp answer
  cal: 22.0, // agenda
  down: 24.8, // Edu comes down, alert on the phone
  end: 28.6, // "Comenta AGENDA"
};
export const DURATION = 32.0;
export const COVER = 4.4;

const CAPS = [
  [0.15, 1.6, 'Terça, duas da tarde', 'duas da tarde'],
  [1.6, 3.0, 'O Edu está no alto da escada', 'escada'],
  [3.0, 4.6, 'O celular toca…', 'toca'],
  [4.6, 6.4, '…e ele não consegue atender', 'não consegue'],
  [7.2, 9.3, 'Era um cliente querendo instalar um ar', 'instalar'],
  [9.4, 11.5, 'Sem resposta, ele liga pro próximo', 'próximo'],
  [11.7, 13.3, 'Agora, a mesma ligação, com a Growlift', 'com a Growlift'],
  [14.6, 17.0, 'Ninguém atendeu? Aperta 1', 'Aperta 1'],
  [17.2, 19.4, 'e recebe a resposta no WhatsApp', 'WhatsApp'],
  [19.5, 21.9, 'A atendente entende o serviço', 'entende'],
  [22.0, 24.7, 'olha a agenda e marca a visita', 'marca a visita'],
  [24.8, 28.4, 'Quando ele desce, o aviso já está no celular', 'aviso'],
];

const EMPRESA = 'Edu Climatização';
const BLUE = '#0865fe';
const RED = '#ff6b5b';
const GREEN = '#22c55e';

// ---------- drawings ----------
const split = `<svg width="520" height="170" viewBox="0 0 520 170">
  <rect x="4" y="4" width="512" height="150" rx="28" fill="#f3f5f9"/>
  <rect x="4" y="112" width="512" height="42" rx="0" fill="#e2e7ef"/><rect x="4" y="132" width="512" height="22" rx="14" fill="#e2e7ef"/>
  ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${40 + i * 74}" y="122" width="56" height="5" rx="2.5" fill="#b8c2d3"/>`).join('')}
  <circle cx="472" cy="44" r="7" fill="#4dd6a0"/><rect x="40" y="38" width="120" height="12" rx="6" fill="#dce2ec"/>
</svg>`;
const ladder = `<svg width="260" height="600" viewBox="0 0 300 760" preserveAspectRatio="none">
  <path d="M60 0 20 760M240 0 280 760" stroke="#ffc94d" stroke-width="18" stroke-linecap="round"/>
  ${[90, 210, 330, 450, 570, 690].map((y) => `<path d="M${60 - y * 0.052} ${y}H${240 + y * 0.052}" stroke="#ffb020" stroke-width="14" stroke-linecap="round"/>`).join('')}
</svg>`;
const toolbox = `<svg width="300" height="170" viewBox="0 0 300 170"><path d="M100 40V20h100v20" stroke="#8a95aa" stroke-width="12" fill="none" stroke-linecap="round"/><rect x="10" y="40" width="280" height="126" rx="18" fill="#e8483b"/><rect x="10" y="84" width="280" height="12" fill="#c9372c"/><rect x="128" y="74" width="44" height="30" rx="6" fill="#ffc94d"/></svg>`;
const arm = `<svg width="240" height="160" viewBox="0 0 240 160" style="overflow:visible"><path d="M20 140C60 110 100 70 150 40" stroke="#0f6c8a" stroke-width="38" stroke-linecap="round" fill="none"/><circle cx="160" cy="34" r="22" fill="#c68a5e"/><path d="M170 24l46-26" stroke="#ffc94d" stroke-width="12" stroke-linecap="round"/><path d="M212 0l20-12" stroke="#a9b3c7" stroke-width="6" stroke-linecap="round"/></svg>`;

// Phone screens share the frame; each screen is an absolutely positioned layer.
const scr = (id, inner, bg = '#0b141a') => `<div id="${id}" class="layer" style="background:${bg}">${inner}</div>`;
const callScreen = (id, title, sub, color = '#9fb0c8') => scr(
  id,
  `<div style="padding-top:120px;text-align:center">
    <div style="width:150px;height:150px;margin:0 auto;border-radius:50%;background:#1f2c3d;display:grid;place-items:center">${svgIcon(ICON.user, 84, '#c6cede', 1.8)}</div>
    <div style="margin-top:28px;font-size:38px;font-weight:800;color:#fff">${title}</div>
    <div class="sub" style="margin-top:12px;font-size:28px;font-weight:600;color:${color}">${sub}</div>
  </div>`,
);
const bub = (id, side, txt) => `<div id="${id}" style="display:flex;justify-content:${side === 'in' ? 'flex-start' : 'flex-end'};margin-top:12px"><span style="max-width:86%;padding:14px 18px;border-radius:${side === 'in' ? '22px 22px 22px 6px' : '22px 22px 6px 22px'};background:${side === 'in' ? '#ffffff' : '#d7ffd9'};color:#10213a;font-size:24px;line-height:1.32;font-weight:600">${txt}</span></div>`;

const css = `
${ESTILO}
#cap{top:1478px}
.layer{position:absolute;inset:0}
.scene{position:absolute;inset:0}
#wall{position:absolute;left:60px;right:60px;top:340px;height:1080px;border-radius:44px;background:linear-gradient(#162033,#0f1726);border:1px solid rgba(255,255,255,.08);overflow:hidden}
#wall:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 2px,transparent 2px);background-size:100% 120px}
#floor{position:absolute;left:0;right:0;bottom:0;height:150px;background:#0b111c;border-top:2px solid rgba(255,255,255,.08)}
.clock{position:absolute;right:84px;top:250px;z-index:45;display:flex;align-items:baseline;gap:14px;padding:12px 24px;border-radius:22px;background:rgba(6,10,22,.85);border:1px solid rgba(255,255,255,.14)}
.clock .d{font-size:24px;font-weight:800;color:#9fb0c8;letter-spacing:.06em;text-transform:uppercase}
.clock .h{font-size:46px;font-weight:900;font-variant-numeric:tabular-nums}
.ph{position:absolute;border-radius:54px;background:#1a2130;padding:12px;box-shadow:0 50px 110px -40px rgba(8,101,254,.65),0 0 0 2px rgba(255,255,255,.08)}
.ph .in{position:relative;width:100%;height:100%;border-radius:44px;overflow:hidden;background:#0b141a}
.ring{position:absolute;border-radius:62px;border:4px solid ${GREEN};pointer-events:none}
#rw{position:absolute;inset:0;z-index:60;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.08) 0 3px,transparent 3px 7px)}
#rwT{position:absolute;left:84px;top:340px;z-index:61;font-size:44px;font-weight:900;letter-spacing:.08em;color:#fff;text-shadow:3px 0 rgba(255,60,80,.8),-3px 0 rgba(60,200,255,.8)}
.key{display:grid;place-items:center;height:78px;border-radius:50%;width:78px;margin:0 auto;background:#1f2c3d;color:#fff;font-size:34px;font-weight:700}
.panel{position:absolute;left:70px;right:70px;padding:28px 30px 30px;border-radius:40px;background:#0f1520;border:1px solid rgba(255,255,255,.12);box-shadow:0 40px 90px -30px rgba(0,0,0,.8)}
.slot{height:64px;border-radius:14px}
#dim{position:absolute;inset:0;z-index:44;background:rgba(4,7,16,.86)}
.tagx{position:absolute;padding:12px 24px;border-radius:999px;font-size:28px;font-weight:800;white-space:nowrap;z-index:30}
`;

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
const HOURS = ['8h', '9h', '10h', '14h', '16h'];
const BUSY = new Set(['0-0', '0-1', '0-3', '1-0', '1-2', '1-3', '1-4', '2-1', '2-2', '2-4', '3-0', '3-3', '4-1', '4-2', '4-4']);
const agenda = `<div style="display:grid;grid-template-columns:76px repeat(5,1fr);gap:10px;margin-top:22px">
  <span></span>${DAYS.map((d) => `<span style="text-align:center;font-size:26px;font-weight:800;color:${d === 'Qui' ? '#8ec2ff' : '#9fb0c8'}">${d}</span>`).join('')}
  ${HOURS.map((h, r) => `<span style="font-size:26px;font-weight:700;color:#9fb0c8;align-self:center">${h}</span>${DAYS.map((_, c) => {
    const k = `${c}-${r}`;
    if (k === '3-1') return `<span class="slot" style="position:relative;border:2px dashed rgba(142,194,255,.6)"><span id="slotB" style="position:absolute;inset:-2px;border-radius:14px;background:${BLUE};color:#fff;font-size:20px;font-weight:800;display:grid;place-items:center;line-height:1.1;text-align:center">Visita<br>Jorge</span></span>`;
    return `<span class="slot" style="background:${BUSY.has(k) ? 'rgba(255,255,255,.12)' : 'transparent'};border:${BUSY.has(k) ? 'none' : '2px dashed rgba(255,255,255,.14)'}"></span>`;
  }).join('')}`).join('')}
</div>`;

const body = `
${BG}
<div class="clock"><span class="d" id="cD">Terça</span><span class="h" id="cH">14:00</span></div>

<!-- Scene A: the wall, the ladder, Edu, the phone on the toolbox -->
<div id="sA" class="scene">
  <div id="wall"><div id="floor"></div></div>
  <div id="ac" class="abs" style="left:430px;top:440px">${split}</div>
  <div id="lad" class="abs" style="left:150px;top:820px">${ladder}</div>
  <div id="eduWrap" class="abs" style="left:130px;top:520px;width:320px;height:420px">
    <div id="arm" class="abs" style="left:190px;top:40px">${arm}</div>
    ${pessoa('edu', { skin: '#c68a5e', hair: '#1f140e', hairStyle: 'curto', shirt: '#0f6c8a', size: 300 })}
  </div>
  <div id="tb" class="abs" style="left:640px;top:1250px">${toolbox}</div>
  <div id="ringA" class="ring" style="left:676px;top:808px;width:252px;height:464px"></div>
  <div id="phA" class="ph" style="left:690px;top:822px;width:224px;height:436px">
    <div class="in">
      ${scr('aIdle', '<div style="padding-top:120px;text-align:center;font-size:56px;font-weight:800;color:#fff">14:00</div>', '#101826')}
      ${scr('aCall', `<div style="padding-top:70px;text-align:center"><div style="width:90px;height:90px;margin:0 auto;border-radius:50%;background:#1f2c3d;display:grid;place-items:center">${svgIcon(ICON.user, 50, '#c6cede', 1.8)}</div><div style="margin-top:18px;font-size:26px;font-weight:800;color:#fff">(11) 9 8•••-••••</div><div style="margin-top:8px;font-size:22px;color:#9fb0c8">chamando…</div><div style="display:flex;justify-content:space-around;margin-top:90px"><span style="width:62px;height:62px;border-radius:50%;background:${RED}"></span><span style="width:62px;height:62px;border-radius:50%;background:${GREEN}"></span></div></div>`)}
      ${scr('aMiss', `<div style="padding-top:110px;text-align:center"><div style="font-size:30px;font-weight:900;color:${RED}">Chamada<br>perdida</div><div style="margin-top:14px;font-size:22px;color:#9fb0c8">(11) 9 8•••-••••</div></div>`, '#101826')}
      ${scr('aNot', `<div style="padding:70px 12px 0"><div style="font-size:42px;font-weight:800;color:#fff;text-align:center">14:31</div>
        <div id="notif" style="margin-top:26px;padding:14px 14px 16px;border-radius:20px;background:rgba(255,255,255,.94);color:#121826">
          <div style="display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;color:#4a5568"><span style="width:22px;height:22px;border-radius:6px;background:${BLUE};display:inline-block"></span>Growlift Comercial · agora</div>
          <div style="margin-top:8px;font-size:19px;font-weight:800;line-height:1.25">Confirmar a visita de quinta, 9h: Jorge</div>
          <div style="margin-top:6px;font-size:15px;line-height:1.3;color:#4a5568">Marcada pela assistente. Confirme o endereço com o cliente.</div>
        </div></div>`, '#101826')}
    </div>
  </div>
  <div id="tMiss" class="tagx" style="left:560px;top:740px;background:rgba(255,107,91,.16);border:1px solid ${RED};color:#ffb4a8">Ninguém atendeu</div>
</div>

<!-- Scene B: Jorge and his phone -->
<div id="sB" class="scene">
  <div id="jorgeWrap" class="abs" style="left:70px;top:700px">${pessoa('jorge', { skin: '#e2b08a', hair: '#5b5b5b', hairStyle: 'curto', shirt: '#e8a54b', glasses: true, mustache: true, size: 330 })}</div>
  <div id="tagJ" class="tagx" style="left:90px;top:1150px;background:#0f1520;border:1px solid rgba(255,255,255,.14)">Jorge, quer instalar um ar</div>
  <div id="phB" class="ph" style="left:470px;top:420px;width:540px;height:960px">
    <div class="in">
      ${callScreen('bCall', EMPRESA, 'chamando…')}
      ${callScreen('bNo', EMPRESA, 'ninguém atendeu', RED)}
      ${scr('bList', `<div style="padding:70px 22px 0;color:#fff"><div style="display:flex;align-items:center;gap:12px;height:62px;border-radius:999px;background:#1a2433;padding:0 20px;font-size:23px;color:#c6cede">${svgIcon(ICON.search, 26, '#9fb0c8')}técnico de ar-condicionado</div>
        ${[[EMPRESA, 'não atendeu', true], ['Outro técnico', 'aberto agora', false], ['Mais um técnico', 'aberto agora', false]].map(([n, s, off], i) => `<div id="li${i}" style="margin-top:18px;padding:20px 22px;border-radius:22px;background:${off ? 'rgba(255,107,91,.10)' : '#162133'};border:2px solid ${off ? 'rgba(255,107,91,.4)' : 'transparent'};opacity:${off ? '.6' : '1'}"><div style="font-size:28px;font-weight:800">${n}</div><div style="margin-top:6px;font-size:22px;color:${off ? '#ffb4a8' : '#8fe0b0'}">${s}</div></div>`).join('')}
        <div id="tap" style="position:absolute;left:300px;top:330px;width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,.35);border:3px solid #fff"></div></div>`)}
      ${scr('bMenu', `<div style="padding:80px 30px 0;text-align:center;color:#fff"><div style="font-size:30px;font-weight:800">${EMPRESA}</div><div style="margin-top:6px;font-size:22px;color:#9fb0c8">mensagem da ligação</div>
        <div style="margin-top:34px;padding:22px 24px;border-radius:24px;background:#162133;font-size:25px;line-height:1.38;font-weight:600;text-align:left">“Se ninguém puder atender, quer receber uma mensagem da ${EMPRESA} no WhatsApp, neste número? Aperte 1.”</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:40px">${['1', '2', '3', '4', '5', '6'].map((k) => `<span id="${k === '1' ? 'k1' : ''}" class="key">${k}</span>`).join('')}</div></div>`)}
      ${scr('bZap', `<div style="padding:62px 18px 0">
        <div style="display:flex;align-items:center;gap:14px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.12)"><span style="width:56px;height:56px;border-radius:50%;background:${BLUE};display:grid;place-items:center">${svgIcon(ICON.chat, 30, '#fff', 2)}</span><div><div style="font-size:27px;font-weight:800;color:#fff">${EMPRESA}</div><div style="font-size:20px;color:#9fb0c8">online</div></div></div>
        ${bub('z1', 'in', `Oi! Aqui é a Ana, da ${EMPRESA}. Vi que você ligou e não conseguimos atender agora. Como posso te ajudar?`)}
        ${bub('z2', 'out', 'Quero instalar um ar no quarto.')}
        ${bub('z3', 'in', 'Combinado! Pra visita técnica, tenho quinta às 9h. Pode ser?')}
        ${bub('z4', 'out', 'Pode!')}
        ${bub('z5', 'in', 'Marcado: quinta, 9h. Até lá!')}
      </div>`)}
    </div>
  </div>
</div>

<!-- Scene C: the agenda -->
<div id="sC" class="panel" style="top:520px">
  <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:32px;font-weight:800">Agenda · ${EMPRESA}</span><span style="font-size:24px;font-weight:700;color:#9fb0c8">esta semana</span></div>
  ${agenda}
  <div id="okC" style="margin-top:24px;display:flex;align-items:center;gap:14px;font-size:30px;font-weight:800;color:#9fe3b8">${svgIcon(ICON.check, 36, GREEN, 3)}Visita marcada: quinta, 9h</div>
</div>

<div id="rw"></div><div id="rwT">◀◀ A MESMA LIGAÇÃO</div>
<div id="dim"></div>
${comentaBlock('Quer isso no seu negócio?', 'AGENDA', 'dark', 470)}
`;

const script = `
window.MOTION=2;
${MOOD}
const T=${JSON.stringify(T)};
const L=(a,b,x)=>a+(b-a)*x;
function layer(ids,on){ids.forEach(i=>{$(i).style.opacity=i===on?1:0;});}
window.draw=(t)=>{
  // clock: 14:00 → 14:02 in the first story, back to 14:00 after the rewind, 14:31 when Edu comes down
  let h='14:0'+Math.min(2,Math.floor(t/3.5));
  if(t>=T.rw&&t<T.b)h='14:0'+Math.max(0,2-Math.floor((t-T.rw)*2));
  if(t>=T.b)h='14:0'+Math.min(3,Math.floor((t-T.b)/2.5));
  if(t>=T.down)h='14:31';
  $('cH').textContent=h;
  show(document.querySelector('.clock'),t,.1,T.end,{dy:-20});

  // scenes
  show('sA',t,0,T.cli,{dy:0,fo:.3});
  if(t>=T.down){show('sA',t,T.down,undefined,{dy:0});}
  show('sB',t,T.cli,T.cal,{dy:30});
  show('sC',t,T.cal,T.down,{dy:40});

  // Edu: up the ladder, working; later on the floor next to the toolbox, looking at the phone
  const down=eioS((t-T.down)/.9);
  $('eduWrap').style.transform='translate('+(down*-40)+'px,'+(down*430)+'px)';
  $('lad').style.opacity=1-down;
  $('arm').style.opacity=1-down; $('arm').style.transform='rotate('+(Math.sin(t*9)*4*(1-down))+'deg)';
  mood('edu',t>=T.miss&&t<T.down?'sad':'happy'); blink('edu',t);
  $('edu-brow').style.opacity=t>=T.ring&&t<T.down?1:0;

  // Edu's phone
  const ringing=t>=T.ring&&t<T.miss;
  layer(['aIdle','aCall','aMiss','aNot'],t>=T.down+.6?'aNot':t>=T.miss?'aMiss':ringing?'aCall':'aIdle');
  const shake=ringing?Math.sin(t*60)*4:0;
  const big=eioS((t-T.down-.2)/.8);
  $('phA').style.transform='translate('+(shake-big*110)+'px,'+(-big*120)+'px) scale('+(1+big*.9)+')';
  const rk=ringing?((t-T.ring)%.8)/.8:0; $('ringA').style.opacity=ringing?1-rk:0; $('ringA').style.transform='scale('+(1+rk*.15)+')';
  show('tMiss',t,T.miss+.15,T.cli,{dy:14});
  show('notif',t,T.down+.9,undefined,{dy:-30});
  $('tb').style.opacity=1-big;

  // Jorge
  mood('jorge',t>=T.list&&t<T.rw?'sad':(t>=T.b&&t<T.zap?'o':'happy')); blink('jorge',t);
  show('tagJ',t,T.cli+.4,T.rw,{dy:16});
  const ids=['bCall','bNo','bList','bMenu','bZap'];
  let on='bCall';
  if(t<T.rw){on=t>=T.list?'bList':t>=T.cli+1.1?'bNo':'bCall';}
  else{on=t>=T.zap?'bZap':t>=T.menu?'bMenu':'bCall';}
  layer(ids,on);
  const tp=t>=T.list+.9&&t<T.rw?eoS((t-T.list-.9)/.3):0; $('tap').style.opacity=tp?1-Math.max(0,(t-T.list-1.4)):0; $('tap').style.transform='scale('+(.6+.4*tp)+')';
  const press=t>=T.menu+1.3&&t<T.zap?1:0; $('k1').style.background=press?'${BLUE}':'#1f2c3d'; $('k1').style.transform='scale('+(press?1.12:1)+')';
  show('z1',t,T.zap+.2,undefined,{dy:20}); show('z2',t,T.zap+1.4,undefined,{dy:20}); show('z3',t,T.zap+2.4,undefined,{dy:20}); show('z4',t,T.zap+3.4,undefined,{dy:20}); show('z5',t,T.zap+4.0,undefined,{dy:20});

  // agenda
  const sk=eoS((t-T.cal-1.0)/.45); $('slotB').style.opacity=sk; $('slotB').style.transform='translateY('+((1-sk)*-50)+'px) scale('+(1.12-.12*sk)+')';
  show('okC',t,T.cal+1.5,undefined,{dy:12});

  // rewind look
  const rr=t>T.rw-.05&&t<T.b+.05?Math.min(1,(t-T.rw+.05)/.15,(T.b+.05-t)/.15):0;
  $('rw').style.opacity=rr; $('rwT').style.opacity=rr*(Math.floor(t*4)%2?1:.6);
  document.body.style.filter=rr?'saturate(.4) contrast(1.1)':'none';

  // ending
  show('dim',t,T.end,undefined,{dy:0,fi:.6});
  comenta(t,T.end+.1,T.end+1.2,'AGENDA');
};
`;

export const html = () => page({ css, body, script, captions: CAPS });

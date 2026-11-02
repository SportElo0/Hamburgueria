// Reel 8 (estilo história, 01/11): "A noite de sábado". Beto's kitchen is flat out and orders come from everywhere; part
// of them now comes straight through the shop's own site: the customer picks, pays by Pix, the order pops up on the
// kitchen screen with an alert; the Pix goes straight to Beto's account and Growlift charges nothing per order (Grow plan).
// Drawn demo screens, fictitious names. No sales figure, no outcome promised. Timed to narracao-8-eleven.mp3.
import { page, person, food, svgIcon, ICON, comentaBlock } from './base.mjs';
import { CSS, BG, GREEN, BLUE, phone } from './estilo.mjs';

export const DURATION = 27;
export const COVER = 1.2;

const ORANGE = '#ff8a3d';

const CAPS = [
  [0.0, 0.95, 'Sábado à noite', 'Sábado à noite'],
  [1.38, 3.3, 'A cozinha do Beto está a mil', 'a mil'],
  [3.65, 5.55, 'e o pedido chega de tudo que é lado', 'tudo que é lado'],
  [5.93, 9.65, 'Agora, uma parte chega direto pelo site da própria loja', 'site da própria loja'],
  [10.14, 11.75, 'o cliente escolhe no cardápio', 'cardápio'],
  [12.02, 13.15, 'paga no Pix na hora', 'Pix'],
  [13.42, 16.25, 'e o pedido aparece na tela da cozinha, com alerta', 'tela da cozinha'],
  [16.66, 18.8, 'O Pix cai direto na conta do Beto', 'direto na conta'],
  [19.15, 21.55, 'A Growlift não cobra nada sobre o pedido', 'não cobra nada'],
  [21.8, 22.7, 'É o plano Grow', 'plano Grow'],
];

const menu = `
  <div style="height:150px;background:#111;color:#ffc94d;padding:56px 24px 0;font-size:30px;font-weight:900;letter-spacing:.04em">BRASA BURGER</div>
  ${[
    ['i1', 'burger', 'Brasa Duplo'],
    ['i2', 'fries', 'Batata média'],
    ['i3', 'drink', 'Refrigerante'],
  ]
    .map(
      ([id, k, n]) => `<div id="${id}" style="margin:16px 20px 0;background:#fff;border:1px solid #e3e8f0;border-radius:22px;padding:14px;display:flex;gap:14px;align-items:center">${food(k, 86)}<div style="flex:1;font-size:24px;font-weight:800">${n}</div><div id="${id}b" style="width:52px;height:52px;border-radius:50%;background:${ORANGE};color:#fff;display:grid;place-items:center;font-size:34px;font-weight:900">+</div></div>`,
    )
    .join('')}
  <div id="pix" style="position:absolute;inset:0;background:#f4f6fa;padding:60px 26px 0;text-align:center">
    <div style="font-size:30px;font-weight:900">Pague com Pix</div>
    <div style="margin:26px auto 0;width:260px;height:260px;background:#fff;border-radius:22px;padding:18px;border:1px solid #dce2ec">
      <svg width="224" height="224" viewBox="0 0 21 21">${Array.from({ length: 21 * 21 }, (_, i) => {
        const x = i % 21, y = Math.floor(i / 21);
        const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
        const on = finder ? (x % 6 === 0 || y % 6 === 0 || (x % 7 > 1 && x % 7 < 5 && y % 7 > 1 && y % 7 < 5) || (x > 13 && (x === 14 || x === 20)) || (y > 13 && (y === 14 || y === 20))) : (x * 7 + y * 13 + x * y) % 3 === 0;
        return on ? `<rect x="${x}" y="${y}" width="1" height="1" fill="#121826"/>` : '';
      }).join('')}</svg>
    </div>
    <div id="paid" style="margin:30px auto 0;width:max-content;display:flex;align-items:center;gap:12px;padding:14px 26px;border-radius:999px;background:#dcfce7;color:#15803d;font-size:28px;font-weight:900">${svgIcon(ICON.check, 34, '#15803d', 3)}Pago</div>
  </div>`;

const body = `
${BG}

<div id="hook" class="hook">Sábado à noite.<br><span style="color:${ORANGE}">Pedido de todo lado.</span></div>
<div id="clock" class="card" style="left:110px;top:610px;width:360px;padding:26px 34px">
  <div style="font-size:30px;font-weight:800;color:#8790a6;letter-spacing:.12em">SÁBADO</div>
  <div style="font-size:120px;font-weight:900;letter-spacing:-.04em;line-height:1">20:30</div>
</div>
<div id="beto" class="abs" style="left:560px;top:640px">${person('pB', ORANGE, { size: 380, hair: '#2b2118' })}</div>
<div id="bName" class="chip" style="left:650px;top:1050px">Beto</div>
<div id="ch1" class="chip" style="left:90px;top:900px">${svgIcon(ICON.chat, 30, '#c6cede')} mensagem</div>
<div id="ch2" class="chip" style="left:120px;top:1000px">balcão</div>
<div id="ch3" class="chip" style="left:80px;top:1100px">telefone</div>

${phone('ph', { left: 330, top: 430, h: 820, search: false, inner: menu })}
<div id="site" class="chip" style="left:60px;top:470px;color:#8db8ff;border-color:#4d8dff">pelo site da loja</div>

<!-- kitchen screen -->
<div id="kds" class="card" style="left:60px;top:440px;width:960px;height:640px;padding:36px 40px;border-color:rgba(255,138,61,.5)">
  <div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:32px;font-weight:900;letter-spacing:.06em;color:#ffb37a">TELA DA COZINHA</div><div id="bell" style="width:84px;height:84px;border-radius:50%;background:${ORANGE};display:grid;place-items:center"><svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div></div>
  <div id="order" style="margin-top:34px;background:#f3f5f9;color:#121826;border-radius:28px;padding:30px 34px">
    <div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:44px;font-weight:900">Novo pedido #128</div><div style="padding:8px 18px;border-radius:999px;background:#dcfce7;color:#15803d;font-size:24px;font-weight:900">Pix pago</div></div>
    <div style="font-size:30px;font-weight:700;margin-top:18px;line-height:1.5">1 Brasa Duplo<br>1 Batata média<br>1 Refrigerante</div>
    <div style="font-size:22px;color:#6a7385;margin-top:10px">Pedido pelo site</div>
  </div>
</div>

<!-- money flow -->
<div id="flow" class="abs" style="left:0;top:0;width:1080px;height:1300px">
  <div class="card" style="left:90px;top:520px;width:300px;height:300px;display:grid;place-items:center;text-align:center"><div><div style="font-size:90px;font-weight:900;color:#32bcad">Pix</div><div style="font-size:28px;font-weight:800;color:#c6cede">do cliente</div></div></div>
  <svg class="abs" style="left:410px;top:640px" width="260" height="60" viewBox="0 0 260 60"><line id="arrowL" x1="0" y1="30" x2="220" y2="30" stroke="${GREEN}" stroke-width="10" stroke-linecap="round"/><path d="M210 6l36 24-36 24" fill="none" stroke="${GREEN}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
  <div class="card" style="left:690px;top:520px;width:300px;height:300px;display:grid;place-items:center;text-align:center;border-color:rgba(34,197,94,.5)"><div><div style="font-size:44px;font-weight:900">Conta do</div><div style="font-size:60px;font-weight:900;color:${GREEN}">Beto</div></div></div>
  <div class="chip" style="left:90px;top:900px;color:#c6cede">direto, sem passar pela Growlift</div>
</div>

<div id="free" class="big" style="top:560px;font-size:96px">A Growlift não cobra<br><span style="color:${GREEN}">nada sobre o pedido.</span></div>
<div id="grow" class="abs" style="left:50%;top:900px;transform:translateX(-50%);padding:24px 54px;border-radius:999px;background:${BLUE};color:#fff;font-size:64px;font-weight:900;white-space:nowrap;box-shadow:0 30px 70px -20px rgba(8,101,254,1)">Plano Grow</div>

${comentaBlock('Quer ver funcionando?', 'PEDIDO')}
`;

const script = `
window.draw=(t)=>{
  show('hook',t,0,5.9,{dy:0,fi:.01});
  show('clock',t,0.05,3.6,{pop:true,sc:.3,dy:0});
  show('beto',t,1.3,5.9,{dy:80}); show('bName',t,1.7,5.9,{pop:true,sc:.4});
  show('ch1',t,3.7,5.9,{pop:true,sc:.4}); show('ch2',t,4.2,5.9,{pop:true,sc:.4}); show('ch3',t,4.7,5.9,{pop:true,sc:.4});
  // the shop's own site
  show('ph',t,5.93,13.4,{dy:120,fi:.5}); show('site',t,6.7,13.4,{pop:true,sc:.4});
  ['i1','i2','i3'].forEach((id,i)=>{show(id,t,7.0+i*.2,13.4,{dy:20}); const a=10.2+i*.45; $(id+'b').style.transform='scale('+(t>a&&t<a+.25?.85:1)+')'; $(id+'b').style.background=t>a?'${GREEN}':'${ORANGE}'; $(id+'b').textContent=t>a?'✓':'+';});
  show('pix',t,12.0,13.4,{dy:0,fi:.25}); show('paid',t,12.7,13.4,{pop:true,sc:.4,dy:0});
  // kitchen
  show('kds',t,13.42,16.6,{dy:60,fi:.4}); show('order',t,13.9,16.6,{pop:true,sc:.2,dy:0});
  if(t>13.9&&t<16.6) $('bell').style.transform='rotate('+(14*Math.sin((t-13.9)*16))+'deg)';
  // money
  show('flow',t,16.66,19.1,{dy:40});
  // no commission, Grow plan
  show('free',t,19.15,22.95,{pop:true,sc:.3,dy:0});
  show('grow',t,21.8,22.95,{pop:true,sc:.4,dy:0,base:'translateX(-50%)'});
  comenta(t,23.0,24.4,'PEDIDO');
};
`;

export const html = () => page({ css: CSS, body, script, captions: CAPS });

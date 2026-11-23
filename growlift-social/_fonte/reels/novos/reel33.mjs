// Reel 33 (23/11, versão 2 em primeira pessoa): "Quatro estrelas de diferença". Same story as the reference Antônio sent (a customer waits half an
// hour with his hand up, starts a one-star review, discovers the table QR and ends giving five stars), told with our
// own 3D restaurant (diorama33.js), our own phone screens and only what our system really does: menu on the table
// QR, the dish in 3D at real size, the order reaching the kitchen with the table number, Pix at the table and the
// Google review button (the same invite for everyone). No frame of the third-party video is used.
// Narration: ElevenLabs "Andre" through Higgsfield (narracao-33-eleven.mp3, 2,25 créditos); captions and scenes follow
// its word timings (faster-whisper). Ending: "Comenta 3D" + follow @growlift.ai.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { page, comentaBlock } from './base.mjs';

export const DURATION = 56.6;
export const COVER = 1.0;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const bundle = () =>
  buildSync({ entryPoints: [path.join(HERE, 'diorama33.js')], bundle: true, format: 'iife', write: false, minify: true, logLevel: 'error', absWorkingDir: path.resolve(HERE, '../../../..') }).outputFiles[0].text;
const img = (f) => `data:image/jpeg;base64,${fs.readFileSync(path.join(HERE, 'img33', f)).toString('base64')}`;
const GLB = path.resolve(HERE, '../../../../plataforma/public/3d/hamburguer-exemplo.glb');

// a QR drawn in SVG (for the camera screen)
function qrSvg(size) {
  let sd = 7; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  const n = 21, s = size / n; let cells = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) && r() > 0.5) cells += `<rect x="${x * s}" y="${y * s}" width="${s}" height="${s}"/>`;
  const f = (x, y) => `<rect x="${x * s}" y="${y * s}" width="${7 * s}" height="${7 * s}"/><rect x="${(x + 1) * s}" y="${(y + 1) * s}" width="${5 * s}" height="${5 * s}" fill="#fff"/><rect x="${(x + 2) * s}" y="${(y + 2) * s}" width="${3 * s}" height="${3 * s}"/>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="#111">${cells}${f(0, 0)}${f(n - 7, 0)}${f(0, n - 7)}</svg>`;
}
const STAR = (cls = '') => `<svg class="st ${cls}" viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z"/></svg>`;

const css = `
body{background:#0b1020}
#gl,#bgblur{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:1}#bgblur{visibility:hidden}
#vig{position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(180deg,rgba(6,8,14,.72),rgba(6,8,14,0) 30%,rgba(6,8,14,0) 70%,rgba(6,8,14,.55))}
#cap{top:440px!important;font-size:66px!important;background:none!important;border:0!important;box-shadow:none!important;color:#fff!important;text-shadow:0 4px 0 rgba(0,0,0,.45),0 0 24px rgba(0,0,0,.55)}#cap .hl{background:none!important;color:#9fd8ff!important;padding:0!important}
#meta{position:absolute;left:0;right:0;top:226px;z-index:30;text-align:center;font-size:26px;font-weight:800;letter-spacing:.2em;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.6);visibility:hidden}
#timer{position:absolute;left:50%;top:274px;z-index:30;display:flex;align-items:center;gap:14px;padding:10px 28px;border-radius:999px;background:rgba(28,8,8,.55);border:4px solid #e5484d;color:#ff6b6b;font-size:24px;font-weight:900;letter-spacing:.08em;font-variant-numeric:tabular-nums;visibility:hidden}#timer span{font-size:40px;letter-spacing:.02em}
#timer i{width:13px;height:13px;border-radius:50%;background:#ff4d4f}
#stars{position:absolute;left:50%;top:352px;z-index:30;display:flex;gap:10px;padding:10px 20px;border-radius:999px;background:rgba(6,8,14,.62);border:1px solid rgba(255,255,255,.12);visibility:hidden}
.st{width:46px;height:46px;fill:none;stroke:#f5c518;stroke-width:1.6}
.st.on{fill:#f5c518}
#pov{position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:20;visibility:hidden}
#phone{position:absolute;left:236px;top:560px;width:608px;height:1250px;border-radius:78px;background:#05070c;border:14px solid #10141d;box-shadow:0 0 0 3px #2a3140,0 70px 140px -30px rgba(0,0,0,.85);overflow:hidden;transform:rotate(-3deg)}
#island{position:absolute;left:50%;top:16px;transform:translateX(-50%);width:160px;height:44px;border-radius:30px;background:#000;z-index:9}
.scr{position:absolute;inset:0;visibility:hidden;overflow:hidden;font-family:Inter,sans-serif}
.sb{height:64px;display:flex;align-items:flex-end;justify-content:space-between;padding:0 40px 6px;font-size:22px;font-weight:700}
#hand{position:absolute;left:140px;top:1580px;width:800px;height:640px;z-index:21;transform:rotate(-3deg)}#finger{position:absolute;left:0;top:0;width:180px;height:620px;z-index:23;visibility:hidden}
#tap{position:absolute;z-index:24;width:110px;height:110px;margin:-55px 0 0 -55px;border-radius:50%;background:rgba(255,255,255,.35);border:4px solid rgba(255,255,255,.9);visibility:hidden}
/* review */
.rv{background:#fff;color:#1f2937;padding:0 34px}
.rv .hd{display:flex;align-items:center;gap:16px;margin-top:40px}.rv .hd span{width:64px;height:64px;border-radius:50%;background:#0865fe;color:#fff;display:grid;place-items:center;font-weight:900;font-size:28px}
.rv .hd b{font-size:28px;display:block}.rv .hd small{font-size:20px;color:#6b7280;font-weight:600}
.rv h4{margin-top:40px;font-size:24px;color:#6b7280;font-weight:700}
.rv .rs{display:flex;gap:14px;margin-top:16px}.rv .rs .st{width:78px;height:78px;stroke:#9ca3af;stroke-width:1.4}.rv .rs .st.on{fill:#f5b400;stroke:#f5b400}
.rv .tx{margin-top:34px;min-height:220px;border:2px solid #d1d5db;border-radius:20px;padding:22px;font-size:28px;line-height:1.35;color:#111827;font-weight:600}
.rv .tx i{display:inline-block;width:3px;height:32px;background:#0865fe;vertical-align:-6px;margin-left:2px}
.rv .pb{margin-top:30px;height:84px;border-radius:42px;background:#0865fe;color:#fff;display:grid;place-items:center;font-size:30px;font-weight:800}
.rv .pb.ok{background:#15803d}
.rv .gl{margin-top:26px;text-align:center;font-size:19px;color:#9ca3af;font-weight:600}
/* scan */
#sScan{background:#0d1018;color:#fff}
#sScan .vf{position:absolute;left:0;right:0;top:0;bottom:0;background:radial-gradient(80% 60% at 50% 45%,#5a3a22,#1d130c 70%)}
#sScan .card{position:absolute;left:146px;top:330px;width:290px;height:390px;background:#fff;border-radius:14px;box-shadow:0 30px 60px -20px #000;transform:rotate(-4deg)}
#sScan .card .bar{height:62px;background:#0865fe;border-radius:14px 14px 0 0;color:#fff;font-weight:900;font-size:30px;display:grid;place-items:center}
#sScan .card .q{position:absolute;left:40px;top:86px}
#sScan .card p{position:absolute;left:0;right:0;bottom:24px;text-align:center;color:#121826;font-size:20px;font-weight:800}
#sScan .fr{position:absolute;left:110px;top:300px;width:360px;height:450px}
#sScan .fr b{position:absolute;width:70px;height:70px;border-color:#fff;border-style:solid;border-width:0}
#sScan .fr .a{left:0;top:0;border-left-width:7px;border-top-width:7px;border-radius:18px 0 0 0}.fr .b{right:0;top:0;border-right-width:7px;border-top-width:7px;border-radius:0 18px 0 0}
#sScan .fr .c{left:0;bottom:0;border-left-width:7px;border-bottom-width:7px;border-radius:0 0 0 18px}.fr .d{right:0;bottom:0;border-right-width:7px;border-bottom-width:7px;border-radius:0 0 18px 0}
#sScan .line{position:absolute;left:120px;width:340px;height:4px;background:#6aa4ff;box-shadow:0 0 18px #6aa4ff}
#sScan .pill{position:absolute;left:50%;top:820px;transform:translateX(-50%);white-space:nowrap;padding:20px 34px;border-radius:999px;background:#fff;color:#0b1220;font-size:28px;font-weight:800;visibility:hidden}
#sScan .pill em{font-style:normal;color:#0865fe}
#sScan .hint{position:absolute;left:0;right:0;top:120px;text-align:center;font-size:24px;font-weight:700;color:#d6dbe6}
/* menu */
#sMenu{background:#f4f6fa}#sMenu img{position:absolute;left:0;top:0;width:580px}
/* item */
#sItem{background:#f4f6fa;color:#121826}
#sItem img{width:580px;height:470px;object-fit:cover;display:block}
#sItem .bd{padding:28px 34px}
#sItem .chip{display:inline-block;padding:6px 16px;border-radius:999px;background:#eaf2ff;color:#0652d1;font-size:20px;font-weight:800}
#sItem h3{margin-top:14px;font-size:44px;font-weight:900;letter-spacing:-.02em}
#sItem p{margin-top:10px;font-size:23px;line-height:1.35;color:#4a5568;font-weight:500}
#sItem .pr{margin-top:18px;font-size:38px;font-weight:900;color:#0865fe}
#sItem .btn{position:absolute;left:34px;right:34px;bottom:230px;height:96px;border-radius:24px;background:#0865fe;color:#fff;display:grid;place-items:center;font-size:31px;font-weight:800}
#sItem .btn.ok{background:#15803d}
/* bill */
#sConta{background:#f4f6fa;color:#121826;padding:0 34px}
#sConta h3{margin-top:30px;font-size:42px;font-weight:900}#sConta .sub{font-size:22px;color:#6a7385;font-weight:600}
#sConta .box{margin-top:26px;background:#fff;border-radius:26px;padding:10px 26px;border:1px solid #dce2ec}
#sConta .ln{display:flex;justify-content:space-between;padding:18px 0;border-bottom:1px solid #eef1f6;font-size:26px;font-weight:600}
#sConta .ln:last-child{border:0;font-size:32px;font-weight:900}
#sConta .btn{margin-top:34px;height:96px;border-radius:24px;background:#0865fe;color:#fff;display:grid;place-items:center;font-size:31px;font-weight:800}
#sConta .pix{margin-top:30px;background:#fff;border-radius:26px;border:1px solid #dce2ec;padding:26px;text-align:center;visibility:hidden}
#sConta .pix p{font-size:22px;color:#4a5568;font-weight:600;margin-top:14px}
#sConta .okk{position:absolute;inset:64px 0 0 0;background:#f4f6fa;display:flex;flex-direction:column;align-items:center;justify-content:center;visibility:hidden}
#sConta .okk span{width:170px;height:170px;border-radius:50%;background:#15803d;display:grid;place-items:center}
#sConta .okk b{margin-top:34px;font-size:44px;font-weight:900}#sConta .okk small{margin-top:10px;font-size:26px;color:#4a5568;font-weight:600}
/* the table app's review card */
#sAval{background:#f4f6fa;color:#121826;padding:0 34px}
#sAval .ok{margin-top:90px;width:120px;height:120px;border-radius:50%;background:#15803d;display:grid;place-items:center}
#sAval h3{margin-top:30px;font-size:44px;font-weight:900;line-height:1.1}
#sAval .card{margin-top:40px;background:#fff;border-radius:26px;border:1px solid #dce2ec;padding:30px}
#sAval .card p{font-size:26px;line-height:1.35;color:#4a5568;font-weight:600}
#sAval .btn{margin-top:26px;height:92px;border-radius:24px;background:#0865fe;color:#fff;display:grid;place-items:center;font-size:30px;font-weight:800}
/* chat */
#sZap{background:#ece5dd;color:#111}
#sZap .top{height:150px;background:#075e54;color:#fff;display:flex;align-items:flex-end;gap:18px;padding:0 26px 20px}
#sZap .top span{width:66px;height:66px;border-radius:50%;background:#f2b134;display:grid;place-items:center;font-weight:900;font-size:30px;color:#3a2a00}
#sZap .top b{font-size:28px;display:block}#sZap .top small{font-size:20px;opacity:.85}
#sZap .msgs{padding:26px 24px}
.zm{max-width:80%;margin-top:18px;padding:14px 18px;border-radius:18px;font-size:26px;line-height:1.3;font-weight:500;visibility:hidden;box-shadow:0 1px 0 rgba(0,0,0,.08)}
.zm.out{margin-left:auto;background:#dcf8c6;border-top-right-radius:4px}.zm.in{background:#fff;border-top-left-radius:4px}
.zm .vid{width:300px;height:390px;border-radius:12px;background:linear-gradient(160deg,#1b2a4a,#0b1020);position:relative;overflow:hidden}
.zm .vid img{width:100%;height:100%;object-fit:cover;opacity:.9}
.zm .vid i{position:absolute;left:50%;top:50%;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;background:rgba(0,0,0,.55)}
.zm .vid i:after{content:'';position:absolute;left:38px;top:28px;border-left:30px solid #fff;border-top:20px solid transparent;border-bottom:20px solid transparent}
.zm small{display:block;text-align:right;font-size:18px;color:#6b7280;margin-top:6px}
#typing{display:flex;gap:8px;width:110px;justify-content:center}#typing i{width:12px;height:12px;border-radius:50%;background:#9ca3af}
/* overlays over the 3D */
.bub{position:absolute;z-index:26;padding:18px 28px;border-radius:30px;background:#fff;color:#0b1220;font-size:40px;font-weight:900;white-space:nowrap;box-shadow:0 20px 40px -18px rgba(0,0,0,.7);visibility:hidden}
.bub:after{display:none}
#later{position:absolute;left:50%;top:236px;z-index:30;padding:10px 26px;border-radius:999px;background:rgba(6,8,14,.7);border:1px solid rgba(255,255,255,.14);color:#e8eefc;font-size:26px;font-weight:800;letter-spacing:.14em;visibility:hidden}
#ar{position:absolute;z-index:26;left:0;top:0;width:1080px;height:1920px;pointer-events:none;visibility:hidden}
#arlab{position:absolute;z-index:27;padding:12px 24px;border-radius:999px;background:#0865fe;color:#fff;font-size:32px;font-weight:900;white-space:nowrap;box-shadow:0 18px 40px -14px rgba(8,101,254,.9);visibility:hidden}
#big{position:absolute;left:0;right:0;top:1300px;z-index:30;text-align:center;visibility:hidden}
#big .row{display:inline-flex;align-items:center;gap:26px;padding:22px 34px;border-radius:40px;background:rgba(6,8,14,.72);border:1px solid rgba(255,255,255,.12)}
#big .row .st{width:58px;height:58px}#big .ar{font-size:60px;color:#fff;font-weight:900}
#dim{position:absolute;inset:0;z-index:44;background:rgba(6,8,14,.9);visibility:hidden}
`;

const hand = `<svg id="hand" viewBox="0 0 800 640">
  <defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dcc0"/><stop offset=".55" stop-color="#ecc9a2"/><stop offset="1" stop-color="#d4a97f"/></linearGradient>
  <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f8a55"/><stop offset=".5" stop-color="#3fa66a"/><stop offset="1" stop-color="#2f8a55"/></linearGradient></defs>
  <rect x="235" y="470" width="350" height="200" rx="60" fill="url(#sg)"/>
  <rect x="225" y="455" width="370" height="46" rx="23" fill="#2a7a4b"/>
  <rect x="150" y="185" width="510" height="315" rx="140" fill="url(#hg)"/>
  <g fill="url(#hg)" stroke="#c99a70" stroke-width="3">
    <rect x="640" y="48" width="104" height="54" rx="27"/><rect x="646" y="112" width="104" height="54" rx="27"/><rect x="640" y="176" width="98" height="52" rx="26"/>
    <rect x="96" y="250" width="66" height="150" rx="33" transform="rotate(-18 129 325)"/><rect x="104" y="120" width="60" height="140" rx="30" transform="rotate(-8 134 190)"/>
  </g>
  <path d="M250 300 q150 60 300 0" stroke="#d4a97f" stroke-width="6" fill="none" opacity=".5"/>
</svg>`;
const finger = `<svg id="finger" viewBox="0 0 180 620">
  <defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9b28a"/><stop offset=".45" stop-color="#f3d6b6"/><stop offset="1" stop-color="#d4a97f"/></linearGradient></defs>
  <rect x="58" y="0" width="64" height="300" rx="32" fill="url(#fg)" stroke="#c99a70" stroke-width="3"/>
  <ellipse cx="90" cy="34" rx="20" ry="16" fill="#f7e3cc"/>
  <path d="M60 150 h60" stroke="#c99a70" stroke-width="3"/>
  <rect x="20" y="250" width="150" height="190" rx="70" fill="url(#fg)" stroke="#c99a70" stroke-width="3"/>
  <rect x="40" y="420" width="120" height="220" rx="40" fill="#3fa66a"/>
</svg>`;

const body = `
<canvas id="gl" width="1080" height="1920"></canvas><canvas id="bgblur" width="1080" height="1920"></canvas>
<div id="vig"></div>
<div id="meta">SÁBADO · 22:40 · MESA 7</div>
<div id="timer"><i></i>ESPERANDO <span id="tm">29:57</span></div>
<div id="stars">${[1, 2, 3, 4, 5].map((i) => STAR().replace('class="st ', `id="s${i}" class="st `)).join('')}</div>
<div id="later">UM TEMPINHO DEPOIS</div>
<div id="bub1" class="bub">Já vou, já vou!</div>
<div id="bub2" class="bub">Com licença! Mesa 7.</div>
<svg id="ar" viewBox="0 0 1080 1920"><line id="arL" stroke="#fff" stroke-width="5" stroke-linecap="round"/><line id="arA" stroke="#fff" stroke-width="5"/><line id="arB" stroke="#fff" stroke-width="5"/></svg>
<div id="arlab">12 cm · tamanho real</div>
<div id="big"><div class="row">${[1, 2, 3, 4, 5].map((i) => STAR(i === 1 ? 'on' : '')).join('')}<span class="ar">→</span>${[1, 2, 3, 4, 5].map(() => STAR('on')).join('')}</div></div>
<div id="pov">
  <div id="phone"><div id="island"></div>
    <div id="sRev1" class="scr rv"><div class="sb"><span>23:12</span><span>●●●</span></div>
      <div class="hd"><span>H</span><div><b>Hamburgueria Exemplo</b><small>Avaliação no Google</small></div></div>
      <h4>Sua nota</h4><div class="rs">${[1, 2, 3, 4, 5].map((i) => STAR().replace('class="st ', `id="r1s${i}" class="st `)).join('')}</div>
      <div class="tx"><span id="r1t"></span><i></i></div><div class="pb">Publicar</div><div class="gl">Sua avaliação é pública</div></div>
    <div id="sScan" class="scr"><div class="vf"></div><div class="hint">Aponte para o QR da mesa</div>
      <div class="card"><div class="bar">MESA 7</div><div class="q">${qrSvg(210)}</div><p>Peça e pague aqui</p></div>
      <div class="fr"><b class="a"></b><b class="b"></b><b class="c"></b><b class="d"></b></div><div class="line" id="scanL"></div>
      <div class="pill" id="scanP">Mesa 7 · <em>Abrir cardápio</em></div></div>
    <div id="sMenu" class="scr"><img id="menuImg" src="${img('cardapio.jpg')}" alt=""></div>
    <div id="sItem" class="scr"><img src="${img('burger.jpg')}" alt=""><div class="bd"><span class="chip">3D · Mesa 7</span><h3>Clássico</h3><p>Pão brioche, blend 160 g, queijo, alface e molho da casa.</p><div class="pr">R$ 34,90</div></div><div class="btn" id="itemB">Enviar para a cozinha</div></div>
    <div id="sConta" class="scr"><div class="sb"><span>23:58</span><span>●●●</span></div><h3>Sua conta</h3><div class="sub">Mesa 7 · Hamburgueria Exemplo</div>
      <div class="box"><div class="ln"><span>1× Clássico</span><span>R$ 34,90</span></div><div class="ln"><span>1× Refrigerante</span><span>R$ 7,00</span></div><div class="ln"><span>Total</span><span>R$ 41,90</span></div></div>
      <div class="btn" id="contaB">Pagar com Pix</div>
      <div class="pix" id="contaPix">${qrSvg(250)}<p>Copia e cola ou aponte a câmera do banco</p></div>
      <div class="okk" id="contaOk"><span><svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span><b>Pago pelo Pix</b><small>Mesa 7 · R$ 41,90</small></div></div>
    <div id="sAval" class="scr"><div class="sb"><span>23:59</span><span>●●●</span></div><div class="ok"><svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
      <h3>Conta fechada.<br>Obrigado pela visita!</h3><div class="card"><p>Sua avaliação no Google ajuda outras pessoas a conhecer a casa.</p><div class="btn">Avaliar no Google</div></div></div>
    <div id="sRev5" class="scr rv"><div class="sb"><span>23:59</span><span>●●●</span></div>
      <div class="hd"><span>H</span><div><b>Hamburgueria Exemplo</b><small>Avaliação no Google</small></div></div>
      <h4>Sua nota</h4><div class="rs">${[1, 2, 3, 4, 5].map((i) => STAR().replace('class="st ', `id="r5s${i}" class="st `)).join('')}</div>
      <div class="tx"><span id="r5t"></span><i></i></div><div class="pb" id="r5b">Publicar</div><div class="gl">Sua avaliação é pública</div></div>
    <div id="sZap" class="scr"><div class="top"><span>R</span><div><b>Rafa</b><small>Hamburgueria</small></div></div>
      <div class="msgs"><div class="zm out" id="z1"><div class="vid"><img src="${img('burger.jpg')}" alt=""><i></i></div>Olha isso pro teu restaurante<small>00:04 ✓✓</small></div>
        <div class="zm in" id="z2"><div id="typing"><i></i><i></i><i></i></div></div>
        <div class="zm in" id="z3">Eu quero!<small>00:05</small></div></div></div>
  </div>
  ${hand}
  ${finger}
  <div id="tap"></div>
</div>
<div id="dim"></div>
${comentaBlock('Tem restaurante?<span style="display:block;margin-top:18px;font-size:40px;font-weight:700;color:#c6cede;letter-spacing:-.01em">Cardápio no QR, prato em 3D e Pix na mesa</span>', '3D', 'dark', 430, 'Segue e comenta')}
`;

const CAPS = [
  [0.0, 1.75, 'Meia hora com a mão levantada!', 'mão levantada'],
  [2.2, 3.15, 'Uma estrela.', 'Uma estrela'],
  [3.75, 4.75, 'Pera, pera!', 'Pera, pera!'],
  [4.75, 5.95, 'Eu só quero pedir.', 'pedir'],
  [6.1, 7.95, 'E a culpa nem é da garçonete:', 'garçonete'],
  [8.0, 10.35, 'são dez mesas e duas mãos.', 'duas mãos'],
  [10.45, 11.5, 'Seu QR?', 'QR'],
  [11.55, 12.85, 'Um PDF.', 'PDF'],
  [12.9, 14.4, 'Olha o que esse aqui faz.', 'esse aqui'],
  [14.5, 16.85, 'Eu escaneio e já tenho o cardápio.', 'cardápio'],
  [16.9, 18.3, 'Sem baixar nada.', 'Sem baixar nada'],
  [18.4, 19.55, 'Antes de pedir,', ''],
  [19.55, 21.75, 'eu vejo o lanche em cima da minha mesa.', 'em cima da minha mesa'],
  [21.8, 23.45, 'Do tamanho de verdade.', 'tamanho de verdade'],
  [23.6, 24.95, 'Peço agora mesmo.', 'agora mesmo'],
  [25.0, 26.45, 'E o pedido chega na cozinha', 'cozinha'],
  [26.45, 28.1, 'com o número da minha mesa.', 'número da minha mesa'],
  [28.35, 30.1, 'Hmm… que delícia!', 'que delícia!'],
  [30.25, 31.1, 'A conta?', ''],
  [31.1, 32.35, 'Não fico esperando:', ''],
  [32.4, 34.2, 'pago aqui mesmo, no Pix.', 'no Pix'],
  [34.2, 35.7, 'Sem chamar ninguém.', 'ninguém'],
  [35.8, 36.95, 'Comi muito bem:', ''],
  [37.0, 38.0, 'cinco estrelas.', 'cinco estrelas'],
  [38.0, 39.05, 'No Google.', 'Google'],
  [39.2, 41.2, 'E agora há pouco eu ia dar uma.', 'uma'],
  [41.35, 42.5, 'A mesma mesa.', ''],
  [42.55, 43.7, 'O mesmo lanche.', ''],
  [43.75, 45.6, 'Quatro estrelas de diferença.', 'Quatro estrelas'],
  [45.7, 48.0, 'Vou mandar pro meu amigo da hamburgueria.', 'amigo'],
];

const script = `
window.MOTION=2;
const L=(a,b,x)=>a+(b-a)*x;
const POVS=[[2.15,3.75,10],[14.5,18.4,10],[23.6,25.1,10],[30.2,39.1,10],[39.1,41.3,3],[45.6,48.0,10]];
const CACHE=[...POVS,[48.0,57,8]];
const SCR=[['sRev1',2.15,3.75],['sScan',14.5,15.75],['sMenu',15.75,18.4],['sItem',23.6,25.1],['sConta',30.2,35.6],['sAval',35.6,36.85],['sRev5',36.85,41.3],['sZap',45.6,48.0]];
const STARS=[[2.45,1],[21.0,2],[25.8,3],[29.2,4],[37.3,5]];
const TAPS=[[2.35,0.6,[338,895]],[24.25,0.5,[545,1500]],[32.45,0.5,[540,1255]],[36.45,0.5,[540,1430]],[37.15,0.45,[700,893]],[38.6,0.5,[540,1388]]];
function side(id,p,dir){const el=$(id);const w=el.offsetWidth,h=el.offsetHeight;let x=dir>0?p.x+70:p.x-70-w;x=Math.max(40,Math.min(1040-w,x));const y=Math.max(690,p.y-h/2);el.style.left=x+'px';el.style.top=y+'px';}
const type=(id,txt,t,a,b)=>{const n=Math.floor(clamp((t-a)/(b-a))*txt.length);const el=$(id);const s=txt.slice(0,n);if(el.textContent!==s)el.textContent=s;};
function place(id,p,dy,below){const el=$(id);el.style.left=(p.x-el.offsetWidth/2)+'px';el.style.top=(below?p.y+dy:p.y-el.offsetHeight-(dy||0))+'px';}
window.draw=(t)=>{
  // phone shots: the restaurant behind is blurred; it is drawn once per shot (same image in every process)
  const pov=POVS.some(([a,b])=>t>=a&&t<b); const wi=CACHE.findIndex(([a,b])=>t>=a&&t<b);
  if(wi>=0){ if(window._bk!==wi){ window.dio.draw(CACHE[wi][0]); const g=$('bgblur').getContext('2d'); g.clearRect(0,0,1080,1920); g.filter='blur('+CACHE[wi][2]+'px) brightness(.85)'; g.drawImage($('gl'),-30,-30,1140,1980); window._bk=wi; }
    $('gl').style.visibility='hidden'; $('bgblur').style.visibility='visible'; }
  else { window.dio.draw(t); $('gl').style.visibility='visible'; $('bgblur').style.visibility='hidden'; }
  const pw=POVS.find(([a,b])=>t>=a&&t<b); show('pov',t,pw?(pw[0]===39.1?30.2:pw[0]):0,pw?(pw[1]===39.1?41.3:pw[1]):0,{dy:120,fi:.35,fo:.2});
  for(const [id,a,b] of SCR) show(id,t,a,b,{dy:0,fi:.18,fo:.12,x:id==='sMenu'||id==='sRev5'||id==='sItem'?50:0});
  // top: when and how long
  show('meta',t,0,14.5,{dy:-10});
  show('timer',t,0.1,14.5,{dy:-10,base:'translateX(-50%)'});
  const sec=Math.min(15,Math.floor(t)); const tot=29*60+57+sec; $('tm').textContent=Math.floor(tot/60)+':'+String(tot%60).padStart(2,'0');
  // stars climbing
  show('stars',t,2.3,48.0,{dy:-10,base:'translateX(-50%)'});
  let n=0; for(const [a,k] of STARS) if(t>=a) n=k;
  for(let i=1;i<=5;i++){const s=$('s'+i);const on=i<=n;s.classList.toggle('on',on);const st=STARS.find(x=>x[1]===i);const kk=st&&t>=st[0]?eoS((t-st[0])/.35):1;s.style.transform='scale('+(on?(1.35-.35*kk):1)+')';}
  // review 1: one star, the angry text
  for(let i=1;i<=5;i++) $('r1s'+i).classList.toggle('on',i===1&&t>=2.4);
  type('r1t','Meia hora esperando. Ninguém me atendeu.',t,2.55,3.6);
  // scan
  $('scanL').style.top=(320+((t*1.6)%1)*410)+'px';
  show('scanP',t,15.15,undefined,{dy:20,base:'translateX(-50%)'});
  $('menuImg').style.transform='translateY('+(-120*eioS((t-16.4)/1.8))+'px)';
  // item → kitchen
  const sent=t>=24.3; const ib=$('itemB'); ib.classList.toggle('ok',sent); const it=sent?'Enviado à cozinha ✓':'Enviar para a cozinha'; if(ib.textContent!==it)ib.textContent=it;
  // bill → Pix → paid
  show('contaPix',t,32.6,undefined,{dy:30});
  show('contaOk',t,33.7,undefined,{dy:0,fi:.25});
  // review 5
  for(let i=1;i<=5;i++) $('r5s'+i).classList.toggle('on',t>=37.05+i*0.08);
  type('r5t','O lanche, nota 10. E nem precisei chamar ninguém.',t,37.55,38.5);
  const pub=t>=38.65; const rb=$('r5b'); rb.classList.toggle('ok',pub); const rt=pub?'Publicado ✓':'Publicar'; if(rb.textContent!==rt)rb.textContent=rt;
  // chat
  show('z1',t,45.95,undefined,{dy:30}); show('z2',t,46.6,47.25,{dy:20}); show('z3',t,47.25,undefined,{dy:20,sc:.06});
  // taps
  const ft=TAPS.find(([a,d])=>t>=a-.35&&t<a+d+.15); const fe=$('finger');
  if(ft&&pov){const k=t<ft[0]?eoS((t-(ft[0]-.35))/.35):1-eoS((t-(ft[0]+ft[1]))/.15);fe.style.visibility='visible';fe.style.transform='translate('+(ft[2][0]-90+(1-k)*120)+'px,'+(ft[2][1]-6+(1-k)*500)+'px) rotate(-14deg)';}else fe.style.visibility='hidden';
  const tp=TAPS.find(([a,d])=>t>=a&&t<a+d); const te=$('tap');
  if(tp&&pov){const k=(t-tp[0])/tp[1];te.style.visibility='visible';te.style.left=tp[2][0]+'px';te.style.top=tp[2][1]+'px';te.style.opacity=String(1-k);te.style.transform='scale('+(.6+.6*k)+')';}else te.style.visibility='hidden';
  // waiter lines (over his head)
  show('bub1',t,0.75,2.15,{dy:16,fi:.25}); if(t>=0.7&&t<2.15) side('bub1',window.dio.waiterHead(),1);
  show('bub2',t,27.0,28.35,{dy:16,fi:.25}); if(t>=26.95&&t<28.4) side('bub2',window.dio.waiterHead(),-1);
  show('later',t,26.95,28.35,{dy:-10,base:'translateX(-50%)'});
  // AR: measuring line across the burger and its label
  const arOn=t>=19.6&&t<23.6;
  show('ar',t,19.6,23.6,{dy:0}); show('arlab',t,19.75,23.6,{dy:14});
  if(arOn){const a=window.dio.project(-0.064,0.82,-0.28,true),b=window.dio.project(0.064,0.82,-0.28,true);
    const set=(id,x1,y1,x2,y2)=>{const e=$(id);e.setAttribute('x1',x1);e.setAttribute('y1',y1);e.setAttribute('x2',x2);e.setAttribute('y2',y2);};
    const k=eoS((t-19.6)/.6); const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
    set('arL',L(mx,a.x,k),L(my,a.y,k),L(mx,b.x,k),L(my,b.y,k)); set('arA',a.x,a.y-18,a.x,a.y+18); set('arB',b.x,b.y-18,b.x,b.y+18);
    place('arlab',{x:mx,y:my},34,true);}
  // four stars of difference
  show('big',t,43.8,45.6,{dy:30});
  // ending
  show('dim',t,48.0,undefined,{dy:0,fi:.5});
  comenta(t,48.1,49.35,'3D');
  if(t>=48.0) $('cap').style.opacity=0;
};
`;

export const html = () => {
  const p = page({ css, body, script, captions: CAPS, brandColor: '#e8eefc' });
  const glb = fs.readFileSync(GLB).toString('base64');
  const boca = fs.readFileSync(path.join(HERE, 'boca33.json'), 'utf8');
  return p
    .replace('<script>', () => `<script>window.BURGER_B64="${glb}";window.BOCA=${boca};</script><script>${bundle()}</script><script>`)
    .replace('</body>', () => `<script>{const r=window.render;window.render=async(t)=>{await window.ready;return r(t);};}</script></body>`);
};

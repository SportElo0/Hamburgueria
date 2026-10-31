// Static preview of each scene of the premium Reel (styleframes), drawn in HTML and rendered with
// Playwright. No Higgsfield: scene 09 only simulates the foam-to-coffee shot that the video will animate.
// Usage: node growlift-social/_fonte/reel-premium/styleframes.mjs   → styleframes/NN-name.png (1080×1920)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'styleframes');
const CAP = (f) => new URL(`capturas/${f}`, import.meta.url).href;
const HD = (f) => new URL(`../assets/hd/${f}`, import.meta.url).href;
const FONTS = new URL('../../../growlift/fonts/', import.meta.url).href;
// Product cutouts that the Salinho site itself serves with a transparent background.
const PECA = (f) => `https://semvo-juquehy.pages.dev/assets/${f}.webp`;
const PROP = (f) => new URL(`../../../public/renders/props/${f}.webp`, import.meta.url).href;

const BLUE = '#0865fe', BLUE_HI = '#4d8dff', RED = '#a3171c', YELLOW = '#f5c242', PETROL = '#0b2a33';

const head = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Anton&family=Instrument+Serif:ital@0;1&display=block" rel="stylesheet">
<style>
@font-face{font-family:Inter;font-weight:100 900;src:url(${FONTS}inter-latin-wght-normal.woff2) format('woff2')}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden}
body{position:relative;font-family:Inter,sans-serif;color:#fff;background:#02050f;-webkit-font-smoothing:antialiased}
.abs{position:absolute}
.grain{position:absolute;inset:0;pointer-events:none;opacity:.10;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.tag{position:absolute;top:70px;left:70px;display:flex;gap:14px;align-items:center;padding:8px 22px 8px 8px;border-radius:999px;background:rgba(0,0,0,.45);backdrop-filter:blur(10px);font:600 24px/1 Inter;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.72);z-index:50}
.tag b{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);padding:10px 16px;border-radius:999px;font-weight:700;color:#fff}
.tag.dark{color:rgba(30,24,18,.75);background:rgba(255,255,255,.6)}.tag.dark b{background:rgba(30,24,18,.08);border-color:rgba(30,24,18,.2);color:#1e1812}
.chips{position:absolute;left:84px;display:flex;flex-direction:column;gap:16px;align-items:flex-start;z-index:40}
.chip{display:inline-flex;align-items:center;height:68px;padding:0 30px;border-radius:999px;font:700 32px/1 Inter;letter-spacing:-.01em;backdrop-filter:blur(16px)}
.chip.sm{height:52px;padding:0 22px;font:600 24px/1 Inter;letter-spacing:.06em;text-transform:uppercase}
.win{border-radius:26px;overflow:hidden;background:#111;box-shadow:0 80px 140px -40px rgba(0,0,0,.75),0 0 0 1.5px rgba(255,255,255,.12)}
.win .bar{display:flex;align-items:center;gap:11px;height:54px;padding:0 22px;background:#1b1b1d}
.win .bar i{width:14px;height:14px;border-radius:50%;background:#3a3a3e}
.win .bar span{margin-left:14px;font:500 20px/1 Inter;color:#9b9ba3;background:#2a2a2e;padding:8px 20px;border-radius:999px}
.win img{display:block;width:100%}
.phone{border-radius:76px;padding:16px;background:#0c0c0e;box-shadow:0 90px 160px -50px rgba(0,0,0,.85),inset 0 0 0 2px rgba(255,255,255,.14)}
.phone img{display:block;width:100%;border-radius:62px}
.serif{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em}
.cond{font-family:Anton,Impact,sans-serif;font-weight:400;text-transform:uppercase;letter-spacing:-.005em}
</style>`;

const tag = (n, t, label, dark = false) => `<div class="tag${dark ? ' dark' : ''}"><b>Prévia ${n}/12</b><span>${t} · ${label}</span></div>`;
const concept = (name, kind, { fg, bg, border }) => `
  <span class="chip" style="color:${fg};background:${bg};border:1.5px solid ${border}">${name} · ${kind}</span>
  <span class="chip sm" style="color:${fg};background:${bg};border:1.5px solid ${border}">Projeto conceito · nome fictício</span>`;

const FRAMES = [
  ['01-hook', `
    <div class="abs" style="left:0;right:0;top:1250px;height:3px;background:linear-gradient(90deg,transparent,${BLUE_HI} 30%,#bcd4ff 50%,${BLUE_HI} 70%,transparent);box-shadow:0 0 40px 6px rgba(77,141,255,.7)"></div>
    <div class="abs" style="left:-200px;right:-200px;top:1000px;height:520px;background:radial-gradient(closest-side,rgba(8,101,254,.30),transparent)"></div>
    <div class="abs" style="left:84px;top:560px;font:800 178px/.92 Inter;letter-spacing:-.05em">SUA<br>MARCA<br>MERECE<br><span style="color:${BLUE_HI}">MAIS.</span></div>
    ${tag('01', '0:00', 'Hook')}<div class="grain"></div>`],

  ['02-provocacao', `
    <div class="abs" style="left:84px;right:84px;top:420px">
      <div style="font:600 64px/1.15 Inter;color:rgba(255,255,255,.62);letter-spacing:-.02em">Não basta estar online.</div>
      <div style="margin-top:44px;font:800 104px/1 Inter;letter-spacing:-.045em">Sua presença precisa <span style="color:${BLUE_HI}">impressionar.</span></div>
    </div>
    <div class="abs" style="left:50%;top:1080px;width:900px;transform:translateX(-50%) perspective(1600px) rotateX(18deg);opacity:.92">
      <div class="win" style="box-shadow:0 0 90px 10px rgba(8,101,254,.35),0 0 0 1.5px rgba(77,141,255,.6)"><div class="bar"><i></i><i></i><i></i><span>seunegocio.com.br</span></div><div style="height:440px;background:radial-gradient(ellipse at 50% 0,rgba(77,141,255,.35),#060a16 70%)"></div></div>
    </div>
    <div class="abs" style="left:0;right:0;top:1480px;height:440px;background:linear-gradient(transparent,#02050f 70%)"></div>
    ${tag('02', '0:03', 'Provocação')}<div class="grain"></div>`],

  ['03-salinho-janela', `
    <div class="abs" style="inset:0;background:radial-gradient(ellipse at 50% 40%,#f6f2ea,#e3dbcd 75%)"></div>
    <div class="abs" style="left:84px;top:250px;color:#2a241d">
      <div class="serif" style="font-size:190px;line-height:.9">Salinho</div>
      <div class="serif" style="font-size:58px;font-style:italic;color:#6b5f50;margin-top:10px">Linho e leveza para celebrar.</div>
    </div>
    <div class="abs" style="left:-40px;top:640px;width:1140px;transform:perspective(2200px) rotateY(-16deg) rotateX(4deg);transform-origin:20% 50%">
      <div class="win"><div class="bar"><i></i><i></i><i></i><span>salinho.com.br</span></div><img src="${CAP('salinho-pc-topo.png')}"></div>
    </div>
    <img class="abs" src="${PECA('linen-short')}" style="left:330px;top:820px;width:640px;filter:drop-shadow(-30px 70px 50px rgba(40,28,15,.55))">
    <div class="chips" style="top:1420px">${concept('Salinho', 'moda de linho', { fg: '#2a241d', bg: 'rgba(255,255,255,.7)', border: 'rgba(42,36,29,.18)' })}</div>
    ${tag('03', '0:05', 'Salinho entra', true)}`],

  ['04-salinho-celular', `
    <div class="abs" style="inset:0;background:radial-gradient(ellipse at 50% 35%,#4a4237,#1d1a15 78%)"></div>
    <div class="abs" style="left:240px;top:200px;width:600px"><div class="phone"><img src="${CAP('salinho-cel-topo.png')}"></div></div>
    ${['linen-long', 'linen-shorts', 'linen-pants', 'linen-short'].map((p, i) => `
      <div class="abs" style="left:${70 + i * 240}px;top:1330px;width:220px;height:260px;border-radius:30px;background:rgba(242,238,229,${i === 3 ? '.96' : '.13'});border:1.5px solid rgba(242,238,229,.3);backdrop-filter:blur(20px);display:grid;place-items:center;box-shadow:0 40px 60px -30px rgba(0,0,0,.8)">
        <img src="${PECA(p)}" style="max-width:170px;max-height:210px;filter:drop-shadow(0 18px 18px rgba(0,0,0,.35))"></div>`).join('')}
    <img class="abs" src="${PECA('linen-short')}" style="left:-70px;top:820px;width:430px;transform:rotate(-8deg);filter:drop-shadow(30px 60px 40px rgba(0,0,0,.6))">
    ${tag('04', '0:07', 'Salinho em destaque')}<div class="grain"></div>`],

  ['05-transicao-iris', `
    <div class="abs" style="inset:0;background:radial-gradient(ellipse at 50% 50%,#4a4237,#1d1a15 80%)"></div>
    <div class="abs" style="left:50%;top:960px;width:1100px;height:1100px;transform:translate(-50%,-50%);border-radius:50%;background:conic-gradient(from 20deg,transparent 0 8%,rgba(242,238,229,.35) 14%,transparent 22% 48%,rgba(242,238,229,.25) 56%,transparent 64% 100%);filter:blur(10px)"></div>
    <div class="abs" style="left:50%;top:960px;width:800px;height:800px;transform:translate(-50%,-50%);border-radius:50%;overflow:hidden;background:radial-gradient(circle,#c5161e,#8f1015 75%);box-shadow:0 0 0 8px rgba(255,214,190,.85),0 0 80px 20px rgba(255,90,60,.55)">
      <div style="position:absolute;left:50%;top:50%;width:1300px;height:1300px;transform:translate(-50%,-50%);background:url(${CAP('chapa77-pc-topo.png')}) no-repeat;background-size:2880px 1800px;background-position:-790px -430px"></div>
    </div>
    <div class="abs" style="left:0;right:0;top:1500px;text-align:center;font:600 34px/1.3 Inter;color:rgba(242,238,229,.75)">o círculo da Salinho gira e abre o vermelho</div>
    ${tag('05', '0:09', 'Transição íris')}<div class="grain"></div>`],

  ['06-chapa77', `
    <div class="abs" style="inset:0;background:radial-gradient(ellipse at 50% 48%,#cf1a22,${RED} 45%,#6e0b0f 100%)"></div>
    <div class="abs cond" style="left:0;right:0;top:470px;text-align:center;font-size:470px;line-height:.86;color:transparent;-webkit-text-stroke:3px rgba(255,190,170,.28)">CHAPA<br>77</div>
    <div class="abs cond" style="left:0;right:0;top:250px;text-align:center;font-size:132px;line-height:1;color:#fff">Isso é Chapa 77.</div>
    <div class="abs" style="left:50%;top:1000px;width:1040px;height:1040px;transform:translate(-50%,-50%);background:url(${CAP('chapa77-pc-topo.png')}) no-repeat;background-size:2880px 1800px;background-position:-920px -580px;-webkit-mask-image:radial-gradient(circle,#000 44%,transparent 51%)"></div>
    <img class="abs" src="${PROP('float-fry-a')}" style="left:-30px;top:520px;width:330px;transform:rotate(-30deg);filter:blur(3px) drop-shadow(0 30px 30px rgba(0,0,0,.4))">
    <img class="abs" src="${PROP('float-fry-b')}" style="left:790px;top:1150px;width:300px;transform:rotate(25deg);filter:blur(5px)">
    <img class="abs" src="${PROP('float-fry-a')}" style="left:820px;top:430px;width:200px;transform:rotate(60deg);filter:blur(7px);opacity:.85">
    <div class="chips" style="top:1420px">${concept('Chapa 77', 'hamburgueria', { fg: '#fff', bg: 'rgba(0,0,0,.28)', border: 'rgba(255,255,255,.3)' })}</div>
    ${tag('06', '0:11', 'Chapa 77')}<div class="grain"></div>`],

  ['07-transicao-amarelo', `
    <div class="abs" style="inset:0;background:${PETROL}"></div>
    ${[0, 1, 2, 3].map((i) => `<div class="abs" style="left:-300px;width:1700px;top:${-60 + i * 150}px;height:110px;background:${YELLOW};transform:rotate(-12deg)"></div>`).join('')}
    <div class="abs" style="left:-60px;right:-60px;top:640px;bottom:-80px;border-radius:120px 120px 0 0;background:${YELLOW};box-shadow:0 -40px 100px rgba(0,0,0,.35)"></div>
    <div class="abs cond" style="left:0;right:0;top:900px;text-align:center;font-size:250px;line-height:.9;color:rgba(110,11,15,.16)">PEÇA<br>AGORA</div>
    <div class="abs" style="left:0;right:0;top:1500px;text-align:center;font:600 34px/1.3 Inter;color:rgba(40,20,0,.7)">o botão amarelo cresce, cobre tudo<br>e vira a faixa do Swell Club</div>
    ${tag('07', '0:13', 'Transição amarelo')}`],

  ['08-swellclub', `
    <div class="abs" style="inset:0;background:radial-gradient(ellipse at 50% 40%,#0f3d4a,${PETROL} 70%)"></div>
    <div class="abs cond" style="left:84px;top:240px;font-size:170px;line-height:.9;color:#fff">A vida<br>pede <span style="color:${YELLOW}">mar.</span></div>
    <div class="abs" style="left:150px;top:640px;width:1020px;transform:perspective(2200px) rotateY(14deg);transform-origin:80% 50%">
      <div class="win"><div class="bar"><i></i><i></i><i></i><span>swellclub.com.br</span></div><img src="${CAP('swellclub-pc-topo.png')}"></div></div>
    <div class="abs" style="left:-220px;right:-220px;top:1250px;height:130px;background:${YELLOW};transform:rotate(-8deg);display:flex;align-items:center;white-space:nowrap;overflow:hidden">
      <span class="cond" style="font-size:78px;color:${PETROL};letter-spacing:.02em">&nbsp;Swell Club · surf shop · Swell Club · surf shop · Swell Club · surf shop · Swell Club</span></div>
    <div class="abs" style="left:70px;top:900px;width:330px;transform:rotate(-5deg)"><div class="phone" style="border-radius:52px;padding:12px"><img style="border-radius:42px" src="${CAP('swellclub-cel-topo.png')}"></div></div>
    <div class="chips" style="top:1440px;left:auto;right:84px;align-items:flex-end">${concept('Swell Club', 'surf shop', { fg: '#fff', bg: 'rgba(11,42,51,.6)', border: 'rgba(245,194,66,.6)' })}</div>
    ${tag('08', '0:15', 'Swell Club')}<div class="grain"></div>`],

  ['09-transicao-espuma-cafe', `
    <div class="abs" style="left:0;right:0;top:0;height:1150px;background:url(${CAP('swellclub-pc-topo.png')}) no-repeat;background-size:5200px 3250px;background-position:-2490px -1950px;filter:saturate(.8)"></div>
    <div class="abs" style="left:0;right:0;top:770px;bottom:0;background:url(${CAP('fornada-pc-topo.png')}) no-repeat;background-size:3600px 2250px;background-position:-2085px -825px;-webkit-mask-image:linear-gradient(transparent,#000 30%)"></div>
    <div class="abs" style="left:0;right:0;top:760px;height:420px;backdrop-filter:blur(18px);-webkit-mask-image:linear-gradient(transparent,#000 40%,#000 60%,transparent)"></div>
    <div class="abs" style="left:84px;right:84px;top:1430px;padding:26px 30px;border-radius:28px;background:rgba(0,0,0,.55);backdrop-filter:blur(14px);font:600 32px/1.35 Inter;color:#fff">Simulação parada. No vídeo, a espuma da onda vira a espuma do café: é a única cena que usa Higgsfield.</div>
    ${tag('09', '0:17', 'Transição espuma → café')}`],

  ['10-fornada', `
    <div class="abs" style="inset:-60px;background:url(${CAP('fornada-pc-topo.png')}) no-repeat;background-size:auto 2100px;background-position:68% 0;filter:blur(24px) brightness(.55)"></div>
    <div class="abs" style="inset:0;background:linear-gradient(100deg,rgba(255,160,80,.28),transparent 45%),linear-gradient(transparent 60%,rgba(18,12,9,.85))"></div>
    <div class="abs serif" style="left:84px;right:84px;top:250px;font-size:96px;line-height:1;color:#f3e7d6;font-style:italic">Entre o mar<br>e a sua mesa.</div>
    <div class="abs" style="left:330px;top:660px;width:480px;transform:rotate(3deg)"><div class="phone"><img src="${CAP('fornada-cel-topo.png')}"></div></div>
    <div class="chips" style="top:480px">${concept('Fornada', 'padaria artesanal', { fg: '#f3e7d6', bg: 'rgba(30,20,14,.6)', border: 'rgba(243,231,214,.3)' })}</div>
    ${tag('10', '0:19', 'Fornada')}<div class="grain"></div>`],

  ['11-ritmo', `
    <div class="abs" style="left:50%;top:930px;width:1500px;transform:translate(-50%,-50%) perspective(1800px) rotateX(38deg) rotateZ(-14deg);display:grid;grid-template-columns:repeat(4,1fr);gap:40px;opacity:.5;-webkit-mask-image:radial-gradient(ellipse at 50% 50%,#000 30%,transparent 70%)">
      ${['salinho', 'chapa77', 'swellclub', 'fornada'].map((s) => `<div class="phone" style="border-radius:44px;padding:10px"><img style="border-radius:36px" src="${CAP(`${s}-cel-topo.png`)}"></div>`).join('')}
    </div>
    <div class="abs" style="inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 20%,#02050f 75%)"></div>
    <div class="abs" style="left:84px;top:620px;font:800 136px/1.05 Inter;letter-spacing:-.05em">
      <div style="color:rgba(255,255,255,.28)">Design.</div><div style="color:rgba(255,255,255,.28)">Tecnologia.</div><div>Experiência<span style="color:${BLUE_HI}">.</span></div></div>
    ${tag('11', '0:22', 'Ritmo')}<div class="grain"></div>`],

  ['12-assinatura', `
    <div class="abs" style="inset:0;background:radial-gradient(ellipse at 50% 72%,#0a2a6e,#02050f 62%)"></div>
    <img class="abs" src="${HD('marca-vidro-vertical.png')}" style="left:50%;top:600px;width:640px;transform:translateX(-50%);mix-blend-mode:screen;-webkit-mask-image:radial-gradient(ellipse 60% 55% at 50% 50%,#000 60%,transparent)">
    <div class="abs" style="left:0;right:0;top:250px;text-align:center;font:800 118px/.95 Inter;letter-spacing:-.05em">SUA MARCA<br>MERECE <span style="color:${BLUE_HI}">MAIS.</span></div>
    <div class="abs" style="left:0;right:0;top:1500px;text-align:center"><div style="font:800 64px/1 Inter;letter-spacing:-.03em">Growlift</div><div style="margin-top:16px;font:500 36px/1 Inter;color:#b8c7e6">growlift.com.br</div></div>
    ${tag('12', '0:25', 'Assinatura')}<div class="grain"></div>`],
];

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const only = process.argv.slice(2);
for (const [name, body] of FRAMES) {
  if (only.length && !only.some((o) => name.startsWith(o))) continue;
  const file = path.join(OUT, `_${name}.html`);
  fs.writeFileSync(file, `<!doctype html><html><head><meta charset="utf-8">${head}</head><body>${body}</body></html>`);
  await page.goto(`file://${file}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  fs.unlinkSync(file);
  console.log(name);
}
await browser.close();

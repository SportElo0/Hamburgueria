// Destaque "Serviços", terceira geração (24/11/2026): o que a Growlift faz, uma frase por story,
// com a marca em 3D do site (growlift/img/lift/m) se montando de um story para o outro.
// Fundo escuro e azul neon, como a parte "O que a Growlift faz" aprovada para o site novo.
//   node growlift-social/_fonte/servicos-v3.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { linkSlot } from './pecas.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../03-destaques/2-servicos');
const SITE = path.resolve(HERE, '../../growlift');
const FONT = pathToFileURL(path.join(SITE, 'fonts/inter-latin-wght-normal.woff2')).href;
const FONT_EXT = pathToFileURL(path.join(SITE, 'fonts/inter-latin-ext-wght-normal.woff2')).href;
const frame = (n) => pathToFileURL(path.join(SITE, `img/lift/m/${String(n).padStart(2, '0')}.webp`)).href;

const ICONS = {
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  phone: '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 12l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 5a2 2 0 0 1 2-2z"/><path d="m16 3 5 5M21 3l-5 5"/>',
  back: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
};

// Só o que o sistema já faz (ver comercial/README.md e a parte aprovada do site).
const ITENS = [
  ['chat', 'O cliente<br><em>chama.</em>', 'Pelo WhatsApp, por ligação ou pelo site.'],
  ['bolt', 'A IA responde<br><em>na hora.</em>', 'De dia e de noite, com os seus preços e horários.'],
  ['phone', 'Ligação perdida<br><em>não fica sem resposta.</em>', 'Se o cliente aceitar, recebe uma mensagem no WhatsApp, e você ganha a tarefa de ligar de volta.'],
  ['back', 'Quem sumiu<br><em>é lembrado.</em>', 'Mandou o orçamento e ele não respondeu? Sai uma retomada, só para quem autorizou.'],
  ['money', 'Você acompanha<br><em>até o pagamento.</em>', 'Cada pedido aparece no seu celular, até virar dinheiro no caixa.'],
];
const QUADROS = [6, 22, 38, 54, 70, 86, 95];

const CSS = `
@font-face{font-family:Inter;font-weight:100 900;src:url(${FONT}) format('woff2');unicode-range:U+0000-00FF,U+2000-206F,U+2191,U+2193,U+2212}
@font-face{font-family:Inter;font-weight:100 900;src:url(${FONT_EXT}) format('woff2');unicode-range:U+0100-02BA,U+1E00-1E9F}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;overflow:hidden;background:#04060c;color:#f3f6ff;font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased;position:relative}
.mark{position:absolute;left:0;right:0;top:380px;height:760px;background-size:cover;background-position:center 40%;-webkit-mask-image:linear-gradient(180deg,transparent,#000 22%,#000 75%,transparent)}
.fade{position:absolute;left:0;right:0;top:880px;height:360px;background:linear-gradient(180deg,rgba(4,6,12,0),#04060c 85%)}
.top{position:absolute;left:96px;right:96px;top:250px}
.label{font-size:36px;font-weight:700;color:#7fb2ff}
.track{display:flex;gap:12px;margin-top:22px}
.track i{height:7px;flex:1;border-radius:7px;background:#1d2740}
.track i.on{background:#2f7dff;box-shadow:0 0 16px rgba(47,125,255,.9)}
.copy{position:absolute;left:96px;right:96px;bottom:330px}
.ico{width:120px;height:120px;border-radius:32px;display:grid;place-items:center;border:2.5px solid rgba(127,178,255,.55);background:rgba(47,125,255,.13);box-shadow:0 0 50px rgba(47,125,255,.4),inset 0 0 26px rgba(47,125,255,.28)}
.ico svg{width:60px;height:60px;fill:none;stroke:#7fb2ff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
h1{margin-top:44px;font-size:112px;line-height:1.0;letter-spacing:-.04em;font-weight:800}
em{font-style:normal;color:#7fb2ff;text-shadow:0 0 40px rgba(47,125,255,.75)}
p.sub{margin-top:34px;font-size:44px;line-height:1.4;color:#b6c1d9}
.next{margin-top:40px;font-size:34px;color:#6b7896;font-weight:600}
.brand{position:absolute;left:96px;bottom:250px;display:flex;align-items:center;gap:16px;font-weight:800;letter-spacing:.14em;font-size:34px;color:#f3f6ff;opacity:.9}
.brand svg{width:46px;height:38px}
`;
const MARCA = '<svg viewBox="50 40 530 415"><path fill="#2f7dff" d="M280 48H410L190 450H55Z"/><path fill="#2f7dff" fill-rule="evenodd" d="M470 130L570 450H258Z M418 220L480 380H309Z"/></svg>';
const page = (n, body) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<div class="mark" style="background-image:url(${frame(QUADROS[n])})"></div><div class="fade"></div>${body}</body></html>`;
const track = (k) => `<div class="track">${ITENS.map((_, i) => `<i class="${i < k ? 'on' : ''}"></i>`).join('')}</div>`;

const stories = [
  page(0, `<div class="copy"><h1>O que a<br>Growlift faz,<br><em>em poucas palavras.</em></h1>
    <p class="sub">5 coisas que o sistema faz pelo seu negócio. Toque para ver.</p></div>
    <div class="brand">${MARCA}GROWLIFT</div>`),
  ...ITENS.map(([ic, t, s], i) => page(i + 1, `<div class="top"><div class="label">O que a Growlift faz · ${i + 1} de 5</div>${track(i + 1)}</div>
    <div class="copy"><div class="ico"><svg viewBox="0 0 24 24">${ICONS[ic]}</svg></div><h1>${t}</h1><p class="sub">${s}</p></div>`)),
  page(6, `<div class="top"><div class="label">O que a Growlift faz</div>${track(5)}</div>
    <div class="copy" style="bottom:640px"><h1 style="font-size:104px">Tudo isso num sistema só,<br><em>montado para o seu negócio.</em></h1></div>
    ${linkSlot('Toque no link e peça o diagnóstico grátis', 1330)}`),
];

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const old = (await fs.readdir(OUT)).filter((f) => /^\d\d\.png$/.test(f));
for (const f of old) await fs.rm(path.join(OUT, f));
for (const [i, html] of stories.entries()) {
  const file = path.join(HERE, 'html', `servicos-v3-${i + 1}.html`);
  await fs.writeFile(file, html);
  await pg.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: path.join(OUT, `${String(i + 1).padStart(2, '0')}.png`) });
}
await browser.close();
console.log(`${stories.length} stories em ${path.relative(process.cwd(), OUT)}`);

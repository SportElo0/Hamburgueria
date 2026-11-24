// Destaque "Serviços", terceira geração (24/11/2026): o que a Growlift faz, uma frase por story,
// com a marca em 3D do site (growlift/img/lift/m) se montando de um story para o outro.
// Fundo escuro e azul neon, como a parte "O que a Growlift faz" aprovada para o site novo.
//   node growlift-social/_fonte/servicos-v3.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { linkSlot, storyServiceV2 } from './pecas.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../03-destaques/2-servicos');
const SITE = path.resolve(HERE, '../../growlift');
const FONT = pathToFileURL(path.join(SITE, 'fonts/inter-latin-wght-normal.woff2')).href;
const FONT_EXT = pathToFileURL(path.join(SITE, 'fonts/inter-latin-ext-wght-normal.woff2')).href;
const shot = (f) => pathToFileURL(path.join(HERE, 'assets/stories/servicos', f)).href;
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
// Uma tela de verdade do sistema em cada story (painel e demonstração, empresas e dados fictícios).
const TELAS = [
  { f: 'atendimento.png', w: 820, tipo: 'tela', nota: 'Painel · conversas de todos os canais' },
  { f: 'site-ia.png', w: 540, tipo: 'cel', nota: 'Chat do site, 23h12' },
  { f: 'ligacao.png', w: 500, tipo: 'cel', nota: 'Quem ligou ouve isto no celular' },
  { f: 'retomada.png', w: 640, tipo: 'tela', nota: 'Quadro de pedidos e retomada' },
  { f: 'avisos.png', w: 820, tipo: 'tela', nota: 'Avisos do painel, também no celular' },
];

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
.shotwrap{position:absolute;left:0;right:0;top:370px;height:800px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start}
.shotbox{position:relative;border-radius:36px;overflow:hidden;border:3px solid rgba(127,178,255,.55);box-shadow:0 0 70px rgba(47,125,255,.45),0 40px 90px -30px #000;background:#fff;max-height:700px}
.shotbox.cel{border-radius:56px;border-width:4px;max-height:700px}
.shotbox img{display:block;width:100%}
.demo{margin-top:22px;font-size:28px;color:#9aa6c0;font-weight:600;text-align:center}
.demo b{color:#7fb2ff}
.copy.low{bottom:300px}
.copy.low h1{font-size:96px;margin-top:0}
.copy.low p.sub{font-size:40px;margin-top:24px}
.brand{position:absolute;left:96px;bottom:250px;display:flex;align-items:center;gap:16px;font-weight:800;letter-spacing:.14em;font-size:34px;color:#f3f6ff;opacity:.9}
.brand svg{width:46px;height:38px}
`;
const MARCA = '<svg viewBox="50 40 530 415"><path fill="#2f7dff" d="M280 48H410L190 450H55Z"/><path fill="#2f7dff" fill-rule="evenodd" d="M470 130L570 450H258Z M418 220L480 380H309Z"/></svg>';
const page = (n, body) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<div class="mark" style="background-image:url(${frame(QUADROS[n])})"></div><div class="fade"></div>${body}</body></html>`;
const pageTela = (body) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${CSS}</style></head><body><div style="position:absolute;left:-200px;top:200px;width:1480px;height:900px;background:radial-gradient(closest-side,rgba(47,125,255,.28),transparent)"></div>${body}</body></html>`;
// Do 02 ao 06: como os stories antigos (selo, título, imagem e 3 checks), cada um numa cor.
const SERVICOS = [
  { chip: 'Atendimento', titulo: 'Todas as conversas', lead: 'WhatsApp, site e ligações num lugar só.', cor: '#0865fe',
    tela: 'atendimento.png', tipo: 'tela', itens: ['Ninguém fica sem resposta', 'Você vê quem a IA atende e quem espera', 'A equipe toda no mesmo painel'] },
  { chip: 'Atendente de IA', titulo: 'Resposta na hora', lead: 'De dia e de noite, com os seus preços.', cor: '#00b3a4',
    tela: 'site-ia.png', tipo: 'cel', itens: ['Faz orçamento e marca na agenda', 'Entende áudio', 'Chama a equipe quando precisa'] },
  { chip: 'Ligação perdida', titulo: 'Ninguém atendeu?', lead: 'A ligação vira conversa no WhatsApp.', cor: '#7c4dff',
    tela: 'ligacao.png', tipo: 'cel', itens: ['Só para quem apertou 1', 'Você ganha a tarefa de retornar', 'Aviso no celular na hora'] },
  { chip: 'Retomada', titulo: 'Quem sumiu volta', lead: 'Mandou o orçamento e ele sumiu?', cor: '#ff7a3d',
    tela: 'retomada.png', tipo: 'tela', itens: ['Mensagem só para quem autorizou', 'Para quando ele responde', 'Cada pedido num quadro, até o ganho'] },
  { chip: 'Avisos e vendas', titulo: 'Tudo no seu celular', lead: 'Cada pedido acompanhado até o pagamento.', cor: '#16c172',
    tela: 'avisos.png', tipo: 'tela', itens: ['Aviso de pedido novo e de ligação', 'Resumo do dia', 'Relatório do que foi pago'] },
];
const fundo = (cor) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="180"><defs><radialGradient id="g" cx="30%" cy="35%" r="70%"><stop offset="0" stop-color="${cor}"/><stop offset="1" stop-color="#06080d"/></radialGradient></defs><rect width="100" height="180" fill="url(#g)"/></svg>`);
const etiqueta = '<span style="position:absolute;left:24px;top:24px;z-index:3;font-size:24px;font-weight:600;color:#e8eefa;background:rgba(6,8,13,.75);border:1.5px solid rgba(255,255,255,.2);padding:8px 18px;border-radius:999px">Demonstração · dados fictícios</span>';
const tela = (sv) => sv.tipo === 'cel'
  ? `<div style="position:absolute;inset:0;display:flex;justify-content:center"><div style="position:relative;width:440px;max-height:680px;align-self:flex-start;border-radius:52px;overflow:hidden;border:3px solid rgba(255,255,255,.25);box-shadow:0 50px 100px -30px rgba(0,0,0,.9),0 0 80px -20px ${sv.cor}"><img src="${shot(sv.tela)}" style="display:block;width:100%"></div></div>${etiqueta}`
  : `<div style="position:absolute;inset:0;border-radius:34px;overflow:hidden;background:#fff;border:1.5px solid rgba(255,255,255,.2);box-shadow:0 60px 120px -40px rgba(0,0,0,.95),0 0 90px -30px ${sv.cor};display:flex;align-items:flex-start;padding-top:72px"><img src="${shot(sv.tela)}" style="display:block;width:100%"></div>${etiqueta}`;
const track = (k) => `<div class="track">${ITENS.map((_, i) => `<i class="${i < k ? 'on' : ''}"></i>`).join('')}</div>`;

const stories = [
  page(0, `<div class="copy"><h1>O que a<br>Growlift faz,<br><em>em poucas palavras.</em></h1>
    <p class="sub">5 coisas que o sistema faz pelo seu negócio. Toque para ver.</p></div>
    <div class="brand">${MARCA}GROWLIFT</div>`),
  ...SERVICOS.map((sv, i) => storyServiceV2({
    index: `${i + 1}/5`, plan: sv.chip, title: sv.titulo, lead: sv.lead, items: sv.itens, bg: fundo(sv.cor),
    visual: tela(sv),
  }).replace('<head>', `<head><base href="${pathToFileURL(path.join(HERE, 'assets') + '/').href}">`)),
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

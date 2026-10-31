// Gera os Reels da Growlift em MP4 (1080×1920, 30 fps, sem áudio: a música entra no app).
//   node growlift-social/_fonte/reels/gerar-reels.mjs            → todos
//   node growlift-social/_fonte/reels/gerar-reels.mjs 4 5        → só esses
// Os textos seguem 05-reels/roteiros.md. As gravações são do site real (growlift/), servido localmente.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TOKENS, MARK, icon } from '../pecas.mjs';
import { renderReel, reelPage, captureSite, phone, playSeq, close, launch, tmpDir, FPS } from './motor.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const OUT = path.join(ROOT, 'growlift-social/05-reels');
const ASSETS = path.resolve(HERE, '../assets');
const asset = (f) => pathToFileURL(path.join(ASSETS, f)).href;

// ---------------------------------------------------------------------------------------
// Blocos de cena

const hook = (title, { eyebrow = '', lead = '', art = '' } = {}) => `
  <div class="glow" style="width:1400px;height:1400px;left:-420px;top:-300px;opacity:.55"></div>
  <div class="grid"></div>
  ${art}
  <div class="safe" style="justify-content:center">
    ${eyebrow ? `<p class="eyebrow" style="margin-bottom:34px">${eyebrow}</p>` : ''}
    <h1 class="h1" style="font-size:112px">${title}</h1>
    ${lead ? `<p class="lead" data-in=".5" style="font-size:44px;margin-top:40px">${lead}</p>` : ''}
  </div>`;

const end = (title, { lead = 'Link na bio.', note = '' } = {}) => `
  <div class="glow" style="width:1500px;height:1500px;left:-210px;top:260px;opacity:.6"></div>
  <div class="safe" style="justify-content:center;align-items:flex-start">
    <div data-in="0" style="width:200px;margin-bottom:70px">${MARK}</div>
    <h1 class="h1" data-in=".15" style="font-size:100px">${title}</h1>
    <div data-in=".45" style="margin-top:56px"><span class="btn" style="font-size:40px;padding:28px 52px">${lead}</span></div>
    <p class="muted" data-in=".7" style="font-size:32px;margin-top:40px">growlift.com.br</p>
    ${note ? `<p class="muted" data-in=".9" style="font-size:26px;margin-top:70px;max-width:760px;line-height:1.35">${note}</p>` : ''}
  </div>`;

/** Texto em cima, celular com a gravação do site embaixo. */
const demo = (title, seq, { eyebrow = '', tag = '', size = 70 } = {}) => `
  <div class="glow" style="width:1300px;height:1300px;left:-110px;top:620px;opacity:.55"></div>
  <div style="position:absolute;left:96px;right:120px;top:250px">
    ${eyebrow ? `<p class="eyebrow" style="margin-bottom:20px">${eyebrow}</p>` : ''}
    <h2 class="h1" style="font-size:${size}px;line-height:1.05">${title}</h2>
  </div>
  ${phone(560, seq)}
  ${tag ? `<div style="position:absolute;left:96px;top:486px;z-index:5"><span class="tag">${tag}</span></div>` : ''}`;

const sinal = (n, text, art) => `
  <div class="glow" style="width:1300px;height:1300px;right:-500px;top:500px;opacity:.5"></div>
  <div class="safe">
    <p class="eyebrow">Sinal ${n} de 3</p>
    <h2 class="h1" style="font-size:80px;margin-top:26px;line-height:1.05">${text}</h2>
    <div style="margin:auto 0">${art}</div>
  </div>`;

const MODELS = path.resolve(HERE, '../../../tools/growlift-models');
const photo = (f) => pathToFileURL(path.join(MODELS, f)).href;
const tile = ([f, pos], i) => `<div style="aspect-ratio:1;border-radius:14px;background:url('${photo(f)}') ${pos}/${i % 2 ? '170%' : 'cover'} no-repeat #111"></div>`;

// ---------------------------------------------------------------------------------------
// Servidor local do site real, para as gravações

function serve(dir, port) {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.mp4': 'video/mp4', '.webm': 'video/webm', '.json': 'application/json' };
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html');
    const file = path.join(dir, path.normalize(rel));
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
    const data = fs.readFileSync(file);
    const range = /bytes=(\d+)-(\d*)/.exec(req.headers.range || '');
    const type = types[path.extname(file)] || 'application/octet-stream';
    if (range) {
      const a = +range[1], z = range[2] ? +range[2] : data.length - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${z}/${data.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': z - a + 1 }).end(data.subarray(a, z + 1));
    } else res.writeHead(200, { 'Content-Type': type, 'Content-Length': data.length, 'Accept-Ranges': 'bytes' }).end(data);
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}
const SITE_PORT = 8391;
const SITE = `http://localhost:${SITE_PORT}/`;

const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const sectionTop = (page, id) => page.evaluate((id) => { const e = document.getElementById(id); return [e.offsetTop, e.offsetHeight, innerHeight]; }, id);

// ---------------------------------------------------------------------------------------
// Bastidores: as três etapas do modelo, fotografadas do próprio arquivo

async function modelStages(file) {
  const b = await launch();
  const dir = tmpDir('modelo-etapas');
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const shots = [];
  for (const [n, fix] of [
    ['0', () => { document.querySelectorAll('style, link[rel=stylesheet]').forEach((e) => e.remove()); document.querySelectorAll('img').forEach((i) => (i.style.display = 'none')); }],
    ['1', () => { document.querySelectorAll('img').forEach((i) => (i.style.visibility = 'hidden')); }],
    ['2', () => {}],
  ]) {
    await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle' });
    await page.evaluate(fix);
    const out = path.join(dir, `${n}.png`);
    await page.screenshot({ path: out });
    shots.push(pathToFileURL(out).href);
  }
  await page.close();
  return shots;
}

// ---------------------------------------------------------------------------------------
// Loja de demonstração: o painel real (plataforma/) rodando aqui, com dados só desta máquina.
// Nome fictício, Pix de demonstração (nada é cobrado) e um pedido de teste.

const DEMO_SLUG = 'brasa-burger';
const DEMO_PORT = 3119;

function demoStore({ tables = false } = {}) {
  const item = (id, name, description, price, options = []) => ({ id, name, description, price, priceLabel: '', image: '', imageAlt: '', available: true, featured: false, tags: [], options });
  return {
    slug: DEMO_SLUG, name: 'Brasa Burger', segment: 'restaurante', siteUrl: '',
    contact: { whatsapp: '', instagram: '', email: '', phone: '' }, units: [], notice: { active: false, text: '' },
    catalog: { categories: [
      { id: 'burgers', name: 'Burgers', description: '', items: [
        item('brasa-classico', 'Brasa Clássico', 'Pão brioche, blend 160 g, cheddar e molho da casa.', 3290),
        item('brasa-duplo', 'Brasa Duplo', 'Dois blends de 160 g, cheddar duplo e bacon.', 4190),
      ] },
      { id: 'acompanhamentos', name: 'Acompanhamentos', description: '', items: [item('batata-rustica', 'Batata rústica', 'Porção para dois.', 1890)] },
      { id: 'bebidas', name: 'Bebidas', description: '', items: [item('refri-lata', 'Refrigerante lata', '350 ml.', 700)] },
    ] },
    extra: {},
    account: { plan: 'parceiro', changeLimit: null, partnerUntil: '', monthlyFee: null, notes: 'Loja de demonstração para o Reel do plano Lift. Nome fictício.' },
    ordering: { enabled: true, delivery: true, pickup: true, minOrder: 0, eta: '40 a 60 min', pix: true, card: true, cash: true, pixMode: 'demo', coupons: [], areas: [{ id: 'centro', name: 'Centro', fee: 600 }], ...(tables ? { tables: { enabled: true, count: 12 } } : {}) },
  };
}

async function startDemoStore(opts = {}) {
  const app = path.join(ROOT, 'plataforma');
  if (!fs.existsSync(path.join(app, '.next', 'BUILD_ID'))) throw new Error('Rode "npm run build" em plataforma/ antes do Reel 8.');
  const data = tmpDir('loja-demo');
  const w = (key, v) => { const f = path.join(data, key); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(v)); };
  const now = new Date().toISOString();
  const rec = { store: demoStore(opts), updatedAt: now, updatedBy: 'reel', publishedAt: now };
  w(`lojas/${DEMO_SLUG}/rascunho.json`, rec);
  w(`lojas/${DEMO_SLUG}/publicado.json`, rec);
  w(`lojas/${DEMO_SLUG}/operacao.json`, { open: true, updatedAt: null, updatedBy: '' });

  const secret = crypto.randomBytes(32).toString('hex');
  const proc = spawn('npx', ['next', 'start', '-p', String(DEMO_PORT)], {
    cwd: app, detached: true, stdio: ['ignore', fs.openSync(path.join(data, 'painel.log'), 'a'), fs.openSync(path.join(data, 'painel.log'), 'a')],
    env: { ...process.env, SESSION_SECRET: secret, PLATAFORMA_DATA_DIR: data, ADMIN_USERS: '[]', BLOB_READ_WRITE_TOKEN: '' },
  });
  const url = `http://localhost:${DEMO_PORT}`;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${url}/login`)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  // Mesma assinatura do painel (src/lib/session.ts), com o segredo só desta execução.
  const b64 = (b) => Buffer.from(b).toString('base64url');
  const body = b64(JSON.stringify({ email: 'demo@teste.local', name: 'Loja de demonstração', role: 'equipe', exp: Date.now() + 3_600_000 }));
  const cookie = `${body}.${b64(crypto.createHmac('sha256', secret).update(body).digest())}`;
  const api = `${url}/api/public/lojas/${DEMO_SLUG}/pedidos`;
  return {
    url, cookie,
    /** The QR key of a table (src/lib/mesas.ts tableKey), with this run's secret. */
    tableKey: (n) => crypto.createHmac('sha256', secret).update(`mesa:${DEMO_SLUG}:${n}`).digest('base64url').slice(0, 16),
    async placeOrder() {
      const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        items: [{ productId: 'brasa-duplo', quantity: 1 }, { productId: 'brasa-classico', quantity: 1 }, { productId: 'batata-rustica', quantity: 1 }],
        customer: { name: 'Cliente de teste', phone: '11900000000' }, mode: 'entrega',
        address: { areaId: 'centro', street: 'Rua de Exemplo, 100', reference: '' }, payment: 'pix',
      }) });
      const out = await res.json();
      if (!res.ok) throw new Error(`pedido de teste: ${out.error}`);
      return out;
    },
    async payPix(order) {
      const res = await fetch(`${api}/${order.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'simular-pix', token: order.token }) });
      if (!res.ok) throw new Error('Pix de demonstração falhou');
    },
    async stop() { try { process.kill(-proc.pid); } catch {} },
  };
}

// ---------------------------------------------------------------------------------------
// Reel 10: cenas com motion (o movimento está em mesa-motion.js)

const svgI = (paths, size = 44, color = TOKENS.blueBright, width = 1.8) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const I = {
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  bag: '<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  flame: '<path d="M12 3c2 3 5 5 5 9.5a5 5 0 0 1-10 0C7 10 8.5 8.5 9.5 7c.3 1.5 1.2 2.5 2.5 3 0-2.5-.5-4.5 0-7z"/>',
  receipt: '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  ticket: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
};

/** A small fake QR (decorative): three finder squares and seeded modules. */
function qrSvg(size) {
  const n = 25;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#0b0f17"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#0b0f17"/>`;
  const inFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  let cells = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!inFinder(x, y) && rnd() > 0.52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  return `<svg width="${size}" height="${size}" viewBox="-1 -1 ${n + 2} ${n + 2}" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><g fill="#0b0f17">${cells}</g>${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`;
}

const MOTION_CSS = `
.w{display:inline-block;opacity:0;will-change:transform}
.title{position:absolute;left:96px;right:96px;top:250px}
.step{display:flex;align-items:center;gap:20px;margin-bottom:22px}
.badge{width:68px;height:68px;border-radius:50%;background:${TOKENS.blue};color:#fff;display:grid;place-items:center;font-size:38px;font-weight:800;box-shadow:0 0 0 10px rgba(8,101,254,.18),0 20px 40px -12px rgba(8,101,254,.9);opacity:0}
.chip{position:absolute;display:flex;align-items:center;gap:16px;padding:20px 30px;border-radius:999px;background:rgba(15,21,32,.92);border:1.5px solid rgba(77,141,255,.45);font-size:36px;font-weight:700;color:${TOKENS.text};box-shadow:0 30px 60px -20px rgba(0,0,0,.8),0 0 40px -10px rgba(8,101,254,.6);opacity:0;z-index:10;white-space:nowrap}
.chip .ic{width:58px;height:58px;border-radius:50%;background:rgba(8,101,254,.18);display:grid;place-items:center}
.flyer{position:absolute;left:0;top:0;opacity:0;z-index:12}
.plus{background:${TOKENS.blue};color:#fff;font-weight:800;font-size:40px;padding:12px 26px;border-radius:999px;box-shadow:0 18px 40px -10px rgba(8,101,254,.95)}
.note-card{position:absolute;width:420px;padding:24px 28px;border-radius:30px;background:#fff;color:#111827;box-shadow:0 40px 80px -20px rgba(0,0,0,.85);display:flex;gap:20px;align-items:center;opacity:0;z-index:10}
.note-card b{display:block;font-size:34px;letter-spacing:-.01em}
.note-card span{font-size:26px;color:#4b5563}
.note-card .ic{flex:none;width:76px;height:76px;border-radius:22px;display:grid;place-items:center}
.ring{transform-box:fill-box;transform-origin:50% 10%}
.demo-tag{position:absolute;left:0;right:0;top:1548px;text-align:center;z-index:9}
.phone .screen img.still{display:block;width:100%;height:100%;object-fit:cover}
`;

function mesaReelHtml({ recA, recB, recS }) {
  const rec = (r, cls = 'rec') => `<img class="${cls}" data-seq="${pathToFileURL(r.dir).href}" data-count="${r.count}" src="${pathToFileURL(path.join(r.dir, '00000.jpg')).href}" alt="">`;
  const phoneAt = (top, inner, cls = '', style = '') => `<div class="phone ${cls}" style="top:${top}px;${style}"><div class="screen">${inner}</div></div>`;
  const ws = (text, t0, step = 0.09, cls = '') => text.split(' ').map((w, i) => `<span class="w ${cls}" data-t="${(t0 + i * step).toFixed(2)}">${w}</span>`).join(' ');
  const title = (n, eyebrow, a, b, size = 66) => `<div class="title"><div class="step"><div class="badge">${n}</div><p class="eyebrow">${eyebrow}</p></div><h2 class="h1" style="font-size:${size}px;line-height:1.06">${ws(a, 0.15)} ${ws(b, 0.15 + a.split(' ').length * 0.09, 0.09, 'blue')}</h2></div>`;
  const tag = '<div class="demo-tag"><span class="tag">Projeto conceito · loja de demonstração · nome fictício</span></div>';
  const chip = (cls, ic, text, pos) => `<div class="chip ${cls}" style="${pos}"><span class="ic">${svgI(ic, 34)}</span>${text}</div>`;

  // 0. Salão
  const tables = [[230, 930], [540, 890], [850, 950], [230, 1310], [540, 1370], [850, 1300]];
  const tableSvg = tables.map(([x, y], i) => `<g class="tbl" style="transform-box:fill-box;transform-origin:center;opacity:0"><g transform="translate(${x},${y})">
      ${[[0, -112], [0, 112], [-112, 0], [112, 0]].map(([cx, cy]) => `<rect x="${cx - 26}" y="${cy - 18}" width="52" height="36" rx="12" fill="#121a28" stroke="#2b3a55" stroke-width="3"/>`).join('')}
      <circle r="82" fill="#0f1520" stroke="${i === 4 ? TOKENS.blueBright : '#33476b'}" stroke-width="${i === 4 ? 5 : 3}"/>
      <circle r="18" cx="-28" cy="-14" fill="none" stroke="#2b3a55" stroke-width="3"/><circle r="18" cx="26" cy="18" fill="none" stroke="#2b3a55" stroke-width="3"/>
      <text y="${i === 4 ? 10 : 8}" text-anchor="middle" font-size="${i === 4 ? 40 : 30}" font-weight="800" fill="${i === 4 ? TOKENS.blueBright : '#5b6b88'}" font-family="Inter">${i + 1}</text></g></g>`).join('');
  const asks = [[230, 780], [850, 800], [540, 1220]].map(([x, y]) => `<g class="ask" style="transform-box:fill-box;transform-origin:50% 100%;opacity:0"><g transform="translate(${x - 52},${y - 104})">
      <path d="M14 0h76a14 14 0 0 1 14 14v52a14 14 0 0 1-14 14H62l-10 14-10-14H14A14 14 0 0 1 0 66V14A14 14 0 0 1 14 0z" fill="${TOKENS.blue}"/>
      <g transform="translate(28,16) scale(2)"><g class="ring" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${I.bell}</g></g></g></g>`).join('');
  const path0 = [[60, 1120], [385, 1110], [540, 1140], [700, 1110], [1010, 1120], [700, 1530], [385, 1530], [540, 1170]];
  const trail = Array.from({ length: 8 }, () => `<circle class="trail" r="13" fill="${TOKENS.blueBright}" opacity="0"/>`).join('');
  const s0 = `<div class="glow" style="width:1400px;height:1400px;left:-420px;top:-300px;opacity:.5"></div><div class="grid"></div>
    <div class="title"><h1 class="h1" style="font-size:108px">${ws('Salão cheio.', 0.05, 0.12)}<br>${ws('Garçom correndo.', 0.35, 0.14, 'blue')}</h1>
      <p class="lead" style="font-size:42px;margin-top:30px">${ws('E se a mesa pedisse pelo celular, sem app?', 2.1, 0.08)}</p></div>
    <div class="floor" data-path='${JSON.stringify(path0)}' style="position:absolute;inset:0;transform-origin:540px 1370px">
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style="position:absolute;inset:0">${tableSvg}${trail}<circle class="waiter" r="22" fill="${TOKENS.blue}" stroke="#fff" stroke-width="5" opacity="0"/>${asks}</svg></div>`;

  // 1. QR na mesa
  const s1 = `<div class="glow" style="width:1300px;height:1300px;left:-110px;top:600px;opacity:.5"></div>
    ${title(1, 'Plano Scale · em breve', 'O cliente lê', 'o QR da mesa.')}
    <div class="stage" style="position:absolute;inset:0;transform-origin:540px 1100px">
      <div class="tent" style="position:absolute;left:300px;top:720px;width:480px;height:660px;border-radius:36px;background:#f6f3ee;box-shadow:0 60px 120px -30px rgba(0,0,0,.9);display:flex;flex-direction:column;align-items:center;padding-top:40px;opacity:0">
        <p style="font-size:30px;font-weight:700;letter-spacing:.2em;color:#8a6a3b">BRASA BURGER</p>
        <p style="font-size:92px;font-weight:800;letter-spacing:-.04em;color:#111;line-height:1;margin-top:6px">MESA 5</p>
        <div style="margin-top:26px;padding:14px;background:#fff;border-radius:18px">${qrSvg(300)}</div>
        <p style="font-size:26px;color:#6b5a44;margin-top:20px">Aponte a câmera do celular</p>
      </div>
      <div style="position:absolute;left:376px;top:928px;width:328px;height:328px">
        <div class="scanline" style="position:absolute;left:-14px;right:-14px;height:8px;margin-top:-4px;border-radius:8px;background:${TOKENS.blueBright};box-shadow:0 0 30px 8px rgba(77,141,255,.85);opacity:0"></div>
        ${['top:-20px;left:-20px;border-width:8px 0 0 8px', 'top:-20px;right:-20px;border-width:8px 8px 0 0', 'bottom:-20px;left:-20px;border-width:0 0 8px 8px', 'bottom:-20px;right:-20px;border-width:0 8px 8px 0'].map((p) => `<div class="corner" style="position:absolute;width:70px;height:70px;border:solid ${TOKENS.blueBright};border-radius:10px;opacity:0;${p}"></div>`).join('')}
      </div>
      <div class="cam" style="position:absolute;left:50%;top:600px;width:640px;height:980px;border-radius:80px;border:10px solid #1a2130;box-shadow:0 0 0 2px rgba(255,255,255,.08),0 60px 120px -30px rgba(8,101,254,.6);opacity:0">
        <div style="position:absolute;left:50%;top:18px;width:150px;height:34px;margin-left:-75px;border-radius:20px;background:#1a2130"></div></div>
      <div class="chip ok" style="left:300px;top:1440px;background:${TOKENS.blue};border-color:${TOKENS.blue}"><span class="ic" style="background:rgba(255,255,255,.2)">${svgI(I.check, 36, '#fff', 2.6)}</span>Mesa 5 aberta</div>
    </div>`;

  // 2. Pedido
  const s2 = `<div class="glow" style="width:1300px;height:1300px;left:-110px;top:620px;opacity:.55"></div>
    ${title(1, 'Plano Scale · em breve', 'Pede pelo celular,', 'sem app.')}
    ${phoneAt(560, rec(recA))}
    ${chip('chip-a', I.check, 'Sem app', 'left:40px;top:700px')}
    ${chip('chip-b', I.check, 'Sem cadastro', 'right:40px;top:860px')}
    <div class="bag" style="position:absolute;left:888px;top:700px;width:120px;height:120px;border-radius:50%;background:${TOKENS.surface};border:2px solid rgba(77,141,255,.5);display:grid;place-items:center;opacity:0;z-index:11;box-shadow:0 0 50px -10px rgba(8,101,254,.8)">${svgI(I.bag, 60)}<span class="bag-n" style="position:absolute;right:-6px;top:-6px;width:48px;height:48px;border-radius:50%;background:${TOKENS.blue};color:#fff;font-size:28px;font-weight:800;display:grid;place-items:center">0</span></div>
    <div class="flyer plus1"><span class="plus">+1</span></div><div class="flyer plus2"><span class="plus">+1</span></div>
    <div class="flyer ticket"><div style="display:flex;gap:14px;align-items:center;background:#fff;color:#111;border-radius:22px;padding:18px 24px;font-size:30px;font-weight:700;box-shadow:0 30px 60px -15px rgba(0,0,0,.8)">${svgI(I.ticket, 40, TOKENS.blue)}Pedido · Mesa 5</div></div>
    <div class="chip kitchen" style="right:40px;top:1410px"><span class="ic flame" style="background:rgba(255,140,40,.18)">${svgI(I.flame, 36, '#ff9a3c')}</span>Cozinha</div>
    ${tag}`;

  // 3. Amigo entra
  const last = `<img class="still" src="${pathToFileURL(path.join(recA.dir, String(recA.count - 1).padStart(5, '0') + '.jpg')).href}" alt="">`;
  const linkPath = 'M 300 640 C 400 520, 680 520, 780 640';
  const digits = '0000'.split('').map(() => `<div class="flyer digit"><span class="plus" style="font-size:52px;padding:10px 26px">•</span></div>`).join('');
  const s3 = `<div class="glow" style="width:1300px;height:1300px;left:-110px;top:620px;opacity:.5"></div>
    ${title(2, 'Plano Scale · em breve', 'O amigo entra com o código.', 'Mesma conta.')}
    ${phoneAt(640, last, 'ph-a', 'left:285px;scale:.62;transform-origin:50% 0')}
    ${phoneAt(640, rec(recB), 'ph-b', 'left:795px;scale:.62;transform-origin:50% 0')}
    <svg width="1080" height="1920" style="position:absolute;inset:0;z-index:8;pointer-events:none"><path class="link" d="${linkPath}" fill="none" stroke="${TOKENS.blueBright}" stroke-width="6" stroke-linecap="round" stroke-dasharray="900" stroke-dashoffset="900" opacity="0"/></svg>
    ${[0, 1, 2].map(() => `<div class="pulse" style="position:absolute;left:0;top:0;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 0 20px 6px rgba(77,141,255,.9);offset-path:path('${linkPath}');opacity:0;z-index:9"></div>`).join('')}
    ${digits}
    ${chip('same', I.link, 'Mesma conta', 'left:345px;top:470px')}
    ${tag}`;

  // 4. Garçom
  const sparks = Array.from({ length: 14 }, (_, i) => `<div class="spark" style="position:absolute;left:${540 - 10}px;top:${1090 - 10}px;width:20px;height:20px;border-radius:${i % 2 ? '50%' : '4px'};background:${i % 3 ? TOKENS.blueBright : '#22c55e'};opacity:0;z-index:11"></div>`).join('');
  const note = (cls, ic, bg, color, a, b, pos) => `<div class="note-card ${cls}" style="${pos}"><span class="ic" style="background:${bg}"><svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g class="ring">${ic}</g></svg></span><div><b>${a}</b><span>${b}</span></div></div>`;
  const s4 = `<div class="glow" style="width:1300px;height:1300px;left:-110px;top:620px;opacity:.55"></div>
    ${title(3, 'Plano Scale · em breve', 'O garçom confirma, atende', 'e libera a mesa.')}
    ${phoneAt(560, rec(recS))}
    ${chip('n-ok', I.check, 'Mesa confirmada', 'left:40px;top:690px')}
    ${note('n-call', I.bell, '#fff1e6', '#ea580c', 'Mesa 5 chamou', 'agora', 'right:36px;top:820px')}
    ${note('n-bill', I.receipt, '#e8f7ee', '#16a34a', 'Pediu a conta', 'Mesa 5', 'right:36px;top:990px')}
    ${sparks}
    <div class="chip free" style="left:390px;top:1420px;background:#16a34a;border-color:#16a34a"><span class="ic" style="background:rgba(255,255,255,.2)">${svgI(I.check, 36, '#fff', 2.6)}</span>Mesa livre</div>
    ${tag}`;

  // 5. Fecho
  const [p1, p2] = MARK.match(/<path[^>]*\/>/g);
  const markSvg = (p, cls) => `<svg class="${cls}" viewBox="50 40 530 415" style="position:absolute;inset:0;width:100%;height:100%;opacity:0">${p}</svg>`;
  const s5 = `<div class="glow" style="width:1500px;height:1500px;left:-210px;top:260px;opacity:.6"></div>
    <div class="safe" style="justify-content:center;align-items:flex-start">
      <div style="position:relative;width:210px;height:166px;margin-bottom:56px">${markSvg(p1, 'm1')}${markSvg(p2, 'm2')}</div>
      <div class="plan" style="position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:14px;padding:14px 28px;border-radius:999px;border:2px solid ${TOKENS.blueBright};font-size:30px;font-weight:800;letter-spacing:.14em;color:${TOKENS.blueSoft};opacity:0;transform-origin:0 50%">PLANO SCALE · EM BREVE<span class="shine" style="position:absolute;top:-20px;bottom:-20px;width:70px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)"></span></div>
      <h1 class="h1" style="font-size:104px;margin-top:40px">${ws('Pedido na mesa,', 0.7, 0.1)} ${ws('sem app.', 1.0, 0.1, 'blue')}</h1>
      <div style="position:relative;margin-top:56px"><span class="cta-ring" style="position:absolute;inset:-6px;border-radius:999px;border:3px solid ${TOKENS.blueBright};opacity:0"></span><span class="btn cta" style="font-size:40px;padding:28px 52px;opacity:0;transform-origin:0 50%">Manda um oi. Link na bio.</span></div>
      <p class="muted note" style="font-size:26px;margin-top:64px;max-width:780px;line-height:1.35;opacity:0">Telas do sistema funcionando numa loja de demonstração com nome fictício. Nenhum pedido real.</p>
    </div>`;

  return reelPage({
    css: MOTION_CSS,
    scenes: [
      { start: 0, end: 4.2, html: s0 },
      { start: 4.2, end: 7.0, html: s1 },
      { start: 7.0, end: 16.2, html: s2 },
      { start: 16.2, end: 22.0, html: s3 },
      { start: 22.0, end: 31.2, html: s4 },
      { start: 31.2, end: 35.5, html: s5 },
    ],
    script: fs.readFileSync(path.join(HERE, 'mesa-motion.js'), 'utf8'),
  });
}

// Reel 10, versão 3D: o salão de tools/mesa-scene por baixo (quadros já renderizados),
// celulares com as telas reais e legendas por cima.
const MESA3D = process.env.MESA3D_FRAMES || path.join(ROOT, 'tools/mesa-scene/out/frames');

const MESA3D_CSS = `
.w{display:inline-block;opacity:0;will-change:transform}
#bg{position:absolute;inset:0;width:1080px;height:1920px;object-fit:cover;z-index:0}
.shade{position:absolute;left:0;right:0;pointer-events:none;z-index:1}
.scene{z-index:2}.brand{z-index:30}
.cap{position:absolute;left:60px;right:60px;top:1372px;text-align:center;font-size:66px;font-weight:800;letter-spacing:-.03em;line-height:1.08;color:#fff;text-shadow:0 4px 24px rgba(0,0,0,.65)}
.top{position:absolute;left:96px;top:236px;display:flex;flex-direction:column;align-items:flex-start;gap:14px;z-index:20}
.pill{display:inline-block;font-size:24px;font-weight:700;letter-spacing:.14em;color:#fff;background:${TOKENS.blue};border-radius:999px;padding:10px 22px;box-shadow:0 12px 30px -10px rgba(8,101,254,.9)}
.chip{position:absolute;display:flex;align-items:center;gap:16px;padding:18px 28px;border-radius:999px;background:rgba(15,21,32,.94);border:1.5px solid rgba(77,141,255,.5);font-size:34px;font-weight:700;color:${TOKENS.text};box-shadow:0 30px 60px -20px rgba(0,0,0,.8),0 0 40px -10px rgba(8,101,254,.6);opacity:0;z-index:10;white-space:nowrap}
.chip .ic{width:54px;height:54px;border-radius:50%;background:rgba(8,101,254,.2);display:grid;place-items:center}
.flyer{position:absolute;left:0;top:0;opacity:0;z-index:12}
.plus{background:${TOKENS.blue};color:#fff;font-weight:800;font-size:40px;padding:12px 26px;border-radius:999px;box-shadow:0 18px 40px -10px rgba(8,101,254,.95)}
.note-card{position:absolute;width:430px;padding:22px 26px;border-radius:30px;background:#fff;color:#111827;box-shadow:0 40px 80px -20px rgba(0,0,0,.85);display:flex;gap:18px;align-items:center;opacity:0;z-index:10}
.note-card b{display:block;font-size:34px;letter-spacing:-.01em}
.note-card span{font-size:26px;color:#4b5563}
.note-card .ic{flex:none;width:74px;height:74px;border-radius:22px;display:grid;place-items:center}
.ring{transform-box:fill-box;transform-origin:50% 10%}
.phone{transform-origin:50% 0}
.phone .screen img.still{display:block;width:100%;height:100%;object-fit:cover}
`;

function mesa3dReelHtml({ recA, recB, recS }) {
  const count = fs.readdirSync(MESA3D).filter((f) => f.endsWith('.jpg')).length;
  if (count < 1060) throw new Error(`Faltam os quadros 3D em ${MESA3D} (rode tools/mesa-scene/render.mjs frames).`);
  const rec = (r) => `<img class="rec" data-seq="${pathToFileURL(r.dir).href}" data-count="${r.count}" src="${pathToFileURL(path.join(r.dir, '00000.jpg')).href}" alt="">`;
  const phoneAt = (cx, top, scale, inner, cls = '') => `<div class="phone ${cls}" style="left:${cx}px;top:${top}px;scale:${scale}">\n<div class="screen">${inner}</div></div>`;
  const ws = (text, t0, step = 0.1, cls = '') => text.split(' ').map((w, i) => `<span class="w ${cls}" data-t="${(t0 + i * step).toFixed(2)}">${w}</span>`).join(' ');
  const cap = (a, b, t0 = 0.25) => `<div class="cap">${ws(a, t0)} ${ws(b, t0 + a.split(' ').length * 0.1, 0.1, 'blue')}</div>`;
  const top = `<div class="top"><span class="pill">PLANO SCALE · EM BREVE</span><span class="tag">Projeto conceito · loja de demonstração · nome fictício</span></div>`;
  const chip = (cls, ic, text, pos) => `<div class="chip ${cls}" style="${pos}"><span class="ic">${svgI(ic, 32)}</span>${text}</div>`;

  const s0 = `<div class="title" style="position:absolute;left:96px;right:96px;top:250px"><h1 class="h1" style="font-size:112px;text-shadow:0 6px 30px rgba(0,0,0,.6)">${ws('Salão cheio.', 0.05, 0.12)}<br>${ws('Garçom correndo.', 0.4, 0.14, 'blue')}</h1></div>
    ${cap('E a mesa', 'esperando pra pedir?', 1.9)}`;
  const s1 = `${top}${cap('O cliente lê', 'o QR da mesa.')}
    <div class="chip ok" style="left:96px;top:400px;background:${TOKENS.blue};border-color:${TOKENS.blue}"><span class="ic" style="background:rgba(255,255,255,.22)">${svgI(I.check, 34, '#fff', 2.6)}</span>Mesa 5 aberta</div>`;
  const s2 = `${top}
    ${phoneAt(735, 560, 0.72, rec(recA))}
    ${chip('chip-a', I.check, 'Sem app', 'left:60px;top:400px')}
    ${chip('chip-b', I.check, 'Sem cadastro', 'left:60px;top:500px')}
    <div class="bag" style="position:absolute;left:890px;top:382px;width:116px;height:116px;border-radius:50%;background:${TOKENS.surface};border:2px solid rgba(77,141,255,.55);display:grid;place-items:center;opacity:0;z-index:11;box-shadow:0 0 50px -10px rgba(8,101,254,.8)">${svgI(I.bag, 58)}<span class="bag-n" style="position:absolute;right:-6px;top:-6px;width:46px;height:46px;border-radius:50%;background:${TOKENS.blue};color:#fff;font-size:28px;font-weight:800;display:grid;place-items:center">0</span></div>
    <div class="flyer plus1"><span class="plus">+1</span></div><div class="flyer plus2"><span class="plus">+1</span></div>
    <div class="flyer ticket"><div style="display:flex;gap:14px;align-items:center;background:#fff;color:#111;border-radius:22px;padding:16px 22px;font-size:30px;font-weight:700;box-shadow:0 30px 60px -15px rgba(0,0,0,.8)">${svgI(I.ticket, 38, TOKENS.blue)}Pedido · Mesa 5</div></div>
    <div class="chip kitchen" style="right:40px;top:400px"><span class="ic flame" style="background:rgba(255,140,40,.2)">${svgI(I.flame, 34, '#ff9a3c')}</span>Cozinha</div>
    ${cap('Pede pelo celular,', 'sem app.')}`;
  const last = `<img class="still" src="${pathToFileURL(path.join(recA.dir, String(recA.count - 1).padStart(5, '0') + '.jpg')).href}" alt="">`;
  const linkPath = 'M 300 815 C 400 700, 680 700, 780 815';
  const s3 = `${top}
    ${phoneAt(300, 820, 0.52, last, 'ph-a')}
    ${phoneAt(780, 820, 0.52, rec(recB), 'ph-b')}
    <svg width="1080" height="1920" style="position:absolute;inset:0;z-index:8;pointer-events:none"><path class="link" d="${linkPath}" fill="none" stroke="${TOKENS.blueBright}" stroke-width="6" stroke-linecap="round" stroke-dasharray="900" stroke-dashoffset="900" opacity="0"/></svg>
    ${[0, 1, 2].map(() => `<div class="pulse" style="position:absolute;left:0;top:0;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 0 20px 6px rgba(77,141,255,.9);offset-path:path('${linkPath}');opacity:0;z-index:9"></div>`).join('')}
    ${'0000'.split('').map(() => `<div class="flyer digit"><span class="plus" style="font-size:50px;padding:8px 24px">•</span></div>`).join('')}
    ${chip('same', I.link, 'Mesma conta', 'left:375px;top:620px')}
    ${cap('O amigo entra com o código.', 'Mesma conta.')}`;
  const sparks = Array.from({ length: 14 }, (_, i) => `<div class="spark" style="position:absolute;left:${735 - 10}px;top:${930 - 10}px;width:20px;height:20px;border-radius:${i % 2 ? '50%' : '4px'};background:${i % 3 ? TOKENS.blueBright : '#22c55e'};opacity:0;z-index:11"></div>`).join('');
  const note = (cls, ic, bg, color, a, b, pos) => `<div class="note-card ${cls}" style="${pos}"><span class="ic" style="background:${bg}"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g class="ring">${ic}</g></svg></span><div><b>${a}</b><span>${b}</span></div></div>`;
  const s4 = `${top}
    ${phoneAt(735, 560, 0.72, rec(recS))}
    ${chip('n-ok', I.check, 'Mesa confirmada', 'right:40px;top:400px')}
    ${note('n-call', I.bell, '#fff1e6', '#ea580c', 'Mesa 5 chamou', 'agora', 'left:40px;top:400px')}
    ${note('n-bill', I.receipt, '#e8f7ee', '#16a34a', 'Pediu a conta', 'Mesa 5', 'left:40px;top:540px')}
    ${sparks}
    <div class="chip free" style="left:60px;top:420px;background:#16a34a;border-color:#16a34a"><span class="ic" style="background:rgba(255,255,255,.22)">${svgI(I.check, 34, '#fff', 2.6)}</span>Mesa livre</div>
    ${cap('O garçom confirma', 'e atende na hora.')}`;
  const [p1, p2] = MARK.match(/<path[^>]*\/>/g);
  const markSvg = (p, cls) => `<svg class="${cls}" viewBox="50 40 530 415" style="position:absolute;inset:0;width:100%;height:100%;opacity:0">${p}</svg>`;
  const s5 = `<div style="position:absolute;left:0;right:0;top:0;height:1150px;background:linear-gradient(#06080df2 55%,#06080d00)"></div>
    <div class="endA" style="position:absolute;left:96px;right:96px;top:300px">
      <div style="position:relative;width:180px;height:142px;margin-bottom:44px">${markSvg(p1, 'm1')}${markSvg(p2, 'm2')}</div>
      <div class="plan" style="position:relative;overflow:hidden;display:inline-flex;padding:14px 28px;border-radius:999px;border:2px solid ${TOKENS.blueBright};font-size:30px;font-weight:800;letter-spacing:.14em;color:${TOKENS.blueSoft};background:rgba(6,8,13,.6);opacity:0;transform-origin:0 50%">PLANO SCALE · EM BREVE<span class="shine" style="position:absolute;top:-20px;bottom:-20px;width:70px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)"></span></div>
      <h1 class="h1" style="font-size:100px;margin-top:34px;text-shadow:0 6px 30px rgba(0,0,0,.6)">${ws('Pedido na mesa,', 0.3, 0.1)} ${ws('sem app.', 0.8, 0.1, 'blue')}</h1>
    </div>
    <div class="endB" style="position:absolute;left:80px;right:80px;top:330px;display:flex;flex-direction:column;align-items:center;text-align:center;opacity:0">
      <p class="h1 q" style="font-size:60px;color:#fff;text-shadow:0 6px 30px rgba(0,0,0,.6)">Quer isso no seu restaurante?</p>
      <p class="ent" style="margin-top:18px;font-size:48px;font-weight:700;color:${TOKENS.blueSoft};text-shadow:0 4px 24px rgba(0,0,0,.7);opacity:0">Quer entender como funciona?</p>
      <div style="display:flex;align-items:center;gap:26px;margin-top:40px">
        <span class="h1 com" style="font-size:100px;color:#fff;text-shadow:0 6px 30px rgba(0,0,0,.6)">Comenta</span>
        <span class="kw" style="position:relative;display:inline-block;font-size:108px;font-weight:900;letter-spacing:-.02em;color:#fff;background:${TOKENS.blue};border-radius:34px;padding:6px 38px 14px;box-shadow:0 30px 70px -20px rgba(8,101,254,1)">MESA<span class="kw-ring" style="position:absolute;inset:-10px;border-radius:44px;border:5px solid ${TOKENS.blueBright};opacity:0"></span></span>
      </div>
      <div class="field" style="margin-top:64px;width:840px;display:flex;align-items:center;gap:22px;padding:22px 26px;border-radius:999px;background:rgba(15,21,32,.95);border:2px solid rgba(255,255,255,.18);box-shadow:0 30px 60px -20px rgba(0,0,0,.9)">
        <span style="flex:none;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#ff9a3c,#e85d75)"></span>
        <span class="typed" style="flex:1;text-align:left;font-size:40px;font-weight:600;color:#fff">&nbsp;</span>
        <span class="send" style="flex:none;font-size:34px;font-weight:800;color:${TOKENS.blueBright}">Publicar</span>
      </div>
    </div>
    <p class="muted note" style="position:absolute;left:96px;right:96px;top:1400px;font-size:28px;line-height:1.35;opacity:0;text-align:center">Plano Scale em breve, ainda não está à venda. Telas do sistema numa loja de demonstração com nome fictício.</p>`;

  const bgDir = pathToFileURL(MESA3D).href;
  // [início novo, fim novo, início original, velocidade]: a narração manda no tempo; cada cena
  // toca a sua ação original (3D, gravação e animações) na velocidade que cabe na fala.
  const WARP = [
    [0, 4.25, 0, 0.99],
    [4.25, 7.0, 4.2, 1.02],
    [7.0, 14.1, 7.0, 1.3],
    [14.1, 18.3, 16.2, 1.38],
    [18.3, 22.15, 22.0, 1.3],
    [22.15, 33.5, 31.2, 1],
  ];
  const script = `window.WARP=${JSON.stringify(WARP)};document.body.insertAdjacentHTML('afterbegin','<img id="bg" data-seq="${bgDir}" data-count="${count}" src="${bgDir}/00000.jpg" alt=""><div class="shade" style="top:0;height:620px;background:linear-gradient(#06080dd9,#06080d00)"></div><div class="shade" style="bottom:0;height:720px;background:linear-gradient(#06080d00,#06080de6 60%)"></div>');\n`
    + fs.readFileSync(path.join(HERE, 'mesa3d-motion.js'), 'utf8');
  return reelPage({
    css: MESA3D_CSS,
    scenes: WARP.map(([ns, ne], i) => ({ start: ns, end: ne, html: [s0, s1, s2, s3, s4, s5][i] })),
    script,
  });
}

// ---------------------------------------------------------------------------------------
// Os Reels

const REELS = {
  // 1. O site que passa de lado
  async 1() {
    let span;
    const rec = await captureSite({
      id: '1', url: SITE, duration: 13,
      steps: async (t, page) => {
        span ??= await sectionTop(page, 'ramos');
        const [top, h, vh] = span;
        // Para na seção, depois rola devagar pelos quatro modelos.
        const y = top - 4 + smooth((t - 0.6) / 11.4) * (h - vh + 4);
        await page.evaluate((y) => window.scrollTo(0, y), y);
      },
    });
    const html = reelPage({
      scenes: [
        { start: 0, end: 14.5, html: demo('Um site para cada tipo de negócio.', rec.dir, { tag: 'Projetos conceito · nomes fictícios' }), update: playSeq(rec.count, 0.4) },
        { start: 9.2, end: 14.5, fade: 0.4, html: `<div style="position:absolute;left:0;right:0;top:230px;height:300px;background:linear-gradient(${TOKENS.bg} 75%,rgba(6,8,13,0))"></div><div style="position:absolute;left:96px;right:120px;top:250px"><h2 class="h1" style="font-size:62px;line-height:1.08">Cada site é feito do zero, com as fotos e as cores do negócio.</h2></div>` },
        { start: 14.5, end: 19, html: end('Peça uma prévia grátis.') },
      ],
    });
    return { html, duration: 19, cover: 2.5 };
  },

  // 2. A marca se monta
  async 2() {
    let span;
    const rec = await captureSite({
      id: '2', url: SITE, duration: 12,
      steps: async (t, page) => {
        span ??= await sectionTop(page, 'subida');
        const [top, h, vh] = span;
        const y = top - 140 + smooth((t - 0.5) / 10.5) * (h - vh + 140);
        await page.evaluate((y) => window.scrollTo(0, y), y);
      },
    });
    const html = reelPage({
      scenes: [
        { start: 0, end: 13.5, html: demo('Detalhe que ninguém esquece.', rec.dir), update: playSeq(rec.count, 0.4) },
        { start: 8.4, end: 13.5, fade: 0.4, html: `<div style="position:absolute;left:0;right:0;top:230px;height:300px;background:linear-gradient(${TOKENS.bg} 75%,rgba(6,8,13,0))"></div><div style="position:absolute;left:96px;right:120px;top:250px"><h2 class="h1" style="font-size:64px;line-height:1.08">Animação com propósito: guia o olhar até o que importa.</h2></div>` },
        { start: 13.5, end: 18, html: end('Conheça os planos Start, Grow e Lift.') },
      ],
    });
    return { html, duration: 18, cover: 2.5 };
  },

  // 3. Do celular ao diagnóstico (dados de exemplo; nada é enviado)
  async 3() {
    const sample = { negocio: 'Padaria Exemplo', ramo: 'Padaria', cidade: 'São Paulo', whatsapp: '(11) 90000-0000' };
    let plan;
    const rec = await captureSite({
      id: '3', url: SITE, duration: 17,
      setup: async (page) => {
        // O formulário é mostrado de verdade, mas o envio é interceptado aqui: nada chega ao painel.
        const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
        await page.route('**/api/public/diagnosticos**', (r) =>
          r.request().method() === 'OPTIONS'
            ? r.fulfill({ status: 204, headers: cors })
            : r.fulfill({ status: 201, headers: cors, contentType: 'application/json', body: JSON.stringify({ ok: true }) }),
        );
      },
      steps: async (t, page) => {
        plan ??= await page.evaluate(() => {
          const r = (el) => { const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 + scrollY }; };
          const cta = [...document.querySelectorAll('a[href="#diagnostico"]')].find((a) => a.getBoundingClientRect().top < innerHeight && a.offsetParent);
          const form = document.getElementById('form-diagnostico');
          const fields = [...form.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([tabindex="-1"]), select, textarea')].filter((f) => f.offsetParent).map((f) => ({ name: f.name, tag: f.tagName, ...r(f) }));
          const consent = form.querySelector('input[type=checkbox]');
          const submit = form.querySelector('button[type=submit], button:not([type])');
          return { cta: r(cta), formTop: document.getElementById('diagnostico').offsetTop, fields, consent: consent && r(consent), submit: r(submit) };
        });
        const tap = (x, y, k) => page.evaluate(([x, y, k]) => window.__tap(x, y - scrollY, k), [x, y, k]);
        // 0–1.6 s: capa do site e toque em "Diagnóstico grátis"
        if (t < 1.6) {
          await page.evaluate(() => window.scrollTo(0, 0));
          await tap(plan.cta.x, plan.cta.y, t > 0.9 ? 1 - (t - 0.9) / 0.7 : 0);
          return;
        }
        await tap(0, 0, 0);
        // 1.6–2.6 s: a página desce até o formulário
        const y0 = plan.formTop - 10;
        if (t < 2.6) { await page.evaluate((y) => window.scrollTo(0, y), smooth((t - 1.6) / 1) * y0); return; }
        // 2.6–12 s: preenche os campos, um por vez, rolando junto
        const typed = plan.fields.filter((f) => f.tag !== 'SELECT');
        const per = 7.4 / Math.max(1, plan.fields.length);
        for (let n = 0; n < plan.fields.length; n++) {
          const f = plan.fields[n];
          const a = 2.6 + n * per;
          if (t < a) break;
          const k = Math.min(1, (t - a) / (per * 0.75));
          const val = valueFor(f.name, sample);
          await page.evaluate(([name, tag, val, k]) => {
            const el = document.querySelector(`#form-diagnostico [name="${name}"]`);
            if (!el) return;
            if (tag === 'SELECT') { if (k >= 1 && el.options.length > 1) el.selectedIndex = [...el.options].findIndex((o) => o.text === val) > 0 ? [...el.options].findIndex((o) => o.text === val) : 1; }
            else el.value = val.slice(0, Math.round(val.length * k));
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }, [f.name, f.tag, val, k]);
          const target = Math.max(y0, f.y - 260);
          await page.evaluate((y) => window.scrollTo(0, y), target);
        }
        void typed;
        // 10.2–12 s: marca a autorização e toca em enviar (o envio é interceptado)
        if (plan.consent && t >= 10.2) await page.evaluate(() => { const c = document.querySelector('#form-diagnostico input[type=checkbox]'); if (c && !c.checked) { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); } });
        if (t >= 10.6 && t < 12) {
          await page.evaluate((y) => window.scrollTo(0, y), plan.submit.y - 400);
          await tap(plan.submit.x, plan.submit.y, t < 11.2 ? 1 : 1 - (t - 11.2) / 0.8);
        }
        if (t >= 11.2 && !page.__sent) {
          page.__sent = true;
          await page.evaluate(() => document.querySelector('#form-diagnostico').requestSubmit());
        }
        if (t >= 12) await tap(0, 0, 0);
      },
    });
    const html = reelPage({
      scenes: [
        { start: 0, end: 18, html: demo('Pedir o diagnóstico do seu site leva menos de 2 minutos.', rec.dir, { tag: 'Dados de exemplo · nada foi enviado', size: 64 }), update: playSeq(rec.count, 0.5) },
        { start: 13, end: 18, fade: 0.4, html: `<div style="position:absolute;left:0;right:0;top:230px;height:300px;background:linear-gradient(${TOKENS.bg} 75%,rgba(6,8,13,0))"></div><div style="position:absolute;left:96px;right:120px;top:250px"><h2 class="h1" style="font-size:62px;line-height:1.08">Em até 2 dias úteis, a prévia do seu site chega no WhatsApp.</h2></div>` },
        { start: 18, end: 22.5, html: end('Faça o seu diagnóstico grátis.') },
      ],
    });
    return { html, duration: 22.5, cover: 0.2 };
  },

  // 4. Três sinais de que o seu negócio precisa de site
  async 4() {
    const shots = [['burger.png', '50% 50%'], ['confeitaria.png', '50% 40%'], ['restaurante.png', '30% 50%'], ['confeitaria.png', '50% 75%'], ['burger.png', '50% 50%'], ['restaurante.png', '80% 50%'], ['restaurante.png', '55% 30%'], ['burger.png', '50% 50%'], ['confeitaria.png', '50% 20%']];
    const grid = `<div class="card" style="padding:30px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;width:820px">
      ${shots.map(tile).join('')}
      <p class="muted" style="grid-column:1/-1;font-size:32px;margin-top:12px">cardapio-atualizado-FINAL-2.jpg</p></div>`;
    const maps = `<div class="card" style="padding:52px 56px;width:840px">
      <div style="display:flex;gap:26px;align-items:center">${icon('google', { size: 84 })}<div><p style="font-size:50px;font-weight:700">Seu negócio</p><p class="muted" style="font-size:32px">Ficha no Google</p></div></div>
      <div style="margin-top:44px;display:grid;gap:30px;font-size:40px;color:${TOKENS.soft}">
        <p data-in="1.2" data-dy="0">Endereço: <s style="color:${TOKENS.muted}">Rua de antes, 12</s></p>
        <p data-in="1.6" data-dy="0">Horário: <s style="color:${TOKENS.muted}">Aberto até 18h</s> <span style="color:#ff8a80;font-weight:600">· desatualizado</span></p>
      </div></div>`;
    const bubble = (txt, at) => `<div data-in="${at}" style="align-self:flex-start;max-width:780px;background:${TOKENS.surface};border:1px solid ${TOKENS.line};border-radius:34px 34px 34px 8px;padding:30px 40px;font-size:44px;color:${TOKENS.soft}">${txt}</div>`;
    const chat = `<div style="display:flex;flex-direction:column;gap:24px">${bubble('Oi, ainda tem?', 0.9)}${bubble('Quanto custa o combo?', 1.5)}${bubble('Vocês entregam no meu bairro?', 2.1)}
      <div data-in="2.7" style="align-self:flex-end;font-size:34px;color:${TOKENS.muted}">… esperando resposta</div></div>`;
    const html = reelPage({
      scenes: [
        { start: 0, end: 3.4, html: hook('O seu cliente procurou você no Google e <span class="blue">não achou?</span>', { lead: 'Três sinais de que o seu negócio precisa de site.' }) },
        { start: 3.4, end: 8.6, html: sinal(1, 'O cardápio e os preços só existem em foto no Instagram.', `<div data-in=".6">${grid}</div>`) },
        { start: 8.6, end: 13.8, html: sinal(2, 'O endereço e o horário estão desatualizados no Google.', `<div data-in=".6">${maps}</div>`) },
        { start: 13.8, end: 19, html: sinal(3, 'O único jeito de pedir é mandando mensagem.', chat) },
        { start: 19, end: 23.5, html: end('Quer saber como está o seu?', { lead: 'Diagnóstico grátis no link da bio' }) },
      ],
    });
    return { html, duration: 23.5, cover: 1.2 };
  },

  // 5. Perfil da Empresa no Google: o básico
  async 5() {
    const tips = [
      ['Nome igual ao da fachada', 'Sem palavras extras para aparecer mais.'],
      ['Horário certo', 'Inclusive feriados.'],
      ['Fotos reais', 'Da fachada, do ambiente e dos produtos.'],
      ['Categoria correta', 'A que descreve o que você vende.'],
      ['Responder às avaliações', 'As boas e as ruins, com educação.'],
    ];
    const list = tips.map(([t, d], i) => `
      <li data-in="${0.8 + i * 1.9}" style="display:flex;gap:28px;align-items:flex-start">
        <div style="flex:none;width:84px;height:84px;border-radius:24px;display:grid;place-items:center;background:rgba(8,101,254,.16);border:1px solid rgba(77,141,255,.4)">${icon('check', { size: 44, width: 2.4 })}</div>
        <div><p style="font-size:54px;font-weight:700;letter-spacing:-.01em">${t}</p><p class="muted" style="font-size:36px;margin-top:8px">${d}</p></div>
      </li>`).join('');
    const pin = `<div data-in=".2" data-dy="-120" style="position:absolute;right:120px;top:300px;opacity:.9">${icon('google', { size: 260, width: 1.1 })}</div>`;
    const html = reelPage({
      scenes: [
        { start: 0, end: 3.4, html: hook('O seu negócio aparece no <span class="blue">Google Maps?</span>', { lead: 'O básico do Perfil da Empresa no Google, em 5 itens.', art: pin }) },
        { start: 3.4, end: 15.2, html: `<div class="glow" style="width:1300px;height:1300px;left:-500px;top:700px;opacity:.45"></div><div class="safe"><p class="eyebrow">Perfil da Empresa no Google</p><h2 class="h1" style="font-size:76px;margin-top:22px">Confira o seu:</h2><ul style="list-style:none;display:grid;gap:56px;margin-top:80px">${list}</ul></div>` },
        { start: 15.2, end: 20, html: end('No plano Grow, a gente configura e acompanha o seu perfil no Google.', { note: 'Dicas gerais. Ninguém pode garantir posição no Google.' }) },
      ],
    });
    return { html, duration: 20, cover: 1.2 };
  },
  // 6. Bastidores: do código ao site (o arquivo real do modelo Doce Ateliê e as três etapas dele)
  async 6() {
    const file = path.join(MODELS, 'confeitaria.html');
    const code = fs.readFileSync(file, 'utf8').replace(/></g, '>\n<').replace(/}/g, '}\n').split('\n').filter((l) => l.trim()).slice(0, 60).join('\n');
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const hl = (line) => {
      let out = '', last = 0, m;
      const re = /(<\/?)([a-zA-Z][a-zA-Z0-9]*)|([a-zA-Z-]+)(?==)/g;
      while ((m = re.exec(line))) {
        out += esc(line.slice(last, m.index));
        out += m[2] ? `${esc(m[1])}<b style="color:${TOKENS.blueBright};font-weight:400">${m[2]}</b>` : `<i style="color:${TOKENS.blueSoft};font-style:normal">${m[3]}</i>`;
        last = re.lastIndex;
      }
      return out + esc(line.slice(last));
    };
    const lines = code.split('\n').map(hl);
    const shots = await modelStages(file);
    const browser = (inner) => `<div style="position:absolute;left:60px;right:60px;top:640px;border-radius:26px;overflow:hidden;background:${TOKENS.surface};border:1px solid ${TOKENS.line};box-shadow:0 -30px 90px -30px rgba(8,101,254,.55)">
      <div style="display:flex;align-items:center;gap:10px;height:54px;padding:0 22px;border-bottom:1px solid rgba(255,255,255,.08)"><i style="width:14px;height:14px;border-radius:50%;background:#2a3344"></i><i style="width:14px;height:14px;border-radius:50%;background:#2a3344"></i><i style="width:14px;height:14px;border-radius:50%;background:#2a3344"></i><span style="margin-left:14px;font-size:20px;color:#7d879c;background:#161d2a;padding:6px 18px;border-radius:999px">seunegocio.com.br</span></div>
      <div style="position:relative;aspect-ratio:1280/800">${inner}</div></div>`;
    const stage = (src, label, at) => `<img src="${src}" data-in="${at}" data-dy="0" data-dur=".5" style="position:absolute;inset:0;width:100%;height:100%;opacity:0"><span class="tag" data-in="${at}" data-dy="0" data-dur=".4" style="position:absolute;left:24px;bottom:24px;opacity:0;background:rgba(6,8,13,.85)">${label}</span>`;
    const html = reelPage({
      scenes: [
        { start: 0, end: 3, html: hook('De uma folha em branco a <span class="blue">um site.</span>', { lead: 'Bastidores de um dos nossos modelos.' }) },
        {
          start: 3, end: 9.4,
          html: `<div style="position:absolute;left:96px;right:120px;top:250px"><p class="eyebrow">Primeiro, o código</p><h2 class="h1" style="font-size:64px;margin-top:18px">Escrito do zero, sem modelo pronto.</h2></div>
            <div class="card" style="position:absolute;left:60px;right:60px;top:560px;height:1060px;overflow:hidden;padding:0">
              <div style="height:60px;display:flex;align-items:center;padding:0 28px;border-bottom:1px solid ${TOKENS.line};font-size:24px;color:${TOKENS.soft};font-family:ui-monospace,Menlo,monospace">confeitaria.html</div>
              <div style="position:absolute;left:0;right:0;top:60px;bottom:0;overflow:hidden"><pre id="code" style="margin:0;padding:26px 28px;font:21px/1.5 ui-monospace,Menlo,Consolas,monospace;color:${TOKENS.soft};white-space:pre-wrap;word-break:break-all"></pre></div>
            </div>`,
          update: `async(local,dur,el)=>{const L=${JSON.stringify(lines)};const k=Math.min(1,local/(dur-.8));const n=Math.max(1,Math.ceil(L.length*k));const pre=el.querySelector('#code');pre.innerHTML=L.slice(0,n).join('\\n')+'<span style="background:${TOKENS.blueBright}">&nbsp;</span>';const over=pre.scrollHeight-(el.querySelector('#code').parentElement.clientHeight);pre.style.transform='translateY('+(-Math.max(0,over))+'px)';}`,
        },
        {
          start: 9.4, end: 16.4,
          html: `<div style="position:absolute;left:96px;right:120px;top:250px"><p class="eyebrow">Depois, o site</p><h2 class="h1" style="font-size:64px;margin-top:18px">Cada detalhe pensado para o tipo de negócio.</h2></div>
            ${browser(stage(shots[0], 'Só o conteúdo', 0.2) + stage(shots[1], 'Com o visual', 2.4) + stage(shots[2], 'Com as fotos', 4.6))}
            <div style="position:absolute;left:96px;top:1260px"><span class="tag">Projeto conceito · nome fictício</span></div>`,
        },
        { start: 16.4, end: 21, html: end('Quer um site assim para o seu negócio?') },
      ],
    });
    return { html, duration: 21, cover: 1.2 };
  },

  // 7. Quem somos (versão com fotos; a versão falando para a câmera continua no roteiro)
  async 7() {
    const person = (img, name) => `
      <div class="glow" style="width:1300px;height:1300px;left:-110px;top:420px;opacity:.55"></div>
      <div style="position:absolute;left:140px;right:140px;top:330px;aspect-ratio:4/5;border-radius:40px;overflow:hidden;border:1px solid ${TOKENS.line}"><img class="kb" src="${asset(img)}" style="width:100%;height:100%;object-fit:cover"></div>
      <div style="position:absolute;left:140px;right:140px;top:1400px"><h2 class="h1" data-in=".2" style="font-size:96px">${name}</h2><p class="lead" data-in=".4" style="font-size:40px;margin-top:14px">Sites, Google e atendimento</p></div>`;
    const kb = `async(local,dur,el)=>{const i=el.querySelector('.kb');if(i)i.style.transform='scale('+(1.06-0.06*Math.min(1,local/dur))+')';}`;
    const pair = `<div style="display:flex;gap:24px;margin-top:64px" data-in=".9">${['lucas.webp', 'antonio.webp'].map((f) => `<img src="${asset(f)}" style="width:200px;aspect-ratio:4/5;object-fit:cover;border-radius:24px;border:1px solid ${TOKENS.line}">`).join('')}</div>`;
    const html = reelPage({
      scenes: [
        { start: 0, end: 3, html: hook('Quem é a <span class="blue">Growlift?</span>', { lead: 'Prazer, somos o Lucas e o Antônio.' }) },
        { start: 3, end: 6.6, html: person('lucas.webp', 'Lucas'), update: kb },
        { start: 6.6, end: 10.2, html: person('antonio.webp', 'Antônio'), update: kb },
        {
          start: 10.2, end: 15.6,
          html: `<div class="glow" style="width:1300px;height:1300px;right:-500px;top:500px;opacity:.5"></div><div class="safe" style="justify-content:center">
            <h2 class="h1" style="font-size:88px">Somos jovens, <span class="blue">de São Paulo.</span></h2>
            <p class="lead" data-in=".5" style="font-size:44px;margin-top:40px">A gente cria sites para negócios locais, cuida da presença no Google e coloca o pedido e o pagamento no site do cliente.</p>${pair}</div>`,
        },
        { start: 15.6, end: 20.5, html: end('Quem conversa com você é quem faz o seu site.', { lead: 'Manda um oi. Link na bio.' }) },
      ],
    });
    return { html, duration: 20.5, cover: 1.2 };
  },

  // 8. Pedido e Pix no site (loja de demonstração local, nome fictício; nada é cobrado)
  async 8() {
    const demo = await startDemoStore();
    let did = {};
    try {
      const rec = await captureSite({
        id: '8', url: `${demo.url}/loja/${DEMO_SLUG}`, duration: 13,
        viewport: { width: 1180, height: 820 }, device: { deviceScaleFactor: 2, isMobile: false, hasTouch: false },
        setup: async (page, ctx) => {
          await ctx.addCookies([{ name: 'plataforma_sessao', value: demo.cookie, url: demo.url }]);
        },
        steps: async (t, page) => {
          if (t >= 1.2 && !did.order) { did.order = await demo.placeOrder(); await page.reload({ waitUntil: 'networkidle' }); }
          if (t >= 3 && !did.pix) { did.pix = true; await demo.payPix(did.order); await page.reload({ waitUntil: 'networkidle' }); }
          if (t >= 6 && !did.accept) { did.accept = true; await page.getByRole('button', { name: 'Aceitar pedido' }).first().click(); await page.waitForTimeout(700); }
          if (t >= 9.5 && !did.out) { did.out = true; await page.getByRole('button', { name: 'Saiu para entrega' }).first().click(); await page.waitForTimeout(700); }
        },
      });
      const tablet = `<div style="position:absolute;left:44px;right:44px;top:610px;padding:18px;border-radius:40px;background:#1a2130;box-shadow:0 60px 120px -40px rgba(8,101,254,.55),0 0 0 2px rgba(255,255,255,.07)"><div style="border-radius:24px;overflow:hidden;aspect-ratio:1180/820"><img class="rec cam" data-seq="${pathToFileURL(rec.dir).href}" src="${pathToFileURL(path.join(rec.dir, '00000.jpg')).href}" style="display:block;width:100%;height:100%;transform-origin:0 0"></div></div>`;
      // Câmera: começa na tela inteira, aproxima no pedido e acompanha quando ele muda de coluna.
      const camera = `async(local,dur,el)=>{await (${playSeq(rec.count, 0.4)})(local,dur,el);const r=local-0.4;const E=window.ease.easeInOut;const z=1+0.9*E((r-1.4)/0.9);const x=0+300*E((r-9.7)/0.9);const y=105*E((r-1.4)/0.9);const img=el.querySelector('img.cam');img.style.transform='scale('+z+') translate('+(-x/1180*100)+'%,'+(-y/820*100)+'%)';}`;
      const steps = [['1.2', 'O cliente pede e paga com Pix no seu site.'], ['5.4', 'O pedido chega na tela da loja.'], ['9', 'Você aceita e avisa quando sai.']];
      const html = reelPage({
        scenes: [
          { start: 0, end: 3.2, html: hook('E se o seu cliente pedisse direto no seu site, <span class="blue">sem comissão?</span>') },
          {
            start: 3.2, end: 17,
            html: `<div class="glow" style="width:1300px;height:1300px;left:-110px;top:520px;opacity:.5"></div>
              <div style="position:absolute;left:96px;right:120px;top:250px"><p class="eyebrow">Plano Lift</p><h2 class="h1" style="font-size:66px;margin-top:18px">Pedido e Pix no seu site.</h2><div style="margin-top:22px"><span class="tag">Loja de demonstração · pedido de teste</span></div></div>
              ${tablet}
              <ul style="position:absolute;left:96px;right:120px;top:1370px;list-style:none;display:grid;gap:26px">${steps.map(([at, s]) => `<li data-in="${at}" style="display:flex;gap:22px;align-items:center;font-size:40px;color:${TOKENS.soft}">${icon('check', { size: 44, width: 2.4 })}${s}</li>`).join('')}</ul>`,
            update: camera,
          },
          { start: 17, end: 21.5, html: end('Sem comissão por pedido. Conheça o plano Lift.') },
        ],
      });
      return { html, duration: 21.5, cover: 1.2 };
    } finally {
      await demo.stop();
    }
  },

  // 10. Pedido na mesa (plano Scale): QR da mesa, código para o amigo, salão do garçom.
  // Loja de demonstração local, nome fictício; nenhum pedido real.
  async 10() {
    const demo = await startDemoStore({ tables: true });
    const mesa = `${demo.url}/mesa/${DEMO_SLUG}/5?k=${demo.tableKey(5)}`;
    // A tap: the dot shows where the finger goes, then the real click happens.
    const tapper = () => {
      let until = -1, at = null;
      return {
        async tap(t, page, loc) {
          await loc.scrollIntoViewIfNeeded();
          const b = await loc.boundingBox();
          at = [b.x + b.width / 2, b.y + b.height / 2];
          until = t + 0.45;
          await page.evaluate(([x, y]) => window.__tap(x, y, 1), at);
          await page.waitForTimeout(60);
          await loc.click();
        },
        async frame(t, page) {
          if (!at) return;
          const k = until > t ? (until - t) / 0.45 : 0;
          await page.evaluate(([x, y, k]) => window.__tap(x, y, k), [...at, k]);
          if (k <= 0) at = null;
        },
      };
    };
    let code = '', device = null;
    try {
      // 1. Cliente: abre a mesa pelo QR e pede.
      const a = tapper(), da = {};
      const recA = await captureSite({
        id: '10a', url: mesa, duration: 10,
        steps: async (t, page) => {
          await a.frame(t, page);
          if (t >= 1.0 && !da.open) { da.open = 1; await a.tap(t, page, page.getByRole('button', { name: 'Abrir a Mesa 5' })); await page.getByRole('button', { name: /^Adicionar / }).first().waitFor(); }
          if (t >= 3.0 && !da.add1) { da.add1 = 1; await a.tap(t, page, page.getByRole('button', { name: 'Adicionar Brasa Duplo' })); }
          if (t >= 4.2 && !da.add2) { da.add2 = 1; await a.tap(t, page, page.getByRole('button', { name: 'Adicionar Batata rústica' })); }
          if (t >= 5.6 && !da.see) { da.see = 1; await a.tap(t, page, page.getByRole('button', { name: /Ver pedido/ })); }
          if (t >= 7.0 && !da.send) {
            da.send = 1;
            await a.tap(t, page, page.getByRole('button', { name: /Enviar para a cozinha/ }));
            await page.getByText('Pedido enviado!').waitFor();
            code = (await page.getByText(/código \d{4}/).first().textContent()).match(/\d{4}/)[0];
            device = (await page.context().cookies()).find((c) => c.name !== 'plataforma_sessao');
          }
        },
      });
      // 2. O amigo entra com o código.
      const b = tapper(), db = {};
      const recB = await captureSite({
        id: '10b', url: mesa, duration: 5.5,
        steps: async (t, page) => {
          await b.frame(t, page);
          if (t >= 0.6 && !db.type) { db.type = 1; const f = page.getByLabel(/Digite o código/); await f.scrollIntoViewIfNeeded(); await f.click(); }
          for (let i = 0; i < 4; i++) {
            if (t >= 1.0 + i * 0.35 && !db['d' + i]) { db['d' + i] = 1; await page.keyboard.type(code[i]); }
          }
          if (t >= 2.8 && !db.go) { db.go = 1; await b.tap(t, page, page.getByRole('button', { name: 'Entrar na mesa' })); await page.getByText(/código \d{4}/).first().waitFor(); }
        },
      });
      // 3. Salão: o garçom confirma a mesa, atende o chamado e fecha a conta.
      const call = (kind) => fetch(`${demo.url}/api/public/lojas/${DEMO_SLUG}/mesas/5`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `${device.name}=${device.value}` },
        body: JSON.stringify({ k: demo.tableKey(5), action: 'chamar', kind }),
      });
      const s = tapper(), ds = {};
      const recS = await captureSite({
        id: '10s', url: `${demo.url}/loja/${DEMO_SLUG}/salao`, duration: 9,
        setup: async (page, ctx) => { await ctx.addCookies([{ name: 'plataforma_sessao', value: demo.cookie, url: demo.url }]); },
        steps: async (t, page) => {
          await s.frame(t, page);
          if (t >= 1.2 && !ds.ok) { ds.ok = 1; await s.tap(t, page, page.getByRole('button', { name: 'Confirmar mesa' })); }
          if (t >= 2.6 && !ds.call) { ds.call = 1; await call('garcom'); await call('conta'); await page.getByText('Mesa 5 pediu a conta').waitFor({ timeout: 15000 }); }
          if (t >= 4.4 && !ds.go) { ds.go = 1; await s.tap(t, page, page.getByRole('button', { name: 'Estou indo' })); }
          if (t >= 5.8 && !ds.bill) { ds.bill = 1; await s.tap(t, page, page.getByRole('button', { name: 'Fechar a conta', exact: true })); await page.getByRole('dialog').waitFor(); }
          if (t >= 7.4 && !ds.close) { ds.close = 1; await s.tap(t, page, page.getByRole('button', { name: 'Fechar a conta e liberar a mesa' })); }
        },
      });

      const html = mesa3dReelHtml({ recA, recB, recS });
      return { html, duration: 33.5, cover: 1.6 };
    } finally {
      await demo.stop();
    }
  },

};

function valueFor(name, s) {
  const n = name.toLowerCase();
  if (/whats|tel|fone/.test(n)) return s.whatsapp;
  if (/cidade|city/.test(n)) return s.cidade;
  if (/ramo|segment|tipo/.test(n)) return s.ramo;
  if (/nome|negocio|business/.test(n)) return s.negocio;
  if (/presen|insta|site/.test(n)) return '@padariaexemplo';
  return 'Quero vender mais pelo site';
}

// ---------------------------------------------------------------------------------------

const NAMES = { 1: '01-site-que-passa-de-lado', 2: '02-a-marca-se-monta', 3: '03-do-celular-ao-diagnostico', 4: '04-tres-sinais', 5: '05-perfil-no-google', 6: '06-bastidores', 7: '07-quem-somos', 8: '08-pedido-e-pix', 10: '10-pedido-na-mesa' };
const pick = process.argv.slice(2).filter((a) => REELS[a]);
const which = pick.length ? pick : Object.keys(REELS);
const server = await serve(path.join(ROOT, 'growlift'), SITE_PORT);
fs.mkdirSync(OUT, { recursive: true });
try {
  for (const n of which) {
    console.log(`Reel ${n}`);
    const r = await REELS[n]();
    await renderReel({ id: `reel-${n}`, ...r, out: path.join(OUT, NAMES[n]) });
  }
} finally {
  await close();
  server.close();
}
void FPS;

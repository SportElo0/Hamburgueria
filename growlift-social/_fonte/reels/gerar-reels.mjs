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

function demoStore() {
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
    ordering: { enabled: true, delivery: true, pickup: true, minOrder: 0, eta: '40 a 60 min', pix: true, card: true, cash: true, pixMode: 'demo', coupons: [], areas: [{ id: 'centro', name: 'Centro', fee: 600 }] },
  };
}

async function startDemoStore() {
  const app = path.join(ROOT, 'plataforma');
  if (!fs.existsSync(path.join(app, '.next', 'BUILD_ID'))) throw new Error('Rode "npm run build" em plataforma/ antes do Reel 8.');
  const data = tmpDir('loja-demo');
  const w = (key, v) => { const f = path.join(data, key); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(v)); };
  const now = new Date().toISOString();
  const rec = { store: demoStore(), updatedAt: now, updatedBy: 'reel', publishedAt: now };
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

const NAMES = { 1: '01-site-que-passa-de-lado', 2: '02-a-marca-se-monta', 3: '03-do-celular-ao-diagnostico', 4: '04-tres-sinais', 5: '05-perfil-no-google', 6: '06-bastidores', 7: '07-quem-somos', 8: '08-pedido-e-pix' };
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

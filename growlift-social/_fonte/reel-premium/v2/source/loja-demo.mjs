// Demo shop for the Chapa 77 payment scene: the real ordering system (plataforma/ panel + the checkout
// built for El Patron) running only on this machine, with fictitious data. Nothing reaches a real shop:
// the panel stores in a local folder, Pix is in demo mode (the QR code only says "PIX DE DEMONSTRACAO",
// nothing can be paid) and the customer is "Cliente de teste".
// Needs the two builds first (see v3-revisao.md):
//   plataforma/.next                    npm run build in plataforma/
//   elpatron/out                        NEXT_PUBLIC_CATALOG_URL=http://localhost:3121/api/public/lojas/chapa-77 npx next build
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(ROOT, '../../../..');
export const SLUG = 'chapa-77';
const PANEL_PORT = 3121;
const SITE_PORT = 4321;

/** The El Patron catalog under the Chapa 77 name: one burger and two add-ons renamed, example prices. */
function store() {
  const s = JSON.parse(fs.readFileSync(path.join(REPO, 'plataforma', 'seed', 'el-patron-burger.json'), 'utf8'));
  const RENAME = { 'el-patron': ['Duplo 77', 5800], 'molho-verde': ['Maionese artesanal', 400], 'cheddar-cremoso': ['Cheddar cremoso', 400] };
  for (const c of s.catalog.categories) for (const it of c.items) {
    if (RENAME[it.id]) [it.name, it.price] = RENAME[it.id];
    if (it.id === 'el-patron') it.description = 'Pão brioche, dois blends bovinos de 130 g cada, queijo prato, bacon, alface americana, tomate, cebola roxa e maionese da casa.';
    it.image = '';
    for (const g of it.options ?? []) for (const ch of g.choices) if (RENAME[ch.id]) [ch.label, ch.priceDelta] = RENAME[ch.id];
  }
  return {
    ...s, slug: SLUG, name: 'Chapa 77 Burger', siteUrl: '',
    contact: { whatsapp: '', instagram: '', email: '', phone: '' }, units: [],
    account: { ...s.account, notes: 'Loja de demonstração do Reel 001. Nome fictício.' },
    ordering: { enabled: true, delivery: true, pickup: true, minOrder: 0, eta: '30 a 45 min', pix: true, card: true, cash: true, pixMode: 'demo', coupons: [], areas: [{ id: 'centro', name: 'Centro', fee: 600 }] },
  };
}

/** Plain static server for the exported site (/pedido → pedido.html). */
function serve(dir, port) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain', '.mp4': 'video/mp4', '.ico': 'image/x-icon' };
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = [p, `${p}.html`, path.join(p, 'index.html')].map((f) => path.join(dir, f)).find((f) => f.startsWith(dir) && fs.existsSync(f) && fs.statSync(f).isFile());
    if (!file) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

export async function startShop() {
  const app = path.join(REPO, 'plataforma');
  const out = path.join(REPO, 'elpatron', 'out');
  if (!fs.existsSync(path.join(app, '.next', 'BUILD_ID'))) throw new Error('Rode "npm run build" em plataforma/ antes.');
  if (!fs.existsSync(path.join(out, 'index.html'))) throw new Error('Gere elpatron/out apontando para a loja local (ver v3-revisao.md).');
  const data = path.join(ROOT, 'assets', '_gravacoes', 'loja-demo');
  fs.rmSync(data, { recursive: true, force: true });
  const w = (key, v) => { const f = path.join(data, key); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(v)); };
  const now = new Date().toISOString();
  const rec = { store: store(), updatedAt: now, updatedBy: 'reel', publishedAt: now };
  w(`lojas/${SLUG}/rascunho.json`, rec);
  w(`lojas/${SLUG}/publicado.json`, rec);
  w(`lojas/${SLUG}/operacao.json`, { open: true, updatedAt: null, updatedBy: '' });

  const secret = crypto.randomBytes(32).toString('hex');
  const log = fs.openSync(path.join(data, 'painel.log'), 'a');
  const proc = spawn('npx', ['next', 'start', '-p', String(PANEL_PORT)], {
    cwd: app, detached: true, stdio: ['ignore', log, log],
    env: { ...process.env, SESSION_SECRET: secret, PLATAFORMA_DATA_DIR: data, ADMIN_USERS: '[]', BLOB_READ_WRITE_TOKEN: '' },
  });
  const panel = `http://localhost:${PANEL_PORT}`;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${panel}/login`)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  const server = await serve(out, SITE_PORT);
  // Same signed session as the panel (src/lib/session.ts), with this run's secret only.
  const b64 = (b) => Buffer.from(b).toString('base64url');
  const body = b64(JSON.stringify({ email: 'demo@teste.local', name: 'Loja de demonstração', role: 'equipe', exp: Date.now() + 3_600_000 }));
  const cookie = `${body}.${b64(crypto.createHmac('sha256', secret).update(body).digest())}`;
  const api = `${panel}/api/public/lojas/${SLUG}/pedidos`;
  return {
    panel, site: `http://localhost:${SITE_PORT}`, cookie,
    /** The same order the phone scene builds: Duplo 77 + cheddar + maionese, pickup, Pix. */
    async placeOrder() {
      const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        items: [{ productId: 'el-patron', quantity: 1, selections: { adicionais: ['cheddar-cremoso', 'molho-verde'] }, notes: '' }],
        customer: { name: 'Cliente de teste', phone: '11900000000' }, mode: 'retirada', payment: 'pix',
      }) });
      const o = await res.json();
      if (!res.ok) throw new Error(`pedido de teste: ${o.error}`);
      return o;
    },
    async payPix(order) {
      const res = await fetch(`${api}/${order.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'simular-pix', token: order.token }) });
      if (!res.ok) throw new Error('Pix de demonstração falhou');
    },
    async stop() { server.close(); try { process.kill(-proc.pid); } catch {} await new Promise((r) => setTimeout(r, 1500)); },
  };
}

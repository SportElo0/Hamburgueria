// Offline render driver for the El Patron illustrative asset kit (the Downtown studio, El Patron recipes).
//   node elpatron/tools/studio/render.mjs preview <burger|prop> [mode]   → tools/studio/out/
//   node elpatron/tools/studio/render.mjs all                             → public/renders/ + src/content/renders.json
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

// The page is served from the repository root so the import map can reach node_modules/three.
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ROOT = path.resolve(SITE, '..');
const OUT_PREVIEW = path.join(SITE, 'tools/studio/out');
const OUT_PUBLIC = path.join(SITE, 'public/renders');
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      const file = path.join(ROOT, url === '/' ? 'elpatron/tools/studio/index.html' : url);
      if (!file.startsWith(ROOT)) return res.writeHead(403).end();
      try {
        const body = await fs.readFile(file);
        res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404).end();
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function openStudio() {
  const server = await serve();
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage();
  page.on('console', (m) => m.type() === 'error' && console.error('[studio]', m.text()));
  page.on('pageerror', (e) => console.error('[studio]', e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/elpatron/tools/studio/index.html`);
  await page.waitForFunction(() => window.studioReady === true, null, { timeout: 60000 });
  return {
    page,
    async close() {
      await browser.close();
      server.close();
    },
  };
}

const dataToBuf = (d) => Buffer.from(d.split(',')[1], 'base64');

// Downscale (supersampling), bake a soft contact shadow, optionally trim. Returns { buf, box, frame }.
async function finish(png, { out, shadow = 0.32, blur = 10, dy = 8, trim = true, frameOut }) {
  const src = sharp(png);
  const meta = await src.metadata();
  const scale = frameOut / meta.width;
  const { data, info } = await sharp(png).resize(frameOut, frameOut, { kernel: 'lanczos3' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  let rgba = data;
  if (shadow > 0) {
    const alpha = Buffer.alloc(W * H);
    for (let i = 0; i < W * H; i++) alpha[i] = data[i * 4 + 3];
    const blurred = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } }).blur(blur).extractChannel(0).raw().toBuffer();
    const outBuf = Buffer.alloc(W * H * 4);
    const shift = Math.round(dy);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const sy = y - shift;
        const sa = sy >= 0 ? (blurred[sy * W + x] / 255) * shadow : 0;
        const la = data[i * 4 + 3] / 255;
        const oa = la + sa * (1 - la);
        for (let c = 0; c < 3; c++) outBuf[i * 4 + c] = oa > 0 ? Math.round((data[i * 4 + c] * la) / oa) : 0;
        outBuf[i * 4 + 3] = Math.round(oa * 255);
      }
    }
    rgba = outBuf;
  }
  let box = { left: 0, top: 0, width: W, height: H };
  if (trim) {
    let minX = W, minY = H, maxX = -1, maxY = -1;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (rgba[(y * W + x) * 4 + 3] > 3) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
    const pad = 2;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
    box = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  }
  let img = sharp(rgba, { raw: { width: W, height: H, channels: 4 } });
  if (trim) img = img.extract(box);
  if (out.endsWith('.png')) await img.png().toFile(out);
  else await img.webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(out);
  return { box, frame: W, scale };
}

async function preview(target, mode = 'composite') {
  await fs.mkdir(OUT_PREVIEW, { recursive: true });
  const s = await openStudio();
  const list = await s.page.evaluate(() => window.studio.list());
  const t0 = Date.now();
  const shots = list.burgers.includes(target)
    ? await s.page.evaluate((a) => window.studio.burger(a), { recipe: target, size: 1400, mode })
    : await s.page.evaluate((a) => window.studio.prop(a), { id: target, size: 1200 });
  for (const shot of shots) {
    const file = path.join(OUT_PREVIEW, `${target}-${shot.name}.png`);
    await fs.writeFile(file, dataToBuf(shot.data));
    await sharp(dataToBuf(shot.data)).flatten({ background: process.env.BG || '#1a1410' }).jpeg({ quality: 88 }).toFile(file.replace('.png', '.bg.jpg'));
    console.log('wrote', path.relative(SITE, file));
  }
  console.log(`rendered in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await s.close();
}

const pct = (v, frame) => +((v / frame) * 100).toFixed(3);

async function all(only) {
  const s = await openStudio();
  const list = await s.page.evaluate(() => window.studio.list());
  const manifest = { generatedAt: new Date().toISOString(), note: 'Illustrative procedural 3D renders (tools/studio). Not official product photography.', burgers: {}, props: {} };
  const RENDER = 2000; // supersampled render size
  for (const id of list.burgers) {
    if (only && !only.includes(id)) continue;
    const t0 = Date.now();
    const dir = path.join(OUT_PUBLIC, 'burgers', id);
    await fs.mkdir(dir, { recursive: true });
    const [comp] = await s.page.evaluate((a) => window.studio.burger(a), { recipe: id, size: RENDER, mode: 'composite' });
    const compPng = dataToBuf(comp.data);
    await finish(compPng, { out: path.join(dir, 'card.webp'), frameOut: 900, shadow: 0, trim: false });
    await finish(compPng, { out: path.join(dir, 'hero.webp'), frameOut: 1600, shadow: 0, trim: false });
    const layers = await s.page.evaluate((a) => window.studio.burger(a), { recipe: id, size: RENDER, mode: 'layers' });
    const entries = [];
    for (const layer of layers) {
      const png = dataToBuf(layer.data);
      const file = `${layer.name}.webp`;
      const big = await finish(png, { out: path.join(dir, file), frameOut: 1600, shadow: 0.3, blur: 9, dy: 9 });
      await finish(png, { out: path.join(dir, `${layer.name}.sm.webp`), frameOut: 800, shadow: 0.3, blur: 5, dy: 5 });
      const f = big.frame, k = big.scale;
      entries.push({
        key: layer.key,
        label: layer.label,
        src: `/renders/burgers/${id}/${file}`,
        srcSm: `/renders/burgers/${id}/${layer.name}.sm.webp`,
        box: { x: pct(big.box.left, f), y: pct(big.box.top, f), w: pct(big.box.width, f), h: pct(big.box.height, f) },
        anchor: {
          left: { x: pct(layer.anchor.left.x * k, f), y: pct(layer.anchor.left.y * k, f) },
          right: { x: pct(layer.anchor.right.x * k, f), y: pct(layer.anchor.right.y * k, f) },
          center: { x: pct(layer.anchor.center.x * k, f), y: pct(layer.anchor.center.y * k, f) },
        },
      });
    }
    manifest.burgers[id] = { card: `/renders/burgers/${id}/card.webp`, hero: `/renders/burgers/${id}/hero.webp`, layers: entries };
    console.log(`${id}: ${layers.length} layers in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  for (const id of list.props) {
    if (only && !only.includes(id)) continue;
    const dir = path.join(OUT_PUBLIC, 'props');
    await fs.mkdir(dir, { recursive: true });
    const [shot] = await s.page.evaluate((a) => window.studio.prop(a), { id, size: 1600 });
    const sprite = id.startsWith('float-');
    const res = await finish(dataToBuf(shot.data), { out: path.join(dir, `${id}.webp`), frameOut: sprite ? 600 : 800, shadow: 0, trim: sprite });
    manifest.props[id] = { src: `/renders/props/${id}.webp`, w: res.box.width, h: res.box.height };
    console.log(`prop ${id}`);
  }
  const manifestPath = path.join(SITE, 'src/content/renders.json');
  let prev = {};
  try { prev = JSON.parse(await fs.readFile(manifestPath, 'utf8')); } catch {}
  const merged = only ? { ...prev, ...manifest, burgers: { ...prev.burgers, ...manifest.burgers }, props: { ...prev.props, ...manifest.props } } : manifest;
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, JSON.stringify(merged, null, 2));
  await s.close();
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'preview') await preview(rest[0], rest[1]);
else if (cmd === 'all') await all(rest.length ? rest : null);
else console.log('usage: render.mjs preview <id> [composite|layers] | all [ids...]');

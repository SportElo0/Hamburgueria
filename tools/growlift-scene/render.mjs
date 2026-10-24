// Renders the Growlift scroll scene into WebP frames.
//   node tools/growlift-scene/render.mjs preview <outDir> [t,t,...]   → PNG stills for review
//   node tools/growlift-scene/render.mjs all                          → growlift/img/lift/{d,m}/NN.webp
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MIME = { '.js': 'text/javascript', '.html': 'text/html' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const FRAMES = 72;
const SETS = [
  { name: 'd', w: 1600, h: 900 },
  { name: 'm', w: 720, h: 1200 },
];
const SUPER = 1.5;

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
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

const server = await serve();
const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[scene]', e.message));
page.on('console', (msg) => msg.type() === 'error' && console.error('[scene]', msg.text()));
await page.goto(`http://127.0.0.1:${server.address().port}/tools/growlift-scene/index.html`);
await page.waitForFunction(() => window.sceneReady === true, null, { timeout: 60000 });

const shot = async (t, w, h) => {
  const data = await page.evaluate(([t, w, h]) => window.renderFrame(t, w, h), [t, Math.round(w * SUPER), Math.round(h * SUPER)]);
  return sharp(Buffer.from(data.split(',')[1], 'base64')).resize(w, h, { kernel: 'lanczos3' });
};

const [mode, outArg, list] = process.argv.slice(2);
if (mode === 'preview') {
  await fs.mkdir(outArg, { recursive: true });
  const ts = (list || '0,0.25,0.5,0.75,1').split(',').map(Number);
  for (const set of SETS) {
    for (const t of ts) {
      await (await shot(t, set.w, set.h)).png().toFile(path.join(outArg, `${set.name}-${t}.png`));
      console.log('preview', set.name, t);
    }
  }
} else if (mode === 'all') {
  for (const set of SETS) {
    const dir = path.join(ROOT, 'growlift/img/lift', set.name);
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    for (let i = 0; i < FRAMES; i++) {
      const t = i / (FRAMES - 1);
      await (await shot(t, set.w, set.h)).webp({ quality: 72, effort: 6 }).toFile(path.join(dir, `${String(i).padStart(2, '0')}.webp`));
      if (i % 12 === 0) console.log(set.name, i);
    }
  }
} else {
  console.error('usage: render.mjs preview <outDir> [t,...] | all');
}
await browser.close();
server.close();

// Renders the 3D restaurant of the "pedido na mesa" Reel.
//   node tools/mesa-scene/render.mjs preview <outDir> 0,4,10     → PNG stills (540×960) for review
//   node tools/mesa-scene/render.mjs frames <outDir> [seconds=35.5] → 1080×1920 JPEG per frame at 30 fps
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MIME = { '.js': 'text/javascript', '.html': 'text/html' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const FPS = 30;

const server = await new Promise((resolve) => {
  const s = http.createServer(async (req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(ROOT)) return res.writeHead(403).end();
    try {
      const body = await fs.readFile(file);
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  s.listen(0, '127.0.0.1', () => resolve(s));
});
const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[scene]', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('[scene]', m.text()));
await page.goto(`http://127.0.0.1:${server.address().port}/tools/mesa-scene/index.html`);
await page.waitForFunction(() => window.sceneReady === true, null, { timeout: 90000 });
const shot = async (t, w, h, file) => {
  const data = await page.evaluate(([t, w, h]) => window.renderFrame(t, w, h), [t, w, h]);
  await fs.writeFile(file, Buffer.from(data.split(',')[1], 'base64'));
};

const [mode, out, arg] = process.argv.slice(2);
await fs.mkdir(out, { recursive: true });
if (mode === 'preview') {
  for (const t of (arg || '0,2,5,8,17,20,24,28,30,34').split(',').map(Number)) await shot(t, 540, 960, path.join(out, `p-${t}.jpg`));
} else if (mode === 'frames') {
  const n = Math.round(Number(arg || 35.5) * FPS);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await shot(i / FPS, 1080, 1920, path.join(out, `${String(i).padStart(5, '0')}.jpg`));
    if (i % 60 === 0) console.log(`quadro ${i}/${n} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
} else console.error('usage: render.mjs preview <dir> [t,...] | frames <dir> [seconds]');
await browser.close();
server.close();

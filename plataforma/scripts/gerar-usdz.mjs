// Makes the iPhone's AR file (USDZ) from a dish GLB, so "Ver na minha mesa" opens Quick Look straight away
// instead of converting the model on the customer's phone. Uses three.js's USDZExporter in headless Chromium.
//   node scripts/gerar-usdz.mjs entrada.glb saida.usdz
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [entrada, saida] = process.argv.slice(2);
if (!entrada || !saida) throw new Error('uso: node scripts/gerar-usdz.mjs entrada.glb saida.usdz');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const three = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../node_modules/three');

const pagina = `<!doctype html><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';
window.gerar = async () => {
  const gltf = await new GLTFLoader().loadAsync('/modelo.glb');
  const bytes = await new USDZExporter().parseAsync(gltf.scene, { quickLookCompatible: true, maxTextureSize: 768 });
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
window.pronto = true;
</script>`;

const tipos = { '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = null;
  if (url === '/') return res.writeHead(200, { 'Content-Type': 'text/html' }).end(pagina);
  if (url === '/modelo.glb') file = path.resolve(entrada);
  else if (url.startsWith('/three/')) file = path.join(three, path.normalize(url.slice(7)));
  // Only the model and three.js's own files are served (no path outside node_modules/three).
  if (!file || (url !== '/modelo.glb' && !file.startsWith(three + path.sep)) || !fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'Content-Type': tipos[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('erro na página:', e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => window.pronto === true);
  const b64 = await page.evaluate(() => window.gerar());
  fs.writeFileSync(saida, Buffer.from(b64, 'base64'));
  console.log(`ok: ${saida} (${(fs.statSync(saida).size / 1048576).toFixed(1)} MB)`);
} finally {
  await browser.close();
  server.close();
}

// Renders the Reel 33 menu photos (fotos33.js) into img33/: node fotos33-render.mjs
import fs from 'node:fs';
import path from 'node:path';
import { buildSync } from 'esbuild';
import { chromium } from 'playwright-core';
import { CHROME } from '/home/user/Hamburgueria/growlift-social/_fonte/reels/motor.mjs';
const HERE = '/home/user/Hamburgueria/growlift-social/_fonte/reels/novos';
const js = buildSync({ entryPoints: [path.join(HERE, 'fotos33.js')], bundle: true, format: 'iife', write: false, minify: true, logLevel: 'error', absWorkingDir: '/home/user/Hamburgueria' }).outputFiles[0].text;
const b64 = (f) => fs.readFileSync(f).toString('base64');
const html = `<!doctype html><body style="margin:0"><canvas id="c" width="720" height="720"></canvas><script>window.BURGER="${b64('/home/user/Hamburgueria/plataforma/public/3d/hamburguer-exemplo.glb')}";window.DESSERT="${b64('/home/user/Hamburgueria/plataforma/public/3d/sobremesa-exemplo.glb')}";</script><script>${js}</script></body>`;
const f = '/tmp/claude-0/-home-user-Hamburgueria/71fc6741-ec51-52d4-bb4a-f7652473c3e4/scratchpad/fotos.html'; fs.writeFileSync(f, html);
const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 720, height: 720 } });
p.on('pageerror', (e) => console.error(e.message));
await p.goto('file://' + f);
for (const k of ['classico', 'sobremesa', 'fritas', 'refri']) { await p.evaluate((k) => window.shot(k), k); await p.locator('#c').screenshot({ path: path.join(HERE, 'img33', `foto-${k}.png`) }); }
await b.close();

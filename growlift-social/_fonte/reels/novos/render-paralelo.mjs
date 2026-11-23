// Heavy 3D reels (e.g. 33): the same frames as render.mjs, split across N browsers at once (frame i goes to browser
// i mod N), then the same encode and the narration on top. Every frame is a pure function of t, so the result is
// identical to a single-browser render, only faster.
// node render-paralelo.mjs 33 33-quatro-estrelas [N=3]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { CHROME, FPS, W, H } from '../motor.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../../05-reels');
const [id, name, nArg] = process.argv.slice(2);
const N = Number(nArg) || 3;
const reel = await import(`./reel${id}.mjs`);
const work = path.join(process.env.REELS_TMP || path.join(os.tmpdir(), 'growlift-reels'), `paralelo-${id}`);
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });
const htmlPath = path.join(work, 'reel.html');
fs.writeFileSync(htmlPath, reel.html());
const frames = Math.round(reel.DURATION * FPS);
const t0 = Date.now();

async function worker(k) {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await b.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', (e) => console.error(`[${k}]`, e.message));
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  for (let i = k; i < frames; i += N) {
    await page.evaluate((t) => window.render(t), i / FPS);
    await page.screenshot({ path: path.join(work, `${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 97 });
    if (k === 0 && i % (N * 60) === 0) console.log(`  ${i}/${frames} quadros · ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  if (k === 0) {
    await page.evaluate((t) => window.render(t), reel.COVER);
    await page.screenshot({ path: path.join(OUT, `${name}-capa.png`) });
  }
  await b.close();
}
await Promise.all(Array.from({ length: N }, (_, k) => worker(k)));

const mudo = path.join(OUT, `${name}-mudo.mp4`);
let r = spawnSync('ffmpeg', [
  '-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(work, '%05d.jpg'),
  '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.1', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-tune', 'animation',
  '-maxrate', '9M', '-bufsize', '18M', '-g', '60', '-keyint_min', '30', '-x264-params', 'aq-mode=3',
  '-r', String(FPS), '-movflags', '+faststart', mudo,
], { stdio: 'inherit' });
if (r.status !== 0) throw new Error('ffmpeg (vídeo) falhou');
const voice = path.resolve(HERE, reel.AUDIO || `../narracao-${id}-eleven.mp3`);
const DUR = reel.DURATION;
r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mudo, '-i', voice, '-filter_complex', `[1:a]apad,atrim=0:${DUR},afade=t=out:st=${DUR - 0.6}:d=0.6,loudnorm=I=-14:TP=-1.5:LRA=11[a]`, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', '-shortest', path.join(OUT, `${name}.mp4`)], { stdio: 'inherit' });
if (r.status !== 0) throw new Error('ffmpeg (áudio) falhou');
fs.rmSync(work, { recursive: true, force: true });
console.log(`${path.join(OUT, name)}.mp4 · ${frames} quadros · ${Math.round((Date.now() - t0) / 1000)} s`);

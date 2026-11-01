// node render.mjs 11 [--still 1,5,9]   → stills to $REELS_TMP/stills-11/ (for checking)
// node render.mjs 11                    → growlift-social/05-reels/NN-*.mp4 with the narration, plus the cover
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch, close, renderReel } from '../motor.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../../05-reels');
const NAMES = { 1: '01-quatro-negocios', 5: '05-aberto-no-google', 11: '11-dois-amigos', 12: '12-cardapio-completo', 13: '13-porta-aberta' };

const id = process.argv[2];
const stillArg = process.argv.indexOf('--still');
const reel = await import(`./reel${id}.mjs`);
const html = reel.html();

if (stillArg > 0) {
  const times = process.argv[stillArg + 1].split(',').map(Number);
  const dir = path.join(process.env.REELS_TMP || os.tmpdir(), `stills-${id}`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'reel.html');
  fs.writeFileSync(file, html);
  const b = await launch();
  const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('erro na página:', e.message));
  await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  for (const t of times) {
    // Run through the timeline up to t so text that changes over time (captions) is in its real state.
    await page.evaluate((t) => window.render(t), t);
    await page.screenshot({ path: path.join(dir, `t${String(t).padStart(5, '0')}.png`) });
  }
  await close();
  console.log(dir);
} else {
  const base = path.join(OUT, NAMES[id]);
  await renderReel({ id: `reel-${id}`, html, duration: reel.DURATION, cover: reel.COVER, out: `${base}-mudo` });
  await close();
  const voice = path.resolve(HERE, `../narracao-${id}-eleven.mp3`);
  // Narration on top, a short fade at the end; the silent version stays for posting with music.
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${base}-mudo.mp4`, '-i', voice, '-filter_complex', `[1:a]apad,atrim=0:${reel.DURATION},afade=t=out:st=${reel.DURATION - 0.6}:d=0.6,loudnorm=I=-14:TP=-1.5:LRA=11[a]`, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', '-shortest', `${base}.mp4`], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg (áudio) falhou');
  fs.renameSync(`${base}-mudo-capa.png`, `${base}-capa.png`);
  console.log(`${base}.mp4`);
}

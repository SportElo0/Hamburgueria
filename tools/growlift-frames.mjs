// Cuts a video into the WebP frames the Growlift "Subida" section scrubs with the scroll.
//   node tools/growlift-frames.mjs <video> [frames=72] [mobileCropCenterX=0.62] [mobileCropTop=0.22]
// Writes growlift/img/lift/d (16:9, 1440x810) and growlift/img/lift/m (portrait crop, 640x1040).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [video, framesArg = '72', centerArg = '0.62', topArg = '0.22'] = process.argv.slice(2);
if (!video) {
  console.error('usage: growlift-frames.mjs <video> [frames] [mobileCropCenterX] [mobileCropTop]');
  process.exit(1);
}
const FRAMES = Number(framesArg);
const CENTER = Number(centerArg);
// On phones the copy covers the lower half, so the crop drops the top of the frame to lift the shops up.
const TOP = Number(topArg);

const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'frames-'));
// Every source frame as lossless PNG, then FRAMES of them evenly spaced from first to last.
execFileSync('ffmpeg', ['-v', 'error', '-i', video, path.join(tmp, '%04d.png')]);
const all = (await fs.readdir(tmp)).filter((f) => f.endsWith('.png')).sort();
const pngs = Array.from({ length: FRAMES }, (_, k) => all[Math.round((k * (all.length - 1)) / (FRAMES - 1))]);

const out = { d: path.join(ROOT, 'growlift/img/lift/d'), m: path.join(ROOT, 'growlift/img/lift/m') };
for (const dir of Object.values(out)) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}
for (const [i, file] of pngs.entries()) {
  const src = path.join(tmp, file);
  const name = `${String(i).padStart(2, '0')}.webp`;
  const { width, height } = await sharp(src).metadata();
  await sharp(src).resize(1440, 810).webp({ quality: 58, effort: 6 }).toFile(path.join(out.d, name));
  const top = Math.round(height * TOP);
  const ch = height - top;
  const cw = Math.round((ch * 640) / 1040);
  const left = Math.min(width - cw, Math.max(0, Math.round(width * CENTER - cw / 2)));
  await sharp(src).extract({ left, top, width: cw, height: ch }).resize(640, 1040).webp({ quality: 58, effort: 6 }).toFile(path.join(out.m, name));
}
await fs.rm(tmp, { recursive: true, force: true });
console.log(`${pngs.length} frames from ${all.length} source frames`);

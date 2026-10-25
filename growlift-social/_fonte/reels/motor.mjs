// Reels engine: a reel is an HTML page with scenes on a timeline. Each frame is a screenshot
// at time t (window.render(t)), and ffmpeg joins them into a vertical H.264 MP4 for Instagram.
// Site recordings are captured from the real site, frame by frame, before the reel is rendered.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { TOKENS, MARK } from '../pecas.mjs';

export const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export const FPS = 30;
export const W = 1080;
export const H = 1920;

let browser = null;
export async function launch() {
  browser ??= await chromium.launch({ executablePath: CHROME, args: ['--autoplay-policy=no-user-gesture-required'] });
  return browser;
}
export async function close() {
  await browser?.close();
  browser = null;
}

export const tmpDir = (name) => {
  const dir = path.join(process.env.REELS_TMP || path.join(os.tmpdir(), 'growlift-reels'), name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

function encode(framesDir, out) {
  const r = spawnSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(framesDir, '%05d.jpg'),
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '21', '-preset', 'slow',
    '-r', String(FPS), '-movflags', '+faststart', out,
  ], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`ffmpeg falhou (${out})`);
}

/** Renders one reel page to MP4 and saves the cover frame (Instagram's Reel cover) as PNG. */
export async function renderReel({ id, html, duration, cover, out }) {
  const b = await launch();
  const work = tmpDir(id);
  const htmlPath = path.join(work, 'reel.html');
  fs.writeFileSync(htmlPath, html);
  const page = await b.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', (e) => console.error(`[${id}]`, e.message));
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const frames = Math.round(duration * FPS);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.render(t), i / FPS);
    await page.screenshot({ path: path.join(work, `${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 94 });
  }
  encode(work, `${out}.mp4`);
  await page.evaluate((t) => window.render(t), cover);
  await page.screenshot({ path: `${out}-capa.png` });
  await page.close();
  fs.rmSync(work, { recursive: true, force: true });
  console.log(`  ${path.basename(out)}.mp4 · ${duration}s · ${frames} quadros`);
}

// ---------------------------------------------------------------------------------------
// Page builder. Scenes: { start, end, html, css?, update? (JS source: async (local, dur) => {}) }.
// Inside a scene, any element with data-in="s" fades and rises in s seconds after the scene starts.

const FONT = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">';

export const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${TOKENS.bg}}
body{position:relative;font-family:Inter,system-ui,sans-serif;color:${TOKENS.text};-webkit-font-smoothing:antialiased}
.scene{position:absolute;inset:0;visibility:hidden}
.glow{position:absolute;border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,rgba(8,101,254,.42),rgba(8,101,254,0) 70%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:72px 72px;-webkit-mask-image:radial-gradient(ellipse at 50% 45%,#000 25%,transparent 72%)}
.safe{position:absolute;left:96px;right:140px;top:250px;bottom:330px;display:flex;flex-direction:column}
.eyebrow{font-size:30px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${TOKENS.eyebrow}}
.h1{font-weight:800;letter-spacing:-.035em;line-height:1.0}
.blue{color:${TOKENS.blueBright}}
.lead{color:${TOKENS.soft};line-height:1.35}
.muted{color:${TOKENS.muted}}
.card{background:${TOKENS.surface};border:1px solid ${TOKENS.line};border-radius:32px}
.btn{display:inline-flex;align-items:center;justify-content:center;background:${TOKENS.blue};color:#fff;border-radius:999px;font-weight:700;box-shadow:0 24px 50px -20px rgba(8,101,254,.9)}
.tag{display:inline-block;font-size:24px;font-weight:600;letter-spacing:.04em;color:${TOKENS.soft};background:rgba(6,8,13,.72);border:1px dashed rgba(255,255,255,.28);border-radius:999px;padding:10px 22px}
.brand{position:absolute;left:96px;top:176px;display:flex;align-items:center;gap:14px;font-size:26px;font-weight:700;letter-spacing:.12em;color:${TOKENS.soft};z-index:20}
.brand svg{height:1.05em;width:auto}
.phone{position:absolute;left:50%;width:604px;margin-left:-302px;border-radius:64px;padding:16px;background:#1a2130;box-shadow:0 60px 120px -40px rgba(8,101,254,.55),0 0 0 2px rgba(255,255,255,.07)}
.phone .screen{position:relative;width:572px;height:1017px;border-radius:48px;overflow:hidden;background:#000}
.phone img.rec{display:block;width:100%;height:100%;object-fit:cover}
`;

const RUNTIME = `
const clamp=(x)=>Math.max(0,Math.min(1,x));
const easeOut=(x)=>1-Math.pow(1-clamp(x),3);
const easeInOut=(x)=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
window.ease={clamp,easeOut,easeInOut};
const scenes=[...document.querySelectorAll('.scene')].map((el,i)=>({el,i,start:+el.dataset.start,end:+el.dataset.end,fade:el.dataset.fade!==undefined?+el.dataset.fade:.3}));
window.render=async(t)=>{
  for(const s of scenes){
    const local=t-s.start,dur=s.end-s.start;
    const vis=local>=0&&local<dur;
    let o=0;
    if(vis){
      const fin=s.i===0?1:easeOut(local/s.fade);
      const fout=s.i===scenes.length-1?1:easeOut((dur-local)/s.fade);
      o=Math.min(fin,fout);
    }
    s.el.style.opacity=o;s.el.style.visibility=o>0?'visible':'hidden';
    if(!vis)continue;
    for(const a of s.el.querySelectorAll('[data-in]')){
      const k=easeOut((local-(+a.dataset.in))/(+(a.dataset.dur||.6)));
      const dy=a.dataset.dy!==undefined?+a.dataset.dy:46;
      a.style.opacity=k;a.style.transform='translateY('+((1-k)*dy)+'px)';
    }
    const fn=window.updates&&window.updates[s.el.id];
    if(fn)await fn(local,dur,s.el);
  }
  const imgs=[...document.images].filter(i=>!i.complete);
  await Promise.all(imgs.map(i=>i.decode().catch(()=>{})));
};
`;

export function reelPage({ scenes, css = '', brand = true, script = '' }) {
  const body = scenes
    .map((s, i) => `<section class="scene" id="s${i}" data-start="${s.start}" data-end="${s.end}"${s.fade !== undefined ? ` data-fade="${s.fade}"` : ''}>${s.html}</section>`)
    .join('\n');
  const updates = scenes.map((s, i) => (s.update ? `'s${i}':${s.update}` : '')).filter(Boolean).join(',');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">${FONT}<style>${CSS}${css}</style></head><body>
${brand ? `<div class="brand">${MARK}GROWLIFT</div>` : ''}
${body}
<script>${RUNTIME}window.updates={${updates}};${script}</script></body></html>`;
}

/** A phone showing a recorded frame sequence; `seq` is a directory of 00000.jpg… from captureSite. */
export const phone = (top, seq) => `<div class="phone" style="top:${top}px"><div class="screen"><img class="rec" data-seq="${pathToFileURL(seq).href}" src="${pathToFileURL(path.join(seq, '00000.jpg')).href}" alt=""></div></div>`;

/** Scene update that plays a recorded sequence: frame = (local time - offset) × FPS, held on the last one. */
export const playSeq = (count, offset = 0) => `async(local,dur,el)=>{const img=el.querySelector('img.rec');const n=Math.max(0,Math.min(${count - 1},Math.floor((local-${offset})*${FPS})));const src=img.dataset.seq+'/'+String(n).padStart(5,'0')+'.jpg';if(img.getAttribute('src')!==src){img.src=src;await img.decode().catch(()=>{});}}`;

// ---------------------------------------------------------------------------------------
// Site capture: a real browser on the real site (360×640 at 2×), one screenshot per frame.
// `steps(t, page)` drives scroll, taps and typing for time t; `settle` lets the site's own
// animations (which ease every animation frame) run as they would at 60 fps.

export async function captureSite({ id, url, duration, steps, setup, viewport = { width: 360, height: 640 }, device = { deviceScaleFactor: 2, isMobile: true, hasTouch: true } }) {
  const b = await launch();
  const dir = tmpDir(`rec-${id}`);
  const ctx = await b.newContext({ viewport, ...device, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error(`[rec ${id}]`, e.message));
  if (setup) await setup(page, ctx);
  // Helpers survive reloads (the store screen reloads when a test order arrives).
  await ctx.addInitScript(() => {
    const style = () => {
      const s = document.createElement('style');
      s.textContent = '.tap-dot{position:fixed;z-index:99999;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(255,255,255,.55);border:2px solid #fff;box-shadow:0 0 0 6px rgba(77,141,255,.35);pointer-events:none;transition:none}';
      document.head.appendChild(s);
    };
    if (document.head) style(); else document.addEventListener('DOMContentLoaded', style);
    window.__settle = (n) => new Promise((r) => { const go = () => (n-- <= 0 ? r() : requestAnimationFrame(go)); requestAnimationFrame(go); });
    // Hero video follows the capture clock instead of the wall clock.
    window.__seekVideos = async (t) => {
      for (const v of document.querySelectorAll('video')) {
        v.pause();
        if (!v.duration) continue;
        v.currentTime = t % v.duration;
        await new Promise((r) => { v.onseeked = r; setTimeout(r, 300); });
      }
    };
    window.__tap = (x, y, k) => {
      let d = document.querySelector('.tap-dot');
      if (k <= 0) { d?.remove(); return; }
      if (!d) { d = document.createElement('div'); d.className = 'tap-dot'; document.body.appendChild(d); }
      d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.opacity = String(k); d.style.transform = `scale(${0.7 + 0.3 * k})`;
    };
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  // Warm-up at t=0: lazy images, frame sequences and reveal transitions settle before frame 1.
  await steps(0, page, 0);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1800);
  const frames = Math.round(duration * FPS);
  for (let i = 0; i < frames; i++) {
    const t = i / FPS;
    await steps(t, page, i);
    await page.evaluate(async (t) => { await window.__seekVideos(t); await window.__settle(2); }, t);
    await page.screenshot({ path: path.join(dir, `${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
  }
  await ctx.close();
  console.log(`  gravação ${id}: ${frames} quadros`);
  return { dir, count: frames };
}

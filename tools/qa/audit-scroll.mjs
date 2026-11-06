// Scroll smoothness through the pinned story: frame-time distribution while scrolling continuously.
//   node tools/qa/audit-scroll.mjs <baseUrl>
import { chromium } from 'playwright-core';
const base = process.argv[2];
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

async function measure(label, viewport, mobile, cpu) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const end = await page.evaluate(() => window.__storyST.end);
  const res = await page.evaluate(async (end) => {
    const frames = [];
    let last = performance.now();
    let running = true;
    const tick = (t) => { frames.push(t - last); last = t; if (running) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    // ~ a brisk thumb scroll: the whole story in 8 s, in wheel-sized steps
    const steps = 160;
    for (let i = 1; i <= steps; i++) {
      window.scrollTo(0, (end * i) / steps);
      await new Promise((r) => setTimeout(r, 50));
    }
    await new Promise((r) => setTimeout(r, 600));
    running = false;
    const f = frames.slice(2).sort((a, b) => a - b);
    const pct = (p) => f[Math.min(f.length - 1, Math.floor(f.length * p))];
    return { frames: f.length, fps: Math.round(1000 / (f.reduce((s, x) => s + x, 0) / f.length)), p50: Math.round(pct(0.5)), p95: Math.round(pct(0.95)), over50ms: Math.round((f.filter((x) => x > 50).length / f.length) * 100) };
  }, end);
  console.log(`${label} (CPU ${cpu}x): ~${res.fps} fps médio, p50 ${res.p50} ms, p95 ${res.p95} ms, ${res.over50ms}% quadros >50 ms`);
  await ctx.close();
}
await measure('desktop 1440', { width: 1440, height: 900 }, false, 1);
await measure('iphone 390', { width: 390, height: 844 }, true, 1);
await measure('iphone 390', { width: 390, height: 844 }, true, 4);
await browser.close();

// Reduced-motion check: static story renders, cinematic stage hidden, no pinning.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(process.argv[2] || 'http://localhost:3000', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const info = await p.evaluate(() => ({
    cinematic: getComputedStyle(document.querySelector('.story-cinematic')).display,
    static: getComputedStyle(document.querySelector('.story-static')).display,
    pinSpacers: document.querySelectorAll('.pin-spacer').length,
  }));
  console.log(name, JSON.stringify(info));
  await p.screenshot({ path: `.impeccable/review/reduced-${name}.png`, fullPage: true });
  await ctx.close();
}
await b.close();

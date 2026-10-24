// Measures the hero burger's rendered height against the viewport.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [name, vp, mobile] of [['mobile', { width: 390, height: 844 }, true], ['desktop', { width: 1440, height: 900 }, false]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const imgs = [...document.querySelectorAll('.rig .bs-layer img')].map((i) => i.getBoundingClientRect());
    const top = Math.min(...imgs.map((x) => x.top)), bottom = Math.max(...imgs.map((x) => x.bottom));
    const chip = document.querySelector('[data-copy="0"] button')?.getBoundingClientRect();
    const cta = [...document.querySelectorAll('[data-copy="0"] a')].pop()?.getBoundingClientRect();
    const h1 = document.querySelector('h1').getBoundingClientRect();
    return { burgerTop: Math.round(top), burgerBottom: Math.round(bottom), vh: Math.round(((bottom - top) / innerHeight) * 100), h1Bottom: Math.round(h1.bottom), chipTop: Math.round(chip.top), ctaBottom: Math.round(cta.bottom), innerHeight };
  });
  console.log(name, JSON.stringify(r));
  await p.screenshot({ path: `.impeccable/review/${name}-story-0.png` });
  await ctx.close();
}
await b.close();

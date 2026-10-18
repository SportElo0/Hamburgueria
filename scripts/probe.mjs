import { chromium } from "playwright-core";
const [, , url, w, h, ...sels] = process.argv;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(3500);
for (const s of sels) {
  const r = await page.evaluate((s) => [...document.querySelectorAll(s)].slice(0, 3).map((el) => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { s, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), pos: cs.position, mt: cs.marginTop, z: cs.zIndex, fs: cs.fontSize }; }), s);
  console.log(JSON.stringify(r));
}
await browser.close();

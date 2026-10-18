import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(400);
await page.screenshot({ path: ".impeccable/review/reduced-motion-400ms.png" });
const op = await page.evaluate(() => getComputedStyle(document.querySelector(".hero-copy")).opacity);
console.log("hero copy opacity at 400ms (reduced motion):", op);
// keyboard: first tab = skip link
await page.keyboard.press("Tab");
console.log("first focus:", await page.evaluate(() => document.activeElement?.textContent?.trim()));
// LCP + CLS
const p2 = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })).newPage();
await p2.goto("http://localhost:3000/", { waitUntil: "load" });
const metrics = await p2.evaluate(() => new Promise((res) => {
  let lcp = 0, cls = 0;
  new PerformanceObserver((l) => l.getEntries().forEach((e) => (lcp = e.startTime))).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) cls += e.value; })).observe({ type: "layout-shift", buffered: true });
  setTimeout(() => res({ lcp: Math.round(lcp), cls: cls.toFixed(3) }), 3000);
}));
console.log("mobile local LCP/CLS:", metrics);
const bytes = await p2.evaluate(() => performance.getEntriesByType("resource").reduce((a, r) => a + (r.transferSize || 0), 0));
console.log("home transfer KB:", Math.round(bytes / 1024));
await browser.close();

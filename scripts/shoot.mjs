// Usage: node scripts/shoot.mjs <url> <outdir> [name] [--full] [--wait=ms]
import { chromium } from "playwright-core";
const [, , url = "http://localhost:3000/", outdir = ".impeccable/review", name = "page"] = process.argv;
const full = process.argv.includes("--full");
const wait = Number((process.argv.find((a) => a.startsWith("--wait=")) || "--wait=3500").split("=")[1]);
const vps = [
  { n: "desktop", width: 1440, height: 900, mobile: false },
  { n: "laptop", width: 1280, height: 720, mobile: false },
  { n: "mobile", width: 390, height: 844, mobile: true },
];
const only = process.argv.find((a) => a.startsWith("--vp="))?.split("=")[1]?.split(",");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const vp of vps.filter((v) => !only || only.includes(v.n))) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, isMobile: vp.mobile, hasTouch: vp.mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(wait);
  if (full) {
    // scroll through to trigger in-view reveals, then return
    const h = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += vp.height * 0.6) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(250); }
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
  }
  await page.screenshot({ path: `${outdir}/${name}-${vp.n}.png`, fullPage: full });
  const overflow = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const wide = [...document.querySelectorAll("body *")].filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= vw + 1) return false;
      for (let p = el.parentElement; p; p = p.parentElement) if (getComputedStyle(p).overflowX !== "visible") return false;
      return true;
    });
    return wide.length ? `${Math.round(Math.max(...wide.map((e) => e.getBoundingClientRect().right)) - vw)}px (${wide[0].tagName}.${String(wide[0].className).slice(0, 40)})` : 0;
  });
  console.log(vp.n, "hOverflow:", overflow, errors.length ? "ERRORS: " + [...new Set(errors)].map((e) => e.slice(0, 240)).join(" | ") : "");
  await ctx.close();
}
await browser.close();

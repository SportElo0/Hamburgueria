// Captures the hero opening sequence and scroll states to verify animations run in a real browser.
import { chromium } from "playwright-core";
const BASE = process.env.BASE ?? "http://localhost:3000";
const out = ".impeccable/review";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(BASE + "/", { waitUntil: "commit" });
const t0 = Date.now();
const samples = [];
for (const t of [150, 700, 1300, 2000, 3200]) {
  await page.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
  await page.screenshot({ path: `${out}/anim-${t}.png` });
  samples.push(await page.evaluate(() => ({
    reveal: getComputedStyle(document.querySelector(".hero-stage")).getPropertyValue("--reveal").trim(),
    letterY: document.querySelector(".hero-letter-clip > span")?.style.transform || "none",
    copy: getComputedStyle(document.querySelector(".hero-copy p")).opacity,
  })));
}
console.log("intro samples:", JSON.stringify(samples));
// scroll: hero recedes, chapters stage swaps
await page.mouse.wheel(0, 450); await page.waitForTimeout(700);
const dim = await page.evaluate(() => [...document.querySelectorAll(".hero > div")].map((d) => getComputedStyle(d).opacity).join(","));
console.log("after 450px scroll, overlay opacities:", dim);
await page.screenshot({ path: `${out}/anim-scroll.png` });
const ch = await page.evaluate(() => { const els = [...document.querySelectorAll("#descubra h3")]; return els.map((e) => e.textContent); });
for (const target of [0, 1, 2]) {
  await page.evaluate((i) => document.querySelectorAll("#descubra .lg\\:grid h3")[i]?.scrollIntoView({ block: "center" }), target);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${out}/anim-chapter-${target}.png` });
  console.log("chapter", target, "active step:", await page.evaluate(() => [...document.querySelectorAll('[aria-current="step"] .sr-only')].map((e) => e.textContent).join("|")));
}
console.log("chapters:", ch.join(" / "));
for (const p of ["/acervo", "/acervo/250-se-coupe-w111", "/restauracao", "/vision", "/contato", "/atelier", "/projetos", "/privacidade"]) {
  await page.goto(BASE + p, { waitUntil: "networkidle" });
}
console.log(errors.length ? "CONSOLE ERRORS: " + [...new Set(errors)].join(" | ").slice(0, 600) : "no console errors on public pages");
await browser.close();

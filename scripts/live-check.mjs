// Verifies the published preview: pages, animations, Vision demo state, forms, admin lock.
import { chromium } from "playwright-core";
const BASE = process.env.BASE;
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", proxy });
const out = ".impeccable/review";
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(BASE + "/", { waitUntil: "commit" });
const t0 = Date.now(); const seq = [];
for (const t of [300, 1500, 3500]) {
  await page.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
  seq.push(await page.evaluate(() => ({ reveal: getComputedStyle(document.querySelector(".hero-stage") ?? document.body).getPropertyValue("--reveal").trim(), copy: getComputedStyle(document.querySelector(".hero-copy p") ?? document.body).opacity })));
}
await page.screenshot({ path: `${out}/live-home.png` });
console.log("home intro:", JSON.stringify(seq));
for (const p of ["/acervo", "/acervo/250-se-coupe-w111", "/acervo/450-sl-r107", "/restauracao", "/projetos", "/atelier", "/contato?jornada=restauracao", "/privacidade"]) {
  const r = await page.goto(BASE + p, { waitUntil: "networkidle" });
  console.log(p, r.status());
}
await page.goto(BASE + "/acervo", { waitUntil: "networkidle" });
console.log("acervo count:", await page.getByRole("status").first().textContent());
await page.goto(BASE + "/vision", { waitUntil: "networkidle" });
console.log("vision banner:", await page.getByText("Geração indisponível no momento.").isVisible(), "| generate disabled:", await page.getByRole("button", { name: "Visualizar meu projeto" }).isDisabled());
await page.screenshot({ path: `${out}/live-vision.png` });
await page.goto(BASE + "/acervo/500-sec-c126#interesse", { waitUntil: "networkidle" });
console.log("form demo note:", await page.getByText(/Versão de demonstração/).first().isVisible(), "| submit disabled:", await page.locator("#interesse button[type=submit]").isDisabled());
const r = await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
console.log("admin ->", page.url().replace(BASE, ""), "| disabled notice:", await page.getByText("Painel desativado.").isVisible());
const api = await page.evaluate(async () => (await fetch("/api/vision")).json());
console.log("api/vision:", JSON.stringify(api));
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await m.newPage();
await mp.goto(BASE + "/", { waitUntil: "networkidle" }); await mp.waitForTimeout(3800);
await mp.screenshot({ path: `${out}/live-home-mobile.png` });
console.log(errors.length ? "CONSOLE ERRORS: " + [...new Set(errors)].join(" | ").slice(0, 500) : "no console errors");
await browser.close();

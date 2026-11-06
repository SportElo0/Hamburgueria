// Visual + accessibility audit across viewports: screenshots, axe-core, overflow, target sizes, keyboard.
//   node tools/qa/audit-capture.mjs <baseUrl> <outDir> <axe.min.js>
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const [base, out, axePath] = process.argv.slice(2);
await fs.mkdir(out, { recursive: true });
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const VIEWPORTS = [
  ['desktop-1440x900', { width: 1440, height: 900 }, false],
  ['iphone-390x844', { width: 390, height: 844 }, true],
  ['small-375x667', { width: 375, height: 667 }, true],
  ['tablet-768x1024', { width: 768, height: 1024 }, true],
];
const report = {};
const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

async function axe(page, where, bag) {
  await page.addScriptTag({ path: axePath });
  const res = await page.evaluate(async () => {
    const r = await window.axe.run(document, { resultTypes: ['violations'], runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 6).map((n) => ({ target: n.target.join(' '), summary: n.failureSummary?.split('\n').slice(1, 2).join(' ') })) , count: v.nodes.length }));
  });
  for (const v of res) bag.push({ where, ...v });
}

async function targets(page, mobile) {
  return page.evaluate((mobile) => {
    const min = mobile ? 44 : 24;
    const bad = [];
    document.querySelectorAll('a[href], button, input, textarea, select, [role=button]').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || el.closest('[inert], dialog:not([open])')) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > innerHeight) return;
      if (el.matches('.sr-only, input.sr-only')) return;
      if (r.width < min || r.height < min) bad.push(`${(el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40)} (${Math.round(r.width)}×${Math.round(r.height)})`);
    });
    return bad;
  }, mobile);
}

for (const [name, viewport, mobile] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const R = (report[name] = { overflow: [], smallTargets: new Set(), axe: [], keyboard: [], errors: [] });
  page.on('pageerror', (e) => R.errors.push(e.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); window.scrollTo(0, 0); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
  const overflow = async (where) => {
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    if (o.sw > o.iw + 1) R.overflow.push(`${where}: scrollWidth ${o.sw} > ${o.iw}`);
  };
  // Story frames
  const st = await page.evaluate(() => (window.__storyST ? { start: window.__storyST.start, end: window.__storyST.end } : null));
  const pts = [0, 0.18, 0.37, 0.56, 0.74, 0.86, 0.99];
  for (const [i, p] of pts.entries()) {
    await page.evaluate((y) => window.scrollTo(0, y), st ? st.start + (st.end - st.start) * p : 0);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `${out}/${name}-story-${i}.png` });
    await overflow(`story-${i}`);
    (await targets(page, mobile)).forEach((t) => R.smallTargets.add(`story: ${t}`));
    if (i === 0) await axe(page, 'story-hero', R.axe);
    if (i === 5) await axe(page, 'story-exploded', R.axe);
  }
  // Sections
  for (const id of ['cardapio', 'cat-burgers', 'cat-entradas', 'cat-adicionais', 'cat-bebidas', 'cat-long-necks', 'cat-sobremesas', 'historia', 'localizacao']) {
    await page.evaluate((h) => { const el = document.getElementById(h); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - (h === 'cardapio' ? 0 : 130)); }, id);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/${name}-${id}.png` });
    await overflow(id);
    (await targets(page, mobile)).forEach((t) => R.smallTargets.add(`${id}: ${t}`));
  }
  await axe(page, 'menu+sections', R.axe);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}-footer.png` });
  // Product detail
  await page.evaluate(() => document.getElementById('cat-burgers').scrollIntoView());
  await page.getByRole('button', { name: 'Ver detalhes de The Bacon Street' }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${name}-product.png` });
  (await targets(page, mobile)).forEach((t) => R.smallTargets.add(`ficha: ${t}`));
  await axe(page, 'product-sheet', R.axe);
  await page.getByRole('button', { name: 'Ver por dentro' }).click();
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${out}/${name}-product-inside.png` });
  await page.locator('dialog[open] label', { hasText: 'Cheddar cremoso' }).click();
  await page.locator('dialog[open] button[type=submit]').click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Adicionar Classic Fries', exact: true }).click().catch(() => {});
  await page.getByRole('button', { name: 'Adicionar Heineken', exact: true }).click().catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}-after-add.png` });
  // Cart
  await page.locator('header button[aria-label*="Abrir sacola"]').click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${name}-cart.png` });
  (await targets(page, mobile)).forEach((t) => R.smallTargets.add(`sacola: ${t}`));
  await axe(page, 'cart', R.axe);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  // Nav
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${name}-nav.png` });
  await axe(page, 'nav', R.axe);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  // Keyboard walk from the top (desktop only is representative; run everywhere)
  await page.evaluate(() => { window.scrollTo(0, 0); document.activeElement?.blur(); });
  await page.waitForTimeout(600);
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const header = document.querySelector('header')?.getBoundingClientRect();
      const barEl = [...document.querySelectorAll('.mobile-cart-bar')].find((x) => getComputedStyle(x).visibility === 'visible');
      const bar = barEl?.getBoundingClientRect();
      const visible = r.bottom > 0 && r.top < innerHeight && r.width > 0;
      const underHeader = header && !el.closest('header') && r.top < header.bottom - 2 && r.bottom > header.top;
      // The mobile cart bar is display:none on desktop (zero rect): only a rendered bar can cover focus.
      const underBar = bar && bar.height > 0 && r.top < bar.bottom && r.bottom > bar.top + 2;
      return {
        name: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 36),
        ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2,
        visible, obscured: Boolean(underHeader || underBar), y: Math.round(scrollY),
      };
    });
    if (f) R.keyboard.push(f);
  }
  R.smallTargets = [...R.smallTargets];
  await ctx.close();
  console.log(`${name}: overflow=${R.overflow.length} smallTargets=${R.smallTargets.length} axe=${R.axe.length} kbdStops=${R.keyboard.length} errors=${R.errors.length}`);
}
await fs.writeFile(`${out}/capture-report.json`, JSON.stringify(report, null, 2));
await browser.close();

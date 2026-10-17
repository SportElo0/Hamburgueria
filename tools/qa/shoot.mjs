// Visual QA: captures the story scenes and key sections on desktop + mobile.
//   node tools/qa/shoot.mjs [baseUrl] [outDir]
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const base = process.argv[2] || 'http://localhost:3000';
const out = process.argv[3] || '.impeccable/review';
await fs.mkdir(out, { recursive: true });
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];

async function run(name, viewport, mobile) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${name}] ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[${name}] ${e.message}`));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const story = await page.evaluate(() => {
    const st = window.__storyST;
    return st ? { start: st.start, end: st.end } : null;
  });
  const shots = [0, 0.18, 0.36, 0.56, 0.78, 0.86, 0.995];
  for (const [i, p] of shots.entries()) {
    const y = story ? story.start + (story.end - story.start) * p : p * 4000;
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `${out}/${name}-story-${i}.png` });
  }
  for (const id of ['cardapio', 'cat-entradas', 'cat-adicionais', 'cat-bebidas', 'cat-sobremesas', 'historia', 'localizacao']) {
    await page.evaluate((h) => document.getElementById(h)?.scrollIntoView({ block: 'start' }), id);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/${name}-${id}.png` });
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}-footer.png` });

  // Commerce flow: open Bacon Street sheet, add cheddar, add; add fries; open cart.
  await page.evaluate(() => document.getElementById('cat-burgers')?.scrollIntoView());
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Ver detalhes de The Bacon Street' }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}-sheet.png` });
  await page.getByRole('button', { name: 'Ver por dentro' }).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${name}-sheet-inside.png` });
  await page.locator('dialog[open]').getByRole('checkbox', { name: /Cheddar cremoso/ }).check({ force: true });
  await page.locator('dialog[open] button[type=submit]').click();
  await page.waitForTimeout(600);
  await page.evaluate(() => document.getElementById('cat-entradas')?.scrollIntoView());
  await page.getByRole('button', { name: 'Adicionar Classic Fries' }).first().click().catch(async () => {
    await page.locator('#cat-entradas article', { hasText: 'Classic Fries' }).getByRole('button', { name: /Adicionar/ }).click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}-toast.png` });
  await page.evaluate(() => document.querySelector('header button[aria-label^="Abrir sacola"]')?.click());
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${name}-cart.png` });
  await page.getByRole('button', { name: 'Gerar mensagem do pedido' }).click();
  await page.waitForTimeout(400);
  const msg = await page.locator('dialog[open] pre').innerText();
  await page.screenshot({ path: `${out}/${name}-cart-message.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('header button[aria-label="Abrir menu"]')?.click());
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${name}-nav.png` });
  await ctx.close();
  return msg;
}

const msgD = await run('desktop', { width: 1440, height: 900 }, false);
const msgM = await run('mobile', { width: 390, height: 844 }, true);
console.log('--- order message (desktop) ---\n' + msgD);
console.log('--- same on mobile:', msgD === msgM);
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();

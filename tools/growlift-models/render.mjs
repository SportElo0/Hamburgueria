// Renders the fictional model sites to the screenshots the Growlift site shows.
//   node tools/growlift-models/render.mjs   → growlift/img/site-*.webp (1280x800)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(DIR, '../../growlift/img');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
for (const [src, name] of [['burger', 'hamburgueria'], ['restaurante', 'restaurante'], ['confeitaria', 'confeitaria'], ['advocacia', 'advocacia']]) {
  await page.goto(`file://${DIR}/${src}.html`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot();
  await sharp(png).resize(1280, 800).webp({ quality: 80 }).toFile(path.join(OUT, `site-${name}.webp`));
  console.log('site-' + name);
}
await browser.close();

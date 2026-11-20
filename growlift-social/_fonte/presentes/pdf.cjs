// HTML → PDF for the gifts in 10-presentes/: node growlift-social/_fonte/presentes/pdf.cjs <file.html> <out.pdf>
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');
(async () => {
  const [src, out] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.goto(pathToFileURL(path.resolve(src)).href, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close();
  console.log(out);
})();

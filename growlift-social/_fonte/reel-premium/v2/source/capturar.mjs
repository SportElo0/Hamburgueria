// Section-by-section captures of the four portfolio sites for the Reel v2, already anonymized as concept
// projects (anonimizar.mjs), plus a short scroll recording of each. The live sites are not touched.
//   node growlift-social/_fonte/reel-premium/v2/source/capturar.mjs [salinho chapa77 …]   (SO_HERO4=1: only the 4× heroes)
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITES, anonymize } from '../../anonimizar.mjs';

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const LEAK = /semv|downtown|surflife|feito à mão|juquehy|cibele|renato|maresias|francisco loup/gi;

// Per site: sections shot whole (element) and scroll-driven stories shot at fractions of their height.
// Sections with real people or the real shop (Swell Club reviews and storefront, Fornada's couple) stay out.
const PLAN = {
  salinho: {
    extraSwap: [[/^Ø$/, '']], // the shop's symbol in the wheel centre and the address card
    sections: { selecao: '#selecao', look: '#look-da-virada', roleta: '#benefit-section', rodape: 'footer.site-footer' },
    clickNext: '#inicio',
  },
  chapa77: {
    story: ['#inicio', [0, 0.18, 0.36, 0.54, 0.72, 0.9]],
    sections: { cardapio: '#cardapio', historia: '#historia', rodape: 'footer' },
  },
  swellclub: {
    story: ['.hero-frame', [0, 0.3, 0.62]],
    sections: { pranchas: '#pranchas', aluguel: '#aluguel', session: '#session', rodape: 'footer.site-footer' },
  },
  fornada: {
    story: ['#inicio', [0, 0.2, 0.4, 0.6, 0.8]],
    sections: { vitrine: '#vitrine', cafe: '#seu-cafe', visite: '#visite', rodape: 'footer.site-footer' },
  },
};

const DEVICES = [['pc', { width: 1440, height: 900 }, 2], ['cel', { width: 390, height: 844 }, 3]];
const only = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: CHROME });
const report = [];

async function settle(page, site) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(110); }
  await anonymize(page, site);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);
}

for (const [name, site0] of Object.entries(SITES)) {
  if (only.length && !only.includes(name)) continue;
  const plan = PLAN[name];
  const site = { ...site0, swap: [...site0.swap, ...(plan.extraSwap || [])] };
  const dir = path.join(ASSETS, name);
  fs.mkdirSync(dir, { recursive: true });

  for (const [kind, vp, scale] of process.env.SO_HERO4 ? [] : DEVICES) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: scale, locale: 'pt-BR', reducedMotion: 'no-preference' });
    const page = await ctx.newPage();
    await page.goto(site.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await settle(page, site);
    await page.addStyleTag({ content: '.skip-link,[class*="skip"]{display:none!important}' });
    const shot = async (file, opts = {}) => {
      await anonymize(page, site);
      await page.waitForTimeout(250);
      const out = path.join(dir, `${kind}-${file}.png`);
      if (opts.el) {
        // A tall section is shot while the page scrolls: fixed or sticky bars outside it would land on top.
        await opts.el.evaluate((root) => { for (const e of document.querySelectorAll('body *')) { const p = getComputedStyle(e).position; if ((p === 'fixed' || p === 'sticky') && !root.contains(e) && !e.contains(root)) e.dataset.capHidden = e.style.visibility || '-', e.style.visibility = 'hidden'; } });
        await opts.el.screenshot({ path: out, animations: 'disabled' });
        await page.evaluate(() => { for (const e of document.querySelectorAll('[data-cap-hidden]')) { e.style.visibility = e.dataset.capHidden === '-' ? '' : e.dataset.capHidden; delete e.dataset.capHidden; } });
      } else await page.screenshot({ path: out });
      report.push(`${name}/${kind}-${file}.png`);
    };

    if (plan.story) {
      const [sel, fractions] = plan.story;
      const box = await page.evaluate((sel) => { const e = document.querySelector(sel); const r = e.getBoundingClientRect(); return { top: r.top + scrollY, h: e.offsetHeight }; }, sel);
      for (const [i, f] of fractions.entries()) {
        await page.evaluate((y) => window.scrollTo(0, y), Math.round(box.top + f * Math.max(0, box.h - vp.height)));
        await page.waitForTimeout(1300);
        await shot(`historia-${i + 1}`);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    if (plan.clickNext) {
      // Product switcher of the hero: one frame per product, as a visitor would click through.
      for (let i = 1; i <= 3; i++) {
        const next = page.locator(`${plan.clickNext} button`).filter({ hasText: /próxim|→/i }).or(page.locator(`${plan.clickNext} button[aria-label*="róxim"]`)).first();
        if (!(await next.count()) || !(await next.isVisible())) break;
        await next.click();
        await page.evaluate(() => { document.activeElement?.blur(); document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo({ top: 0, behavior: 'instant' }); });
        await page.waitForTimeout(1400);
        await shot(`hero-peca-${i + 1}`);
      }
    }
    for (const [label, sel] of Object.entries(plan.sections)) {
      const el = page.locator(sel).first();
      if (!(await el.count())) { report.push(`FALTOU ${name} ${kind} ${label} (${sel})`); continue; }
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1400);
      await shot(label, { el });
    }
    const left = await page.evaluate((re) => (document.body.innerText.match(new RegExp(re, 'gi')) || []).slice(0, 6), LEAK.source);
    report.push(`${name} ${kind}: ${left.length ? `SOBROU ${left.join(', ')}` : 'texto limpo'}`);
    await ctx.close();
  }

  // Desktop hero at 4×: interface pieces cut from it can be enlarged in the frames without going soft.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4, locale: 'pt-BR' });
    const page = await ctx.newPage();
    await page.goto(site.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await settle(page, site);
    await page.addStyleTag({ content: '.skip-link,[class*="skip"]{display:none!important}' });
    await anonymize(page, site);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(dir, 'pc4x-hero.png') });
    report.push(`${name}/pc4x-hero.png`);
    await ctx.close();
  }

  if (process.env.SO_HERO4) { console.log(name, 'ok'); continue; } // only the 4× hero

  // Scroll recording (reference for the motion, desktop): starts after the swap, the lead-in is cut off.
  const vdir = path.join(dir, '_video');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: vdir, size: { width: 1440, height: 900 } }, locale: 'pt-BR' });
  const t0 = Date.now();
  const page = await ctx.newPage();
  await page.goto(site.url, { waitUntil: 'networkidle', timeout: 60000 });
  await settle(page, site);
  const cut = (Date.now() - t0) / 1000 + 0.3;
  const h = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const stop = plan.story ? await page.evaluate((s) => { const e = document.querySelector(s); return e.getBoundingClientRect().top + scrollY + e.offsetHeight; }, plan.story[0]) : Math.min(h, 2600);
  for (let y = 0; y <= Math.min(stop, h); y += 18) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(16); }
  await page.waitForTimeout(600);
  const raw = await page.video().path();
  await ctx.close();
  const mp4 = path.join(dir, 'pc-rolagem.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(cut), '-i', raw, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-an', mp4]);
  fs.rmSync(vdir, { recursive: true, force: true });
  report.push(`${name}/pc-rolagem.mp4`);
  console.log(name, 'ok');
}
await browser.close();
console.log(report.join('\n'));

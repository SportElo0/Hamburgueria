// Frame-by-frame recordings of the four sites for the Reel, already anonymized (names, logos and the
// Swell Club owner's photo swapped in the page). Uses the Reels engine's captureSite (one screenshot per
// frame at 30 fps, the site's own animations running).
//   node growlift-social/_fonte/reel-premium/v2/source/gravacoes.mjs [salinho chapa77 …]
//   → v2/assets/_gravacoes/rec-<id>/00000.jpg …
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITES, anonymize, swapPhotos } from '../../anonimizar.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.REELS_TMP = path.join(ROOT, 'assets', '_gravacoes');
const { captureSite, close, FPS } = await import('../../../reels/motor.mjs');

const SKIP = '.skip-link,[class*="skip"]{display:none!important}';
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const MOBILE = { viewport: { width: 390, height: 844 }, device: { deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
const DESKTOP = { viewport: { width: 1440, height: 900 }, device: { deviceScaleFactor: 1, isMobile: false, hasTouch: false } };

// The Salinho shop symbol in the wheel centre and address card goes too (same rule as capturar.mjs).
const site = (name) => (name === 'salinho' ? { ...SITES.salinho, swap: [...SITES.salinho.swap, [/^Ø$/, '']] } : SITES[name]);

/** Anonymizes once after load and again every 20 frames (late content gets the same swap). */
function anon(name) {
  return async (page, i) => {
    if (!page.__anon) {
      await anonymize(page, site(name));
      await page.addStyleTag({ content: SKIP });
      page.__anon = true;
      await page.waitForTimeout(400);
    } else if (i % 20 === 0) await anonymize(page, site(name));
  };
}

/** Scroll position for time t: eased from `from` to `to` (fractions of a section's scroll range). */
async function scrollStory(page, sel, t, dur, from, to) {
  await page.evaluate(({ sel, p }) => {
    const e = document.querySelector(sel);
    const top = e.getBoundingClientRect().top + scrollY;
    const range = Math.max(0, e.offsetHeight - innerHeight);
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top: Math.round(top + p * range), behavior: 'instant' });
  }, { sel, p: from + (to - from) * easeInOut(Math.min(1, Math.max(0, t / dur))) });
}

const RECS = {
  // Salinho on the phone: two taps on the product thumbnails (shorts, then trousers); the page changes colour.
  salinho: {
    ...MOBILE, duration: 2.3,
    async steps(t, page, i) {
      await anon('salinho')(page, i);
      for (const [at, n] of [[0.35, 2], [1.2, 3]]) {
        const d = t - at;
        const box = await page.evaluate((n) => {
          const thumbs = [...document.querySelectorAll('#inicio button')].filter((b) => b.querySelector('img[src*="linen"]'));
          const r = thumbs[n]?.getBoundingClientRect();
          return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
        }, n);
        if (!box) continue;
        const k = d < -0.2 || d > 0.35 ? 0 : d < 0 ? 1 + d / 0.2 : 1 - d / 0.35;
        if (k > 0) await page.evaluate(({ x, y, k }) => window.__tap(x, y, k), { ...box, k });
        if (i === Math.round(at * FPS)) await page.evaluate((n) => [...document.querySelectorAll('#inicio button')].filter((b) => b.querySelector('img[src*="linen"]'))[n].click(), n);
      }
      if (t > 1.6) await page.evaluate(() => window.__tap(0, 0, 0));
    },
  },
  // Chapa 77 on the computer: the whole scroll story, red to teal.
  chapa77: {
    ...DESKTOP, duration: 2.6,
    async steps(t, page, i) {
      await anon('chapa77')(page, i);
      await scrollStory(page, '#inicio', t, 2.5, 0, 0.995);
    },
  },
  // Swell Club on the phone: the hero story, "A vida pede mar." to "A gente vive isso.".
  swellclub: {
    ...MOBILE, duration: 2.2,
    setup: (page, ctx) => swapPhotos(ctx, SITES.swellclub),
    async steps(t, page, i) {
      await anon('swellclub')(page, i);
      await scrollStory(page, '.hero-frame', Math.max(0, t - 0.5), 1.4, 0, 0.62);
    },
  },
  // Fornada on the phone: the hot chocolate pours while the story text changes.
  fornada: {
    ...MOBILE, duration: 3.2,
    async steps(t, page, i) {
      if (!page.__warm) {
        // The pour is a frame sequence drawn on a canvas: run through it once so every frame is cached.
        page.__warm = true;
        for (let p = 0; p <= 1; p += 0.05) { await scrollStory(page, '#inicio', p, 1, 0, 1); await page.waitForTimeout(120); }
        await scrollStory(page, '#inicio', 0, 1, 0, 0);
        await page.waitForTimeout(600);
      }
      await anon('fornada')(page, i);
      await scrollStory(page, '#inicio', t, 3.1, 0.02, 0.66);
    },
  },
};

const only = process.argv.slice(2);
for (const [name, rec] of Object.entries(RECS)) {
  if (only.length && !only.includes(name)) continue;
  const { dir, count } = await captureSite({ id: name, url: SITES[name].url, ...rec });
  console.log(name, count, 'quadros em', path.relative(ROOT, dir));
}
await close();

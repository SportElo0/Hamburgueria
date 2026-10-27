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

const MOBILE3 = { viewport: { width: 390, height: 844 }, device: { deviceScaleFactor: 3, isMobile: true, hasTouch: true } };
const CATALOG = 'https://painel-lojas-sportelo.vercel.app/api/public/lojas/downtown-burger';
// Chapa 77 order recording: the site reads its menu from this panel endpoint, so it gets the published
// catalog with fictitious names and example prices (never the real shop's). Only this browser sees it.
const CHAPA_NAMES = {
  'downtown-classic': 'Chapa 77 Classic', 'the-bacon-street': 'Bacon na Chapa', 'australian-cheddar': 'Cheddar Duplo', 'kill-bill': 'Da Casa',
  'golden-chicken': 'Frango Dourado', holyfield: 'Duplo 77', 'green-burger': 'Verde', 'little-downtown': 'Chapinha', 'downtown-nuggets': 'Nuggets da Casa',
};
async function exampleCatalog(ctx) {
  const real = await (await fetch(CATALOG)).json();
  for (const c of real.catalog.categories) for (const it of c.items) {
    if (CHAPA_NAMES[it.id]) it.name = CHAPA_NAMES[it.id];
    if (typeof it.price === 'number') it.price = c.items === real.catalog.categories.find((x) => /adicionais/i.test(x.name))?.items ? 400 : Math.round(it.price * 0.83 / 100) * 100;
  }
  real.name = 'Chapa 77 Burger';
  await ctx.route(CATALOG, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(real) }));
}

/** Runs timed taps: each step is [time, finder(page) → {x, y} | null, action(page)]. The tap dot shows around the time. */
async function taps(page, t, i, list) {
  let shown = false;
  for (const [at, find, act] of list) {
    const d = t - at;
    const k = d < -0.22 || d > 0.32 ? 0 : d < 0 ? 1 + d / 0.22 : 1 - d / 0.32;
    if (k > 0) {
      const box = await page.evaluate(find);
      if (box) { await page.evaluate(({ x, y, k }) => window.__tap(x, y, k), { ...box, k }); shown = true; }
    }
    if (i === Math.round(at * FPS)) await page.evaluate(act);
  }
  if (!shown) await page.evaluate(() => window.__tap(0, 0, 0));
}
const center = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

const RECS = {
  // Chapa 77 on the phone: the burger, two add-ons, the bag and the order message the site writes for the shop.
  // The live shop has no WhatsApp set, so the site is in demo mode: it builds the message and sends nothing.
  chapa77pedido: {
    ...MOBILE3, duration: 5.4, site: 'chapa77',
    setup: async (page, ctx) => { await swapPhotos(ctx, SITES.chapa77); await exampleCatalog(ctx); },
    async steps(t, page, i) {
      await anonymize(page, site('chapa77'));
      if (!page.__ready) {
        page.__ready = true;
        await page.addStyleTag({ content: SKIP });
        await page.evaluate(() => {
          document.documentElement.style.scrollBehavior = 'auto';
          const card = document.querySelector('[aria-label="Ver detalhes de Duplo 77"]');
          window.scrollTo({ top: card.getBoundingClientRect().top + scrollY - 330, behavior: 'instant' });
        });
        await page.waitForTimeout(900);
      }


      // Inside the product sheet, the list scrolls to the add-ons between 1.0 and 1.5 s.
      if (t >= 1.0 && t <= 1.6) await page.evaluate((p) => {
        const panel = [...document.querySelectorAll('[role=dialog] *, [aria-modal=true] *')].find((e) => e.scrollHeight > e.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(e).overflowY));
        if (panel) panel.scrollTop = Math.round(p * 250);
      }, easeInOut(Math.min(1, (t - 1.0) / 0.5)));
      await taps(page, t, i, [
        [0.45, () => { const c = document.querySelector('[aria-label="Ver detalhes de Duplo 77"]')?.closest('li, article'); const b = c && [...c.querySelectorAll('button')].find((x) => /personalizar/i.test(x.textContent)); const r = b?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; },
          () => { const c = document.querySelector('[aria-label="Ver detalhes de Duplo 77"]')?.closest('li, article'); [...c.querySelectorAll('button')].find((x) => /personalizar/i.test(x.textContent)).click(); }],
        [1.8, () => { const l = [...document.querySelectorAll('label')].find((e) => /cheddar cremoso/i.test(e.textContent)); const r = l?.getBoundingClientRect(); return r ? { x: r.left + 30, y: r.top + r.height / 2 } : null; },
          () => [...document.querySelectorAll('label')].find((e) => /cheddar cremoso/i.test(e.textContent)).click()],
        [2.3, () => { const l = [...document.querySelectorAll('label')].find((e) => /maionese artesanal/i.test(e.textContent)); const r = l?.getBoundingClientRect(); return r ? { x: r.left + 30, y: r.top + r.height / 2 } : null; },
          () => [...document.querySelectorAll('label')].find((e) => /maionese artesanal/i.test(e.textContent)).click()],
        [2.85, () => { const b = [...document.querySelectorAll('button[type=submit]')].find((x) => x.getBoundingClientRect().width > 0); const r = b?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; },
          () => [...document.querySelectorAll('button[type=submit]')].find((x) => x.getBoundingClientRect().width > 0).click()],
        [3.55, () => { const b = [...document.querySelectorAll('button, a')].filter((x) => /ver sacola/i.test(x.textContent) && x.getBoundingClientRect().width > 0).pop(); const r = b?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; },
          () => [...document.querySelectorAll('button, a')].filter((x) => /ver sacola/i.test(x.textContent) && x.getBoundingClientRect().width > 0).pop().click()],
        [4.45, () => { const b = [...document.querySelectorAll('button')].find((x) => /gerar mensagem do pedido/i.test(x.textContent)); const r = b?.getBoundingClientRect(); return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; },
          () => [...document.querySelectorAll('button')].find((x) => /gerar mensagem do pedido/i.test(x.textContent)).click()],
      ]);
      await anonymize(page, site('chapa77')); // again after the taps: text a click just rendered must not reach the frame
    },
  },
  // Swell Club on the phone: two real swipes on the board carousel (Shortboard → Fish → Funboard).
  swellpranchas: {
    ...MOBILE, duration: 2.6, site: 'swellclub',
    setup: (page, ctx) => swapPhotos(ctx, SITES.swellclub),
    async steps(t, page, i) {
      await anon('swellclub')(page, i);
      if (!page.__ready) {
        page.__ready = true;
        await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const s = document.querySelector('#pranchas'); window.scrollTo({ top: s.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
        await page.waitForTimeout(900);
      }
      // a drag from right to left across the boards, as a thumb would do it
      let dot = 0, x = 0;
      for (const at of [0.35, 1.35]) {
        const d = t - at;
        if (d >= -0.15 && d <= 0.55) {
          const p = Math.min(1, Math.max(0, d / 0.4));
          x = 300 - 230 * easeInOut(p);
          dot = d < 0 ? 1 + d / 0.15 : d > 0.4 ? 1 - (d - 0.4) / 0.15 : 1;
          if (i === Math.round(at * FPS)) {
            await page.mouse.move(300, 350); await page.mouse.down();
            for (let s = 1; s <= 10; s++) await page.mouse.move(300 - 23 * s, 350 + s * 0.4);
            await page.mouse.up();
          }
        }
      }
      await page.evaluate(({ x, k }) => window.__tap(x, 350, k), { x, k: dot });
    },
  },

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
    setup: (page, ctx) => swapPhotos(ctx, SITES.chapa77), // Growlift's 3D renders instead of the menu photos
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
  // Fornada on the phone: the breakfast reservation, which is only interface (no photos): a day is chosen,
  // the page scrolls to the products and two are added (the header's "Seu café" counter goes up).
  fornada: {
    ...MOBILE, duration: 3.2,
    async steps(t, page, i) {
      await anon('fornada')(page, i);
      const top = await page.evaluate(() => document.querySelector('#seu-cafe').getBoundingClientRect().top + scrollY);
      const p = Math.min(1, Math.max(0, (t - 0.8) / 0.8));
      await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo({ top: y, behavior: 'instant' }); }, Math.round(top - 70 + 516 * easeInOut(p)));
      for (const [at, sel] of [[0.45, 'button[aria-label*="30 de outubro"]'], [1.85, 'button[aria-label="Adicionar Croissant à seleção"]'], [2.45, 'button[aria-label="Adicionar Pain au chocolat à seleção"]']]) {
        const d = t - at;
        const k = d < -0.2 || d > 0.35 ? 0 : d < 0 ? 1 + d / 0.2 : 1 - d / 0.35;
        if (k > 0) {
          const box = await page.evaluate((sel) => { const r = document.querySelector(sel)?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }, sel);
          if (box) await page.evaluate(({ x, y, k }) => window.__tap(x, y, k), { ...box, k });
        }
        if (i === Math.round(at * FPS)) await page.evaluate((sel) => document.querySelector(sel)?.click(), sel);
      }
      if (t > 2.85) await page.evaluate(() => window.__tap(0, 0, 0));
    },
  },
};

const only = process.argv.slice(2);
// Every recorded frame is checked against the real names: the page text at the moment of the screenshot.
const LEAK = /downtown|holyfield|kill bill|australian cheddar|semv|surflife|feito à mão|juquehy|maresias|são sebastião|cibele|renato/i;
for (const [name, rec] of Object.entries(RECS)) {
  if (only.length && !only.includes(name)) continue;
  const leaks = [];
  const steps = rec.steps;
  rec.steps = async (t, page, i) => {
    await steps(t, page, i);
    const hit = await page.evaluate((re) => (document.body.innerText.match(new RegExp(re, 'gi')) || []).filter((w) => !/^feito à mão$/i.test(w)), LEAK.source);
    if (hit.length) leaks.push(`${i}: ${[...new Set(hit)].join(', ')}`);
  };
  const { dir, count } = await captureSite({ id: name, url: (SITES[name] ?? SITES[rec.site]).url, ...rec });
  console.log(name, count, 'quadros em', path.relative(ROOT, dir));
  console.log(name, leaks.length ? `NOMES REAIS EM ${leaks.length} QUADROS: ${leaks.slice(0, 5).join(' | ')}` : 'nenhum nome real no texto da página');
}
await close();

// The Fornada selection card on the computer, filled in the same way (a day and two products), for scene 11.
if (!only.length || only.includes('fornada')) {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'pt-BR' });
  await page.goto(SITES.fornada.url, { waitUntil: 'networkidle' });
  await anonymize(page, site('fornada'));
  await page.addStyleTag({ content: SKIP });
  await page.locator('#seu-cafe').scrollIntoViewIfNeeded();
  for (const sel of ['button[aria-label*="30 de outubro"]', 'button[aria-label="Adicionar Croissant à seleção"]', 'button[aria-label="Adicionar Pain au chocolat à seleção"]']) {
    await page.evaluate((sel) => document.querySelector(sel)?.click(), sel);
    await page.waitForTimeout(400);
  }
  await anonymize(page, site('fornada'));
  const card = page.locator('#seu-cafe aside.selection-summary');
  await card.scrollIntoViewIfNeeded();
  // The floating "Adicionado · ver seleção" bar and the sticky header would land on top of the card.
  await card.evaluate((root) => { for (const e of document.querySelectorAll('body *')) { const p = getComputedStyle(e).position; if ((p === 'fixed' || p === 'sticky') && !root.contains(e) && !e.contains(root)) e.style.visibility = 'hidden'; } });
  await page.waitForTimeout(900);
  await card.screenshot({ path: path.join(ROOT, 'assets', 'fornada', 'pc-cafe-selecao.png'), animations: 'disabled' });
  await browser.close();
  console.log('fornada: cartão da seleção em assets/fornada/pc-cafe-selecao.png');
}

// Captures the four client-built sites as concept projects for the premium Reel: names, logos and
// places are swapped in the page before the screenshot, so no real business shows. The live sites
// are not touched.   node growlift-social/_fonte/reel-premium/anonimizar.mjs
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'capturas');
const RENDERS = path.resolve(HERE, '../../../public/renders');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// [pattern, replacement] applied to every text node and attribute that shows text.
export const SITES = {
  salinho: {
    url: 'https://semvo-juquehy.pages.dev/pt/?loja=juquehy', // straight into the shop, past the store picker
    swap: [[/, SÃO SEBASTIÃO/g, ''], [/SÃO SEBASTIÃO/g, 'LITORAL'], [/[®™]/g, ''], [/em Juquehy/g, 'no litoral'], [/Maresias/g, 'Praia'], [/MARESIAS/g, 'PRAIA'], [/Av\. Dr\. Francisco Loup/g, 'orla'], [/SemvØ Clothing/gi, 'Salinho'], [/SEMVØ CLOTHING/g, 'SALINHO'], [/SEMVØ/g, 'SALINHO'], [/SemvØ/g, 'Salinho'], [/Farias Boulevard/g, 'centro'], [/JUQUEHY, LITORAL NORTE/g, 'LITORAL'], [/JUQUEHY · MARESIAS/g, 'LITORAL'], [/JUQUEHY/g, 'LITORAL'], [/Juquehy/g, 'Litoral'], [/São Sebastião/g, 'Brasil'], [/LITORAL NORTE/g, 'LITORAL'], [/Litoral Norte/g, 'litoral']],
    logos: ['semvo-logo'],
    logoText: 'Salinho',
    css: '.brand img,.showroom img[data-anon],img[src*="semvo-logo"]{display:none!important}.brand::before{display:none!important}.brand::after{content:"Salinho";font:700 26px/1 Georgia,serif;color:#ece6da;letter-spacing:.01em}',
  },
  chapa77: {
    url: 'https://downtown-burger-gilt.vercel.app',
    swap: [[/burguer artesanal feito com qualidade/gi, 'hambúrguer na chapa, do jeito da casa'], [/[®™]/g, ''], [/DOWNTOWN/g, 'CHAPA 77'], [/Downtown/g, 'Chapa 77'], [/HOLYFIELD/gi, 'DUPLO 77'], [/KILL BILL/gi, 'DA CASA'], [/AUSTRALIAN CHEDDAR/gi, 'CHEDDAR DUPLO'],
      [/Burger artesanal feito com qualidade\./gi, 'Hambúrguer na chapa, do jeito da casa.']], // the real shop's slogan
    logos: [],
    hideSvgWith: /DOWNTOWN|STEAKS|skyline/i, // the round skyline badge is the real brand's mark
    logoText: 'CHAPA 77',
    // The site's burger photos were cut from the real shop's printed menu: Growlift's own 3D renders of the
    // same items are served instead (public/renders, "procedural 3D render, not a photograph").
    photos: [[/\/photos\/[a-z0-9-]+(\.sm)?\.webp(\?.*)?$/, (url) => {
      const id = url.match(/\/photos\/([a-z0-9-]+)/)[1];
      const burger = path.join(RENDERS, 'burgers', id, 'hero.webp'), prop = path.join(RENDERS, 'props', `${id}.webp`);
      return existsSync(burger) ? burger : existsSync(prop) ? prop : null;
    }]],
    // The real shop's prices and its "Burgers ★ Steaks ★ Fries ★ Shakes" strip stay out of the picture.
    fix: () => {
      for (const s of document.querySelectorAll('.sr-only')) if (/^R\$\s*\d/.test(s.textContent.trim())) s.parentElement.style.visibility = 'hidden';
      // the rotated strip at the hero's right edge (the marquee further down the page is not filmed)
      for (const e of document.querySelectorAll('#inicio p, #inicio div')) {
        if (/^burgers★?steaks★?fries★?shakes$/i.test(e.textContent.replace(/[\s·•*]/g, ''))) e.style.visibility = 'hidden';
      }
    },
  },
  swellclub: {
    url: 'https://surflife-juquehy.pages.dev/',
    swap: [[/SÃO SEBASTIÃO/g, 'LITORAL'], [/[®™]/g, ''], [/em Juquehy/g, 'no litoral'], [/SURFLIFE/g, 'SWELL CLUB'], [/SurfLife|Surflife/g, 'Swell Club'], [/JUQUEHY, SP/g, 'LITORAL'], [/JUQUEHY · /g, ''], [/ · JUQUEHY/g, ''], [/JUQUEHY/g, 'LITORAL'], [/Juquehy/g, 'no litoral'], [/São Sebastião/g, 'Litoral Norte'], [/LITORAL NORTE/g, 'LITORAL'], [/Litoral Norte/g, 'litoral']],
    logos: ['logo-original'],
    // The hero photo is the shop owner (a real person): swapped for a generated generic surfer (08-prompts).
    photos: [[/surf-owner-(desktop|mobile)\.webp/, 'v2/assets/swellclub/foto-generica/surfista-generico.png']],
    logoText: 'SWELL',
    logoStyle: 'border-radius:50%;background:#f2c94c;color:#0d2b33;font:800 13px/1 Arial,sans-serif;letter-spacing:.06em',
  },
  fornada: {
    url: 'https://feito-a-mao-juquehy.pages.dev',
    swap: [[/São Sebastião/g, 'Litoral'], [/SÃO SEBASTIÃO/g, 'LITORAL'], [/[®™]/g, ''], [/em Juquehy/g, 'no litoral'], [/Feito à Mão/g, 'Fornada'], [/Feito à mão\./g, 'Fornada.'], [/Cibele e Renato Costa/g, 'quem faz os pães'], [/Cibele e Renato/g, 'Quem faz os pães'], [/Juquehy/g, 'no litoral'], [/JUQUEHY/g, 'LITORAL'], [/LITORAL NORTE/g, 'LITORAL'], [/Litoral Norte/g, 'litoral']],
    logos: ['feito-logo'],
    logoText: '',
  },
};

/** Serves the replacement photos instead of the site's own files; call before page.goto(). */
export async function swapPhotos(ctx, site) {
  for (const [re, file] of site.photos || []) {
    await ctx.route(re, (route) => {
      const local = typeof file === 'function' ? file(route.request().url()) : path.join(HERE, file);
      if (!local) return route.continue();
      return route.fulfill({ path: local, contentType: local.endsWith('.webp') ? 'image/webp' : 'image/png' });
    });
  }
}

export async function anonymize(page, site) {
  if (site.css) await page.addStyleTag({ content: site.css });
  await page.evaluate(({ swap, logos, logoText, logoStyle, hideSvgWith }) => {
    if (hideSvgWith) for (const svg of document.querySelectorAll('svg')) if (new RegExp(hideSvgWith, 'i').test(svg.outerHTML) && !svg.closest('[data-anon-keep]')) svg.style.display = 'none';
    const rules = swap.map(([s, f, r]) => [new RegExp(s, f), r]);
    const fix = (t) => rules.reduce((acc, [re, r]) => acc.replace(re, r), t);
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const n = w.currentNode; const t = fix(n.textContent); if (t !== n.textContent) n.textContent = t; }
    for (const el of document.querySelectorAll('[alt],[aria-label],[title]')) for (const a of ['alt', 'aria-label', 'title']) if (el.getAttribute(a)) el.setAttribute(a, fix(el.getAttribute(a)));
    document.title = fix(document.title);
    // Logos: the image file itself is swapped for a drawn wordmark (hiding it is not enough on every site).
    for (const img of document.querySelectorAll('img')) {
      const isLogo = logos.some((l) => (img.currentSrc || img.src || '').includes(l)) || /^(salinho|swell club)$/i.test(img.alt.trim());
      if (!isLogo || img.dataset.anon) continue;
      img.dataset.anon = '1';
      img.removeAttribute('srcset');
      const w = img.naturalWidth || 400, h = img.naturalHeight || 160;
      const svg = logoText
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${logoStyle ? `<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) / 2 - 2}" fill="#f2c94c"/>` : ''}<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="${logoStyle ? h * 0.12 : h * 0.5}" fill="${logoStyle ? '#0d2b33' : '#ece6da'}">${logoText}</text></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"></svg>`;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }
  }, { swap: site.swap.map(([re, r]) => [re.source, re.flags, r]), logos: site.logos, logoText: site.logoText, logoStyle: site.logoStyle, hideSvgWith: site.hideSvgWith?.source });
  if (site.fix) await page.evaluate(site.fix);
}

// Run directly: the hero and full-page captures. Imported: only SITES and anonymize().
if (process.argv[1] === fileURLToPath(import.meta.url)) {
const browser = await chromium.launch({ executablePath: CHROME });
for (const [name, site] of Object.entries(SITES)) {
  for (const [kind, vp, scale] of [['pc', { width: 1440, height: 900 }, 2], ['cel', { width: 390, height: 844 }, 3]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: scale, locale: 'pt-BR' });
    await swapPhotos(ctx, site);
    const page = await ctx.newPage();
    await page.goto(site.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2500);
    await anonymize(page, site);
    // Force a fresh paint, so no layer cached from before the swap survives in the picture.
    await page.evaluate(() => window.scrollTo(0, 2));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, `${name}-${kind}-topo.png`) });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += vp.height * 0.7) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(250); }
    await anonymize(page, site); // late-loaded sections get the same swap
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, `${name}-${kind}-inteiro.png`), fullPage: true });
    // Nothing of the real brand may remain in the captured text.
    const left = await page.evaluate(() => (document.body.innerText.match(/semv|downtown|surflife|feito à mão|juquehy|cibele|renato|maresias|francisco loup/gi) || []).slice(0, 8));
    console.log(name, kind, h, left.length ? `SOBROU: ${left.join(', ')}` : 'limpo');
    await page.context().close();
  }
}
await browser.close();
}

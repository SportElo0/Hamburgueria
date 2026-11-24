// Deterministic frame capture of the Areia Clara site on a phone (390x844 @3x).
// Time is driven by Playwright's fake clock (GSAP, timers, rAF); CSS animations are stepped by hand;
// the hero video is seeked per frame. Usage: node r25_capture.cjs <outDir> [clip ...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2];
const ONLY = process.argv.slice(3);
const FPS = 30, DT = 1000 / FPS;
const ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a, b, k) => a + (b - a) * k;

async function step(p, t, ms = DT) {
  await p.evaluate(async ({ ms, t }) => {
    for (const a of document.getAnimations()) {
      try { if (a.playState !== 'paused') a.pause(); a.currentTime = (a.currentTime || 0) + ms; } catch (e) {}
    }
    const v = document.querySelector('.hero-video');
    if (v && v.readyState >= 1 && t != null) {
      v.pause();
      const target = t % Math.max(0.5, (v.duration || 4) - 0.05);
      if (Math.abs(v.currentTime - target) > 0.001) {
        await new Promise((r) => { const done = () => { v.removeEventListener('seeked', done); r(); }; v.addEventListener('seeked', done); v.currentTime = target; setTimeout(r, 400); });
      }
    }
  }, { ms, t });
  await p.clock.runFor(ms);
}
async function shoot(p, dir, i) {
  await p.screenshot({ path: path.join(dir, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 88 });
}
async function avancar(p, ms, vt) { // advance time without saving frames
  for (let x = 0; x < ms; x += DT) { await step(p, vt == null ? null : vt + x / 1000); }
}
const docY = (p, sel, frac = 0) => p.evaluate(({ sel, frac }) => { const el = document.querySelector(sel); const r = el.getBoundingClientRect(); return r.top + scrollY + frac * el.offsetHeight; }, { sel, frac });
const scrollTo = (p, y) => p.evaluate((y) => window.scrollTo(0, y), y);

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'pt-BR' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.error('pageerror', e.message));
  await p.clock.install({ time: new Date('2026-11-16T23:04:00-03:00') });
  await p.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800);
  const vh = 844;
  const want = (n) => !ONLY.length || ONLY.includes(n);
  const clip = async (name, seconds, perFrame, videoT0 = 0) => {
    const dir = path.join(OUT, name); fs.mkdirSync(dir, { recursive: true });
    const n = Math.round(seconds * FPS);
    for (let i = 0; i < n; i++) {
      const t = i / FPS;
      if (perFrame) await perFrame(t, i);
      await step(p, videoT0 + t);
      if (want(name)) await shoot(p, dir, i);
    }
    console.log(name, n, 'quadros');
  };

  // c1: opening curtain and hero entrance, from page load
  await clip('c1', 4.4, null, 0);
  await avancar(p, 2600, 4.4);

  // c2: hero holds 1.2 s, then scroll shrinks it into the window
  const capaFim = Math.round(vh * 1.7);
  await clip('c2', 4.0, async (t) => { await scrollTo(p, lerp(0, capaFim, ease((t - 1.1) / 2.5))); }, 7.0);

  // c3: suite cards stacking
  const s0 = await docY(p, '.suites'), sH = await p.evaluate(() => document.querySelector('.suites').offsetHeight);
  await scrollTo(p, s0 - 120); await avancar(p, 600);
  await clip('c3', 2.7, async (t) => { await scrollTo(p, lerp(s0 - 120, s0 + sH - vh * 0.9, ease(t / 2.6))); });

  // c5: a day, morning -> afternoon -> night, phase changes at 2.7 s and 3.35 s
  const d0 = await docY(p, '.day');
  const pinLen = vh * 2.2;
  await scrollTo(p, d0 - vh * 0.5); await avancar(p, 500);
  await clip('c5', 4.4, async (t) => {
    let y;
    if (t < 0.6) y = lerp(d0 - vh * 0.5, d0, ease(t / 0.6));
    else if (t < 2.6) y = d0 + pinLen * lerp(0.02, 0.30, (t - 0.6) / 2.0);
    else if (t < 2.8) y = d0 + pinLen * lerp(0.30, 0.40, (t - 2.6) / 0.2);
    else if (t < 3.25) y = d0 + pinLen * lerp(0.40, 0.62, (t - 2.8) / 0.45);
    else if (t < 3.45) y = d0 + pinLen * lerp(0.62, 0.72, (t - 3.25) / 0.2);
    else y = d0 + pinLen * lerp(0.72, 0.9, (t - 3.45) / 0.95);
    await scrollTo(p, y);
  });

  // c6: chat opens, guest asks about pets
  const a0 = await docY(p, '.arrive');
  await scrollTo(p, a0 + 40); await avancar(p, 1200);
  await clip('c6', 3.4, async (t, i) => {
    if (i === Math.round(0.25 * FPS)) await p.evaluate(() => document.querySelector('.chat-fab').click());
    if (i === Math.round(1.3 * FPS)) await p.evaluate(() => [...document.querySelectorAll('.chat-quick button')].find((b) => b.textContent.includes('pet'))?.click());
  });

  // c7: quote form already filled; send it and the assistant repeats the request
  await p.evaluate(() => document.querySelector('.chat-close').click());
  const q0 = await docY(p, '#quote-form');
  await scrollTo(p, q0 - 60); await avancar(p, 1500);
  await p.evaluate(() => {
    const f = document.querySelector('#quote-form');
    f.entrada.value = '2026-12-18'; f.saida.value = '2026-12-21'; f.adultos.value = '2'; f.criancas.value = '1';
    f.suite.value = 'Bangalô Jardim'; f.pet.checked = true; f.nome.value = 'Marina'; f.whatsapp.value = '(00) 00000-0000'; f.aceite.checked = true;
  });
  await avancar(p, 300);
  await clip('c7', 3.2, async (t, i) => {
    if (i === Math.round(0.2 * FPS)) await p.evaluate(() => document.querySelector('#quote-form button[type=submit]').click());
  });

  await b.close();
})();

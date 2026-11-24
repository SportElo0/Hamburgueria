// Motion for Reel 10 (pedido na mesa). Runs inside the reel page after the runtime:
// every scene update is a pure function of the scene's local time, so each frame is deterministic.
(() => {
  const { clamp, easeOut, easeInOut } = window.ease;
  const back = (x) => { x = clamp(x); const c = 1.9, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const $ = (el, s) => el.querySelector(s);
  const $$ = (el, s) => [...el.querySelectorAll(s)];
  const lerp = (a, b, k) => a + (b - a) * k;
  const FPS = 30;

  async function play(img, local, offset = 0) {
    const n = Math.max(0, Math.min(+img.dataset.count - 1, Math.floor((local - offset) * FPS)));
    const src = img.dataset.seq + '/' + String(n).padStart(5, '0') + '.jpg';
    if (img.getAttribute('src') !== src) { img.src = src; await img.decode().catch(() => {}); }
  }
  /** Springy pop: scale from 0 with overshoot, fade in. Keeps the element's own base transform. */
  function pop(e, local, t0, d = 0.55) {
    const k = back((local - t0) / d);
    e.style.opacity = clamp((local - t0) / (d * 0.4));
    e.style.transform = `${e.dataset.base || ''} scale(${Math.max(0, k)})`;
  }
  /** Words rise in one by one (class .w with data-t). */
  function words(el, local) {
    for (const w of $$(el, '.w')) {
      const k = easeOut((local - +w.dataset.t) / 0.45);
      w.style.opacity = k;
      w.style.transform = `translateY(${(1 - k) * 60}px) rotate(${(1 - k) * 4}deg)`;
      w.style.filter = `blur(${(1 - k) * 8}px)`;
    }
  }
  /** A thing that flies along a curve from a to b, scaling down as it lands. */
  function fly(e, local, t0, d, a, b, lift = 220) {
    const k = clamp((local - t0) / d);
    const on = local >= t0 && k < 1;
    e.style.opacity = on ? Math.min(1, k * 6, (1 - k) * 6) : 0;
    const x = lerp(a[0], b[0], easeInOut(k));
    const y = lerp(a[1], b[1], easeInOut(k)) - Math.sin(Math.PI * k) * lift;
    e.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) scale(${1 - 0.35 * k}) rotate(${(1 - k) * -12}deg)`;
  }
  const bump = (e, local, t0, base = '') => {
    const k = clamp((local - t0) / 0.4);
    const s = local >= t0 ? 1 + 0.28 * Math.sin(Math.PI * k) : 1;
    e.style.transform = `${base} scale(${s})`;
  };
  const wiggle = (local, t0) => (local >= t0 ? Math.sin((local - t0) * 26) * 14 * Math.exp(-(local - t0) * 2.2) : 0);

  window.updates = window.updates || {};

  // 0. Salão cheio: tables pop, a waiter runs between them, hands go up.
  window.updates.s0 = async (local, dur, el) => {
    words(el, local);
    const floor = $(el, '.floor');
    $$(floor, '.tbl').forEach((t, i) => pop(t, local, 0.15 + i * 0.07, 0.5));
    $$(floor, '.ask').forEach((b, i) => {
      const t0 = 0.9 + i * 0.42;
      pop(b, local, t0, 0.45);
      b.querySelector('.ring').style.transform = `rotate(${wiggle(local, t0 + 0.2)}deg)`;
    });
    // Waiter path through the floor, with a short fading trail.
    const pts = JSON.parse(floor.dataset.path);
    const at = (u) => {
      u = Math.max(0, Math.min(pts.length - 1.001, u));
      const i = Math.floor(u), f = easeInOut(u - i);
      return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)];
    };
    const speed = 2.1;
    const u = Math.max(0, (local - 0.5) * speed);
    const w = $(floor, '.waiter');
    const [wx, wy] = at(u);
    w.setAttribute('cx', wx); w.setAttribute('cy', wy);
    w.style.opacity = clamp((local - 0.4) / 0.2);
    $$(floor, '.trail').forEach((c, i) => {
      const [x, y] = at(u - (i + 1) * 0.09);
      c.setAttribute('cx', x); c.setAttribute('cy', y);
      c.style.opacity = local > 0.6 ? 0.5 * (1 - i / 8) : 0;
    });
    // Zoom into table 5 as the scene ends.
    const z = easeInOut((local - (dur - 0.7)) / 0.7);
    floor.style.transform = `scale(${1 + 2.2 * z})`;
    floor.style.opacity = 1 - 0.6 * z;
  };

  // 1. The QR on the table gets scanned.
  window.updates.s1 = async (local, dur, el) => {
    words(el, local);
    pop($(el, '.badge'), local, 0.05, 0.5);
    const tent = $(el, '.tent');
    const tk = back(local / 0.6);
    tent.style.transform = `translateY(${(1 - tk) * 220}px) rotate(${(1 - clamp(local / 0.6)) * -6}deg)`;
    tent.style.opacity = clamp(local / 0.25);
    const cam = $(el, '.cam');
    const ck = easeOut((local - 0.45) / 0.55);
    cam.style.transform = `translate(-50%,${(1 - ck) * 900}px) scale(${1 + 0.06 * Math.sin(local * 3)})`;
    cam.style.opacity = clamp((local - 0.45) / 0.2);
    const scan = $(el, '.scanline');
    const sk = clamp((local - 1.05) / 0.8);
    scan.style.top = `${lerp(8, 92, (1 - Math.cos(sk * Math.PI * 2)) / 2)}%`;
    scan.style.opacity = local > 1.05 && sk < 1 ? 1 : 0;
    $$(el, '.corner').forEach((c) => (c.style.opacity = local > 1.0 ? 0.6 + 0.4 * Math.sin(local * 14) : 0));
    pop($(el, '.ok'), local, 1.9, 0.5);
    // Hand-off: everything leans into the phone that comes next.
    const out = easeInOut((local - (dur - 0.45)) / 0.45);
    $(el, '.stage').style.transform = `scale(${1 + 0.1 * out})`;
  };

  // 2. Customer orders from the phone.
  window.updates.s2 = async (local, dur, el) => {
    words(el, local);
    pop($(el, '.badge'), local, 0.05, 0.5);
    await play($(el, 'img.rec'), local, 0.2);
    const ph = $(el, '.phone');
    const k = back(local / 0.6);
    ph.style.transform = `perspective(1800px) translateY(${(1 - k) * 160}px) scale(${0.82 + 0.18 * k}) rotateY(${Math.sin(local * 0.9) * 4}deg) rotateX(${Math.cos(local * 0.7) * 2}deg)`;
    pop($(el, '.chip-a'), local, 1.0);
    pop($(el, '.chip-b'), local, 1.45);
    const bag = $(el, '.bag');
    pop(bag, local, 2.6, 0.45);
    // The +1s leave where the add buttons are and land in the bag; the bag counts them.
    fly($(el, '.plus1'), local, 3.25, 0.7, [800, 1010], [948, 760], 180);
    fly($(el, '.plus2'), local, 4.45, 0.7, [800, 1170], [948, 760], 180);
    if (local >= 2.6) {
      const base = bag.dataset.base || '';
      if (local > 3.95 && local < 4.35) bump(bag, local, 3.95, base);
      else if (local > 5.15 && local < 5.55) bump(bag, local, 5.15, base);
    }
    $(el, '.bag-n').textContent = local > 5.15 ? '2' : local > 3.95 ? '1' : '0';
    // Order sent: the ticket flies to the kitchen.
    const kit = $(el, '.kitchen');
    pop(kit, local, 6.8, 0.45);
    fly($(el, '.ticket'), local, 7.45, 0.85, [540, 1130], [905, 1460], 260);
    if (local > 8.3 && local < 8.7) bump(kit, local, 8.3, kit.dataset.base || '');
    $(el, '.kitchen .flame').style.transform = `scale(${1 + 0.12 * Math.sin(local * 12)})`;
  };

  // 3. A friend joins with the code: the digits travel from one phone to the other.
  window.updates.s3 = async (local, dur, el) => {
    words(el, local);
    pop($(el, '.badge'), local, 0.05, 0.5);
    await play($(el, '.ph-b img.rec'), local, 0.25);
    const ka = back(local / 0.55), kb = back((local - 0.15) / 0.55);
    $(el, '.ph-a').style.transform = `translateX(${(1 - ka) * -420}px) rotate(${(1 - clamp(local / 0.55)) * -8}deg) rotate(-4deg)`;
    $(el, '.ph-b').style.transform = `translateX(${(1 - kb) * 420}px) rotate(${(1 - clamp((local - 0.15) / 0.55)) * 8}deg) rotate(4deg)`;
    $$(el, '.digit').forEach((d, i) => fly(d, local, 0.95 + i * 0.35, 0.5, [262, 700], [795, 1035], 200));
    const link = $(el, '.link');
    const lk = easeOut((local - 3.2) / 0.6);
    link.style.strokeDashoffset = 900 * (1 - lk);
    link.style.opacity = local > 3.2 ? 1 : 0;
    $$(el, '.pulse').forEach((p, i) => {
      const f = ((local - 3.6 + i * 0.5) % 1.5) / 1.5;
      p.style.offsetDistance = `${f * 100}%`;
      p.style.opacity = local > 3.6 ? Math.sin(Math.PI * f) : 0;
    });
    pop($(el, '.same'), local, 3.7, 0.5);
  };

  // 4. The waiter's phone: confirm, calls pop out, bill closed.
  window.updates.s4 = async (local, dur, el) => {
    words(el, local);
    pop($(el, '.badge'), local, 0.05, 0.5);
    await play($(el, 'img.rec'), local, 0.2);
    const ph = $(el, '.phone');
    const k = back(local / 0.6);
    ph.style.transform = `perspective(1800px) translateY(${(1 - k) * 160}px) scale(${0.82 + 0.18 * k}) rotateY(${Math.sin(local * 0.8) * -4}deg)`;
    pop($(el, '.n-ok'), local, 1.65);
    const n1 = $(el, '.n-call'), n2 = $(el, '.n-bill');
    pop(n1, local, 3.0);
    pop(n2, local, 3.45);
    n1.querySelector('.ring').style.transform = `rotate(${wiggle(local, 3.2)}deg)`;
    n2.querySelector('.ring').style.transform = `rotate(${wiggle(local, 3.65) * 0.6}deg)`;
    // Answered: the call note leaves; the bill note leaves when the bill is closed.
    const gone = (e, t0) => { if (local > t0) { const g = easeInOut((local - t0) / 0.4); e.style.opacity = 1 - g; e.style.transform = `${e.dataset.base || ''} translateX(${g * 260}px) scale(${1 - 0.2 * g})`; } };
    gone(n1, 4.9);
    gone(n2, 7.9);
    gone($(el, '.n-ok'), 4.9);
    // Burst and "mesa livre".
    const t0 = 8.05;
    $$(el, '.spark').forEach((s, i) => {
      const a = (i / 14) * Math.PI * 2, f = clamp((local - t0) / 0.9);
      const r = 40 + easeOut(f) * (230 + (i % 3) * 60);
      s.style.opacity = local > t0 && f < 1 ? 1 - f : 0;
      s.style.transform = `translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px) scale(${1 - f * 0.6})`;
    });
    pop($(el, '.free'), local, t0 + 0.15, 0.55);
  };

  // 5. Close: the mark builds, the plan badge shines, the call to action pulses.
  window.updates.s5 = async (local, dur, el) => {
    words(el, local);
    const m1 = $(el, '.m1'), m2 = $(el, '.m2');
    const k1 = back(local / 0.55), k2 = back((local - 0.12) / 0.55);
    m1.style.transform = `translate(${(1 - k1) * -160}px,${(1 - k1) * 120}px)`;
    m2.style.transform = `translate(${(1 - k2) * 160}px,${(1 - k2) * 120}px)`;
    m1.style.opacity = clamp(local / 0.2); m2.style.opacity = clamp((local - 0.12) / 0.2);
    pop($(el, '.plan'), local, 0.45, 0.55);
    const sh = $(el, '.shine');
    sh.style.transform = `translateX(${lerp(-160, 560, clamp((local - 0.9) / 0.7))}px) skewX(-20deg)`;
    pop($(el, '.cta'), local, 1.6, 0.55);
    const r = $(el, '.cta-ring');
    const f = local > 2.0 ? ((local - 2.0) % 1.2) / 1.2 : 0;
    r.style.opacity = local > 2.0 ? 0.7 * (1 - f) : 0;
    r.style.transform = `scale(${1 + f * 0.35})`;
    $(el, '.note').style.opacity = clamp((local - 2.1) / 0.4);
  };
})();

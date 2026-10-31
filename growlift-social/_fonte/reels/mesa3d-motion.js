// Motion for Reel 10 over the 3D restaurant (tools/mesa-scene). The 3D frames play underneath
// on the global clock; every overlay is a pure function of its scene's local time.
(() => {
  const { clamp, easeOut, easeInOut } = window.ease;
  const back = (x) => { x = clamp(x); const c = 1.9, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const $ = (el, s) => el.querySelector(s);
  const $$ = (el, s) => [...el.querySelectorAll(s)];
  const lerp = (a, b, k) => a + (b - a) * k;
  const FPS = 30;

  async function frame(img, n) {
    n = Math.max(0, Math.min(+img.dataset.count - 1, n));
    const src = img.dataset.seq + '/' + String(n).padStart(5, '0') + '.jpg';
    if (img.getAttribute('src') !== src) { img.src = src; await img.decode().catch(() => {}); }
  }
  const play = (img, local, offset = 0) => frame(img, Math.floor((local - offset) * FPS));
  function pop(e, local, t0, d = 0.55) {
    const k = back((local - t0) / d);
    e.style.opacity = clamp((local - t0) / (d * 0.4));
    e.style.transform = `scale(${Math.max(0, k)})`;
  }
  /** Leaves to the side and fades. */
  function leave(e, local, t0, dx = -200) {
    if (local <= t0) return;
    const g = easeInOut((local - t0) / 0.4);
    e.style.opacity = Math.min(+e.style.opacity || 1, 1 - g);
    e.style.transform = `translateX(${g * dx}px) scale(${1 - 0.15 * g})`;
  }
  function words(el, local) {
    for (const w of $$(el, '.w')) {
      const k = back((local - +w.dataset.t) / 0.5);
      const o = clamp((local - +w.dataset.t) / 0.2);
      w.style.opacity = o;
      w.style.transform = `translateY(${(1 - Math.min(1, k)) * 50}px) scale(${0.6 + 0.4 * k})`;
    }
  }
  function fly(e, local, t0, d, a, b, lift = 220) {
    const k = clamp((local - t0) / d);
    e.style.opacity = local >= t0 && k < 1 ? Math.min(1, k * 6, (1 - k) * 6) : 0;
    const x = lerp(a[0], b[0], easeInOut(k));
    const y = lerp(a[1], b[1], easeInOut(k)) - Math.sin(Math.PI * k) * lift;
    e.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) scale(${1 - 0.35 * k}) rotate(${(1 - k) * -12}deg)`;
  }
  const bump = (local, t0) => (local >= t0 && local < t0 + 0.4 ? 1 + 0.28 * Math.sin(Math.PI * (local - t0) / 0.4) : 1);
  const wiggle = (local, t0) => (local >= t0 ? Math.sin((local - t0) * 26) * 14 * Math.exp(-(local - t0) * 2.2) : 0);
  /** Floating phone: springs in from below, sways gently, sinks out at the end. */
  function phoneIn(ph, local, dur, base) {
    const k = back(local / 0.65), out = easeInOut((local - (dur - 0.45)) / 0.45);
    ph.style.transform = `${base} perspective(1800px) translateY(${(1 - k) * 420 + out * 500}px) rotateY(${Math.sin(local * 0.9) * -5 - 4}deg) rotateZ(${(1 - k) * 8 + Math.sin(local * 0.7) * 1.2}deg)`;
    ph.style.opacity = clamp(local / 0.15) * (1 - out);
  }

  // The 3D restaurant underneath, on the global clock.
  const bg = document.getElementById('bg');
  const render = window.render;
  window.render = async (t) => {
    const w = (window.WARP || [[0, 1e9, 0, 1]]).find(([ns, ne]) => t >= ns && t < ne) || window.WARP[window.WARP.length - 1];
    const ot = w[2] + (t - w[0]) * w[3];
    await frame(bg, Math.round(ot * FPS));
    bg.style.transform = ot > 35.5 ? `scale(${1 + 0.012 * (ot - 35.5)})` : '';
    await render(t);
  };

  window.updates = window.updates || {};
  const warp = (id, fn) => {
    const i = +id.slice(1), w = (window.WARP || [])[i];
    return w ? (local, dur, el) => fn(local * w[3], dur * w[3], el) : fn;
  };
  window.updates.s0 = async (local, dur, el) => { words(el, local); };
  window.updates.s1 = async (local, dur, el) => { words(el, local); pop($(el, '.ok'), local, 1.7); };
  window.updates.s2 = async (local, dur, el) => {
    words(el, local);
    const ph = $(el, '.phone');
    phoneIn(ph, local, dur, '');
    await play($(el, 'img.rec'), local, 0.2);
    pop($(el, '.chip-a'), local, 1.0);
    pop($(el, '.chip-b'), local, 1.4);
    leave($(el, '.chip-a'), local, 6.4);
    leave($(el, '.chip-b'), local, 6.5);
    const bag = $(el, '.bag');
    pop(bag, local, 2.6, 0.45);
    if (local > 2.6) bag.style.transform = `scale(${Math.min(back((local - 2.6) / 0.45), 1.2) * bump(local, 3.95) * bump(local, 5.15)})`;
    leave(bag, local, 6.6, 160);
    $(el, '.bag-n').textContent = local > 5.15 ? '2' : local > 3.95 ? '1' : '0';
    fly($(el, '.plus1'), local, 3.25, 0.7, [905, 989], [950, 440], 160);
    fly($(el, '.plus2'), local, 4.45, 0.7, [905, 1109], [950, 440], 160);
    const kit = $(el, '.kitchen');
    pop(kit, local, 6.9, 0.45);
    if (local > 8.35) kit.style.transform = `scale(${bump(local, 8.35)})`;
    $(el, '.kitchen .flame').style.transform = `scale(${1 + 0.12 * Math.sin(local * 12)})`;
    fly($(el, '.ticket'), local, 7.45, 0.9, [735, 940], [900, 445], 240);
  };
  window.updates.s3 = async (local, dur, el) => {
    words(el, local);
    phoneIn($(el, '.ph-a'), local, dur, 'rotate(-5deg)');
    phoneIn($(el, '.ph-b'), local - 0.12, dur - 0.12, 'rotate(5deg)');
    await play($(el, '.ph-b img.rec'), local, 0.25);
    $$(el, '.digit').forEach((d, i) => fly(d, local, 0.95 + i * 0.35, 0.5, [234, 862], [780, 1150], 180));
    const link = $(el, '.link');
    link.style.strokeDashoffset = 900 * (1 - easeOut((local - 3.2) / 0.6));
    link.style.opacity = local > 3.2 && local < dur - 0.4 ? 1 : 0;
    $$(el, '.pulse').forEach((p, i) => {
      const f = ((local - 3.6 + i * 0.5) % 1.5) / 1.5;
      p.style.offsetDistance = `${f * 100}%`;
      p.style.opacity = local > 3.6 && local < dur - 0.4 ? Math.sin(Math.PI * f) : 0;
    });
    pop($(el, '.same'), local, 3.7, 0.5);
  };
  window.updates.s4 = async (local, dur, el) => {
    words(el, local);
    phoneIn($(el, '.phone'), local, dur, '');
    await play($(el, 'img.rec'), local, 0.2);
    pop($(el, '.n-ok'), local, 1.65);
    leave($(el, '.n-ok'), local, 4.9, 200);
    const n1 = $(el, '.n-call'), n2 = $(el, '.n-bill');
    pop(n1, local, 2.7);
    pop(n2, local, 3.15);
    n1.querySelector('.ring').style.transform = `rotate(${wiggle(local, 2.9)}deg)`;
    n2.querySelector('.ring').style.transform = `rotate(${wiggle(local, 3.35) * 0.6}deg)`;
    leave(n1, local, 4.9);
    leave(n2, local, 7.9);
    const t0 = 7.95;
    $$(el, '.spark').forEach((s, i) => {
      const a = (i / 14) * Math.PI * 2, f = clamp((local - t0) / 0.9);
      const r = 40 + easeOut(f) * (200 + (i % 3) * 50);
      s.style.opacity = local > t0 && f < 1 ? 1 - f : 0;
      s.style.transform = `translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px) scale(${1 - f * 0.6})`;
    });
    pop($(el, '.free'), local, t0 + 0.15, 0.55);
  };
  window.updates.s5 = async (local, dur, el) => {
    words(el, local);
    // Part A: the mark, the plan badge and the line (31.2 to 35.5).
    const m1 = $(el, '.m1'), m2 = $(el, '.m2');
    const k1 = back(local / 0.55), k2 = back((local - 0.12) / 0.55);
    m1.style.transform = `translate(${(1 - k1) * -160}px,${(1 - k1) * 120}px)`;
    m2.style.transform = `translate(${(1 - k2) * 160}px,${(1 - k2) * 120}px)`;
    m1.style.opacity = clamp(local / 0.2); m2.style.opacity = clamp((local - 0.12) / 0.2);
    pop($(el, '.plan'), local, 0.35, 0.55);
    $(el, '.shine').style.transform = `translateX(${lerp(-160, 560, clamp((local - 0.8) / 0.7))}px) skewX(-20deg)`;
    const swap = 4.45;
    const out = easeInOut((local - swap) / 0.35);
    const A = $(el, '.endA');
    A.style.opacity = 1 - out;
    A.style.transform = `translateY(${-80 * out}px)`;
    // Part B: "Comenta MESA" (from 35.5): the keyword pops and pulses, someone types it.
    const B = $(el, '.endB');
    B.style.opacity = clamp((local - swap - 0.15) / 0.3);
    const lb = local - swap;
    pop($(el, '.q'), lb, 0.0, 0.5);
    pop($(el, '.ent'), lb, 1.45, 0.5);
    pop($(el, '.com'), lb, 3.1, 0.45);
    const kw = $(el, '.kw');
    const kk = back((lb - 3.4) / 0.6);
    const beat = lb > 4.1 ? 1 + 0.05 * Math.max(0, Math.sin((lb - 4.1) * Math.PI * 2 / 0.9)) : 1;
    kw.style.opacity = clamp((lb - 3.4) / 0.2);
    kw.style.transform = `scale(${Math.max(0, kk) * beat}) rotate(${(1 - clamp((lb - 3.4) / 0.6)) * -10}deg)`;
    const ring = $(el, '.kw-ring');
    const f = lb > 4.1 ? ((lb - 4.1) % 0.9) / 0.9 : 0;
    ring.style.opacity = lb > 4.1 ? 0.8 * (1 - f) : 0;
    ring.style.transform = `scale(${1 + f * 0.18})`;
    const field = $(el, '.field');
    const fk = back((lb - 4.0) / 0.5);
    field.style.opacity = clamp((lb - 4.0) / 0.2);
    field.style.transform = `translateY(${(1 - Math.min(1, fk)) * 80}px)`;
    const word = 'MESA';
    const n = Math.max(0, Math.min(4, Math.floor((lb - 4.5) / 0.18) + 1));
    const caret = Math.floor(lb * 2) % 2 ? '|' : '';
    const typed = $(el, '.typed');
    typed.textContent = lb < 4.5 ? 'Adicione um comentário…' : word.slice(0, n) + (n < 4 ? caret : '');
    typed.style.color = lb < 4.5 ? '#8790a6' : '#fff';
    const send = $(el, '.send');
    send.style.transform = `scale(${lb > 5.35 && lb < 5.75 ? 1.2 : 1})`;
    $(el, '.note').style.opacity = clamp((local - 1.2) / 0.4);
  };
  for (const id of Object.keys(window.updates)) window.updates[id] = warp(id, window.updates[id]);
})();

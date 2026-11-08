// Growlift: header state, scroll reveals and the free-diagnosis form.
(() => {
  const top = document.getElementById('topo');
  const onScroll = () => top.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  document.getElementById('ano').textContent = String(new Date().getFullYear());

  // Hero video: always plays (the owners want the motion everywhere). iPhones in Low Power Mode
  // block autoplay, so the first touch or scroll starts it.
  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    const play = () => heroVideo.play().catch(() => {});
    play();
    const kick = () => {
      play();
      if (!heroVideo.paused) ['touchstart', 'scroll', 'click'].forEach((t) => window.removeEventListener(t, kick));
    };
    ['touchstart', 'scroll', 'click'].forEach((t) => window.addEventListener(t, kick, { passive: true }));
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && play());
  }

  // Reveal blocks as they enter the screen; the site preview and the x-ray start their animation then.
  const watched = document.querySelectorAll('.reveal, .browser, .xray');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    watched.forEach((el) => io.observe(el));
  } else {
    watched.forEach((el) => el.classList.add('in'));
  }

  // Subida: a 3D frame sequence (rendered by tools/growlift-scene) that plays with the scroll.
  // The picture eases toward the scroll position and cross-fades neighbouring frames, so it glides.
  const lift = document.getElementById('subida');
  if (lift) {
    const canvas = lift.querySelector('.lift-canvas');
    const ctx = canvas.getContext('2d');
    const steps = lift.querySelectorAll('.lift-steps li');
    const FRAMES = 96;
    const set = window.innerWidth / window.innerHeight < 1 ? 'm' : 'd';
    const frames = new Array(FRAMES);
    let target = 0;
    let shown = 0;
    let raf = 0;
    let started = false;

    const ready = (k) => k >= 0 && k < FRAMES && frames[k] && frames[k].naturalWidth;
    const paint = (img, alpha) => {
      const w = canvas.width;
      const h = canvas.height;
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.globalAlpha = 1;
    };
    const render = (p) => {
      const f = p * (FRAMES - 1);
      const i = Math.floor(f);
      // Nearest frame already loaded, so a fast scroll never shows a blank canvas.
      let k = -1;
      for (let d = 0; d < FRAMES && k < 0; d++) k = ready(i - d) ? i - d : ready(i + d) ? i + d : -1;
      if (k < 0) return;
      paint(frames[k], 1);
      if (k === i && ready(i + 1) && f > i) paint(frames[i + 1], f - i);
    };
    const tick = () => {
      shown += (target - shown) * 0.16;
      if (Math.abs(target - shown) < 0.0004) shown = target;
      render(shown);
      raf = shown === target ? 0 : requestAnimationFrame(tick);
    };
    const progress = () => {
      const r = lift.getBoundingClientRect();
      const run = lift.offsetHeight - window.innerHeight;
      return run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 1;
    };
    const update = () => {
      target = progress();
      if (!raf) raf = requestAnimationFrame(tick);
      steps.forEach((li, n) => li.classList.toggle('on', target >= [0, 0.36, 0.68][n]));
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      render(shown);
    };
    const load = (i) =>
      new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = img.onerror = () => {
          frames[i] = img;
          if (Math.abs(i - shown * (FRAMES - 1)) <= 6) render(shown);
          resolve();
        };
        img.src = `img/lift/${set}/${String(i).padStart(2, '0')}.webp`;
      });
    const start = async () => {
      if (started) return;
      started = true;
      // Every 8th frame first, so the whole scroll has something to show quickly, then the rest.
      const order = [];
      for (let step of [8, 4, 2, 1]) for (let i = 0; i < FRAMES; i += step) if (!order.includes(i)) order.push(i);
      if (!order.includes(FRAMES - 1)) order.splice(1, 0, FRAMES - 1);
      for (let n = 0; n < order.length; n += 6) await Promise.all(order.slice(n, n + 6).map(load));
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', update, { passive: true });
    if ('IntersectionObserver' in window) {
      const near = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          near.disconnect();
          start();
        }
      }, { rootMargin: '150% 0px' });
      near.observe(lift);
    } else start();
    shown = target = progress();
    update();
  }

  // Ramos: the section holds still while the browser slides sideways through one site per trade;
  // each site rests a moment, and the word in the title follows the site on screen.
  const ramos = document.getElementById('ramos');
  if (ramos) {
    const slides = ramos.querySelector('.slides');
    const imgs = slides.querySelectorAll('img');
    const words = ramos.querySelector('.spin .track');
    const url = ramos.querySelector('.bar .url');
    const dots = ramos.querySelectorAll('.ramos-dots i');
    const n = imgs.length;
    let target = 0;
    let shown = 0;
    let raf = 0;
    let current = -1;

    const smooth = (x) => x * x * (3 - 2 * x);
    const position = (p) => {
      // Rest on each site for the first and last part of its stretch, slide in the middle.
      const f = Math.min(p * (n - 1), n - 1);
      const i = Math.min(Math.floor(f), n - 2);
      const t = Math.min(1, Math.max(0, (f - i - 0.3) / 0.4));
      return i + smooth(t);
    };
    const render = () => {
      const s = position(shown);
      slides.style.transform = `translate3d(${-s * 100}%, 0, 0)`;
      const k = Math.round(s);
      if (k !== current) {
        current = k;
        words.style.transform = `translateY(${-k * 1.15}em)`;
        dots.forEach((d, j) => d.classList.toggle('on', j === k));
        if (url && imgs[k]?.dataset.url) url.textContent = imgs[k].dataset.url;
      }
    };
    const tick = () => {
      shown += (target - shown) * 0.14;
      if (Math.abs(target - shown) < 0.0005) shown = target;
      render();
      raf = shown === target ? 0 : requestAnimationFrame(tick);
    };
    const update = () => {
      const r = ramos.getBoundingClientRect();
      const run = ramos.offsetHeight - window.innerHeight;
      target = run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    // The next sites sit off to the side, where lazy loading would wait too long: load them early.
    const near = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      near.disconnect();
      imgs.forEach((img) => (img.loading = 'eager'));
    }, { rootMargin: '100% 0px' });
    near.observe(ramos);
    window.addEventListener('scroll', update, { passive: true });
    update();
    shown = target;
    render();
  }

  // Mobile: one small "plan" button stays at the bottom after the cover, and steps aside at the form.
  const sticky = document.querySelector('.sticky-cta');
  const diag = document.getElementById('diagnostico');
  const heroEl = document.querySelector('.hero');
  if (sticky && diag && heroEl && 'IntersectionObserver' in window) {
    let pastHero = false;
    let atForm = false;
    const inScene = new Set();
    const show = () => sticky.classList.toggle('on', pastHero && !atForm && inScene.size === 0);
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; show(); }).observe(heroEl);
    new IntersectionObserver(([e]) => { atForm = e.isIntersecting; show(); }, { rootMargin: '0px 0px -30% 0px' }).observe(diag);
    // The pinned scenes use the whole screen: the button steps aside while one is on screen.
    const sceneIO = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? inScene.add(e.target) : inScene.delete(e.target)));
      show();
    }, { threshold: 0.35 });
    document.querySelectorAll('.scene-sobremesa, .scene-zap, #palco3d').forEach((el) => sceneIO.observe(el));
  }

  // Cena 1: the burger on the plate. The viewer (self-hosted, ~1 MB) loads only when the section gets near.
  // While the visitor scrolls in, the scroll turns the plate to face them; the first touch hands control over
  // (rotation stops, zoom stays where they leave it).
  const palco = document.getElementById('palco3d');
  let mvTaken = false;
  if (palco) {
    const load = () => {
      if (document.querySelector('script[data-mv]')) return;
      const sc = document.createElement('script');
      sc.type = 'module';
      sc.src = 'vendor/model-viewer-4.4.0.min.js';
      sc.dataset.mv = '1';
      document.head.appendChild(sc);
    };
    if ('IntersectionObserver' in window) {
      const near = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { near.disconnect(); load(); } }, { rootMargin: '600px 0px' });
      near.observe(palco);
    } else load();
    const stage = palco.querySelector('.stage');
    const mv = document.getElementById('burger3d');
    const take = () => {
      if (mvTaken) return;
      mvTaken = true;
      mv.removeAttribute('auto-rotate');
      stage.classList.add('touched', 'turned');
    };
    ['pointerdown', 'touchstart'].forEach((t) => mv.addEventListener(t, take, { passive: true }));
    // Until the visitor grabs the plate, the mouse wheel scrolls the page instead of zooming the 3D.
    mv.addEventListener('wheel', (e) => { if (!mvTaken && !e.ctrlKey) e.stopPropagation(); }, { capture: true, passive: true });
  }

  // Cenas 2 e 3: the screen holds while the numbers climb and the chat plays. Without GSAP, everything shows.
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  if (gsap && ST) {
    gsap.registerPlugin(ST);
    const small = window.matchMedia('(max-width: 860px)').matches;

    // Cena 1: the scroll turns the plate from its side to the front (only until the visitor takes over).
    if (palco) {
      const mv = document.getElementById('burger3d');
      const stage = palco.querySelector('.stage');
      const turn = { theta: 110, phi: 78 };
      ST.create({
        trigger: palco,
        start: 'top 85%',
        end: small ? 'center 55%' : 'center center',
        scrub: 0.6,
        onUpdate: (self) => {
          if (mvTaken) return;
          const p = self.progress;
          turn.theta = 110 - 90 * p;
          turn.phi = 78 - 16 * p;
          mv.setAttribute('camera-orbit', `${turn.theta.toFixed(1)}deg ${turn.phi.toFixed(1)}deg 0.62m`);
          stage.classList.toggle('turned', p > 0.95);
          if (p > 0.95) mv.setAttribute('auto-rotate', ''); else mv.removeAttribute('auto-rotate');
        },
      });
    }

    // Cena 2: pinned; the grey bar climbs to 18%, then the blue one to 41%.
    const sob = document.getElementById('pesquisa-3d');
    if (sob) {
      const bars = sob.querySelectorAll('.race-track i');
      const nums = sob.querySelectorAll('.race-row b');
      const src = sob.querySelector('.scene-src');
      const counter = (el) => ({ v: 0, el, to: Number(el.dataset.to) });
      const c = [counter(nums[0]), counter(nums[1])];
      const show = (x) => () => { x.el.textContent = `${Math.round(x.v)}%`; };
      gsap.set(bars, { scaleX: 0, transformOrigin: 'left center' });
      gsap.set(src, { autoAlpha: 0, y: 12 });
      c.forEach((x) => show(x)());
      const tl = gsap.timeline({ scrollTrigger: { trigger: sob, start: 'top top', end: small ? '+=100%' : '+=140%', pin: true, scrub: 0.8 } });
      tl.from(sob.querySelector('.scene-title'), { y: 40, autoAlpha: 0, duration: 0.6 })
        .to(bars[0], { scaleX: 1, duration: 1, ease: 'power2.out' }, '+=0.1')
        .to(c[0], { v: c[0].to, duration: 1, ease: 'power2.out', onUpdate: show(c[0]) }, '<')
        .to(bars[1], { scaleX: 1, duration: 1.4, ease: 'power2.out' }, '+=0.15')
        .to(c[1], { v: c[1].to, duration: 1.4, ease: 'power2.out', onUpdate: show(c[1]) }, '<')
        .to(src, { autoAlpha: 1, y: 0, duration: 0.5 })
        .to({}, { duration: 0.4 });
    }

    // Cena 3: pinned; the question arrives, "digitando…", the answer, the choice, the booking, then the 7x.
    const zap = document.getElementById('whatsapp');
    if (zap) {
      const msgs = zap.querySelectorAll('.zm:not(.typing)');
      const typing = zap.querySelector('.zm.typing');
      const seven = zap.querySelector('.seven');
      const sevenB = seven.querySelector('b');
      const after = zap.querySelectorAll('.zap-src');
      zap.classList.add('live');
      gsap.set(msgs, { autoAlpha: 0, y: 16, scale: 0.96, transformOrigin: 'bottom center' });
      gsap.set(typing, { autoAlpha: 0, display: 'none' });
      gsap.set(seven, { autoAlpha: 0 });
      gsap.set(sevenB, { scale: 0.4, transformOrigin: 'left center' });
      gsap.set(after, { autoAlpha: 0 });
      const pop = { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.6)' };
      const tl = gsap.timeline({ scrollTrigger: { trigger: zap, start: 'top top', end: small ? '+=130%' : '+=180%', pin: true, scrub: 0.8 } });
      tl.from(zap.querySelector('.scene-title'), { y: 40, autoAlpha: 0, duration: 0.5 })
        .to(msgs[0], pop)
        .to(typing, { autoAlpha: 1, display: 'flex', duration: 0.3 }, '+=0.2')
        .to(typing, { autoAlpha: 0, display: 'none', duration: 0.2 }, '+=0.5')
        .to(msgs[1], pop, '<')
        .to(msgs[2], pop, '+=0.35')
        .to(msgs[3], pop, '+=0.35')
        .to(seven, { autoAlpha: 1, duration: 0.3 }, '+=0.3')
        .to(sevenB, { scale: 1, duration: 0.8, ease: 'back.out(1.4)' }, '<')
        .to(after, { autoAlpha: 1, duration: 0.4 })
        .to({}, { duration: 0.4 });
    }

    // The 3D viewer and fonts change heights after load: keep the pins measured right.
    window.addEventListener('load', () => ST.refresh());
  }

  // Phone mask: (11) 90000-0000
  const phone = document.getElementById('f-zap');
  // The English page has no form: everything below is the diagnosis form.
  if (!phone) return;
  phone.addEventListener('input', () => {
    const d = phone.value.replace(/\D/g, '').slice(0, 11);
    phone.value =
      d.length <= 2 ? d : d.length <= 6 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d.length <= 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  });

  const form = document.getElementById('form-diagnostico');
  const msg = document.getElementById('form-msg');
  const ok = document.getElementById('form-ok');
  const button = form.querySelector('button[type=submit]');
  const steps = Array.from(form.querySelectorAll('.wstep'));
  const count = document.getElementById('step-count');
  const bar = form.querySelector('.progress i');
  const other = form.querySelector('.other');
  const otherInput = document.getElementById('f-ramo');
  const picked = (name) => Array.from(form.querySelectorAll(`input[name=${name}]:checked`), (i) => i.value);

  const fail = (text, field) => {
    msg.textContent = text;
    msg.className = 'form-msg bad';
    msg.hidden = false;
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    }
    return false;
  };
  const clear = () => { msg.hidden = true; };

  // One step at a time (only with JS: without it, the whole form shows at once).
  let current = 0;
  const go = (n) => {
    current = n;
    steps.forEach((st, i) => (st.hidden = i !== n));
    count.textContent = `Passo ${n + 1} de ${steps.length}`;
    bar.style.transform = `scaleX(${(n + 1) / steps.length})`;
    clear();
  };
  form.classList.add('steps-on');
  go(0);

  // "O que mais atrapalha": up to 3.
  form.querySelectorAll('input[name=dor]').forEach((box) =>
    box.addEventListener('change', () => {
      if (box.checked && picked('dor').length > 3) {
        box.checked = false;
        fail('Marque até 3: as que mais pesam hoje.');
      } else clear();
    }),
  );
  form.querySelectorAll('input[name=ramo]').forEach((r) =>
    r.addEventListener('change', () => {
      other.hidden = r.value !== 'Outro' || !r.checked;
      if (!other.hidden) otherInput.focus();
    }),
  );

  const valid = (n) => {
    if (n === 0 && !picked('dor').length) return fail('Marque pelo menos uma coisa que atrapalha hoje.', form.querySelector('input[name=dor]'));
    if (n === 1) {
      const ramo = picked('ramo')[0];
      if (!ramo) return fail('Escolha o ramo do negócio.', form.querySelector('input[name=ramo]'));
      if (ramo === 'Outro' && otherInput.value.trim().length < 2) return fail('Conte qual é o ramo.', otherInput);
    }
    return true;
  };
  const toForm = () => form.getBoundingClientRect().top < 80 && form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  form.querySelectorAll('[data-next]').forEach((b) =>
    b.addEventListener('click', () => {
      if (!valid(current)) return;
      go(current + 1);
      toForm();
      steps[current].querySelector('input:not([type=hidden])')?.focus({ preventScroll: true });
    }),
  );
  form.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => { go(current - 1); toForm(); }));

  // The answers travel as plain lines in the free-text field the panel already keeps (1000 characters).
  const segment = () => {
    const r = picked('ramo')[0] || '';
    return (r === 'Outro' ? otherInput.value.trim() : r.replace(/ \(.*\)$/, '')).slice(0, 60);
  };
  const answers = (f) =>
    [
      ['Maior dor', picked('dor').join('; ')],
      ['Ramo', picked('ramo')[0] === 'Outro' ? otherInput.value.trim() : picked('ramo')[0]],
      ['Atendimentos por dia', picked('volume').join('')],
      ['Quem responde o WhatsApp', picked('quem').join('')],
      ['Mais', f.wishes.value.trim()],
    ]
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')
      .slice(0, 1000);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const f = form.elements;
    const digits = f.whatsapp.value.replace(/\D/g, '');
    if (!valid(0)) return go(0);
    if (!valid(1)) return go(1);
    if (f.business.value.trim().length < 2) return fail('Informe o nome do negócio.', f.business);
    if (digits.length < 10) return fail('Informe um WhatsApp com DDD.', f.whatsapp);
    if (!f.consent.checked) return fail('Marque a autorização para podermos mandar o plano no WhatsApp.', f.consent);

    clear();
    button.disabled = true;
    button.textContent = 'Enviando…';
    try {
      const res = await fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: f.business.value,
          segment: segment(),
          city: '',
          whatsapp: digits,
          presence: f.presence.value,
          wishes: answers(f),
          consent: f.consent.checked,
          website: f.website.value,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Não foi possível enviar agora. Tente de novo em instantes.');
      form.hidden = true;
      ok.hidden = false;
      ok.focus();
    } catch (err) {
      const offline = err instanceof TypeError || (err && err.name === 'TimeoutError');
      fail(offline ? 'Sem conexão. Confira a internet e tente de novo.' : err.message);
      button.disabled = false;
      button.textContent = 'Receber meu plano grátis';
    }
  });
})();

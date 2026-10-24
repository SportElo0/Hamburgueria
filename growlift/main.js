// Growlift: header state, scroll reveals and the free-diagnosis form.
(() => {
  const top = document.getElementById('topo');
  const onScroll = () => top.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  document.getElementById('ano').textContent = String(new Date().getFullYear());

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
  const lift = document.getElementById('subida');
  if (lift) {
    const canvas = lift.querySelector('.lift-canvas');
    const ctx = canvas.getContext('2d');
    const steps = lift.querySelectorAll('.lift-steps li');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const FRAMES = 72;
    const set = window.innerWidth / window.innerHeight < 1 ? 'm' : 'd';
    const frames = new Array(FRAMES);
    let current = -1;
    let started = false;

    const draw = (i) => {
      // Nearest frame already loaded, so a fast scroll never shows a blank canvas.
      const ready = (k) => k >= 0 && k < FRAMES && frames[k] && frames[k].naturalWidth;
      let k = -1;
      for (let d = 0; d < FRAMES && k < 0; d++) k = ready(i - d) ? i - d : ready(i + d) ? i + d : -1;
      if (k < 0) return;
      const img = frames[k];
      const w = canvas.width;
      const h = canvas.height;
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      if (current >= 0) draw(current);
    };
    const progress = () => {
      const r = lift.getBoundingClientRect();
      const run = lift.offsetHeight - window.innerHeight;
      return run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 1;
    };
    const update = () => {
      const p = reduced ? 1 : progress();
      const i = Math.round(p * (FRAMES - 1));
      if (i !== current) {
        current = i;
        draw(i);
      }
      if (!reduced) steps.forEach((li, n) => li.classList.toggle('on', p >= [0, 0.36, 0.68][n]));
    };
    const load = (i) =>
      new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = img.onerror = () => {
          frames[i] = img;
          if (Math.abs(i - current) <= 4) draw(current);
          resolve();
        };
        img.src = `img/lift/${set}/${String(i).padStart(2, '0')}.webp`;
      });
    const start = async () => {
      if (started) return;
      started = true;
      if (reduced) return load(FRAMES - 1).then(update);
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
    update();
  }

  // Phone mask: (11) 90000-0000
  const phone = document.getElementById('f-zap');
  phone.addEventListener('input', () => {
    const d = phone.value.replace(/\D/g, '').slice(0, 11);
    phone.value =
      d.length <= 2 ? d : d.length <= 6 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d.length <= 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  });

  const form = document.getElementById('form-diagnostico');
  const msg = document.getElementById('form-msg');
  const ok = document.getElementById('form-ok');
  const button = form.querySelector('button[type=submit]');

  const fail = (text, field) => {
    msg.textContent = text;
    msg.className = 'form-msg bad';
    msg.hidden = false;
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const f = form.elements;
    const digits = f.whatsapp.value.replace(/\D/g, '');
    if (f.business.value.trim().length < 2) return fail('Informe o nome do negócio.', f.business);
    if (f.segment.value.trim().length < 2) return fail('Informe o ramo do negócio.', f.segment);
    if (digits.length < 10) return fail('Informe um WhatsApp com DDD.', f.whatsapp);
    if (!f.consent.checked) return fail('Marque a autorização para podermos mandar o diagnóstico no WhatsApp.', f.consent);

    msg.hidden = true;
    button.disabled = true;
    button.textContent = 'Enviando…';
    try {
      const res = await fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: f.business.value,
          segment: f.segment.value,
          city: f.city.value,
          whatsapp: digits,
          presence: f.presence.value,
          wishes: f.wishes.value,
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
      button.textContent = 'Quero meu diagnóstico';
    }
  });
})();

// Growlift, visual novo: a parte "O que a Growlift faz" (marca em 3D que se monta com a rolagem) e o formulário
// do diagnóstico grátis. Usado por index.html e pelas páginas dos ramos (tools/growlift-site.py).
(() => {
  const ano = document.getElementById('ano');
  if (ano) ano.textContent = String(new Date().getFullYear());
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // O que a Growlift faz: a tela fica parada, a marca se monta (quadros de tools/growlift-scene em img/lift) e
  // uma frase por vez aparece. Sem JS ou com movimento reduzido, vira uma lista comum (classe .static).
  const faz = document.getElementById('o-que-faz');
  if (faz && !reduce) {
    const canvas = faz.querySelector('.faz-canvas');
    const ctx = canvas.getContext('2d');
    const items = Array.from(faz.querySelectorAll('.faz-steps > li'));
    const bars = Array.from(faz.querySelectorAll('.faz-track i'));
    const FRAMES = 96;
    const set = window.innerWidth / window.innerHeight < 1 ? 'm' : 'd';
    const frames = new Array(FRAMES);
    let target = 0;
    let shown = 0;
    let raf = 0;
    let started = false;
    let active = -1;
    faz.classList.remove('static');

    const ready = (k) => k >= 0 && k < FRAMES && frames[k] && frames[k].naturalWidth;
    const paint = (img, alpha) => {
      const w = canvas.width;
      const h = canvas.height;
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      // No computador a marca fica à direita do texto.
      const dx = set === 'd' ? (w - dw) / 2 + w * 0.12 : (w - dw) / 2;
      const dy = set === 'm' ? (h - dh) / 2 - h * 0.16 : (h - dh) / 2;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.globalAlpha = 1;
    };
    const render = (p) => {
      const f = p * (FRAMES - 1);
      const i = Math.floor(f);
      let k = -1;
      for (let d = 0; d < FRAMES && k < 0; d++) k = ready(i - d) ? i - d : ready(i + d) ? i + d : -1;
      if (k < 0) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
      const r = faz.getBoundingClientRect();
      const run = faz.offsetHeight - window.innerHeight;
      return run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 1;
    };
    const update = () => {
      target = progress();
      if (!raf) raf = requestAnimationFrame(tick);
      const n = Math.min(items.length - 1, Math.floor(target * items.length));
      if (n !== active) {
        active = n;
        items.forEach((li, i) => {
          li.classList.toggle('on', i === n);
          li.setAttribute('aria-hidden', i === n ? 'false' : 'true');
        });
        bars.forEach((b, i) => b.classList.toggle('on', i <= n));
        faz.classList.toggle('last', n === items.length - 1);
      }
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
      const order = [];
      for (const step of [8, 4, 2, 1]) for (let i = 0; i < FRAMES; i += step) if (!order.includes(i)) order.push(i);
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
      near.observe(faz);
    } else start();
    shown = target = progress();
    update();
  }

  // Formulário do diagnóstico (mesmo envio do site anterior: painel + sistema, sem mensagem automática).
  const phone = document.getElementById('f-zap');
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
  const capa = document.body.dataset.ramoNome || '';

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

  form.querySelectorAll('input[name=dor]').forEach((box) =>
    box.addEventListener('change', () => {
      if (box.checked && picked('dor').length > 3) {
        box.checked = false;
        fail('Marque até 3: as que mais pesam hoje.');
      } else clear();
    }),
  );
  form.addEventListener('change', (e) => {
    const r = e.target;
    if (r.name !== 'ramo') return;
    other.hidden = r.value !== 'Outro' || !r.checked;
    if (!other.hidden) otherInput.focus();
  });

  const valid = (n) => {
    if (n === 0 && !picked('dor').length) return fail('Marque pelo menos uma coisa que atrapalha hoje.', form.querySelector('input[name=dor]'));
    if (n === 1) {
      const ramo = picked('ramo')[0];
      if (!ramo) return fail('Escolha o ramo do negócio.', form.querySelector('input[name=ramo]'));
      if (ramo === 'Outro' && otherInput.value.trim().length < 2) return fail('Conte qual é o ramo.', otherInput);
    }
    return true;
  };
  const toForm = () => form.getBoundingClientRect().top < 80 && form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  form.querySelectorAll('[data-next]').forEach((b) =>
    b.addEventListener('click', () => {
      if (!valid(current)) return;
      go(current + 1);
      toForm();
      steps[current].querySelector('input:not([type=hidden])')?.focus({ preventScroll: true });
    }),
  );
  form.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => { go(current - 1); toForm(); }));

  const segment = () => {
    const r = picked('ramo')[0] || '';
    const own = r === 'Outro' ? otherInput.value.trim() : r.replace(/ \(.*\)$/, '');
    return (capa && own ? `${capa}: ${own}` : own).slice(0, 60);
  };
  const answers = (f) =>
    [
      ['Maior dor', picked('dor').join('; ')],
      ['Ramo', segment()],
      [document.getElementById('q-volume').textContent.replace(/, mais ou menos$/, ''), picked('volume').join('')],
      ['Quem responde o WhatsApp', picked('quem').join('')],
      ['Mais', f.wishes.value.trim()],
    ]
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')
      .slice(0, 1000);

  const idem = `site-${window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)}`;
  const campaign = () => {
    const p = new URLSearchParams(location.search);
    return Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].filter((k) => p.get(k)).map((k) => [k, p.get(k).slice(0, 120)]));
  };
  const post = (url, body) =>
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) }).then(async (res) => {
      const b = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(b.error || b.erro || 'Não foi possível enviar agora. Tente de novo em instantes.');
      return b;
    });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const f = form.elements;
    const digits = f.whatsapp.value.replace(/\D/g, '');
    if (!valid(0)) return go(0);
    if (!valid(1)) return go(1);
    if (f.business.value.trim().length < 2) return fail('Informe o nome do negócio.', f.business);
    if (digits.length < 10) return fail('Informe um WhatsApp com DDD.', f.whatsapp);
    if (f.city.value.trim().length < 2) return fail('Informe a cidade do negócio.', f.city);
    if (!f.consent.checked) return fail('Marque a autorização para podermos mandar o plano no WhatsApp.', f.consent);

    clear();
    button.disabled = true;
    button.textContent = 'Enviando…';
    const wishes = f.wishes.value.trim();
    // O aceite do site cobre só o diagnóstico e o plano: o sistema não manda mensagem automática
    // (aceite_whatsapp: false); o Lucas ou o Antônio respondem à mão.
    const sent = await Promise.allSettled([
      post(form.dataset.endpoint, {
        business: f.business.value,
        segment: segment(),
        city: f.city.value.trim(),
        whatsapp: digits,
        presence: f.presence.value,
        wishes: answers(f),
        consent: f.consent.checked,
        website: f.website.value,
      }),
      post(form.dataset.sistema, {
        chave: form.dataset.chave,
        nome: f.business.value.trim(),
        telefone: digits,
        cidade: f.city.value.trim(),
        necessidade: `Pediu o diagnóstico grátis pelo site${capa ? ` (página ${capa})` : ''}.${wishes ? `\nMais: ${wishes}` : ''}`.slice(0, 1000),
        preferencia_contato: 'WhatsApp',
        aceite_whatsapp: false,
        chave_idempotencia: idem,
        extras: {
          ramo: segment(),
          dor: picked('dor').join('; ').slice(0, 200),
          volume: picked('volume').join(''),
          quem_responde: picked('quem').join(''),
          presenca: f.presence.value.trim().slice(0, 200),
        },
        campanha: campaign(),
        site_url: f.website.value,
      }),
    ]);
    if (sent.some((r) => r.status === 'fulfilled')) {
      form.hidden = true;
      ok.hidden = false;
      ok.focus();
      return;
    }
    const err = sent[0].reason;
    const offline = err instanceof TypeError || (err && err.name === 'TimeoutError');
    fail(offline ? 'Sem conexão. Confira a internet e tente de novo.' : err.message);
    button.disabled = false;
    button.textContent = 'Receber meu plano grátis';
  });
})();

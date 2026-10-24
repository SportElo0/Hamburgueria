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

/*
 * Lumivale Energia Solar · projeto conceito da Growlift (empresa fictícia).
 *
 * ONDE TROCAR
 * - Nome da empresa: CONFIG.empresa (abaixo) e, no index.html, o <title>, o logo e o rodapé.
 * - WhatsApp: CONFIG.whatsapp (só números: 55 + DDD + número).
 * - Cores: styles.css, bloco :root (--navy, --blue-1, --blue-2, --sun...).
 * - Textos: index.html; cada seção começa com um comentário numerado (1. CAPA, 2. FAIXA...).
 * - Fotos: pasta img/. Troque o arquivo mantendo o nome, ou mude o src do <img> no index.html.
 * - Ilha da capa: img/ilha.webp (PNG/WebP com fundo transparente). Ela também é a máscara do reflexo de luz (styles.css, .island-glint).
 */
const CONFIG = {
  empresa: 'Lumivale Energia Solar',
  whatsapp: '5511900000000', // número fictício
};

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = Boolean(window.gsap && window.ScrollTrigger);
  const brl = (v) => v.toLocaleString('pt-BR');

  /* ---------- Links do WhatsApp ---------- */
  const waLink = (msg) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  $$('[data-wa]').forEach((a) => {
    a.href = waLink(`Olá! Vim pelo site da ${CONFIG.empresa} e quero um orçamento.`);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ---------- Menu do celular ---------- */
  const toggle = $('.menu-toggle');
  const menu = $('#menu-mobile');
  const closeMenu = () => {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
  };
  toggle?.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Título final: cada letra num span, para acender ao rolar ---------- */
  function splitChars(el) {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    const chars = [];
    text.split(' ').forEach((word, i, arr) => {
      const w = document.createElement('span');
      w.style.display = 'inline-block';
      w.style.whiteSpace = 'nowrap';
      w.setAttribute('aria-hidden', 'true');
      for (const c of word) {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        w.appendChild(s);
        chars.push(s);
      }
      el.appendChild(w);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return chars;
  }

  /* ---------- Sanfonas (serviços e dúvidas): button + aria-expanded ---------- */
  const servImgs = $$('.services-media img');
  let servActive = 0;
  function showServiceImage(i) {
    if (i === servActive || !servImgs[i]) return;
    const next = servImgs[i];
    const prev = servImgs[servActive];
    servActive = i;
    servImgs.forEach((im) => { im.style.zIndex = '0'; });
    prev.style.zIndex = '1';
    next.style.zIndex = '2';
    if (hasGsap && !reduce) {
      // Revela a foto de baixo para cima com um leve zoom
      gsap.fromTo(next, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.15 }, {
        clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.9, ease: 'power4.inOut',
        onComplete: () => { prev.classList.remove('is-active'); },
      });
      next.classList.add('is-active');
    } else {
      prev.classList.remove('is-active');
      next.classList.add('is-active');
    }
  }
  function setPanel(item, open) {
    const btn = $('button', item);
    const panel = $('.acc-panel', item);
    btn.setAttribute('aria-expanded', String(open));
    item.classList.toggle('is-open', open);
    if (!hasGsap || reduce) { panel.hidden = !open; return; }
    gsap.killTweensOf(panel);
    if (open) {
      panel.hidden = false;
      gsap.fromTo(panel, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.45, ease: 'power3.out', clearProps: 'height', onComplete: () => window.ScrollTrigger?.refresh() });
    } else {
      gsap.to(panel, { height: 0, opacity: 0, duration: 0.35, ease: 'power3.inOut', onComplete: () => { panel.hidden = true; gsap.set(panel, { clearProps: 'height,opacity' }); window.ScrollTrigger?.refresh(); } });
    }
  }
  $$('.acc').forEach((acc) => {
    const items = $$('.acc-item', acc);
    items.forEach((item) => {
      $('button', item).addEventListener('click', (e) => {
        const isOpen = item.classList.contains('is-open');
        if (acc.dataset.acc === 'servicos' && isOpen) return; // sempre um serviço aberto
        items.forEach((other) => { if (other !== item && other.classList.contains('is-open')) setPanel(other, false); });
        setPanel(item, !isOpen);
        const img = e.currentTarget.dataset.img;
        if (img !== undefined) showServiceImage(Number(img));
      });
    });
  });

  /* ---------- Depoimentos: setas e arrastar ---------- */
  const qTrack = $('.quotes-track');
  if (qTrack) {
    $$('.quotes-arrows .arrow').forEach((b) => b.addEventListener('click', () => {
      const card = $('.quote', qTrack);
      const step = card ? card.getBoundingClientRect().width + 22 : 400;
      qTrack.scrollBy({ left: Number(b.dataset.dir) * step, behavior: reduce ? 'auto' : 'smooth' });
    }));
    if (window.matchMedia('(pointer: fine)').matches) {
      let down = false; let startX = 0; let startLeft = 0; let moved = false;
      qTrack.addEventListener('pointerdown', (e) => { down = true; moved = false; startX = e.clientX; startLeft = qTrack.scrollLeft; });
      window.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 4) { moved = true; qTrack.classList.add('is-dragging'); }
        qTrack.scrollLeft = startLeft - dx;
      });
      window.addEventListener('pointerup', () => {
        if (!down) return;
        down = false;
        qTrack.classList.remove('is-dragging');
        if (moved) qTrack.scrollBy({ left: 1, behavior: 'smooth' }); // devolve o encaixe
      });
    }
  }

  /* ---------- Orçamento: controle de valor, ilustração e WhatsApp ---------- */
  const form = $('#form-orcamento');
  const range = $('#f-conta');
  const out = $('#f-conta-out');
  const bill = $('.bill');
  const sunGrow = $('.sun-grow');
  const shown = { v: Number(range.value) };
  function paintRange(animate) {
    const v = Number(range.value);
    const t = (v - Number(range.min)) / (Number(range.max) - Number(range.min));
    range.style.setProperty('--p', `${t * 100}%`);
    // Só ilustração: a conta encolhe e o sol cresce (não é cálculo de economia)
    const billScale = 1 - t * 0.45;
    const sunScale = 0.5 + t * 0.9;
    if (hasGsap && animate && !reduce) {
      gsap.to(shown, { v, duration: 0.35, ease: 'power2.out', overwrite: true, onUpdate: () => { out.textContent = `R$ ${brl(Math.round(shown.v / 10) * 10)}`; } });
      gsap.to(bill, { scale: billScale, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      gsap.to(sunGrow, { scale: sunScale, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
    } else {
      shown.v = v;
      out.textContent = `R$ ${brl(v)}`;
      bill.style.transform = `scale(${billScale})`;
      sunGrow.style.transform = `scale(${sunScale})`;
    }
  }
  range.addEventListener('input', () => paintRange(true));
  paintRange(false);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = [['#f-local', '#f-local-erro'], ['#f-nome', '#f-nome-erro']];
    let firstBad = null;
    fields.forEach(([inp, err]) => {
      const el = $(inp);
      const bad = !el.value.trim();
      el.setAttribute('aria-invalid', String(bad));
      if (bad) el.setAttribute('aria-describedby', err.slice(1)); else el.removeAttribute('aria-describedby');
      $(err).hidden = !bad;
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) { firstBad.focus(); return; }
    const valor = brl(Number(range.value));
    const local = $('#f-local').value.trim();
    const tipo = (form.querySelector('input[name=tipo]:checked')?.value || 'Casa').toLowerCase();
    const nome = $('#f-nome').value.trim();
    const msg = `Olá! Pago cerca de R$ ${valor} de luz, moro em ${local}, imóvel tipo ${tipo}. Meu nome é ${nome}. Quero um orçamento.`;
    window.open(waLink(msg), '_blank', 'noopener');
  });

  /* ---------- Botão flutuante do WhatsApp: aparece depois da capa, some sobre o formulário ---------- */
  const wa = $('.wa-float');
  if (wa && 'IntersectionObserver' in window) {
    let heroVisible = true; let formVisible = false;
    const sync = () => wa.classList.toggle('is-visible', !heroVisible && !formVisible);
    new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; sync(); }, { threshold: 0.15 }).observe($('.hero'));
    new IntersectionObserver(([en]) => { formVisible = en.isIntersecting; sync(); }, { threshold: 0.1 }).observe($('#orcamento'));
  }

  /* ---------- Topo: o menu encolhe e ganha mais desfoque depois de rolar ---------- */
  const top = $('.top');
  const onScroll = () => top.classList.toggle('is-scrolled', window.scrollY > 80);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Daqui para baixo: animações (precisa do GSAP) ---------- */
  const preloader = $('.preloader');
  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

  // Rolagem suave (Lenis) sincronizada com o ScrollTrigger
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Links internos (#secao) passam pela rolagem suave
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    history.replaceState(null, '', id);
  }));


  const finalChars = splitChars($('.final-title'));

  // Faixa de confiança: duplica a lista para a fita rodar sem emenda
  const marquee = $('.marquee');
  if (!reduce) {
    const clone = $('.marquee-track', marquee).cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    marquee.appendChild(clone);
  }

  /* 0. Pré-carregamento e entrada da capa: feitos em CSS (styles.css), para aparecer antes do JavaScript carregar. */
  preloader?.addEventListener('animationend', (e) => { if (e.animationName === 'pre-hide') preloader.remove(); });

  if (reduce) return; // movimento reduzido: sem rolagem suave, sem pin, conteúdo parado e visível

  // Ilha "boiando" (contínuo) e reflexo de luz passando de tempos em tempos
  gsap.fromTo('.island-float', { y: 8 }, { y: -8, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.fromTo('.island-glint', { backgroundPosition: '140% 0' }, { backgroundPosition: '-40% 0', duration: 1.6, ease: 'power2.inOut', repeat: -1, repeatDelay: 3.6, delay: 2 });

  // Partículas de luz subindo devagar
  const particles = $('.particles');
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('span');
    p.style.left = `${gsap.utils.random(5, 95)}%`;
    p.style.top = `${gsap.utils.random(10, 90)}%`;
    particles.appendChild(p);
    gsap.fromTo(p, { y: 0, opacity: 0, scale: gsap.utils.random(0.5, 1.4) }, {
      y: gsap.utils.random(-120, -40), opacity: gsap.utils.random(0.4, 0.9), duration: gsap.utils.random(3, 6),
      ease: 'sine.inOut', repeat: -1, yoyo: true, delay: gsap.utils.random(0, 3),
    });
  }

  // Fita da faixa de confiança, que acelera com a velocidade da rolagem
  const loop = gsap.to(marquee, { xPercent: -50, ease: 'none', duration: 32, repeat: -1 });
  ScrollTrigger.create({
    trigger: '.trust', start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => {
      const boost = Math.min(Math.abs(self.getVelocity()) / 350, 4);
      gsap.to(loop, { timeScale: 1 + boost, duration: 0.25, overwrite: true, onComplete: () => gsap.to(loop, { timeScale: 1, duration: 1.2 }) });
    },
  });

  // Contadores (0 → valor) com a etiqueta "exemplo" ao lado
  $$('.count').forEach((el) => {
    const to = Number(el.dataset.to);
    const dec = Number(el.dataset.dec || 0);
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = o.v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }); } }),
    });
    el.textContent = (0).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  });

  // Chamada final: o título acende letra por letra conforme a rolagem
  gsap.fromTo(finalChars, { opacity: 0.12 }, {
    opacity: 1, ease: 'none', stagger: 0.05,
    scrollTrigger: { trigger: '.final', start: 'top 75%', end: 'center 45%', scrub: true },
  });

  // Entradas leves dos títulos e cartões
  const rise = (targets, trigger, extra = {}) => gsap.from(targets, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger, start: 'top 82%' }, ...extra });

  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 769px)', mobile: '(max-width: 768px)' }, (ctx) => {
    const { desktop } = ctx.conditions;

    /* ---------- 1. Capa ao rolar: a ilha gira, aproxima e sobe; o céu escurece e o semicírculo vira sol ---------- */
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } })
      .to('.island', { rotation: desktop ? 7 : 4, scale: 1.25, yPercent: desktop ? -22 : -12, ease: 'none' }, 0)
      .to('.hero-arc-sun', { opacity: 1, ease: 'none' }, 0)
      .to('.hero-arc', { yPercent: desktop ? -18 : -8, scale: 1.08, ease: 'none' }, 0)
      .to('.hero-night', { opacity: 1, ease: 'none' }, 0.15)
      .to('.hero-copy', { yPercent: desktop ? -30 : -12, opacity: 0, ease: 'none' }, 0)
      .to('.hero-stat', { yPercent: -80, ease: 'none' }, 0);

    if (desktop) {
      /* ---------- 3. Por que solar: seção presa, cartões entram empilhados como baralho ---------- */
      const cards = $$('.why-card');
      gsap.set(cards[0], { rotation: -2 });
      gsap.set(cards.slice(1), { yPercent: 118, rotation: (i) => (i % 2 ? -6 : 6) });
      const why = gsap.timeline({ scrollTrigger: { trigger: '.why', start: 'top top', end: `+=${cards.length * 85}%`, pin: '.why-pin', scrub: 1, anticipatePin: 1 } });
      cards.forEach((card, i) => {
        if (i === 0) return;
        why.to(card, { yPercent: 0, rotation: i % 2 ? 2 : -1, ease: 'power2.out', duration: 1 }, i - 1)
          .to(cards[i - 1], { scale: 0.92, y: -28, rotation: i % 2 ? -4 : 3, ease: 'power1.inOut', duration: 1 }, i - 1);
      });
      cards.forEach((card) => why.fromTo($('.why-media', card), { yPercent: -7 }, { yPercent: 7, ease: 'none', duration: cards.length - 1 }, 0));
      rise('.why-head > *', '.why', { scrollTrigger: { trigger: '.why', start: 'top 70%' } });

      /* ---------- 4. Como funciona: trilha horizontal; o sol cruza o arco e o céu vai do amanhecer ao meio-dia ---------- */
      const track = $('.how-track');
      const howDist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.timeline({ scrollTrigger: { trigger: '.how', start: 'top top', end: () => `+=${howDist() + window.innerHeight * 0.6}`, pin: '.how-pin', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } })
        .to(track, { x: () => -howDist(), ease: 'none' }, 0)
        .to('.how-sky', { opacity: 1, ease: 'none' }, 0)
        .to('.how-progress span', { scaleX: 1, ease: 'none' }, 0)
        .to('.how-sun', { motionPath: { path: '#sun-path', align: '#sun-path', alignOrigin: [0.5, 0.5] }, ease: 'none' }, 0);

      /* ---------- 6. Obras: galeria horizontal presa, com parallax nas fotos ---------- */
      const wTrack = $('.works-track');
      const wDist = () => Math.max(0, wTrack.scrollWidth - window.innerWidth);
      const horizontal = gsap.to(wTrack, { x: () => -wDist(), ease: 'none', scrollTrigger: { trigger: '.works', start: 'top top', end: () => `+=${wDist()}`, pin: '.works-pin', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
      $$('.work-img img').forEach((img) => gsap.fromTo(img, { xPercent: -7 }, { xPercent: 7, ease: 'none', scrollTrigger: { trigger: img.closest('.work'), containerAnimation: horizontal, start: 'left right', end: 'right left', scrub: true } }));

      // Cursor "Arraste" e arrastar para avançar a galeria (só com mouse)
      if (window.matchMedia('(pointer: fine)').matches) {
        const cursor = $('.drag-cursor');
        const vp = $('.works-viewport');
        const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
        const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
        let dragging = false; let lastX = 0;
        const move = (e) => {
          cx(e.clientX); cy(e.clientY);
          if (!dragging) return;
          const dx = e.clientX - lastX;
          lastX = e.clientX;
          const y = (lenis ? lenis.scroll : window.scrollY) - dx * 1.4;
          if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
        };
        const enter = () => gsap.to(cursor, { opacity: 1, scale: 1, duration: 0.3 });
        const leave = () => { dragging = false; gsap.to(cursor, { opacity: 0, scale: 0.4, duration: 0.3 }); };
        const down = (e) => { dragging = true; lastX = e.clientX; gsap.to(cursor, { scale: 0.8, duration: 0.2 }); e.preventDefault(); };
        const up = () => { dragging = false; gsap.to(cursor, { scale: 1, duration: 0.2 }); };
        vp.addEventListener('pointerenter', enter);
        vp.addEventListener('pointerleave', leave);
        vp.addEventListener('pointerdown', down);
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        vp.addEventListener('dragstart', (e) => e.preventDefault());
        vp.style.cursor = 'none';
        return () => {
          vp.removeEventListener('pointerenter', enter); vp.removeEventListener('pointerleave', leave); vp.removeEventListener('pointerdown', down);
          window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); vp.style.cursor = '';
        };
      }
    } else {
      /* ---------- Celular: sem pin pesado, só entradas leves ---------- */
      $$('.why-card').forEach((c) => gsap.from(c, { y: 60, opacity: 0, rotation: 2, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 88%' } }));
      rise('.why-head > *', '.why-head');
      $$('.how-step').forEach((s) => gsap.from(s, { y: 50, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 88%' } }));
      rise('.how-head > *', '.how-head');
      rise('.work', '.works-viewport', { x: 40, y: 0 });
    }
    return undefined;
  });

  // Títulos e blocos das seções que não ficam presas
  rise('.services .eyebrow, .services .h2', '.services');
  rise('.services-media', '.services-media', { y: 60 });
  rise('.works-head > *', '.works-head');
  rise('.quotes-head > *', '.quotes');
  rise('.quote', '.quotes-track', { x: 60, y: 0 });
  rise('.form-intro > *', '.quote-form');
  rise('.form', '.form', { y: 60 });
  rise('.faq .eyebrow, .faq .h2', '.faq');
  rise('.faq .acc-item', '.faq .acc');

  // Recalcula as posições quando as imagens terminam de carregar
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();

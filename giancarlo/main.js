// Giancarlo Guglielmi · animações de rolagem (GSAP 3.13 + ScrollTrigger + SplitText + Lenis).
// Quem pede menos movimento (prefers-reduced-motion) vê tudo parado e visível; sem JavaScript, idem.
(() => {
  const topo = document.getElementById('topo');
  const marcarTopo = () => topo.classList.toggle('solido', window.scrollY > 60);
  addEventListener('scroll', marcarTopo, { passive: true });
  marcarTopo();

  const { gsap, ScrollTrigger, SplitText } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Rolagem suave, sincronizada com o ScrollTrigger
  let lenis = null;
  if (!reduzir && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const alvo = id.length > 1 && document.querySelector(id);
      if (!alvo) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(alvo, { offset: -72, duration: 1.4 });
      else alvo.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth' });
    }),
  );

  if (reduzir) return;

  const iniciar = () => {
    const mm = gsap.matchMedia();
    const NUM = ['I', 'II', 'III', 'IV', 'V', 'VI'];

    // ---------- Capa: entrada ----------
    const titulo = new SplitText('#titulo', { type: 'lines', mask: 'lines' });
    gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .from('.hero-foto-img', { scale: 1.2, autoAlpha: 0, duration: 2.4, ease: 'power2.out' }, 0)
      .from('.topo', { y: -24, autoAlpha: 0, duration: 0.9 }, 0.15)
      .from('.hero .eyebrow', { y: 18, autoAlpha: 0, duration: 0.8 }, 0.25)
      .from(titulo.lines, { yPercent: 110, duration: 1.15, stagger: 0.12 }, 0.35)
      .from('.fio', { scaleX: 0, duration: 1 }, 0.85)
      .from('.hero .lead', { y: 24, autoAlpha: 0, duration: 0.9 }, 0.95)
      .from('.hero .ctas > *', { y: 18, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 1.1)
      .from('.selo-hero, .selo-mono', { autoAlpha: 0, scale: 0.85, duration: 1.3 }, 1.0)
      .from('.hero-legenda, .rolar', { autoAlpha: 0, duration: 1 }, 1.4);
    gsap.to('.selo-hero', { rotation: 360, duration: 48, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });

    // ---------- Capa: ao rolar ----------
    const capa = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hero-conteudo', { yPercent: -16, autoAlpha: 0.1, ease: 'none', scrollTrigger: capa });
    gsap.to('.hero-foto-img', { scale: 1.14, yPercent: 6, ease: 'none', scrollTrigger: { ...capa } });
    gsap.to('.hero-pilar', { yPercent: -30, ease: 'none', scrollTrigger: { ...capa } });
    gsap.to('.selo-hero, .selo-mono', { y: -120, ease: 'none', scrollTrigger: { ...capa } });
    gsap.to('.rolar', { autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '12% top', scrub: true } });

    // ---------- Pilares: a coluna se monta ----------
    const itens = gsap.utils.toArray('.principios li');
    const num = document.getElementById('num-pilar');
    const montar = (tl, comItens) => {
      const passo = (sel, de, i) => {
        tl.from(sel, { ...de, duration: 1 });
        if (comItens) tl.to(itens[i], { autoAlpha: 1, x: 0, duration: 0.6 }, '<');
      };
      passo('.c-degrau2', { y: 60, autoAlpha: 0 }, 0);
      passo('.c-degrau1', { y: 60, autoAlpha: 0 }, 1);
      passo('.c-base', { y: 50, autoAlpha: 0 }, 2);
      tl.from('.c-fuste rect', { scaleY: 0, transformOrigin: '50% 100%', stagger: 0.12, duration: 1.4 });
      if (comItens) tl.to(itens[3], { autoAlpha: 1, x: 0, duration: 0.6 }, '<');
      passo('.c-capitel', { y: -90, autoAlpha: 0 }, 4);
      passo('.c-abaco', { y: -120, autoAlpha: 0 }, 5);
      return tl;
    };

    mm.add('(min-width: 901px)', () => {
      gsap.set(itens, { autoAlpha: 0.16, x: -12 });
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: '#pilares',
          start: 'top top',
          end: '+=2400',
          pin: true,
          scrub: 0.7,
          onUpdate: (st) => { num.textContent = NUM[Math.min(5, Math.floor(st.progress * 6.2))]; },
        },
      });
      montar(tl, true).to({}, { duration: 0.6 });
    });
    mm.add('(max-width: 900px)', () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, scrollTrigger: { trigger: '.coluna', start: 'top 85%', end: 'bottom 45%', scrub: 0.6 } });
      montar(tl, false);
      itens.forEach((li) => gsap.from(li, { y: 26, autoAlpha: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 88%' } }));
      ScrollTrigger.create({ trigger: '.principios', start: 'top 70%', end: 'bottom 40%', onUpdate: (st) => { num.textContent = NUM[Math.min(5, Math.floor(st.progress * 6))]; } });
    });

    // ---------- Títulos que sobem por linha e textos que aparecem ----------
    document.querySelectorAll('[data-split]').forEach((h) => {
      const s = new SplitText(h, { type: 'lines', mask: 'lines' });
      gsap.from(s.lines, { yPercent: 110, duration: 1.1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
    });
    gsap.utils.toArray('[data-sobe]').forEach((el) =>
      gsap.from(el, { y: 30, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }),
    );
    gsap.utils.toArray('section:not(.hero) .eyebrow').forEach((el) =>
      gsap.from(el, { autoAlpha: 0, letterSpacing: '0.5em', duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }),
    );

    // ---------- Escritório: o retrato se abre ----------
    const retrato = { trigger: '.retrato', start: 'top 85%', end: 'top 25%', scrub: 0.8 };
    gsap.fromTo('.retrato-img', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: retrato });
    gsap.from('.retrato-img .mono', { scale: 1.35, autoAlpha: 0, ease: 'none', scrollTrigger: { ...retrato } });
    gsap.from('.retrato-moldura', { x: -22, y: -22, autoAlpha: 0, ease: 'none', scrollTrigger: { ...retrato } });
    gsap.from('.dados > div', { y: 24, autoAlpha: 0, stagger: 0.12, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.dados', start: 'top 90%' } });

    // ---------- Áreas: rolagem lateral presa (computador) ----------
    mm.add('(min-width: 901px)', () => {
      const trilho = document.querySelector('.areas-trilho');
      const distancia = () => Math.max(0, trilho.scrollWidth - innerWidth);
      const lateral = gsap.to(trilho, {
        x: () => -distancia(),
        ease: 'none',
        scrollTrigger: { trigger: '.areas', start: 'top top', end: () => '+=' + distancia(), pin: true, scrub: 0.8, invalidateOnRefresh: true },
      });
      gsap.to('.areas-barra i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.areas', start: 'top top', end: () => '+=' + distancia(), scrub: true, invalidateOnRefresh: true } });
      gsap.utils.toArray('.area').forEach((card) => {
        gsap.from(card.querySelector('.area-n'), { yPercent: 70, autoAlpha: 0, ease: 'power2.out', scrollTrigger: { trigger: card, containerAnimation: lateral, start: 'left 92%', end: 'left 55%', scrub: true } });
        gsap.from(card, { rotationY: -14, transformPerspective: 900, transformOrigin: '0% 50%', autoAlpha: 0.35, ease: 'power2.out', scrollTrigger: { trigger: card, containerAnimation: lateral, start: 'left 100%', end: 'left 60%', scrub: true } });
      });
    });
    mm.add('(max-width: 900px)', () => {
      gsap.utils.toArray('.area').forEach((card) =>
        gsap.from(card, { y: 40, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 88%' } }),
      );
    });

    // ---------- Atendimento: a linha desenha e as etapas acendem ----------
    gsap.fromTo('.linha i', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.passos-wrap', start: 'top 75%', end: 'bottom 55%', scrub: 0.6 } });
    gsap.utils.toArray('.passo').forEach((p, i) => {
      gsap.from(p.querySelector('.num'), { scale: 0.5, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.passos-wrap', start: `top ${78 - i * 6}%` } });
      gsap.from(p.querySelectorAll('h3, p'), { y: 22, autoAlpha: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.passos-wrap', start: `top ${74 - i * 6}%` } });
    });

    // ---------- Contato: o selo gira com a rolagem ----------
    gsap.fromTo('.selo-ct', { rotation: -60 }, { rotation: 140, ease: 'none', transformOrigin: '50% 50%', scrollTrigger: { trigger: '.contato', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.selo-grande .mono', { scale: 0.6, autoAlpha: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.selo-grande', start: 'top 80%' } });
    gsap.from('.rodape-grid > *', { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.rodape', start: 'top 92%' } });

    ScrollTrigger.refresh();
  };

  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(iniciar);
})();

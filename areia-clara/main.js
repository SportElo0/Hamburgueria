/* Pousada Areia Clara · projeto conceito Growlift (pousada fictícia)
   O que trocar para um cliente real: nome, textos do index.html, fotos em img/, vídeo em video/
   e as respostas da conversa (RESPOSTAS, abaixo). O formulário não envia nada: é demonstração. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const temGsap = typeof window.gsap !== 'undefined';
  if (temGsap) gsap.registerPlugin(ScrollTrigger);

  /* Rolagem suave (Lenis) ligada ao ScrollTrigger */
  let lenis = null;
  if (!reduz && temGsap && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const irPara = (alvo) => {
    const el = typeof alvo === 'string' ? $(alvo) : alvo;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -20, duration: 1.4 });
    else el.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'start' });
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1 && $(id)) { e.preventDefault(); irPara(id); }
  }));

  /* Quebra títulos em palavras para animar (mantém o itálico) */
  function quebrar(el) {
    const tokens = [];
    el.childNodes.forEach((n) => {
      const em = n.nodeType === 1 && n.tagName === 'EM';
      (n.textContent || '').split(/\s+/).filter(Boolean).forEach((w) => tokens.push({ w, em }));
    });
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = tokens.map(({ w, em }) => `<span class="split-line" aria-hidden="true"><span class="split-word">${em ? `<em>${w}</em>` : w}</span></span>`).join(' ');
    return $$('.split-word', el);
  }
  const palavrasTitulo = quebrar($('.hero-title'));
  const palavrasPanorama = quebrar($('.panorama-quote'));
  const frase = $('[data-words]');
  if (frase) {
    const tokens = [];
    frase.childNodes.forEach((n) => {
      const em = n.nodeType === 1 && n.tagName === 'EM';
      (n.textContent || '').split(/\s+/).filter(Boolean).forEach((w) => tokens.push(em ? `<em class="w">${w}</em>` : `<span class="w">${w}</span>`));
    });
    frase.setAttribute('aria-label', frase.textContent.trim());
    frase.innerHTML = tokens.join(' ');
  }

  /* 0. Abertura: some depois que as fontes carregam (no máximo 2 s) */
  const cortina = $('.intro-curtain');
  const abrir = () => { if (!cortina.classList.contains('is-done')) { cortina.classList.add('is-done'); entrarCapa(); } };
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 2000))])
    .then(() => setTimeout(abrir, reduz ? 0 : 1250));

  /* 1. Entrada da capa */
  function entrarCapa() {
    if (!temGsap || reduz) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.25 });
    tl.from('.hero-media', { scale: 1.16, duration: 2.6, ease: 'power3.out' }, 0)
      .from('.hero-eyebrow', { y: 20, opacity: 0, duration: 1 }, 0.35)
      .from(palavrasTitulo, { yPercent: 115, rotate: 4, duration: 1.4, stagger: 0.07 }, 0.4)
      .from('.hero-lede', { y: 24, opacity: 0, duration: 1.1 }, 0.95)
      .from('.booking', { y: 50, opacity: 0, duration: 1.2 }, 1.05)
      .from('.top', { y: -30, opacity: 0, duration: 1 }, 1.1)
      .from('.concept-flag, .scroll-cue', { opacity: 0, duration: 1 }, 1.4);
  }
  if (!temGsap) abrir();

  const video = $('.hero-video');
  if (reduz && video) { video.pause(); video.removeAttribute('autoplay'); }

  /* Topo: some ao descer, volta ao subir, fica sólido depois da capa */
  const topo = $('.top');
  let ultimoY = 0;
  const aoRolar = () => {
    const y = window.scrollY;
    const alturaCapa = $('.hero').offsetHeight;
    topo.classList.toggle('is-solid', y > alturaCapa * 0.75);
    topo.classList.toggle('is-hidden', y > alturaCapa && y > ultimoY + 4);
    if (y < ultimoY - 4) topo.classList.remove('is-hidden');
    topo.classList.toggle('is-night', document.body.classList.contains('is-night'));
    $('.chat-fab').classList.toggle('is-shown', y > alturaCapa * 0.6);
    ultimoY = y;
  };
  addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  /* Cursor e botões magnéticos (só com mouse) */
  const temMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (temMouse && temGsap && !reduz) {
    const cur = $('.cursor');
    const label = $('.cursor-label');
    const mx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
    const my = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
    addEventListener('pointermove', (e) => { mx(e.clientX); my(e.clientY); cur.style.opacity = 1; });
    document.addEventListener('pointerleave', () => { cur.style.opacity = 0; });
    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('pointerenter', () => { label.textContent = el.dataset.cursor; cur.classList.add('is-big'); });
      el.addEventListener('pointerleave', () => cur.classList.remove('is-big'));
    });
    $$('.magnetic').forEach((el) => {
      const qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, .5)' });
      const qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, .5)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * 0.25);
        qy((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', () => { qx(0); qy(0); });
    });
  }

  if (temGsap && !reduz) {
    /* Capa sai devagar quando a página desce */
    gsap.to('.hero-content', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 35%', scrub: true } });
    gsap.to('.hero-media', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    /* 2. Frase que acende palavra por palavra */
    const ws = $$('.about-statement .w');
    ScrollTrigger.create({
      trigger: '.about-statement', start: 'top 82%', end: 'bottom 45%', scrub: true,
      onUpdate: (st) => { const n = Math.round(st.progress * ws.length); ws.forEach((w, i) => { w.style.opacity = i < n ? 1 : 0.14; }); },
    });
    /* Fotos que se abrem e flutuam */
    $$('.reveal-clip').forEach((el) => {
      gsap.to(el, { clipPath: 'inset(0% 0% 0% 0% round 26px)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
      const img = $('img', el);
      if (img) gsap.fromTo(img, { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.from('.about-text > *', { y: 40, opacity: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.about-text', start: 'top 85%' } });
    /* Números contando */
    $$('[data-count]').forEach((b) => {
      const fim = +b.dataset.count;
      const o = { v: 0 };
      gsap.to(o, { v: fim, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: b, start: 'top 90%' }, onUpdate: () => { b.textContent = Math.round(o.v); } });
    });

    const mm = gsap.matchMedia();
    /* 3. Suítes passando de lado (computador) */
    mm.add('(min-width: 861px)', () => {
      const trilho = $('.suites-track');
      const distancia = () => trilho.scrollWidth - innerWidth;
      const anda = gsap.to(trilho, {
        x: () => -distancia(), ease: 'none',
        scrollTrigger: { trigger: '.suites', pin: '.suites-pin', start: 'top top', end: () => '+=' + distancia(), scrub: 1, invalidateOnRefresh: true },
      });
      gsap.to('.suites-progress span', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.suites', start: 'top top', end: () => '+=' + distancia(), scrub: true } });
      $$('.suite-photo img').forEach((img) => {
        gsap.fromTo(img, { xPercent: -8 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: img.closest('.suite'), containerAnimation: anda, start: 'left right', end: 'right left', scrub: true } });
      });
      gsap.from('.suite-body', { y: 40, opacity: 0, stagger: 0.15, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.suites', start: 'top 60%' } });

      /* 4. Panorama: a janela vira a tela inteira */
      const tl = gsap.timeline({ scrollTrigger: { trigger: '.panorama', start: 'top top', end: 'bottom bottom', scrub: true } });
      tl.to('.panorama-frame', { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 1 }, 0)
        .to('.panorama-frame img', { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
        .from(palavrasPanorama, { yPercent: 115, stagger: 0.06, duration: 0.5, ease: 'power3.out' }, 0.45);
    });
    mm.add('(max-width: 860px)', () => {
      gsap.from(palavrasPanorama, { yPercent: 115, stagger: 0.06, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.panorama', start: 'top 60%' } });
      gsap.from('.suite', { y: 50, opacity: 0, stagger: 0.12, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.suites-track', start: 'top 85%' } });
    });

    /* 5. Um dia aqui: manhã, tarde e noite pela rolagem; a página escurece à noite */
    const passos = $$('.day-step'), fotos = $$('.day-photo'), pontos = $$('.day-dots span');
    let atual = -1;
    const fase = (i) => {
      if (i === atual) return;
      atual = i;
      passos.forEach((p, k) => p.classList.toggle('is-on', k === i));
      fotos.forEach((p, k) => p.classList.toggle('is-on', k === i));
      pontos.forEach((p, k) => p.classList.toggle('is-on', k === i));
      document.body.classList.toggle('is-afternoon', i === 1);
      document.body.classList.toggle('is-night', i === 2);
      aoRolar();
    };
    ScrollTrigger.create({
      trigger: '.day', pin: '.day-pin', start: 'top top', end: '+=220%', scrub: true,
      onUpdate: (st) => fase(Math.min(2, Math.floor(st.progress * 3))),
      onLeave: () => { document.body.classList.remove('is-night', 'is-afternoon'); aoRolar(); },
      onEnterBack: () => { atual = -1; fase(2); },
      onLeaveBack: () => { document.body.classList.remove('is-night', 'is-afternoon'); atual = -1; fase(0); document.body.classList.remove('is-afternoon'); aoRolar(); },
    });
    gsap.from('.day-copy > h2, .day-copy > .eyebrow', { y: 40, opacity: 0, stagger: 0.1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.day', start: 'top 70%' } });

    /* 6. Caminho até Juquehy se desenhando, com um ponto que percorre a estrada */
    const rota = $('.map-route');
    const len = rota.getTotalLength();
    rota.style.strokeDasharray = `${len}`;
    rota.style.strokeDashoffset = `${len}`;
    const svg = rota.ownerSVGElement;
    const carro = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    carro.setAttribute('r', '6'); carro.setAttribute('class', 'map-car');
    carro.setAttribute('fill', '#e2b064'); carro.setAttribute('stroke', '#24342b'); carro.setAttribute('stroke-width', '2');
    svg.appendChild(carro);
    const pos = (p) => { const pt = rota.getPointAtLength(len * p); carro.setAttribute('cx', pt.x); carro.setAttribute('cy', pt.y); };
    pos(0);
    gsap.to({ p: 0 }, { p: 1, ease: 'none', scrollTrigger: { trigger: '.arrive-map', start: 'top 75%', end: 'bottom 55%', scrub: 1 }, onUpdate() { const p = this.targets()[0].p; rota.style.strokeDashoffset = `${len * (1 - p)}`; pos(p); } });
    gsap.from('.map-hills path', { y: 30, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.arrive-map', start: 'top 80%' } });
    gsap.from('.arrive-list li', { x: -30, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.arrive-list', start: 'top 85%' } });

    /* Títulos de seção sobem ao aparecer */
    $$('.arrive h2, .quote h2, .suites-head h2').forEach((h) => {
      gsap.from(h, { y: 60, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
    });
    /* 7. Formulário entra campo a campo */
    gsap.from('.quote-form > *', { y: 30, opacity: 0, stagger: 0.06, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: '.quote-form', start: 'top 80%' } });
    gsap.from('.foot-name span, .foot-name em', { yPercent: 60, opacity: 0, stagger: 0.12, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.foot', start: 'top 85%' } });

    addEventListener('load', () => ScrollTrigger.refresh());
  } else {
    $('.day').classList.add('is-static');
    $$('.day-photo').forEach((p, i) => p.classList.toggle('is-on', i === 0));
  }

  /* Barra de datas da capa leva os dados para a cotação */
  const hoje = new Date().toISOString().slice(0, 10);
  $$('input[type="date"]').forEach((i) => { i.min = hoje; });
  const form = $('#quote-form');
  $('#booking').addEventListener('submit', (e) => {
    e.preventDefault();
    const b = new FormData(e.target);
    form.entrada.value = b.get('entrada') || '';
    form.saida.value = b.get('saida') || '';
    const h = String(b.get('hospedes') || '');
    form.adultos.value = (h.match(/(\d) adult/) || [, '2'])[1];
    form.criancas.value = (h.match(/(\d) criança/) || [, '0'])[1];
    irPara('#cotacao');
  });
  $$('[data-suite]').forEach((a) => a.addEventListener('click', () => { form.suite.value = a.dataset.suite; }));

  /* Conversa de demonstração */
  const chat = $('#chat'), log = $('.chat-log', chat), rapidas = $('.chat-quick', chat);
  const RESPOSTAS = {
    'Aceitam pet?': 'Aceitamos pet de pequeno e médio porte no Bangalô Jardim. Nas suítes Mar e Mata, infelizmente não. Quer que eu anote datas para o Bangalô?',
    'Horário de check-in': 'O check-in é a partir das 14h e o check-out até as 12h. Se você chegar mais cedo, pode deixar as malas com a gente e já ir para a praia.',
    'Tem estacionamento?': 'Temos estacionamento para hóspedes, dentro da pousada, sem custo extra.',
    'Quero uma cotação': 'Claro! Me conta as datas de entrada e saída e quantas pessoas vêm. Eu anoto e passo para a equipe, que te responde por aqui com valores e disponibilidade. Se preferir, preencha o pedido de cotação aqui no site.',
    'Você é um robô?': 'Sou a assistente virtual da Areia Clara. Quer que eu chame alguém da equipe?',
    'Falar com alguém da equipe': 'Combinado! Avisei a equipe e alguém vai continuar a conversa por aqui. O atendimento é das 8h às 22h.',
  };
  let iniciou = false;
  const rolarLog = () => { log.scrollTop = log.scrollHeight; };
  function fala(texto, quem = 'bot', espera = 900) {
    return new Promise((ok) => {
      if (quem === 'me') { const m = document.createElement('p'); m.className = 'msg me'; m.textContent = texto; log.appendChild(m); rolarLog(); return ok(); }
      const t = document.createElement('p'); t.className = 'msg bot typing'; t.setAttribute('aria-label', 'Digitando'); t.innerHTML = '<i></i><i></i><i></i>';
      log.appendChild(t); rolarLog();
      setTimeout(() => { t.className = 'msg bot'; t.removeAttribute('aria-label'); t.textContent = texto; rolarLog(); ok(); }, reduz ? 0 : espera);
    });
  }
  function botoes() {
    rapidas.innerHTML = '';
    Object.keys(RESPOSTAS).forEach((k) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = k;
      b.addEventListener('click', async () => {
        rapidas.innerHTML = '';
        await fala(k, 'me');
        await fala(RESPOSTAS[k], 'bot', 1100);
        if (k === 'Quero uma cotação') { const a = document.createElement('button'); a.type = 'button'; a.textContent = 'Preencher pedido de cotação'; a.addEventListener('click', () => { fechar(); irPara('#cotacao'); }); rapidas.appendChild(a); }
        botoes2();
      });
      rapidas.appendChild(b);
    });
  }
  const botoes2 = () => setTimeout(botoes, 300);
  const fab = $('.chat-fab');
  async function abrirChat() {
    chat.hidden = false; fab.setAttribute('aria-expanded', 'true');
    if (temGsap && !reduz) gsap.fromTo(chat, { opacity: 0, y: 30, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'expo.out' });
    if (!iniciou) {
      iniciou = true;
      await fala('Oi! Aqui é a Clara, da Pousada Areia Clara. Posso ajudar com datas, suítes ou qualquer dúvida sobre a pousada.', 'bot', 700);
      botoes();
    }
    return true;
  }
  function fechar() { chat.hidden = true; fab.setAttribute('aria-expanded', 'false'); }
  $$('[data-open-chat]').forEach((b) => b.addEventListener('click', () => (chat.hidden ? abrirChat() : fechar())));
  $('.chat-close').addEventListener('click', fechar);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !chat.hidden) fechar(); });

  /* Cotação: valida, mostra o recibo e continua a conversa como a assistente faria */
  const br = (d) => (d ? d.split('-').reverse().slice(0, 2).join('/') : '');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const erro = $('.form-error', form);
    const faltam = [...form.querySelectorAll('[required]')].filter((i) => (i.type === 'checkbox' ? !i.checked : !i.value.trim()));
    if (form.entrada.value && form.saida.value && form.saida.value <= form.entrada.value) faltam.push(form.saida);
    if (faltam.length) {
      erro.hidden = false;
      erro.textContent = faltam.includes(form.aceite) && faltam.length === 1 ? 'Marque o aceite para receber a resposta pelo WhatsApp.' : 'Confira as datas (a saída depois da entrada), seu nome e o WhatsApp.';
      faltam[0].focus();
      return;
    }
    erro.hidden = true;
    $('.form-done', form).hidden = false;
    form.querySelector('button[type="submit"]').disabled = true;
    const nome = form.nome.value.trim().split(' ')[0];
    const pessoas = `${form.adultos.value} adulto${form.adultos.value === '1' ? '' : 's'}${form.criancas.value !== '0' ? ` e ${form.criancas.value} criança${form.criancas.value === '1' ? '' : 's'}` : ''}`;
    await abrirChat();
    rapidas.innerHTML = '';
    await fala(`Oi! Pedi uma cotação pelo site: ${br(form.entrada.value)} a ${br(form.saida.value)}, ${pessoas}${form.pet.checked ? ', com pet' : ''}.`, 'me');
    const suite = form.suite.value === 'Ainda não sei' ? '' : ` na ${form.suite.value}`;
    const petAviso = form.pet.checked && form.suite.value !== 'Bangalô Jardim' ? ' Como você vem com pet, a opção é o Bangalô Jardim.' : '';
    await fala(`Oi, ${nome}! Recebi seu pedido para ${pessoas}${suite}, de ${br(form.entrada.value)} a ${br(form.saida.value)}.${petAviso} Já passei para a equipe, que te responde por aqui com valores e disponibilidade.`, 'bot', 1300);
    await fala('Enquanto isso, posso ajudar com mais alguma coisa?', 'bot', 900);
    botoes();
  });
})();

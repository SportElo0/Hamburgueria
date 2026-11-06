import '@fontsource-variable/plus-jakarta-sans';
import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

// Booking number as published on the previous site. Confirm with the pousada before launch.
const WHATSAPP = '5511999887127';
const MESSAGES = {
  nav: 'Olá! Vi o site da Villa Verano e gostaria de saber sobre disponibilidade.',
  hero: 'Olá! Vi o site da Villa Verano e gostaria de saber sobre disponibilidade.',
  social: 'Olá! Vi o site da Villa Verano.',
  sticky: 'Olá! Gostaria de saber sobre disponibilidade na Villa Verano.',
  closing: 'Olá! Gostaria de planejar uma estadia na Villa Verano.',
};

for (const a of document.querySelectorAll('[data-wa]')) {
  const kind = a.dataset.wa;
  const text = kind === 'room' ? `Olá! Gostaria de consultar disponibilidade para o ${a.dataset.room}.` : MESSAGES[kind];
  a.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  a.target = '_blank';
  a.rel = 'noopener';
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const nav = document.querySelector('[data-nav]');

if (!reduceMotion) setupStory();
else nav.classList.add('is-solid');
setupRooms();
setupLightbox();

/* ---------------------------------------------------------------------------
 * Story: four scenes of a day, pinned while the visitor scrolls. Each next photo
 * rises from the bottom and covers the last one, like turning a page, while the
 * previous photo drifts up and the copy hands over.
 * ------------------------------------------------------------------------- */
function setupStory() {
  const story = document.querySelector('[data-story]');
  const stage = story.querySelector('.story-stage');
  const scenes = [...story.querySelectorAll('.scene')].map((el) => ({
    photo: el.querySelector('.scene-photo'),
    img: el.querySelector('img'),
  }));
  const titles = [...story.querySelectorAll('[data-title]')];
  const lines = [...story.querySelectorAll('[data-line]')];
  const dots = [...story.querySelectorAll('[data-dot]')];
  const counter = story.querySelector('[data-counter]');
  const hint = story.querySelector('[data-hint]');
  const steps = scenes.length - 1;

  gsap.set(titles.slice(1), { autoAlpha: 0 });
  gsap.set(lines.slice(1), { autoAlpha: 0 });

  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  for (let i = 1; i <= steps; i++) {
    const t = i - 1;
    const cur = scenes[i];
    const prev = scenes[i - 1];
    tl.fromTo(cur.photo, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power2.inOut' }, t);
    tl.fromTo(cur.img, { scale: 1.18, yPercent: 6 }, { scale: 1, yPercent: 0, duration: 1, ease: 'power2.out' }, t);
    tl.to(prev.img, { yPercent: -10, scale: 1.06, duration: 1, ease: 'power2.inOut' }, t);
    tl.to([titles[i - 1], lines[i - 1]], { yPercent: -18, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, t + 0.05);
    tl.fromTo([titles[i], lines[i]], { yPercent: 18, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.35, ease: 'power3.out' }, t + 0.6);
  }

  const setActive = (index) => {
    counter.textContent = String(index + 1).padStart(2, '0');
    dots.forEach((d, i) => d.setAttribute('aria-current', String(i === index)));
    hint.textContent = index === steps ? 'Role para conhecer os quartos' : 'Role para ver o dia na pousada';
  };

  const length = () => window.innerHeight * steps * (window.innerWidth < 960 ? 0.85 : 1.1);
  const st = ScrollTrigger.create({
    trigger: story,
    start: 'top top',
    end: () => `+=${length()}`,
    pin: stage,
    scrub: 0.8,
    animation: tl,
    invalidateOnRefresh: true,
    snap: { snapTo: 1 / steps, inertia: false, duration: { min: 0.25, max: 0.7 }, delay: 0.12, ease: 'power2.inOut' },
    onUpdate: (self) => setActive(Math.round(self.progress * steps)),
  });

  // the nav gains a backdrop once the story has been passed
  ScrollTrigger.create({
    start: () => st.end - 2,
    end: 'max',
    onToggle: (self) => nav.classList.toggle('is-solid', self.isActive),
  });

  dots.forEach((d, i) => d.addEventListener('click', () => {
    window.scrollTo({ top: st.start + (st.end - st.start) * (i / steps), behavior: 'smooth' });
  }));

  setActive(0);
  // photos below the fold finish loading after the first layout; measure again then
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

/* Rooms: on wide screens the sticky photo changes halfway down the list. */
function setupRooms() {
  if (reduceMotion) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 961px)', () => {
    const second = document.querySelector('[data-room-photo="1"]');
    gsap.fromTo(second, { autoAlpha: 0 }, {
      autoAlpha: 1,
      ease: 'none',
      scrollTrigger: { trigger: '.rooms-list', start: '42% center', end: '58% center', scrub: true },
    });
  });
}

/* Gallery: native dialog with arrows, keys and swipe. */
function setupLightbox() {
  const dialog = document.querySelector('[data-lightbox]');
  const img = dialog.querySelector('[data-lightbox-img]');
  const tiles = [...document.querySelectorAll('[data-shot]')];
  const shots = [
    ['/img/fachada-full.webp', 'Fachada da pousada ao entardecer'],
    ['/img/piscina-full.webp', 'Piscina ao ar livre'],
    ['/img/quarto-verde-full.webp', 'Quarto verde com orquídea'],
    ['/img/quarto-amarelo-full.webp', 'Quarto amarelo com duas camas'],
  ];
  let index = 0;
  const show = (i) => {
    index = (i + shots.length) % shots.length;
    [img.src, img.alt] = shots[index];
  };
  tiles.forEach((t, i) => t.addEventListener('click', () => { show(i); dialog.showModal(); }));
  dialog.addEventListener('click', (e) => {
    const action = e.target.closest('[data-lb]')?.dataset.lb;
    if (action === 'close' || e.target === dialog) dialog.close();
    if (action === 'prev') show(index - 1);
    if (action === 'next') show(index + 1);
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  let x0 = null;
  dialog.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  dialog.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  });
}

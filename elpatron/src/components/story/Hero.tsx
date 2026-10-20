'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { HERO_PRODUCT_ID } from '@/content/menu';
import { useCatalog } from '@/content/live';
import photos from '@/content/photos.json';
import { useUi } from '../Providers';
import { Logo, Star } from '../brand/Brand';
import { ArrowDownIcon, PlusIcon } from '../ui/Icons';
import { Price } from '../ui/primitives';
import { scrollToHash } from '../nav/NavOverlay';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PHOTO = photos.items[HERO_PRODUCT_ID];

/** Opening screen: the namesake burger under a gold light, the tagline from the restaurant's profile. */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const ui = useUi();
  const catalog = useCatalog();
  const hero = catalog.byId.get(HERO_PRODUCT_ID)!;

  useGSAP(
    () => {
      // The floating cart bar waits until the hero (and its own order buttons) has scrolled away.
      ScrollTrigger.create({
        trigger: root.current,
        start: 'bottom 85%',
        onEnter: () => document.documentElement.setAttribute('data-story-done', ''),
        onLeaveBack: () => document.documentElement.removeAttribute('data-story-done'),
      });

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
        intro
          .from('[data-hero-glow]', { opacity: 0, scale: 0.6, duration: 2.2 }, 0)
          .from('[data-hero-burger]', { yPercent: 18, scale: 0.86, filter: 'blur(14px)', opacity: 0, duration: 1.8 }, 0.1)
          .from('[data-hero-logo]', { y: -24, opacity: 0, duration: 1.2 }, 0.35)
          .from('[data-hero-line]', { yPercent: 110, duration: 1.2, stagger: 0.09 }, 0.45)
          .from('[data-hero-fade]', { y: 16, opacity: 0, duration: 1, stagger: 0.08 }, 0.8);

        // On the way out the burger lifts toward the viewer while the copy settles back.
        const out = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
          defaults: { ease: 'none' },
        });
        out
          .to('[data-hero-burger-wrap]', { yPercent: -14, scale: 1.12 }, 0)
          .to('[data-hero-copy]', { yPercent: 18, opacity: 0.1 }, 0)
          .to('[data-hero-ghost]', { xPercent: -12 }, 0);
      });
    },
    { scope: root },
  );

  // Burgers take add-ons, so ordering opens the product sheet.
  const addHero = () => ui.openProduct({ productId: HERO_PRODUCT_ID });

  return (
    <section ref={root} id="inicio" aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-cream text-ink outline-none">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div data-hero-glow className="absolute top-[34%] left-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(217_174_88/0.28)_0%,rgb(217_174_88/0.08)_38%,transparent_66%)] md:top-1/2 md:left-[68%]" />
        <div data-hero-ghost className="ghost-word absolute bottom-[-0.12em] left-0 text-[28vw] opacity-60 md:text-[20vw]">
          Del Mal
        </div>
      </div>

      <div className="mx-auto grid min-h-svh max-w-[1500px] grid-rows-[auto_1fr] items-center gap-2 px-5 pt-[calc(var(--header-h)+4px)] pb-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:grid-rows-1 md:gap-6 md:px-10 md:pt-[var(--header-h)] md:pb-16">
        <div data-hero-burger-wrap className="relative order-first mx-auto w-[min(80vw,34svh)] md:order-last md:w-full md:max-w-[780px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-hero-burger
            src={PHOTO.src}
            alt={`${hero.name}: dois hambúrgueres de 180 g, cheddar, mussarela, bacon e molho barbecue. Foto do cardápio.`}
            width={1200}
            height={1200}
            fetchPriority="high"
            className="aspect-square w-full object-contain drop-shadow-[0_40px_50px_rgb(0_0_0/0.75)]"
          />
        </div>

        <div data-hero-copy className="relative text-center md:text-left">
          <div data-hero-logo>
            <Logo className="mx-auto h-auto w-[min(52vw,210px)] md:mx-0 md:w-[min(30vw,400px)]" />
          </div>
          <h1 id="hero-title" className="display mt-4 text-[clamp(2rem,4.3vw,4.4rem)] leading-[0.9] md:mt-8">
            <span className="block overflow-hidden pt-[0.16em] pb-[0.06em]">
              <span data-hero-line className="gold-foil block">
                O chefão dos
              </span>
            </span>
            <span className="block overflow-hidden pt-[0.16em] pb-[0.06em]">
              <span data-hero-line className="gold-foil block">
                hambúrgueres
              </span>
            </span>
            <span className="block overflow-hidden pt-[0.16em] pb-[0.06em]">
              <span data-hero-line className="block text-ink">
                voltou.
              </span>
            </span>
          </h1>
          <p data-hero-fade className="mx-auto mt-3 max-w-[40ch] text-[1rem] leading-relaxed text-ink-soft md:mx-0 md:mt-5 md:text-lg">
            Hambúrgueres de respeito em Osasco. Monte seu pedido aqui e mande direto pro WhatsApp da casa.
          </p>
          <div data-hero-fade className="mt-5 flex flex-col gap-3 md:mt-7 sm:flex-row sm:justify-center md:justify-start">
            <button
              type="button"
              onClick={addHero}
              className="cond group inline-flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-full bg-mustard pr-3 pl-6 text-lg font-bold tracking-[0.06em] text-on-dark uppercase transition-[background-color,transform] duration-200 hover:bg-ink active:scale-[0.98]"
            >
              <PlusIcon size={18} />
              Pedir o {hero.name}
              <span className="rounded-full bg-on-dark/12 px-3 py-1.5">
                <Price cents={hero.price} size="sm" className="text-[1.15rem]" />
              </span>
            </button>
            <a
              href="#cardapio"
              onClick={(e) => {
                e.preventDefault();
                scrollToHash('#cardapio');
              }}
              className="cond inline-flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-brand/50 px-6 text-lg font-bold tracking-[0.06em] uppercase transition-colors hover:border-mustard hover:text-mustard"
            >
              Ver cardápio
            </a>
          </div>
          <p data-hero-fade className="cond mt-8 hidden items-center gap-3 text-sm font-bold tracking-[0.24em] text-ink-mute uppercase md:flex">
            <Star size={12} className="text-brand" />
            Role para conhecer os chefões
            <ArrowDownIcon size={16} className="motion-safe:animate-[nudge_1.8s_ease-in-out_infinite]" />
          </p>
        </div>
      </div>
    </section>
  );
}

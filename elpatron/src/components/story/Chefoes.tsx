'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { SIGNATURE_IDS } from '@/content/menu';
import { useCatalog } from '@/content/live';
import { useUi } from '../Providers';
import { Chilli, Star } from '../brand/Brand';
import { PlusIcon } from '../ui/Icons';
import { Price } from '../ui/primitives';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const N = SIGNATURE_IDS.length;

/**
 * "Os Chefões da Casa": the five house burgers, one dossier per screen. With motion the section
 * pins and the dossiers slide sideways as the visitor scrolls; without it they simply stack.
 */
export function Chefoes() {
  const root = useRef<HTMLElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const [index, setIndex] = useState(0);
  const ui = useUi();
  const catalog = useCatalog();
  const items = SIGNATURE_IDS.map((id) => catalog.byId.get(id)!);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const section = root.current!;
        const track = section.querySelector<HTMLElement>('[data-track]')!;
        section.dataset.pinned = '';
        const distance = () => track.scrollWidth - window.innerWidth;

        const slide = gsap.to(track, { x: () => -distance(), ease: 'none' });
        const st = ScrollTrigger.create({
          trigger: section,
          pin: section.querySelector('[data-stage]'),
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: 0.6,
          animation: slide,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          snap: { snapTo: 1 / (N - 1), inertia: false, duration: { min: 0.2, max: 0.6 }, delay: 0.1, ease: 'power2.inOut' },
          onUpdate: (self) => setIndex(Math.round(self.progress * (N - 1))),
        });
        stRef.current = st;

        // Each burger rolls in from the edge as its dossier slides into view.
        gsap.utils.toArray<HTMLElement>('[data-dossier]').forEach((el, i) => {
          if (i === 0) return;
          gsap.fromTo(
            el.querySelector('[data-burger]'),
            { xPercent: 30, rotate: 14, scale: 0.82 },
            { xPercent: 0, rotate: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: el, containerAnimation: slide, start: 'left right', end: 'left 25%', scrub: true } },
          );
          gsap.fromTo(
            el.querySelector('[data-ghost]'),
            { xPercent: 20 },
            { xPercent: -20, ease: 'none', scrollTrigger: { trigger: el, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true } },
          );
        });

        return () => {
          delete section.dataset.pinned;
          stRef.current = null;
        };
      });
    },
    { scope: root },
  );

  // The pin adds scroll length only after hydration, so reload, back/forward and #hash jumps land
  // short of their target. Restore by hand once the pin exists.
  useEffect(() => {
    const KEY = 'elpatron:scroll-y';
    let store: Storage | null = null;
    try {
      store = window.sessionStorage;
    } catch {}
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const save = () => {
      try {
        store?.setItem(KEY, String(Math.round(window.scrollY)));
      } catch {}
    };
    window.addEventListener('pagehide', save);
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const saved = Number(store?.getItem(KEY) ?? 0);
    const raf = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      if (target) target.scrollIntoView();
      else if (nav && nav.type !== 'navigate' && saved > 0) window.scrollTo(0, saved);
    });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pagehide', save);
    };
  }, []);

  const goTo = (i: number) => {
    const st = stRef.current;
    if (!st) return document.getElementById(`dossier-${SIGNATURE_IDS[i]}`)?.scrollIntoView({ behavior: 'auto' });
    window.scrollTo({ top: st.start + (st.end - st.start) * (i / (N - 1)), behavior: 'smooth' });
  };

  return (
    <section ref={root} id="chefoes" aria-labelledby="chefoes-title" className="chefoes relative bg-cream text-ink outline-none">
      <div data-stage className="chefoes-stage relative overflow-hidden">
        <header className="chefoes-head relative z-10 mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-x-4 gap-y-1 px-5 pt-[calc(var(--header-h)+16px)] md:px-10 md:pt-[calc(var(--header-h)+20px)]">
          <div>
            <p className="cond hidden text-sm font-bold tracking-[0.3em] text-brand uppercase md:block">Cardápio El Burger Del Mal</p>
            <h2 id="chefoes-title" className="display gold-foil text-[clamp(1.55rem,4.6vw,3.8rem)] whitespace-nowrap md:mt-1">
              Os Chefões da Casa
            </h2>
          </div>
          <nav aria-label="Escolher chefão" className="chefoes-dots -ml-2 hidden items-center gap-1 md:ml-0 md:gap-2 md:pb-2">
            {items.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={p.name}
                aria-current={index === i ? 'true' : undefined}
                className="group grid h-11 w-8 cursor-pointer place-items-center"
              >
                <span className="h-[3px] w-6 rounded-full bg-brand/30 transition-[background-color,width] duration-300 group-hover:bg-brand/70 group-aria-[current=true]:w-8 group-aria-[current=true]:bg-mustard" />
              </button>
            ))}
            <span className="cond tabular ml-2 w-14 text-right text-lg font-bold text-ink-soft" aria-hidden="true">
              {String(index + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
            </span>
          </nav>
        </header>

        <div data-track className="chefoes-track">
          {items.map((p, i) => (
            <article key={p.id} id={`dossier-${p.id}`} data-dossier aria-labelledby={`dossier-title-${p.id}`} className="chefoes-panel relative">
              <div aria-hidden="true" data-ghost className="ghost-word pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30vw] md:text-[17vw]">
                {p.name}
              </div>
              <div className="relative mx-auto grid h-full max-w-[1400px] items-center gap-2 px-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12 md:px-10">
                <button
                  type="button"
                  onClick={() => ui.openProduct({ productId: p.id })}
                  aria-label={`Ver detalhes de ${p.name}`}
                  className="relative mx-auto w-[min(88vw,38svh)] cursor-pointer md:w-full md:max-w-[640px]"
                >
                  <span aria-hidden="true" className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgb(217_174_88/0.24),transparent_68%)]" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    data-burger
                    src={p.image}
                    alt={p.imageAlt ?? ''}
                    width={1200}
                    height={1200}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="relative aspect-square w-full object-contain drop-shadow-[0_36px_40px_rgb(0_0_0/0.75)]"
                  />
                </button>
                <div className="relative text-center md:text-left">
                  <p className="cond text-sm font-bold tracking-[0.3em] text-brand uppercase">
                    Nº {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 id={`dossier-title-${p.id}`} className="display mt-1 flex items-center justify-center gap-3 text-[clamp(2.4rem,6.6vw,5.6rem)] text-mustard md:justify-start">
                    {p.name}
                    {p.mark === 'star' && <Star size={28} className="shrink-0 text-brand" />}
                    {p.mark === 'spicy' && (
                      <>
                        <Chilli size={34} className="shrink-0 text-[#d9472b]" />
                        <span className="sr-only">(picante)</span>
                      </>
                    )}
                  </h3>
                  <p className="mx-auto mt-3 max-w-[44ch] text-[0.98rem] leading-relaxed text-ink-soft md:mx-0 md:mt-5 md:text-[1.1rem]">{p.description}</p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:mt-8 md:justify-start">
                    <Price cents={p.price} size="md" className="price-box text-ink" />
                    {catalog.soldOut.has(p.id) ? (
                      <span className="cond text-sm font-bold tracking-[0.1em] text-ink-mute uppercase">Esgotado hoje</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => ui.openProduct({ productId: p.id })}
                        className="cond inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full bg-mustard pr-5 pl-4 text-base font-bold tracking-[0.08em] text-on-dark uppercase transition-[background-color,transform] duration-200 hover:bg-ink active:scale-[0.97]"
                      >
                        <PlusIcon size={18} />
                        Quero esse
                        <span className="sr-only"> {p.name}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

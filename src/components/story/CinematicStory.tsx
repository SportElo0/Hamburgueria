'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { HERO_PRODUCT_ID, SIGNATURE_IDS, productById } from '@/content/menu';
import renders from '@/content/renders.json';
import { useCart, useUi } from '../Providers';
import { BurgerStack, explodeOffset, layersOf } from '../burger/BurgerStack';
import { Star } from '../brand/Brand';
import { ArrowDownIcon, ArrowRightIcon, PlusIcon } from '../ui/Icons';
import { Price } from '../ui/primitives';
import { scrollToHash } from '../nav/NavOverlay';
import { FLOATERS, SCENES } from './scenes';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HERO = HERO_PRODUCT_ID;
const N = layersOf(HERO).length;
const SLOT = SIGNATURE_IDS.indexOf(HERO as (typeof SIGNATURE_IDS)[number]);

// Timeline beats (arbitrary units; total length maps onto the pinned scroll distance).
const T = {
  t1: 0.35, // red → orange
  t2: 1.75, // orange → green
  t3: 3.15, // green → plum
  t4: 4.85, // plum → teal
  explode: 5.85,
  rejoin: 7.25,
  end: 7.9,
};
export const SCENE_TIMES = [0, T.t1 + 1, T.t2 + 1, T.t3 + 1, T.explode + 0.8];

export function CinematicStory() {
  const root = useRef<HTMLElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const [scene, setScene] = useState(0);
  const cart = useCart();
  const ui = useUi();
  const hero = productById.get(HERO)!;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
        },
        (ctx) => {
          const { desktop } = ctx.conditions as { desktop: boolean; mobile: boolean };
          const q = gsap.utils.selector(root);
          const layers = q('.rig .bs-layer');
          const labels = q('.rig .bs-label');
          const fields = q('[data-field]');
          const copy = (i: number) => q(`[data-copy="${i}"]`);
          const lineup = q('[data-lineup]');
          const rig = q('.rig');

          // Compositions per scene: where the burger sits.
          const C = desktop
            ? [
                { x: 0, y: '6vh', scale: 1.32, rotation: 0 },
                { x: '19vw', y: '4vh', scale: 1.24, rotation: -7 },
                { x: '-19vw', y: '3vh', scale: 1.1, rotation: 6 },
                { x: `${(SLOT - 1.5) * 23.5}vw`, y: '4vh', scale: 0.56, rotation: 0 },
                { x: 0, y: '7vh', scale: 0.8, rotation: 0 },
              ]
            : [
                { x: 0, y: '5vh', scale: 1.48, rotation: 0 },
                { x: 0, y: '9vh', scale: 1.14, rotation: -6 },
                { x: 0, y: '9vh', scale: 1.04, rotation: 5 },
                { x: '23vw', y: '-2vh', scale: 0.5, rotation: 0 },
                { x: 0, y: '8vh', scale: 0.92, rotation: 0 },
              ];
          const lineupPos = desktop
            ? SIGNATURE_IDS.map((_, i) => ({ x: `${(i - 1.5) * 23.5}vw`, y: '4vh' }))
            : [
                { x: '-23vw', y: '-2vh' },
                { x: '23vw', y: '-2vh' },
                { x: '-23vw', y: '22vh' },
                { x: '23vw', y: '22vh' },
              ];

          gsap.set(fields.slice(1), { yPercent: 100, autoAlpha: 1 });
          gsap.set(rig, C[0]);
          [1, 2, 3, 4].forEach((i) => gsap.set(copy(i), { autoAlpha: 0, y: 60 }));
          gsap.set(labels, { autoAlpha: 0 });
          lineup.forEach((el, i) => gsap.set(el, { ...lineupPos[i], autoAlpha: 0, yPercent: 12 }));
          const heroCap = q('[data-lineup-hero]');

          const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
          const split = (at: number, base: number, gap = desktop ? 6 : 5) => {
            tl.to(layers, { yPercent: (i) => explodeOffset(i, N, gap), duration: 0.5, ease: 'power2.out', stagger: { each: 0.012, from: 'end' } }, at);
            tl.to(layers, { yPercent: (i) => explodeOffset(i, N, base), duration: 0.5, ease: 'power2.inOut' }, at + 0.5);
          };
          const swapCopy = (from: number, to: number, at: number) => {
            tl.to(copy(from), { autoAlpha: 0, y: -70, duration: 0.45, ease: 'power2.in' }, at);
            tl.fromTo(copy(to), { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, at + 0.55);
          };
          const wipe = (i: number, at: number) => {
            tl.to(fields[i], { yPercent: 0, duration: 1, ease: 'power2.inOut' }, at);
            tl.fromTo(q(`[data-field="${i}"] [data-ghost]`), { xPercent: 8 }, { xPercent: -4, duration: 2.2, ease: 'none' }, at);
          };

          tl.addLabel('s1', 0);
          // Red → orange: flavour
          wipe(1, T.t1);
          split(T.t1, 0);
          tl.to(rig, { ...C[1], duration: 1 }, T.t1);
          swapCopy(0, 1, T.t1);
          // Orange → green: layers breathe apart a little
          wipe(2, T.t2);
          split(T.t2, desktop ? 2.4 : 2);
          tl.to(rig, { ...C[2], duration: 1 }, T.t2);
          swapCopy(1, 2, T.t2);
          // Green → plum: the burger takes its place in the signature lineup
          wipe(3, T.t3);
          split(T.t3, 0);
          tl.to(rig, { ...C[3], duration: 1, ease: 'power3.inOut' }, T.t3);
          swapCopy(2, 3, T.t3);
          tl.to(lineup, { autoAlpha: 1, yPercent: 0, duration: 0.55, ease: 'power3.out', stagger: 0.08 }, T.t3 + 0.5);
          tl.to(heroCap, { autoAlpha: 1, duration: 0.4 }, T.t3 + 0.75);
          // Plum → teal: back to centre stage, then the explosion
          wipe(4, T.t4);
          tl.to(lineup, { autoAlpha: 0, yPercent: 18, duration: 0.4, ease: 'power2.in', stagger: 0.04 }, T.t4);
          tl.to(heroCap, { autoAlpha: 0, duration: 0.25 }, T.t4);
          tl.to(rig, { ...C[4], duration: 1, ease: 'power3.inOut' }, T.t4);
          swapCopy(3, 4, T.t4);
          const gap = desktop ? 9 : 8.4;
          tl.to(layers, { yPercent: (i) => explodeOffset(i, N, gap), duration: 0.9, ease: 'power3.inOut', stagger: { each: 0.03, from: 'end' } }, T.explode);
          tl.to(q('.rig-shadow'), { scaleX: 0.7, autoAlpha: 0.35, duration: 0.9 }, T.explode);
          tl.to(labels, { autoAlpha: 1, duration: 0.35, stagger: { each: 0.05, from: 'end' } }, T.explode + 0.45);
          // Reassemble before the menu
          tl.to(labels, { autoAlpha: 0, duration: 0.25 }, T.rejoin);
          tl.to(layers, { yPercent: 0, duration: 0.55, ease: 'power3.inOut', stagger: { each: 0.02, from: 'start' } }, T.rejoin + 0.05);
          tl.to(q('.rig-shadow'), { scaleX: 1, autoAlpha: 1, duration: 0.55 }, T.rejoin + 0.05);
          tl.to({}, { duration: T.end - (T.rejoin + 0.6) });

          const doneFlag = (on: boolean) => document.documentElement.toggleAttribute('data-story-done', on);
          const st = ScrollTrigger.create({
            trigger: root.current,
            pin: q('.stage')[0],
            start: 'top top',
            end: () => `+=${window.innerHeight * (desktop ? 6.4 : 5.6)}`,
            scrub: 0.7,
            animation: tl,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onLeave: () => doneFlag(true),
            onEnterBack: () => doneFlag(false),
            onUpdate: (self) => {
              const t = self.progress * tl.duration();
              let s = 0;
              for (let i = 0; i < SCENE_TIMES.length; i++) if (t >= SCENE_TIMES[i] - 0.5) s = i;
              setScene((prev) => (prev === s ? prev : s));
            },
          });
          stRef.current = st;
          (window as Window & { __storyST?: ScrollTrigger }).__storyST = st;
          return () => {
            stRef.current = null;
            doneFlag(false);
          };
        },
      );
    },
    { scope: root },
  );

  const goToScene = (i: number) => {
    const st = stRef.current;
    if (!st) return;
    const tl = st.animation!;
    const y = st.start + ((SCENE_TIMES[i] + (i === 4 ? 0.4 : 0)) / tl.duration()) * (st.end - st.start);
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const addHero = () => {
    cart.add(HERO, 1, {});
    ui.toast(`${hero.name} na sacola`, { label: 'Ver sacola', run: () => ui.setCartOpen(true) });
  };

  return (
    <section ref={root} id="inicio" data-tone="story" aria-label="Downtown Burger" className="story-cinematic surface-dark relative bg-scene-red text-on-dark outline-none">
      <div className="stage relative h-lvh overflow-hidden">
        {/* Colour fields */}
        {SCENES.map((s, i) => (
          <div key={s.id} data-field={i} aria-hidden="true" className={`absolute inset-0 overflow-hidden ${s.field} ${i ? 'invisible' : ''}`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_58%,rgb(255_255_255/0.16),transparent_62%)]" />
            <div data-ghost className="ghost-word absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[42%] text-[30vw] md:text-[24vw]">
              {s.ghost}
            </div>
            {FLOATERS[i].map((f, k) => (
              <div
                key={k}
                className={`absolute top-[var(--my)] left-[var(--mx)] w-[var(--w)] md:top-[var(--y)] md:left-[var(--x)] md:block ${f.m === 'hide' ? 'hidden' : ''}`}
                style={{
                  ['--x' as string]: f.x,
                  ['--y' as string]: f.y,
                  ['--mx' as string]: f.m && f.m !== 'hide' ? f.m.x : f.x,
                  ['--my' as string]: f.m && f.m !== 'hide' ? f.m.y : f.y,
                  ['--w' as string]: f.w,
                }}
              >
                <div className="bob" style={{ ['--dur' as string]: `${f.dur}s`, ['--delay' as string]: `${-k * 1.3}s`, ['--r0' as string]: `${f.r}deg`, ['--r1' as string]: `${f.r + 12}deg`, ['--bob' as string]: '-18px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={renders.props[f.src].src} alt="" loading={i === 0 ? 'eager' : 'lazy'} className={`w-full drop-shadow-[0_18px_18px_rgb(0_0_0/0.28)] ${f.blur ? 'blur-[3px]' : ''}`} />
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Signature lineup (scene 4): the real neighbours of the hero burger */}
        {SIGNATURE_IDS.map((id) => {
          if (id === HERO) return <div key={id} data-lineup className="hidden" />;
          const p = productById.get(id)!;
          return (
            <button
              key={id}
              type="button"
              data-lineup
              onClick={() => ui.openProduct({ productId: id })}
              className="group invisible absolute top-[50svh] left-1/2 z-20 -mt-[calc(var(--frame)*var(--lu)/2)] -ml-[calc(var(--frame)*var(--lu)/2)] w-[calc(var(--frame)*var(--lu))] cursor-pointer rounded-full"
              aria-label={`${p.name}, ${p.description}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" loading="lazy" className="aspect-square w-full transition-transform duration-500 group-hover:-translate-y-[4%] group-hover:-rotate-3" />
              <LineupCaption name={p.name} cents={p.price} />
            </button>
          );
        })}

        {/* Intro headline sits behind the burger */}
        <div data-copy="0" className="pointer-events-none absolute inset-x-0 top-[calc(var(--header-h)+3vh)] z-[5] px-5 text-center md:top-[calc(var(--header-h)+1vh)]">
          <h1 className="display text-[clamp(3.6rem,15vw,6rem)] leading-[0.84] text-on-dark md:text-[clamp(5.4rem,9vw,10.5rem)]">
            Isso é <span className="whitespace-nowrap">Downtown.</span>
          </h1>
        </div>

        {/* The burger rig */}
        <div className="rig absolute top-[50svh] left-1/2 z-10 -mt-[calc(var(--frame)/2)] -ml-[calc(var(--frame)/2)] w-[var(--frame)]" style={{ ['--label-out' as string]: 'clamp(0px, 8vw, 150px)' }}>
          <div className="bob" style={{ ['--dur' as string]: '6.5s', ['--bob' as string]: '-12px', ['--r0' as string]: '-0.6deg', ['--r1' as string]: '0.8deg' }}>
            <div aria-hidden="true" className="rig-shadow absolute inset-x-[16%] top-[72%] h-[16%] bg-[radial-gradient(closest-side,rgb(0_0_0/0.42),rgb(0_0_0/0.18)_55%,transparent)]" />
            <BurgerStack id={HERO} labels priority animated={false} />
          </div>
          <div data-lineup-caption className="pointer-events-none">
            <SceneFourHeroCaption />
          </div>
        </div>

        {/* Scene copy */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-svh [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
          {/* 1 — Intro */}
          <div data-copy="0" className="absolute inset-0 flex flex-col items-center px-5 pt-[calc(var(--header-h)+3vh)] pb-[max(24px,env(safe-area-inset-bottom))] text-center md:pt-[calc(var(--header-h)+1vh)]">
            <div className="mt-auto flex w-full flex-col items-center gap-4">
              <button
                type="button"
                onClick={addHero}
                className="group flex min-h-12 cursor-pointer items-center gap-3 rounded-full bg-black/22 py-1.5 pr-1.5 pl-5 backdrop-blur-sm transition-colors hover:bg-black/35 md:absolute md:top-[50%] md:right-[7vw] md:flex-col md:items-start md:gap-2 md:rounded-[22px] md:bg-transparent md:p-0 md:backdrop-blur-none md:hover:bg-transparent"
              >
                <span className="cond text-[0.95rem] font-bold tracking-[0.12em] uppercase md:text-[1.15rem]">{hero.name}</span>
                <span className="flex items-center gap-3">
                  <Price cents={hero.price} size="sm" className="md:text-[2.6rem]" />
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-mustard text-ink transition-transform group-hover:scale-110 md:h-12 md:w-12">
                    <PlusIcon size={18} />
                    <span className="sr-only">Adicionar à sacola</span>
                  </span>
                </span>
              </button>
              <p className="cond text-[1.1rem] font-semibold tracking-[0.1em] uppercase md:text-[1.3rem] md:tracking-[0.14em]">Burger artesanal feito com qualidade.</p>
              <div className="flex w-full max-w-md gap-3 md:w-auto">
                <a
                  href="#cardapio"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToHash('#cardapio');
                  }}
                  className="cond inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-mustard px-6 text-lg font-bold tracking-[0.1em] whitespace-nowrap text-ink uppercase transition-[background-color,transform] duration-200 hover:bg-on-dark active:scale-[0.97] md:px-9"
                >
                  Ver cardápio
                </a>
                <button
                  type="button"
                  onClick={() => (cart.count ? ui.setCartOpen(true) : scrollToHash('#cat-burgers'))}
                  className="cond inline-flex min-h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-on-dark/70 px-6 text-lg font-bold tracking-[0.1em] whitespace-nowrap uppercase transition-colors hover:border-on-dark hover:bg-on-dark hover:text-scene-red md:px-9"
                >
                  Peça agora
                </button>
              </div>
              <span aria-hidden="true" className="cond mt-1 hidden items-center gap-2 text-xs font-bold tracking-[0.3em] text-on-dark-mute uppercase md:flex">
                <ArrowDownIcon size={14} className="motion-safe:animate-[nudge_2.4s_var(--ease-out-expo)_infinite]" /> Role para montar
              </span>
            </div>
          </div>

          {/* 2 — Flavour */}
          <div data-copy="1" className="invisible absolute inset-x-5 top-[calc(var(--header-h)+2vh)] md:inset-x-auto md:top-1/2 md:left-[6vw] md:w-[40vw] md:-translate-y-1/2">
            <h2 className="display text-[clamp(3.6rem,15vw,6rem)] md:text-[clamp(5rem,8.4vw,10rem)]">
              Feito pra
              <br />
              dar fome.
            </h2>
            <p className="mt-5 hidden max-w-[34ch] text-[1.2rem] leading-relaxed font-bold text-on-dark md:block">
              Blend bovino de 180 g, queijo prato derretendo sobre a carne, bacon e pão brioche. Do jeito que está no cardápio.
            </p>
          </div>

          {/* 3 — Layers */}
          <div data-copy="2" className="invisible absolute inset-x-5 top-[calc(var(--header-h)+2vh)] text-right md:inset-x-auto md:top-1/2 md:right-[6vw] md:w-[40vw] md:-translate-y-1/2">
            <h2 className="display text-[clamp(3.4rem,14vw,6rem)] md:text-[clamp(4.6rem,7.6vw,9rem)]">
              Qualidade em cada camada.
            </h2>
            <ul className="cond mt-6 hidden flex-wrap justify-end gap-x-4 gap-y-1 text-[1.05rem] font-semibold tracking-[0.1em] text-on-dark-mute uppercase md:flex">
              {layersOf(HERO)
                .filter((l) => l.key !== 'bun-bottom')
                .map((l) => (
                  <li key={l.key} className="flex items-center gap-4">
                    {l.label}
                    <Star size={9} className="text-mustard" />
                  </li>
                ))}
            </ul>
          </div>

          {/* 4 — Signature */}
          <div data-copy="3" className="invisible absolute inset-0 flex flex-col items-center px-5 pt-[calc(var(--header-h)+2vh)] pb-[max(24px,env(safe-area-inset-bottom))] text-center">
            <h2 className="display text-[clamp(3.2rem,13vw,5.5rem)] md:text-[clamp(4.4rem,7vw,8.4rem)]">Escolha seu favorito.</h2>
            <a
              href="#cat-burgers"
              onClick={(e) => {
                e.preventDefault();
                scrollToHash('#cat-burgers');
              }}
              className="cond mt-auto inline-flex min-h-14 items-center gap-3 rounded-full bg-mustard px-8 text-lg font-bold tracking-[0.1em] text-ink uppercase transition-colors hover:bg-on-dark"
            >
              Explorar burgers <ArrowRightIcon size={18} />
            </a>
          </div>

          {/* 5 — Inside */}
          <div data-copy="4" className="invisible absolute inset-0 flex flex-col items-center px-5 pt-[calc(var(--header-h)+2vh)] pb-[max(24px,env(safe-area-inset-bottom))] text-center">
            <h2 className="display text-[clamp(3.2rem,13vw,5.5rem)] md:text-[clamp(4.4rem,7vw,8.4rem)]">Por dentro do sabor.</h2>
            <p className="cond mt-2 text-lg font-semibold tracking-[0.12em] text-on-dark-mute uppercase">{hero.name}, camada por camada.</p>
            <div className="mt-auto flex flex-wrap justify-center gap-3">
              <a
                href="#cardapio"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToHash('#cardapio');
                }}
                className="cond inline-flex min-h-14 items-center gap-3 rounded-full bg-mustard px-8 text-lg font-bold tracking-[0.1em] text-ink uppercase transition-colors hover:bg-on-dark"
              >
                Monte seu pedido <ArrowRightIcon size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Scene dots */}
        <nav aria-label="Cenas" className="absolute top-1/2 left-3 z-30 hidden -translate-y-1/2 md:left-6 md:block">
          <ol className="flex flex-col gap-1">
            {SCENES.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => goToScene(i)}
                  aria-label={`Cena ${i + 1}: ${s.title}`}
                  aria-current={scene === i ? 'step' : undefined}
                  className="group flex h-8 w-8 cursor-pointer items-center justify-center"
                >
                  <span className={`block rounded-full transition-all duration-300 ${scene === i ? 'h-3 w-3 bg-mustard' : 'h-2 w-2 bg-on-dark/45 group-hover:bg-on-dark'}`} />
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <p aria-hidden="true" className="cond absolute top-1/2 right-0 z-30 hidden origin-center translate-x-[38%] -translate-y-1/2 rotate-90 items-center text-xs font-bold tracking-[0.42em] whitespace-nowrap text-on-dark-mute uppercase md:flex">
          {['Burgers', 'Steaks', 'Fries', 'Shakes'].map((w, i) => (
            <span key={w} className="inline-flex items-center">
              {i > 0 && <Star size={9} className="mx-3 text-mustard" />}
              {w}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

function LineupCaption({ name, cents }: { name: string; cents: number }) {
  return (
    <span className="absolute inset-x-0 top-[80%] flex flex-col items-center gap-1 text-on-dark">
      <span className="display text-center text-[1.45rem] md:text-[clamp(1.9rem,2.6vw,2.8rem)] md:whitespace-nowrap">{name}</span>
      <Price cents={cents} size="sm" className="text-mustard md:text-[1.6rem]" />
    </span>
  );
}

/** Caption that sits under the hero when it joins the lineup; fades with the lineup. */
function SceneFourHeroCaption() {
  const p = productById.get(HERO)!;
  return (
    <span data-lineup-hero className="invisible absolute inset-x-0 top-[80%] flex origin-top flex-col items-center gap-1" style={{ scale: 'calc(1 / var(--lu))' }}>
      <span className="display text-center text-[1.45rem] md:text-[clamp(1.9rem,2.6vw,2.8rem)] md:whitespace-nowrap">{p.name}</span>
      <Price cents={p.price} size="sm" className="text-mustard md:text-[1.6rem]" />
    </span>
  );
}

"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Onde cada área começa na linha do tempo da cena (0 a 1).
const INTRO_END = 0.14;
const STEP = 0.17;

/**
 * A abertura presa: o texto dá lugar às áreas de atuação, uma por vez, enquanto
 * a foto se aproxima e o selo gira. Só roda sem movimento reduzido; sem ela, as
 * áreas ficam em lista logo abaixo da abertura.
 */
export function ScrollScenes() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    // A cena presa começa logo abaixo do cabeçalho (altura já recolhida: 4.75rem / 4.25rem).
    const below = () => `top ${window.matchMedia("(min-width: 1024px)").matches ? 76 : 68}px`;

    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        desktop: "(min-width: 1024px)",
      },
      (context) => {
        const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
        const hero = document.querySelector<HTMLElement>("[data-hero]");
        const stage = hero?.querySelector<HTMLElement>("[data-hero-stage]");
        if (!motion || !hero || !stage) return;

        hero.classList.add("is-scene");
        const items = gsap.utils.toArray<HTMLElement>("[data-hero-area]", hero);
        const markers = gsap.utils.toArray<HTMLElement>("[data-hero-index-item], [data-hero-tick]", hero);
        const sealRings = hero.querySelector<SVGGElement>("[data-hero-seal] svg > g");
        const count = items.length;
        let current = -2;

        const setActive = (index: number) => {
          if (index === current) return;
          current = index;
          markers.forEach((el) => {
            const i = Number(el.dataset.heroIndexItem ?? el.dataset.heroTick);
            el.dataset.active = String(i === index);
            if (el.tagName === "BUTTON") el.setAttribute("aria-current", i === index ? "step" : "false");
          });
          window.dispatchEvent(new CustomEvent("hero-phase", { detail: index >= 0 ? "areas" : "inicio" }));
        };

        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: {
            trigger: stage,
            start: below,
            end: desktop ? "+=520%" : "+=460%",
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const p = self.progress;
              setActive(p < INTRO_END - 0.02 ? -1 : Math.min(count - 1, Math.floor((p - INTRO_END + 0.02) / STEP)));
            },
          },
        });

        // A foto se aproxima durante toda a cena; o véu escurece quando as áreas entram.
        tl.fromTo("[data-hero-photo]", { scale: 1 }, { scale: 1.14, ease: "none", duration: 1 }, 0);
        tl.to("[data-hero-veil]", { opacity: 0.4, duration: 0.08 }, INTRO_END - 0.08);
        tl.to("[data-hero-copy]", { autoAlpha: 0, y: -40, duration: 0.09 }, INTRO_END - 0.11);
        // Índice (desktop) e traços de progresso (celular) só aparecem com as áreas.
        tl.fromTo(["[data-hero-index]", "[data-hero-ticks]"], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, INTRO_END - 0.05);

        if (desktop) {
          // O selo recua para o alto e gira um passo a cada área.
          tl.to("[data-hero-seal]", { scale: 0.7, yPercent: -16, duration: 0.1 }, INTRO_END - 0.1);
          if (sealRings) {
            tl.fromTo(sealRings, { rotation: 0 }, { rotation: 216, svgOrigin: "0 0", ease: "none", duration: 1 - INTRO_END }, INTRO_END);
          }
        }

        items.forEach((item, i) => {
          const start = INTRO_END + i * STEP;
          tl.fromTo(item, { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.045 }, start);
          if (i < count - 1) tl.to(item, { autoAlpha: 0, y: -36, duration: 0.04, ease: "power2.in" }, start + STEP - 0.045);
        });
        tl.set({}, {}, 1);

        const st = tl.scrollTrigger!;
        const positionOf = (index: number) => st.start + (st.end - st.start) * (INTRO_END + index * STEP + STEP * 0.45);
        const goTo = (index: number) => window.scrollTo({ top: positionOf(index), behavior: "smooth" });

        // Índice lateral e links para "#areas" levam à área certa dentro da cena.
        const onIndex = (event: Event) => {
          const el = (event.target as HTMLElement).closest<HTMLElement>("[data-hero-index-item]");
          if (el) goTo(Number(el.dataset.heroIndexItem));
        };
        const onAnchor = (event: MouseEvent) => {
          const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href="#areas"], a[href="/#areas"]');
          if (!link || window.location.pathname !== "/") return;
          event.preventDefault();
          history.replaceState(null, "", "#areas");
          goTo(0);
        };
        hero.addEventListener("click", onIndex);
        document.addEventListener("click", onAnchor, true);

        // Chegando de outra página com âncora: a cena presa alonga a página, então
        // depois de medi-la o scroll é refeito (em /#areas, para a primeira área).
        const hash = window.location.hash;
        if (hash) {
          requestAnimationFrame(() => {
            ScrollTrigger.refresh();
            if (hash === "#areas") window.scrollTo({ top: positionOf(0) });
            else document.querySelector(hash)?.scrollIntoView();
          });
        }

        return () => {
          hero.removeEventListener("click", onIndex);
          document.removeEventListener("click", onAnchor, true);
          hero.classList.remove("is-scene");
          window.dispatchEvent(new CustomEvent("hero-phase", { detail: "inicio" }));
        };
      },
    );

    return () => mm.revert();
  }, []);

  return null;
}

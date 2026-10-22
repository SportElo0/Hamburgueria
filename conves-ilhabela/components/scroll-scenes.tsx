"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * As cenas de scroll do site, orquestradas num só lugar.
 * Só rodam sem movimento reduzido; sem elas, todo o conteúdo fica visível e estático.
 */
export function ScrollScenes() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    // As cenas presas começam logo abaixo do cabeçalho fixo (altura dele já recolhido: 4.75rem / 4.25rem).
    const below = () => `top ${window.matchMedia("(min-width: 1024px)").matches ? 76 : 68}px`;

    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        desktop: "(min-width: 1024px)",
      },
      (context) => {
        const { motion, desktop } = context.conditions as { motion: boolean; desktop: boolean };
        if (!motion) return;

        // 1. Abertura: a foto se aproxima devagar e o texto sobe enquanto a página desce.
        const hero = document.querySelector<HTMLElement>("[data-hero]");
        if (hero) {
          gsap.to("[data-hero-photo]", {
            scale: 1.12,
            yPercent: desktop ? 6 : 10,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
          });
          if (desktop) {
            gsap.to("[data-hero-copy]", {
              yPercent: -18,
              opacity: 0.2,
              ease: "none",
              scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
            });
          }
        }

        // 2. A esteira: as linhas se desenham e o casco segue na frente.
        const wakes = gsap.utils.toArray<SVGPathElement>("[data-wake]");
        wakes.forEach((path, i) => {
          const length = path.getTotalLength();
          gsap.fromTo(
            path,
            { strokeDasharray: length, strokeDashoffset: length },
            {
              strokeDashoffset: 0,
              ease: "none",
              scrollTrigger: {
                trigger: path,
                start: "top 92%",
                end: `top ${45 - i * 8}%`,
                scrub: 0.8,
              },
            },
          );
        });
        gsap.fromTo(
          "[data-wake-boat]",
          { xPercent: -260, opacity: 0 },
          {
            xPercent: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: "[data-wake-boat]", start: "top 92%", end: "top 45%", scrub: 0.8 },
          },
        );

        // 3. A travessia: cena presa, da varanda até a água.
        const section = document.querySelector<HTMLElement>("[data-travessia]");
        const stage = document.querySelector<HTMLElement>("[data-travessia-stage]");
        if (section && stage) {
          section.classList.add("is-scene");
          const steps = gsap.utils.toArray<HTMLElement>("[data-travessia-step]");
          gsap.set("[data-travessia-over]", { clipPath: "inset(34% 36% 30% 36%)" });
          // Aproxima a varanda pelo lado esquerdo: o tronco e os pilares ficam no quadro.
          gsap.set("[data-travessia-under]", { scale: 1.45, transformOrigin: "12% 60%" });
          gsap.set(steps, { autoAlpha: 0, y: 24 });
          gsap.set(steps[0], { autoAlpha: 1, y: 0 });

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stage,
              start: below,
              end: desktop ? "+=220%" : "+=170%",
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
            },
          });
          tl.to("[data-travessia-under]", { scale: 1.6, duration: 1 }, 0)
            .to("[data-travessia-over]", { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "power2.inOut" }, 0.18)
            .fromTo("[data-travessia-over-img]", { scale: 1.25 }, { scale: 1, duration: 0.7, ease: "power2.out" }, 0.18)
            .to(steps[0], { autoAlpha: 0, y: -24, duration: 0.12 }, 0.2)
            .to(steps[1], { autoAlpha: 1, y: 0, duration: 0.12 }, 0.3)
            .to(steps[1], { autoAlpha: 0, y: -24, duration: 0.12 }, 0.66)
            .to(steps[2], { autoAlpha: 1, y: 0, duration: 0.12 }, 0.76);

          // Limpa a classe ao desmontar (volta ao layout estático).
          return () => section.classList.remove("is-scene");
        }
      },
    );

    // 4. Destaques: o trilho anda na horizontal enquanto a seção fica presa (só desktop).
    mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
      const pin = document.querySelector<HTMLElement>("[data-track-pin]");
      const track = document.querySelector<HTMLElement>("[data-track]");
      if (!pin || !track) return;
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: below,
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          // Vem antes da travessia na página: mede primeiro.
          refreshPriority: 1,
          anticipatePin: 1,
        },
      });
    });

    // As fotos carregam depois: recalcula as medidas quando a página termina de carregar.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      mm.revert();
    };
  }, []);

  return null;
}

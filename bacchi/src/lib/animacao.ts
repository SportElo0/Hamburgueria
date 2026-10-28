'use client';
// GSAP setup shared by the animated sections. Every section builds its timelines inside gsap.context +
// gsap.matchMedia, so they are reverted on unmount and on route changes, and skipped when the visitor prefers
// reduced motion (the static layout is complete on its own).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useLayoutEffect, type RefObject } from 'react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  // phones resize the viewport when the address bar slides; pinned chapters should not jump with it
  ScrollTrigger.config({ ignoreMobileResize: true });
}

const useIsoLayout = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export interface Condicoes {
  movimento: boolean;
  desktop: boolean;
}

export function useAnimacao<T extends HTMLElement>(ref: RefObject<T | null>, montar: (c: Condicoes, raiz: T) => void | (() => void)) {
  useIsoLayout(() => {
    const raiz = ref.current;
    if (!raiz) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ movimento: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 1024px)' }, (c) => {
        const { movimento, desktop } = c.conditions as unknown as Condicoes;
        if (!movimento) return;
        return montar({ movimento, desktop }, raiz);
      });
    }, raiz);
    return () => ctx.revert();
    // the section builds once; data it reads is static
  }, []);
}

/** Generic entrance for `[data-revelar]` children: a short rise with a mask-like fade. */
export function revelarFilhos(raiz: HTMLElement, seletor = '[data-revelar]') {
  raiz.querySelectorAll<HTMLElement>(seletor).forEach((el) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 28 },
      { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } },
    );
  });
}

export { gsap, ScrollTrigger };

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Arma as revelações de scroll ([data-reveal]) a cada página.
 * Sem JS ou com movimento reduzido, tudo continua visível.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const root = document.documentElement;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)");
    const fold = window.innerHeight;
    elements.forEach((el) => {
      // O que já está na tela ao carregar não é escondido.
      if (el.getBoundingClientRect().top < fold) el.classList.add("is-in");
      else observer.observe(el);
    });
    root.classList.add("reveal-armed");

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}

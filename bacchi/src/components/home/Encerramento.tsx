'use client';
// Closing call: deep navy, the steel clip drawing large and faint behind the line, two clear actions.
import Link from 'next/link';
import { useRef } from 'react';
import { caminhoClip } from '@/lib/clip';
import { gsap, useAnimacao } from '@/lib/animacao';

export function Encerramento() {
  const ref = useRef<HTMLElement>(null);
  useAnimacao(ref, (_c, raiz) => {
    const q = gsap.utils.selector(raiz);
    const p = raiz.querySelector<SVGPathElement>('[data-clip]')!;
    const len = p.getTotalLength();
    gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: raiz, start: 'top 85%', end: 'bottom 70%', scrub: true } });
    gsap.fromTo(q('[data-t]'), { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: raiz, start: 'top 65%', once: true } });
  });

  return (
    <section ref={ref} aria-labelledby="titulo-fim" className="relative overflow-hidden bg-marinho py-28 text-white md:py-40">
      <svg aria-hidden="true" viewBox="-2 -2 30 74" className="pointer-events-none absolute top-1/2 right-[-6%] h-[130%] -translate-y-1/2 opacity-[0.16] md:right-[4%]">
        <path data-clip d={caminhoClip(70, 26)} fill="none" stroke="#c9cfd6" strokeWidth={0.45} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="container-b relative">
        <p data-t className="eyebrow text-azul-claro">Para revendas, distribuidores e empresas</p>
        <h2 id="titulo-fim" data-t className="mt-5 max-w-[16ch] font-display text-[clamp(2.4rem,6vw,5.4rem)] leading-[0.98] font-semibold">
          Encontre a solução certa para o seu negócio.
        </h2>
        <p data-t className="mt-6 max-w-lg text-lg text-white/70">
          Monte a sua lista no catálogo e envie para a equipe comercial, ou fale com o representante da sua região.
        </p>
        <div data-t className="mt-10 flex flex-wrap gap-3">
          <Link href="/produtos" className="btn btn-claro">
            Solicitar orçamento <span className="seta" aria-hidden="true">→</span>
          </Link>
          <Link href="/representantes" className="btn btn-contorno text-white">
            Encontrar representante
          </Link>
        </div>
      </div>
    </section>
  );
}

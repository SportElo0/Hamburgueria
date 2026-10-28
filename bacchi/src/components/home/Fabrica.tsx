'use client';
// Chapter 5: the factory. A full-bleed band of real footage (a mound of clips) moves slower than the page,
// then two rows of production photographs drift in opposite directions.
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { gsap, useAnimacao } from '@/lib/animacao';

const LINHA_1 = [
  { src: '/img/fabrica/arame.webp', alt: 'Bobina de arame de aço na fábrica Bacchi' },
  { src: '/img/fabrica/clips-saindo.webp', alt: 'Clips saindo da máquina' },
  { src: '/img/fabrica/estampo.webp', alt: 'Ferramental da linha de produção' },
  { src: '/img/fabrica/maquinas-2.webp', alt: 'Máquinas de fabricação de clips' },
];
const LINHA_2 = [
  { src: '/img/fabrica/embaladora.webp', alt: 'Máquina embalando clips em saco plástico' },
  { src: '/img/fabrica/embalagem-linha.webp', alt: 'Caixas de clips na linha de embalagem' },
  { src: '/img/fabrica/caixas-amarelas.webp', alt: 'Caixas amarelas de clips Bacchi' },
  { src: '/img/fabrica/caixa-master.webp', alt: 'Caixas master Bacchi prontas para expedição' },
];

export function Fabrica() {
  const ref = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useAnimacao(ref, (_c, raiz) => {
    const q = gsap.utils.selector(raiz);
    gsap.fromTo(q('[data-video-fundo]'), { yPercent: -12 }, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: q('[data-faixa]')[0], start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo(q('[data-titulo-faixa] > span'), { yPercent: 105 }, { yPercent: 0, stagger: 0.1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: q('[data-faixa]')[0], start: 'top 60%', once: true } });
    gsap.fromTo(q('[data-linha="1"]'), { xPercent: 0 }, { xPercent: -14, ease: 'none', scrollTrigger: { trigger: q('[data-fotos]')[0], start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo(q('[data-linha="2"]'), { xPercent: -14 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: q('[data-fotos]')[0], start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const obs = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.15 });
    obs.observe(v);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} aria-labelledby="titulo-fabrica" className="bg-marinho-950 text-white">
      <div data-faixa className="relative h-[78svh] min-h-[460px] overflow-hidden">
        <div data-video-fundo className="absolute -inset-y-[14%] inset-x-0">
          <video ref={video} className="h-full w-full object-cover" muted loop playsInline preload="none" poster="/video/clips-monte.webp" aria-hidden="true">
            <source src="/video/clips-monte.webm" type="video/webm" />
            <source src="/video/clips-monte.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,13,25,.2),rgba(4,13,25,.15)_40%,rgba(4,13,25,.92))]" />
        <div className="container-b relative flex h-full flex-col justify-end pb-14 md:pb-20">
          <p className="eyebrow text-azul-claro">A fábrica</p>
          <h2 id="titulo-fabrica" data-titulo-faixa className="mt-4 max-w-[16ch] font-display text-[clamp(2.4rem,6.4vw,6rem)] leading-[0.95] font-semibold">
            <span className="block overflow-hidden"><span className="inline-block">Do recebimento</span></span>
            <span className="block overflow-hidden"><span className="inline-block">do arame ao</span></span>
            <span className="block overflow-hidden"><span className="inline-block">envio da caixa.</span></span>
          </h2>
        </div>
      </div>

      <div data-fotos className="space-y-3 overflow-hidden py-3 md:space-y-4 md:py-4" aria-label="Fotos da produção">
        {[LINHA_1, LINHA_2].map((linha, k) => (
          <div key={k} data-linha={k + 1} className="flex w-max gap-3 md:gap-4">
            {[...linha, ...linha].map((f, i) => (
              <div key={`${f.src}-${i}`} className="relative h-44 w-64 shrink-0 overflow-hidden rounded-xl md:h-72 md:w-[28rem]">
                <Image src={f.src} alt={i < linha.length ? f.alt : ''} fill sizes="(min-width:768px) 448px, 256px" className="object-cover" />
              </div>
            ))}
          </div>
        ))}
      </div>

    </section>
  );
}

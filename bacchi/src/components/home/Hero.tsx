'use client';
// Opening: a short brand reveal (once per visit), then the real macro footage of a Bacchi clip opens from a
// single steel line, like wire, into the full frame. The title rises word by word. While the next chapter
// slides over it, the hero sinks back (scale + dim), so the page reads as one continuous piece.
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { gsap, useAnimacao } from '@/lib/animacao';

const TITULO = ['A', 'qualidade', 'está', 'nos', 'detalhes.'];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [tocando, setTocando] = useState(true);

  useAnimacao(ref, ({ desktop }, raiz) => {
    // the inline script in the layout marks the first page view of the visit with `js-intro`
    const html = document.documentElement;
    const primeiraVez = html.classList.contains('js-intro');
    html.classList.remove('js-intro');
    const q = gsap.utils.selector(raiz);
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    if (primeiraVez) {
      tl.set(q('[data-intro]'), { visibility: 'visible' })
        .fromTo(q('[data-intro-logo]'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power3.inOut' })
        .fromTo(q('[data-intro-ano]'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.3')
        .to(q('[data-intro]'), { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '+=0.25');
    } else {
      tl.set(q('[data-intro]'), { autoAlpha: 0 });
    }
    tl.fromTo(q('[data-video]'), { clipPath: 'inset(49.6% 0% 49.6% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' }, primeiraVez ? '-=0.55' : 0)
      .fromTo(q('[data-video] video, [data-video] img'), { scale: 1.25 }, { scale: 1.06, duration: 2.2 }, '<')
      // y: 0 clears the CSS pre-state (translateY(110%)), which GSAP would otherwise read in as a pixel offset
      .fromTo(q('[data-palavra]'), { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1.1, stagger: 0.07 }, '-=1.1')
      .fromTo(q('[data-sub]'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, '-=0.7')
      .fromTo(q('[data-rodape]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, '-=0.5');

    // the hero recedes while the next chapter covers it
    gsap.to(q('[data-palco]'), {
      scale: desktop ? 0.9 : 0.94,
      autoAlpha: 0.35,
      ease: 'none',
      scrollTrigger: { trigger: raiz, start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to(q('[data-conteudo]'), { yPercent: -18, ease: 'none', scrollTrigger: { trigger: raiz, start: 'top top', end: 'bottom top', scrub: true } });
  });

  // pause the footage when it is off screen (and let people pause it)
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) v.pause();
      else if (tocando) v.play().catch(() => {});
    });
    obs.observe(v);
    return () => obs.disconnect();
  }, [tocando]);

  // the button follows the video itself; with reduced motion the footage starts paused
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const pausou = () => setTocando(false);
    const tocou = () => setTocando(true);
    v.addEventListener('pause', pausou);
    v.addEventListener('play', tocou);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) v.pause();
    return () => {
      v.removeEventListener('pause', pausou);
      v.removeEventListener('play', tocou);
    };
  }, []);

  const alternar = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setTocando(true);
    } else {
      v.pause();
      setTocando(false);
    }
  };

  return (
    <section ref={ref} aria-label="Bacchi, desde 1937" className="sticky top-0 h-[100svh] min-h-[560px] overflow-hidden bg-marinho-950 text-white">
      <div data-palco className="absolute inset-0 origin-[50%_30%] will-change-transform">
        <div data-video className="absolute inset-0 overflow-hidden">
          <video
            ref={video}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/video/clips-macro.webp"
            aria-hidden="true"
          >
            <source src="/video/clips-macro.webm" type="video/webm" />
            <source src="/video/clips-macro.mp4" type="video/mp4" />
          </video>
          {/* steel-blue grade over the footage: keeps white text legible; the clip itself stays recognisable */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,13,25,.55)_0%,rgba(4,13,25,.15)_35%,rgba(4,13,25,.35)_60%,rgba(4,13,25,.92)_100%)]" />
          <div className="absolute inset-0 mix-blend-color bg-marinho/45" />
        </div>

        <div data-conteudo className="container-b relative flex h-full flex-col justify-end pb-24 md:pb-28">
          <p data-sub className="eyebrow text-azul-claro">Indústria brasileira · desde 1937</p>
          <h1 className="mt-5 max-w-[14ch] font-display text-[clamp(2.9rem,8.6vw,8.4rem)] leading-[0.92] font-semibold">
            <span className="sr-only">A qualidade está nos detalhes.</span>
            <span aria-hidden="true" className="flex flex-wrap gap-x-[0.25em]">
              {TITULO.map((p) => (
                <span key={p} className="inline-block overflow-hidden pb-[0.08em]">
                  <span data-palavra className="inline-block">{p}</span>
                </span>
              ))}
            </span>
          </h1>
          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p data-sub className="max-w-md text-[1.05rem] leading-relaxed text-white/80 md:text-lg">
              Desde 1937, desenvolvendo produtos para escritórios, papelarias e aplicações profissionais.
            </p>
            <div data-sub className="flex flex-wrap gap-3">
              <Link href="/produtos" className="btn btn-primario">
                Explorar produtos <span className="seta" aria-hidden="true">→</span>
              </Link>
              <Link href="/sobre" className="btn btn-contorno text-white">
                Conhecer a Bacchi
              </Link>
            </div>
          </div>
        </div>

        <div data-rodape className="absolute inset-x-0 bottom-0">
          <div className="container-b flex items-center justify-between border-t border-white/15 py-4 text-xs text-white/60">
            <span className="hidden sm:inline">Clips · Grampos · Alfinetes · Arquivo e escritório</span>
            <span className="flex items-center gap-3">
              <span className="relative block h-8 w-px overflow-hidden bg-white/20" aria-hidden="true">
                <span className="absolute inset-x-0 top-0 h-3 animate-[descer_1.8s_var(--ease-industrial)_infinite] bg-white" />
              </span>
              Role para conhecer
            </span>
            <button type="button" onClick={alternar} className="rounded-full border border-white/25 px-3 py-1.5 hover:border-white/60" aria-pressed={!tocando}>
              {tocando ? 'Pausar vídeo' : 'Tocar vídeo'}
            </button>
          </div>
        </div>
      </div>

      {/* brand reveal, first visit of the session only (hidden for reduced motion and without JS) */}
      <div data-intro className="invisible absolute inset-0 z-20 grid place-items-center bg-marinho-950">
        <div className="text-center">
          <div data-intro-logo className="relative mx-auto h-14 w-[230px] md:h-20 md:w-[320px]">
            <Image src="/img/marca/logo-branco.png" alt="" fill sizes="320px" className="object-contain" priority />
          </div>
          <p data-intro-ano className="eyebrow mt-6 text-white/60">Desde 1937</p>
        </div>
      </div>
    </section>
  );
}

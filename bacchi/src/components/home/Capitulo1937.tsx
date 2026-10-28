'use client';
// Chapter 3: 1937. The chapter pins and the scroll drives it, on phones as on desktop: the giant year fills from
// outline to solid, the four steps of the official history replace each other, and the photographs move from
// the black-and-white archive to colour (the same scenes, then and now). Phones stack text over photo; desktop
// alternates sides. Without motion it is a plain vertical sequence.
import Image from 'next/image';
import { useRef } from 'react';
import { HISTORIA } from '@/data/empresa';
import { gsap, useAnimacao } from '@/lib/animacao';

const PASSOS = [
  { marca: '1937', titulo: 'A fundação', texto: HISTORIA.fundacao, foto: '/img/historia/historica-02.webp', cor: null, alt: 'Foto histórica do interior da fábrica Bacchi' },
  { marca: 'Santo André', titulo: 'As primeiras instalações', texto: 'As primeiras instalações da Bacchi ficavam em Santo André, na Grande São Paulo.', foto: '/img/historia/cartao-santo-andre-pb.webp', cor: '/img/historia/cartao-santo-andre.webp', alt: 'Cartão antigo da Indústria de Artefatos de Ferro Bacchi, em Santo André' },
  { marca: 'Fabricação', titulo: 'Do arame à caixa', texto: HISTORIA.processo, foto: '/img/fabrica/maquinas-pb.webp', cor: '/img/fabrica/maquinas.webp', alt: 'Linha de máquinas de fabricação de clips da Bacchi' },
  { marca: 'Hoje', titulo: 'Em Cotia, para todo o Brasil', texto: 'Com estrutura e agilidade para atender com rapidez todo o mercado brasileiro: distribuidores, revendedores, papelarias e corporações.', foto: '/img/fabrica/caixas-fileira.webp', cor: null, alt: 'Caixas de clips Bacchi na linha de embalagem' },
];

export function Capitulo1937() {
  const ref = useRef<HTMLElement>(null);

  useAnimacao(ref, (_c, raiz) => {
    const q = gsap.utils.selector(raiz);
    const passos = q('[data-passo]');
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: q('[data-palco]')[0],
        start: 'top top',
        // long and heavy on purpose: each step takes about a screen and a half of scrolling
        end: `+=${passos.length * 160}%`,
        pin: true,
        scrub: 1.2,
        anticipatePin: 1,
        // and the chapter settles on each step instead of sliding past it
        snap: { snapTo: [0, ...passos.slice(1).map((_, i) => (i + 1.45) / passos.length), 1], duration: { min: 0.35, max: 0.9 }, delay: 0.12, ease: 'power2.inOut' },
      },
    });
    // the year fills, left to right, across the whole chapter
    tl.fromTo(q('[data-ano-cheio]'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: passos.length }, 0);
    tl.fromTo(q('[data-ano]'), { xPercent: 4 }, { xPercent: -4, duration: passos.length }, 0);
    passos.forEach((p, i) => {
      const foto = p.querySelector('[data-foto]');
      const cor = p.querySelector('[data-cor]');
      if (i > 0) {
        tl.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, i - 0.15);
        tl.fromTo(p.querySelectorAll('[data-t]'), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.35, ease: 'power2.out' }, i - 0.1);
        tl.fromTo(foto, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.45, ease: 'power2.inOut' }, i - 0.2);
      }
      tl.fromTo(foto?.querySelector('img') ?? foto, { scale: 1.12 }, { scale: 1, duration: 1.1 }, Math.max(0, i - 0.2));
      if (cor) tl.fromTo(cor, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45 }, i + 0.35);
      if (i < passos.length - 1) {
        tl.to(p.querySelectorAll('[data-t]'), { y: -30, autoAlpha: 0, duration: 0.25, stagger: 0.03 }, i + 0.75);
        // the outgoing photo leaves while the next one wipes in (on desktop they sit on opposite sides)
        tl.to(foto, { autoAlpha: 0, duration: 0.3 }, i + 0.85);
      }
    });
    tl.to(q('[data-progresso]'), { scaleX: 1, duration: passos.length }, 0);
  });

  return (
    <section ref={ref} aria-labelledby="titulo-1937" className="relative bg-marinho-950 text-white">
      <div data-palco className="relative overflow-hidden movimento:h-[100svh]">
        {/* the year */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-16 select-none movimento:top-1/2 movimento:-translate-y-1/2">
          <div data-ano className="relative mx-auto w-fit font-display text-[clamp(7rem,30vw,30rem)] leading-none font-extrabold tracking-[-0.06em]">
            <span className="text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,.18)]">1937</span>
            <span data-ano-cheio className="absolute inset-0 opacity-35 bg-[linear-gradient(180deg,#e9edf2,#8b95a1_55%,#3d4a5a)] bg-clip-text text-transparent">
              1937
            </span>
          </div>
        </div>

        <h2 id="titulo-1937" className="sr-only">
          A história da Bacchi desde 1937
        </h2>

        <div className="relative movimento:absolute movimento:inset-0">
          {PASSOS.map((p, i) => (
            <article
              key={p.titulo}
              data-passo
              className={`container-b grid gap-6 estatico:py-16 estatico:first:pt-[42vw] sm:estatico:first:pt-72 lg:grid-cols-12 lg:items-center lg:gap-8 lg:estatico:py-24 movimento:absolute movimento:inset-0 movimento:content-center movimento:pt-16 movimento:pb-24 lg:movimento:py-0 ${i > 0 ? 'movimento:invisible' : ''}`}
            >
              <div className={`lg:col-span-5 ${i % 2 ? 'lg:order-2 lg:col-start-8' : ''}`}>
                <p data-t className="eyebrow text-azul-claro">{p.marca}</p>
                <h3 data-t className="mt-3 font-display text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.02] font-semibold lg:mt-4">
                  {p.titulo}
                </h3>
                <p data-t className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-white/75 md:text-[1.05rem] lg:mt-5">
                  {p.texto}
                </p>
              </div>
              <div className={`lg:col-span-6 ${i % 2 ? 'lg:order-1 lg:col-start-1' : 'lg:col-start-7'}`}>
                {/* phones give the photo a third of the screen so text and photo share one pinned view */}
                <div data-foto className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-marinho shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)] movimento:aspect-auto movimento:h-[30svh] lg:movimento:aspect-[4/3] lg:movimento:h-auto">
                  <Image src={p.foto} alt={p.alt} fill sizes="(min-width:1024px) 48vw, 92vw" className="object-cover" />
                  {p.cor && (
                    <div data-cor className="absolute inset-0 opacity-0 estatico:opacity-100">
                      <Image src={p.cor} alt="" fill sizes="(min-width:1024px) 48vw, 92vw" className="object-cover" />
                    </div>
                  )}
                  {p.cor && <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-3 py-1 text-xs text-white/85 backdrop-blur">Arquivo e hoje</span>}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden movimento:block">
          <div className="container-b pb-12 lg:pb-8">
            <div className="h-px bg-white/15">
              <div data-progresso className="h-px origin-left scale-x-0 bg-azul-claro" />
            </div>
            <p className="mt-3 text-xs text-white/45">Fotos históricas do acervo Bacchi publicadas no site atual.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';
// Chapter 3: 1937. On desktop the chapter pins and the scroll drives it: the giant year fills from outline to
// solid, the four steps of the official history replace each other, and the photographs move from the
// black-and-white archive to colour (the same scenes, then and now). On phones it is a vertical sequence
// with the same photos; nothing is pinned.
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

  useAnimacao(ref, ({ desktop }, raiz) => {
    const q = gsap.utils.selector(raiz);
    if (desktop) {
      const passos = q('[data-passo]');
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: q('[data-palco]')[0], start: 'top top', end: `+=${passos.length * 90}%`, pin: true, scrub: 0.6, anticipatePin: 1 },
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
          // the steps alternate sides, so the outgoing photo leaves while the next one wipes in
          tl.to(foto, { autoAlpha: 0, duration: 0.3 }, i + 0.85);
        }
      });
      tl.to(q('[data-progresso]'), { scaleX: 1, duration: passos.length }, 0);
    } else {
      q('[data-passo]').forEach((p) => {
        gsap.fromTo(p.querySelectorAll('[data-t]'), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 80%', once: true } });
        const cor = p.querySelector('[data-cor]');
        if (cor) gsap.fromTo(cor, { autoAlpha: 0 }, { autoAlpha: 1, ease: 'none', scrollTrigger: { trigger: p, start: 'top 60%', end: 'bottom 60%', scrub: true } });
      });
      gsap.fromTo(q('[data-ano-cheio]'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none', scrollTrigger: { trigger: raiz, start: 'top 70%', end: 'top 10%', scrub: true } });
    }
  });

  return (
    <section ref={ref} aria-labelledby="titulo-1937" className="relative bg-marinho-950 text-white">
      <div data-palco className="relative overflow-hidden lg:h-[100svh]">
        {/* the year */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-16 select-none lg:top-1/2 lg:-translate-y-1/2">
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

        <div className="relative lg:absolute lg:inset-0">
          {PASSOS.map((p, i) => (
            <article
              key={p.titulo}
              data-passo
              className={`container-b grid items-center gap-8 py-16 first:pt-[42vw] sm:first:pt-72 lg:absolute lg:inset-0 lg:grid-cols-12 lg:py-0 lg:first:pt-0 ${i > 0 ? 'lg:invisible' : ''}`}
            >
              <div className={`lg:col-span-5 ${i % 2 ? 'lg:order-2 lg:col-start-8' : ''}`}>
                <p data-t className="eyebrow text-azul-claro">{p.marca}</p>
                <h3 data-t className="mt-4 font-display text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.02] font-semibold">
                  {p.titulo}
                </h3>
                <p data-t className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-white/75">
                  {p.texto}
                </p>
              </div>
              <div className={`lg:col-span-6 ${i % 2 ? 'lg:order-1 lg:col-start-1' : 'lg:col-start-7'}`}>
                <div data-foto className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-marinho shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)]">
                  <Image src={p.foto} alt={p.alt} fill sizes="(min-width:1024px) 48vw, 92vw" className="object-cover" />
                  {p.cor && (
                    <div data-cor className="absolute inset-0 opacity-0 lg:opacity-0">
                      <Image src={p.cor} alt="" fill sizes="(min-width:1024px) 48vw, 92vw" className="object-cover" />
                    </div>
                  )}
                  {p.cor && <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-3 py-1 text-xs text-white/85 backdrop-blur">Arquivo e hoje</span>}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden lg:block">
          <div className="container-b pb-8">
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

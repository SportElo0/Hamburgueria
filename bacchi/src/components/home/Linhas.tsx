'use client';
// Chapter 4: the product families. The page turns back to paper white, the colour of the studio photos,
// so each product sits on the page itself. On desktop the chapter pins and slides sideways, one family per
// screen, each photo easing in slower than its text (depth without zoom). On phones: a vertical sequence.
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { ACABAMENTOS, FAMILIAS, produtosDaFamilia } from '@/data/catalogo';
import { gsap, useAnimacao } from '@/lib/animacao';

const DESTAQUE: Record<string, { foto: string; alt: string; detalhe: string }> = {
  clips: { foto: '/img/produtos/clips-niquelado.webp', alt: 'Clip Bacchi niquelado em fundo claro', detalhe: '13 tamanhos · 4 acabamentos · Linha Leve' },
  grampos: { foto: '/img/produtos/grampos-tot.webp', alt: 'Grampos Bacchi galvanizados e tipo cobreado', detalhe: '37 modelos em 12 linhas · trançados nº 1 e nº 2' },
  alfinetes: { foto: '/img/produtos/alfinetes-seguranca.webp', alt: 'Alfinetes de segurança Bacchi latonado e niquelado', detalhe: 'Costura · segurança · etiquetas · mapas' },
  escritorio: { foto: '/img/produtos/colchetes.webp', alt: 'Colchetes Bacchi de aço estanhado', detalhe: 'Encadernadores · colchetes · pranchetas · extratores · percevejos' },
};

export function Linhas() {
  const ref = useRef<HTMLElement>(null);

  useAnimacao(ref, ({ desktop }, raiz) => {
    const q = gsap.utils.selector(raiz);
    if (desktop) {
      const trilho = q('[data-trilho]')[0] as HTMLElement;
      const paineis = q('[data-painel]');
      const distancia = () => trilho.scrollWidth - window.innerWidth;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: q('[data-palco]')[0], start: 'top top', end: () => `+=${distancia()}`, pin: true, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      tl.to(trilho, { x: () => -distancia() }, 0);
      paineis.forEach((p, i) => {
        if (i === 0) return;
        const pos = (i - 1) / (paineis.length - 1);
        tl.fromTo(p.querySelector('[data-foto]'), { xPercent: 18 }, { xPercent: 0, duration: 1 / (paineis.length - 1) }, pos);
      });
      tl.fromTo(q('[data-barra]'), { scaleX: 0 }, { scaleX: 1 }, 0);
    } else {
      q('[data-painel]').forEach((p) => {
        gsap.fromTo(p.querySelectorAll('[data-t]'), { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 82%', once: true } });
        gsap.fromTo(p.querySelector('[data-foto]'), { clipPath: 'inset(12% 12% 12% 12% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'power2.out', scrollTrigger: { trigger: p, start: 'top 85%', end: 'top 35%', scrub: true } });
      });
    }
  });

  return (
    <section ref={ref} aria-labelledby="titulo-linhas" className="bg-papel">
      <div data-palco className="relative lg:h-[100svh] lg:overflow-hidden">
        <div className="container-b pt-24 pb-6 lg:absolute lg:inset-x-0 lg:top-0 lg:z-10 lg:pt-28">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-azul">Linhas de produtos</p>
              <h2 id="titulo-linhas" className="mt-3 font-display text-[clamp(2rem,4vw,3.4rem)] leading-none font-semibold">
                Quatro famílias, uma fábrica.
              </h2>
            </div>
            <Link href="/produtos" className="link-b hidden shrink-0 font-semibold text-azul md:inline">
              Catálogo completo →
            </Link>
          </div>
          <div className="mt-6 hidden h-px bg-linha lg:block">
            <div data-barra className="h-px origin-left bg-azul" />
          </div>
        </div>

        <div data-trilho className="flex flex-col lg:h-full lg:w-max lg:flex-row">
          {FAMILIAS.map((f, i) => {
            const d = DESTAQUE[f.id];
            const linhas = produtosDaFamilia(f.id);
            const todos = [...new Set(linhas.flatMap((p) => p.acabamentos))];
            const acabamentos = todos.slice(0, 4);
            return (
              <article key={f.id} data-painel className="container-b grid items-center gap-8 py-12 lg:h-full lg:w-screen lg:max-w-none lg:grid-cols-12 lg:pt-56 lg:pb-12">
                <div className="lg:col-span-5 lg:pl-[max(0px,calc((100vw-1320px)/2))]">
                  <p data-t className="font-display text-sm font-semibold text-aco tabular-nums">0{i + 1} / 0{FAMILIAS.length}</p>
                  <h3 data-t className="mt-3 font-display text-[clamp(2.6rem,min(6vw,8.5svh),5.6rem)] leading-[0.95] font-semibold tracking-[-0.04em]">
                    {f.nome}
                  </h3>
                  <p data-t className="mt-5 max-w-sm text-lg leading-relaxed text-tinta-2">{f.resumo}</p>
                  <p data-t className="mt-3 text-sm text-aco lg:[@media(max-height:820px)]:hidden">{d.detalhe}</p>
                  <ul data-t className="mt-6 flex flex-wrap gap-2 lg:[@media(max-height:820px)]:hidden" aria-label="Acabamentos">
                    {acabamentos.map((a) => (
                      <li key={a} className="flex items-center gap-2 rounded-full border border-linha bg-white/60 px-3 py-1.5 text-xs text-tinta-2">
                        <span className="amostra !h-3.5 !w-3.5" style={{ background: ACABAMENTOS[a].amostra }} />
                        {ACABAMENTOS[a].nome}
                      </li>
                    ))}
                    {todos.length > acabamentos.length && <li className="self-center text-xs text-aco">+{todos.length - acabamentos.length} no catálogo</li>}
                  </ul>
                  <ul data-t className="mt-7 space-y-1.5 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:space-y-0">
                    {linhas.map((p) => (
                      <li key={p.slug}>
                        <Link href={`/produtos/${p.slug}`} className="group flex items-center justify-between gap-4 border-b border-linha py-2.5 text-[0.98rem] font-medium hover:text-azul">
                          {p.nome}
                          <span className="text-aco transition-transform duration-300 group-hover:translate-x-1 group-hover:text-azul" aria-hidden="true">
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="lg:col-span-6 lg:col-start-7 lg:pr-[max(0px,calc((100vw-1320px)/2))]">
                  <Link href={`/produtos?familia=${f.id}`} className="group block" aria-label={`Ver ${f.nome} no catálogo`}>
                    <div data-foto className="relative aspect-square overflow-hidden rounded-3xl bg-papel lg:aspect-[5/4]">
                      <Image src={d.foto} alt={d.alt} fill sizes="(min-width:1024px) 46vw, 92vw" className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-saida)] group-hover:scale-[1.04]" />
                    </div>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

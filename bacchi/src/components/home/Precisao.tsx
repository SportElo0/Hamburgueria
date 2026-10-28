'use client';
// Chapter 2, on paper white. It slides over the hero (rounded top edge), then pins as one scene driven by the
// scroll: a statement fills in word by word, lifts away, and the thirteen clips of the catalogue draw themselves
// as technical lines at their real proportion (height × width from the table); the numbers then count up from
// the catalogue data itself. Without motion both parts simply follow each other.
import Link from 'next/link';
import { useRef, useState } from 'react';
import { PRODUTOS } from '@/data/catalogo';
import { REPRESENTANTES } from '@/data/representantes';
import { TOTAL_MODELOS } from '@/lib/cotacao';
import { caminhoClip } from '@/lib/clip';
import { gsap, useAnimacao } from '@/lib/animacao';

const CLIPS = PRODUTOS.find((p) => p.slug === 'clips')!.variacoes.map((v) => ({ modelo: v.modelo, altura: +v.valores.altura, largura: +v.valores.largura })).reverse();
const FRASE = 'Treze tamanhos de clips, do nº 5 ao 12/0. Grampos para cada aplicação. Alfinetes, colchetes, encadernadores. Em aço, com o cuidado de quem fabrica desde 1937.';
const GAP = 6;
// drawing geometry: clips stand on a common baseline, smallest on the left
const ORDEM = CLIPS.slice().reverse();
const desenho = ORDEM.map((c, i) => ({ ...c, x: ORDEM.slice(0, i).reduce((s, d) => s + d.largura + GAP, 0) }));
const largura = desenho.at(-1)!.x + desenho.at(-1)!.largura;
const alturaMax = Math.max(...CLIPS.map((c) => c.altura));

export function Precisao() {
  const ref = useRef<HTMLElement>(null);
  const [foco, setFoco] = useState<number | null>(null);
  const ufs = new Set(REPRESENTANTES.map((r) => r.uf)).size;
  const dados = [
    { valor: 1937, rotulo: 'ano de fundação', ano: true },
    { valor: PRODUTOS.length, rotulo: 'linhas de produtos no catálogo' },
    { valor: TOTAL_MODELOS, rotulo: 'modelos e tamanhos com ficha técnica' },
    { valor: ufs, rotulo: 'estados com representante comercial' },
  ];


  useAnimacao(ref, (_c, raiz) => {
    const q = gsap.utils.selector(raiz);
    const palavras = q('[data-p]');
    const tracos = q<SVGPathElement>('[data-traco]');
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: raiz, start: 'top top', end: '+=360%', pin: true, scrub: 1, anticipatePin: 1 },
    });
    // 1. the statement fills in, word by word
    tl.fromTo(q('[data-cena="frase"] .eyebrow'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0);
    tl.fromTo(palavras, { opacity: 0.14 }, { opacity: 1, duration: 0.2, stagger: 1.5 / palavras.length }, 0.1);
    // 2. it lifts away and the drawing takes the stage
    tl.to(q('[data-cena="frase"]'), { autoAlpha: 0, y: -60, duration: 0.4, ease: 'power2.in' }, 2);
    tl.fromTo(q('[data-cena="desenho"]'), { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 2.2);
    // 3. the thirteen clips draw themselves, small to large
    tracos.forEach((p) => {
      const len = p.getTotalLength();
      tl.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.5, ease: 'power1.inOut' }, 2.5 + desenho.findIndex((c) => p.dataset.traco === c.modelo) * 0.08);
    });
    tl.fromTo(q('[data-num-clip]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, stagger: 0.08 }, 2.7);
    // 4. the numbers count up from the catalogue data (and back, when scrolling up)
    q('[data-contador]').forEach((el, i) => {
      const alvo = Number(el.getAttribute('data-contador'));
      const ano = el.hasAttribute('data-ano');
      const obj = { v: ano ? 1900 : 0 };
      tl.fromTo(el.parentElement, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.25 }, 3.5 + i * 0.1);
      tl.to(obj, { v: alvo, duration: 0.7, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('pt-BR').replace(ano ? '.' : '', ''); } }, 3.5 + i * 0.1);
    });
    tl.to({}, { duration: 0.5 });
  });

  return (
    <section
      ref={ref}
      className="relative z-10 -mt-8 rounded-t-[2rem] bg-papel shadow-[0_-30px_60px_-20px_rgba(4,13,25,.5)] md:-mt-12 md:rounded-t-[3rem] estatico:pt-24 estatico:pb-24 md:estatico:pt-36 md:estatico:pb-32 movimento:h-[100svh] movimento:overflow-hidden"
    >
      <div className="container-b relative movimento:h-full">
        <div data-cena="frase" className="movimento:absolute movimento:inset-x-[clamp(1rem,4vw,3rem)] movimento:top-1/2 movimento:-translate-y-1/2">
          <p className="eyebrow text-azul">Precisão em aço</p>
          <p className="mt-6 max-w-[22ch] font-display text-[clamp(2rem,5vw,4.4rem)] leading-[1.04] font-semibold tracking-[-0.035em] text-tinta md:max-w-[24ch]">
            {FRASE.split(' ').map((p, i) => (
              <span key={i} data-p className="inline">
                {p}{' '}
              </span>
            ))}
          </p>
        </div>

        <div data-cena="desenho" className="estatico:mt-16 md:estatico:mt-24 movimento:invisible movimento:flex movimento:h-full movimento:flex-col movimento:justify-center movimento:pt-16 movimento:pb-12">
          <figure>
            <svg
              viewBox={`-2 -8 ${largura + 4} ${alturaMax + 24}`}
              className="h-auto w-full movimento:h-[30svh] lg:movimento:h-[38svh]"
              role="img"
              aria-label="Desenho dos treze clips Bacchi, do nº 5 (13 × 4 mm) ao 12/0 (70 × 26 mm), na proporção real entre os tamanhos"
            >
              <line x1={-2} x2={largura + 2} y1={alturaMax} y2={alturaMax} stroke="var(--color-aco-claro)" strokeWidth={0.3} />
              {desenho.map((c, i) => (
                <g
                  key={c.modelo}
                  transform={`translate(${c.x} ${alturaMax - c.altura})`}
                  onMouseEnter={() => setFoco(i)}
                  onMouseLeave={() => setFoco(null)}
                  className="cursor-default"
                >
                  <rect x={-GAP / 2} y={-6} width={c.largura + GAP} height={c.altura + 22} fill="transparent" />
                  <path
                    data-traco={c.modelo}
                    d={caminhoClip(c.altura, c.largura)}
                    fill="none"
                    stroke={foco === i ? 'var(--color-azul)' : 'var(--color-tinta-2)'}
                    strokeWidth={0.55}
                    className="[stroke-width:0.9] md:[stroke-width:0.55]"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{ transition: 'stroke .25s' }}
                  />
                  <text data-num-clip x={c.largura / 2} y={c.altura + 9} textAnchor="middle" fontSize={3.4} fontWeight={700} fill={foco === i ? 'var(--color-azul)' : 'var(--color-tinta)'} fontFamily="var(--font-sans)">
                    {c.modelo.replace(/ \(.*\)/, '')}
                  </text>
                </g>
              ))}
            </svg>
            <figcaption className="mt-5 flex flex-col gap-2 text-sm text-tinta-2 sm:flex-row sm:items-center sm:justify-between">
              <span aria-live="polite">
                {foco === null ? (
                  <>Desenho feito com as medidas do catálogo (altura × largura): os treze clips na proporção real entre si.</>
                ) : (
                  <>
                    Clips nº <strong className="text-tinta">{desenho[foco].modelo}</strong>: {desenho[foco].altura} mm de altura × {desenho[foco].largura} mm de largura
                  </>
                )}
              </span>
              <Link href="/produtos/clips" className="link-b shrink-0 font-semibold text-azul">
                Ver a tabela completa dos clips →
              </Link>
            </figcaption>
          </figure>

          <div className="regua mt-12 estatico:md:mt-28 movimento:mt-8 lg:movimento:mt-12" />
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4 estatico:mt-12 estatico:gap-y-10">
            {dados.map((d) => (
              <div key={d.rotulo} className="flex flex-col-reverse">
                <dt className="mt-2 text-sm leading-snug text-tinta-2">{d.rotulo}</dt>
                <dd className="font-display text-[clamp(2.4rem,5.5vw,4.5rem)] leading-none font-semibold tracking-[-0.04em] text-tinta tabular-nums" data-contador={d.valor} {...(d.ano ? { 'data-ano': '' } : {})}>
                  {d.ano ? d.valor : d.valor.toLocaleString('pt-BR')}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

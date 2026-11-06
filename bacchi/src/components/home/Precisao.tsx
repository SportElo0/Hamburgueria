'use client';
// Chapter 2, on paper white. It slides over the hero (rounded top edge) and the thirteen clips of the catalogue
// draw themselves as the page scrolls, small to large, as technical lines at their real proportion (height ×
// width from the table). The numbers below are counted from the catalogue data itself.
import Link from 'next/link';
import { useRef, useState } from 'react';
import { PRODUTOS } from '@/data/catalogo';
import { REPRESENTANTES } from '@/data/representantes';
import { TOTAL_MODELOS } from '@/lib/cotacao';
import { caminhoClip } from '@/lib/clip';
import { gsap, revelarFilhos, useAnimacao } from '@/lib/animacao';

const CLIPS = PRODUTOS.find((p) => p.slug === 'clips')!.variacoes.map((v) => ({ modelo: v.modelo, altura: +v.valores.altura, largura: +v.valores.largura })).reverse();
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


  useAnimacao(ref, ({ desktop }, raiz) => {
    const q = gsap.utils.selector(raiz);
    // the clips draw themselves with the scroll, small to large (scrolling back undraws them)
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: q('[data-desenho]')[0], start: desktop ? 'top 85%' : 'top 90%', end: desktop ? 'bottom 55%' : 'bottom 45%', scrub: 0.8 } });
    raiz.querySelectorAll<SVGPathElement>('[data-traco]').forEach((p, i) => {
      const len = p.getTotalLength();
      tl.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1 }, i * 0.35);
    });
    tl.fromTo(q('[data-num-clip]'), { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.35 }, 0.4);
    // counters
    q('[data-contador]').forEach((el) => {
      const alvo = Number(el.getAttribute('data-contador'));
      const ano = el.hasAttribute('data-ano');
      const obj = { v: ano ? 1900 : 0 };
      gsap.to(obj, {
        v: alvo,
        duration: 1.6,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => {
          el.textContent = Math.round(obj.v).toLocaleString('pt-BR').replace(ano ? '.' : '', '');
        },
      });
    });
    revelarFilhos(raiz);
  });

  return (
    <section ref={ref} className="relative z-10 -mt-8 rounded-t-[2rem] bg-papel pt-24 pb-24 shadow-[0_-30px_60px_-20px_rgba(4,13,25,.5)] md:-mt-12 md:rounded-t-[3rem] md:pt-36 md:pb-32">
      <div className="container-b">
        <p className="eyebrow text-azul" data-revelar>Precisão em aço</p>
        <h2 className="mt-5 max-w-[20ch] font-display text-[clamp(1.9rem,4vw,3.4rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-tinta" data-revelar>
          Treze tamanhos de clips, do nº 5 ao 12/0.
        </h2>

        <figure className="mt-12 md:mt-16" data-desenho>
          <div className="relative">
            <svg
              viewBox={`-2 -8 ${largura + 4} ${alturaMax + 24}`}
              className="h-auto w-full"
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
                    data-traco
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
          </div>
          <figcaption className="mt-6 flex flex-col gap-2 text-sm text-tinta-2 sm:flex-row sm:items-center sm:justify-between">
            <span aria-live="polite">
              {foco === null ? (
                <>Desenho feito com as medidas do catálogo (altura × largura): os treze clips na proporção real entre si. Passe o mouse para ver cada um.</>
              ) : (
                <>
                  Clips nº <strong className="text-tinta">{desenho[foco].modelo}</strong>: {desenho[foco].altura} mm de altura × {desenho[foco].largura} mm de largura
                </>
              )}
            </span>
            <Link href="/produtos/clips" className="link-b font-semibold text-azul">
              Ver a tabela completa dos clips →
            </Link>
          </figcaption>
        </figure>

        <div className="regua mt-20 md:mt-28" />
        <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {dados.map((d) => (
            <div key={d.rotulo} data-revelar className="flex flex-col-reverse">
              <dt className="mt-2 text-sm leading-snug text-tinta-2">{d.rotulo}</dt>
              <dd className="font-display text-[clamp(2.6rem,5.5vw,4.5rem)] leading-none font-semibold tracking-[-0.04em] text-tinta tabular-nums" data-contador={d.valor} {...(d.ano ? { 'data-ano': '' } : {})}>
                {d.ano ? d.valor : d.valor.toLocaleString('pt-BR')}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

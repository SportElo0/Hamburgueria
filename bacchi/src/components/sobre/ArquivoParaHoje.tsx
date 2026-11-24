'use client';
// "Process" on the About page: the official text beside three scenes the current site publishes twice, in the
// black-and-white archive look and in colour. Scrolling turns each one from archive to today.
import Image from 'next/image';
import { useRef } from 'react';
import { HISTORIA } from '@/data/empresa';
import { gsap, revelarFilhos, useAnimacao } from '@/lib/animacao';

const CENAS = [
  { pb: '/img/historia/papelaria-antiga-pb.webp', cor: '/img/historia/papelaria-antiga.webp', alt: 'Embalagens antigas de alfinetes e grampos Bacchi' },
  { pb: '/img/historia/embalagens-antigas-pb.webp', cor: '/img/historia/embalagens-antigas.webp', alt: 'Caixas antigas de alfinetes de segurança Bacchi' },
  { pb: '/img/fabrica/maquinas-pb.webp', cor: '/img/fabrica/maquinas.webp', alt: 'Linha de máquinas de fabricação de clips' },
];

export function ArquivoParaHoje() {
  const ref = useRef<HTMLElement>(null);
  useAnimacao(ref, (_c, raiz) => {
    raiz.querySelectorAll<HTMLElement>('[data-cena]').forEach((cena) => {
      gsap.fromTo(cena.querySelector('[data-cor]'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none', scrollTrigger: { trigger: cena, start: 'top 75%', end: 'bottom 45%', scrub: true } });
    });
    revelarFilhos(raiz);
  });
  return (
    <section ref={ref} aria-labelledby="titulo-processo" className="bg-white py-20 md:py-28">
      <div className="container-b grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <p data-revelar className="eyebrow text-azul">Fabricação</p>
            <h2 id="titulo-processo" data-revelar className="mt-4 font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.02] font-semibold">
              Do recebimento da matéria-prima ao envio do produto.
            </h2>
            <p data-revelar className="mt-5 text-lg leading-relaxed text-tinta-2">{HISTORIA.processo}</p>
            <p data-revelar className="mt-6 text-sm text-aco">As imagens passam do arquivo em preto e branco para a cor conforme você rola.</p>
          </div>
        </div>
        <ul className="space-y-6 lg:col-span-7 lg:col-start-6">
          {CENAS.map((c) => (
            <li key={c.cor} data-cena className="relative aspect-[3/2] overflow-hidden rounded-3xl">
              <Image src={c.pb} alt={c.alt} fill sizes="(min-width:1024px) 54vw, 92vw" className="object-cover" />
              <div data-cor className="absolute inset-0">
                <Image src={c.cor} alt="" fill sizes="(min-width:1024px) 54vw, 92vw" className="object-cover" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

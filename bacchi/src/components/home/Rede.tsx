'use client';
// Chapter 6: the sales network, on light steel. Picking a state on the tile map shows who serves it right
// here (on phones the page moves up to that card); the full list with every contact is one tap away.
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ESTADOS, representantesDe } from '@/data/representantes';
import { MapaBrasil } from '@/components/representantes/MapaBrasil';
import { revelarFilhos, useAnimacao } from '@/lib/animacao';
import { mostrarNaTela } from '@/lib/rolar';

export function Rede() {
  const ref = useRef<HTMLElement>(null);
  const [uf, setUf] = useState('SP');
  const cartao = useRef<HTMLDivElement>(null);
  const escolher = (novo: string) => {
    setUf(novo);
    mostrarNaTela(cartao.current);
  };
  const lista = representantesDe(uf);
  useAnimacao(ref, (_c, raiz) => revelarFilhos(raiz));

  return (
    <section ref={ref} aria-labelledby="titulo-rede" className="bg-papel-2 py-24 md:py-32">
      <div className="container-b grid items-start gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow text-azul" data-revelar>Representantes</p>
          <h2 id="titulo-rede" className="mt-4 font-display text-[clamp(2rem,4.4vw,3.8rem)] leading-[1.02] font-semibold" data-revelar>
            Uma rede comercial em todos os estados.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-tinta-2" data-revelar>
            Escolha o estado no mapa para ver a representação que atende a sua região.
          </p>

          <div ref={cartao} className="mt-10 min-h-[220px] scroll-mt-24 rounded-2xl bg-white p-6 shadow-[0_30px_60px_-40px_rgba(13,23,38,.4)]" aria-live="polite" data-revelar>
            <p className="eyebrow text-aco">{ESTADOS[uf]}</p>
            <ul className="mt-4 divide-y divide-linha">
              {lista.map((r) => (
                <li key={r.regiao + r.empresa} className="py-3 first:pt-0 last:pb-0">
                  <p className="font-semibold">{r.empresa}</p>
                  <p className="text-sm text-tinta-2">{r.regiao}</p>
                  {r.telefones[0] && <p className="mt-1 text-sm text-aco">{r.telefones[0].numero}</p>}
                </li>
              ))}
            </ul>
            <Link href={`/representantes?uf=${uf}`} className="btn btn-primario mt-6 w-full sm:w-auto">
              Ver contatos de {ESTADOS[uf]} <span className="seta" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className="lg:col-span-6 lg:col-start-7" data-revelar>
          <MapaBrasil selecionado={uf} aoEscolher={escolher} />
          <p className="mt-4 text-xs text-aco">Mapa esquemático: cada quadrado é um estado. O ponto indica mais de uma representação.</p>
        </div>
      </div>
    </section>
  );
}

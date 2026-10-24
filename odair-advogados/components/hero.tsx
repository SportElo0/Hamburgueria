import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { areas } from "@/data/areas";
import { Monogram } from "@/components/brand";
import { Rosette } from "@/components/rosette";

const heroRosette = { lobes: 16, wobble: 4, rings: 5, copies: 7, seed: 0.15 };

export function Hero() {
  return (
    <section id="inicio" aria-labelledby="inicio-title" className="relative overflow-hidden bg-navy text-ivory">
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-12 px-5 pt-10 pb-12 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:pt-16 lg:pb-16">
        <div className="relative z-10 flex flex-col justify-center lg:col-span-7 lg:py-10">
          {/* A identificação pedida no briefing vai gravada na legenda do selo; aqui, para leitores de tela. */}
          <p className="sr-only">Advocacia • São Paulo</p>
          <h1 id="inicio-title" className="display max-w-[15ch] text-[clamp(2.6rem,5.6vw,5.4rem)]">
            Compromisso com o Direito. <span className="text-gold">Atenção a cada questão.</span>
          </h1>
          <p className="mt-7 max-w-[48ch] text-[1.0625rem] leading-relaxed text-on-navy-muted lg:text-[1.125rem]">
            Atuação jurídica em diferentes áreas do Direito, com orientação técnica e atenção às particularidades de
            cada situação.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#areas" className="btn btn-gold">
              Conheça as áreas de atuação
              <ArrowRight size={16} className="nudge" />
            </a>
            <a href="#contato" className="btn btn-line-light">
              Entrar em contato
            </a>
          </div>
        </div>

        {/* A roseta grava-se em volta do monograma, como o selo de um documento. */}
        <div className="relative flex items-center justify-center lg:col-span-5">
          <Rosette
            spec={heroRosette}
            engrave
            turn
            steps={720}
            outer={0.8}
            legend="Advocacia • São Paulo • Advocacia • São Paulo •"
            legendClassName="text-[7.6px] lg:text-[5.4px]"
            className="w-[min(21rem,86vw)] text-gold/80 sm:w-[25rem] lg:w-[min(34rem,40vw)]"
          >
            <div className="seal flex w-[34%] flex-col items-center">
              <Monogram priority sizes="(min-width: 1024px) 200px, 140px" className="w-full" />
            </div>
          </Rosette>
        </div>
      </div>

      {/* Índice das áreas: o lugar onde a referência punha números de êxito. */}
      <nav aria-label="Áreas de atuação" className="relative border-t border-blue-line">
        <ul className="mx-auto grid max-w-[90rem] grid-cols-1 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-5 lg:px-12">
          {areas.map((area, i) => (
            <li
              key={area.slug}
              className={`border-blue-line ${i === 0 ? "lg:[&>a]:pl-0" : ""} max-sm:border-b max-sm:last:border-b-0 sm:max-lg:odd:border-r lg:border-r lg:last:border-r-0 ${
                i < 4 ? "sm:max-lg:border-b" : ""
              }`}
            >
              <Link
                href={`/areas/${area.slug}`}
                className="group flex min-h-16 items-center justify-between gap-4 py-4 text-[0.9375rem] text-on-navy-muted transition-colors hover:text-ivory sm:px-4 lg:min-h-20"
              >
                <span>{area.short}</span>
                <ArrowUpRight
                  size={16}
                  strokeWidth={1.5}
                  className="flex-none text-gold transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}

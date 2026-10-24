import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MessageCircle } from "lucide-react";
import { site, whatsappUrl } from "@/config/site";
import { areas } from "@/data/areas";
import { Monogram } from "@/components/brand";
import { Rosette } from "@/components/rosette";

const heroRosette = { lobes: 16, wobble: 4, rings: 5, copies: 7, seed: 0.15 };

/**
 * Abertura: o escritório ao fundo, o selo do monograma à direita.
 * Com movimento permitido, a cena fica presa e as cinco áreas entram uma de
 * cada vez com o scroll (components/scroll-scenes.tsx). Sem isso, as áreas
 * aparecem logo abaixo, em lista. As classes `in-[.is-scene]:` valem só com a cena armada.
 */
export function Hero() {
  const wa = whatsappUrl();
  const photo = site.heroPhoto;

  return (
    <section id="inicio" aria-labelledby="inicio-title" data-hero className="relative bg-navy text-ivory">
      <div
        data-hero-stage
        className="relative isolate overflow-hidden in-[.is-scene]:h-[calc(100svh-4.25rem)] in-[.is-scene]:min-h-[34rem] lg:in-[.is-scene]:h-[calc(100svh-4.75rem)]"
      >
        {/* O escritório ao fundo. Hoje a imagem é ilustrativa (ver config/site.ts). */}
        <div data-hero-photo className="absolute inset-0 -z-20 will-change-transform">
          <Image src={photo.src} alt="" fill priority sizes="100vw" className="object-cover object-[72%_50%]" />
        </div>
        {/* Véu marinho: denso onde está o texto, leve sobre a janela. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(7,27,46,0.55)_0%,rgba(7,27,46,0.82)_45%,#071b2e_100%)] lg:bg-[linear-gradient(90deg,#071b2e_0%,rgba(7,27,46,0.94)_34%,rgba(7,27,46,0.62)_62%,rgba(7,27,46,0.38)_100%)]"
        />
        <div data-hero-veil aria-hidden className="absolute inset-0 -z-10 bg-navy opacity-0" />
        {photo.illustrative && (
          <p className="absolute right-4 bottom-3 z-10 rounded-[2px] bg-navy/70 px-2 py-0.5 text-[0.75rem] text-on-navy-muted lg:right-6 lg:bottom-4">
            Imagem ilustrativa
          </p>
        )}

        <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-10 px-5 pt-14 pb-14 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:pt-20 lg:pb-20 in-[.is-scene]:h-full in-[.is-scene]:pt-10 in-[.is-scene]:pb-12">
          <div data-hero-copy className="relative z-10 flex flex-col justify-end lg:col-span-7 lg:justify-center">
            {/* A identificação pedida no briefing vai gravada na legenda do selo; aqui, para leitores de tela. */}
            <p className="sr-only">Advocacia • São Paulo</p>
            <h1 id="inicio-title" className="display max-w-[15ch] text-[clamp(2.5rem,5.6vw,5.4rem)]">
              Compromisso com o Direito. <span className="text-gold">Atenção a cada questão.</span>
            </h1>
            <p className="mt-7 max-w-[48ch] text-[1.0625rem] leading-relaxed text-on-navy-muted lg:text-[1.125rem]">
              Atuação jurídica em diferentes áreas do Direito, com orientação técnica e atenção às particularidades de
              cada situação.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#areas" data-areas-link className="btn btn-gold">
                Conheça as áreas de atuação
                <ArrowRight size={16} className="nudge" />
              </a>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-line-light">
                  <MessageCircle size={16} />
                  Conversar pelo WhatsApp
                </a>
              ) : (
                <a href="#contato" className="btn btn-line-light">
                  Entrar em contato
                </a>
              )}
            </div>
          </div>

          {/* O selo: a roseta grava-se em volta do monograma e gira a cada área. */}
          <div className="relative hidden items-center justify-center lg:col-span-5 lg:flex">
            <div data-hero-seal className="text-gold/85">
              <Rosette
                spec={heroRosette}
                engrave
                steps={720}
                outer={0.8}
                legend="Advocacia • São Paulo • Advocacia • São Paulo •"
                legendClassName="text-[5.4px]"
                className="w-[min(30rem,36vw)]"
              >
                <div className="seal flex w-[34%] flex-col items-center">
                  <Monogram priority sizes="200px" className="w-full" />
                </div>
              </Rosette>
            </div>
          </div>
        </div>

        {/* As áreas. Na cena presa: uma por vez sobre o escritório. Sem a cena: lista abaixo da abertura. */}
        <section
          id="areas"
          aria-labelledby="areas-title"
          data-hero-areas
          className="relative border-t border-blue-line bg-navy in-[.is-scene]:pointer-events-none in-[.is-scene]:absolute in-[.is-scene]:inset-0 in-[.is-scene]:border-0 in-[.is-scene]:bg-transparent"
        >
          <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-8 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:px-12 in-[.is-scene]:h-full in-[.is-scene]:pt-12 in-[.is-scene]:pb-12 lg:in-[.is-scene]:py-14">
            <div className="lg:col-span-7 in-[.is-scene]:relative">
              <h2 id="areas-title" className="display text-[clamp(2.2rem,4.4vw,3.6rem)] in-[.is-scene]:sr-only">
                Áreas de <span className="text-gold">atuação</span>
              </h2>
              <ol className="mt-8 border-t border-blue-line in-[.is-scene]:mt-0 in-[.is-scene]:h-full in-[.is-scene]:border-0">
                {areas.map((area, i) => (
                  <li
                    key={area.slug}
                    data-hero-area={i}
                    className="border-b border-blue-line py-8 in-[.is-scene]:pointer-events-auto in-[.is-scene]:invisible in-[.is-scene]:absolute in-[.is-scene]:inset-x-0 in-[.is-scene]:bottom-0 in-[.is-scene]:border-0 in-[.is-scene]:py-0 lg:in-[.is-scene]:top-1/2 lg:in-[.is-scene]:bottom-auto lg:in-[.is-scene]:-translate-y-1/2"
                  >
                    <div className="flex items-start gap-5">
                      <ViewTransition name={`rosette-${area.slug}`}>
                        <div className="mt-1 flex-none text-gold/90">
                          <Rosette spec={area.rosette} steps={360} inner={0.3} strokeWidth={0.6} className="w-14 lg:w-20" />
                        </div>
                      </ViewTransition>
                      <div className="min-w-0">
                        <h3 className="display text-[clamp(2rem,4.2vw,3.9rem)] leading-[1.02]">{area.name}</h3>
                        <p className="mt-4 max-w-[46ch] text-[1.0625rem] leading-relaxed text-on-navy-muted">
                          {area.summary}
                        </p>
                        <ul className="mt-5 flex max-w-[52ch] flex-wrap gap-x-5 gap-y-1.5 text-[0.9375rem] text-ivory/90">
                          {area.topics.slice(0, 4).map((topic) => (
                            <li key={topic} className="flex items-center gap-2">
                              <span aria-hidden className="size-1 rounded-full bg-gold" />
                              {topic}
                            </li>
                          ))}
                        </ul>
                        <Link
                          href={`/areas/${area.slug}`}
                          className="group mt-7 inline-flex min-h-11 items-center gap-2 font-semibold text-gold"
                        >
                          <span className="link-line">Saiba mais sobre {area.short}</span>
                          <ArrowUpRight
                            size={18}
                            className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          />
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Índice da sequência: só na cena presa (desktop). Cada item leva à sua área. */}
            <nav
              aria-label="Índice das áreas"
              data-hero-index
              className="hidden lg:col-span-4 lg:col-start-9 lg:self-end in-[.is-scene]:pointer-events-auto lg:in-[.is-scene]:block"
            >
              <ul className="border-t border-blue-line">
                {areas.map((area, i) => (
                  <li key={area.slug} className="border-b border-blue-line">
                    <button
                      type="button"
                      data-hero-index-item={i}
                      className="group flex min-h-11 w-full items-center justify-between gap-4 py-2.5 text-left text-[0.9375rem] text-on-navy-muted transition-colors hover:text-ivory data-[active=true]:text-ivory"
                    >
                      {area.short}
                      <span
                        aria-hidden
                        className="h-px w-6 origin-right scale-x-0 bg-gold transition-transform duration-500 group-data-[active=true]:scale-x-100"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>

        {/* Progresso no celular: cinco traços. */}
        <div aria-hidden data-hero-ticks className="absolute top-4 right-5 left-5 hidden gap-1.5 lg:hidden in-[.is-scene]:flex">
          {areas.map((area, i) => (
            <span key={area.slug} data-hero-tick={i} className="h-0.5 flex-1 bg-ivory/20 data-[active=true]:bg-gold" />
          ))}
        </div>
      </div>
    </section>
  );
}

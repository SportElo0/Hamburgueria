"use client";

import { ArrowRight, Cake, Heart, PartyPopper, Sparkles } from "lucide-react";
import { products, site, type OccasionId } from "@/config/site";
import { requestOrder } from "@/lib/order-store";
import { Photo } from "@/components/photo";

const starters: { id: OccasionId; name: string; Icon: typeof Cake }[] = [
  { id: "aniversario", name: "Aniversário", Icon: Cake },
  { id: "infantil", name: "Festa infantil", Icon: PartyPopper },
  { id: "casamento", name: "Casamento", Icon: Heart },
  { id: "comemoracao", name: "Comemoração", Icon: Sparkles },
];

export function Hero() {
  const { hero } = site;
  const featured = products.find((p) => p.photo.src === hero.photo.src);

  return (
    <section id="inicio" aria-labelledby="inicio-title" className="relative">
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-10 px-5 pt-4 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:items-center lg:gap-14 lg:px-12 lg:pt-8 lg:pb-24">
        {/* Foto: primeiro no celular, à direita no desktop. */}
        <figure className="relative lg:order-2">
          <div className="animate-unveil overflow-hidden rounded-[var(--radius-card)] [animation-delay:150ms]">
            <Photo
              photo={hero.photo}
              priority
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="aspect-[1/1] max-h-[70svh] w-full sm:aspect-[5/4] lg:aspect-auto lg:h-[min(82svh,46rem)] lg:max-h-none"
              imgClassName="animate-settle"
            />
          </div>

          {featured && (
            <figcaption className="animate-rise mt-3 flex items-center justify-between gap-4 [animation-delay:900ms] sm:absolute sm:bottom-6 sm:left-6 sm:mt-0 sm:block sm:max-w-[17rem] sm:rounded-2xl sm:bg-cream/95 sm:px-5 sm:py-4 sm:shadow-[0_18px_40px_-24px_rgb(75_38_22/0.55)] lg:bottom-10 lg:-left-10">
              <span className="serif block text-[1.2rem] text-cocoa sm:text-[1.35rem]">{featured.name}</span>
              <span className="mt-1 hidden text-[0.875rem] leading-snug text-muted sm:block">
                Um dos bolos da {site.ownerFirstName}, publicado no {site.instagram.handle}.
              </span>
              <button
                type="button"
                onClick={() => requestOrder({ productId: featured.id })}
                className="inline-flex min-h-11 flex-none items-center gap-2 text-[0.875rem] font-semibold text-cocoa sm:mt-3"
              >
                <span className="link-line">Quero um parecido</span>
                <ArrowRight size={15} />
              </button>
            </figcaption>
          )}
        </figure>

        <div className="flex flex-col justify-center lg:order-1 lg:py-6">
          <p className="smallcaps animate-rise flex items-center gap-3 text-cherry">
            <span aria-hidden className="dot" />
            {hero.label}
          </p>
          <h1
            id="inicio-title"
            className="serif animate-rise mt-5 text-[clamp(2.6rem,4.5vw,4.4rem)] leading-[1.04] text-ink [animation-delay:80ms]"
          >
            {hero.headline.before}
            <em className="text-cherry">{hero.headline.accent}</em>
            {hero.headline.after}
          </h1>
          <p className="animate-rise mt-6 max-w-[34ch] text-[1.125rem] leading-relaxed text-muted [animation-delay:160ms] lg:text-[1.1875rem]">
            {hero.subtitle}
          </p>

          <div className="animate-rise mt-9 flex flex-col gap-3 [animation-delay:240ms] sm:flex-row sm:flex-wrap">
            <button type="button" onClick={() => requestOrder()} className="btn btn-cocoa">
              Encomendar meu bolo
              <ArrowRight size={16} className="nudge" />
            </button>
            <a href="#bolos" className="btn btn-outline">
              Conhecer nossos bolos
            </a>
          </div>

          <div className="animate-rise mt-12 [animation-delay:340ms]">
            <p className="text-[0.9375rem] font-semibold text-ink">
              Comece pelo motivo da festa
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              {starters.map(({ id, name, Icon }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => requestOrder({ occasion: id })}
                    className="group flex min-h-12 w-full items-center gap-3 text-left sm:flex-col sm:items-start sm:gap-2.5"
                  >
                    <span className="grid size-12 flex-none place-items-center rounded-full border border-line-strong bg-paper text-cocoa transition-[background-color,border-color,color] duration-300 group-hover:border-cocoa group-hover:bg-cocoa group-hover:text-cream">
                      <Icon size={20} strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="text-[0.9375rem] leading-tight text-ink group-hover:text-cocoa">
                      {name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

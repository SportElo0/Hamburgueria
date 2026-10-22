import { ArrowRight } from "lucide-react";
import { photos, site } from "@/config/site";
import { Credit, Photo } from "@/components/photo";
import { Divider } from "@/components/brand";

export function Hero() {
  const { hero } = site;
  return (
    <section id="inicio" aria-labelledby="inicio-title" data-hero className="relative overflow-hidden">
      {/* Foto panorâmica: em sangria no desktop, no topo no celular. */}
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto">
        <div data-hero-photo className="absolute inset-0 will-change-transform">
          <Photo photo={photos.gramado} priority sizes="100vw" className="absolute! inset-0" />
        </div>
        {/* Véu areia: dissolve a foto no fundo (embaixo no celular, à esquerda no desktop). */}
        <div
          data-hero-veil
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-sand to-transparent lg:inset-y-0 lg:right-auto lg:left-0 lg:h-auto lg:w-[62%] lg:bg-linear-to-r lg:from-sand lg:from-30% lg:via-sand/80 lg:via-55% lg:to-transparent"
        />
        <Credit
          photo={photos.gramado}
          className="absolute right-3 bottom-2 rounded-[2px] bg-deep-2/55 px-2 py-0.5 text-sand/90 lg:right-5 lg:bottom-4"
        />
      </div>

      <div className="relative mx-auto flex max-w-[90rem] flex-col px-5 pt-4 pb-16 sm:px-8 lg:min-h-[calc(100svh-6rem)] lg:justify-center lg:px-12 lg:py-24">
        <div data-hero-copy className="max-w-[44rem]">
          <p className="label animate-rise text-champagne-deep">{hero.label}</p>
          <h1
            id="inicio-title"
            className="serif animate-rise mt-5 text-[clamp(2.6rem,5vw,4.6rem)] leading-[1.04] text-deep [animation-delay:80ms]"
          >
            <span className="block">{hero.headline[0]}</span>
            <span className="block text-champagne-deep">{hero.headline[1]}</span>
          </h1>
          <Divider className="animate-rise mt-7 [animation-delay:160ms]" />
          <p className="animate-rise mt-6 max-w-[42ch] text-[1.0625rem] leading-relaxed text-ink/85 [animation-delay:200ms] lg:text-[1.125rem]">
            {hero.subtitle}
          </p>
          <div className="animate-rise mt-9 flex flex-col gap-3 [animation-delay:280ms] sm:flex-row">
            <a href="#cardapio" className="btn btn-deep">
              Conhecer o cardápio
              <ArrowRight size={16} className="nudge" />
            </a>
            <a href="#reservar" className="btn btn-gold">
              Solicitar reserva
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

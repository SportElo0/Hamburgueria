import { ArrowRight, Star } from "lucide-react";
import { site } from "@/config/site";
import { formatShortDate } from "@/lib/schedule";
import { PhotoSlot } from "@/components/photo-slot";
import { BookingTrigger } from "@/components/booking-trigger";

const rating = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function Hero() {
  const { hero, reviews } = site;

  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-ground lg:min-h-[min(46rem,calc(100svh-8.25rem))]"
    >
      {/* Foto: no celular vem primeiro; no desktop sangra até a borda direita. */}
      <div className="animate-unveil relative aspect-[4/5] max-h-[68svh] w-full sm:aspect-[16/11] lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:max-h-none lg:w-[57%]">
        <PhotoSlot
          photo={hero.photo}
          sizes="(min-width: 1024px) 57vw, 100vw"
          priority
          className="absolute! inset-0"
          imgClassName="animate-settle"
        />
        {/* Transição da foto para o fundo: para baixo no celular, para a esquerda no desktop. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-ground via-ground/70 to-transparent lg:inset-y-0 lg:right-auto lg:-left-px lg:h-auto lg:w-1/2 lg:bg-linear-to-r lg:via-ground/40"
        />
      </div>

      <div className="relative mx-auto max-w-[88rem] px-5 sm:px-8 lg:px-12">
        <div className="-mt-20 flex flex-col pb-14 sm:-mt-24 lg:mt-0 lg:min-h-[min(46rem,calc(100svh-8.25rem))] lg:w-[46%] lg:justify-center lg:py-20">
          <p className="label animate-rise text-champagne-text" style={{ animationDelay: "250ms" }}>
            {site.address.neighborhood} · {site.address.city}
          </p>

          <h1 id="hero-title" className="serif mt-5 text-[clamp(3.25rem,13vw,6rem)] leading-[0.98]">
            {hero.headline.map((line, index) => (
              <span
                key={line.text}
                className="animate-rise block"
                style={{ animationDelay: `${380 + index * 120}ms` }}
              >
                {line.text}
                {line.accent && <em className="text-champagne-deep italic">{line.accent}</em>}
              </span>
            ))}
          </h1>

          <span
            aria-hidden
            className="risca animate-risca mt-8"
            style={{ animationDelay: "800ms" }}
          />

          <p
            className="animate-rise mt-7 max-w-[34ch] text-[1.0625rem] leading-relaxed text-graphite sm:text-lg"
            style={{ animationDelay: "700ms" }}
          >
            {hero.subtitle}
          </p>

          <div
            className="animate-rise mt-9 flex flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "820ms" }}
          >
            <BookingTrigger className="btn btn-solid w-full sm:w-auto">
              Agendar horário
              <ArrowRight size={16} className="nudge" />
            </BookingTrigger>
            <a href="#servicos" className="btn btn-outline w-full sm:w-auto">
              Ver serviços
            </a>
          </div>

          {reviews.show && (
            <a
              href={site.links.googleProfile}
              target="_blank"
              rel="noopener noreferrer"
              className="animate-rise group mt-10 flex items-center gap-4 self-start"
              style={{ animationDelay: "940ms" }}
            >
              <span className="serif text-[2.4rem] leading-none">
                {rating.format(reviews.rating)}
              </span>
              <span className="flex flex-col gap-1.5">
                <span className="flex gap-0.5 text-champagne" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={14} className="fill-current" />
                  ))}
                </span>
                <span className="text-sm text-muted">
                  <span className="link-line text-graphite">
                    {reviews.count} avaliações no {reviews.platform}
                  </span>{" "}
                  · {formatShortDate(reviews.checkedAt)}
                </span>
              </span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

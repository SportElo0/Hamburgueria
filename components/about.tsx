import { ArrowRight } from "lucide-react";
import { site } from "@/config/site";
import { PhotoSlot } from "@/components/photo-slot";
import { BookingTrigger } from "@/components/booking-trigger";
import { Seal } from "@/components/brand";

export function About() {
  const { about } = site;

  return (
    <section
      id="sobre"
      aria-labelledby="sobre-title"
      className="grid grid-cols-1 bg-ink lg:grid-cols-12"
    >
      <div className="flex flex-col justify-center px-5 py-20 text-ground sm:px-8 sm:py-24 lg:col-span-5 lg:px-12 lg:py-28 xl:pl-[max(3rem,calc((100vw-88rem)/2+3rem))]">
        <h2 id="sobre-title" data-reveal className="serif text-[clamp(2.75rem,7vw,4rem)]">
          {about.title}
        </h2>
        <span aria-hidden data-reveal="risca" className="risca mt-7 bg-champagne-soft!" />
        <div className="mt-8 flex max-w-[46ch] flex-col gap-5 text-[1.0625rem] leading-relaxed text-night-muted">
          {about.paragraphs.map((paragraph) => (
            <p key={paragraph} data-reveal>
              {paragraph}
            </p>
          ))}
        </div>

        <ul className="mt-9 flex flex-col border-t border-night-line">
          {about.commitments.map((item) => (
            <li
              key={item}
              className="flex items-center gap-4 border-b border-night-line py-3.5 text-[0.95rem] text-ground"
            >
              <span aria-hidden className="h-px w-5 flex-none bg-champagne-soft" />
              {item}
            </li>
          ))}
        </ul>

        <p className="serif mt-10 text-[1.9rem] text-champagne-soft italic">{site.barber}</p>
        {about.draft && (
          <p className="mt-3 text-xs tracking-[0.08em] text-night-muted">
            Texto provisório, aguardando revisão do {site.barberFirstName}.
          </p>
        )}
      </div>

      {/* A foto do Leonardo é pequena: aparece emoldurada, perto do tamanho real, em vez de ampliada. */}
      <figure className="flex flex-col items-center justify-center gap-5 bg-night-2 px-5 py-14 sm:px-8 lg:col-span-4 lg:py-20">
        <div data-reveal="photo" className="w-full max-w-[22rem]">
          <PhotoSlot
            photo={about.photo}
            sizes="(min-width: 1024px) 352px, 90vw"
            className="aspect-[404/552] w-full"
          />
        </div>
        <figcaption className="text-[0.8125rem] tracking-[0.12em] text-night-muted uppercase">
          {site.barber} atendendo
        </figcaption>
      </figure>

      <div className="flex flex-col items-start justify-center gap-7 bg-sand px-5 py-16 sm:px-8 lg:col-span-3 lg:px-10 xl:pr-[max(2.5rem,calc((100vw-88rem)/2+3rem))]">
        <Seal size={96} className="text-champagne" />
        <h3 className="serif text-[2.1rem] leading-[1.05]">
          Pronto para o <em className="text-champagne-deep italic">próximo corte?</em>
        </h3>
        <p className="text-[0.95rem] leading-relaxed text-muted">
          Escolha o serviço, o dia e o horário. O {site.barberFirstName} confirma pelo WhatsApp.
        </p>
        <BookingTrigger className="btn btn-solid">
          Agendar horário
          <ArrowRight size={16} className="nudge" />
        </BookingTrigger>
      </div>
    </section>
  );
}

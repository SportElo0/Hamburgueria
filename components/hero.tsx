import { ArrowDown, ArrowRight } from "lucide-react";
import { site } from "@/config/site";
import { PhotoSlot } from "@/components/photo-slot";
import { BookingTrigger } from "@/components/booking-trigger";

/**
 * As faixas sobem do pé da página como um degradê: cada degrau é mais opaco
 * que o de cima e leva o número do pente na régua da direita.
 */
const bands = [
  { guard: "#2", tone: "bg-fade-0/25", size: "flex-[1]" },
  { guard: "#1½", tone: "bg-fade-0/48", size: "flex-[1]" },
  { guard: "#1", tone: "bg-fade-0/68", size: "flex-[1.15]" },
  { guard: "#½", tone: "bg-fade-0/84", size: "flex-[1.3] lg:flex-[1.6]" },
  { guard: "#0", tone: "bg-fade-0", size: "flex-[5] lg:flex-[1.9]" },
];

const headlineLines = ["O estilo", "começa no", "detalhe."];

export function Hero() {
  const photo = site.hero.photo;

  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-fade-2 lg:min-h-[max(44rem,100svh)]"
    >
      <PhotoSlot
        photo={photo}
        sizes="100vw"
        priority
        label={false}
        bands={false}
        className="absolute! inset-0 -z-20 bg-fade-5!"
      />

      {!photo.src && (
        <p className="guard absolute top-20 right-4 z-10 rounded-[2px] border border-line-strong bg-fade-0/70 px-2 py-1.5 text-[0.62rem] text-steel sm:right-6 lg:top-24 lg:right-10">
          FOTO PRINCIPAL TEMPORÁRIA
        </p>
      )}

      {/* Faixas do degradê + régua de pentes */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 flex h-[78%] flex-col sm:h-[72%] lg:h-[70%]"
      >
        {bands.map((band, index) => (
          <div
            key={band.guard}
            className={`animate-band relative origin-bottom border-t border-paper/[0.07] ${band.tone} ${band.size}`}
            style={{ animationDelay: `${(bands.length - 1 - index) * 70}ms` }}
          >
            <span
              className={`absolute top-0 right-0 -translate-y-1/2 items-center gap-2 pr-4 sm:flex sm:pr-6 lg:pr-10 ${
                band.guard === "#0" ? "hidden" : "flex"
              }`}
            >
              <span className="hidden h-px w-10 bg-steel/50 sm:block" />
              <span className="guard w-7 text-right text-steel">{band.guard}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-auto w-full max-w-[90rem] px-4 pt-32 pb-8 sm:px-6 sm:pb-12 lg:px-10 lg:pb-16">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <h1
            id="hero-title"
            className="display pr-10 text-[clamp(3.4rem,15.5vw,6rem)] lg:col-span-7 lg:pr-0"
          >
            {headlineLines.map((line, index) => (
              <span
                key={line}
                className="animate-line block"
                style={{ animationDelay: `${260 + index * 90}ms` }}
              >
                {line}
              </span>
            ))}
          </h1>

          <div
            className="animate-rise flex flex-col gap-6 lg:col-span-5 lg:pb-2"
            style={{ animationDelay: "520ms" }}
          >
            <p className="max-w-[34ch] text-[1.05rem] leading-relaxed text-paper/88 sm:text-lg">
              {site.hero.subtitle}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <BookingTrigger className="btn btn-primary w-full sm:w-auto">
                Agendar meu horário
                <ArrowRight size={18} className="nudge" />
              </BookingTrigger>
              <a href="#cortes" className="btn btn-ghost w-full sm:w-auto">
                Conhecer os cortes
                <ArrowDown size={18} className="nudge" />
              </a>
            </div>

            <div>
              <p id="quick-pick" className="mb-2.5 text-sm font-semibold text-steel">
                Ou comece pelo serviço:
              </p>
              <ul aria-labelledby="quick-pick" className="flex flex-wrap gap-2">
                {site.services.map((service) => (
                  <li key={service.id}>
                    <BookingTrigger
                      serviceId={service.id}
                      aria-label={`Agendar ${service.name}`}
                      className="min-h-10 rounded-[3px] border border-line-strong bg-fade-0/60 px-3.5 text-sm font-semibold text-paper transition-colors hover:border-blue-ink hover:bg-fade-3"
                    >
                      {service.shortName}
                    </BookingTrigger>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

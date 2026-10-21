"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { site } from "@/config/site";
import { requestBooking } from "@/lib/booking-store";
import { PhotoSlot } from "@/components/photo-slot";
import { Seal } from "@/components/brand";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pricesPending = site.services.every((service) => service.price === null);

export function Services() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () =>
      setEdges({
        start: track.scrollLeft < 8,
        end: track.scrollLeft + track.clientWidth > track.scrollWidth - 8,
      });
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current;
    const card = track?.querySelector("li");
    if (!track || !card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: direction * (card.clientWidth + 20),
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <section
      id="servicos"
      aria-labelledby="servicos-title"
      className="overflow-hidden bg-ground py-24 sm:py-28 lg:py-36"
    >
      <div className="mx-auto grid grid-cols-1 max-w-[88rem] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:px-12">
        <div className="lg:col-span-4 lg:pt-4">
          <h2 id="servicos-title" data-reveal className="serif text-[clamp(2.75rem,8vw,4.25rem)]">
            Do corte ao acabamento.
          </h2>
          <span aria-hidden data-reveal="risca" className="risca mt-7" />
          <p
            data-reveal
            className="mt-7 max-w-[38ch] text-[1.0625rem] leading-relaxed text-graphite"
          >
            Escolha o serviço e peça seu horário direto com o {site.barberFirstName}.
            {pricesPending && " Os valores são informados pelo WhatsApp."}
          </p>
          <button
            type="button"
            onClick={() => requestBooking()}
            className="btn btn-solid mt-9 hidden lg:inline-flex"
          >
            Agendar horário
            <ArrowRight size={16} className="nudge" />
          </button>
        </div>

        <div className="lg:col-span-8">
          <ul
            ref={trackRef}
            data-reveal
            aria-label="Serviços"
            className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {site.services.map((service) => (
              <li
                key={service.id}
                className="group flex w-[78%] flex-none snap-start flex-col border border-line bg-paper sm:w-[44%] lg:w-[calc((100%-2.5rem)/2.6)]"
              >
                {service.photo ? (
                  <PhotoSlot
                    photo={service.photo}
                    sizes="(min-width: 1024px) 26vw, (min-width: 640px) 44vw, 78vw"
                    className="aspect-[4/5] w-full"
                    imgClassName="transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-6 bg-ink px-8 text-center text-champagne-soft">
                    <Seal size={112} />
                    <p className="signature max-w-[14ch] text-[1.5rem] text-ground">
                      O detalhe que fecha o visual.
                    </p>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="serif text-[1.75rem]">{service.name}</h3>
                  <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-muted">
                    {service.description}
                  </p>
                  <div className="mt-6 flex items-end justify-between gap-4 border-t border-line pt-5">
                    <p className="text-sm text-muted">
                      {service.price !== null ? (
                        <span className="tabular text-base font-semibold text-ink">
                          {currency.format(service.price)}
                        </span>
                      ) : (
                        "Valor no WhatsApp"
                      )}
                      {service.durationMinutes !== null && (
                        <span className="tabular"> · {service.durationMinutes} min</span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => requestBooking(service.id)}
                      aria-label={`Agendar ${service.name}`}
                      className="label inline-flex min-h-11 items-center gap-2 text-ink"
                    >
                      <span className="link-line">Agendar</span>
                      <ArrowRight
                        size={15}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => requestBooking()}
              className="btn btn-solid flex-1 sm:flex-none lg:hidden"
            >
              Agendar horário
            </button>
            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                disabled={edges.start}
                aria-label="Serviço anterior"
                className="grid size-12 place-items-center rounded-full border border-ink text-ink transition-colors hover:bg-ink hover:text-ground disabled:border-line-strong disabled:text-line-strong disabled:hover:bg-transparent"
              >
                <ArrowLeft size={18} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                disabled={edges.end}
                aria-label="Próximo serviço"
                className="grid size-12 place-items-center rounded-full border border-ink text-ink transition-colors hover:bg-ink hover:text-ground disabled:border-line-strong disabled:text-line-strong disabled:hover:bg-transparent"
              >
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

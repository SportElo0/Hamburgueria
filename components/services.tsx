import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { site } from "@/config/site";
import { BookingTrigger } from "@/components/booking-trigger";
import { FadeMark } from "@/components/fade-mark";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pricesPending = site.services.every((service) => service.price === null);

export function Services() {
  return (
    <section
      id="servicos"
      aria-labelledby="servicos-title"
      className="bg-fade-0 py-20 sm:py-28 lg:py-36"
    >
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2
            id="servicos-title"
            data-reveal="rise"
            className="display text-[clamp(3rem,11vw,5.5rem)] lg:col-span-7"
          >
            Serviços
          </h2>
          <p
            data-reveal="rise"
            className="max-w-[46ch] text-base leading-relaxed text-steel lg:col-span-5 lg:pb-3"
          >
            Escolha o serviço e solicite o horário direto com o {site.barberFirstName}.
            {pricesPending && " Os valores são passados pelo WhatsApp, junto com a confirmação."}
          </p>
        </div>

        <ul className="mt-12 border-t border-line sm:mt-16">
          {site.services.map((service, index) => (
            <li
              key={service.id}
              data-reveal="rise"
              style={{ "--reveal-delay": `${index * 60}ms` } as CSSProperties}
              className="group relative border-b border-line transition-colors duration-300 hover:bg-fade-2"
            >
              <article className="grid gap-x-10 gap-y-4 py-7 sm:py-8 lg:grid-cols-12 lg:items-center lg:px-4">
                <div className="flex items-center gap-5 lg:col-span-5">
                  <FadeMark lit={service.mark} className="flex-none" />
                  <h3 className="display text-[clamp(2rem,7.5vw,3rem)] transition-transform duration-500 ease-out group-hover:translate-x-1">
                    {service.name}
                  </h3>
                </div>
                <p className="max-w-[52ch] text-[0.98rem] leading-relaxed text-steel lg:col-span-4">
                  {service.description}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-4 lg:col-span-3 lg:flex-col lg:items-end lg:gap-3">
                  <p className="text-sm font-semibold text-paper/80">
                    {service.price !== null ? (
                      <span className="tabular text-base text-paper">
                        {currency.format(service.price)}
                      </span>
                    ) : (
                      "Valor no WhatsApp"
                    )}
                    {service.durationMinutes !== null && (
                      <span className="tabular text-steel"> · {service.durationMinutes} min</span>
                    )}
                  </p>
                  <BookingTrigger
                    serviceId={service.id}
                    aria-label={`Agendar ${service.name}`}
                    className="btn btn-ghost min-h-11 px-4 text-[0.88rem] group-hover:border-blue group-hover:bg-blue group-hover:text-white"
                  >
                    Agendar este serviço
                    <ArrowRight size={16} className="nudge" />
                  </BookingTrigger>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

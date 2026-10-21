"use client";

import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { fullAddress, site } from "@/config/site";
import { hoursSummary } from "@/lib/seo";
import { greetingLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/brand";

export function Location() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const rows = hoursSummary();

  return (
    <section
      id="localizacao"
      aria-labelledby="localizacao-title"
      className="bg-fade-1 py-20 sm:py-28 lg:py-36"
    >
      <div className="mx-auto grid max-w-[90rem] gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-10">
        <div className="lg:col-span-5">
          <h2
            id="localizacao-title"
            data-reveal="rise"
            className="display text-[clamp(3rem,11vw,5.5rem)]"
          >
            Rua Cotovia, 130
          </h2>
          <address className="mt-6 flex gap-3 text-[1.05rem] leading-relaxed text-paper/90 not-italic">
            <MapPin size={20} className="mt-1 flex-none text-blue-ink" />
            <span>
              {site.address.neighborhood}, {site.address.city} – {site.address.state}
              <br />
              CEP {site.address.postalCode}
            </span>
          </address>

          <div className="mt-10">
            <h3 className="text-sm font-semibold text-steel">Horário de funcionamento</h3>
            <dl className="mt-3 border-t border-line">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-3.5"
                >
                  <dt className="font-semibold">{row.label}</dt>
                  <dd
                    className={`tabular ${row.value === "Fechado" ? "text-steel" : "text-paper"}`}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            {!site.hours.confirmed && (
              <p className="mt-3 max-w-[46ch] text-xs leading-relaxed text-steel">
                Horário conforme o Instagram da barbearia, sujeito a confirmação. Em feriados ou
                dúvidas, chame no WhatsApp antes de ir.
              </p>
            )}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <a
              href={site.links.directions}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <Navigation size={18} />
              Como chegar
            </a>
            <a
              href={greetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              <WhatsAppIcon size={19} />
              Falar no WhatsApp
            </a>
          </div>
        </div>

        <div
          data-reveal="cut"
          className="relative min-h-[22rem] overflow-hidden rounded-[4px] border border-line bg-fade-2 lg:col-span-7 lg:min-h-0"
        >
          {mapLoaded ? (
            <iframe
              title={`Mapa: ${fullAddress}`}
              src={site.links.mapEmbed}
              className="absolute inset-0 h-full w-full border-0 [filter:grayscale(1)_invert(0.92)_contrast(0.9)]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col">
              {/* Quadras estilizadas em degraus até o mapa ser carregado. */}
              <div
                aria-hidden
                className="grid flex-1 grid-cols-6 grid-rows-5 gap-[3px] p-[3px] opacity-70"
              >
                {Array.from({ length: 30 }, (_, i) => (
                  <span
                    key={i}
                    className={
                      i === 15
                        ? "bg-fade-5"
                        : ["bg-fade-3", "bg-fade-2", "bg-fade-4", "bg-fade-3", "bg-fade-1"][
                            (i * 7) % 5
                          ]
                    }
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-blue text-white">
                  <MapPin size={24} />
                </span>
                <p className="max-w-[30ch] text-sm leading-relaxed text-paper/90">
                  {site.address.street}, {site.address.neighborhood}
                </p>
                <button
                  type="button"
                  onClick={() => setMapLoaded(true)}
                  className="btn btn-ghost bg-fade-0/80"
                >
                  Mostrar mapa
                </button>
                <p className="max-w-[36ch] text-xs text-steel">
                  O mapa é carregado do Google Maps.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { fullAddress, site } from "@/config/site";
import { hoursSummary } from "@/lib/seo";
import { greetingLink } from "@/lib/whatsapp";
import { InstagramIcon, WhatsAppIcon } from "@/components/brand";

export function Location() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const rows = hoursSummary();

  return (
    <section
      id="localizacao"
      aria-labelledby="localizacao-title"
      className="bg-ground py-24 sm:py-28 lg:py-36"
    >
      <div className="mx-auto grid grid-cols-1 max-w-[88rem] gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:px-12">
        <div className="lg:col-span-5">
          <h2
            id="localizacao-title"
            data-reveal
            className="serif text-[clamp(2.75rem,8vw,4.25rem)]"
          >
            Rua Cotovia, 130.
          </h2>
          <span aria-hidden data-reveal="risca" className="risca mt-7" />
          <address className="mt-7 text-[1.0625rem] leading-relaxed text-graphite not-italic">
            {site.name} · {site.barber}
            <br />
            {site.address.neighborhood}, {site.address.city} – {site.address.state} · CEP{" "}
            {site.address.postalCode}
          </address>

          <div className="mt-10">
            <h3 className="label text-ink">Horário de funcionamento</h3>
            <dl className="mt-4 border-t border-line">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-3.5"
                >
                  <dt className="text-graphite">{row.label}</dt>
                  <dd
                    className={`tabular font-semibold ${row.value === "Fechado" ? "text-muted" : "text-ink"}`}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            {!site.hours.confirmed && (
              <p className="mt-3 max-w-[46ch] text-[0.8125rem] leading-relaxed text-muted">
                Horário conforme o Instagram da barbearia, sujeito a confirmação. Em feriados ou
                dúvidas, chame no WhatsApp antes de ir.
              </p>
            )}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href={site.links.directions}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-solid"
            >
              <Navigation size={16} strokeWidth={1.5} />
              Como chegar
            </a>
            <a
              href={greetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              <WhatsAppIcon size={17} />
              Falar no WhatsApp
            </a>
          </div>

          <ul className="mt-8 flex flex-col gap-1 text-[0.95rem]">
            <li>
              <a
                href={greetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-3 text-graphite hover:text-ink"
              >
                <WhatsAppIcon size={18} className="text-champagne" />
                <span className="tabular">{site.whatsapp.display}</span>
              </a>
            </li>
            <li>
              <a
                href={site.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-3 text-graphite hover:text-ink"
              >
                <InstagramIcon size={18} className="text-champagne" />@{site.instagram.handle}
              </a>
            </li>
          </ul>
        </div>

        <div
          data-reveal="photo"
          className="relative min-h-[24rem] overflow-hidden border border-line bg-paper lg:col-span-7 lg:min-h-[36rem]"
        >
          {mapLoaded ? (
            <iframe
              title={`Mapa: ${fullAddress}`}
              src={site.links.mapEmbed}
              className="absolute inset-0 h-full w-full border-0 grayscale-[0.35]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-sand p-6 text-center">
              <span className="grid size-14 place-items-center rounded-full border border-ink text-ink">
                <MapPin size={22} strokeWidth={1.5} />
              </span>
              <p className="serif text-[1.75rem] leading-tight">
                {site.address.street}
                <br />
                {site.address.neighborhood}, {site.address.city}
              </p>
              <button type="button" onClick={() => setMapLoaded(true)} className="btn btn-outline">
                Mostrar mapa
              </button>
              <p className="text-[0.8125rem] text-muted">O mapa é carregado do Google Maps.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

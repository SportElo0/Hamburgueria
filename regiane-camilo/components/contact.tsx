"use client";

import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { fullAddress, site } from "@/config/site";
import { greetingLink } from "@/lib/order";
import { InstagramIcon, WhatsAppIcon } from "@/components/brand";

export function Contact() {
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <section id="contato" aria-labelledby="contato-title" className="bg-cream">
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12 lg:py-28">
        <div className="lg:col-span-5">
          <h2 id="contato-title" data-reveal className="serif text-[clamp(2.25rem,4.4vw,3.6rem)] text-ink">
            Vamos conversar sobre <em className="text-cherry">o seu bolo</em>?
          </h2>

          <address className="mt-9 not-italic">
            <p className="serif text-[1.5rem] text-cocoa">{site.name}</p>
            <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink">
              {site.address.street}
              <br />
              {site.address.city} — {site.address.state}
            </p>
            <p className="mt-1 text-[0.875rem] text-muted">{site.address.source}</p>

            <dl className="mt-7 border-t border-line text-[1rem]">
              <div className="flex items-center justify-between gap-4 border-b border-line py-3.5">
                <dt className="text-muted">WhatsApp</dt>
                <dd>
                  <a href={greetingLink} target="_blank" rel="noopener noreferrer" className="link-line tabular text-ink">
                    {site.whatsapp.display}
                  </a>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-line py-3.5">
                <dt className="text-muted">Instagram</dt>
                <dd>
                  <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="link-line text-ink">
                    {site.instagram.handle}
                  </a>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-line py-3.5">
                <dt className="text-muted">Horários</dt>
                <dd className="text-right text-ink">{site.hours ?? "Consulte pelo WhatsApp"}</dd>
              </div>
            </dl>
          </address>

          <p className="mt-5 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted">
            Retirada, entrega e prazos são combinados diretamente com a {site.ownerFirstName}.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href={greetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-cocoa">
              <WhatsAppIcon size={18} />
              Chamar no WhatsApp
            </a>
            <a href={site.links.directions} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              <Navigation size={16} />
              Como chegar
            </a>
            <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              <InstagramIcon size={17} />
              Instagram
            </a>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="relative h-full min-h-[22rem] overflow-hidden rounded-[1.75rem] bg-blush">
            {mapLoaded ? (
              <iframe
                title={`Mapa: ${fullAddress}`}
                src={site.links.mapEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 size-full border-0"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
                <span aria-hidden className="absolute size-[30rem] rounded-full border border-blush-deep" />
                <span aria-hidden className="absolute size-[20rem] rounded-full border border-blush-deep" />
                <span className="relative grid size-14 place-items-center rounded-full bg-cocoa text-cream">
                  <MapPin size={24} strokeWidth={1.6} aria-hidden />
                </span>
                <p className="serif relative text-[1.6rem] text-ink">
                  {site.address.street}
                  <span className="block text-[1.1rem] text-ink/75">{site.address.city} — {site.address.state}</span>
                </p>
                <button type="button" onClick={() => setMapLoaded(true)} className="btn btn-outline relative bg-cream">
                  Mostrar mapa
                </button>
                <p className="relative max-w-[34ch] text-[0.8125rem] text-ink/75">
                  O mapa é do Google e só carrega quando você pedir.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

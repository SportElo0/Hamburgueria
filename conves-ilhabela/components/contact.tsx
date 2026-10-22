"use client";

import { useState } from "react";
import { MapPin, Navigation, Phone } from "lucide-react";
import { fullAddress, site } from "@/config/site";
import { InstagramIcon } from "@/components/brand";

export function Contact() {
  const [mapLoaded, setMapLoaded] = useState(false);
  return (
    <section id="contato" aria-labelledby="contato-title" className="bg-sand">
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12 lg:py-28">
        <div className="lg:col-span-5">
          <h2 id="contato-title" data-reveal className="serif text-[clamp(2.3rem,4.6vw,3.8rem)] text-deep">
            Como chegar ao Convés.
          </h2>
          <address className="mt-9 not-italic">
            <p className="serif text-[1.5rem] text-deep">{site.name}</p>
            <p className="mt-3 text-[1.0625rem] leading-relaxed">
              {site.address.street}
              <br />
              {site.address.neighborhood} — {site.address.city} — {site.address.state}
              <br />
              CEP {site.address.zip}
            </p>
            <dl className="mt-7 border-t border-line text-[1rem]">
              <div className="flex items-center justify-between gap-4 border-b border-line py-3.5">
                <dt className="text-muted">Telefone</dt>
                <dd>
                  <a href={`tel:${site.phone.e164}`} className="link-line tabular">
                    {site.phone.display}
                  </a>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-line py-3.5">
                <dt className="text-muted">Instagram</dt>
                <dd>
                  <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="link-line">
                    {site.instagram.handle}
                  </a>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-line py-3.5">
                <dt className="text-muted">Horários</dt>
                <dd className="text-right">
                  {site.hours
                    ? site.hours.map((h) => (
                        <span key={h.days} className="block">
                          {h.days}: {h.time}
                        </span>
                      ))
                    : "Consulte pelo telefone"}
                </dd>
              </div>
            </dl>
          </address>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-7">
          {mapLoaded ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2px] bg-shell lg:aspect-auto lg:flex-1">
              <iframe
                title={`Mapa: ${fullAddress}`}
                src={site.links.mapEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 size-full border-0"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-5 rounded-[2px] bg-shell p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9 lg:mt-auto">
              <div className="flex items-start gap-4">
                <span className="grid size-12 flex-none place-items-center rounded-full bg-deep text-sand">
                  <MapPin size={22} strokeWidth={1.5} aria-hidden />
                </span>
                <div>
                  <p className="serif text-[1.45rem] leading-tight text-deep">{site.address.street}</p>
                  <p className="mt-1 text-[0.9375rem] text-ink/75">
                    {site.address.neighborhood}, {site.address.city}
                  </p>
                  <p className="mt-2 max-w-[34ch] text-[0.8125rem] text-ink/75">
                    O mapa é do Google e só carrega quando você pedir.
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setMapLoaded(true)} className="btn btn-outline flex-none bg-sand">
                Mostrar mapa
              </button>
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href={site.links.directions} target="_blank" rel="noopener noreferrer" className="btn btn-deep">
              <Navigation size={16} />
              Como chegar
            </a>
            <a href={`tel:${site.phone.e164}`} className="btn btn-outline">
              <Phone size={16} />
              Ligar
            </a>
            <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              <InstagramIcon size={17} />
              Instagram
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

import Link from "next/link";
import { SITE, mapsLink } from "@/lib/site";
import { Reveal } from "./Reveal";

export function Location() {
  return (
    <section id="localizacao" className="mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
        <Reveal>
          <p className="eyebrow text-accent">Como chegar</p>
          <h2 className="font-display mt-4 text-4xl leading-tight text-paper sm:text-5xl">No Caborê, perto de tudo</h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-paper-mute">
            {SITE.address.line1}
            <br />
            {SITE.address.line2}
          </p>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-paper-mute">
            A cerca de 5 minutos de carro (ou 15–20 a pé) do Centro Histórico de Paraty, e pertinho da Praia
            do Jabaquara.
          </p>
          <Link href={mapsLink()} target="_blank" rel="noreferrer" className="btn-cta mt-8">
            Ver no mapa
          </Link>
        </Reveal>
        <Reveal delay={0.1} className="aspect-[4/3] overflow-hidden border border-line">
          <iframe
            title="Mapa — Pousada Villa Verano"
            src={`https://www.google.com/maps?q=${encodeURIComponent(SITE.address.mapsQuery)}&output=embed`}
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Reveal>
      </div>
    </section>
  );
}

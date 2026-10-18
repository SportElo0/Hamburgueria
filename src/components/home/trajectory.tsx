import Image from "next/image";
import Link from "next/link";
import type { Vehicle } from "@/content/types";
import { ArrowRight } from "../icons";
import { Reveal } from "../reveal";
import { CommercialStatus, WorkTrack } from "../vehicle-bits";

/** Chapter IV: a paper spread — what is confirmed, what is pending, where the work stands. */
export function Trajectory({ vehicle }: { vehicle: Vehicle }) {
  const full = vehicle.photos.find((p) => p.src.endsWith("real-full.webp"));
  return (
    <section aria-labelledby="trajetoria-title" className="on-paper relative z-10 py-24 lg:py-32">
      <div className="wrap grid gap-14 lg:grid-cols-12 lg:gap-10">
        <Reveal className="lg:col-span-7">
          <h3 id="trajetoria-title" className="h-section">IV. A trajetória</h3>
          <p className="lede text-soft mt-6 max-w-[40ch]">
            Hoje o Charuto está em preparação e restauração — o trabalho mais adiantado do acervo. O que já sabemos, e o
            que ainda falta confirmar, está registrado abaixo.
          </p>

          <div className="mt-14 grid gap-10 border-t border-[var(--line-light)] pt-8 sm:grid-cols-2">
            <WorkTrack vehicle={vehicle} tone="paper" />
            <CommercialStatus vehicle={vehicle} />
          </div>

          <dl className="mt-12 grid grid-cols-1 border-t border-[var(--line-light)] sm:grid-cols-2">
            {vehicle.vehicleFacts.map((f) => (
              <div key={f.label} className="flex justify-between gap-6 border-b border-[var(--line-light)] py-3.5 sm:odd:mr-5 sm:even:ml-5">
                <dt className="text-soft text-[0.9375rem]">{f.label}</dt>
                <dd className={`tabular text-right text-[0.9375rem] ${f.value.includes("confirmar") ? "text-soft italic" : ""}`}>{f.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link href={`/acervo/${vehicle.slug}`} className="btn btn-primary">
              Ver ficha completa <ArrowRight className="arrow" />
            </Link>
            <Link href={`/acervo/${vehicle.slug}#interesse`} className="btn btn-quiet">
              Tenho interesse neste clássico
            </Link>
          </div>
        </Reveal>

        {full && (
          <Reveal delay={0.1} className="lg:col-span-4 lg:col-start-9">
            <figure>
              <div className="relative aspect-[3/4] overflow-hidden bg-graphite">
                <Image src={full.src} alt={full.alt} fill sizes="(min-width: 64rem) 30vw, 100vw" className="object-cover" />
              </div>
              <figcaption className="caption text-soft mt-3">
                <span className="prov" data-kind="real">Fotografia real, sem retoques no carro. Placas ocultadas. Registro do estado atual — não representa o resultado final.</span>
              </figcaption>
            </figure>
          </Reveal>
        )}
      </div>
    </section>
  );
}

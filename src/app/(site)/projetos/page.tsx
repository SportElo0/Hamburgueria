import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { CommercialStatus, VehiclePlate, WorkTrack } from "@/components/vehicle-bits";
import { getVehicles } from "@/lib/repo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Projetos",
  description: "Acompanhe os projetos de restauração e preparação em andamento no acervo Mercantil.",
};

export default async function ProjetosPage() {
  const vehicles = (await getVehicles()).filter((v) => v.workStage !== "a-confirmar");
  return (
    <>
      <section className="pt-[calc(var(--nav-h)+4rem)] pb-16">
        <div className="wrap">
          <h1 className="h-page max-w-[14ch]">Projetos em andamento.</h1>
          <p className="lede mt-6 max-w-[46ch] text-silver">
            Onde cada carro está no trabalho. As etapas e fotografias de progresso são publicadas pela Mercantil à medida que
            avançam — nada aqui é simulado.
          </p>
        </div>
      </section>
      <section aria-label="Lista de projetos" className="pb-32">
        <div className="wrap">
          <ol className="border-t border-[var(--line-dark)]">
            {vehicles.map((v) => (
              <li key={v.slug} className="grid gap-8 border-b border-[var(--line-dark)] py-12 md:grid-cols-12 md:gap-10">
                <Link href={`/acervo/${v.slug}`} className="block overflow-hidden md:col-span-4">
                  <VehiclePlate vehicle={v} sizes="(min-width: 48rem) 33vw, 100vw" className="aspect-[4/3] w-full" showCaption={false} />
                </Link>
                <div className="md:col-span-8 md:grid md:grid-cols-8 md:gap-10">
                  <div className="md:col-span-4">
                    <h2 className="font-display text-[clamp(2rem,3.4vw,3rem)] leading-none">
                      {v.model} <span className="text-silver">{v.chassis}</span>
                    </h2>
                    <p className="caption tabular mt-2 text-mist">{v.yearLabel} · {v.color.name}</p>
                    <p className="mt-5 text-silver">{v.summary}</p>
                  </div>
                  <div className="mt-8 space-y-6 md:col-span-4 md:mt-0">
                    <WorkTrack vehicle={v} />
                    <CommercialStatus vehicle={v} />
                    <Link href={`/acervo/${v.slug}`} className="link-line inline-flex items-center gap-2 text-[0.9375rem]">
                      Ver ficha <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

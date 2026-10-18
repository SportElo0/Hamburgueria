import type { Metadata } from "next";
import Link from "next/link";
import { CollectionBrowser } from "@/components/collection-browser";
import { ArrowRight } from "@/components/icons";
import { VehiclePlate, WorkTrack } from "@/components/vehicle-bits";
import { getVehicles } from "@/lib/repo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Acervo",
  description: "Mercedes-Benz clássicos do acervo Mercantil: do 250 SE Coupé W111 aos roadsters R107 e R129. Valores sob consulta.",
};

export default async function AcervoPage() {
  const vehicles = await getVehicles();
  const featured = vehicles.find((v) => v.featured) ?? vehicles[0];
  return (
    <>
      <section className="pt-[calc(var(--nav-h)+4rem)] pb-16">
        <div className="wrap">
          <h1 className="h-page max-w-[14ch]">O acervo.</h1>
          <p className="lede mt-6 max-w-[46ch] text-silver">
            Cada carro está num momento diferente: em projeto, em preparação, quase pronto. O estágio do trabalho e a
            situação comercial são informados separadamente — e os valores, sempre sob consulta.
          </p>
        </div>
      </section>

      {featured && (
        <section aria-label="Em destaque" className="pb-24">
          <div className="wrap grid items-end gap-10 lg:grid-cols-12">
            <Link href={`/acervo/${featured.slug}`} className="group block lg:col-span-8">
              <div className="overflow-hidden">
                <VehiclePlate
                  vehicle={featured}
                  priority
                  sizes="(min-width: 64rem) 66vw, 100vw"
                  className="aspect-[16/10] w-full transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:scale-[1.02]"
                />
              </div>
            </Link>
            <div className="lg:col-span-4">
              <h2 className="h-section">
                {featured.model} <span className="text-silver">{featured.chassis}</span>
              </h2>
              {featured.nickname && <p className="mt-3 font-display text-[1.5rem] italic text-silver">“{featured.nickname}”</p>}
              <p className="mt-5 text-silver">{featured.summary}</p>
              <div className="mt-8">
                <WorkTrack vehicle={featured} />
              </div>
              <Link href={`/acervo/${featured.slug}`} className="btn btn-primary mt-8">
                Conhecer este carro <ArrowRight className="arrow" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section aria-label="Todos os automóveis" className="pb-32">
        <div className="wrap">
          <CollectionBrowser vehicles={vehicles} />
        </div>
      </section>
    </>
  );
}

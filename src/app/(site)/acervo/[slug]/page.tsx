import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, WhatsApp } from "@/components/icons";
import { LeadForm } from "@/components/lead-form";
import { VehicleGallery } from "@/components/vehicle-gallery";
import { CommercialStatus, SwatchChip, WorkTrack } from "@/components/vehicle-bits";
import { getSettings, getVehicle, getVehicles } from "@/lib/repo";
import { siteUrl } from "@/lib/site-url";
import { interestMessage, vehicleLabel, whatsappUrl } from "@/lib/whatsapp";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getVehicles()).map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const v = await getVehicle((await params).slug);
  if (!v) return { title: "Carro não encontrado" };
  const photo = v.photos.find((p) => p.kind === "real");
  return {
    title: `${v.maker} ${v.model} ${v.chassis}`,
    description: `${v.summary} ${v.yearLabel}. Valor sob consulta.`,
    openGraph: photo ? { images: [{ url: photo.src, alt: photo.alt }] } : undefined,
  };
}

export default async function VehiclePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [vehicle, all, settings] = await Promise.all([getVehicle(slug), getVehicles(), getSettings()]);
  if (!vehicle) notFound();

  const idx = all.findIndex((v) => v.slug === vehicle.slug);
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];
  const wa = whatsappUrl(settings.whatsapp, interestMessage(vehicle, siteUrl()));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${vehicle.maker} ${vehicle.model} ${vehicle.chassis}`,
    brand: { "@type": "Brand", name: vehicle.maker },
    model: vehicle.model,
    color: vehicle.color.name,
    bodyType: vehicle.body,
    image: vehicle.photos.filter((p) => p.kind === "real").map((p) => `${siteUrl()}${p.src}`),
  };

  return (
    <article className="pt-[calc(var(--nav-h)+2.5rem)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="wrap">
        <nav aria-label="Trilha" className="caption text-mist">
          <Link href="/acervo" className="link-line inline-flex items-center gap-2 hover:text-ivory">
            <ArrowLeft size={14} /> Acervo
          </Link>
        </nav>

        <header className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="min-w-0 lg:col-span-8">
            <h1 className="h-page">
              <span className="sr-only">{vehicle.maker} </span>
              {vehicle.model} <span className="text-silver">{vehicle.chassis}</span>
            </h1>
            <p className="mt-4 text-[0.9375rem] text-silver">
              {vehicle.maker}
              {vehicle.nickname && <span className="ml-3 font-display text-[1.5rem] italic">“{vehicle.nickname}”</span>}
            </p>
          </div>
          <p className="lede text-silver lg:col-span-4">{vehicle.summary}</p>
        </header>

        <div className="mt-14 grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 lg:col-span-8">
            <VehicleGallery vehicle={vehicle} />
          </div>

          <aside className="min-w-0 lg:col-span-4" aria-label="Situação do carro">
            <div className="space-y-8 lg:sticky lg:top-[calc(var(--nav-h)+2rem)]">
              <WorkTrack vehicle={vehicle} />
              <div className="border-t border-[var(--line-dark)] pt-6">
                <CommercialStatus vehicle={vehicle} />
              </div>
              <div className="border-t border-[var(--line-dark)] pt-6 text-[0.9375rem]">
                <ul className="space-y-3">
                  <li><SwatchChip swatch={vehicle.color} size="sm" /></li>
                  {vehicle.roof && <li><SwatchChip swatch={vehicle.roof} size="sm" /></li>}
                  {vehicle.interior && <li><SwatchChip swatch={vehicle.interior} size="sm" /></li>}
                </ul>
              </div>
              <div className="flex flex-col gap-3 border-t border-[var(--line-dark)] pt-6">
                {wa ? (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    <WhatsApp /> Tenho interesse neste clássico
                  </a>
                ) : (
                  <a href="#interesse" className="btn btn-primary">
                    Tenho interesse neste clássico <ArrowRight className="arrow" />
                  </a>
                )}
                <p className="caption text-mist">
                  {wa ? "Abre o WhatsApp com uma mensagem identificando este carro." : "Deixe seu contato e a Mercantil responde pelo WhatsApp."}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <section aria-labelledby="ficha-title" className="on-paper mt-28 py-24">
        <div className="wrap grid gap-16 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <h2 id="ficha-title" className="h-section">Este exemplar</h2>
            <dl className="mt-10 border-t border-[var(--line-light)]">
              {vehicle.vehicleFacts.map((f) => (
                <div key={f.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6 border-b border-[var(--line-light)] py-4">
                  <dt className="text-soft">{f.label}</dt>
                  <dd className={`tabular ${f.value.includes("confirmar") ? "text-soft italic" : ""}`}>{f.value}</dd>
                </div>
              ))}
            </dl>
            {vehicle.notes && <p className="text-soft mt-6">{vehicle.notes}</p>}
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <h2 className="h-sub">Referência do modelo</h2>
            <p className="caption text-soft mt-2 max-w-[44ch]">
              Dados gerais de fábrica da linha {vehicle.model}. As especificações deste exemplar são conferidas na avaliação.
            </p>
            <dl className="mt-6 border-t border-[var(--line-light)]">
              {vehicle.modelReference.map((f) => (
                <div key={f.label} className="border-b border-[var(--line-light)] py-4">
                  <dt className="text-soft text-[0.875rem]">{f.label}</dt>
                  <dd className="tabular mt-1">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-12">
            <h2 className="h-sub">Histórico da preparação</h2>
            {vehicle.history.length ? (
              <ol className="mt-8 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
                {vehicle.history.map((h, n) => (
                  <li key={n} className="border-t border-[var(--line-light)] py-5">
                    {h.date && <p className="caption text-soft tabular">{h.date}</p>}
                    <p className="font-display text-[1.375rem] leading-snug">{h.title}</p>
                    {h.note && <p className="text-soft mt-2 text-[0.9375rem]">{h.note}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-soft mt-4">As etapas deste carro serão registradas aqui à medida que o trabalho avançar.</p>
            )}
          </div>
        </div>
      </section>

      <section id="interesse" aria-labelledby="interesse-title" className="scroll-mt-24 py-24">
        <div className="wrap grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <h2 id="interesse-title" className="h-section">Tenho interesse neste clássico.</h2>
            <p className="lede mt-5 max-w-[34ch] text-silver">
              Conte o que gostaria de saber. A Mercantil responde com a situação atual do {vehicle.model}.
            </p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <LeadForm
              journey="compra"
              vehicle={{ slug: vehicle.slug, label: vehicleLabel(vehicle) }}
              whatsappHref={wa}
              submitLabel="Enviar interesse"
            />
          </div>
        </div>
      </section>

      <nav aria-label="Outros carros do acervo" className="border-t border-[var(--line-dark)]">
        <div className="wrap grid sm:grid-cols-2">
          <Link href={`/acervo/${prev.slug}`} className="group flex items-center gap-4 py-10 sm:border-r sm:border-[var(--line-dark)]">
            <ArrowLeft className="transition-transform group-hover:-translate-x-1" />
            <span>
              <span className="caption block text-mist">Anterior</span>
              <span className="font-display text-[1.75rem] leading-tight">{prev.model} {prev.chassis}</span>
            </span>
          </Link>
          <Link href={`/acervo/${next.slug}`} className="group flex items-center justify-end gap-4 border-t border-[var(--line-dark)] py-10 text-right sm:border-t-0">
            <span>
              <span className="caption block text-mist">Próximo</span>
              <span className="font-display text-[1.75rem] leading-tight">{next.model} {next.chassis}</span>
            </span>
            <ArrowRight className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </nav>
    </article>
  );
}

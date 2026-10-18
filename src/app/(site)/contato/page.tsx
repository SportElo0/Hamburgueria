import type { Metadata } from "next";
import Link from "next/link";
import { WhatsApp } from "@/components/icons";
import { LeadForm } from "@/components/lead-form";
import { STORAGE_PENDING_NOTE, storageConfigured } from "@/lib/storage";
import { getServices, getSettings, getVehicle } from "@/lib/repo";
import { siteUrl } from "@/lib/site-url";
import { interestMessage, restorationMessage, vehicleLabel, whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a Mercantil: interesse em um carro do acervo ou avaliação de restauração do seu clássico.",
};

type Search = { jornada?: string; servico?: string; carro?: string };

export default async function ContatoPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const journey = sp.jornada === "restauracao" ? "restauracao" : "compra";
  const [settings, services, vehicle] = await Promise.all([getSettings(), getServices(), sp.carro ? getVehicle(sp.carro) : null]);
  const service = services.find((s) => s.slug === sp.servico);

  const waBuy = whatsappUrl(
    settings.whatsapp,
    vehicle ? interestMessage(vehicle, siteUrl()) : "Olá, Mercantil. Gostaria de conhecer os carros do acervo.",
  );
  const waRestore = whatsappUrl(settings.whatsapp, restorationMessage({ services: service ? [service.name] : undefined }));

  return (
    <>
      <section className="pt-[calc(var(--nav-h)+4rem)] pb-14">
        <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-end">
          <h1 className="h-page lg:col-span-7">Vamos conversar.</h1>
          <p className="lede text-silver lg:col-span-5">
            Escolha o motivo do contato. As duas conversas chegam à Mercantil e são respondidas pelo WhatsApp.
          </p>
        </div>
      </section>

      <nav aria-label="Motivo do contato" className="wrap">
        <ul className="grid grid-cols-2 border-b border-[var(--line-dark)]">
          {[
            { k: "compra", l: "Comprar um clássico" },
            { k: "restauracao", l: "Restaurar o meu" },
          ].map((t) => (
            <li key={t.k}>
              <Link
                href={`/contato?jornada=${t.k}`}
                aria-current={journey === t.k ? "page" : undefined}
                scroll={false}
                className={`block border-b-2 py-5 font-display text-[clamp(1.375rem,2.4vw,2rem)] leading-tight transition-colors ${journey === t.k ? "border-ivory text-ivory" : "border-transparent text-ivory/55 hover:text-ivory"}`}
              >
                {t.l}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="py-16 lg:py-20">
        <div className="wrap grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-8 lg:col-span-4">
            {journey === "compra" ? (
              <p className="text-silver">
                Interessado em um carro específico? Abra a ficha dele no <Link className="link-line text-ivory" href="/acervo">acervo</Link> e use
                “Tenho interesse neste clássico” — a mensagem já vai identificada.
              </p>
            ) : (
              <p className="text-silver">
                Conte sobre o seu carro. Se quiser, comece pelo <Link className="link-line text-ivory" href="/vision">Mercantil Vision</Link> e
                envie a simulação junto com a solicitação.
              </p>
            )}
            {(journey === "compra" ? waBuy : waRestore) ? (
              <a href={(journey === "compra" ? waBuy : waRestore)!} target="_blank" rel="noopener noreferrer" className="btn btn-quiet">
                <WhatsApp /> Conversar pelo WhatsApp
              </a>
            ) : (
              <p className="caption max-w-[36ch] text-mist">O WhatsApp oficial está em configuração. Use o formulário: a solicitação chega diretamente à Mercantil.</p>
            )}
            {settings.email && (
              <p className="text-[0.9375rem]">
                E-mail: <a className="link-line" href={`mailto:${settings.email}`}>{settings.email}</a>
              </p>
            )}
            {settings.city && <p className="text-[0.9375rem] text-silver">{settings.city}{settings.addressNote ? ` · ${settings.addressNote}` : ""}</p>}
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <LeadForm
              unavailableNote={storageConfigured() ? undefined : STORAGE_PENDING_NOTE}
              key={journey}
              journey={journey}
              vehicle={vehicle ? { slug: vehicle.slug, label: vehicleLabel(vehicle) } : undefined}
              services={journey === "restauracao" ? services.map((s) => ({ slug: s.slug, name: s.name })) : undefined}
              defaultServices={service ? [service.slug] : []}
              whatsappHref={journey === "compra" ? waBuy : waRestore}
              submitLabel={journey === "compra" ? "Enviar mensagem" : "Solicitar avaliação"}
            />
          </div>
        </div>
      </section>
    </>
  );
}

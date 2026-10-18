import Link from "next/link";
import type { Service } from "@/content/types";
import { ArrowRight, Plus } from "../icons";
import { Reveal } from "../reveal";

/** Restoration gets equal billing: a paper spread with the service index and the way in. */
export function RestorationPreview({ services }: { services: Service[] }) {
  const pending = services.some((s) => !s.confirmed);
  return (
    <section aria-labelledby="restauracao-title" className="on-paper relative z-10 py-24 lg:py-36">
      <div className="wrap grid gap-16 lg:grid-cols-12 lg:gap-10">
        <Reveal className="lg:col-span-5">
          <h2 id="restauracao-title" className="h-statement">
            Preservar o passado. <span className="text-soft">Preparar o próximo capítulo.</span>
          </h2>
          <p className="lede text-soft mt-8 max-w-[38ch]">
            A restauração tem o mesmo peso que o acervo. Cada carro começa com uma avaliação: o que preservar, o que
            recuperar e em que ordem.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/contato?jornada=restauracao" className="btn btn-primary">
              Solicitar avaliação <ArrowRight className="arrow" />
            </Link>
            <Link href="/restauracao" className="btn btn-quiet">
              Conhecer os serviços
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-6 lg:col-start-7">
          <ul className="border-t border-[var(--line-light)]">
            {services.map((s) => (
              <li key={s.slug} className="border-b border-[var(--line-light)]">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                    <span>
                      <span className="block font-display text-[clamp(1.5rem,2.6vw,2.25rem)] leading-tight">{s.name}</span>
                      <span className="text-soft mt-1 block text-[0.9375rem]">{s.short}</span>
                    </span>
                    <Plus size={20} className="flex-none transition-transform duration-500 group-open:rotate-45" />
                  </summary>
                  <div className="pb-7">
                    <p className="text-soft max-w-[52ch]">{s.description}</p>
                    <Link href={`/contato?jornada=restauracao&servico=${s.slug}`} className="link-line mt-4 inline-block text-[0.9375rem] font-medium">
                      Pedir avaliação para {s.name.toLowerCase()}
                    </Link>
                  </div>
                </details>
              </li>
            ))}
          </ul>
          {pending && (
            <p className="caption text-soft mt-5">Categorias de serviço em confirmação com a Mercantil.</p>
          )}
        </Reveal>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { Comparator } from "@/components/comparator";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { WorkTrack } from "@/components/vehicle-bits";
import { getServices, getVehicles } from "@/lib/repo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Restauração",
  description: "Restauração de Mercedes-Benz clássicos: avaliação, funilaria e pintura, interiores, acabamentos e projetos especiais. Solicite uma avaliação.",
};

const steps = [
  { title: "Você conta a história do carro", body: "Modelo, ano, fotos e o que gostaria que ele fosse. Pode começar pelo Mercantil Vision." },
  { title: "Avaliação com a Mercantil", body: "O carro é visto de perto para entender o estado real e o que deve ser preservado." },
  { title: "Uma conversa sobre o caminho", body: "O que fazer, em que ordem e o que é possível — antes de qualquer decisão." },
];

export default async function RestauracaoPage() {
  const [services, vehicles] = await Promise.all([getServices(), getVehicles()]);
  const inWork = vehicles.filter((v) => ["projeto", "funilaria-pintura", "preparacao", "quase-pronto"].includes(v.workStage));
  return (
    <>
      <section className="on-paper pt-[calc(var(--nav-h)+4rem)] pb-24">
        <div className="wrap grid gap-12 lg:grid-cols-12 lg:items-end">
          <h1 className="h-statement lg:col-span-8">
            Preservar o passado. <span className="text-soft">Preparar o próximo capítulo.</span>
          </h1>
          <div className="lg:col-span-4">
            <p className="lede text-soft">Restaurar é decidir, peça a peça, o que um carro precisa para continuar a sua história.</p>
            <Link href="/contato?jornada=restauracao" className="btn btn-primary mt-8">
              Solicitar avaliação <ArrowRight className="arrow" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="servicos-title" className="py-24 lg:py-32">
        <div className="wrap">
          <h2 id="servicos-title" className="h-section">Serviços</h2>
          <p className="caption mt-3 text-mist">Categorias em confirmação com a Mercantil; a lista final será publicada pelo proprietário.</p>
          <div className="mt-14 border-t border-[var(--line-dark)]">
            {services.map((s, i) => (
              <Reveal key={s.slug} delay={i * 0.03}>
                <div id={s.slug} className="grid scroll-mt-28 gap-4 border-b border-[var(--line-dark)] py-10 md:grid-cols-12 md:gap-10">
                  <h3 className="font-display text-[clamp(1.875rem,3.2vw,3rem)] leading-none md:col-span-5">{s.name}</h3>
                  <p className="text-silver md:col-span-4">{s.description}</p>
                  <div className="md:col-span-3 md:text-right">
                    <Link href={`/contato?jornada=restauracao&servico=${s.slug}`} className="link-line text-[0.9375rem]">
                      Pedir avaliação
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="como-title" className="on-paper py-24 lg:py-32">
        <div className="wrap">
          <h2 id="como-title" className="h-section max-w-[16ch]">Como começa uma restauração</h2>
          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="border-t border-[var(--line-light)] pt-6">
                <span className="font-display text-[3.5rem] leading-none text-ink-soft">{["I", "II", "III"][i]}</span>
                <h3 className="h-sub mt-4">{s.title}</h3>
                <p className="text-soft mt-3">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="antes-title" className="py-24 lg:py-32">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 id="antes-title" className="h-section">Antes e depois</h2>
            <p className="lede mt-5 text-silver">
              Comparações reais, do mesmo carro e do mesmo ângulo, serão publicadas conforme os projetos forem concluídos.
              Não usamos imagens geradas por IA como prova de trabalho feito.
            </p>
            <Link href="/vision" className="btn btn-quiet mt-8">
              Simular o seu carro no Vision <ArrowRight className="arrow" />
            </Link>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <Comparator
              before={{ src: "/media/charuto/real-grille.webp", alt: "Grade do W111 no estado atual, fotografia real" }}
              beforeLabel="Antes · fotografia real"
              afterLabel="Depois"
              pendingAfter="Depois · aguardando a conclusão do projeto do W111"
            />
          </div>
        </div>
      </section>

      {inWork.length > 0 && (
        <section aria-labelledby="andamento-title" className="border-t border-[var(--line-dark)] py-24">
          <div className="wrap">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 id="andamento-title" className="h-section">Em andamento</h2>
              <Link href="/projetos" className="link-line text-[0.9375rem]">Acompanhar os projetos</Link>
            </div>
            <ul className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
              {inWork.map((v) => (
                <li key={v.slug} className="border-t border-[var(--line-dark)] pt-5">
                  <Link href={`/acervo/${v.slug}`} className="font-display text-[1.75rem] leading-tight hover:text-wine-soft">
                    {v.model} <span className="text-silver">{v.chassis}</span>
                  </Link>
                  <div className="mt-4"><WorkTrack vehicle={v} /></div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}

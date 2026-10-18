import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Atelier",
  description: "Por trás de cada clássico, existe um trabalho. Conheça a relação da Mercantil com os automóveis clássicos.",
};

/**
 * Institutional copy is deliberately provisional and marked as such until the owner provides
 * official information. No founding dates, counts, team or facilities are claimed.
 */
const values = [
  { title: "Precisão", body: "Entender o carro antes de mexer nele." },
  { title: "Preservação", body: "Manter o que é original sempre que possível." },
  { title: "Transparência", body: "Mostrar o carro como ele está — e dizer o que ainda não se sabe." },
];

export default function AtelierPage() {
  return (
    <>
      <section className="relative pt-[calc(var(--nav-h)+4rem)] pb-20">
        <div className="wrap grid gap-12 lg:grid-cols-12 lg:items-end">
          <h1 className="h-statement lg:col-span-8">Por trás de cada clássico, existe um trabalho.</h1>
          <p className="lede text-silver lg:col-span-4">
            A Mercantil vive entre duas coisas: um acervo de Mercedes-Benz clássicos e o trabalho de devolvê-los à estrada.
          </p>
        </div>
      </section>

      <section aria-label="O carro de perto" className="pb-24">
        <div className="wrap grid gap-6 md:grid-cols-12">
          <figure className="md:col-span-7">
            <div className="relative aspect-[4/3] overflow-hidden bg-graphite">
              <Image src="/media/charuto/real-hand.webp" alt="Mão apontando detalhes da grade e do para-lama do W111" fill sizes="(min-width: 48rem) 58vw, 100vw" className="object-cover" />
            </div>
            <figcaption className="caption mt-3 text-mist"><span className="prov" data-kind="real">Fotografia real · o Charuto em avaliação</span></figcaption>
          </figure>
          <figure className="md:col-span-5 md:mt-24">
            <div className="relative aspect-[4/5] overflow-hidden bg-graphite">
              <Image src="/media/charuto/real-star.webp" alt="Estrela de capô do W111" fill sizes="(min-width: 48rem) 40vw, 100vw" className="object-cover" />
            </div>
            <figcaption className="caption mt-3 text-mist"><span className="prov" data-kind="real">Fotografia real · detalhe</span></figcaption>
          </figure>
        </div>
      </section>

      <section aria-labelledby="operacao-title" className="on-paper py-24 lg:py-32">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <h2 id="operacao-title" className="h-section">A operação</h2>
            <p className="caption text-soft mt-4 inline-flex items-center gap-2 rounded-sm border border-[var(--line-light)] px-2.5 py-1.5">
              Texto provisório · aguardando informações oficiais da Mercantil
            </p>
          </Reveal>
          <Reveal delay={0.06} className="space-y-6 text-[1.125rem] leading-relaxed lg:col-span-6 lg:col-start-7">
            <p>
              Um acervo de automóveis clássicos, principalmente Mercedes-Benz, em diferentes estágios de conservação,
              preparação e restauração. Alguns carros estão quase prontos; outros começam agora a sua próxima fase.
            </p>
            <p className="text-soft">
              Ao lado do acervo, a Mercantil recebe carros de proprietários que querem restaurar, repintar ou recuperar o
              interior do seu clássico. O espaço de trabalho, a equipe e os projetos concluídos serão apresentados aqui com
              fotografias reais assim que forem disponibilizados.
            </p>
          </Reveal>
        </div>
        <div className="wrap mt-20">
          <h2 className="h-sub">Valores</h2>
          <ul className="mt-8 grid border-t border-[var(--line-light)] md:grid-cols-3">
            {values.map((v) => (
              <li key={v.title} className="border-b border-[var(--line-light)] py-8 md:border-b-0 md:pr-10 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:pl-10">
                <p className="font-display text-[2.25rem] leading-none">{v.title}</p>
                <p className="text-soft mt-3">{v.body}</p>
              </li>
            ))}
          </ul>
          <p className="caption text-soft mt-6">Valores propostos para validação do proprietário.</p>
        </div>
      </section>

      <section className="py-24">
        <div className="wrap flex flex-wrap items-end justify-between gap-8">
          <h2 className="h-section max-w-[18ch]">Tem um clássico com história para continuar?</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/contato?jornada=restauracao" className="btn btn-primary">Solicitar avaliação <ArrowRight className="arrow" /></Link>
            <Link href="/acervo" className="btn btn-quiet">Ver o acervo</Link>
          </div>
        </div>
      </section>
    </>
  );
}

import { ArrowRight } from "lucide-react";
import { site } from "@/config/site";
import { areas } from "@/data/areas";
import { Band } from "@/components/band";
import { DraftNote, Pending } from "@/components/pending";

export function About() {
  const facts: { term: string; value: React.ReactNode }[] = [
    { term: "Responsável", value: site.lawyer },
    { term: "Atuação", value: site.region },
    { term: "Áreas", value: `${areas.length} áreas do Direito` },
    { term: "Inscrição na OAB", value: site.oab ?? <Pending /> },
  ];

  return (
    <section id="escritorio" aria-labelledby="escritorio-title" className="bg-ivory">
      <Band className="text-gold/55" seed={0.4} />
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:py-32">
        <h2
          id="escritorio-title"
          data-reveal
          className="display max-w-[14ch] text-[clamp(2.3rem,4.4vw,4rem)] text-navy lg:col-span-5"
        >
          Atuação jurídica com seriedade e responsabilidade.
        </h2>

        <div className="lg:col-span-6 lg:col-start-7">
          <div data-reveal className="space-y-5 text-[1.0625rem] leading-relaxed text-graphite">
            <p className="text-[1.25rem] leading-snug text-navy">
              O escritório Odair Alves da Silva & Advogados oferece orientação jurídica em diferentes áreas do Direito,
              no Estado de São Paulo.
            </p>
            <p>
              Cada demanda é analisada de forma individualizada: antes de qualquer encaminhamento, o primeiro passo é
              compreender os fatos, os documentos e as particularidades da situação.
            </p>
            <p>
              A comunicação é feita com clareza, para que cada pessoa entenda o que está em jogo, quais são os caminhos
              possíveis e quais são os limites de cada um. O compromisso é com a responsabilidade profissional e a
              atenção a cada questão, sem promessas de resultado.
            </p>
          </div>

          <dl data-reveal className="mt-10 grid grid-cols-1 border-t border-navy sm:grid-cols-2">
            {facts.map((fact) => (
              <div key={fact.term} className="border-b border-line-strong py-4 sm:odd:pr-6 sm:even:border-l sm:even:pl-6">
                <dt className="label text-gold-ink">{fact.term}</dt>
                <dd className="mt-1.5 text-[1rem] text-navy">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div data-reveal className="mt-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <a href="#areas" className="btn btn-navy">
              Ver áreas de atuação
              <ArrowRight size={16} className="nudge" />
            </a>
            <DraftNote />
          </div>
        </div>
      </div>
    </section>
  );
}

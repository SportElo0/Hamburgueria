import { DraftNote } from "@/components/pending";

const steps = [
  {
    title: "Contato inicial",
    text: "Você entra em contato pelos canais do escritório com um resumo breve do assunto, sem enviar documentos.",
  },
  {
    title: "Compreensão da demanda",
    text: "O escritório procura entender a situação, esclarece dúvidas iniciais e identifica quais informações serão necessárias.",
  },
  {
    title: "Avaliação jurídica",
    text: "O profissional analisa os fatos, os documentos pertinentes e a legislação aplicável ao caso.",
  },
  {
    title: "Orientação sobre encaminhamentos",
    text: "Você recebe orientação sobre os caminhos possíveis, seus limites e os próximos passos, sem promessa de resultado.",
  },
];

/** Linha do tempo do atendimento: o fio dourado se preenche conforme a seção entra na tela. */
export function Approach() {
  return (
    <section id="abordagem" aria-labelledby="abordagem-title" className="bg-paper">
      <div className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
          <h2 id="abordagem-title" data-reveal className="display max-w-[16ch] text-[clamp(2.3rem,4.4vw,4rem)] text-navy lg:col-span-6">
            Como o atendimento se organiza.
          </h2>
          <div data-reveal className="lg:col-span-5 lg:col-start-8">
            <p className="max-w-[46ch] text-[1.0625rem] leading-relaxed text-muted">
              Uma estrutura em quatro momentos, do primeiro contato à orientação. Prazos e resultados dependem de cada
              caso e não são prometidos.
            </p>
            <DraftNote className="mt-5">Estrutura provisória, sujeita à validação do Dr. Odair.</DraftNote>
          </div>
        </div>

        <ol className="relative mt-16 grid grid-cols-1 gap-12 lg:mt-20 lg:grid-cols-4 lg:gap-8">
          {/* Fio da linha do tempo: horizontal no desktop, vertical no celular. */}
          <span aria-hidden className="absolute top-0 bottom-0 left-[0.6875rem] w-px bg-line-strong lg:top-[0.6875rem] lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-auto" />
          <span aria-hidden className="fill-y absolute top-0 bottom-0 left-[0.6875rem] w-px bg-gold lg:hidden" />
          <span aria-hidden className="fill-x absolute top-[0.6875rem] right-0 left-0 hidden h-px bg-gold lg:block" />

          {steps.map((step, i) => (
            <li key={step.title} data-reveal style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties} className="relative pl-12 lg:pt-12 lg:pl-0">
              <span aria-hidden className="absolute top-0 left-0 grid size-[1.375rem] place-items-center rounded-full border border-gold bg-paper">
                <span className="size-2 rounded-full bg-gold" />
              </span>
              <p className="display tabular text-[2.4rem] leading-none text-gold-ink">
                <span className="sr-only">Etapa </span>
                {i + 1}
              </p>
              <h3 className="mt-4 text-[1.1875rem] font-semibold text-navy">{step.title}</h3>
              <p className="mt-2 max-w-[34ch] text-[0.9375rem] leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

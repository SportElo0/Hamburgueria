import { Plus } from "lucide-react";
import { site } from "@/config/site";
import { areas } from "@/data/areas";

export type FaqItem = { q: string; a: React.ReactNode };

export const homeFaq: FaqItem[] = [
  {
    q: "Quais áreas do Direito são atendidas?",
    a: `O escritório atua em ${areas.map((a) => a.name).join(", ").replace(/, ([^,]*)$/, " e $1")}. Cada área tem uma página com os assuntos abordados.`,
  },
  {
    q: "Como posso entrar em contato?",
    a: site.whatsapp
      ? `Pelo WhatsApp ${site.whatsapp.display} ou pelo formulário da seção de contato, que deixa a mensagem pronta para enviar. Basta um resumo breve do assunto.`
      : "Pela seção de contato desta página, onde estão os canais do escritório. Basta um resumo breve do assunto e um meio de retorno.",
  },
  {
    q: "O escritório atua no Estado de São Paulo?",
    a: `Sim. O escritório informa atuação no ${site.region}.`,
  },
  {
    q: "Como funciona o atendimento inicial?",
    a: "Depois do primeiro contato, o escritório procura entender a demanda e, quando for o caso, o profissional avalia a situação e orienta sobre os caminhos possíveis. Não há promessa de prazo ou de resultado.",
  },
  {
    q: "Quais informações devo apresentar no primeiro contato?",
    a: "Apenas seu nome, um meio de retorno e um resumo breve do assunto. Não envie documentos nem detalhes sensíveis pelo site; se forem necessários, serão solicitados depois, por um canal adequado.",
  },
];

/** Perguntas em <details>: abre e fecha sem JS e funciona com teclado. */
export function FaqList({ items, tone = "light" }: { items: FaqItem[]; tone?: "light" | "dark" }) {
  return (
    <div className={`border-t ${tone === "light" ? "border-navy" : "border-gold/60"}`}>
      {items.map((item) => (
        <details key={item.q} className={`group border-b ${tone === "light" ? "border-line-strong" : "border-blue-line"}`}>
          <summary
            className={`flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.0625rem] font-semibold transition-colors [&::-webkit-details-marker]:hidden ${
              tone === "light" ? "text-navy hover:text-gold-ink" : "text-ivory hover:text-gold"
            }`}
          >
            {item.q}
            <Plus
              size={20}
              strokeWidth={1.5}
              aria-hidden
              className={`flex-none transition-transform duration-500 ease-[var(--ease-out-expo)] group-open:rotate-45 ${
                tone === "light" ? "text-gold-ink" : "text-gold"
              }`}
            />
          </summary>
          <p className={`max-w-[68ch] pb-6 text-[1rem] leading-relaxed ${tone === "light" ? "text-muted" : "text-on-navy-muted"}`}>
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}

export function Faq() {
  return (
    <section id="perguntas" aria-labelledby="perguntas-title" className="bg-paper">
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-10 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:py-32">
        <div className="lg:col-span-4">
          <h2 id="perguntas-title" data-reveal className="display max-w-[12ch] text-[clamp(2.3rem,4.4vw,4rem)] text-navy">
            Perguntas frequentes
          </h2>
          <p data-reveal className="mt-5 max-w-[36ch] text-[1rem] leading-relaxed text-muted">
            Respostas gerais sobre o escritório. Questões jurídicas específicas dependem da análise de cada caso.
          </p>
        </div>
        <div data-reveal className="lg:col-span-7 lg:col-start-6">
          <FaqList items={homeFaq} />
        </div>
      </div>
    </section>
  );
}

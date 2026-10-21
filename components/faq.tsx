import { Plus } from "lucide-react";
import { fullAddress, site } from "@/config/site";
import { hoursSummary } from "@/lib/seo";

function buildFaq() {
  const pricesPending = site.services.every((s) => s.price === null);
  const hours = hoursSummary()
    .map((row) => `${row.label}: ${row.value}`)
    .join("; ");

  return [
    {
      q: "Como faço para solicitar meu horário?",
      a: `Na seção "Agende seu horário", escolha o serviço, a data desejada, um horário de preferência e informe seu primeiro nome. O site monta a mensagem e abre o WhatsApp do ${site.barberFirstName}; é só enviar.`,
    },
    {
      q: "O agendamento é confirmado automaticamente?",
      a: `Não. O site não tem agenda online: o que você envia é um pedido. O ${site.barberFirstName} responde pelo WhatsApp confirmando o horário ou sugerindo outro, e o horário só vale depois dessa confirmação.`,
    },
    {
      q: "Onde fica a barbearia?",
      a: `${fullAddress}. Na seção Localização há o botão "Como chegar", que abre a rota no Google Maps.`,
    },
    {
      q: "Posso falar diretamente pelo WhatsApp?",
      a: `Pode. O número é ${site.whatsapp.display}. Você também pode mandar mensagem pelo Instagram @${site.instagram.handle}.`,
    },
    {
      q: "Quais serviços vocês fazem?",
      a: `${site.services.map((s) => s.name).join(", ")}. ${
        pricesPending
          ? "Os valores são informados pelo WhatsApp."
          : "Os valores estão na seção Serviços."
      }`,
    },
    {
      q: "Qual o horário de funcionamento?",
      a: `${hours}.${
        site.hours.confirmed
          ? ""
          : " Horário conforme o Instagram, sujeito a confirmação; em caso de dúvida, chame no WhatsApp."
      }`,
    },
  ];
}

export function Faq() {
  const items = buildFaq();

  return (
    <section aria-labelledby="faq-title" className="bg-fade-0 py-20 sm:py-28 lg:py-36">
      <div className="mx-auto grid max-w-[90rem] gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-10">
        <h2
          id="faq-title"
          data-reveal="rise"
          className="display text-[clamp(3rem,11vw,5.5rem)] lg:col-span-4"
        >
          Dúvidas
        </h2>
        <div className="border-t border-line lg:col-span-8">
          {items.map((item) => (
            <details key={item.q} className="group border-b border-line">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-[1.08rem] font-semibold transition-colors hover:text-blue-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden
                  className="grid size-9 flex-none place-items-center rounded-[3px] border border-line-strong transition-transform duration-300 group-open:rotate-45"
                >
                  <Plus size={17} />
                </span>
              </summary>
              <p className="max-w-[62ch] pb-6 text-[1rem] leading-relaxed text-steel">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

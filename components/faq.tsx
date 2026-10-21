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
    <section
      aria-labelledby="faq-title"
      className="border-t border-line bg-paper py-24 sm:py-28 lg:py-36"
    >
      <div className="mx-auto grid grid-cols-1 max-w-[88rem] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:px-12">
        <div className="lg:col-span-4">
          <h2 id="faq-title" data-reveal className="serif text-[clamp(2.75rem,8vw,4.25rem)]">
            Dúvidas frequentes.
          </h2>
          <span aria-hidden data-reveal="risca" className="risca mt-7" />
        </div>
        <div className="border-t border-line lg:col-span-8">
          {items.map((item) => (
            <details key={item.q} className="group border-b border-line">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-6 text-left [&::-webkit-details-marker]:hidden">
                <span className="serif text-[1.45rem] leading-snug transition-colors group-hover:text-champagne-deep">
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className="grid size-10 flex-none place-items-center rounded-full border border-line-strong transition-[transform,border-color] duration-500 ease-[var(--ease-out-expo)] group-open:rotate-45 group-open:border-ink"
                >
                  <Plus size={16} strokeWidth={1.5} />
                </span>
              </summary>
              <p className="max-w-[62ch] pb-7 text-[1.0625rem] leading-relaxed text-graphite">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

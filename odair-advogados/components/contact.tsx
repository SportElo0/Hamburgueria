import { Map as MapIcon, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { site, whatsappUrl } from "@/config/site";
import { ContactForm } from "@/components/contact-form";
import { Pending } from "@/components/pending";
import { Rosette } from "@/components/rosette";

const watermark = { lobes: 20, wobble: 4, rings: 5, copies: 8, seed: 0.8 };

export function Contact() {
  const wa = whatsappUrl();
  const channels = [
    { icon: Phone, label: "Telefone", value: site.phone?.display, href: site.phone ? `tel:${site.phone.e164}` : null },
    { icon: MessageCircle, label: "WhatsApp", value: site.whatsapp?.display, href: wa },
    { icon: Mail, label: "E-mail", value: site.email, href: site.email ? `mailto:${site.email}` : null },
    {
      icon: MapPin,
      label: "Endereço",
      value: site.address ? `${site.address.street}, ${site.address.city} – ${site.address.state}` : null,
      href: null,
    },
  ];

  return (
    <section id="contato" aria-labelledby="contato-title" className="relative overflow-hidden bg-navy text-ivory">
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-40 w-[38rem] text-gold/30 max-lg:hidden">
        <Rosette spec={watermark} steps={480} />
      </div>
      <div className="relative mx-auto grid max-w-[90rem] grid-cols-1 gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:py-32">
        <div className="lg:col-span-5">
          <h2 id="contato-title" data-reveal className="display max-w-[12ch] text-[clamp(2.3rem,4.6vw,4.2rem)]">
            Fale com o <span className="text-gold">escritório.</span>
          </h2>
          <p data-reveal className="mt-6 max-w-[42ch] text-[1.0625rem] leading-relaxed text-on-navy-muted">
            Conte, em poucas linhas, do que se trata. O primeiro contato não exige documentos, e o retorno é feito pelo
            meio que você informar.
          </p>

          <dl data-reveal className="mt-10 border-t border-blue-line">
            {channels.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-center gap-4 border-b border-blue-line py-4">
                <Icon size={18} strokeWidth={1.4} aria-hidden className="flex-none text-gold" />
                <dt className="w-24 flex-none text-[0.875rem] text-on-navy-muted">{label}</dt>
                <dd className="min-w-0 text-[1rem]">
                  {value ? (
                    href ? (
                      <a href={href} className="link-line text-ivory" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        {value}
                      </a>
                    ) : (
                      value
                    )
                  ) : (
                    <Pending label="a confirmar" tone="dark" />
                  )}
                </dd>
              </div>
            ))}
            <div className="flex items-center gap-4 border-b border-blue-line py-4">
              <MapIcon size={18} strokeWidth={1.4} aria-hidden className="flex-none text-gold" />
              <dt className="w-24 flex-none text-[0.875rem] text-on-navy-muted">Atuação</dt>
              <dd className="text-[1rem]">{site.region}</dd>
            </div>
          </dl>

          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-gold mt-8">
              <MessageCircle size={16} />
              Conversar pelo WhatsApp
            </a>
          )}
        </div>

        <div data-reveal className="rounded-[4px] bg-paper p-6 text-graphite sm:p-8 lg:col-span-6 lg:col-start-7 lg:p-10">
          <h3 className="text-[1.25rem] font-semibold text-navy">Envie uma mensagem</h3>
          <p className="mt-1.5 mb-6 text-[0.9375rem] text-muted">
            Quatro campos, sem cadastro.{site.contactDelivery === "whatsapp" ? " A conversa segue pelo WhatsApp." : ""}
          </p>
          <ContactForm channel={site.contactDelivery ?? "demo"} />
        </div>
      </div>
    </section>
  );
}

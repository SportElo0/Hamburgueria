import { nav, site } from "@/config/site";
import { greetingLink } from "@/lib/whatsapp";
import { InstagramIcon, Wordmark, WhatsAppIcon } from "@/components/brand";

export function Footer() {
  return (
    <footer className="border-t border-line bg-fade-0 pb-28 lg:pb-10">
      {/* Faixa final em degraus, fechando o degradê da página. */}
      <div aria-hidden className="flex h-3">
        {["bg-fade-1", "bg-fade-2", "bg-fade-3", "bg-fade-4", "bg-fade-5"].map((tone) => (
          <span key={tone} className={`flex-1 ${tone}`} />
        ))}
      </div>

      <div className="mx-auto grid max-w-[90rem] gap-12 px-4 pt-14 sm:px-6 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-4">
          <Wordmark />
          <p className="mt-5 max-w-[34ch] text-sm leading-relaxed text-steel">
            Barbearia do {site.barber} no {site.address.neighborhood}, {site.address.city} –{" "}
            {site.address.state}.
          </p>
        </div>

        <nav aria-label="Rodapé" className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-steel">Navegação</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 lg:grid-cols-1">
            {[...nav, { href: "#agendar", label: "Agendar" }].map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex min-h-10 items-center text-[0.95rem] font-semibold hover:text-blue-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-5">
          <h2 className="text-sm font-semibold text-steel">Contato</h2>
          <ul className="mt-4 flex flex-col gap-1">
            <li>
              <a
                href={greetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-3 font-semibold hover:text-blue-ink"
              >
                <WhatsAppIcon size={19} />
                <span className="tabular">{site.whatsapp.display}</span>
              </a>
            </li>
            <li>
              <a
                href={site.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-3 font-semibold hover:text-blue-ink"
              >
                <InstagramIcon size={19} />@{site.instagram.handle}
              </a>
            </li>
            <li>
              <a
                href={site.links.directions}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-start gap-3 py-2 text-[0.95rem] text-paper/90 hover:text-blue-ink"
              >
                <span aria-hidden className="mt-1.5 h-2 w-2 flex-none rounded-full bg-pole" />
                <span>
                  {site.address.street} — {site.address.neighborhood}, {site.address.city} –{" "}
                  {site.address.state}, {site.address.postalCode}
                </span>
              </a>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 border-t border-line pt-6 text-xs text-steel sm:flex-row sm:justify-between lg:col-span-12">
          <p>
            © {site.copyrightYear} {site.name} · {site.barber}. Todos os direitos reservados.
          </p>
          {site.credit &&
            (site.credit.href ? (
              <a
                href={site.credit.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-paper"
              >
                {site.credit.label}
              </a>
            ) : (
              <p>{site.credit.label}</p>
            ))}
        </div>
      </div>
    </footer>
  );
}

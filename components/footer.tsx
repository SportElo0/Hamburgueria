import { nav, site } from "@/config/site";
import { hoursSummary } from "@/lib/seo";
import { greetingLink } from "@/lib/whatsapp";
import { InstagramIcon, Wordmark, WhatsAppIcon } from "@/components/brand";

export function Footer() {
  const hours = hoursSummary();

  return (
    <footer className="border-t border-line bg-ground pb-28 lg:pb-12">
      <div className="mx-auto grid grid-cols-1 max-w-[88rem] gap-12 px-5 pt-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:px-12 lg:pt-20">
        <div className="lg:col-span-3">
          <Wordmark className="text-ink" />
          <p className="mt-6 max-w-[30ch] text-[0.95rem] leading-relaxed text-muted">
            Barbearia do {site.barber} no {site.address.neighborhood}, {site.address.city} –{" "}
            {site.address.state}.
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href={site.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram @${site.instagram.handle}`}
              className="grid size-11 place-items-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink"
            >
              <InstagramIcon size={18} />
            </a>
            <a
              href={greetingLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${site.whatsapp.display}`}
              className="grid size-11 place-items-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink"
            >
              <WhatsAppIcon size={18} />
            </a>
          </div>
        </div>

        <nav aria-label="Rodapé" className="lg:col-span-2 lg:col-start-5">
          <h2 className="label text-ink">Navegação</h2>
          <ul className="mt-5 flex flex-col">
            {[...nav, { href: "#agendar", label: "Agendar" }].map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex min-h-10 items-center text-[0.95rem] text-graphite hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-2">
          <h2 className="label text-ink">Serviços</h2>
          <ul className="mt-5 flex flex-col">
            {site.services.map((service) => (
              <li
                key={service.id}
                className="flex min-h-10 items-center text-[0.95rem] text-graphite"
              >
                {service.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h2 className="label text-ink">Contato</h2>
          <ul className="mt-5 flex flex-col gap-3 text-[0.95rem] leading-relaxed text-graphite">
            <li>
              <a
                href={site.links.directions}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink"
              >
                {site.address.street}
                <br />
                {site.address.neighborhood}, {site.address.city} – {site.address.state},{" "}
                {site.address.postalCode}
              </a>
            </li>
            <li>
              <a
                href={greetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="tabular hover:text-ink"
              >
                {site.whatsapp.display}
              </a>
            </li>
            <li>
              {hours.map((row) => (
                <span key={row.label} className="tabular block">
                  {row.label}: {row.value}
                </span>
              ))}
              {!site.hours.confirmed && (
                <span className="block text-[0.8125rem] text-muted">(a confirmar)</span>
              )}
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-5 pt-6 text-[0.8125rem] text-muted sm:col-span-2 lg:col-span-12">
          <span aria-hidden className="h-px flex-1 bg-line" />
          <p className="text-center">
            © {site.copyrightYear} {site.name} · {site.barber}. Todos os direitos reservados.
            {site.credit &&
              (site.credit.href ? (
                <>
                  {" "}
                  ·{" "}
                  <a
                    href={site.credit.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-ink"
                  >
                    {site.credit.label}
                  </a>
                </>
              ) : (
                <> · {site.credit.label}</>
              ))}
          </p>
          <span aria-hidden className="h-px flex-1 bg-line" />
        </div>
      </div>
    </footer>
  );
}

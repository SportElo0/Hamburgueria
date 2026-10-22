import { fullAddress, nav, site } from "@/config/site";
import { greetingLink } from "@/lib/order";
import { InstagramIcon, Wordmark, WhatsAppIcon } from "@/components/brand";

export function Footer() {
  return (
    <footer className="scallop-top -mt-[11px] bg-cocoa-deep text-cream">
      <div className="mx-auto max-w-[90rem] px-5 pt-20 pb-28 sm:px-8 lg:px-12 lg:pt-24 lg:pb-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Wordmark tone="cream" className="items-start! [&>span:last-child]:ml-1" />
            <p className="mt-6 max-w-[32ch] text-[1rem] leading-relaxed text-on-cocoa-muted">
              {site.tagline} Bolos sob encomenda em {site.address.city}, no litoral de São Paulo.
            </p>
          </div>

          <nav aria-label="Rodapé" className="lg:col-span-3 lg:col-start-6">
            <p className="smallcaps text-rose">Navegue</p>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="inline-flex min-h-11 items-center text-[0.9375rem] text-cream hover:text-rose">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-4 lg:col-start-9">
            <p className="smallcaps text-rose">Contato</p>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-on-cocoa-muted">{fullAddress}</p>
            <div className="mt-5 flex flex-col gap-1">
              <a href={greetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-3 text-cream hover:text-rose">
                <WhatsAppIcon size={18} />
                <span className="tabular">{site.whatsapp.display}</span>
              </a>
              <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-3 text-cream hover:text-rose">
                <InstagramIcon size={18} />
                {site.instagram.handle}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-cocoa-line pt-6 text-[0.8125rem] text-on-cocoa-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {site.name}. Fotos: Instagram {site.instagram.handle}.</p>
          {site.demo && (
            <p>Site em demonstração: proposta apresentada à {site.owner}.</p>
          )}
        </div>
      </div>
    </footer>
  );
}

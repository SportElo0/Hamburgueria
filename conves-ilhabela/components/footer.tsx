import { menuSettings } from "@/data/menu";
import { fullAddress, nav, site } from "@/config/site";
import { Hull, InstagramIcon, Wordmark } from "@/components/brand";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-deep text-sand">
      <Hull size={420} strokeWidth={0.35} className="pointer-events-none absolute -right-28 -bottom-40 text-deep-line" />
      <div className="relative mx-auto max-w-[90rem] px-5 pt-20 pb-28 sm:px-8 lg:px-12 lg:pt-24 lg:pb-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Wordmark tone="light" />
            <p className="mt-6 max-w-[34ch] text-[1rem] leading-relaxed text-on-deep-muted">
              Restaurante à beira-mar no {site.address.neighborhood}, em {site.address.city}. Peixes,
              camarões e carnes num espaço aberto entre árvores e a água.
            </p>
          </div>
          <nav aria-label="Rodapé" className="lg:col-span-3 lg:col-start-6">
            <p className="label text-champagne-soft">Navegue</p>
            <ul className="mt-5 grid grid-cols-2 gap-x-6">
              {[...nav, { href: "#reservar", label: "Reservas" }].map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="inline-flex min-h-11 items-center text-[0.9375rem] hover:text-champagne-soft">
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={menuSettings.catalogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-[0.9375rem] hover:text-champagne-soft"
                >
                  Catálogo digital
                </a>
              </li>
            </ul>
          </nav>
          <div className="lg:col-span-4 lg:col-start-9">
            <p className="label text-champagne-soft">Contato</p>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-on-deep-muted">{fullAddress}</p>
            <a href={`tel:${site.phone.e164}`} className="mt-3 inline-flex min-h-11 items-center tabular hover:text-champagne-soft">
              {site.phone.display}
            </a>
            <a
              href={site.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-3 hover:text-champagne-soft"
            >
              <InstagramIcon size={18} />
              {site.instagram.handle}
            </a>
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-3 border-t border-deep-line pt-6 text-[0.8125rem] text-on-deep-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {site.name}. Fotos provisórias de clientes, via Google.</p>
          {site.demo && <p>Site em demonstração: proposta apresentada ao {site.name}.</p>}
        </div>
      </div>
    </footer>
  );
}

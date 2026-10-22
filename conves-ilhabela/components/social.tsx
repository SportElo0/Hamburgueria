import { ArrowUpRight, Star } from "lucide-react";
import { site } from "@/config/site";
import { formatShortDate } from "@/lib/dates";
import { Hull, InstagramIcon } from "@/components/brand";

export function Social() {
  const { rating } = site;
  return (
    <section aria-labelledby="social-title" className="border-y border-line bg-paper">
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12 lg:py-24">
        <div className="lg:col-span-7">
          <h2 id="social-title" data-reveal className="serif text-[clamp(2.1rem,4vw,3.4rem)] text-deep">
            Acompanhe o Convés.
          </h2>
          <p data-reveal className="mt-4 max-w-[46ch] text-[1.0625rem] leading-relaxed text-ink/85">
            Pratos, ambiente e novidades aparecem no Instagram do restaurante, {site.instagram.handle}.
          </p>
          <a
            href={site.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 flex max-w-[34rem] items-center gap-5 border border-line p-3 pr-5 transition-colors hover:border-deep"
          >
            <span className="grid size-20 flex-none place-items-center bg-deep text-champagne-soft">
              <Hull size={40} />
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-2 font-semibold text-deep">
                <InstagramIcon size={18} />
                {site.instagram.handle}
              </span>
              <span className="mt-1 block text-[0.875rem] text-muted">Perfil oficial no Instagram</span>
            </span>
            <span className="btn btn-deep min-h-11 px-4 max-sm:hidden">
              Ver no Instagram
              <ArrowUpRight size={15} className="nudge" />
            </span>
          </a>
          <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="btn btn-deep mt-4 sm:hidden">
            Ver no Instagram
            <ArrowUpRight size={15} />
          </a>
        </div>

        <div className="border-t border-line pt-10 lg:col-span-4 lg:col-start-9 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12">
          <h3 className="serif text-[1.9rem] text-deep">Avaliações no Google</h3>
          {rating ? (
            <div className="mt-4 flex items-center gap-4">
              <span className="serif tabular text-[3.4rem] leading-none text-deep">
                {rating.value.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
              </span>
              <span>
                <span className="flex gap-0.5 text-champagne" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={16} className={i < Math.round(rating.value) ? "fill-current" : ""} />
                  ))}
                </span>
                <span className="mt-1 block text-[0.875rem] text-muted">
                  {rating.count} avaliações, conferido em {formatShortDate(rating.checkedAt)}
                </span>
              </span>
            </div>
          ) : (
            <p className="mt-4 text-[1rem] leading-relaxed text-ink/85">
              Leia o que dizem os clientes nas avaliações públicas do restaurante no Google.
            </p>
          )}
          <a
            href={site.links.reviews}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline mt-7"
          >
            Ver avaliações
            <ArrowUpRight size={15} className="nudge" />
          </a>
        </div>
      </div>
    </section>
  );
}

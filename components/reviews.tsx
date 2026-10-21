import { ArrowUpRight, Star } from "lucide-react";
import { site } from "@/config/site";
import { formatShortDate } from "@/lib/schedule";

const rating = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function Reviews() {
  const { reviews } = site;
  if (!reviews.show) return null;

  return (
    <section aria-labelledby="avaliacoes-title" className="border-y border-line bg-sand">
      <div className="mx-auto grid grid-cols-1 max-w-[88rem] gap-8 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-12 lg:items-center lg:px-12">
        <div data-reveal className="flex items-center gap-6 lg:col-span-7">
          <p className="serif text-[clamp(4rem,12vw,6rem)] leading-none">
            {rating.format(reviews.rating)}
          </p>
          <div>
            <span className="flex gap-1 text-champagne" aria-hidden>
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={i < Math.round(reviews.rating) ? "fill-current" : ""}
                />
              ))}
            </span>
            <h2 id="avaliacoes-title" className="serif mt-2 text-[1.75rem] leading-tight">
              Nota no {reviews.platform}, com {reviews.count} avaliações
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-5 lg:items-end lg:text-right">
          <a
            href={site.links.googleProfile}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline w-full sm:w-auto"
          >
            Ver avaliações no Google
            <ArrowUpRight size={16} className="nudge" />
          </a>
          <p className="max-w-[44ch] text-[0.8125rem] leading-relaxed text-muted">
            Dados conferidos em {formatShortDate(reviews.checkedAt)}. A nota e o total mudam com o
            tempo; os valores atuais estão no perfil.
          </p>
        </div>

        {reviews.testimonials.length > 0 && (
          <ul className="grid gap-8 border-t border-line pt-10 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-3">
            {reviews.testimonials.map((t) => (
              <li key={`${t.author}-${t.date}`}>
                <blockquote className="serif text-[1.4rem] leading-snug italic">
                  “{t.text}”
                </blockquote>
                <p className="mt-3 text-sm text-muted">
                  {t.author} · {reviews.platform}, {t.date}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

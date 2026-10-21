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
    <section aria-labelledby="avaliacoes-title" className="bg-fade-3 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto grid max-w-[90rem] gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-10 lg:px-10">
        <div className="lg:col-span-7">
          <h2
            id="avaliacoes-title"
            data-reveal="rise"
            className="display text-[clamp(2.6rem,9vw,4.6rem)]"
          >
            Nota {rating.format(reviews.rating)} no {reviews.platform}
          </h2>
          <p
            data-reveal="rise"
            className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-paper/90"
          >
            <span className="flex gap-1 text-paper" aria-hidden>
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={i < Math.round(reviews.rating) ? "fill-current" : "text-line-strong"}
                />
              ))}
            </span>
            <span className="font-semibold">
              {reviews.count} avaliações de clientes no perfil da barbearia
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-5 lg:items-end lg:text-right">
          <a
            href={site.links.googleProfile}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost w-full border-paper/40 sm:w-auto"
          >
            Ver avaliações no Google
            <ArrowUpRight size={18} className="nudge" />
          </a>
          <p className="max-w-[44ch] text-xs leading-relaxed text-steel">
            Dados conferidos no {reviews.platform} em {formatShortDate(reviews.checkedAt)}. A nota e
            o total de avaliações mudam com o tempo; confira os valores atuais no perfil.
          </p>
        </div>

        {reviews.testimonials.length > 0 && (
          <ul className="grid gap-4 border-t border-line pt-8 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-3">
            {reviews.testimonials.map((t) => (
              <li key={`${t.author}-${t.date}`}>
                <blockquote className="text-[1.02rem] leading-relaxed text-paper/90">
                  “{t.text}”
                </blockquote>
                <p className="mt-3 text-sm font-semibold text-steel">
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

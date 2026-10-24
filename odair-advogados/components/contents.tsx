import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { articles, statusLabel } from "@/data/articles";
import { getArea } from "@/data/areas";

export function Contents() {
  return (
    <section id="conteudos" aria-labelledby="conteudos-title" className="bg-ivory">
      <div className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
          <h2 id="conteudos-title" data-reveal className="display max-w-[14ch] text-[clamp(2.3rem,4.4vw,4rem)] text-navy lg:col-span-6">
            Informação jurídica com clareza.
          </h2>
          <div data-reveal className="lg:col-span-5 lg:col-start-8">
            <p className="max-w-[46ch] text-[1.0625rem] leading-relaxed text-muted">
              Textos informativos sobre as áreas de atuação, fundamentados na legislação e revisados pelo Dr. Odair antes
              de serem publicados. Não substituem a orientação individual.
            </p>
            <Link href="/conteudos" className="mt-5 inline-flex items-center gap-2 font-semibold text-navy">
              <span className="link-line">Ver todos os conteúdos</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <ul className="mt-14 border-t border-navy">
          {articles.map((article) => (
            <li key={article.slug} data-reveal className="border-b border-line-strong">
              <Link
                href={`/conteudos/${article.slug}`}
                className="group grid grid-cols-1 gap-3 py-7 transition-colors md:grid-cols-12 md:items-baseline md:gap-6"
              >
                <span className="label text-gold-ink md:col-span-3">{getArea(article.area)?.short}</span>
                <span className="md:col-span-6">
                  <span className="display block text-[1.6rem] text-navy transition-colors group-hover:text-gold-ink lg:text-[1.9rem]">
                    {article.title}
                  </span>
                  <span className="mt-2 block max-w-[60ch] text-[0.9375rem] leading-relaxed text-muted">{article.summary}</span>
                </span>
                <span className="flex items-center justify-between gap-4 md:col-span-3 md:justify-end">
                  <span className="rounded-[3px] border border-dashed border-line-strong px-2.5 py-1 text-[0.8125rem] text-muted">
                    {statusLabel[article.status]}
                  </span>
                  <ArrowUpRight
                    size={20}
                    strokeWidth={1.4}
                    className="text-navy transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

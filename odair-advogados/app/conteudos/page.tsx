import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { articles, formatDate, statusLabel } from "@/data/articles";
import { areas, getArea } from "@/data/areas";
import { PageHead } from "@/components/page-head";

export const metadata: Metadata = {
  title: "Conteúdos jurídicos",
  description:
    "Textos informativos sobre Direito de Família e Sucessões, Previdenciário, Contratual e do Consumidor, Trabalhista e Empresarial, revisados pelo escritório antes da publicação.",
  alternates: { canonical: "/conteudos" },
};

export default function ContentsPage() {
  return (
    <main>
      <PageHead
        trail={[{ href: "/", label: "Início" }, { label: "Conteúdos" }]}
        title={
          <>
            Informação jurídica <span className="text-gold">com clareza.</span>
          </>
        }
        lead={
          <p>
            Textos informativos, objetivos e atualizáveis, fundamentados na legislação aplicável. Cada conteúdo é revisado
            pelo Dr. Odair antes de ser publicado e não substitui a orientação individual.
          </p>
        }
      />

      <div className="bg-ivory">
        <div className="mx-auto max-w-[90rem] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          {areas
            .filter((area) => articles.some((a) => a.area === area.slug))
            .map((area) => (
              <section key={area.slug} aria-labelledby={`grupo-${area.slug}`} className="mb-16 last:mb-0">
                <h2 id={`grupo-${area.slug}`} className="display text-[clamp(1.8rem,3vw,2.5rem)] text-navy">
                  {area.name}
                </h2>
                <ul className="mt-6 border-t border-navy">
                  {articles
                    .filter((a) => a.area === area.slug)
                    .map((article) => (
                      <li key={article.slug} className="border-b border-line-strong">
                        <Link href={`/conteudos/${article.slug}`} className="group grid grid-cols-1 gap-3 py-6 md:grid-cols-12 md:gap-6">
                          <span className="md:col-span-8">
                            <span className="block text-[1.25rem] font-semibold text-navy transition-colors group-hover:text-gold-ink">
                              {article.title}
                            </span>
                            <span className="mt-1.5 block max-w-[64ch] text-[0.9375rem] leading-relaxed text-muted">{article.summary}</span>
                          </span>
                          <span className="flex items-start justify-between gap-4 md:col-span-4 md:justify-end">
                            <span className="text-[0.8125rem] text-muted">
                              {article.status === "publicado" && article.publishedAt
                                ? formatDate(article.publishedAt)
                                : <span className="rounded-[3px] border border-dashed border-line-strong px-2.5 py-1">{statusLabel[article.status]}</span>}
                            </span>
                            <ArrowUpRight size={20} strokeWidth={1.4} className="flex-none text-navy transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </span>
                        </Link>
                      </li>
                    ))}
                </ul>
                <p className="mt-4 text-[0.875rem] text-muted">
                  Área relacionada:{" "}
                  <Link href={`/areas/${area.slug}`} className="link-line font-semibold text-navy">
                    {getArea(area.slug)?.short}
                  </Link>
                </p>
              </section>
            ))}
        </div>
      </div>
    </main>
  );
}

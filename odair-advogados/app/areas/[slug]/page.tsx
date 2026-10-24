import { ViewTransition } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { areas, getArea } from "@/data/areas";
import { articles } from "@/data/articles";
import { FaqList } from "@/components/faq";
import { PageHead } from "@/components/page-head";
import { DraftNote } from "@/components/pending";
import { Rosette } from "@/components/rosette";
import { jsonLdScript } from "@/lib/seo";
import { site } from "@/config/site";

export function generateStaticParams() {
  return areas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({ params }: PageProps<"/areas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const area = getArea(slug);
  if (!area) return {};
  return {
    title: area.seo.title,
    description: area.seo.description,
    alternates: { canonical: `/areas/${area.slug}` },
    openGraph: { title: area.seo.title, description: area.seo.description, url: `/areas/${area.slug}` },
  };
}

export default async function AreaPage({ params }: PageProps<"/areas/[slug]">) {
  const { slug } = await params;
  const area = getArea(slug);
  if (!area) notFound();

  const index = areas.indexOf(area);
  const related = articles.filter((a) => a.area === area.slug);
  const others = areas.filter((a) => a.slug !== area.slug);
  const prev = areas[(index - 1 + areas.length) % areas.length];
  const next = areas[(index + 1) % areas.length];

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: area.name,
    url: `${site.url}/areas/${area.slug}`,
    about: area.name,
    isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(faqLd)} />
      <PageHead
        trail={[{ href: "/", label: "Início" }, { href: "/#areas", label: "Áreas de atuação" }, { label: area.short }]}
        title={area.name}
        lead={<p>{area.description}</p>}
        aside={
          <ViewTransition name={`rosette-${area.slug}`}>
            <div className="text-gold/85">
              <Rosette spec={area.rosette} steps={540} inner={0.3} engrave engraveStroke={0.36} className="w-[min(17rem,70vw)] lg:w-[22rem]" />
            </div>
          </ViewTransition>
        }
      />

      <div className="bg-ivory">
        <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-14 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:py-24">
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <h2 className="label text-gold-ink">Assuntos abordados</h2>
              <ul className="mt-4 border-t border-navy">
                {area.topics.map((topic) => (
                  <li key={topic} className="border-b border-line-strong py-3.5 text-[1rem] text-navy">
                    {topic}
                  </li>
                ))}
              </ul>
              <Link href="/#contato" className="btn btn-navy mt-8 w-full sm:w-auto">
                Entrar em contato
                <ArrowRight size={16} className="nudge" />
              </Link>
            </div>
          </aside>

          <div className="lg:col-span-7 lg:col-start-6">
            <h2 className="display text-[clamp(2rem,3.4vw,2.9rem)] text-navy">Informações gerais</h2>
            <div className="mt-8 space-y-10">
              {area.general.map((item) => (
                <section key={item.title} aria-labelledby={`info-${item.title}`}>
                  <h3 id={`info-${item.title}`} className="text-[1.1875rem] font-semibold text-navy">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-[66ch] text-[1.0625rem] leading-relaxed text-graphite">{item.text}</p>
                </section>
              ))}
            </div>

            <div className="mt-12 border-t border-line-strong pt-6">
              <h3 className="label text-gold-ink">Legislação de referência</h3>
              <ul className="mt-3 space-y-1.5 text-[0.9375rem] text-muted">
                {area.references.map((ref) => (
                  <li key={ref}>{ref}</li>
                ))}
              </ul>
            </div>

            <p className="mt-10 rounded-[3px] bg-paper p-5 text-[0.9375rem] leading-relaxed text-muted">
              Estas informações são gerais e não substituem a orientação jurídica individual. Cada situação depende dos
              fatos, das provas e da legislação aplicável, e nenhum resultado pode ser prometido.
            </p>

            <h2 className="display mt-16 text-[clamp(2rem,3.4vw,2.9rem)] text-navy">Dúvidas frequentes</h2>
            <div className="mt-8">
              <FaqList items={area.faq} />
            </div>

            {related.length > 0 && (
              <div className="mt-16">
                <h2 className="label text-gold-ink">Conteúdos relacionados</h2>
                <ul className="mt-4 border-t border-navy">
                  {related.map((article) => (
                    <li key={article.slug} className="border-b border-line-strong">
                      <Link href={`/conteudos/${article.slug}`} className="group flex items-center justify-between gap-4 py-4">
                        <span className="flex items-center gap-3 text-[1rem] text-navy">
                          <BookOpen size={17} strokeWidth={1.5} aria-hidden className="flex-none text-gold-ink" />
                          {article.title}
                        </span>
                        <ArrowUpRight size={18} strokeWidth={1.4} className="flex-none text-navy transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DraftNote className="mt-12" />
          </div>
        </div>
      </div>

      <nav aria-label="Outras áreas" className="bg-paper">
        <div className="mx-auto max-w-[90rem] px-5 py-14 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link href={`/areas/${prev.slug}`} className="group flex min-h-24 items-center gap-4 rounded-[4px] border border-line-strong p-5 transition-colors hover:border-navy">
              <ArrowLeft size={20} strokeWidth={1.4} className="flex-none text-gold-ink transition-transform group-hover:-translate-x-1" />
              <span>
                <span className="block text-[0.8125rem] text-muted">Área anterior</span>
                <span className="block text-[1.0625rem] font-semibold text-navy">{prev.name}</span>
              </span>
            </Link>
            <Link href={`/areas/${next.slug}`} className="group flex min-h-24 items-center justify-end gap-4 rounded-[4px] border border-line-strong p-5 text-right transition-colors hover:border-navy">
              <span>
                <span className="block text-[0.8125rem] text-muted">Próxima área</span>
                <span className="block text-[1.0625rem] font-semibold text-navy">{next.name}</span>
              </span>
              <ArrowRight size={20} strokeWidth={1.4} className="flex-none text-gold-ink transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
            {others.map((a) => (
              <li key={a.slug}>
                <Link href={`/areas/${a.slug}`} className="link-line text-navy">
                  {a.short}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </main>
  );
}

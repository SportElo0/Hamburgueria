import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import { articles, formatDate, getArticle, statusLabel } from "@/data/articles";
import { getArea } from "@/data/areas";
import { whatsappUrl } from "@/config/site";
import { PageHead } from "@/components/page-head";
import { DraftNote, Pending } from "@/components/pending";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps<"/conteudos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `/conteudos/${article.slug}` },
    // Rascunhos não entram em buscadores, mesmo depois de liberada a indexação.
    robots: article.status === "publicado" ? undefined : { index: false, follow: true },
  };
}

export default async function ArticlePage({ params }: PageProps<"/conteudos/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const area = getArea(article.area);
  const published = article.status === "publicado" && article.content;

  const meta = [
    { term: "Autor", value: article.author },
    { term: "Publicação", value: formatDate(article.publishedAt) },
    { term: "Última atualização", value: formatDate(article.updatedAt) },
  ];

  return (
    <main>
      <PageHead
        trail={[{ href: "/", label: "Início" }, { href: "/conteudos", label: "Conteúdos" }, { label: article.title }]}
        title={article.title}
        lead={<p>{article.summary}</p>}
      />

      <div className="bg-ivory">
        <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:py-24">
          <aside className="lg:col-span-4">
            <dl className="border-t border-navy">
              {area && (
                <div className="border-b border-line-strong py-3.5">
                  <dt className="label text-gold-ink">Área</dt>
                  <dd className="mt-1">
                    <Link href={`/areas/${area.slug}`} className="link-line text-navy">
                      {area.name}
                    </Link>
                  </dd>
                </div>
              )}
              {meta.map((m) => (
                <div key={m.term} className="border-b border-line-strong py-3.5">
                  <dt className="label text-gold-ink">{m.term}</dt>
                  <dd className="mt-1 text-navy">{m.value ?? <Pending label="a definir" />}</dd>
                </div>
              ))}
              <div className="border-b border-line-strong py-3.5">
                <dt className="label text-gold-ink">Situação</dt>
                <dd className="mt-1 text-navy">{statusLabel[article.status]}</dd>
              </div>
            </dl>
          </aside>

          <article className="lg:col-span-7 lg:col-start-6">
            {published ? (
              <div className="space-y-5 text-[1.0625rem] leading-relaxed text-graphite">
                {article.content!.map((paragraph, i) => (
                  <p key={i} className="max-w-[68ch]">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <>
                <DraftNote>Conteúdo em preparação. O texto será publicado depois da revisão do Dr. Odair.</DraftNote>
                <h2 className="display mt-10 text-[clamp(1.8rem,3vw,2.5rem)] text-navy">O que este conteúdo vai abordar</h2>
                <ol className="mt-6 border-t border-navy">
                  {article.outline.map((item, i) => (
                    <li key={item} className="flex gap-5 border-b border-line-strong py-4 text-[1.0625rem] text-navy">
                      <span className="display tabular w-6 flex-none text-gold-ink">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ol>
              </>
            )}

            <div className="mt-12 border-t border-line-strong pt-6">
              <h2 className="label text-gold-ink">Fontes jurídicas</h2>
              <ul className="mt-3 space-y-1.5 text-[0.9375rem] text-muted">
                {article.sources.map((source) => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
            </div>

            <p className="mt-10 rounded-[3px] bg-paper p-5 text-[0.9375rem] leading-relaxed text-muted">
              Conteúdo de caráter informativo. Não substitui a orientação jurídica individual, que depende da análise de cada
              caso.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/conteudos" className="btn btn-line">
                <ArrowLeft size={16} />
                Todos os conteúdos
              </Link>
              {whatsappUrl() ? (
                <a href={whatsappUrl()!} target="_blank" rel="noopener noreferrer" className="btn btn-navy">
                  <MessageCircle size={16} />
                  Conversar pelo WhatsApp
                </a>
              ) : (
                <Link href="/#contato" className="btn btn-navy">
                  Entrar em contato
                  <ArrowRight size={16} className="nudge" />
                </Link>
              )}
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}

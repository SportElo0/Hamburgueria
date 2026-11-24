import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ACABAMENTOS, FAMILIAS, PRODUTOS, produto, produtosDaFamilia } from '@/data/catalogo';
import { Galeria } from '@/components/produto/Galeria';
import { TabelaTecnica } from '@/components/produto/TabelaTecnica';
import { Revelar } from '@/components/Revelar';
import { jsonLdProduto, jsonLdTrilha } from '@/lib/seo';

export function generateStaticParams() {
  return PRODUTOS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = produto((await params).slug);
  if (!p) return {};
  return {
    title: p.nome,
    description: p.resumo,
    alternates: { canonical: `/produtos/${p.slug}` },
    openGraph: { images: [{ url: p.imagens[0].src, alt: p.imagens[0].alt }] },
  };
}

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = produto((await params).slug);
  if (!p) notFound();
  const fam = FAMILIAS.find((f) => f.id === p.familia)!;
  const vizinhos = produtosDaFamilia(p.familia).filter((x) => x.slug !== p.slug);
  const outros = vizinhos.length ? vizinhos : PRODUTOS.filter((x) => x.slug !== p.slug).slice(0, 3);

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProduto(p)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdTrilha([{ nome: 'Produtos', caminho: '/produtos' }, { nome: p.nome, caminho: `/produtos/${p.slug}` }])) }}
      />
      <div className="container-b pt-28 md:pt-32">
        <nav aria-label="Você está em" className="text-sm text-tinta-2">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link className="link-b" href="/produtos">Produtos</Link></li>
            <li aria-hidden="true" className="text-aco">/</li>
            <li><Link className="link-b" href={`/produtos?familia=${fam.id}`}>{fam.nome}</Link></li>
            <li aria-hidden="true" className="text-aco">/</li>
            <li aria-current="page" className="text-tinta">{p.nome}</li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="min-w-0 lg:col-span-6">
            <Galeria imagens={p.imagens} />
          </div>
          <Revelar className="min-w-0 lg:col-span-6 lg:pt-6">
            <p data-revelar className="eyebrow text-azul">{p.nomeCatalogo}</p>
            <h1 data-revelar className="mt-4 font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[0.98] font-semibold">{p.nome}</h1>
            <div data-revelar className="mt-6 space-y-3 text-lg leading-relaxed text-tinta-2">
              {p.descricao.map((d) => <p key={d}>{d}</p>)}
            </div>

            <dl data-revelar className="mt-8 divide-y divide-linha border-y border-linha">
              <div className="grid grid-cols-[8rem_1fr] gap-4 py-4">
                <dt className="text-sm text-aco">Material</dt>
                <dd>{p.material}</dd>
              </div>
              <div className="grid grid-cols-[8rem_1fr] gap-4 py-4">
                <dt className="text-sm text-aco">Acabamentos</dt>
                <dd>
                  <ul className="flex flex-wrap gap-x-4 gap-y-2">
                    {p.acabamentos.map((a) => (
                      <li key={a} className="flex items-center gap-2 text-sm">
                        <span className="amostra" style={{ background: ACABAMENTOS[a].amostra }} aria-hidden="true" />
                        {ACABAMENTOS[a].nome}
                      </li>
                    ))}
                  </ul>
                  {p.notaAcabamentos && <p className="mt-2 text-sm text-tinta-2">{p.notaAcabamentos}</p>}
                </dd>
              </div>
              <div className="grid grid-cols-[8rem_1fr] gap-4 py-4">
                <dt className="text-sm text-aco">Embalagem</dt>
                <dd className="space-y-1">{p.embalagem.map((e) => <p key={e}>{e}</p>)}</dd>
              </div>
              {p.aplicacoes && (
                <div className="grid grid-cols-[8rem_1fr] gap-4 py-4">
                  <dt className="text-sm text-aco">Aplicações</dt>
                  <dd>{p.aplicacoes.join(' · ')}</dd>
                </div>
              )}
              {p.cores && (
                <div className="grid grid-cols-[8rem_1fr] gap-4 py-4">
                  <dt className="text-sm text-aco">{p.cores.titulo}</dt>
                  <dd>
                    <ul className="flex flex-wrap gap-2">
                      {p.cores.lista.map((c) => (
                        <li key={c.nome} className="flex items-center gap-1.5 rounded-full border border-linha bg-white px-2.5 py-1 text-xs">
                          <span className="amostra !h-3.5 !w-3.5" style={{ background: c.cor }} aria-hidden="true" />
                          {c.nome}
                        </li>
                      ))}
                    </ul>
                    {p.cores.nota && <p className="mt-2 text-sm text-tinta-2">{p.cores.nota}</p>}
                  </dd>
                </div>
              )}
            </dl>

            <div data-revelar className="mt-8 flex flex-wrap gap-3">
              <a href="#tabela" className="btn btn-primario">Escolher modelos para a cotação <span className="seta" aria-hidden="true">↓</span></a>
              <a href={`/catalogo-bacchi.pdf#page=${p.paginaCatalogo}`} className="btn btn-contorno text-tinta" target="_blank" rel="noopener">
                Ver no catálogo PDF (pág. {p.paginaCatalogo})
              </a>
            </div>
          </Revelar>
        </div>
      </div>

      <section id="tabela" aria-labelledby="titulo-tabela" className="container-b scroll-mt-24 py-20 md:py-28">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-azul">Ficha técnica</p>
            <h2 id="titulo-tabela" className="mt-3 font-display text-[clamp(1.9rem,3.6vw,3rem)] font-semibold">
              {p.variacoes.length} {p.variacoes.length === 1 ? 'modelo' : 'modelos'} de {p.nome.toLowerCase()}
            </h2>
          </div>
          <p className="max-w-sm text-sm text-tinta-2">Escolha o modelo, o acabamento, a embalagem e a quantidade. Os preços são informados pela equipe comercial na resposta.</p>
        </div>
        <Suspense fallback={null}>
          <TabelaTecnica produto={p} />
        </Suspense>
        {p.notas && (
          <ul className="mt-5 space-y-1 text-sm text-tinta-2">
            {p.notas.map((n) => <li key={n}>{n}</li>)}
          </ul>
        )}
        <p className="mt-2 text-sm text-aco">Fonte: catálogo de produtos Bacchi, página {p.paginaCatalogo}.</p>
      </section>

      <section aria-labelledby="titulo-outros" className="border-t border-linha bg-papel-2/60 py-20">
        <div className="container-b">
          <h2 id="titulo-outros" className="font-display text-2xl font-semibold">{vizinhos.length ? `Mais em ${fam.nome.toLowerCase()}` : 'Outras linhas'}</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {outros.map((x) => (
              <li key={x.slug}>
                <Link href={`/produtos/${x.slug}`} className="group flex items-center gap-4 rounded-2xl bg-white p-3 pr-5 transition-shadow hover:shadow-[0_20px_40px_-24px_rgba(13,23,38,.35)]">
                  <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-papel">
                    <Image src={x.imagens[0].src} alt="" fill sizes="80px" className="object-cover" />
                  </span>
                  <span>
                    <span className="block font-display text-lg font-semibold group-hover:text-azul">{x.nome}</span>
                    <span className="text-sm text-tinta-2">{x.variacoes.length} modelos</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </article>
  );
}

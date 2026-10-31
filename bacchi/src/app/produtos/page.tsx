import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Catalogo } from '@/components/catalogo/Catalogo';
import { TOTAL_MODELOS } from '@/lib/cotacao';
import { PRODUTOS } from '@/data/catalogo';

export const metadata: Metadata = {
  title: 'Catálogo de produtos',
  description: 'Catálogo técnico Bacchi: clips, grampos, alfinetes, encadernadores, colchetes, pranchetas, extratores e percevejos, com medidas, acabamentos e embalagens de cada modelo.',
  alternates: { canonical: '/produtos' },
};

export default function ProdutosPage() {
  return (
    <>
      <header className="container-b pt-32 pb-6 md:pt-40">
        <p className="eyebrow text-azul">Catálogo digital</p>
        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h1 className="max-w-[16ch] font-display text-[clamp(2.4rem,6vw,5rem)] leading-[0.98] font-semibold">Todos os produtos Bacchi.</h1>
          <div className="max-w-sm">
            <p className="text-tinta-2">
              {PRODUTOS.length} linhas e {TOTAL_MODELOS} modelos com medidas, acabamentos e embalagens. Adicione o que precisa à cotação.
            </p>
            <a href="/catalogo-bacchi.pdf" download className="link-b mt-3 inline-flex items-center gap-2 text-sm font-semibold text-azul">
              Baixar o catálogo em PDF (1,6 MB)
            </a>
          </div>
        </div>
      </header>
      <Suspense fallback={<div className="container-b h-96" />}>
        <Catalogo />
      </Suspense>
    </>
  );
}

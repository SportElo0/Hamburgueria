import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { itensDoDono } from '@/lib/dono';
import { isSlug } from '@/lib/slug';
import { PrecosCustos } from '@/components/dono/PrecosCustos';

export const metadata = { title: 'Preços e custos' };

export default async function PrecosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const { categories, published } = await itensDoDono(slug);
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Preços e custos</h1>
      <p className="mt-1 max-w-3xl text-ink-soft">
        Mude o nome e o preço (vale na hora no cardápio), esgote um item e escreva <strong>quanto gasta para fazer cada um</strong>: o painel mostra quanto sobra por
        venda.
      </p>
      {published ? (
        <PrecosCustos slug={slug} categories={categories} />
      ) : (
        <p className="card mt-6 px-5 py-10 text-center text-ink-mute">O cardápio ainda não foi publicado. A Growlift publica e os itens aparecem aqui.</p>
      )}
    </div>
  );
}

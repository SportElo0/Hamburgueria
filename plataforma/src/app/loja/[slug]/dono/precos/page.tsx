import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { itensDoDono } from '@/lib/dono';
import { getDraft } from '@/lib/stores';
import { isSlug } from '@/lib/slug';
import { PrecosCustos } from '@/components/dono/PrecosCustos';

export const metadata = { title: 'Preços e custos' };

export default async function PrecosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const [{ categories, published }, draft] = await Promise.all([itensDoDono(slug), getDraft(slug)]);
  const demo = draft?.data.store.extra.demo === true;
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Preços e custos</h1>
      <p className="mt-1 max-w-3xl text-ink-soft">
        Mude o nome e o preço (vale na hora no cardápio), esgote um item e escreva <strong>quanto gasta para fazer cada um</strong>: o painel mostra quanto sobra por
        venda.
      </p>
      {!published && !demo && (
        <p className="mt-4 max-w-3xl rounded-lg bg-accent-soft px-4 py-3 text-sm text-ink-soft">
          Seu cardápio ainda não está no ar. Monte aqui os itens, os preços e os custos: os clientes passam a ver quando a Growlift colocar o cardápio no ar com você.
        </p>
      )}
      <PrecosCustos slug={slug} categories={categories} />
    </div>
  );
}

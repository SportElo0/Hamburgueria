import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStoreAccess } from '@/lib/auth';
import { getDraft, getPublished, listPedidos } from '@/lib/stores';
import { isSlug } from '@/lib/slug';
import { CardapioEditor, type CardapioCategory } from '@/components/cardapio/CardapioEditor';

export const metadata = { title: 'Cardápio' };

export default async function CardapioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const published = await getPublished(slug);
  // Customers see the published menu, so that is what the staff edits.
  const categories: CardapioCategory[] = (published?.store.catalog.categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    items: c.items.map((i) => ({ id: i.id, name: i.name, description: i.description, price: i.price })),
  }));
  const requests = (await listPedidos(slug))
    .filter((p) => p.canal === 'Painel da loja')
    .slice(-10)
    .reverse()
    .map((p) => ({ id: p.id, texto: p.texto, criadoEm: p.criadoEm, status: p.status }));

  return (
    <div className="min-h-dvh pb-16">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">Cardápio</p>
            <h1 className="text-lg font-bold">{draft.data.store.name}</h1>
          </div>
          <Link href={`/loja/${slug}`} className="btn-ghost min-h-11">
            Voltar aos pedidos
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pt-5">
        <CardapioEditor slug={slug} categories={categories} requests={requests} published={Boolean(published)} />
      </main>
    </div>
  );
}

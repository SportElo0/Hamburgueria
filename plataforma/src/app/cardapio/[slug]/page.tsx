import type { Metadata, Viewport } from 'next';
import { isSlug } from '@/lib/slug';
import { getPublished } from '@/lib/stores';
import { getOperation } from '@/lib/orders';
import { withSoldOut } from '@/lib/ordering';
import { CardapioView } from '@/components/cardapio/CardapioView';

export const dynamic = 'force-dynamic';
export const viewport: Viewport = { themeColor: '#F4F6FA' };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const record = isSlug(slug) ? await getPublished(slug) : null;
  // The restaurant's own site is the page for search engines; this one is for the QR in the restaurant.
  return { title: record ? `Cardápio · ${record.store.name}` : 'Cardápio', robots: { index: false, follow: false } };
}

/**
 * The menu only, for a QR on the table, the counter or the door: no table to open, nothing to order.
 * Read on every visit from the published menu and the kitchen's sold-out marks, so it changes as the store changes.
 */
export default async function CardapioPublico({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = isSlug(slug) ? await getPublished(slug) : null;
  if (!record) {
    return (
      <main className="flex min-h-dvh flex-col justify-center bg-[#F4F6FA] px-6 text-[#121826]">
        <h1 className="text-3xl font-black tracking-tight uppercase">Cardápio indisponível</h1>
        <p className="mt-3 text-base leading-relaxed text-[#4A5568]">Peça o cardápio ao atendente.</p>
      </main>
    );
  }
  const operation = await getOperation(slug);
  return <CardapioView store={withSoldOut(record.store, operation.soldOut)} />;
}

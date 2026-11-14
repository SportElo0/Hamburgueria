import type { Metadata } from 'next';
import { isSlug } from '@/lib/slug';
import { getPublished } from '@/lib/stores';
import { trackReservation } from '@/lib/reservas';
import { ReservaStatus } from '@/components/salao/ReservaStatus';
import { sellerOf } from '@/lib/vendedor';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sua reserva', robots: { index: false } };

/** The customer's booking: Pix for the deposit, then the confirmation and how to cancel. The token in the link is the only key. */
export default async function ReservaPage({ params, searchParams }: { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { slug, id } = await params;
  const { t = '' } = await searchParams;
  const reservation = isSlug(slug) && /^r\d{8}-[a-z0-9]{10}$/.test(id) ? await trackReservation(slug, id, t) : null;
  if (!reservation) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-2xl font-bold">Reserva não encontrada</h1>
        <p className="mt-2 text-ink-soft">Abra o link que apareceu quando você fez a reserva.</p>
      </main>
    );
  }
  const store = (await getPublished(slug))?.store;
  return <ReservaStatus slug={slug} token={t} storeName={store?.name ?? ''} initial={reservation} seller={store ? sellerOf(store) : null} />;
}

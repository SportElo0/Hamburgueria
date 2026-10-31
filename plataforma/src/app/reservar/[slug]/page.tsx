import type { Metadata } from 'next';
import { isSlug } from '@/lib/slug';
import { getPublished } from '@/lib/stores';
import { orderingOf } from '@/lib/ordering';
import { bookableDays } from '@/lib/reservas';
import { ReservaForm } from '@/components/salao/ReservaForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Reservar mesa' };

export default async function ReservarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = isSlug(slug) ? await getPublished(slug) : null;
  const ordering = record ? orderingOf(record.store) : null;
  if (!record || !ordering?.enabled || !ordering.tables.enabled || !ordering.reservations.enabled) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-2xl font-bold">Reservas pelo site desligadas</h1>
        <p className="mt-2 text-ink-soft">Este restaurante não está recebendo reservas pelo site. Fale direto com a casa.</p>
      </main>
    );
  }
  const s = ordering.reservations;
  return (
    <ReservaForm
      slug={slug}
      storeName={record.store.name}
      days={bookableDays(s)}
      maxPeople={s.maxPeople}
      depositPerPerson={s.depositPerPerson}
      cancelHours={s.cancelHours}
      toleranceMinutes={s.toleranceMinutes}
      emailRequired={ordering.pixMode === 'mercadopago' && s.depositPerPerson > 0}
    />
  );
}

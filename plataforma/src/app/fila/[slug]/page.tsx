import type { Metadata } from 'next';
import { isSlug } from '@/lib/slug';
import { getPublished } from '@/lib/stores';
import { orderingOf } from '@/lib/ordering';
import { waitingCount } from '@/lib/fila';
import { FilaEntrar } from '@/components/salao/FilaEntrar';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Fila de espera' };

/** The page the QR at the door opens. Public. */
export default async function FilaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = isSlug(slug) ? await getPublished(slug) : null;
  const o = record ? orderingOf(record.store) : null;
  if (!record || !o?.enabled || !o.tables.enabled || !o.waitlist.enabled) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-2xl font-bold">Fila pelo celular desligada</h1>
        <p className="mt-2 text-ink-soft">Fale com a recepção para entrar na fila.</p>
      </main>
    );
  }
  return <FilaEntrar slug={slug} storeName={record.store.name} waiting={await waitingCount(slug)} />;
}

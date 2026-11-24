import type { Metadata } from 'next';
import { isSlug } from '@/lib/slug';
import { getPublished } from '@/lib/stores';
import { queueStatus } from '@/lib/fila';
import { FilaStatus } from '@/components/salao/FilaStatus';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Seu lugar na fila', robots: { index: false } };

export default async function FilaStatusPage({ params, searchParams }: { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { slug, id } = await params;
  const { t = '' } = await searchParams;
  const entry = isSlug(slug) && /^f\d{8}-[a-z0-9]{10}$/.test(id) ? await queueStatus(slug, id, t) : null;
  if (!entry) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-2xl font-bold">Lugar na fila não encontrado</h1>
        <p className="mt-2 text-ink-soft">Abra o link que apareceu quando você entrou na fila, ou fale com a recepção.</p>
      </main>
    );
  }
  const store = (await getPublished(slug))?.store.name ?? '';
  return <FilaStatus slug={slug} token={t} storeName={store} initial={entry} />;
}

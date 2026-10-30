import { notFound } from 'next/navigation';
import { requireStoreAccess } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { orderingOf } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';
import { SalaoBoard } from '@/components/mesa/SalaoBoard';

export const metadata = { title: 'Salão' };

/** The waiter's floor screen, made for the waiter's phone. */
export default async function SalaoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const ordering = orderingOf(draft.data.store);
  return <SalaoBoard slug={slug} storeName={draft.data.store.name} count={ordering.tables.count} enabled={ordering.enabled && ordering.tables.enabled} />;
}

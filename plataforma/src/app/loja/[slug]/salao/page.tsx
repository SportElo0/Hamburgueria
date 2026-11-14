import { notFound } from 'next/navigation';
import { SALAO, requireStoreAccess } from '@/lib/auth';
import { getDraft, getPublished } from '@/lib/stores';
import { getOperation } from '@/lib/orders';
import { withSoldOut } from '@/lib/ordering';
import { mesaMenu } from '@/lib/mesa-menu';
import { orderingOf } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';
import { SalaoBoard } from '@/components/mesa/SalaoBoard';
import { logout } from '@/app/login/actions';

export const metadata = { title: 'Salão' };

/** The waiter's floor screen, made for the waiter's phone. */
export default async function SalaoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const user = await requireStoreAccess(slug, SALAO);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const ordering = orderingOf(draft.data.store);
  // The waiter orders from the menu customers see (or the draft before it goes live), without sold-out items.
  const [published, operation] = await Promise.all([getPublished(slug), getOperation(slug)]);
  const menu = mesaMenu(withSoldOut(published?.store ?? draft.data.store, operation.soldOut));
  return <SalaoBoard slug={slug} storeName={draft.data.store.name} count={ordering.tables.count} enabled={ordering.enabled && ordering.tables.enabled} garcom={user.funcao === 'garcom'} dono={user.funcao !== 'garcom'} menu={menu} logout={logout} />;
}

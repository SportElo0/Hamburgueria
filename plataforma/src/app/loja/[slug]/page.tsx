import { notFound } from 'next/navigation';
import { requireStoreAccess } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { orderingOf } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';
import { isTeam } from '@/lib/session';
import { OrdersBoard } from '@/components/orders/OrdersBoard';
import { logout } from '@/app/login/actions';

export const metadata = { title: 'Pedidos da loja' };

export default async function StoreOrdersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const user = await requireStoreAccess(slug);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const ordering = orderingOf(draft.data.store);
  return (
    <OrdersBoard
      slug={slug}
      storeName={draft.data.store.name}
      enabled={ordering.enabled}
      userName={user.name || user.email}
      team={isTeam(user)}
      logout={logout}
    />
  );
}

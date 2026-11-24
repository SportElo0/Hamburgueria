import { notFound } from 'next/navigation';
import { COZINHA, requireStoreAccess } from '@/lib/auth';
import { getDraft, getPublished } from '@/lib/stores';
import { orderingOf } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';
import { isTeam } from '@/lib/session';
import { OrdersBoard } from '@/components/orders/OrdersBoard';
import { drinkCategoryIds } from '@/lib/mesas';
import { logout } from '@/app/login/actions';

export const metadata = { title: 'Pedidos da loja' };

export default async function StoreOrdersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const user = await requireStoreAccess(slug, COZINHA);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const ordering = orderingOf(draft.data.store);
  // The published menu is what customers see, so sold-out switches list its items.
  const published = (await getPublished(slug))?.store ?? draft.data.store;
  const menu = published.catalog.categories.map((c) => ({ id: c.id, name: c.name, items: c.items.map((i) => ({ id: i.id, name: i.name })) }));
  // What the bar prepares: the drink categories (picked by the team, or by the category name); the rest is the kitchen's.
  const drinks = drinkCategoryIds(published);
  const barItems = published.catalog.categories.filter((c) => drinks.has(c.id)).flatMap((c) => c.items.map((i) => i.id));
  return (
    <OrdersBoard
      slug={slug}
      storeName={draft.data.store.name}
      enabled={ordering.enabled}
      userName={user.name || user.email}
      team={isTeam(user)}
      dono={isTeam(user) || user.funcao === 'dono'}
      tables={ordering.enabled && ordering.tables.enabled}
      menu={menu}
      barItems={barItems}
      logout={logout}
    />
  );
}

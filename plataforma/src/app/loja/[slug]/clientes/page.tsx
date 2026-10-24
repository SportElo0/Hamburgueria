import { notFound } from 'next/navigation';
import { requireStoreAccess } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { listCustomers } from '@/lib/customers';
import { orderingOf, todaySP } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';
import { CustomersBoard } from '@/components/customers/CustomersBoard';

export const metadata = { title: 'Clientes e campanhas' };

export default async function CustomersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const store = draft.data.store;
  const today = todaySP();
  const coupons = orderingOf(store).coupons.filter((c) => c.active && (!c.until || c.until >= today));
  return <CustomersBoard slug={slug} storeName={store.name} siteUrl={store.siteUrl} coupons={coupons} customers={await listCustomers(slug)} />;
}

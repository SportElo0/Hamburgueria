import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { orderingOf } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';
import { isTeam } from '@/lib/session';
import { DonoNav } from '@/components/dono/DonoNav';
import { logout } from '@/app/login/actions';

export const metadata = { title: 'Painel do dono' };

/** The owner's panel: made for a computer, with the sections on a dark bar on the left. Owner's login or the team only. */
export default async function DonoLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const user = await requireStoreAccess(slug, DONO);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const o = orderingOf(draft.data.store);
  return (
    <div className="min-h-dvh lg:flex">
      <DonoNav
        slug={slug}
        storeName={draft.data.store.name}
        userName={user.name || user.email}
        team={isTeam(user)}
        tables={o.enabled && o.tables.enabled}
        logout={logout}
      />
      <main className="min-w-0 flex-1 px-4 py-6 lg:px-9 lg:py-8">{children}</main>
    </div>
  );
}

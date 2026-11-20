import { notFound, redirect } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { isSlug } from '@/lib/slug';
import { isTeam } from '@/lib/session';
import { modulosDa, produtoDa } from '@/lib/produto';
import { logout } from '@/app/login/actions';
import { AppNav } from '@/components/app/AppNav';

export const metadata = { title: 'App da loja' };

/** The store's own app ("App sob medida"): only the modules made for this store. Owner's login or the team. */
export default async function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const user = await requireStoreAccess(slug, DONO);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  if (produtoDa(draft.data.store) !== 'sob-medida') redirect(`/loja/${slug}/dono`);
  const store = draft.data.store;
  const logo = typeof store.extra.logo === 'string' && store.extra.logo.startsWith('/api/midia/') ? store.extra.logo : '';
  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-sm font-extrabold text-white">
                {store.name.trim().charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[15px] leading-tight font-bold">{store.name}</p>
              <p className="text-xs text-ink-mute">{isTeam(user) ? 'Vendo como Growlift' : user.name || user.email}</p>
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className="btn-ghost min-h-10 px-3 text-sm">
              Sair
            </button>
          </form>
        </div>
        <AppNav slug={slug} modulos={modulosDa(store)} />
      </header>
      <main className="mx-auto max-w-4xl px-4 py-5 pb-16">{children}</main>
    </div>
  );
}

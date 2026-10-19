import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { logout } from '../login/actions';

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/painel" className="text-[15px] font-bold">
            Painel das lojas
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-ink-mute sm:inline">{user.name || user.email}</span>
            <form action={logout}>
              <button type="submit" className="btn-ghost min-h-9 px-3">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

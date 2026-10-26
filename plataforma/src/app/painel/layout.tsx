import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { logout } from '../login/actions';

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        {/* Phones: the section links take a second row instead of pushing the page wider. */}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-5 gap-y-1 px-4 py-2 sm:h-14 sm:flex-nowrap sm:py-0">
          <Link href="/painel" className="text-[15px] font-bold">
            Painel das lojas
          </Link>
          <nav className="order-last flex w-full items-center gap-5 overflow-x-auto pb-1 whitespace-nowrap sm:order-none sm:w-auto sm:flex-1 sm:pb-0">
            <Link href="/painel/indicacoes" className="text-sm text-ink-mute hover:text-ink">
              Indicações
            </Link>
            <Link href="/painel/diagnosticos" className="text-sm text-ink-mute hover:text-ink">
              Diagnósticos
            </Link>
            <Link href="/painel/conteudos" className="text-sm text-ink-mute hover:text-ink">
              Conteúdos
            </Link>
            <Link href="/painel/oportunidades" className="text-sm text-ink-mute hover:text-ink">
              Oportunidades
            </Link>
          </nav>
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

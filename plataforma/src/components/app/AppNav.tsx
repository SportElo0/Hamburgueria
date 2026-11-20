'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Modulo } from '@/lib/produto';

const ABAS: Record<Modulo, { label: string; path: string }> = {
  clientes: { label: 'Clientes', path: '' },
  torpedo: { label: 'Torpedo', path: '/torpedo' },
};

/** The app's tabs: one per module the store bought. */
export function AppNav({ slug, modulos }: { slug: string; modulos: Modulo[] }) {
  const pathname = usePathname();
  if (modulos.length < 2) return null;
  const base = `/loja/${slug}/app`;
  return (
    <nav aria-label="Seções do app" className="mx-auto flex max-w-4xl gap-1 px-4">
      {modulos.map((m) => {
        const href = base + ABAS[m].path;
        const ativo = pathname === href;
        return (
          <Link
            key={m}
            href={href}
            aria-current={ativo ? 'page' : undefined}
            className={`-mb-px min-h-11 border-b-2 px-3 pt-2.5 text-sm font-semibold transition-colors ${ativo ? 'border-ink text-ink' : 'border-transparent text-ink-mute hover:text-ink'}`}
          >
            {ABAS[m].label}
          </Link>
        );
      })}
    </nav>
  );
}

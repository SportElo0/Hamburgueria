'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Abas do Conselheiro. No celular rolam para o lado. */
export function SubNav({ base, pendencias }: { base: string; pendencias: number }) {
  const path = usePathname();
  const abas = [
    { href: base, label: 'Hoje' },
    { href: `${base}/conversa`, label: 'Conversa' },
    { href: `${base}/produtos`, label: 'Produtos e custos' },
    { href: `${base}/simulador`, label: 'Simulador' },
    { href: `${base}/decisoes`, label: 'Decisões' },
    { href: `${base}/testes`, label: 'Testes e metas' },
    { href: `${base}/3d`, label: '3D' },
    { href: `${base}/cadastro`, label: 'Cadastro' },
    { href: `${base}/importar`, label: 'Importar' },
  ];
  return (
    <nav aria-label="Seções do Conselheiro" className="-mx-4 mt-5 flex gap-1 overflow-x-auto border-b border-line px-4 lg:mx-0 lg:px-0">
      {abas.map((a) => {
        const ativo = a.href === base ? path === base : path.startsWith(a.href);
        return (
          <Link
            key={a.href}
            href={a.href}
            aria-current={ativo ? 'page' : undefined}
            // No celular, a aba aberta fica à vista na faixa que rola.
            ref={ativo ? (el) => el?.scrollIntoView({ block: 'nearest', inline: 'center' }) : undefined}
            className={`-mb-px flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold whitespace-nowrap ${ativo ? 'border-accent text-accent' : 'border-transparent text-ink-soft hover:text-ink'}`}
          >
            {a.label}
            {a.label === 'Cadastro' && pendencias > 0 && <span className="chip bg-warn/10 text-warn">{pendencias}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

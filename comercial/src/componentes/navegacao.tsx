'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navegacao({ itens }: { itens: { href: string; nome: string; aviso?: number }[] }) {
  const atual = usePathname();
  return (
    <nav aria-label="Seções do painel" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex gap-1 whitespace-nowrap">
        {itens.map((i) => {
          const ativo = i.href === '/painel' ? atual === '/painel' : atual.startsWith(i.href);
          return (
            <li key={i.href}>
              <Link href={i.href} aria-current={ativo ? 'page' : undefined} className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-[15px] font-semibold ${ativo ? 'border-marca text-marca-escura' : 'border-transparent text-suave hover:text-tinta'}`}>
                {i.nome}
                {!!i.aviso && <span className="etiqueta etiqueta-alerta">{i.aviso}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Icon = 'resumo' | 'precos' | 'mesas' | 'pedidos' | 'equipe' | 'clientes';

function Svg({ name }: { name: Icon }) {
  const paths: Record<Icon, string> = {
    resumo: 'M4 19V10M10 19V5M16 19v-6M22 19H2',
    precos: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8ZM7.5 7.5h.01',
    mesas: 'M3 8h18M5 8v11M19 8v11M8 4h8',
    pedidos: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 8h6M9 12h6',
    equipe: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8',
    clientes: 'm12 3 2.8 5.6 6.2.9-4.5 4.4 1 6.1-5.5-2.9L6.5 20l1-6.1L3 9.5l6.2-.9L12 3Z',
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}

/** The dark bar of the owner's panel. On a narrow screen it becomes a bar on top with the sections side by side. */
export function DonoNav(props: { slug: string; storeName: string; logo: string; userName: string; team: boolean; tables: boolean; logout: () => Promise<void> }) {
  const path = usePathname();
  const base = `/loja/${props.slug}/dono`;
  const live: { href: string; label: string; icon: Icon }[] = [
    { href: base, label: 'Resumo geral', icon: 'resumo' },
    { href: `${base}/precos`, label: 'Preços e custos', icon: 'precos' },
    { href: `${base}/mesas`, label: 'Mesas', icon: 'mesas' },
    { href: `${base}/pedidos`, label: 'Pedidos e delivery', icon: 'pedidos' },
    { href: `${base}/equipe`, label: 'Equipe', icon: 'equipe' },
    { href: `${base}/clientes`, label: 'Clientes e avaliações', icon: 'clientes' },
  ];
  const soon: { label: string; icon: Icon }[] = [];
  const screens = [
    { href: `/loja/${props.slug}`, label: 'Tela da cozinha' },
    { href: `/loja/${props.slug}/salao`, label: 'Tela do salão (garçom)' },
    { href: `/loja/${props.slug}/fechamento`, label: 'Fechamento do dia' },
    { href: `/loja/${props.slug}/cardapio`, label: 'Cardápio completo' },
  ];

  return (
    <aside className="bg-[#0b1220] text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-72 lg:shrink-0 lg:flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 lg:block lg:px-5 lg:pt-6">
        <div className="flex min-w-0 items-center gap-3">
          {props.logo && (
            // eslint-disable-next-line @next/next/no-img-element -- the restaurant's own logo, served by the panel
            <img src={props.logo} alt="" className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain p-0.5" />
          )}
          <div className="min-w-0">
            <p className="text-[15px] font-bold">Painel do dono</p>
            <p className="truncate text-[13px] text-white/60">{props.storeName}</p>
          </div>
        </div>
        <form action={props.logout} className="lg:hidden">
          <button type="submit" className="min-h-10 rounded-lg px-3 text-sm text-white/70 hover:bg-white/10 hover:text-white">
            Sair
          </button>
        </form>
      </div>

      <nav aria-label="Seções do painel" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:mt-4 lg:flex-col lg:overflow-visible lg:pb-0">
        {live.map((l) => {
          const active = l.href === base ? path === base : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-[15px] font-semibold whitespace-nowrap transition-colors ${
                active ? 'bg-accent text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Svg name={l.icon} />
              {l.label}
            </Link>
          );
        })}
        {soon.map((s) => (
          <span key={s.label} className="flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm whitespace-nowrap text-white/35" title="Chega na próxima etapa">
            <Svg name={s.icon} />
            {s.label}
            <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white/50 uppercase">em breve</span>
          </span>
        ))}
      </nav>

      <div className="hidden px-3 lg:mt-6 lg:block">
        <p className="px-3 text-[11px] font-semibold tracking-wider text-white/40 uppercase">Outras telas</p>
        <ul className="mt-1">
          {screens.map((s) => (
            <li key={s.href}>
              <a href={s.href} className="flex min-h-10 items-center rounded-lg px-3 text-sm text-white/70 hover:bg-white/10 hover:text-white">
                {s.label}
              </a>
            </li>
          ))}
          {props.team && (
            <li>
              <a href={`/painel/lojas/${props.slug}?aba=online`} target="_blank" rel="noopener" className="flex min-h-10 items-center rounded-lg px-3 text-sm text-white/70 hover:bg-white/10 hover:text-white">
                Configurar (equipe)
              </a>
            </li>
          )}
        </ul>
      </div>

      <div className="mt-auto hidden border-t border-white/10 px-5 py-4 lg:block">
        <p className="truncate text-[13px] text-white/60">{props.userName}</p>
        <form action={props.logout}>
          <button type="submit" className="mt-1 min-h-9 text-sm font-semibold text-white/80 hover:text-white">
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}

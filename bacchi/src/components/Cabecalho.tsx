'use client';
// Navigation bar. On the home page it starts transparent over the dark hero (white logo); once the page moves
// it becomes a frosted light bar. It slides away while reading down and comes back on the way up.
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCotacao } from '@/lib/cotacao-store';

const LINKS = [
  { href: '/produtos', rotulo: 'Produtos' },
  { href: '/sobre', rotulo: 'A Bacchi' },
  { href: '/representantes', rotulo: 'Representantes' },
  { href: '/contato', rotulo: 'Contato' },
];

export function Cabecalho() {
  const caminho = usePathname();
  const itens = useCotacao();
  const [rolou, setRolou] = useState(false);
  const [escondido, setEscondido] = useState(false);
  // the menu belongs to the page it was opened on: a route change closes it without an effect
  const [menuEm, setMenuEm] = useState<string | null>(null);
  const aberto = menuEm === caminho;
  const setAberto = (v: boolean | ((a: boolean) => boolean)) => setMenuEm((typeof v === 'function' ? v(aberto) : v) ? caminho : null);
  const ultimo = useRef(0);
  const botaoMenu = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const aoRolar = () => {
      const y = window.scrollY;
      setRolou(y > 24);
      setEscondido(y > 320 && y > ultimo.current + 4);
      if (y < ultimo.current - 4 || y < 320) setEscondido(false);
      ultimo.current = y;
    };
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => window.removeEventListener('scroll', aoRolar);
  }, []);

  // keep the page from scrolling under the open menu; Esc closes it
  useEffect(() => {
    document.documentElement.style.overflow = aberto ? 'hidden' : '';
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuEm(null);
        botaoMenu.current?.focus();
      }
    };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aberto]);

  const sobreEscuro = caminho === '/' && !rolou && !aberto;
  const qtd = itens.length;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,box-shadow] duration-500 ease-[var(--ease-saida)] ${escondido && !aberto ? '-translate-y-full' : ''} ${
        sobreEscuro || aberto ? 'bg-transparent' : 'bg-papel/85 shadow-[0_1px_0_rgba(13,23,38,.08)] backdrop-blur-xl'
      }`}
    >
      <div className="container-b flex h-16 items-center justify-between gap-6 md:h-20">
        <Link href="/" className="relative z-10 block h-7 w-[120px] shrink-0 md:h-8 md:w-[136px]" aria-label="Bacchi, página inicial">
          <Image src="/img/marca/logo-branco.png" alt="" fill sizes="136px" priority={caminho === '/'} className={`object-contain object-left transition-opacity duration-300 ${sobreEscuro || aberto ? 'opacity-100' : 'opacity-0'}`} />
          <Image src="/img/marca/logo-azul.png" alt="" fill sizes="136px" priority={caminho !== '/'} className={`object-contain object-left transition-opacity duration-300 ${sobreEscuro || aberto ? 'opacity-0' : 'opacity-100'}`} />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => {
            const ativo = caminho.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} aria-current={ativo ? 'page' : undefined} className={`link-b py-1 text-[0.95rem] font-medium ${sobreEscuro ? 'text-white/90 hover:text-white' : 'text-tinta-2 hover:text-tinta'} ${ativo ? '!bg-[length:100%_1px]' : ''}`}>
                {l.rotulo}
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 flex items-center gap-2">
          <Link
            href="/cotacao"
            className={`btn min-h-11 px-4 text-sm ${sobreEscuro || aberto ? 'btn-claro' : 'btn-primario'}`}
            aria-label={qtd ? `Cotação, ${qtd} ${qtd === 1 ? 'item' : 'itens'}` : 'Cotação'}
          >
            <span className="hidden sm:inline">Cotação</span>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="sm:hidden">
              <path d="M9 5h10M9 12h10M9 19h10M4.5 5h.01M4.5 12h.01M4.5 19h.01" strokeLinecap="round" />
            </svg>
            {qtd > 0 && (
              <span key={qtd} className="grid h-6 min-w-6 animate-[pulsar_.5s_var(--ease-saida)] place-items-center rounded-full bg-marinho px-1.5 text-xs font-bold text-white">
                {qtd}
              </span>
            )}
          </Link>
          <button
            ref={botaoMenu}
            type="button"
            onClick={() => setAberto((a) => !a)}
            aria-expanded={aberto}
            aria-controls="menu-movel"
            className={`grid h-11 w-11 place-items-center rounded-full lg:hidden ${sobreEscuro || aberto ? 'text-white' : 'text-tinta'}`}
          >
            <span className="sr-only">{aberto ? 'Fechar menu' : 'Abrir menu'}</span>
            <span aria-hidden="true" className="relative block h-3 w-5">
              <span className={`absolute left-0 h-[1.5px] w-5 bg-current transition-transform duration-300 ${aberto ? 'top-1.5 rotate-45' : 'top-0'}`} />
              <span className={`absolute left-0 h-[1.5px] w-5 bg-current transition-transform duration-300 ${aberto ? 'top-1.5 -rotate-45' : 'top-3'}`} />
            </span>
          </button>
        </div>
      </div>

      <div
        id="menu-movel"
        hidden={!aberto}
        className="fixed inset-0 -z-0 bg-marinho-950 px-[clamp(1rem,4vw,3rem)] pt-28 pb-10 text-white lg:hidden"
      >
        <nav aria-label="Menu" className="flex h-full flex-col">
          <ul className="space-y-1">
            {[{ href: '/', rotulo: 'Início' }, ...LINKS, { href: '/cotacao', rotulo: 'Cotação' }].map((l, i) => (
              <li key={l.href} style={{ animationDelay: `${60 + i * 45}ms` }} className="animate-[subir_.6s_var(--ease-saida)_both]">
                <Link href={l.href} className="block py-2 font-display text-4xl font-semibold tracking-tight">
                  {l.rotulo}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-auto text-sm text-white/60">Desde 1937 · Cotia, SP</p>
        </nav>
      </div>
    </header>
  );
}

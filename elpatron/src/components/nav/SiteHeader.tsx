'use client';

import { useEffect, useState } from 'react';
import { formatBRL } from '@/lib/money';
import { useCart, useUi } from '../Providers';
import { Wordmark } from '../brand/Brand';
import { BagIcon } from '../ui/Icons';
import { scrollToHash } from './NavOverlay';

/** Header bar once the page leaves the top; header logo once the hero's own logo has scrolled off. */
function useScrolled() {
  const [scrolled, setScrolled] = useState({ bar: false, logo: false });
  useEffect(() => {
    const on = () => {
      const y = window.scrollY;
      const bar = y > 24;
      const logo = y > window.innerHeight * 0.4;
      setScrolled((s) => (s.bar === bar && s.logo === logo ? s : { bar, logo }));
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return scrolled;
}

export function SiteHeader() {
  const scrolled = useScrolled();
  const cart = useCart();
  const ui = useUi();
  const [bump, setBump] = useState(0);
  const [prev, setPrev] = useState(cart.count);
  if (cart.count !== prev) {
    if (cart.count > prev) setBump((b) => b + 1);
    setPrev(cart.count);
  }

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 text-ink"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Transparent over the top of the hero, then a black bar with a gold hairline. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 border-b border-brand/20 bg-cream/88 backdrop-blur-md transition-opacity duration-500 ${scrolled.bar ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="relative mx-auto flex h-[var(--header-h)] max-w-[1600px] items-center justify-between gap-4 px-4 md:px-8">
        <a
          href="#inicio"
          onClick={(e) => {
            e.preventDefault();
            scrollToHash('#inicio');
          }}
          aria-label="El Patron Burger: voltar ao início"
          className={`rounded-md transition-opacity duration-500 ${scrolled.logo ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          tabIndex={scrolled.logo ? undefined : -1}
        >
          <Wordmark />
        </a>
        <nav aria-label="Atalhos" className="flex items-center gap-2 md:gap-3">
          <a
            href="#cardapio"
            onClick={(e) => {
              e.preventDefault();
              scrollToHash('#cardapio');
            }}
            className="cond hidden min-h-11 items-center rounded-full px-4 text-base font-bold tracking-[0.12em] uppercase transition-colors hover:bg-current/10 sm:inline-flex"
          >
            Cardápio
          </a>
          <button
            type="button"
            onClick={() => ui.setCartOpen(true)}
            aria-label={cart.count ? `${cart.count} ${cart.count === 1 ? 'item' : 'itens'} na sacola, ${formatBRL(cart.total)}. Abrir sacola` : '0 itens. Abrir sacola, vazia'}
            className="relative inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border-2 border-brand/45 px-3.5 transition-colors hover:border-mustard"
          >
            <BagIcon size={22} />
            <span key={bump} className={`cond tabular min-w-4 text-lg font-bold ${bump ? 'motion-safe:animate-[pop_0.5s_var(--ease-out-expo)]' : ''}`}>
              {cart.count}
            </span>
          </button>
          <button
            type="button"
            onClick={() => ui.setNavOpen(true)}
            aria-label="Abrir menu"
            aria-haspopup="dialog"
            className="group grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-mustard text-on-dark transition-transform duration-300 hover:scale-105"
          >
            <span aria-hidden="true" className="flex w-5 flex-col items-end gap-[5px]">
              <span className="h-[2.5px] w-5 rounded-full bg-current" />
              <span className="h-[2.5px] w-3.5 rounded-full bg-current transition-[width] duration-300 group-hover:w-5" />
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
}

export function MobileCartBar() {
  const cart = useCart();
  const ui = useUi();
  if (!cart.ready || cart.count === 0) return null;
  return (
    <div className="mobile-cart-bar pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] md:hidden">
      <button
        type="button"
        onClick={() => ui.setCartOpen(true)}
        className="pointer-events-auto flex min-h-16 w-full cursor-pointer items-center justify-between gap-3 rounded-full border border-brand/40 bg-paper/95 py-2 pr-2 pl-5 text-ink shadow-[0_18px_40px_-12px_rgb(0_0_0/0.9)] backdrop-blur-md motion-safe:animate-[toast-in_0.5s_var(--ease-out-expo)]"
      >
        <span className="flex items-center gap-3">
          <BagIcon size={22} />
          <span className="cond text-lg font-bold tracking-[0.06em] uppercase">
            {cart.count} {cart.count === 1 ? 'item' : 'itens'}
          </span>
        </span>
        <span className="cond tabular flex items-center gap-3 rounded-full bg-mustard px-5 py-2.5 text-lg font-bold tracking-[0.06em] text-on-dark uppercase">
          Ver sacola · {formatBRL(cart.total)}
        </span>
      </button>
    </div>
  );
}

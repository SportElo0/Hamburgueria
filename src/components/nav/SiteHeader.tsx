'use client';

import { useEffect, useState } from 'react';
import { formatBRL } from '@/lib/money';
import { useCart, useUi } from '../Providers';
import { Wordmark } from '../brand/Brand';
import { BagIcon } from '../ui/Icons';
import { scrollToHash } from './NavOverlay';

type Tone = 'story' | 'dark' | 'light';

/** Reads the tone of whatever section sits under the header. */
function useHeaderTone() {
  const [tone, setTone] = useState<Tone>('story');
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-tone]'));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setTone((e.target as HTMLElement).dataset.tone as Tone);
      },
      { rootMargin: '-30px 0px -95% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  return tone;
}

export function SiteHeader() {
  const tone = useHeaderTone();
  const cart = useCart();
  const ui = useUi();
  const [bump, setBump] = useState(0);
  const [prev, setPrev] = useState(cart.count);
  if (cart.count !== prev) {
    if (cart.count > prev) setBump((b) => b + 1);
    setPrev(cart.count);
  }

  const dark = tone !== 'light';
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${dark ? 'surface-dark text-on-dark' : 'text-ink'}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Solid ground so content never slides under the badge: cream on light sections, ink on dark ones,
          the closing teal field once the story has unpinned. Transparent only over the live story stage. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 transition-[opacity,background-color] duration-500 ${
          tone === 'light' ? 'bg-cream' : tone === 'dark' ? 'bg-ink' : 'bg-scene-teal opacity-0 [:root[data-story-done]_&]:opacity-100'
        }`}
      />
      <div className="relative mx-auto flex h-[var(--header-h)] max-w-[1600px] items-center justify-between gap-4 px-4 md:px-8">
        <a
          href="#inicio"
          onClick={(e) => {
            e.preventDefault();
            scrollToHash('#inicio');
          }}
          aria-label="Downtown Burger, voltar ao início"
          className="rounded-full"
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
            aria-label={cart.count ? `Abrir sacola, ${cart.count} ${cart.count === 1 ? 'item' : 'itens'}, ${formatBRL(cart.total)}` : 'Abrir sacola, vazia'}
            className={`relative inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border-2 px-3.5 transition-colors ${dark ? 'border-on-dark/40 hover:border-on-dark' : 'border-ink/20 hover:border-ink'}`}
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
            className="group grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-mustard text-ink transition-transform duration-300 hover:scale-105"
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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] md:hidden">
      <button
        type="button"
        onClick={() => ui.setCartOpen(true)}
        className="surface-dark pointer-events-auto flex min-h-16 w-full cursor-pointer items-center justify-between gap-3 rounded-full bg-ink py-2 pr-2 pl-5 text-on-dark shadow-[0_18px_40px_-12px_rgb(0_0_0/0.6)] motion-safe:animate-[toast-in_0.5s_var(--ease-out-expo)]"
      >
        <span className="flex items-center gap-3">
          <BagIcon size={22} />
          <span className="cond text-lg font-bold tracking-[0.06em] uppercase">
            {cart.count} {cart.count === 1 ? 'item' : 'itens'}
          </span>
        </span>
        <span className="cond tabular flex items-center gap-3 rounded-full bg-mustard px-5 py-2.5 text-lg font-bold tracking-[0.06em] text-ink uppercase">
          Ver sacola · {formatBRL(cart.total)}
        </span>
      </button>
    </div>
  );
}

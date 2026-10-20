'use client';

import photos from '@/content/photos.json';
import { restaurant } from '@/content/restaurant';
import { useCart, useUi } from '../Providers';
import { Logo, Star } from '../brand/Brand';
import { CloseIcon } from '../ui/Icons';
import { useNativeDialog } from '../ui/primitives';

export const NAV_LINKS = [
  { href: '#inicio', label: 'Início' },
  { href: '#cat-chefoes', label: 'Os Chefões' },
  { href: '#cardapio', label: 'Cardápio' },
  { href: '#como-pedir', label: 'Como pedir' },
  { href: '#localizacao', label: 'Contato' },
] as const;

export function scrollToHash(hash: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (hash === '#inicio') {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', hash);
    return;
  }
  const el = document.querySelector(hash);
  if (!el) return;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', hash);
  if (el instanceof HTMLElement) {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
}

export function NavOverlay() {
  const ui = useUi();
  const cart = useCart();
  const close = () => ui.setNavOpen(false);
  const ref = useNativeDialog(ui.navOpen, close, 380);

  const go = (hash: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    close();
    window.setTimeout(() => scrollToHash(hash), 400);
  };

  const order = () => {
    close();
    window.setTimeout(() => (cart.count > 0 ? ui.setCartOpen(true) : scrollToHash('#cardapio')), 400);
  };

  return (
    <dialog ref={ref} aria-label="Menu principal" className="nav-overlay fixed inset-0 m-0 h-dvh w-screen overflow-hidden bg-cream p-0 text-ink">
      <div aria-hidden="true" className="nav-bg absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos.items['el-patron'].src} alt="" className="absolute top-1/2 right-[-18vmax] w-[110vmax] max-w-none -translate-y-1/2 opacity-30 blur-[2px]" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(12_10_8/0.97)_0%,rgb(12_10_8/0.86)_50%,rgb(12_10_8/0.35)_100%)]" />
      </div>

      <div className="relative grid h-full grid-rows-[auto_1fr_auto] px-5 pt-[max(16px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))] md:px-12">
        <div className="flex h-[var(--header-h)] items-center justify-between">
          <Logo alt="" className="h-10 w-auto md:h-12" />
          <button
            type="button"
            onClick={close}
            aria-label="Fechar menu"
            className="grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-mustard text-on-dark transition-transform duration-300 hover:rotate-90"
          >
            <CloseIcon size={22} />
          </button>
        </div>

        <nav aria-label="Seções" className="flex items-center">
          <ul className="space-y-1 md:space-y-0">
            {NAV_LINKS.map((l, i) => (
              <li key={l.href} className="nav-item -mt-[0.18em] overflow-hidden pt-[0.18em]" style={{ ['--i' as string]: i }}>
                <a
                  href={l.href}
                  onClick={go(l.href)}
                  className="nav-link display group flex items-center gap-4 text-[clamp(2.6rem,10vw,6.8rem)] leading-[1.02] transition-colors hover:text-mustard focus-visible:text-mustard"
                >
                  <span>{l.label}</span>
                  <Star size={28} className="hidden text-mustard opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-1 group-hover:opacity-100 md:block" />
                </a>
              </li>
            ))}
            <li className="nav-item overflow-hidden pt-4 md:pt-6" style={{ ['--i' as string]: NAV_LINKS.length }}>
              <button
                type="button"
                onClick={order}
                className="nav-link cond inline-flex min-h-15 cursor-pointer items-center gap-3 rounded-full bg-mustard px-8 text-xl font-bold tracking-[0.08em] text-on-dark uppercase transition-colors hover:bg-ink md:text-2xl"
              >
                <Star size={14} />
                Peça agora
                {cart.count > 0 && <span className="tabular">· {cart.count}</span>}
              </button>
            </li>
          </ul>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-4 text-sm text-ink-mute">
          <p className="cond font-semibold tracking-[0.12em] uppercase">{restaurant.tagline}</p>
          <p>Imagens meramente ilustrativas.</p>
        </div>
      </div>
    </dialog>
  );
}

'use client';

import renders from '@/content/renders.json';
import { restaurant } from '@/content/restaurant';
import { useCart, useUi } from '../Providers';
import { Badge, Star } from '../brand/Brand';
import { CloseIcon } from '../ui/Icons';
import { useNativeDialog } from '../ui/primitives';

export const NAV_LINKS = [
  { href: '#inicio', label: 'Início' },
  { href: '#cardapio', label: 'Cardápio' },
  { href: '#historia', label: 'Nossa História' },
  { href: '#localizacao', label: 'Localização' },
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
    <dialog ref={ref} aria-label="Menu principal" className="nav-overlay surface-dark fixed inset-0 m-0 h-dvh w-screen overflow-hidden bg-scene-red p-0 text-on-dark">
      <div aria-hidden="true" className="nav-bg absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={renders.burgers['the-bacon-street'].hero} alt="" className="absolute top-1/2 left-1/2 w-[260vmax] max-w-none -translate-x-1/2 -translate-y-[42%] blur-[18px] saturate-[1.15]" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(60_6_8/0.92)_0%,rgb(90_10_14/0.78)_48%,rgb(60_6_8/0.55)_100%)]" />
      </div>

      <div className="relative grid h-full grid-rows-[auto_1fr_auto] px-5 pt-[max(16px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))] md:px-12">
        <div className="flex h-[var(--header-h)] items-center justify-between">
          <span className="cond text-sm font-bold tracking-[0.3em] uppercase opacity-80">Downtown Burger</span>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar menu"
            className="grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-mustard text-ink transition-transform duration-300 hover:rotate-90"
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
                  className="nav-link display group flex items-center gap-4 text-[clamp(3.2rem,13vw,8.5rem)] leading-[0.92] transition-colors hover:text-mustard focus-visible:text-mustard"
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
                className="nav-link cond inline-flex min-h-15 cursor-pointer items-center gap-3 rounded-full bg-mustard px-8 text-xl font-bold tracking-[0.08em] text-ink uppercase transition-colors hover:bg-on-dark md:text-2xl"
              >
                <Star size={14} />
                Peça agora
                {cart.count > 0 && <span className="tabular">· {cart.count}</span>}
              </button>
            </li>
          </ul>
          <Badge className="pointer-events-none absolute right-12 bottom-24 hidden h-[34vh] w-[34vh] opacity-90 lg:block" />
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-4 text-sm text-on-dark-mute">
          <p className="cond font-semibold tracking-[0.12em] uppercase">{restaurant.tagline}</p>
          <p>Imagens meramente ilustrativas.</p>
        </div>
      </div>
    </dialog>
  );
}

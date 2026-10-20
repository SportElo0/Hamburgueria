'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { categories, isBurger, type CategoryId, type Product } from '@/content/menu';
import { useCatalog } from '@/content/live';
import { formatBRL } from '@/lib/money';
import { useCart, useUi } from '../Providers';
import { Chilli, Star } from '../brand/Brand';
import { ArrowRightIcon, PlusIcon } from '../ui/Icons';
import { Price, useNativeDialog } from '../ui/primitives';

function useCategory(id: CategoryId) {
  return useCatalog().products.filter((p) => p.category === id);
}

function useSoldOut(p: Product) {
  return useCatalog().soldOut.has(p.id);
}

function SoldOut() {
  return (
    <span className="cond inline-flex min-h-11 shrink-0 items-center rounded-full border-2 border-dashed border-ink/35 px-3 text-sm font-bold tracking-[0.08em] text-ink-mute uppercase">
      Esgotado
    </span>
  );
}

function needsSheet(p: Product) {
  return Boolean(p.options?.length);
}

function useQuickAdd() {
  const cart = useCart();
  const ui = useUi();
  return (p: Product) => {
    if (needsSheet(p)) return ui.openProduct({ productId: p.id });
    cart.add(p.id, 1, {});
    ui.toast(`${p.name} na sacola`, { label: 'Ver sacola', run: () => ui.setCartOpen(true) });
  };
}

const isCategory = (v: string): v is CategoryId => categories.some((c) => c.id === v);

/** Opens a menu tab from anywhere (header links, the story's buttons, the footer). */
export const MENU_TAB_EVENT = 'menu:tab';

export function MenuSection() {
  const [active, setActive] = useState<CategoryId>('chefoes');
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  // Bumped when opening a tab should also bring the panel's top into view (after it renders).
  const [scrollTick, setScrollTick] = useState(0);

  // One category at a time, like tabs: someone after a burger never scrolls past drinks and desserts.
  const open = useCallback((id: CategoryId, scroll: boolean) => {
    setActive(id);
    if (scroll) setScrollTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!scrollTick) return;
    const panel = panelRef.current;
    if (!panel) return;
    // Only scroll when the panel's top is out of view: switching tabs at the top of the list stays put.
    const top = panel.getBoundingClientRect().top;
    const offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) + (navRef.current?.offsetHeight ?? 0);
    if (top >= offset - 4 && top < window.innerHeight * 0.6) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: window.scrollY + top - offset - 8, behavior: reduce ? 'auto' : 'smooth' });
  }, [scrollTick]);

  // #cat-… links (footer, nav, story) select their tab.
  useEffect(() => {
    const fromHash = () => {
      const id = decodeURIComponent(location.hash).replace('#cat-', '');
      if (location.hash.startsWith('#cat-') && isCategory(id)) open(id, true);
    };
    const fromEvent = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (isCategory(id)) open(id, true);
    };
    const first = window.setTimeout(fromHash, 0);
    window.addEventListener('hashchange', fromHash);
    window.addEventListener(MENU_TAB_EVENT, fromEvent);
    return () => {
      window.clearTimeout(first);
      window.removeEventListener('hashchange', fromHash);
      window.removeEventListener(MENU_TAB_EVENT, fromEvent);
    };
  }, [open]);

  // Keep the active tab centred by scrolling the tab rail only (scrollIntoView would move the page too).
  useEffect(() => {
    const nav = navRef.current;
    const btn = nav?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    if (!nav || !btn || nav.scrollWidth <= nav.clientWidth) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nav.scrollTo({ left: btn.offsetLeft - nav.clientWidth / 2 + btn.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
  }, [active]);

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = categories[(i + step + categories.length) % categories.length];
    open(next.id, false);
    navRef.current?.querySelector<HTMLElement>(`[data-cat="${next.id}"]`)?.focus();
  };

  return (
    <section id="cardapio" aria-labelledby="cardapio-title" className="relative bg-cream pb-28 text-ink outline-none md:pb-36">
      <div className="mx-auto max-w-[1360px] px-5 pt-20 md:px-10 md:pt-32">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="cond text-lg font-bold tracking-[0.3em] text-brand uppercase">El Burger Del Mal</p>
            <h2 id="cardapio-title" className="display gold-foil mt-2 text-[clamp(3.6rem,11vw,8.6rem)]">
              Cardápio
            </h2>
          </div>
          <div className="max-w-sm pb-3 md:text-right">
            <p className="text-lg text-ink-soft">Escolha uma categoria e monte a sacola.</p>
            <p className="mt-2 text-sm text-ink-mute">Preços em reais. Fotos do cardápio da casa; imagens ilustrativas.</p>
          </div>
        </div>
        <div className="double-rule mt-6 text-brand/60" />
        <Notice />
      </div>

      <div className="sticky top-[var(--header-h)] z-30 mt-6 border-b border-brand/20 bg-cream/92 backdrop-blur-md">
        <nav ref={navRef} aria-label="Categorias do cardápio" role="tablist" className="relative mx-auto flex max-w-[1360px] gap-1 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] md:gap-2 md:px-8">
          {categories.map((c, i) => (
            <button
              key={c.id}
              id={`tab-${c.id}`}
              type="button"
              role="tab"
              data-cat={c.id}
              aria-selected={active === c.id}
              aria-controls="menu-panel"
              tabIndex={active === c.id ? 0 : -1}
              onClick={() => open(c.id, true)}
              onKeyDown={(e) => onTabKey(e, i)}
              className="cond min-h-11 shrink-0 cursor-pointer rounded-full px-4 text-[1.05rem] font-bold tracking-[0.08em] whitespace-nowrap uppercase transition-colors hover:bg-ink/8 aria-selected:bg-mustard aria-selected:text-on-dark md:px-5"
            >
              {c.label}
            </button>
          ))}
        </nav>
      </div>

      <div ref={panelRef} id="menu-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="mx-auto min-h-[60svh] max-w-[1360px] scroll-mt-40 px-5 md:px-10">
        {active === 'chefoes' || active === 'especiais' || active === 'classicos' ? (
          <Showcase key={active} id={active} />
        ) : active === 'porcoes' ? (
          <TextList id="porcoes" />
        ) : active === 'adicionais' ? (
          <Addons onPick={setPickerFor} />
        ) : (
          <BoardList key={active} id={active} />
        )}
        <NextTab active={active} onOpen={(id) => open(id, true)} />
      </div>
      <BurgerPicker addonId={pickerFor} onClose={() => setPickerFor(null)} />
    </section>
  );
}

/** Short notice set in the store panel (holiday hours, item out, etc.). */
function Notice() {
  const { notice } = useCatalog();
  if (!notice) return null;
  return (
    <p role="status" className="mt-6 flex items-start gap-3 rounded-2xl border border-brand bg-brand/12 px-5 py-4 text-[1.05rem] font-semibold">
      <Star size={16} className="mt-1 shrink-0 text-brand" />
      {notice}
    </p>
  );
}

function CategoryHeading({ id }: { id: CategoryId }) {
  const c = categories.find((x) => x.id === id)!;
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2 pt-10 pb-6 md:pt-14">
      <h3 className="display gold-foil flex items-center gap-3 text-[clamp(2.3rem,5.6vw,4.2rem)]">{c.title}</h3>
      <p className="cond pb-1 text-lg font-semibold tracking-[0.06em] text-ink-mute uppercase">{c.blurb}</p>
    </div>
  );
}

function Mark({ p }: { p: Product }) {
  if (p.mark === 'star') return <Star size={18} className="shrink-0 text-brand" />;
  if (p.mark === 'spicy')
    return (
      <span className="inline-flex shrink-0 items-center" title="Picante">
        <Chilli size={20} className="text-[#d9472b]" />
        <span className="sr-only">(picante)</span>
      </span>
    );
  return null;
}

function AddButton({ p, compact = false }: { p: Product; compact?: boolean }) {
  const quick = useQuickAdd();
  if (compact)
    return (
      <button
        type="button"
        onClick={() => quick(p)}
        aria-label={`Adicionar ${p.name}`}
        className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-mustard text-on-dark transition-[background-color,transform] duration-200 hover:bg-ink active:scale-90"
      >
        <PlusIcon size={18} />
      </button>
    );
  return (
    <button
      type="button"
      onClick={() => quick(p)}
      className="cond inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full bg-mustard pr-4 pl-3 text-sm font-bold tracking-[0.08em] text-on-dark uppercase transition-[background-color,transform] duration-200 hover:bg-ink active:scale-[0.97]"
    >
      <PlusIcon size={16} />
      Adicionar
      <span className="sr-only"> {p.name}</span>
    </button>
  );
}

/** Menu row: round photo on the left, name, price, description and actions beside it (as on the Downtown site). */
function PhotoItem({ p }: { p: Product }) {
  const ui = useUi();
  const soldOut = useSoldOut(p);
  return (
    <article className="group flex gap-4 border-b border-brand/20 py-5 sm:gap-5 md:py-6" aria-labelledby={`p-${p.id}`}>
      <button
        type="button"
        onClick={() => ui.openProduct({ productId: p.id })}
        aria-label={`Ver detalhes de ${p.name}`}
        className="relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-full bg-cream-deep outline-offset-4 ring-1 ring-brand/30 sm:h-28 sm:w-28"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.image}
          alt={p.imageAlt ?? ''}
          width={900}
          height={900}
          loading="lazy"
          decoding="async"
          className="h-full w-full scale-[1.12] object-contain transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:scale-[1.22]"
        />
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h4 id={`p-${p.id}`} className="display flex items-center gap-2 text-[1.45rem] leading-[1.05] text-mustard sm:text-[1.65rem]">
            {p.name}
            <Mark p={p} />
          </h4>
          <Price cents={p.price} size="sm" className="shrink-0 pt-0.5 text-ink sm:text-[1.4rem]" />
        </div>
        {p.description && <p className="mt-1.5 max-w-[46ch] text-[0.95rem] leading-snug text-ink-soft">{p.description}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-3">
          {soldOut ? <SoldOut /> : <AddButton p={p} />}
          {p.layers && !soldOut && (
            <button
              type="button"
              onClick={() => ui.openProduct({ productId: p.id })}
              className="cond min-h-11 cursor-pointer rounded-full px-3 text-sm font-bold tracking-[0.08em] text-ink uppercase underline decoration-2 underline-offset-4 transition-colors hover:text-mustard"
            >
              Personalizar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Showcase({ id }: { id: CategoryId }) {
  const items = useCategory(id);
  return (
    <div id={`cat-${id}`} className="scroll-mt-40">
      <CategoryHeading id={id} />
      <div className="grid border-t border-brand/40 lg:grid-cols-2 lg:gap-x-12">
        {items.map((p) => (
          <PhotoItem key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}

/** Items printed without a photo: name, description and price, as on the menu's text pages. */
function TextItem({ p }: { p: Product }) {
  const ui = useUi();
  const soldOut = useSoldOut(p);
  const size = p.options?.find((g) => g.variant);
  return (
    <li className="flex items-start gap-4 border-b border-brand/20 py-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <button type="button" onClick={() => ui.openProduct({ productId: p.id })} className="display cursor-pointer text-left text-[1.35rem] leading-tight text-mustard hover:underline sm:text-[1.5rem]">
            {p.name}
          </button>
          <span className="leader hidden min-w-8 sm:block" aria-hidden="true" />
          <span className="cond tabular text-[1.15rem] font-bold whitespace-nowrap text-ink">
            {size ? size.choices.map((c) => `${c.label.charAt(0)} ${formatBRL(p.price + c.priceDelta)}`).join(' · ') : formatBRL(p.price)}
          </span>
        </div>
        {p.description && <p className="mt-1.5 max-w-[58ch] text-[0.95rem] leading-snug text-ink-soft">{p.description}</p>}
      </div>
      <div className="pt-0.5">{soldOut ? <SoldOut /> : <AddButton p={p} compact />}</div>
    </li>
  );
}

function TextList({ id }: { id: CategoryId }) {
  const items = useCategory(id);
  return (
    <div id={`cat-${id}`} className="scroll-mt-40">
      <CategoryHeading id={id} />
      <ul className="grid border-t border-brand/40 lg:grid-cols-2 lg:gap-x-14">
        {items.map((p) => (
          <TextItem key={p.id} p={p} />
        ))}
      </ul>
      {id === 'porcoes' && <p className="mt-4 text-sm text-ink-mute">P = pequena · G = grande. O tamanho é escolhido ao adicionar.</p>}
    </div>
  );
}

function Addons({ onPick }: { onPick: (id: string) => void }) {
  const { addons } = useCatalog();
  return (
    <div id="cat-adicionais" className="scroll-mt-40">
      <CategoryHeading id="adicionais" />
      <div className="relative border border-brand/70 p-1.5">
        <div className="border border-brand/35 bg-paper px-5 py-6 md:px-10 md:py-8">
          <ul className="grid gap-x-14 md:grid-cols-2">
            {addons.map((a) => (
              <li key={a.id} className="border-b border-brand/15 last:border-b-0 md:[&:nth-last-child(2)]:border-b-0">
                <button
                  type="button"
                  onClick={() => onPick(a.id)}
                  className="group flex min-h-16 w-full cursor-pointer items-baseline gap-3 py-3 text-left"
>
                  <span className="cond text-[1.2rem] leading-tight font-bold tracking-[0.04em] uppercase transition-colors group-hover:text-mustard">{a.label}</span>
                  <span className="leader hidden sm:block" aria-hidden="true" />
                  <span className="cond tabular ml-auto shrink-0 sm:ml-0 text-[1.25rem] font-bold whitespace-nowrap text-brand">{formatBRL(a.priceDelta)}</span>
                  <span className="sr-only">. Escolher burger para adicionar</span>
                  <span aria-hidden="true" className="ml-1 grid h-9 w-9 shrink-0 translate-y-1.5 place-items-center self-start rounded-full border-2 border-brand/40 transition-colors group-hover:border-mustard group-hover:bg-mustard group-hover:text-on-dark">
                    <PlusIcon size={16} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function BoardRow({ p }: { p: Product }) {
  const soldOut = useSoldOut(p);
  return (
    <li className="border-b border-brand/15">
      <div className="flex min-h-16 items-center gap-4 py-2">
        <div className="flex min-w-0 flex-1 items-baseline gap-3">
          <span className="cond text-[1.2rem] leading-tight font-bold tracking-[0.04em] uppercase">{p.name}</span>
          <span className="leader hidden sm:block" aria-hidden="true" />
          <span className="cond tabular ml-auto shrink-0 text-[1.2rem] font-bold whitespace-nowrap text-brand sm:ml-0">{formatBRL(p.price)}</span>
        </div>
        {soldOut ? (
          <SoldOut />
        ) : (
          <AddButton p={p} compact />
        )}
      </div>
    </li>
  );
}

function BoardList({ id }: { id: CategoryId }) {
  const items = useCategory(id);
  return (
    <div id={`cat-${id}`} className="scroll-mt-40">
      <CategoryHeading id={id} />
      <ul className="border-t border-brand/40">
        {items.map((p) => (
          <BoardRow key={p.id} p={p} />
        ))}
      </ul>
    </div>
  );
}

function BurgerPicker({ addonId, onClose }: { addonId: string | null; onClose: () => void }) {
  const ui = useUi();
  const catalog = useCatalog();
  const burgers = catalog.products.filter((p) => isBurger(p) && !catalog.soldOut.has(p.id));
  const ref = useNativeDialog(Boolean(addonId), onClose);
  const addon = catalog.addons.find((a) => a.id === addonId);
  const [last, setLast] = useState(addon);
  if (addon && addon !== last) setLast(addon);
  const shown = addon ?? last;
  return (
    <dialog
      ref={ref}
      aria-labelledby="picker-title"
      className="product-dialog m-0 mt-auto max-h-[86dvh] w-full overflow-hidden rounded-t-[28px] bg-paper p-0 text-ink md:m-auto md:w-[min(560px,calc(100vw-48px))] md:rounded-[28px]"
    >
      <div className="flex max-h-[86dvh] flex-col">
        <div className="border-b border-brand/40 px-6 pt-6 pb-4">
          <h2 id="picker-title" className="display gold-foil text-[2rem]">
            Em qual burger?
          </h2>
          {shown && (
            <p className="mt-1 text-ink-soft">
              Adicional: <strong className="font-semibold text-ink">{shown.label}</strong> · {formatBRL(shown.priceDelta)}
            </p>
          )}
        </div>
        <ul className="scroll-cream overflow-y-auto px-3 py-2">
          {burgers.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.setTimeout(() => ui.openProduct({ productId: p.id, presetAddon: shown?.id }), 120);
                }}
                className="flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-2xl px-3 text-left transition-colors hover:bg-ink/6"
              >
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="h-14 w-14 object-contain" loading="lazy" />
                ) : (
                  <span aria-hidden="true" className="display grid h-14 w-14 place-items-center text-2xl text-brand">
                    {p.name.charAt(0)}
                  </span>
                )}
                <span className="cond flex-1 text-lg font-bold tracking-[0.04em] uppercase">{p.name}</span>
                <span className="cond tabular font-semibold text-ink-soft">{formatBRL(p.price)}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-brand/20 px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <button type="button" onClick={onClose} className="cond min-h-12 w-full cursor-pointer rounded-full border-2 border-ink/20 text-base font-bold tracking-wide uppercase hover:border-ink">
            Cancelar
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** At the end of a tab: the next category, so browsing the whole menu is still one tap away. */
function NextTab({ active, onOpen }: { active: CategoryId; onOpen: (id: CategoryId) => void }) {
  const i = categories.findIndex((c) => c.id === active);
  const next = categories[i + 1];
  if (!next) return null;
  return (
    <div className="mt-12 flex justify-center">
      <button
        type="button"
        onClick={() => onOpen(next.id)}
        className="cond inline-flex min-h-13 cursor-pointer items-center gap-3 rounded-full border-2 border-brand/50 px-7 text-base font-bold tracking-[0.08em] uppercase transition-colors hover:border-mustard hover:text-mustard"
      >
        Ver {next.title.toLowerCase().startsWith('os ') ? next.title.slice(3).toLowerCase() : next.title.toLowerCase()} <ArrowRightIcon size={18} />
      </button>
    </div>
  );
}

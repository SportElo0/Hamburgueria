'use client';

import { useEffect, useRef, useState } from 'react';
import { categories, isBurger, type CategoryId, type Product } from '@/content/menu';
import { useCatalog } from '@/content/live';
import { formatBRL } from '@/lib/money';
import { useCart, useUi } from '../Providers';
import { Chilli, Star } from '../brand/Brand';
import { PlusIcon } from '../ui/Icons';
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

export function MenuSection() {
  const [active, setActive] = useState<CategoryId>('chefoes');
  const navRef = useRef<HTMLElement>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  // While a chip-triggered scroll is in flight the observer would flag whichever section passes
  // first (Bebidas and Sobremesas share a row on wide screens), so it waits until the jump lands.
  const lockUntil = useRef(0);

  useEffect(() => {
    const els = categories.map((c) => document.getElementById(`cat-${c.id}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        if (performance.now() < lockUntil.current) return;
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace('cat-', '') as CategoryId);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Keep the active chip centred by scrolling the chip rail only. scrollIntoView would also
  // scroll the window (it walks every scrollable ancestor), yanking the page on load and
  // cancelling in-flight smooth scrolls from the header links.
  const centred = useRef(false);
  useEffect(() => {
    const nav = navRef.current;
    const btn = nav?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    if (!nav || !btn) return;
    if (!centred.current) {
      centred.current = true;
      if (active === 'chefoes') return;
    }
    if (nav.scrollWidth <= nav.clientWidth) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nav.scrollTo({ left: btn.offsetLeft - nav.clientWidth / 2 + btn.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
  }, [active]);

  const jump = (id: CategoryId, at: number) => {
    const el = document.getElementById(`cat-${id}`);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setActive(id);
    lockUntil.current = at + 1200;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
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
            <p className="text-lg text-ink-soft">Monte o pedido aqui e envie pronto pelo WhatsApp.</p>
            <p className="mt-2 text-sm text-ink-mute">Preços em reais. Fotos do cardápio da casa; imagens ilustrativas.</p>
          </div>
        </div>
        <div className="double-rule mt-6 text-brand/60" />
        <Notice />
      </div>

      <div className="sticky top-[var(--header-h)] z-30 mt-6 border-b border-brand/20 bg-cream/92 backdrop-blur-md">
        <nav ref={navRef} aria-label="Categorias do cardápio" className="relative mx-auto flex max-w-[1360px] gap-1 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] md:gap-2 md:px-8">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              data-cat={c.id}
              aria-current={active === c.id ? 'true' : undefined}
              onClick={(e) => jump(c.id, e.timeStamp)}
              className="cond min-h-11 shrink-0 cursor-pointer rounded-full px-4 text-[1.05rem] font-bold tracking-[0.08em] whitespace-nowrap uppercase transition-colors hover:bg-ink/8 aria-[current=true]:bg-mustard aria-[current=true]:text-on-dark md:px-5"
            >
              {c.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-[1360px] px-5 md:px-10">
        <Showcase id="chefoes" />
        <Showcase id="especiais" />
        <TextList id="classicos" />
        <TextList id="porcoes" />
        <Addons onPick={setPickerFor} />
        <Boards />
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
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2 pt-20 pb-6 md:pt-28">
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

/** Photo card for the burgers the menu prints with a picture: compact row on phones, card from sm up. */
function PhotoItem({ p }: { p: Product }) {
  const ui = useUi();
  const soldOut = useSoldOut(p);
  return (
    <article className="group flex gap-4 border-b border-brand/20 py-5 sm:flex-col sm:gap-0 sm:border sm:border-brand/25 sm:bg-paper sm:p-0" aria-labelledby={`p-${p.id}`}>
      <button
        type="button"
        onClick={() => ui.openProduct({ productId: p.id })}
        aria-label={`Ver detalhes de ${p.name}`}
        className="relative h-32 w-32 shrink-0 cursor-pointer overflow-hidden outline-offset-4 sm:aspect-[5/4] sm:h-auto sm:w-full sm:bg-[radial-gradient(ellipse_at_50%_62%,rgb(217_174_88/0.18),transparent_66%)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.image}
          alt={p.imageAlt ?? ''}
          width={1200}
          height={1200}
          loading="lazy"
          decoding="async"
          className="h-full w-full scale-[1.08] object-contain transition-transform duration-700 [transition-timing-function:var(--ease-out-expo)] group-hover:scale-[1.16] sm:scale-100 sm:group-hover:scale-[1.06]"
        />
      </button>
      <div className="flex min-w-0 flex-1 flex-col sm:px-6 sm:pt-1 sm:pb-6">
        <div className="flex items-start justify-between gap-3">
          <h4 id={`p-${p.id}`} className="display flex items-center gap-2 text-[1.45rem] leading-[1.05] text-mustard sm:text-[1.7rem]">
            {p.name}
            <Mark p={p} />
          </h4>
          <Price cents={p.price} size="sm" className="price-box shrink-0 text-ink sm:text-[1.3rem]" />
        </div>
        {p.description && <p className="mt-2 max-w-[48ch] text-[0.95rem] leading-snug text-ink-soft">{p.description}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-4">{soldOut ? <SoldOut /> : <AddButton p={p} />}</div>
      </div>
    </article>
  );
}

function Showcase({ id }: { id: CategoryId }) {
  const items = useCategory(id);
  return (
    <div id={`cat-${id}`} className="scroll-mt-40">
      <CategoryHeading id={id} />
      <div className="grid border-t border-brand/40 sm:grid-cols-2 sm:gap-5 sm:border-t-0 xl:grid-cols-3">
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

function Boards() {
  return (
    <div className="grid gap-x-16 lg:grid-cols-2">
      {(['bebidas', 'sobremesas'] as const).map((id) => (
        <BoardList key={id} id={id} />
      ))}
    </div>
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

'use client';

import { useEffect, useRef, useState } from 'react';
import { addons, categories, productsByCategory, type CategoryId, type Product } from '@/content/menu';
import { formatBRL } from '@/lib/money';
import { useCart, useUi } from '../Providers';
import { Star } from '../brand/Brand';
import { PlusIcon } from '../ui/Icons';
import { Price, useNativeDialog } from '../ui/primitives';

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
  const [active, setActive] = useState<CategoryId>('burgers');
  const navRef = useRef<HTMLElement>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  // While a chip-triggered scroll is in flight the observer would flag whichever section passes
  // first (Bebidas and Long Necks share a row on wide screens), so it waits until the jump lands.
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
      if (active === 'burgers') return;
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
    <section id="cardapio" data-tone="light" aria-labelledby="cardapio-title" className="relative bg-cream pb-28 text-ink outline-none md:pb-36">
      <div className="mx-auto max-w-[1360px] px-5 pt-20 md:px-10 md:pt-32">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 id="cardapio-title" className="display flex items-center gap-4 text-[clamp(4.4rem,15vw,11rem)] text-ink">
            <Star size={36} className="hidden text-brand md:block" />
            Cardápio
            <Star size={36} className="hidden text-brand md:block" />
          </h2>
          <div className="max-w-sm pb-3 md:text-right">
            <p className="cond text-xl font-bold tracking-[0.08em] text-brand uppercase">Burguer artesanal feito com qualidade.</p>
            <p className="mt-2 text-sm text-ink-mute">Preços em reais. Imagens meramente ilustrativas, geradas digitalmente a partir das descrições do cardápio.</p>
          </div>
        </div>
        <div className="double-rule mt-6 text-ink" />
      </div>

      <div className="sticky top-[var(--header-h)] z-30 mt-6 border-b border-ink/10 bg-cream/92 backdrop-blur-md">
        <nav ref={navRef} aria-label="Categorias do cardápio" className="relative mx-auto flex max-w-[1360px] gap-1 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] md:gap-2 md:px-8">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              data-cat={c.id}
              aria-current={active === c.id ? 'true' : undefined}
              onClick={(e) => jump(c.id, e.timeStamp)}
              className="cond min-h-11 shrink-0 cursor-pointer rounded-full px-4 text-[1.05rem] font-bold tracking-[0.08em] whitespace-nowrap uppercase transition-colors hover:bg-ink/8 aria-[current=true]:bg-ink aria-[current=true]:text-on-dark md:px-5"
            >
              {c.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-[1360px] px-5 md:px-10">
        <Burgers />
        <Sides />
        <Addons onPick={setPickerFor} />
        <Drinks />
        <Desserts />
      </div>
      <BurgerPicker addonId={pickerFor} onClose={() => setPickerFor(null)} />
    </section>
  );
}

function CategoryHeading({ id }: { id: CategoryId }) {
  const c = categories.find((x) => x.id === id)!;
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2 pt-20 pb-6 md:pt-28">
      <h3 className="display flex items-center gap-3 text-[clamp(3rem,8vw,5.6rem)]">
        <Star size={22} className="text-brand" />
        {c.label}
      </h3>
      <p className="cond pb-1 text-lg font-semibold tracking-[0.06em] text-ink-mute uppercase">{c.blurb}</p>
    </div>
  );
}

function ObjectItem({ p, big = false, compact = false }: { p: Product; big?: boolean; compact?: boolean }) {
  const ui = useUi();
  const quick = useQuickAdd();
  return (
    <article className="group relative flex flex-col py-8 md:px-8 md:py-10" aria-labelledby={`p-${p.id}`}>
      <button
        type="button"
        onClick={() => ui.openProduct({ productId: p.id })}
        aria-label={`Ver detalhes de ${p.name}`}
        className="relative -mx-2 block cursor-pointer rounded-3xl outline-offset-4"
      >
        <span aria-hidden="true" className="absolute inset-x-[16%] bottom-[14%] h-[9%] rounded-[50%] bg-ink/25 blur-xl transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)] group-hover:scale-x-90" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.image}
          alt={p.imageAlt}
          width={900}
          height={900}
          loading="lazy"
          decoding="async"
          className={`relative mx-auto aspect-square w-full object-contain transition-transform duration-700 [transition-timing-function:var(--ease-out-expo)] group-hover:-translate-y-3 group-hover:-rotate-2 ${big ? 'max-w-[460px]' : 'max-w-[380px]'}`}
        />
      </button>
      <div className="mt-2 flex items-start justify-between gap-4">
        <h4 id={`p-${p.id}`} className={`display ${compact ? 'text-[2.35rem] xl:text-[2rem]' : 'text-[2.35rem] md:text-[2.6rem]'}`}>
          {p.name}
        </h4>
        <Price cents={p.price} className="shrink-0 pt-1 text-brand" />
      </div>
      {p.description && <p className="mt-3 max-w-[46ch] text-[1rem] leading-relaxed text-ink-soft">{p.description}</p>}
      <div className="mt-auto flex items-center gap-2 pt-6">
        <button
          type="button"
          onClick={() => quick(p)}
          className="cond inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full bg-ink pr-6 pl-4 text-base font-bold tracking-[0.08em] text-on-dark uppercase transition-[background-color,transform] duration-200 hover:bg-brand active:scale-[0.97]"
        >
          <PlusIcon size={18} />
          Adicionar
          <span className="sr-only"> {p.name}</span>
        </button>
        {p.layers && (
          <button
            type="button"
            onClick={() => ui.openProduct({ productId: p.id })}
            className="cond min-h-12 cursor-pointer rounded-full px-4 text-base font-bold tracking-[0.08em] text-ink uppercase underline decoration-2 underline-offset-4 transition-colors hover:text-brand"
          >
            Personalizar
          </button>
        )}
      </div>
    </article>
  );
}

const ruled = 'grid divide-y divide-ink/15 border-y-2 border-ink md:divide-y-0 md:[&>*]:border-ink/15 md:[&>*:not(:nth-child(3n+1))]:border-l';

function Burgers() {
  const items = productsByCategory('burgers');
  return (
    <div id="cat-burgers" className="scroll-mt-40">
      <CategoryHeading id="burgers" />
      <div className={`${ruled} md:grid-cols-2 lg:grid-cols-3 md:[&>*:nth-child(n+4)]:border-t lg:[&>*:nth-child(n+4)]:border-t md:max-lg:[&>*]:border-l-0 md:max-lg:[&>*:nth-child(2n)]:border-l md:max-lg:[&>*:nth-child(n+3)]:border-t`}>
        {items.map((p) => (
          <ObjectItem key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}

function Sides() {
  const items = productsByCategory('entradas');
  return (
    <div id="cat-entradas" className="scroll-mt-40">
      <CategoryHeading id="entradas" />
      <div className="grid divide-y divide-ink/15 border-y-2 border-ink md:grid-cols-2 md:divide-y-0 md:[&>*:nth-child(2n)]:border-l md:[&>*:nth-child(n+3)]:border-t md:[&>*]:border-ink/15 xl:grid-cols-4 xl:[&>*:nth-child(n+3)]:border-t-0 xl:[&>*:not(:first-child)]:border-l">
        {items.map((p) => (
          <ObjectItem key={p.id} p={p} compact />
        ))}
      </div>
    </div>
  );
}

function Addons({ onPick }: { onPick: (id: string) => void }) {
  return (
    <div id="cat-adicionais" className="scroll-mt-40">
      <CategoryHeading id="adicionais" />
      <div className="relative rounded-[28px] border-[3px] border-brand p-1.5">
        <div className="rounded-[22px] border-[1.5px] border-brand px-5 py-6 md:px-10 md:py-8">
          <ul className="grid gap-x-14 md:grid-cols-2">
            {addons.map((a) => (
              <li key={a.id} className="border-b border-ink/12 last:border-b-0 md:[&:nth-last-child(2)]:border-b-0">
                <button
                  type="button"
                  onClick={() => onPick(a.id)}
                  className="group flex min-h-16 w-full cursor-pointer items-baseline gap-3 py-3 text-left"
>
                  <span className="cond text-[1.25rem] leading-tight font-bold tracking-[0.04em] uppercase transition-colors group-hover:text-brand">{a.label}</span>
                  <span className="leader hidden sm:block" aria-hidden="true" />
                  <span className="cond tabular ml-auto shrink-0 sm:ml-0 text-[1.25rem] font-bold whitespace-nowrap text-brand">{formatBRL(a.priceDelta)}</span>
                  <span className="sr-only">. Escolher burger para adicionar</span>
                  <span aria-hidden="true" className="ml-1 grid h-9 w-9 shrink-0 translate-y-1.5 place-items-center self-start rounded-full border-2 border-ink/20 transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-on-dark">
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
  const quick = useQuickAdd();
  return (
    <li className="border-b border-ink/12">
      <div className="flex min-h-20 items-center gap-4 py-2">
        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-cream-deep/70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt="" width={64} height={64} loading="lazy" className={`h-full w-full object-contain ${p.category === 'long-necks' ? 'scale-[1.5]' : 'scale-[2.2] translate-y-[4%]'}`} />
        </span>
        <div className="flex min-w-0 flex-1 items-baseline gap-3">
          <span className="cond text-[1.2rem] leading-tight font-bold tracking-[0.04em] uppercase">{p.name}</span>
          <span className="leader hidden sm:block" aria-hidden="true" />
          <span className="cond tabular ml-auto shrink-0 text-[1.2rem] font-bold whitespace-nowrap text-brand sm:ml-0">{formatBRL(p.price)}</span>
        </div>
        <button
          type="button"
          onClick={() => quick(p)}
          aria-label={`Adicionar ${p.name}`}
          className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-ink text-on-dark transition-[background-color,transform] duration-200 hover:bg-brand active:scale-90"
        >
          <PlusIcon size={18} />
        </button>
      </div>
    </li>
  );
}

function Drinks() {
  return (
    <div className="grid gap-x-16 lg:grid-cols-2">
      <div id="cat-bebidas" className="scroll-mt-40">
        <CategoryHeading id="bebidas" />
        <ul className="border-t-2 border-ink">
          {productsByCategory('bebidas').map((p) => (
            <BoardRow key={p.id} p={p} />
          ))}
        </ul>
      </div>
      <div id="cat-long-necks" className="scroll-mt-40">
        <CategoryHeading id="long-necks" />
        <ul className="border-t-2 border-ink">
          {productsByCategory('long-necks').map((p) => (
            <BoardRow key={p.id} p={p} />
          ))}
        </ul>
        <p className="mt-5 flex items-start gap-3 text-sm text-ink-soft">
          <span className="cond mt-0.5 shrink-0 rounded-md border-2 border-ink px-1.5 text-xs font-bold">18+</span>
          Venda proibida para menores de 18 anos. Se beber, não dirija. Imagem genérica: a garrafa servida é a da marca escolhida.
        </p>
      </div>
    </div>
  );
}

function Desserts() {
  const items = productsByCategory('sobremesas');
  return (
    <div id="cat-sobremesas" className="scroll-mt-40">
      <CategoryHeading id="sobremesas" />
      <div className="grid divide-y divide-ink/15 border-y-2 border-ink md:grid-cols-2 md:divide-y-0 md:[&>*:nth-child(2)]:border-l md:[&>*]:border-ink/15">
        {items.map((p) => (
          <ObjectItem key={p.id} p={p} big />
        ))}
      </div>
    </div>
  );
}

function BurgerPicker({ addonId, onClose }: { addonId: string | null; onClose: () => void }) {
  const ui = useUi();
  const ref = useNativeDialog(Boolean(addonId), onClose);
  const addon = addons.find((a) => a.id === addonId);
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
        <div className="border-b-2 border-ink px-6 pt-6 pb-4">
          <h2 id="picker-title" className="display text-[2.2rem]">
            Em qual burger?
          </h2>
          {shown && (
            <p className="mt-1 text-ink-soft">
              Adicional: <strong className="font-semibold text-ink">{shown.label}</strong> · {formatBRL(shown.priceDelta)}
            </p>
          )}
        </div>
        <ul className="scroll-cream overflow-y-auto px-3 py-2">
          {productsByCategory('burgers').map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.setTimeout(() => ui.openProduct({ productId: p.id, presetAddon: shown?.id }), 120);
                }}
                className="flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-2xl px-3 text-left transition-colors hover:bg-ink/6"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" className="h-14 w-14 object-contain" loading="lazy" />
                <span className="cond flex-1 text-lg font-bold tracking-[0.04em] uppercase">{p.name}</span>
                <span className="cond tabular font-semibold text-ink-soft">{formatBRL(p.price)}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-ink/10 px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <button type="button" onClick={onClose} className="cond min-h-12 w-full cursor-pointer rounded-full border-2 border-ink/20 text-base font-bold tracking-wide uppercase hover:border-ink">
            Cancelar
          </button>
        </div>
      </div>
    </dialog>
  );
}

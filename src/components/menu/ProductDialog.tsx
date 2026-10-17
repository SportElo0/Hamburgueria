'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { productById, type CategoryId, type OptionGroup, type Product } from '@/content/menu';
import { defaultSelections, missingRequired, unitPrice, type Selections } from '@/lib/cart';
import { formatBRL } from '@/lib/money';
import { useCart, useUi, type ProductRequest } from '../Providers';
import { BurgerStack } from '../burger/BurgerStack';
import { Star } from '../brand/Brand';
import { CheckIcon, CloseIcon, LayersIcon } from '../ui/Icons';
import { Price, Stepper, useNativeDialog } from '../ui/primitives';

export const CATEGORY_FIELD: Record<CategoryId, string> = {
  burgers: 'bg-scene-red',
  entradas: 'bg-scene-orange',
  adicionais: 'bg-scene-red',
  bebidas: 'bg-scene-teal',
  'long-necks': 'bg-scene-green',
  sobremesas: 'bg-scene-plum',
};

export function ProductDialog() {
  const { product: req, closeProduct } = useUi();
  const ref = useNativeDialog(Boolean(req), closeProduct);
  const [last, setLast] = useState<ProductRequest | null>(null);
  if (req && req !== last) setLast(req);
  const active = req ?? last;
  const product = active ? productById.get(active.productId) : undefined;

  return (
    <dialog
      ref={ref}
      aria-labelledby="product-title"
      className="product-dialog m-0 mt-auto h-[94dvh] w-full overflow-hidden rounded-t-[28px] bg-paper p-0 text-ink shadow-[0_-20px_60px_-20px_rgb(0_0_0/0.5)] md:m-auto md:h-[min(780px,calc(100dvh-48px))] md:w-[min(1080px,calc(100vw-48px))] md:rounded-[28px]"
    >
      {product && active && <ProductForm key={`${product.id}:${active.lineId ?? ''}:${active.presetAddon ?? ''}`} product={product} request={active} />}
    </dialog>
  );
}

function ProductForm({ product, request }: { product: Product; request: ProductRequest }) {
  const cart = useCart();
  const ui = useUi();
  const editing = request.lineId ? cart.lines.find((l) => l.lineId === request.lineId) : undefined;

  const [selections, setSelections] = useState<Selections>(() => {
    if (editing) return structuredClone(editing.selections);
    const s = defaultSelections(product);
    if (request.presetAddon && s.adicionais) s.adicionais = [request.presetAddon];
    return s;
  });
  const [qty, setQty] = useState(editing?.quantity ?? 1);
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [showErrors, setShowErrors] = useState(false);
  const [inside, setInside] = useState(false);
  const formId = useId();
  const groupRefs = useRef<Record<string, HTMLFieldSetElement | null>>({});

  const missing = missingRequired(product, selections);
  const unit = unitPrice(product, selections);
  const image = useMemo(() => {
    for (const g of product.options ?? []) {
      const c = g.choices.find((ch) => ch.image && selections[g.id]?.includes(ch.id));
      if (c?.image) return c.image;
    }
    return product.image;
  }, [product, selections]);

  const toggle = (group: OptionGroup, choiceId: string) => {
    setSelections((prev) => {
      const cur = prev[group.id] ?? [];
      const next = group.type === 'single' ? [choiceId] : cur.includes(choiceId) ? cur.filter((c) => c !== choiceId) : [...cur, choiceId];
      return { ...prev, [group.id]: next };
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (missing.length) {
      setShowErrors(true);
      groupRefs.current[missing[0].id]?.querySelector('input')?.focus();
      return;
    }
    if (editing) {
      cart.update(editing.lineId, selections, notes, qty);
      ui.closeProduct();
      ui.toast(`${product.name} atualizado`);
    } else {
      cart.add(product.id, qty, selections, notes);
      ui.closeProduct();
      ui.toast(`${qty}x ${product.name} na sacola`, { label: 'Ver sacola', run: () => ui.setCartOpen(true) });
    }
  };

  const hasLayers = Boolean(product.layers);
  const field = CATEGORY_FIELD[product.category];

  return (
    <form id={formId} onSubmit={submit} className="grid h-full grid-rows-[auto_1fr] md:grid-cols-[1.05fr_1fr] md:grid-rows-1">
      {/* Visual */}
      <div className={`surface-dark relative overflow-hidden ${field} text-on-dark`}>
        <div aria-hidden="true" className="ghost-word absolute -bottom-6 left-1/2 -translate-x-1/2 text-[34vw] md:text-[15rem]">
          {product.category === 'burgers' ? 'Downtown' : 'Burger'}
        </div>
        <button
          type="button"
          onClick={ui.closeProduct}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-20 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-black/25 text-on-dark backdrop-blur-sm transition-colors hover:bg-black/40 md:hidden"
        >
          <CloseIcon size={20} />
        </button>
        <div className="relative flex h-[34dvh] items-center justify-center md:h-full">
          <div className={`relative w-[min(78vw,40dvh)] transition-transform duration-700 [transition-timing-function:var(--ease-out-expo)] md:w-[82%] ${inside ? 'scale-[0.72]' : ''}`} style={{ ['--label-out' as string]: '0px' }}>
            {hasLayers && inside ? (
              <BurgerStack id={product.layers!} explode={1} gap={10} labels size="sm" tone="dark" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={product.imageAlt} className="aspect-square w-full object-contain drop-shadow-[0_30px_30px_rgb(0_0_0/0.35)]" />
            )}
          </div>
          {hasLayers && (
            <button
              type="button"
              aria-pressed={inside}
              onClick={() => setInside((v) => !v)}
              className="cond absolute bottom-4 left-4 z-10 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-black/25 px-4 text-sm font-bold tracking-[0.08em] uppercase backdrop-blur-sm transition-colors hover:bg-black/40 aria-pressed:bg-on-dark aria-pressed:text-ink"
            >
              <LayersIcon size={18} />
              {inside ? 'Montar burger' : 'Ver por dentro'}
            </button>
          )}
          <p className="cond absolute right-4 bottom-4 text-[0.7rem] font-semibold tracking-[0.12em] uppercase opacity-75">Imagem ilustrativa</p>
        </div>
      </div>

      {/* Details */}
      <div className="flex min-h-0 flex-col">
        <div className="scroll-cream min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-6 pb-4 md:px-9 md:pt-10">
          <div className="flex items-start justify-between gap-4">
            <h2 id="product-title" className="display text-[2.6rem] md:text-[3.4rem]">
              {product.name}
            </h2>
            <button
              type="button"
              onClick={ui.closeProduct}
              aria-label="Fechar"
              className="-mt-1 -mr-2 hidden h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-ink transition-colors hover:bg-ink/8 md:grid"
            >
              <CloseIcon size={22} />
            </button>
          </div>
          <Price cents={product.price} size="lg" className="mt-3 text-brand" />
          <div className="double-rule mt-5 text-ink" />
          {product.description && <p className="mt-4 max-w-[52ch] text-[1.05rem] leading-relaxed text-ink-soft">{product.description}</p>}
          {product.includes && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Acompanha">
              {product.includes.map((inc) => (
                <li key={inc} className="cond inline-flex items-center gap-1.5 rounded-full bg-cream-deep px-3 py-1.5 text-sm font-semibold tracking-wide uppercase">
                  <CheckIcon size={14} /> {inc} · incluso
                </li>
              ))}
            </ul>
          )}
          {product.alcoholic && (
            <p className="mt-4 rounded-2xl border-2 border-ink/12 px-4 py-3 text-sm text-ink-soft">
              Venda proibida para menores de 18 anos. Se beber, não dirija. Um documento com foto pode ser solicitado na entrega ou retirada.
            </p>
          )}

          {product.options?.map((group) => {
            const errorId = `${formId}-${group.id}-err`;
            const isMissing = showErrors && missing.some((m) => m.id === group.id);
            return (
              <fieldset
                key={group.id}
                ref={(el) => {
                  groupRefs.current[group.id] = el;
                }}
                className="mt-8"
                aria-describedby={isMissing ? errorId : undefined}
              >
                <legend className="flex w-full items-baseline justify-between gap-3 border-b-2 border-ink pb-2">
                  <span className="display text-[1.6rem]">{group.label}</span>
                  <span className="cond text-sm font-semibold tracking-[0.08em] text-ink-mute uppercase">
                    {group.required ? `Obrigatório · ${group.hint ?? 'Escolha 1'}` : group.hint}
                  </span>
                </legend>
                {isMissing && (
                  <p id={errorId} role="alert" className="mt-3 text-sm font-semibold text-brand">
                    {group.id === 'sabor' ? 'Escolha um sabor para continuar.' : `Escolha uma opção em “${group.label}”.`}
                  </p>
                )}
                <ul className="mt-1">
                  {group.choices.map((choice) => {
                    const checked = selections[group.id]?.includes(choice.id) ?? false;
                    return (
                      <li key={choice.id} className="border-b border-ink/10">
                        <label className="group flex min-h-14 cursor-pointer items-center gap-4 py-2">
                          <input
                            type={group.type === 'single' ? 'radio' : 'checkbox'}
                            name={`${formId}-${group.id}`}
                            checked={checked}
                            onChange={() => toggle(group, choice.id)}
                            className="peer sr-only"
                          />
                          <span
                            aria-hidden="true"
                            className={`grid h-6 w-6 shrink-0 place-items-center border-2 border-ink transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink ${group.type === 'single' ? 'rounded-full' : 'rounded-md'} ${checked ? 'bg-ink text-mustard' : 'bg-transparent text-transparent group-hover:bg-ink/6'}`}
                          >
                            {group.type === 'single' ? <span className="h-2 w-2 rounded-full bg-current" /> : <CheckIcon size={15} />}
                          </span>
                          <span className="flex-1 text-[1.02rem] font-medium">{choice.label}</span>
                          <span className="cond tabular text-base font-semibold text-ink-soft">
                            {group.included ? 'incluso' : choice.priceDelta ? `+ ${formatBRL(choice.priceDelta)}` : ''}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            );
          })}

          {product.category !== 'bebidas' && product.category !== 'long-necks' && (
            <div className="mt-8">
              <label htmlFor={`${formId}-notes`} className="display block text-[1.6rem]">
                Observações
              </label>
              <p id={`${formId}-notes-hint`} className="mt-1 text-sm text-ink-mute">
                Opcional. Ex.: sem cebola, ponto da carne.
              </p>
              <textarea
                id={`${formId}-notes`}
                aria-describedby={`${formId}-notes-hint`}
                value={notes}
                maxLength={140}
                rows={2}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-3 w-full resize-none rounded-2xl border-2 border-ink/15 bg-white/60 px-4 py-3 text-base outline-none placeholder:text-ink-mute focus-visible:border-ink"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-ink/10 bg-paper px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] md:px-9 md:py-5">
          <Stepper value={qty} onChange={setQty} label="Quantidade" />
          <button
            type="submit"
            aria-disabled={missing.length > 0}
            className="cond group inline-flex min-h-14 flex-1 cursor-pointer items-center justify-between gap-2 rounded-full bg-ink px-5 text-base font-bold tracking-[0.06em] whitespace-nowrap text-on-dark uppercase sm:gap-3 sm:px-6 sm:text-lg transition-[background-color,transform] duration-200 hover:bg-brand active:scale-[0.98] aria-disabled:bg-ink/55"
          >
            <span className="inline-flex items-center gap-2">
              <Star size={12} className="text-mustard" />
              {editing ? 'Atualizar' : 'Adicionar'}
            </span>
            <span className="tabular">{formatBRL(unit * qty)}</span>
          </button>
        </div>
      </div>
    </form>
  );
}

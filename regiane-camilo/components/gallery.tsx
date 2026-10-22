"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { products, site, styles, type Product, type StyleId } from "@/config/site";
import { onShowStyle } from "@/lib/gallery-store";
import { requestOrder } from "@/lib/order-store";
import { Photo } from "@/components/photo";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function lockPageScroll(lock: boolean) {
  document.documentElement.style.overflow = lock ? "hidden" : "";
}

/** Linhas de informação do produto: o que não foi confirmado aparece como "a combinar". */
function productFacts(product: Product) {
  const list = (items: string[], empty: string) => (items.length ? items.join(", ") : empty);
  return [
    {
      label: "Valor",
      value: product.price !== null ? brl.format(product.price) : "Consultar orçamento",
    },
    { label: "Tamanhos", value: list(product.sizes, "A combinar no pedido") },
    {
      label: "Sabores e recheios",
      value: list([...product.flavors, ...product.fillings], `Combinados com a ${site.ownerFirstName}`),
    },
    { label: "Personalização", value: list(product.customization, "Conte sua ideia no pedido") },
    ...(product.availability ? [{ label: "Disponibilidade", value: product.availability }] : []),
  ];
}

export function Gallery() {
  const [filter, setFilter] = useState<StyleId | null>(null);
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const touchStart = useRef<number | null>(null);

  const visible = filter ? products.filter((p) => p.style === filter) : products;
  const total = visible.length;
  const current = visible[Math.min(index, total - 1)];
  const styleName = (id: StyleId) => styles.find((s) => s.id === id)?.name ?? "";

  useEffect(() => onShowStyle((style) => setFilter(style)), []);

  const open = (i: number, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setIndex(i);
    dialogRef.current?.showModal();
    lockPageScroll(true);
  };

  const close = useCallback(() => dialogRef.current?.close(), []);
  const step = useCallback(
    (delta: number) => setIndex((i) => (i + delta + total) % total),
    [total],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onKey = (event: KeyboardEvent) => {
      if (!dialog.open || total < 2) return;
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    const onClose = () => {
      lockPageScroll(false);
      triggerRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    dialog.addEventListener("close", onClose);
    return () => {
      window.removeEventListener("keydown", onKey);
      dialog.removeEventListener("close", onClose);
    };
  }, [step, total]);

  const orderLike = (product: Product) => {
    triggerRef.current = null;
    close();
    requestOrder({ productId: product.id });
  };

  return (
    <section id="galeria" aria-labelledby="galeria-title" className="bg-cream">
      <div className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
          <h2
            id="galeria-title"
            data-reveal
            className="serif text-[clamp(2.25rem,4.4vw,3.6rem)] text-ink lg:col-span-6"
          >
            Doces criações, <em className="text-cherry">grandes</em> momentos.
          </h2>
          <p data-reveal className="max-w-[46ch] text-[1.0625rem] leading-relaxed text-muted lg:col-span-5 lg:col-start-8">
            Trabalhos da Regiane publicados no Instagram. Toque em um bolo para ver os detalhes e
            usá-lo como referência no seu pedido.
          </p>
        </div>

        <div
          role="group"
          aria-label="Filtrar por estilo"
          className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {[{ id: null, name: "Todos" } as { id: StyleId | null; name: string }, ...styles].map(
            (option) => {
              const selected = filter === option.id;
              return (
                <button
                  key={option.id ?? "todos"}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setFilter(option.id);
                    setIndex(0);
                  }}
                  className={`min-h-11 flex-none rounded-full border px-5 text-[0.9375rem] transition-colors duration-300 ${
                    selected
                      ? "border-cocoa bg-cocoa text-cream"
                      : "border-line-strong bg-paper text-ink hover:border-cocoa"
                  }`}
                >
                  {option.name}
                </button>
              );
            },
          )}
        </div>
        <p aria-live="polite" className="sr-only">
          {visible.length} {visible.length === 1 ? "bolo" : "bolos"}
          {filter ? ` no estilo ${styleName(filter)}` : ""}
        </p>

        <ul
          key={filter ?? "todos"}
          className="mt-8 columns-1 gap-4 min-[480px]:columns-2 sm:gap-5 lg:columns-3 lg:gap-6"
        >
          {visible.map((product, i) => (
            <li
              key={product.id}
              className="animate-step mb-4 break-inside-avoid sm:mb-5 lg:mb-6"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <button
                type="button"
                onClick={(event) => open(i, event.currentTarget)}
                aria-label={`${product.name}: ver detalhes`}
                className="group block w-full text-left"
              >
                <span className="relative block overflow-hidden rounded-[var(--radius-card)]">
                  <Photo
                    photo={product.photo}
                    sizes="(min-width: 1024px) 30vw, (min-width: 480px) 46vw, 92vw"
                    className="absolute! inset-0"
                    imgClassName="transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                  />
                  <span
                    aria-hidden
                    className="block"
                    style={{ aspectRatio: `${product.photo.width} / ${product.photo.height}` }}
                  />
                  <span
                    aria-hidden
                    className="absolute right-3 bottom-3 inline-flex translate-y-1 items-center gap-2 rounded-full bg-cream/95 px-4 py-2 text-[0.8125rem] font-semibold text-cocoa opacity-0 transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                  >
                    Ver detalhes
                    <ArrowRight size={14} />
                  </span>
                </span>
                <span className="mt-3 flex items-baseline justify-between gap-4 px-1">
                  <span className="serif text-[1.3rem] text-ink">{product.name}</span>
                  <span className="text-[0.8125rem] text-muted">{styleName(product.style)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="produto-titulo"
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-cocoa-deep/75 open:flex lg:m-auto lg:h-[min(88dvh,46rem)] lg:w-[min(92vw,68rem)] lg:rounded-[1.5rem]"
      >
        {current && (
          <div className="flex h-full w-full flex-col overflow-y-auto bg-cream lg:grid lg:grid-cols-[1.1fr_1fr] lg:overflow-hidden">
            <div
              className="relative flex-none bg-cocoa-deep"
              onTouchStart={(event) => {
                touchStart.current = event.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                if (touchStart.current === null || visible.length < 2) return;
                const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current;
                if (Math.abs(delta) > 50) step(delta < 0 ? 1 : -1);
                touchStart.current = null;
              }}
            >
              <Photo
                key={current.id}
                photo={current.photo}
                sizes="(min-width: 1024px) 560px, 100vw"
                className="animate-step h-[52dvh] w-full bg-cocoa-deep! lg:h-full"
                imgClassName="object-contain!"
              />
              {visible.length > 1 && (
                <div className="absolute inset-x-3 bottom-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Bolo anterior"
                    className="grid size-11 place-items-center rounded-full bg-cream/90 text-cocoa hover:bg-cream"
                  >
                    <ChevronLeft size={20} strokeWidth={1.6} />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Próximo bolo"
                    className="grid size-11 place-items-center rounded-full bg-cream/90 text-cocoa hover:bg-cream"
                  >
                    <ChevronRight size={20} strokeWidth={1.6} />
                  </button>
                </div>
              )}
            </div>

            <div className="relative flex flex-col px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-10 lg:overflow-y-auto lg:py-10">
              <button
                type="button"
                onClick={close}
                aria-label="Fechar"
                className="absolute top-3 right-3 grid size-11 place-items-center rounded-full text-cocoa hover:bg-blush"
              >
                <X size={22} strokeWidth={1.6} />
              </button>

              <p className="smallcaps flex items-center gap-2.5 pr-12 text-cherry">
                <span aria-hidden className="dot" />
                {styleName(current.style)}
                {visible.length > 1 && (
                  <span className="tabular font-medium tracking-normal text-muted normal-case">
                    · {Math.min(index, visible.length - 1) + 1} de {visible.length}
                  </span>
                )}
              </p>
              <h3 id="produto-titulo" className="serif mt-3 text-[clamp(2rem,3.4vw,2.6rem)] text-ink">
                {current.name}
              </h3>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink/85">
                {current.description}
              </p>

              <dl className="mt-7 border-t border-line">
                {productFacts(current).map((fact) => (
                  <div
                    key={fact.label}
                    className="grid grid-cols-[9.5rem_1fr] gap-3 border-b border-line py-3 text-[0.9375rem]"
                  >
                    <dt className="text-muted">{fact.label}</dt>
                    <dd className="text-ink">{fact.value}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-5 text-[0.875rem] leading-relaxed text-muted">
                A foto mostra um trabalho já feito pela {site.ownerFirstName}. Cada bolo é feito sob encomenda e pode ter
                diferenças; ela confirma o que é possível pelo WhatsApp.
              </p>

              <div className="mt-auto pt-7">
                <button
                  type="button"
                  onClick={() => orderLike(current)}
                  className="btn btn-cocoa w-full"
                >
                  Quero um bolo parecido
                  <ArrowRight size={16} className="nudge" />
                </button>
                <p className="mt-3 text-center text-[0.8125rem] text-muted">
                  Foto do Instagram {site.instagram.handle}
                </p>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}

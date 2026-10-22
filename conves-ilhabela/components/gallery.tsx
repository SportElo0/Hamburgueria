"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon, X } from "lucide-react";
import { gallery, type GalleryTile } from "@/config/site";
import { Credit } from "@/components/photo";

// Posição de cada foto no mosaico (celular: 6 colunas; desktop: 12).
const spans = [
  "col-span-6 row-span-2 lg:col-span-7 lg:row-span-2",
  "col-span-3 lg:col-span-5",
  "col-span-3 lg:col-span-5",
  "col-span-6 row-span-2 lg:col-span-6",
  "col-span-3 row-span-2 lg:col-span-3",
  "col-span-3 lg:col-span-3",
];

function lockPageScroll(lock: boolean) {
  document.documentElement.style.overflow = lock ? "hidden" : "";
}

function Tile({ tile, sizes }: { tile: GalleryTile; sizes: string }) {
  return (
    <Image
      src={tile.photo.src}
      // O botão já tem o nome da foto; a imagem não repete.
      alt=""
      fill
      sizes={sizes}
      className="object-cover transition-[scale] duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
      style={{
        objectPosition: tile.focus,
        transform: tile.zoom !== 1 ? `scale(${tile.zoom})` : undefined,
        transformOrigin: tile.focus,
      }}
    />
  );
}

export function Gallery() {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const touchStart = useRef<number | null>(null);
  const total = gallery.length;
  const current = gallery[index];

  const open = (i: number, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setIndex(i);
    dialogRef.current?.showModal();
    lockPageScroll(true);
  };
  const close = useCallback(() => dialogRef.current?.close(), []);
  const step = useCallback((delta: number) => setIndex((i) => (i + delta + total) % total), [total]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onKey = (event: KeyboardEvent) => {
      if (!dialog.open) return;
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
  }, [step]);

  return (
    <section id="galeria" aria-labelledby="galeria-title" className="bg-sand">
      <div className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
          <h2 id="galeria-title" data-reveal className="serif text-[clamp(2.3rem,4.6vw,4rem)] text-deep lg:col-span-6">
            Momentos à beira-mar.
          </h2>
          <p data-reveal className="max-w-[46ch] text-[1rem] leading-relaxed text-muted lg:col-span-5 lg:col-start-8">
            O ambiente do Convés em fotos de clientes publicadas no Google, usadas aqui como prévia
            até a chegada das fotos oficiais.
          </p>
        </div>

        <ul className="mt-12 grid auto-rows-[8.5rem] grid-cols-6 gap-2.5 sm:auto-rows-[11rem] lg:auto-rows-[13rem] lg:grid-cols-12 lg:gap-4">
          {gallery.map((tile, i) => (
            <li key={tile.id} data-reveal className={spans[i]} style={{ "--reveal-delay": `${(i % 3) * 80}ms` } as React.CSSProperties}>
              <button
                type="button"
                onClick={(event) => open(i, event.currentTarget)}
                aria-label={`${tile.caption}: ampliar`}
                className="group relative block size-full overflow-hidden rounded-[2px] bg-shell"
              >
                <Tile tile={tile} sizes={i === 0 || i === 3 ? "(min-width: 1024px) 55vw, 100vw" : "(min-width: 1024px) 30vw, 50vw"} />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-deep-2/75 to-transparent px-4 pt-10 pb-3 text-left text-[0.875rem] text-sand opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 max-lg:opacity-100 max-sm:hidden">
                  {tile.caption}
                </span>
              </button>
            </li>
          ))}
          <li className="col-span-3 lg:col-span-3" data-reveal>
            <div className="flex size-full flex-col justify-end gap-2 rounded-[2px] border border-dashed border-line-strong bg-shell/60 p-4 text-muted">
              <ImageIcon size={20} strokeWidth={1.4} aria-hidden />
              <p className="text-[0.8125rem] leading-snug">
                Espaço para as fotos oficiais dos pratos do Convés.
              </p>
            </div>
          </li>
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="galeria-legenda"
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        onTouchStart={(event) => {
          touchStart.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current;
          if (Math.abs(delta) > 50) step(delta < 0 ? 1 : -1);
          touchStart.current = null;
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-deep-2 p-0 text-sand backdrop:bg-deep-2/85 open:flex open:flex-col"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <p className="tabular text-[0.875rem] text-on-deep-muted">
            {index + 1} de {total}
          </p>
          <button type="button" onClick={close} aria-label="Fechar" className="grid size-11 place-items-center hover:text-champagne-soft">
            <X size={24} strokeWidth={1.4} />
          </button>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-24">
          <div key={current.id} className="animate-step relative h-full max-h-[78dvh] w-full max-w-5xl">
            <Image
              src={current.photo.src}
              alt={current.photo.alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <button type="button" onClick={() => step(-1)} aria-label="Foto anterior" className="absolute left-4 hidden size-12 place-items-center rounded-full border border-deep-line hover:border-sand sm:grid">
            <ChevronLeft size={22} strokeWidth={1.4} />
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Próxima foto" className="absolute right-4 hidden size-12 place-items-center rounded-full border border-deep-line hover:border-sand sm:grid">
            <ChevronRight size={22} strokeWidth={1.4} />
          </button>
        </div>
        <div className="flex items-end justify-between gap-4 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8">
          <div>
            <p id="galeria-legenda" className="serif text-[1.6rem]">{current.caption}</p>
            <Credit photo={current.photo} className="text-on-deep-muted" />
          </div>
          <div className="flex gap-2 sm:hidden">
            <button type="button" onClick={() => step(-1)} aria-label="Foto anterior" className="grid size-11 place-items-center rounded-full border border-deep-line">
              <ChevronLeft size={20} strokeWidth={1.4} />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Próxima foto" className="grid size-11 place-items-center rounded-full border border-deep-line">
              <ChevronRight size={20} strokeWidth={1.4} />
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { site } from "@/config/site";
import { PhotoSlot } from "@/components/photo-slot";
import { InstagramIcon } from "@/components/brand";

function lockPageScroll(lock: boolean) {
  document.body.style.overflow = lock ? "hidden" : "";
}

/**
 * Composição editorial: no desktop, uma faixa alta (duas fotos verticais e uma
 * coluna dupla) e uma faixa baixa de quatro; no celular, alterna foto inteira
 * e pares.
 */
const layout = [
  "col-span-2 aspect-[4/5] lg:col-span-5 lg:row-span-3 lg:aspect-auto",
  "aspect-[3/4] lg:col-span-4 lg:row-span-3 lg:aspect-auto",
  "aspect-[3/4] lg:col-span-3 lg:row-span-2 lg:aspect-auto",
  "aspect-[3/4] lg:col-span-3 lg:row-span-1 lg:aspect-auto",
  "aspect-[3/4] lg:col-span-4 lg:row-span-2 lg:aspect-auto",
  "col-span-2 aspect-[4/5] lg:col-span-3 lg:row-span-2 lg:aspect-auto",
  "aspect-[3/4] lg:col-span-2 lg:row-span-2 lg:aspect-auto",
  "aspect-[3/4] lg:col-span-3 lg:row-span-2 lg:aspect-auto",
];

const tileSizes = [
  "(min-width: 1024px) 40vw, 100vw",
  "(min-width: 1024px) 32vw, 50vw",
  "(min-width: 1024px) 24vw, 50vw",
  "(min-width: 1024px) 24vw, 50vw",
  "(min-width: 1024px) 32vw, 50vw",
  "(min-width: 1024px) 24vw, 100vw",
  "(min-width: 1024px) 16vw, 50vw",
  "(min-width: 1024px) 24vw, 50vw",
];

export function Gallery() {
  const photos = site.gallery;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const touchStart = useRef<number | null>(null);
  const [index, setIndex] = useState(0);

  const open = (i: number, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setIndex(i);
    dialogRef.current?.showModal();
    lockPageScroll(true);
  };

  const close = useCallback(() => dialogRef.current?.close(), []);
  const step = useCallback(
    (delta: number) => setIndex((i) => (i + delta + photos.length) % photos.length),
    [photos.length],
  );

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

  const current = photos[index];

  return (
    <section
      id="cortes"
      aria-labelledby="cortes-title"
      className="bg-paper py-24 sm:py-28 lg:py-36"
    >
      <div className="mx-auto max-w-[88rem] px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-7">
            <h2 id="cortes-title" data-reveal className="serif text-[clamp(2.75rem,8vw,4.25rem)]">
              Nossos <em className="text-champagne-deep italic">cortes.</em>
            </h2>
            <span aria-hidden data-reveal="risca" className="risca mt-7" />
          </div>
          <div data-reveal className="flex flex-col gap-5 lg:col-span-5 lg:items-end lg:text-right">
            <p className="max-w-[40ch] text-[1.0625rem] leading-relaxed text-graphite">
              Trabalhos do {site.barberFirstName}, do degradê à navalha. Toque em uma foto para
              ampliar.
            </p>
            <a
              href={site.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="label group inline-flex min-h-11 items-center gap-2.5 text-ink"
            >
              <InstagramIcon size={18} />
              <span className="link-line">Mais no @{site.instagram.handle}</span>
              <ArrowUpRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </div>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-2.5 sm:mt-16 sm:gap-4 lg:auto-rows-[12.5rem] lg:grid-cols-12 xl:auto-rows-[14rem]">
          {photos.map((photo, i) => (
            <li
              key={`${photo.caption}-${i}`}
              data-reveal="photo"
              style={{ "--reveal-delay": `${(i % 4) * 90}ms` } as CSSProperties}
              className={`relative ${layout[i % layout.length]}`}
            >
              <button
                type="button"
                onClick={(event) => open(i, event.currentTarget)}
                aria-label={`Ampliar foto: ${photo.alt}`}
                className="group absolute inset-0 block overflow-hidden text-left"
              >
                <PhotoSlot
                  photo={photo}
                  sizes={tileSizes[i % tileSizes.length]}
                  className="absolute! inset-0"
                  imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
                />
                <span className="pointer-events-none absolute bottom-3 left-3 hidden translate-y-2 bg-ground px-3 py-2 opacity-0 transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 lg:block">
                  <span className="serif text-lg italic">{photo.caption}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="lightbox-caption"
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
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink p-0 text-ground backdrop:bg-ink/80 open:flex open:flex-col"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <p className="tabular text-sm tracking-[0.14em] text-night-muted">
            {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="grid size-11 place-items-center text-ground hover:text-champagne-soft"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-24">
          <PhotoSlot
            key={index}
            photo={current}
            sizes="100vw"
            fit="contain"
            className="animate-step h-full max-h-[80dvh] w-full max-w-4xl bg-transparent!"
          />
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Foto anterior"
            className="absolute left-4 hidden size-12 place-items-center rounded-full border border-night-line text-ground hover:border-ground sm:grid"
          >
            <ChevronLeft size={22} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Próxima foto"
            className="absolute right-4 hidden size-12 place-items-center rounded-full border border-night-line text-ground hover:border-ground sm:grid"
          >
            <ChevronRight size={22} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8">
          <p id="lightbox-caption" className="serif text-[1.75rem] italic">
            {current.caption}
          </p>
          <div className="flex gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Foto anterior"
              className="grid size-11 place-items-center rounded-full border border-night-line"
            >
              <ChevronLeft size={20} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Próxima foto"
              className="grid size-11 place-items-center rounded-full border border-night-line"
            >
              <ChevronRight size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
}

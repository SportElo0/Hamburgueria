"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { site } from "@/config/site";
import { PhotoSlot } from "@/components/photo-slot";
import { InstagramIcon } from "@/components/brand";

function lockPageScroll(lock: boolean) {
  document.body.style.overflow = lock ? "hidden" : "";
}

/** Composição assimétrica: uma foto dominante, as outras em ritmo alternado. */
const layout = [
  "col-span-2 aspect-[4/5] lg:col-span-7 lg:row-span-2 lg:aspect-auto",
  "aspect-[3/4] lg:col-span-5 lg:aspect-[16/11]",
  "aspect-[3/4] lg:col-span-5 lg:aspect-[16/11]",
  "col-span-2 aspect-[16/11] lg:col-span-4 lg:aspect-[4/5]",
  "aspect-[3/4] lg:col-span-4 lg:aspect-[4/5]",
  "aspect-[3/4] lg:col-span-4 lg:aspect-[4/5]",
];

const tileSizes = [
  "(min-width: 1024px) 58vw, 100vw",
  "(min-width: 1024px) 42vw, 50vw",
  "(min-width: 1024px) 42vw, 50vw",
  "(min-width: 1024px) 33vw, 100vw",
  "(min-width: 1024px) 33vw, 50vw",
  "(min-width: 1024px) 33vw, 50vw",
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
      className="bg-fade-1 py-20 sm:py-28 lg:py-36"
    >
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2
            id="cortes-title"
            data-reveal="rise"
            className="display text-[clamp(3rem,11vw,5.5rem)]"
          >
            Nossos cortes
          </h2>
          <a
            data-reveal="rise"
            href={site.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 self-start text-[0.95rem] font-semibold text-paper lg:self-auto lg:pb-3"
          >
            <InstagramIcon size={19} />
            <span className="underline decoration-line-strong underline-offset-[0.3em] transition-colors group-hover:decoration-blue-ink">
              Mais trabalhos em @{site.instagram.handle}
            </span>
            <ArrowUpRight
              size={17}
              className="text-steel transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-2 sm:mt-16 sm:gap-3 lg:grid-cols-12 lg:gap-4">
          {photos.map((photo, i) => (
            <li
              key={`${photo.caption}-${i}`}
              data-reveal="cut"
              style={{ "--reveal-delay": `${(i % 3) * 90}ms` } as CSSProperties}
              className={`relative ${layout[i % layout.length]}`}
            >
              <button
                type="button"
                onClick={(event) => open(i, event.currentTarget)}
                aria-label={`Ampliar: ${photo.alt}`}
                className="group absolute inset-0 block overflow-hidden rounded-[3px] text-left"
              >
                <PhotoSlot
                  photo={photo}
                  sizes={tileSizes[i % tileSizes.length]}
                  label={false}
                  shade={i % 4}
                  className="absolute! inset-0 transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col"
                >
                  <span className="h-3 bg-fade-0/25 sm:h-4" />
                  <span className="h-3 bg-fade-0/50 sm:h-4" />
                  <span className="h-[4.5rem] bg-fade-0/78 sm:h-[5.5rem]" />
                </span>
                <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-4">
                  <span className="min-w-0">
                    <span className="display line-clamp-2 block text-[1.35rem] sm:text-[1.7rem]">
                      {photo.caption}
                    </span>
                    {!photo.src && (
                      <span className="guard mt-1 block text-[0.6rem] text-steel">
                        FOTO TEMPORÁRIA
                      </span>
                    )}
                  </span>
                  <span className="grid size-9 flex-none place-items-center rounded-[3px] border border-line-strong bg-fade-0/70 text-paper opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100">
                    <Maximize2 size={15} />
                  </span>
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
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-fade-0 p-0 text-paper backdrop:bg-fade-0/80 open:flex open:flex-col"
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="guard tabular text-steel">
            {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="grid size-11 place-items-center rounded-[3px] border border-line-strong hover:bg-fade-3"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20">
          <PhotoSlot
            key={index}
            photo={current}
            sizes="100vw"
            fit="contain"
            className="animate-rise h-full max-h-[78dvh] w-full max-w-5xl rounded-[3px]"
          />
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Foto anterior"
            className="absolute left-2 hidden size-12 place-items-center rounded-[3px] border border-line-strong bg-fade-0/70 hover:bg-fade-3 sm:left-4 sm:grid"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Próxima foto"
            className="absolute right-2 hidden size-12 place-items-center rounded-[3px] border border-line-strong bg-fade-0/70 hover:bg-fade-3 sm:right-4 sm:grid"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <p id="lightbox-caption" className="display text-[1.6rem] sm:text-[2rem]">
            {current.caption}
          </p>
          <div className="flex gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Foto anterior"
              className="grid size-11 place-items-center rounded-[3px] border border-line-strong"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Próxima foto"
              className="grid size-11 place-items-center rounded-[3px] border border-line-strong"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
}

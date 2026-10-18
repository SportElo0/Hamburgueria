"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Photo, Vehicle } from "@/content/types";
import { ChevronLeft, ChevronRight, Close } from "./icons";
import { AwaitingPlate } from "./vehicle-bits";

/**
 * Gallery: real photographs first, illustrations last and labelled. Arrow keys, swipe and buttons
 * all navigate; the full-screen view is a native <dialog> (focus trap + Esc for free).
 */
export function VehicleGallery({ vehicle }: { vehicle: Vehicle }) {
  const photos = [...vehicle.photos].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "real" ? -1 : 1));
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touch = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => {
      if (!photos.length) return;
      setDir(delta);
      setI((v) => (v + delta + photos.length) % photos.length);
    },
    [photos.length],
  );

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    d.addEventListener("keydown", onKey);
    return () => d.removeEventListener("keydown", onKey);
  }, [go]);

  if (!photos.length) return <AwaitingPlate vehicle={vehicle} className="aspect-[16/10] w-full" />;
  const p = photos[i];

  const stage = (photo: Photo, sizes: string, fit: "cover" | "contain") => (
    <AnimatePresence initial={false} custom={dir} mode="popLayout">
      <motion.div
        key={photo.src}
        custom={dir}
        className="absolute inset-0"
        initial={{ opacity: 0, x: `${dir * 6}%` }}
        animate={{ opacity: 1, x: "0%" }}
        exit={{ opacity: 0, x: `${dir * -6}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} priority={i === 0} className={fit === "cover" ? "object-cover" : "object-contain"} />
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div>
      <div
        className="group relative aspect-[16/10] overflow-hidden bg-graphite"
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        role="region"
        aria-roledescription="galeria"
        aria-label={`Fotografias do ${vehicle.model}`}
        tabIndex={0}
      >
        {stage(p, "(min-width: 64rem) 66vw, 100vw", "cover")}
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="absolute inset-0 cursor-zoom-in"
          aria-label="Ampliar fotografia"
        />
        {photos.length > 1 && (
          <div className="absolute right-3 bottom-3 flex gap-2">
            <button type="button" onClick={() => go(-1)} className="grid size-11 place-items-center rounded-full bg-night/70 text-ivory backdrop-blur-sm hover:bg-night" aria-label="Fotografia anterior">
              <ChevronLeft />
            </button>
            <button type="button" onClick={() => go(1)} className="grid size-11 place-items-center rounded-full bg-night/70 text-ivory backdrop-blur-sm hover:bg-night" aria-label="Próxima fotografia">
              <ChevronRight />
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-6">
        <p className="caption text-silver" aria-live="polite">
          <span className="prov" data-kind={p.kind}>
            {p.caption ?? (p.kind === "real" ? "Fotografia real" : "Ilustração conceitual")}
          </span>
        </p>
        <p className="caption tabular flex-none text-mist">
          {i + 1} / {photos.length}
        </p>
      </div>

      {photos.length > 1 && (
        <ul className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Miniaturas">
          {photos.map((ph, idx) => (
            <li key={ph.src} className="flex-none">
              <button
                type="button"
                onClick={() => {
                  setDir(idx > i ? 1 : -1);
                  setI(idx);
                }}
                aria-current={idx === i}
                aria-label={`Ver fotografia ${idx + 1}: ${ph.alt}`}
                className={`group/thumb relative block h-16 w-24 overflow-hidden ${idx === i ? "outline outline-1 outline-offset-2 outline-ivory" : ""}`}
              >
                <Image src={ph.src} alt="" fill sizes="96px" className={`object-cover transition-opacity ${idx === i ? "opacity-100" : "opacity-55 group-hover/thumb:opacity-90"}`} />
                {ph.kind === "concept" && <span className="absolute inset-x-0 bottom-0 bg-night/85 px-1.5 text-[0.75rem] leading-5 text-ivory">Ilustração</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-night p-0 text-ivory backdrop:bg-night/90"
        aria-label={`Fotografia ampliada: ${p.alt}`}
        onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
      >
        <div className="relative h-full w-full">
          <div className="absolute inset-x-0 top-0 bottom-20">{stage(p, "100vw", "contain")}</div>
          <div className="absolute inset-x-0 bottom-0 flex h-20 items-center justify-between gap-4 px-[var(--gutter)]">
            <p className="caption text-silver">
              <span className="prov" data-kind={p.kind}>{p.caption}</span>
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => go(-1)} className="grid size-11 place-items-center rounded-full border border-ivory/30" aria-label="Fotografia anterior"><ChevronLeft /></button>
              <button type="button" onClick={() => go(1)} className="grid size-11 place-items-center rounded-full border border-ivory/30" aria-label="Próxima fotografia"><ChevronRight /></button>
              <button type="button" onClick={() => dialogRef.current?.close()} className="grid size-11 place-items-center rounded-full border border-ivory/30" aria-label="Fechar"><Close /></button>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export interface LightboxPhoto {
  src: string;
  alt: string;
}

export function Lightbox({ photos, index, onClose, onIndexChange }: { photos: LightboxPhoto[]; index: number; onClose: () => void; onIndexChange: (i: number) => void }) {
  const touch = useRef<number | null>(null);
  const total = photos.length;
  const go = (delta: number) => onIndexChange(((index + delta) % total + total) % total);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const photo = photos[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/97 p-4"
      onClick={onClose}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <button type="button" onClick={onClose} aria-label="Fechar" className="absolute top-5 right-5 z-10 grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-paper/30 text-paper hover:border-paper">
        ✕
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          go(-1);
        }}
        aria-label="Foto anterior"
        className="absolute left-3 z-10 grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-paper/30 text-paper hover:border-paper sm:left-6"
      >
        ←
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          go(1);
        }}
        aria-label="Próxima foto"
        className="absolute right-3 z-10 grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-paper/30 text-paper hover:border-paper sm:right-6"
      >
        →
      </button>
      <div className="relative h-[80vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <Image src={photo.src} alt={photo.alt} fill sizes="90vw" className="object-contain" />
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";
import { Lightbox } from "./Lightbox";
import { Reveal } from "./Reveal";

const PHOTOS = [
  { src: "/images/quarto-amarelo-graded.jpg", alt: "Quarto da Pousada Villa Verano com varanda", span: "sm:row-span-2" },
  { src: "/images/piscina-graded.jpg", alt: "Piscina ao ar livre da Pousada Villa Verano", span: "" },
  { src: "/images/hero-fachada-graded.jpg", alt: "Fachada da Pousada Villa Verano ao entardecer", span: "" },
  { src: "/images/quarto-verde-graded.jpg", alt: "Quarto da Pousada Villa Verano com jardim", span: "" },
];

export function Gallery() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-ink-raised py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <Reveal>
          <p className="eyebrow text-accent">Galeria</p>
          <h2 className="font-display mt-4 max-w-xl text-4xl leading-tight text-paper sm:text-5xl">Um pouco da Villa Verano</h2>
        </Reveal>
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-rows-2 lg:grid-cols-4">
          {PHOTOS.map((photo, i) => (
            <Reveal key={photo.src} delay={i * 0.06} className={`relative aspect-square overflow-hidden ${photo.span}`}>
              <button type="button" onClick={() => setOpenIndex(i)} aria-label={`Ampliar: ${photo.alt}`} className="block h-full w-full cursor-pointer">
                <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 23vw, 45vw" className="object-cover transition-transform duration-700 hover:scale-105" />
              </button>
            </Reveal>
          ))}
        </div>
      </div>
      {openIndex !== null && <Lightbox photos={PHOTOS} index={openIndex} onClose={() => setOpenIndex(null)} onIndexChange={setOpenIndex} />}
    </section>
  );
}

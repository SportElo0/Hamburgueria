import Image from "next/image";
import { Reveal } from "./Reveal";

const PHOTOS = [
  { src: "/images/quarto-amarelo.jpg", alt: "Quarto da Pousada Villa Verano com varanda", span: "sm:row-span-2" },
  { src: "/images/piscina.jpg", alt: "Piscina ao ar livre da Pousada Villa Verano", span: "" },
  { src: "/images/hero-fachada.jpg", alt: "Fachada da Pousada Villa Verano ao entardecer", span: "" },
  { src: "/images/quarto-verde.jpg", alt: "Quarto da Pousada Villa Verano com jardim", span: "" },
];

export function Gallery() {
  return (
    <section className="bg-paper-deep py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <Reveal>
          <p className="eyebrow text-terracotta">Galeria</p>
          <h2 className="font-display mt-4 max-w-xl text-4xl leading-tight text-ink sm:text-5xl">Um pouco da Villa Verano</h2>
        </Reveal>
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-rows-2 lg:grid-cols-4">
          {PHOTOS.map((photo, i) => (
            <Reveal key={photo.src} delay={i * 0.06} className={`relative aspect-square overflow-hidden rounded-sm ${photo.span}`}>
              <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 23vw, 45vw" className="object-cover transition-transform duration-700 hover:scale-105" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

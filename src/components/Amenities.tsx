import Image from "next/image";
import { AMENITIES } from "@/lib/site";
import { Reveal } from "./Reveal";

export function Amenities() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
        <Reveal className="relative order-2 aspect-[4/5] overflow-hidden rounded-sm lg:order-1">
          <Image src="/images/hero-fachada.jpg" alt="Fachada da Pousada Villa Verano ao entardecer" fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
        </Reveal>
        <Reveal delay={0.1} className="order-1 lg:order-2">
          <p className="eyebrow text-terracotta">Comodidades</p>
          <h2 className="font-display mt-4 text-4xl leading-tight text-ink sm:text-5xl">Tudo pensado para desacelerar</h2>
          <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-4 text-[15px] text-ink-soft sm:grid-cols-2">
            {AMENITIES.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-terracotta" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

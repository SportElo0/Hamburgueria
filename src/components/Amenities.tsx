import Image from "next/image";
import { AMENITIES } from "@/lib/site";
import { AmenityIconGlyph } from "./icons";
import { Reveal } from "./Reveal";

export function Amenities() {
  return (
    <section id="comodidades" className="mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
        <Reveal className="relative order-2 aspect-[4/5] overflow-hidden lg:order-1">
          <Image src="/images/hero-fachada-graded.jpg" alt="Fachada da Pousada Villa Verano ao entardecer" fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
        </Reveal>
        <Reveal delay={0.1} className="order-1 lg:order-2">
          <p className="eyebrow text-accent">Comodidades</p>
          <h2 className="font-display mt-4 text-4xl leading-tight text-paper sm:text-5xl">Tudo pensado para desacelerar</h2>
          <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-5 text-[15px] text-paper-mute sm:grid-cols-2">
            {AMENITIES.map((item) => (
              <li key={item.label} className="flex items-center gap-3">
                <span className="text-accent">
                  <AmenityIconGlyph icon={item.icon} />
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

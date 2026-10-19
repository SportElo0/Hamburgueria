import Image from "next/image";
import { SITE } from "@/lib/site";
import { Reveal } from "./Reveal";

export function Intro() {
  return (
    <section id="pousada" className="mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
        <Reveal>
          <p className="eyebrow text-terracotta">A pousada</p>
          <p className="font-display mt-5 text-3xl leading-tight text-ink sm:text-4xl">
            Chegamos pensando em passeios. Pela manhã, só queríamos ficar na piscina.
          </p>
          <p className="mt-7 max-w-md text-[15px] leading-relaxed text-ink-soft">
            No bairro do Caborê, a cinco minutos de carro do Centro Histórico e perto da Praia do Jabaquara,
            a Villa Verano é aquele tipo de pousada que vira o motivo da viagem. Quartos coloridos com
            varanda, jardim, piscina ao ar livre e café da manhã servido no terraço — tudo pensado para
            desacelerar.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <span className="font-display text-2xl text-ink">{SITE.rating.score}</span>
            <span className="text-sm text-ink-mute">
              ★★★★★ · {SITE.rating.count} avaliações no Google
              <br />
              Hotel {SITE.stars} estrelas
            </span>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="relative aspect-[4/5] overflow-hidden rounded-sm">
          <Image src="/images/piscina.jpg" alt="Piscina da Pousada Villa Verano, cercada por jardim" fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
        </Reveal>
      </div>
    </section>
  );
}

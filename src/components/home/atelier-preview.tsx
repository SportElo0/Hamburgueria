import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "../icons";
import { Reveal } from "../reveal";

export function AtelierPreview() {
  return (
    <section aria-labelledby="atelier-title" className="relative z-10 bg-night py-24 lg:py-36">
      <div className="wrap grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
        <Reveal className="lg:col-span-6">
          <figure>
            <div className="relative aspect-[5/4] overflow-hidden bg-graphite">
              <Image
                src="/media/charuto/real-hand.webp"
                alt="Mão apontando para a grade cromada e o para-lama do W111"
                fill
                sizes="(min-width: 64rem) 48vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="caption mt-3 text-mist">
              <span className="prov" data-kind="real">Fotografia real · o Charuto em avaliação</span>
            </figcaption>
          </figure>
        </Reveal>
        <Reveal delay={0.08} className="lg:col-span-5 lg:col-start-8">
          <h2 id="atelier-title" className="h-section">Por trás de cada clássico, existe um trabalho.</h2>
          <p className="lede mt-6 max-w-[36ch] text-silver">
            Olhar de perto, entender a história do carro e decidir com cuidado o que ele precisa.
          </p>
          <Link href="/atelier" className="btn btn-quiet mt-10">
            Conhecer o atelier <ArrowRight className="arrow" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

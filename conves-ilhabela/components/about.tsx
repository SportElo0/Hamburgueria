import { ArrowUpRight } from "lucide-react";
import { site } from "@/config/site";
import { Hull } from "@/components/brand";

const traits = ["Mesas ao ar livre", "Varanda coberta de madeira", "Vista para o canal", "Espaço para eventos"];

export function About() {
  return (
    <section id="o-conves" aria-labelledby="o-conves-title" className="relative overflow-hidden bg-sand">
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-10 px-5 pt-16 pb-10 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:pt-28">
        <h2
          id="o-conves-title"
          data-reveal
          className="serif text-[clamp(2.3rem,4.6vw,4rem)] text-deep lg:col-span-6"
        >
          Entre as árvores e a água.
        </h2>
        <div className="lg:col-span-5 lg:col-start-8">
          <p data-reveal className="text-[1.125rem] leading-relaxed text-ink/85">
            O Convés fica no Perequê, em Ilhabela, num espaço aberto de frente para o canal: mesas
            ao ar livre na sombra das árvores, uma varanda coberta de madeira e o gramado na beira
            da água.
          </p>
          <ul className="mt-8 border-t border-line">
            {traits.map((trait) => (
              <li
                key={trait}
                data-reveal
                className="flex items-center gap-4 border-b border-line py-3.5 text-[1rem] text-deep"
              >
                <Hull size={16} className="flex-none text-champagne" />
                {trait}
              </li>
            ))}
          </ul>
          <a
            href={site.links.reviews}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold text-deep"
          >
            <span className="link-line">Ver avaliações no Google</span>
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>

      {/* A esteira: linha que o barco deixa na água, desenhada pelo scroll. */}
      <div aria-hidden className="relative mx-auto h-24 max-w-[90rem] px-5 sm:px-8 lg:h-32 lg:px-12">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="h-full w-full text-champagne"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        >
          <path
            data-wake
            d="M0 70 C 80 40, 140 100, 220 70 S 360 40, 440 70 S 580 100, 660 70 S 800 40, 880 70 S 1020 100, 1100 70 L 1160 70"
            vectorEffect="non-scaling-stroke"
          />
          <path
            data-wake
            d="M40 96 C 120 76, 180 112, 260 96 S 400 76, 480 96 S 620 112, 700 96 S 840 80, 920 96"
            vectorEffect="non-scaling-stroke"
            className="text-champagne-soft"
            stroke="currentColor"
          />
        </svg>
        <Hull data-wake-boat size={34} className="absolute top-1/2 right-5 -translate-y-[70%] text-deep sm:right-8 lg:right-12" />
      </div>
    </section>
  );
}

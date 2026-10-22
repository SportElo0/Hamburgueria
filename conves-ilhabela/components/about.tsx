import { ArrowUpRight } from "lucide-react";
import { site } from "@/config/site";
import { Hull } from "@/components/brand";
import { Wake } from "@/components/wake";

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

      <Wake />
    </section>
  );
}

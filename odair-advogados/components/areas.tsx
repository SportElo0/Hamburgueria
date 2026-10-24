import { ViewTransition } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { areas } from "@/data/areas";
import { Carousel } from "@/components/carousel";
import { Rosette } from "@/components/rosette";

export function Areas() {
  return (
    <section id="areas" aria-labelledby="areas-title" className="bg-navy pb-20 text-ivory lg:pb-28">
      <div className="mx-auto max-w-[90rem]">
        <div className="grid grid-cols-1 gap-6 px-5 pt-20 sm:px-8 lg:grid-cols-12 lg:items-end lg:px-12 lg:pt-28">
          <h2 id="areas-title" data-reveal className="display text-[clamp(2.3rem,4.6vw,4.2rem)] lg:col-span-6">
            Áreas de <span className="text-gold">atuação</span>
          </h2>
          <p data-reveal className="max-w-[44ch] text-[1.0625rem] leading-relaxed text-on-navy-muted lg:col-span-5 lg:col-start-8">
            Cinco áreas do Direito, cada uma com uma página própria: assuntos abordados, informações gerais e dúvidas
            frequentes.
          </p>
        </div>

        <div className="mt-10 lg:mt-14">
          <Carousel label="Áreas de atuação">
            {areas.map((area, i) => {
              const dark = i % 2 === 1;
              return (
                <li key={area.slug} className="w-[min(84vw,22.5rem)] flex-none snap-start lg:w-[23.5rem]">
                  <article
                    className={`group relative flex h-full flex-col rounded-[4px] border p-6 transition-colors duration-500 lg:p-7 ${
                      dark
                        ? "border-blue-line bg-blue text-ivory hover:border-gold/70"
                        : "border-paper bg-paper text-navy hover:border-gold"
                    }`}
                  >
                    <h3 className="min-h-[2lh] text-[1.375rem] leading-tight font-semibold tracking-[-0.01em]">{area.name}</h3>

                    <ViewTransition name={`rosette-${area.slug}`}>
                      <div className={`my-7 flex justify-center ${dark ? "text-gold/85" : "text-gold-ink/80"}`}>
                        <Rosette
                          spec={area.rosette}
                          steps={540}
                          inner={0.3}
                          strokeWidth={0.6}
                          className="w-[9.5rem] transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:rotate-[10deg]"
                        />
                      </div>
                    </ViewTransition>

                    <p className={`text-[0.9375rem] leading-relaxed ${dark ? "text-on-navy-muted" : "text-muted"}`}>
                      {area.summary}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-7">
                      <Link
                        href={`/areas/${area.slug}`}
                        className={`label after:absolute after:inset-0 after:content-[''] ${dark ? "text-ivory" : "text-navy"}`}
                      >
                        Saiba mais
                        <span className="sr-only">: {area.name}</span>
                      </Link>
                      <span
                        aria-hidden
                        className={`grid size-11 place-items-center rounded-full border transition-colors duration-500 ${
                          dark
                            ? "border-blue-line text-gold group-hover:border-gold group-hover:bg-gold group-hover:text-navy"
                            : "border-line-strong text-gold-ink group-hover:border-navy group-hover:bg-navy group-hover:text-gold"
                        }`}
                      >
                        <ArrowUpRight size={18} strokeWidth={1.5} />
                      </span>
                    </div>
                  </article>
                </li>
              );
            })}
          </Carousel>
        </div>
      </div>
    </section>
  );
}

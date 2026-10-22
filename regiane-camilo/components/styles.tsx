"use client";

import { ArrowUpRight } from "lucide-react";
import { products, styles } from "@/config/site";
import { showStyle } from "@/lib/gallery-store";
import { Photo } from "@/components/photo";

export function Styles() {
  return (
    <section id="bolos" aria-labelledby="bolos-title" className="bg-blush">
      <div className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div data-reveal>
            <h2
              id="bolos-title"
              className="serif max-w-[18ch] text-[clamp(2.25rem,4.4vw,3.6rem)] text-ink"
            >
              Encontre o bolo perfeito para cada ocasião.
            </h2>
            <p className="mt-4 max-w-[48ch] text-[1.0625rem] leading-relaxed text-ink/80">
              Conheça alguns dos estilos e criações da Regiane. Toque em um estilo para ver os
              bolos na galeria.
            </p>
          </div>
          <button
            type="button"
            onClick={() => showStyle(null)}
            className="inline-flex min-h-11 items-center gap-2 self-start text-[0.9375rem] font-semibold text-cocoa lg:self-auto"
          >
            <span className="link-line">Ver todas as criações</span>
            <ArrowUpRight size={16} />
          </button>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:mt-14 lg:grid-cols-6 lg:gap-5">
          {styles.map((style, i) => {
            const count = products.filter((p) => p.style === style.id).length;
            return (
              <li
                key={style.id}
                data-reveal
                style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
              >
                <button
                  type="button"
                  onClick={() => showStyle(style.id)}
                  aria-label={`${style.name}: ver ${count} ${count === 1 ? "bolo" : "bolos"} na galeria`}
                  className="group flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-paper text-left shadow-[0_14px_30px_-26px_rgb(75_38_22/0.6)] transition-[transform,box-shadow] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[0_24px_40px_-26px_rgb(75_38_22/0.7)]"
                >
                  <Photo
                    photo={style.cover}
                    crop="detail"
                    sizes="(min-width: 1024px) 15vw, (min-width: 640px) 31vw, 48vw"
                    className="aspect-square w-full"
                    imgClassName="transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
                  />
                  <span className="flex flex-1 items-end justify-between gap-3 px-4 pt-4 pb-4">
                    <span>
                      <span className="serif block text-[1.2rem] leading-tight text-ink">
                        {style.name}
                      </span>
                      <span className="mt-1 block text-[0.8125rem] leading-snug text-muted">
                        {style.hint}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="grid size-8 flex-none place-items-center rounded-full border border-line-strong text-cocoa transition-colors duration-300 group-hover:border-cocoa group-hover:bg-cocoa group-hover:text-cream"
                    >
                      <ArrowUpRight size={15} />
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

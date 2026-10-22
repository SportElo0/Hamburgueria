import { ArrowDown } from "lucide-react";
import { categories, highlightIds, menu } from "@/data/menu";
import { Hull } from "@/components/brand";

function portionText(prices: { single?: number; double?: number; individual?: number }) {
  if (prices.single !== undefined && prices.double !== undefined) return "Para 1 ou 2 pessoas";
  if (prices.double !== undefined) return "Para 2 pessoas";
  if (prices.individual !== undefined) return "Individual";
  return null;
}

export function Highlights() {
  const items = highlightIds
    .map((id) => menu.find((item) => item.id === id))
    .filter((item) => item !== undefined);

  return (
    <div data-track-section className="overflow-hidden bg-deep text-sand">
      <div data-track-pin className="flex flex-col justify-center py-20 lg:min-h-[calc(100svh-4.75rem)] lg:py-14">
        <div className="mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 id="cardapio-title" className="serif max-w-[16ch] text-[clamp(2.3rem,4.6vw,4rem)]">
              Sabores que merecem ser apreciados.
            </h2>
            <p className="max-w-[40ch] text-[1rem] leading-relaxed text-on-deep-muted">
              Quatro pratos do cardápio da casa, do bolinho de peixe local à moqueca. A lista completa vem logo abaixo.
            </p>
          </div>
        </div>

        {/* Trilho: no desktop anda com o scroll; no celular, desliza com o dedo. */}
        <div
          data-track-viewport
          className="mt-12 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] lg:overflow-visible"
        >
          <ul data-track className="flex w-max gap-4 px-5 pb-2 sm:gap-6 sm:px-8 lg:px-12">
            {items.map((item) => {
              const category = categories.find((c) => c.id === item.category)?.name;
              const portion = portionText(item.prices);
              return (
                <li
                  key={item.id}
                  className="relative flex min-h-[27rem] w-[82vw] max-w-[26rem] snap-start flex-col overflow-hidden rounded-[3px] bg-sand px-7 pt-8 pb-7 text-ink sm:w-[24rem] lg:min-h-[30rem] lg:w-[27rem] lg:px-9 lg:pt-10"
                >
                  {/* Marca-d'água do casco, como no cardápio impresso. */}
                  <Hull
                    size={220}
                    strokeWidth={0.6}
                    className="pointer-events-none absolute -right-14 -bottom-12 text-champagne/25"
                  />
                  <h3 className="serif relative text-[2.1rem] leading-[1.05] text-deep">{item.name}</h3>
                  <p className="relative mt-3 flex items-center gap-3 text-[0.875rem] text-champagne-deep">
                    <span aria-hidden className="h-px w-6 bg-champagne" />
                    {category}
                  </p>
                  <p className="relative mt-4 text-[1rem] leading-relaxed text-ink/85">{item.description}</p>
                  {item.sides && (
                    <p className="relative mt-3 text-[0.9375rem] leading-relaxed text-muted">{item.sides}</p>
                  )}
                  <div className="relative mt-auto flex items-center justify-between gap-4 border-t border-line pt-5 text-[0.875rem]">
                    <span className="text-muted">{portion ?? "Porção"}</span>
                    <a href={`#prato-${item.id}`} className="font-semibold text-deep">
                      <span className="link-line">Ver no cardápio</span>
                    </a>
                  </div>
                </li>
              );
            })}
            <li className="flex w-[70vw] max-w-[20rem] snap-start flex-col justify-end border-l border-deep-line pl-7 sm:w-[18rem] lg:w-[20rem]">
              <p className="serif text-[1.8rem] leading-tight">Moquecas, camarões, carnes e porções.</p>
              <a href="#cardapio-completo" className="btn btn-gold mt-7 self-start">
                Cardápio completo
                <ArrowDown size={16} />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

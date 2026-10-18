"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { commercialLabel, workStageLabel } from "@/content/site";
import type { Vehicle } from "@/content/types";
import { ArrowRight } from "./icons";
import { VehiclePlate } from "./vehicle-bits";

type Filter = { decade: number | "all"; body: string | "all"; color: string | "all" };

/** Module spans give the collection a brochure rhythm instead of a uniform dealer grid. */
const spans = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-4", "lg:col-span-4", "lg:col-span-4", "lg:col-span-5", "lg:col-span-7"];
const aspects = ["aspect-[4/3]", "aspect-[16/10] sm:aspect-[4/5]", "aspect-[16/10] sm:aspect-[4/5]", "aspect-[16/10] sm:aspect-[4/5]", "aspect-[16/10] sm:aspect-[4/5]", "aspect-[16/10] sm:aspect-[4/5]", "aspect-[4/3]"];

export function CollectionBrowser({ vehicles }: { vehicles: Vehicle[] }) {
  const [filter, setFilter] = useState<Filter>({ decade: "all", body: "all", color: "all" });
  const [view, setView] = useState<"colecao" | "indice">("colecao");

  const decades = useMemo(() => [...new Set(vehicles.map((v) => v.decade))].sort(), [vehicles]);
  const bodies = useMemo(() => [...new Set(vehicles.map((v) => v.body))], [vehicles]);
  const colors = useMemo(() => [...new Map(vehicles.map((v) => [v.color.name, v.color])).values()], [vehicles]);
  const shown = vehicles.filter(
    (v) =>
      (filter.decade === "all" || v.decade === filter.decade) &&
      (filter.body === "all" || v.body === filter.body) &&
      (filter.color === "all" || v.color.name === filter.color),
  );

  return (
    <div>
      <div className="flex flex-col gap-6 border-y border-[var(--line-dark)] py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="caption mr-2 float-left py-3 text-mist">Década</legend>
            <FilterChip on={filter.decade === "all"} onClick={() => setFilter((f) => ({ ...f, decade: "all" }))}>Todas</FilterChip>
            {decades.map((d) => (
              <FilterChip key={d} on={filter.decade === d} onClick={() => setFilter((f) => ({ ...f, decade: d }))}>
                Anos {String(d).slice(2)}
              </FilterChip>
            ))}
          </fieldset>
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="caption mr-2 float-left py-3 text-mist">Carroceria</legend>
            <FilterChip on={filter.body === "all"} onClick={() => setFilter((f) => ({ ...f, body: "all" }))}>Todas</FilterChip>
            {bodies.map((b) => (
              <FilterChip key={b} on={filter.body === b} onClick={() => setFilter((f) => ({ ...f, body: b }))}>{b}</FilterChip>
            ))}
          </fieldset>
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="caption mr-2 float-left py-3 text-mist">Cor</legend>
            <FilterChip on={filter.color === "all"} onClick={() => setFilter((f) => ({ ...f, color: "all" }))}>Todas</FilterChip>
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                className="chip"
                aria-pressed={filter.color === c.name}
                onClick={() => setFilter((f) => ({ ...f, color: c.name }))}
              >
                <span aria-hidden className="chip-swatch" style={{ background: c.hex }} />
                {c.name}
              </button>
            ))}
          </fieldset>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Modo de visualização">
          <FilterChip on={view === "colecao"} onClick={() => setView("colecao")}>Coleção</FilterChip>
          <FilterChip on={view === "indice"} onClick={() => setView("indice")}>Índice</FilterChip>
        </div>
      </div>

      <p className="caption mt-5 text-mist" role="status" aria-live="polite">
        {shown.length === vehicles.length ? `${vehicles.length} automóveis` : `${shown.length} de ${vehicles.length} automóveis`}
      </p>

      {shown.length === 0 && (
        <div className="py-24 text-center">
          <p className="font-display text-[2rem]">Nenhum carro com estes filtros.</p>
          <button type="button" className="btn btn-quiet mt-6" onClick={() => setFilter({ decade: "all", body: "all", color: "all" })}>
            Limpar filtros
          </button>
        </div>
      )}

      <LayoutGroup>
        {view === "colecao" ? (
          <motion.ul layout className="mt-8 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-12">
            <AnimatePresence mode="popLayout">
              {shown.map((v, i) => (
                <motion.li
                  key={v.slug}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className={`${spans[i % spans.length]} ${i === 0 && shown.length > 1 ? "sm:col-span-2" : ""}`}
                >
                  <Link href={`/acervo/${v.slug}`} className="group block">
                    <div className="overflow-hidden">
                      <VehiclePlate
                        vehicle={v}
                        sizes="(min-width: 64rem) 50vw, (min-width: 40rem) 50vw, 100vw"
                        className={`${aspects[i % aspects.length]} w-full transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.025]`}
                      />
                    </div>
                    <div className="mt-5 flex items-start justify-between gap-6">
                      <div>
                        <h2 className="font-display text-[clamp(1.75rem,2.6vw,2.5rem)] leading-none">
                          {v.model} <span className="text-silver">{v.chassis}</span>
                        </h2>
                        <p className="caption mt-2 text-mist">
                          {v.nickname && <>“{v.nickname}” · </>}
                          {v.color.name} · <span className="tabular">{v.yearLabel}</span>
                        </p>
                      </div>
                      <ArrowRight size={22} className="mt-1 flex-none text-silver transition-transform duration-500 group-hover:translate-x-1 group-hover:text-ivory" />
                    </div>
                    <dl className="caption mt-4 grid grid-cols-2 gap-4 border-t border-[var(--line-dark)] pt-3 text-silver">
                      <div>
                        <dt className="text-mist">Trabalho</dt>
                        <dd>{workStageLabel[v.workStage]}</dd>
                      </div>
                      <div>
                        <dt className="text-mist">Situação</dt>
                        <dd>{commercialLabel[v.commercialStatus]}</dd>
                      </div>
                    </dl>
                  </Link>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        ) : (
          <motion.ol layout className="mt-8">
            {shown.map((v) => (
              <motion.li layout key={v.slug} className="border-t border-[var(--line-dark)] last:border-b">
                <Link href={`/acervo/${v.slug}`} className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-2 py-5 md:grid-cols-[auto_2fr_1fr_1.3fr_1.3fr_auto]">
                  <span aria-hidden className="h-9 w-12 rounded-[2px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]" style={{ background: v.color.hex }} />
                  <span className="font-display text-[clamp(1.5rem,2.2vw,2rem)] leading-tight">
                    {v.model} <span className="text-silver">{v.chassis}</span>
                  </span>
                  <span className="caption tabular hidden text-silver md:block">{v.yearLabel}</span>
                  <span className="caption hidden text-silver md:block">{workStageLabel[v.workStage]}</span>
                  <span className="caption hidden text-silver md:block">{commercialLabel[v.commercialStatus]}</span>
                  <ArrowRight className="text-silver transition-transform group-hover:translate-x-1 group-hover:text-ivory" />
                </Link>
              </motion.li>
            ))}
          </motion.ol>
        )}
      </LayoutGroup>
    </div>
  );
}

function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="chip !px-3.5" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

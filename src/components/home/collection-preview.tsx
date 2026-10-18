"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { workStageLabel } from "@/content/site";
import type { Vehicle } from "@/content/types";
import { ArrowRight } from "../icons";
import { VehiclePlate } from "../vehicle-bits";

/**
 * The collection as a brochure index: rows of sample chips and model names. Hovering or focusing a
 * row brings that car onto the featured plate.
 */
export function CollectionPreview({ vehicles }: { vehicles: Vehicle[] }) {
  const [current, setCurrent] = useState(vehicles[0]?.slug);
  const featured = vehicles.find((v) => v.slug === current) ?? vehicles[0];
  if (!featured) return null;

  return (
    <section aria-labelledby="acervo-title" className="relative z-10 bg-graphite py-24 lg:py-32">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <h2 id="acervo-title" className="h-page">O acervo.</h2>
            <p className="lede mt-5 max-w-[36ch] text-silver">
              Nove Mercedes-Benz, cada um no seu momento — do cupê dos anos 60 aos roadsters dos anos 90.
            </p>
          </div>
          <Link href="/acervo" className="btn btn-quiet">
            Ver o acervo completo <ArrowRight className="arrow" />
          </Link>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="relative hidden lg:col-span-6 lg:block">
            <div className="sticky top-[calc(var(--nav-h)+2rem)] aspect-[4/5] max-h-[78svh] w-full">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={featured.slug}
                  className="absolute inset-0"
                  initial={{ opacity: 0, clipPath: "inset(0% 0% 0% 100%)" }}
                  animate={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                >
                  <VehiclePlate vehicle={featured} sizes="(min-width: 64rem) 45vw, 100vw" className="h-full w-full" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <ol className="lg:col-span-6">
            {vehicles.map((v) => {
              const active = v.slug === featured.slug;
              return (
                <li key={v.slug} className="border-t border-[var(--line-dark)] last:border-b">
                  <Link
                    href={`/acervo/${v.slug}`}
                    onMouseEnter={() => setCurrent(v.slug)}
                    onFocus={() => setCurrent(v.slug)}
                    className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-1 py-5 sm:grid-cols-[auto_1fr_auto_auto]"
                  >
                    <span
                      aria-hidden
                      className="h-9 w-12 rounded-[2px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] transition-transform duration-500 group-hover:scale-105"
                      style={{ background: v.color.hex }}
                    />
                    <span>
                      <span className={`block font-display text-[clamp(1.5rem,2.4vw,2.125rem)] leading-tight transition-colors ${active ? "text-ivory" : "text-ivory/75"} group-hover:text-ivory`}>
                        {v.model} <span className="text-silver">{v.chassis}</span>
                      </span>
                      <span className="caption block text-mist">
                        {v.nickname ? `“${v.nickname}” · ` : ""}
                        {v.color.name} · <span className="tabular">{v.yearLabel}</span>
                      </span>
                    </span>
                    <span className="caption hidden text-silver sm:block">{workStageLabel[v.workStage]}</span>
                    <ArrowRight className="text-silver transition-transform duration-500 group-hover:translate-x-1 group-hover:text-ivory" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

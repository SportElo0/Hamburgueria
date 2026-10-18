"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { paintOptions, roofOptions } from "@/content/vision-options";
import { ArrowRight } from "../icons";

const paints = paintOptions.filter((o) => o.hex).slice(0, 6);
const roofs = roofOptions.filter((o) => o.hex);

/**
 * "Saia e blusa": pick a body colour and a roof colour on the sample chart, then carry the
 * combination into Vision. The swatch block is an abstract colour proposal, never a fake render.
 */
export function VisionTeaser() {
  const [paint, setPaint] = useState(paints[0].id);
  const [roof, setRoof] = useState(roofs[0].id);
  const p = paints.find((o) => o.id === paint)!;
  const r = roofs.find((o) => o.id === roof)!;

  return (
    <section aria-labelledby="vision-title" className="relative z-10 overflow-hidden bg-navy py-24 lg:py-32">
      <div className="wrap grid gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <h2 id="vision-title" className="h-page">
            Mercantil <span className="text-silver">Vision</span>
          </h2>
          <p className="h-sub mt-6 max-w-[22ch] font-display text-ivory/90">Imagine o próximo capítulo do seu clássico.</p>
          <p className="mt-6 max-w-[42ch] text-silver">
            Envie uma foto do seu carro e escolha cores, teto, rodas e estilo. A inteligência artificial preserva o modelo e
            altera apenas o que você pedir — para você visualizar a ideia antes de conversar com a Mercantil.
          </p>
          <Link href={`/vision?pintura=${paint}&teto=${roof}`} className="btn btn-primary mt-10">
            Abrir o Vision com esta combinação <ArrowRight className="arrow" />
          </Link>
          <p className="caption mt-5 max-w-[44ch] text-mist">
            Simulação conceitual gerada por inteligência artificial. O resultado real depende de avaliação técnica.
          </p>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-start">
            {/* Two-tone proposal card, like a period colour chart entry */}
            <figure className="relative aspect-[3/4] overflow-hidden rounded-[2px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]">
              <motion.div
                className="absolute inset-x-0 top-0 h-[34%]"
                animate={{ backgroundColor: r.hex }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
              <div className="absolute inset-x-0 top-[34%] h-px bg-black/25" />
              <motion.div
                className="absolute inset-x-0 bottom-0 h-[66%]"
                animate={{ backgroundColor: p.hex }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/0.16)_0%,rgb(255_255_255/0)_38%,rgb(0_0_0/0.18)_100%)]" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-night/75 p-4 backdrop-blur-sm">
                <span className="block font-display text-[1.375rem] leading-tight">{r.label}</span>
                <span className="block font-display text-[1.375rem] leading-tight text-silver">sobre {p.label.toLowerCase()}</span>
              </figcaption>
            </figure>

            <div className="space-y-8">
              <fieldset>
                <legend className="mb-3 text-[0.9375rem] font-medium">Carroceria</legend>
                <div className="grid grid-cols-2 gap-2">
                  {paints.map((o) => (
                    <button key={o.id} type="button" className="chip" aria-pressed={paint === o.id} onClick={() => setPaint(o.id)}>
                      <span aria-hidden className="chip-swatch" style={{ background: o.hex }} />
                      {o.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-3 text-[0.9375rem] font-medium">Teto</legend>
                <div className="grid grid-cols-2 gap-2">
                  {roofs.map((o) => (
                    <button key={o.id} type="button" className="chip" aria-pressed={roof === o.id} onClick={() => setRoof(o.id)}>
                      <span aria-hidden className="chip-swatch" style={{ background: o.hex }} />
                      {o.label.replace("Teto ", "").replace(/^./, (c) => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

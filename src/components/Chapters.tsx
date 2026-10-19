"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { SITE } from "@/lib/site";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Chapter {
  id: string;
  title: string;
  body: string;
  image: string;
  alt: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: "manha",
    title: "I. A manhã",
    body: "O dia começa devagar: café da manhã servido no terraço, depois um mergulho na piscina antes do sol esquentar.",
    image: "/images/piscina.jpg",
    alt: "Piscina da Pousada Villa Verano pela manhã",
  },
  {
    id: "tarde",
    title: "II. A tarde",
    body: "De volta ao quarto, a varanda e o jardim pedem uma soneca — ou só ficar vendo o verde lá fora.",
    image: "/images/quarto-verde.jpg",
    alt: "Quarto da Pousada Villa Verano com varanda para o jardim",
  },
  {
    id: "entardecer",
    title: "III. O entardecer",
    body: "Paraty espera lá fora, mas dá pra ficar só mais um pouco, vendo o dia terminar na Villa Verano.",
    image: "/images/quarto-amarelo.jpg",
    alt: "Quarto da Pousada Villa Verano ao final do dia",
  },
];

function Frame({ index }: { index: number }) {
  const reduce = useReducedMotion();
  const enter = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { clipPath: "inset(100% 0% 0% 0%)", scale: 1.06 },
        animate: { clipPath: "inset(0% 0% 0% 0%)", scale: 1 },
        exit: { opacity: 0, transition: { duration: 0.45, delay: 0.25 } },
      };
  const c = CHAPTERS[index];
  return (
    <AnimatePresence initial={false} mode="sync">
      <motion.figure key={c.id} className="absolute inset-0" {...enter} transition={{ duration: 1, ease: EASE }}>
        <Image src={c.image} alt={c.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
      </motion.figure>
    </AnimatePresence>
  );
}

function ChapterText({ c, i, onActive }: { c: Chapter; i: number; onActive: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.55 });
  useEffect(() => {
    if (inView) onActive(i);
  }, [inView, i, onActive]);
  return (
    <div ref={ref} className="flex min-h-[80svh] flex-col justify-center py-10">
      <p className="eyebrow text-terracotta">{c.title}</p>
      <p className="font-display mt-4 max-w-[28ch] text-3xl leading-snug text-ink">{c.body}</p>
    </div>
  );
}

function StackedChapter({ c }: { c: Chapter }) {
  return (
    <div className="py-8">
      <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
        <Image src={c.image} alt={c.alt} fill sizes="100vw" className="object-cover" />
      </div>
      <p className="eyebrow mt-6 text-terracotta">{c.title}</p>
      <p className="font-display mt-3 text-2xl leading-snug text-ink">{c.body}</p>
    </div>
  );
}

export function Chapters() {
  const [active, setActive] = useState(0);

  return (
    <section id="pousada" className="mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-28">
      <p className="eyebrow text-terracotta">A pousada</p>
      <h2 className="font-display mt-4 max-w-xl text-4xl leading-tight text-ink sm:text-5xl">Um dia na Villa Verano</h2>
      <div className="mt-6 flex items-center gap-3">
        <span className="font-display text-2xl text-ink">{SITE.rating.score}</span>
        <span className="text-sm text-ink-mute">
          ★★★★★ · {SITE.rating.count} avaliações no Google
          <br />
          Hotel {SITE.stars} estrelas
        </span>
      </div>

      {/* Desktop: sticky photo stage, chapters scroll past it */}
      <div className="mt-8 hidden lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <div>
          {CHAPTERS.map((c, i) => (
            <ChapterText key={c.id} c={c} i={i} onActive={setActive} />
          ))}
        </div>
        <div className="relative">
          <div className="sticky top-[12vh] h-[70svh] overflow-hidden rounded-sm bg-ink">
            <Frame index={active} />
            <ol className="absolute top-4 right-4 flex gap-1.5" aria-label="Capítulos">
              {CHAPTERS.map((c, i) => (
                <li key={c.id}>
                  <span className={`block h-[3px] w-8 transition-colors duration-500 ${i === active ? "bg-white" : "bg-white/30"}`}>
                    <span className="sr-only">{c.title}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Mobile/tablet: simple stack, no sticky */}
      <div className="mt-8 lg:hidden">
        {CHAPTERS.map((c) => (
          <StackedChapter key={c.id} c={c} />
        ))}
      </div>
    </section>
  );
}

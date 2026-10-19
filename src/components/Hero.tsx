"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { SITE, whatsappLink } from "@/lib/site";

const EASE = [0.16, 1, 0.3, 1] as const;
const WORDS = SITE.name.split(" "); // ["Villa", "Verano"]

/**
 * Opening sequence: the facade opens like a porch light at dusk — a soft iris reveals the
 * photo from near the front door outward — while "Villa Verano" rises letter by letter.
 * On scroll the sticky hero dims and recedes under the next section.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const dim = useTransform(scrollYProgress, [0, 1], [0, 0.6]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);

  const d = (s: number) => (reduce ? 0 : s);
  let letterIndex = 0;

  return (
    <div className="relative h-[100svh] min-h-[640px]">
      <section ref={ref} className="sticky top-0 h-[100svh] min-h-[640px] overflow-hidden bg-ink">
        <motion.div
          className="hero-reveal absolute inset-0"
          style={{ scale: reduce ? 1 : imageScale }}
          initial={reduce ? false : ({ "--reveal": "0%" } as never)}
          animate={{ "--reveal": "165%" } as never}
          transition={{ duration: d(2.4), ease: [0.33, 0, 0.2, 1], delay: d(0.1) }}
        >
          <Image
            src="/images/hero-fachada.jpg"
            alt="Fachada da Pousada Villa Verano ao entardecer, em Paraty"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>

        <motion.div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 bg-ink" style={{ opacity: reduce ? 0 : dim }} />

        <motion.div
          className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col justify-end px-6 pb-20 sm:px-10 sm:pb-28"
          style={{ opacity: reduce ? 1 : copyOpacity, y: reduce ? "0%" : copyY }}
        >
          <motion.p
            className="eyebrow text-white/80"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: d(0.8), ease: EASE, delay: d(1.5) }}
          >
            Paraty · Rio de Janeiro
          </motion.p>

          <h1 className="font-display mt-4 max-w-2xl text-5xl leading-[1.05] text-white sm:text-7xl">
            {WORDS.map((word, wi) => (
              <span key={word} className="block">
                {word.split("").map((ch, ci) => {
                  const i = letterIndex++;
                  return (
                    <span key={`${wi}-${ci}`} className="hero-letter-clip">
                      <motion.span
                        className="inline-block"
                        initial={reduce ? false : { y: "110%" }}
                        animate={{ y: "0%" }}
                        transition={{ duration: d(1.1), ease: EASE, delay: d(0.7 + i * 0.045) }}
                      >
                        {ch}
                      </motion.span>
                    </span>
                  );
                })}
              </span>
            ))}
          </h1>

          <motion.p
            className="mt-6 max-w-md text-lg text-white/90 sm:text-xl"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: d(0.9), ease: EASE, delay: d(1.7) }}
          >
            {SITE.tagline}.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap items-center gap-4"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: d(0.8), ease: EASE, delay: d(1.9) }}
          >
            <Link href={whatsappLink("Olá! Gostaria de saber sobre disponibilidade na Villa Verano.")} target="_blank" rel="noreferrer" className="btn-cta">
              Reservar pelo WhatsApp
            </Link>
            <Link href="#quartos" className="btn-cta-ghost border-white/70 text-white hover:bg-white hover:text-ink">
              Ver quartos
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}

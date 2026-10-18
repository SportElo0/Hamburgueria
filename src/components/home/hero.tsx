"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowRight } from "../icons";

const EASE = [0.16, 1, 0.3, 1] as const;
const LETTERS = "MERCANTIL".split("");

/**
 * Opening sequence: darkness → a light sweeps across the car → the plate settles → MERCANTIL rises
 * behind the roof (real alpha matte layer) → copy → actions. Buttons are interactive from the
 * first frame; motion only reveals them. On scroll the hero recedes under the next section.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const plateY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-35%"]);
  const dim = useTransform(scrollYProgress, [0, 0.9], [0, 0.85]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);

  const d = (s: number) => (reduce ? 0 : s);

  return (
    <div className="relative wide:h-[100svh] wide:min-h-[40rem]">
      <section
        ref={ref}
        aria-labelledby="hero-title"
        className="hero overflow-hidden bg-night wide:sticky wide:top-0 wide:min-h-[40rem]"
      >
        <motion.div
          className="hero-stage"
          style={{ y: reduce ? 0 : plateY }}
          initial={reduce ? false : ({ "--reveal": "0%" } as never)}
          animate={{ "--reveal": "160%" } as never}
          transition={{ duration: d(2.6), ease: [0.33, 0, 0.2, 1], delay: d(0.15) }}
        >
          {/* Plate: the car under a moving light */}
          <motion.div
            className="hero-plate"
            initial={reduce ? false : { opacity: 0, scale: 1.07 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ opacity: { duration: d(1.2), ease: "easeOut" }, scale: { duration: d(3.2), ease: EASE } }}
          >
            <Image
              src="/media/concept/charuto-hero.webp"
              alt="Ilustração conceitual do Mercedes-Benz 250 SE Coupé W111 azul-marinho com teto claro em um ambiente escuro iluminado"
              fill
              priority
              sizes="(min-width: 64rem) 95vw, 150vw"
              className="object-cover"
            />
          </motion.div>

          <h1 id="hero-title" className="hero-title">
            <span className="sr-only">MERCANTIL</span>
            <motion.span aria-hidden className="hero-title-inner" style={{ y: reduce ? 0 : titleY }}>
              {LETTERS.map((ch, i) => (
                <span key={i} className="hero-letter-clip">
                  <motion.span
                    className="inline-block"
                    initial={reduce ? false : { y: "108%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: d(1.25), ease: EASE, delay: d(1.05 + i * 0.055) }}
                  >
                    {ch}
                  </motion.span>
                </span>
              ))}
            </motion.span>
          </h1>

          {/* Roof layer: alpha matte cut from the same image, so the title sits behind the car */}
          <motion.div
            aria-hidden
            className="hero-plate hero-roof"
            initial={reduce ? false : { opacity: 0, scale: 1.07 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ opacity: { duration: d(1.2), delay: d(0.5) }, scale: { duration: d(3.2), ease: EASE } }}
          >
            <Image src="/media/concept/charuto-hero-roof.webp" alt="" fill priority sizes="(min-width: 64rem) 95vw, 150vw" className="object-cover" />
          </motion.div>
        </motion.div>

        <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-[25] bg-night" style={{ opacity: reduce ? 0 : dim }} />

        <motion.div className="hero-copy" style={{ opacity: reduce ? 1 : copyOpacity }}>
          <motion.p
            className="font-display text-[clamp(1.75rem,2.6vw,2.625rem)] leading-[1.08] italic text-ivory"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: d(1), ease: EASE, delay: d(1.85) }}
          >
            Clássicos com história.
          </motion.p>
          <motion.p
            className="mt-4 max-w-[30ch] text-[1.0625rem] leading-relaxed text-silver"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: d(1), ease: EASE, delay: d(2.0) }}
          >
            Acervo de automóveis clássicos e projetos de restauração.
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: d(0.9), ease: EASE, delay: d(2.2) }}
          >
            <Link href="/acervo" className="btn btn-primary">
              Explorar acervo <ArrowRight className="arrow" />
            </Link>
            <Link href="/restauracao" className="btn btn-quiet">
              Restaurar meu carro
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-foot"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: d(1), delay: d(2.6) }}
        >
          <p className="caption max-w-[46ch] text-mist">
            <span className="prov" data-kind="concept">
              <span>
                Ilustração conceitual gerada por IA a partir do Charuto. Não é fotografia nem restauração concluída.{" "}
                <Link href="/acervo/250-se-coupe-w111" className="link-line text-silver hover:text-ivory">
                  Ver fotografias reais
                </Link>
              </span>
            </span>
          </p>
          <a href="#descubra" className="hidden items-center gap-3 text-[0.875rem] text-silver transition-colors hover:text-ivory lg:inline-flex">
            Descubra o clássico <ArrowDown size={16} />
          </a>
        </motion.div>
      </section>
    </div>
  );
}

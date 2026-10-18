"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

type Chapter = {
  id: string;
  title: string;
  body: string;
  facts?: string[];
};

const chapters: Chapter[] = [
  {
    id: "silhueta",
    title: "I. A silhueta",
    body: "Capô longo, para-lamas planos e a grade vertical em pé. Mercedes-Benz 250 SE Coupé, família W111. Azul-marinho profundo sob um teto claro.",
    facts: ["250 SE Coupé · W111", "c. 1966 · ano a confirmar"],
  },
  {
    id: "detalhes",
    title: "II. Os detalhes",
    body: "A estrela de pé sobre o capô, o emblema esmaltado, a moldura cromada da grade e os faróis verticais. É nos detalhes que o carro guarda a época.",
  },
  {
    id: "interior",
    title: "III. O interior",
    body: "Pelo para-brisa, o vermelho. Bancos, painel e o volante de aro fino — o contraste que define o Charuto por dentro.",
  },
];

function Frame({ index }: { index: number }) {
  const reduce = useReducedMotion();
  const enter = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { clipPath: "inset(100% 0% 0% 0%)", scale: 1.08 },
        animate: { clipPath: "inset(0% 0% 0% 0%)", scale: 1 },
        exit: { opacity: 0, transition: { duration: 0.5, delay: 0.35 } },
      };
  return (
    <AnimatePresence initial={false} mode="sync">
      <motion.div
        key={index}
        className="absolute inset-0"
        {...enter}
        transition={{ duration: 1.1, ease: EASE }}
      >
        {index === 0 && (
          <figure className="absolute inset-0">
            <Image
              src="/media/charuto/real-car.webp"
              alt="Mercedes-Benz 250 SE Coupé W111 azul-marinho com teto claro, em pátio"
              fill
              sizes="(min-width: 64rem) 50vw, 100vw"
              className="object-cover object-[50%_40%]"
            />
            <figcaption className="caption absolute bottom-4 left-4 rounded-sm bg-night/70 px-2.5 py-1.5 text-silver backdrop-blur-sm">
              <span className="prov" data-kind="real">Fotografia real · registro atual em pátio</span>
            </figcaption>
          </figure>
        )}
        {index === 1 && (
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-[1.25fr_1fr] gap-1.5 bg-night p-1.5">
            <figure className="relative col-span-2 overflow-hidden">
              <Image src="/media/charuto/real-grille.webp" alt="Grade cromada e emblema esmaltado do W111" fill sizes="(min-width: 64rem) 50vw, 100vw" className="object-cover object-[50%_30%]" />
            </figure>
            <figure className="relative overflow-hidden">
              <Image src="/media/charuto/real-star.webp" alt="Estrela de capô do W111" fill sizes="25vw" className="object-cover" />
            </figure>
            <figure className="relative overflow-hidden">
              <Image src="/media/charuto/real-headlight.webp" alt="Farol vertical e para-choque cromado do W111" fill sizes="25vw" className="object-cover object-[30%_50%]" />
              <figcaption className="caption absolute right-2 bottom-2 rounded-sm bg-night/70 px-2 py-1 text-silver backdrop-blur-sm">
                <span className="prov" data-kind="real">Fotografias reais</span>
              </figcaption>
            </figure>
          </div>
        )}
        {index === 2 && <InteriorPan />}
      </motion.div>
    </AnimatePresence>
  );
}

/** Letterboxed interior crop that drifts slowly while the chapter is active. */
function InteriorPan() {
  const reduce = useReducedMotion();
  return (
    <figure className="absolute inset-0 flex items-center overflow-hidden bg-night">
      <motion.div
        className="relative mx-auto aspect-[670/250] w-full max-w-[770px]"
        initial={{ scale: 1 }}
        animate={{ scale: reduce ? 1 : 1.04 }}
        transition={{ duration: reduce ? 0 : 12, ease: "linear" }}
      >
        <Image src="/media/charuto/real-interior.webp" alt="Interior vermelho e volante do W111 vistos pelo para-brisa" fill sizes="770px" className="object-cover" />
      </motion.div>
      <figcaption className="caption absolute bottom-4 left-4 text-silver">
        <span className="prov" data-kind="real">Fotografia real · interior vermelho, através do para-brisa</span>
      </figcaption>
    </figure>
  );
}

function ChapterText({ c, i, onActive }: { c: Chapter; i: number; onActive: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.55 });
  useEffect(() => {
    if (inView) onActive(i);
  }, [inView, i, onActive]);
  return (
    <div ref={ref} className="flex min-h-[86svh] flex-col justify-center py-16">
      <h3 className="h-section">{c.title}</h3>
      <p className="lede mt-6 max-w-[34ch] text-silver">{c.body}</p>
      {c.facts && (
        <ul className="caption mt-8 space-y-1 text-mist">
          {c.facts.map((f) => (
            <li key={f} className="tabular">{f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Mobile/tablet: each chapter gets its own stacked composition, no sticky stage. */
function StackedChapter({ c, i }: { c: Chapter; i: number }) {
  return (
    <div className="py-10">
      <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[4/3]">
        <Frame index={i} />
      </div>
      <h3 className="h-section mt-8">{c.title}</h3>
      <p className="lede mt-4 text-silver">{c.body}</p>
      {c.facts && <p className="caption tabular mt-5 text-mist">{c.facts.join(" · ")}</p>}
    </div>
  );
}

export function Discover() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "start start"] });
  const lift = useTransform(scrollYProgress, [0, 1], [0.96, 1]);
  const reduce = useReducedMotion();

  return (
    <motion.section
      ref={sectionRef}
      id="descubra"
      aria-labelledby="descubra-title"
      className="relative z-10 bg-navy-deep wide:rounded-t-[1.75rem]"
      style={{ scale: reduce ? 1 : lift, transformOrigin: "50% 0%" }}
    >
      <div className="wrap pt-24 pb-6 wide:pt-32">
        <h2 id="descubra-title" className="h-page max-w-[12ch]">
          Descubra o clássico.
        </h2>
        <p className="lede mt-6 max-w-[38ch] text-silver">
          O Charuto, como é chamado em família, contado em capítulos — com as fotografias reais que existem hoje.
        </p>
      </div>

      {/* Desktop: sticky photographic stage, text scrolls past it */}
      <div className="wrap hidden lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <div>
          {chapters.map((c, i) => (
            <ChapterText key={c.id} c={c} i={i} onActive={setActive} />
          ))}
        </div>
        <div className="relative">
          <div className="sticky top-[calc(var(--nav-h)+2vh)] h-[calc(100svh-var(--nav-h)-4vh)] overflow-hidden rounded-[2px] bg-night">
            <Frame index={active} />
            <ol className="absolute top-4 right-4 flex gap-1.5" aria-label="Capítulos">
              {chapters.map((c, i) => (
                <li key={c.id}>
                  <span
                    className={`block h-[3px] w-8 transition-colors duration-500 ${i === active ? "bg-ivory" : "bg-ivory/25"}`}
                    aria-current={i === active ? "step" : undefined}
                  >
                    <span className="sr-only">{c.title}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="wrap lg:hidden">
        {chapters.map((c, i) => (
          <StackedChapter key={c.id} c={c} i={i} />
        ))}
      </div>
    </motion.section>
  );
}

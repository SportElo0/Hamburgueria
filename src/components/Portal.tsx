"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import gsap from "gsap";
import { Door } from "./Door";
import { SCENES } from "@/lib/scenes";
import { SITE, whatsappLink } from "@/lib/site";

const ACCENT = "#f6b429";
const AUTOPLAY_MS = 7000;
const NAV = [
  { href: "#quartos", label: "Quartos" },
  { href: "#comodidades", label: "Comodidades" },
  { href: "#localizacao", label: "Localização" },
];

export function Portal() {
  const reduce = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [doorPhotoIndex, setDoorPhotoIndex] = useState(0);
  const transitioning = useRef(false);
  const interactiveRef = useRef(false); // hovered or focused: pauses autoplay, enables keyboard nav

  const doorWrapRef = useRef<HTMLDivElement>(null);
  const photoGroupRef = useRef<SVGGElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const bgRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scene = SCENES[activeIndex];
  const doorScene = SCENES[doorPhotoIndex];
  const total = SCENES.length;

  const navigate = useCallback(
    (nextIndex: number) => {
      const next = ((nextIndex % total) + total) % total;
      if (transitioning.current || next === activeIndex) return;
      transitioning.current = true;

      if (reduce) {
        gsap.timeline({ onComplete: () => (transitioning.current = false) })
          .to(textRef.current, { opacity: 0, duration: 0.25 })
          .call(() => {
            setDoorPhotoIndex(next);
            setActiveIndex(next);
          })
          .to(bgRefs.current[activeIndex], { opacity: 0, duration: 0.01 })
          .set(bgRefs.current[next], { opacity: 1 })
          .to(textRef.current, { opacity: 1, duration: 0.25 });
        return;
      }

      const tl = gsap.timeline({ onComplete: () => (transitioning.current = false) });
      tl.addLabel("go")
        .to(doorWrapRef.current, { scale: 15, duration: 0.65, ease: "power2.in" }, "go")
        .to(textRef.current, { opacity: 0, y: -24, duration: 0.35, ease: "power2.in" }, "go")
        .call(() => setDoorPhotoIndex(next), [], "go+=0.58")
        .to(bgRefs.current[activeIndex], { opacity: 0, duration: 0.3 }, "go+=0.58")
        .to(bgRefs.current[next], { opacity: 1, duration: 0.3 }, "go+=0.58")
        .to(doorWrapRef.current, { scale: 1, duration: 0.55, ease: "power3.out" }, "go+=0.65")
        .call(() => setActiveIndex(next), [], "go+=0.95")
        .fromTo(textRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "go+=1.0");
    },
    [activeIndex, reduce, total],
  );

  // Autoplay, paused on hover/focus; restarts its 7s window after every change.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!interactiveRef.current) navigate(activeIndex + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [activeIndex, navigate]);

  // Keyboard arrows, only while the portal has hover or focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!interactiveRef.current) return;
      if (e.key === "ArrowRight") navigate(activeIndex + 1);
      if (e.key === "ArrowLeft") navigate(activeIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, navigate]);

  // Mouse parallax on the photo inside the door (desktop only), via GSAP — no React re-renders.
  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduce || !photoGroupRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - r.left) / r.width - 0.5) * 3;
    const dy = ((e.clientY - r.top) / r.height - 0.5) * 3;
    gsap.to(photoGroupRef.current, { x: dx, y: dy, duration: 0.7, ease: "power2.out", overwrite: "auto" });
  };

  // Touch swipe: only hijacks horizontal gestures, vertical scroll passes through untouched.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    interactiveRef.current = true;
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.touches[0].clientX - touch.current.x;
    const dy = e.touches[0].clientY - touch.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) e.preventDefault();
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) navigate(activeIndex + (dx < 0 ? 1 : -1));
    touch.current = null;
    window.setTimeout(() => (interactiveRef.current = false), 300);
  };

  return (
    <section
      className="relative h-[100svh] min-h-[560px] overflow-hidden bg-ink"
      onMouseEnter={() => (interactiveRef.current = true)}
      onMouseLeave={() => (interactiveRef.current = false)}
      onFocus={() => (interactiveRef.current = true)}
      onBlur={() => (interactiveRef.current = false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background layers: one per scene, blurred and darkened, cross-fading on navigate. */}
      {SCENES.map((s, i) => (
        <div
          key={s.id}
          ref={(el) => {
            bgRefs.current[i] = el;
          }}
          className="absolute inset-0"
          style={{ opacity: i === activeIndex ? 1 : 0 }}
        >
          <Image src={s.photo} alt="" fill priority={i === 0} sizes="100vw" className="scale-110 object-cover blur-md brightness-[0.38]" />
        </div>
      ))}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-ink/30" />

      {/* Top nav */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
          <span className="font-display text-base font-semibold tracking-wide text-paper">{SITE.name}</span>
          <nav className="hidden items-center gap-8 text-sm text-paper/85 md:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-paper">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href={whatsappLink("Olá! Vi o site da Villa Verano.")} target="_blank" rel="noreferrer" className="btn-cta-ghost border-paper/60 text-sm text-paper hover:bg-paper hover:text-ink">
            Fale conosco
          </Link>
        </div>
      </header>

      {/* Door */}
      <div className="relative z-10 flex h-full items-center justify-center px-6 pt-16 pb-44 sm:pb-24">
        <div ref={doorWrapRef} className="h-[46vh] max-h-[420px] min-h-[260px] sm:h-[58vh]" onMouseMove={onMouseMove}>
          <button
            type="button"
            onClick={() => navigate(activeIndex + 1)}
            aria-label={`Próximo lugar: ${SCENES[(activeIndex + 1) % total].label}`}
            className="block h-full cursor-pointer"
          >
            <Door ref={photoGroupRef} accent={ACCENT} photoHref={doorScene.photo} photoAspect={doorScene.aspect} className="h-full w-auto drop-shadow-2xl" />
          </button>
        </div>
      </div>

      {/* Copy: label + title left, paragraph + CTA right (desktop); stacked under the door on mobile */}
      <div className="pointer-events-none absolute inset-x-0 bottom-36 z-20 sm:bottom-16">
        <div ref={textRef} className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:text-left">
          <div aria-live="polite">
            <p className="eyebrow text-accent">Paraty · Rio de Janeiro</p>
            <h1 className="font-display mt-3 text-4xl leading-[1.05] text-paper sm:text-5xl">
              {scene.title[0]}
              <br />
              {scene.title[1]}
            </h1>
            <p className="mt-2 text-sm tabular-nums text-paper-mute">
              {String(activeIndex + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
            </p>
          </div>
          <div className="pointer-events-auto hidden max-w-xs sm:block">
            <p className="text-[15px] leading-relaxed text-paper-mute">{scene.body}</p>
            <Link href={whatsappLink("Olá! Gostaria de saber sobre disponibilidade na Villa Verano.")} target="_blank" rel="noreferrer" className="btn-cta mt-5">
              Reservar pelo WhatsApp
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom chrome (cleared on mobile so the fixed WhatsApp bar never covers it) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 pb-5 sm:bottom-0 sm:pb-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 sm:px-10">
          <ol className="pointer-events-auto flex gap-2" aria-label="Lugares">
            {SCENES.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => navigate(i)}
                  aria-label={s.label}
                  aria-current={i === activeIndex ? "step" : undefined}
                  className={`block h-[3px] w-7 cursor-pointer rounded-full transition-colors ${i === activeIndex ? "bg-accent" : "bg-paper/30 hover:bg-paper/55"}`}
                />
              </li>
            ))}
          </ol>
          <p className="hidden text-xs text-paper-mute sm:block">Clique no portal para trocar de lugar</p>
          <div className="pointer-events-auto flex gap-3">
            <Link
              href={`https://instagram.com/${SITE.instagram}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="grid h-8 w-8 place-items-center rounded-full border border-paper/30 text-paper/80 transition-colors hover:border-paper hover:text-paper"
            >
              <InstagramIcon />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

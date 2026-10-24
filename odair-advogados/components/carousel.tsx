"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Trilho horizontal das áreas: rolagem nativa com snap (toque e trackpad),
 * arrasto com o mouse e setas. Um arrasto não dispara o clique do card.
 */
export function Carousel({ children, label }: { children: React.ReactNode; label: string }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
    setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft > max - 4 });
  }, []);

  useEffect(() => {
    measure();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const step = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("li");
    const gap = parseFloat(getComputedStyle(el).columnGap || "0");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + gap), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <div aria-hidden className="relative h-px flex-1 max-w-[18rem] bg-blue-line">
          <span
            className="absolute inset-y-0 left-0 w-1/3 bg-gold transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${progress * 200}%)` }}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={edges.start}
            aria-label="Área anterior"
            className="grid size-12 place-items-center rounded-full border border-blue-line text-ivory transition-colors hover:border-gold hover:text-gold disabled:cursor-default disabled:opacity-35 disabled:hover:border-blue-line disabled:hover:text-ivory"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={edges.end}
            aria-label="Próxima área"
            className="grid size-12 place-items-center rounded-full border border-gold bg-gold text-navy transition-colors hover:bg-gold-soft disabled:cursor-default disabled:border-blue-line disabled:bg-transparent disabled:text-ivory disabled:opacity-35"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        aria-label={label}
        onScroll={measure}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          const el = trackRef.current;
          if (!el) return;
          drag.current = { x: event.clientX, left: el.scrollLeft, moved: false };
        }}
        onPointerMove={(event) => {
          const el = trackRef.current;
          const d = drag.current;
          if (!el || !d) return;
          const dx = event.clientX - d.x;
          if (!d.moved && Math.abs(dx) > 6) {
            d.moved = true;
            setDragging(true);
            el.setPointerCapture(event.pointerId);
          }
          if (d.moved) el.scrollLeft = d.left - dx;
        }}
        // Links e imagens são arrastáveis por padrão: o arrasto nativo cancelaria o do trilho.
        onDragStart={(event) => event.preventDefault()}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
        }}
        onPointerUp={() => {
          const el = trackRef.current;
          const d = drag.current;
          if (el && d?.moved) {
            // Assenta no card seguinte (ou anterior) na direção do arrasto; o snap volta depois.
            const card = el.querySelector<HTMLElement>("li");
            const stepWidth = (card?.offsetWidth ?? 320) + parseFloat(getComputedStyle(el).columnGap || "0");
            const delta = el.scrollLeft - d.left;
            const from = Math.round(d.left / stepWidth);
            const target = Math.abs(delta) > 40 ? from + Math.sign(delta) * Math.max(1, Math.round(Math.abs(delta) / stepWidth)) : from;
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            el.scrollTo({ left: target * stepWidth, behavior: reduce ? "auto" : "smooth" });
            window.setTimeout(() => setDragging(false), reduce ? 0 : 450);
          } else {
            setDragging(false);
          }
          window.setTimeout(() => {
            drag.current = null;
          }, 0);
        }}
        onClickCapture={(event) => {
          if (drag.current?.moved) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        className={`mt-8 flex gap-4 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 pb-4 [scrollbar-width:none] sm:scroll-px-8 sm:px-8 lg:gap-5 lg:scroll-px-12 lg:px-12 [&::-webkit-scrollbar]:hidden ${
          dragging ? "cursor-grabbing select-none" : "snap-x snap-mandatory md:cursor-grab"
        }`}
      >
        {children}
      </ul>
    </div>
  );
}

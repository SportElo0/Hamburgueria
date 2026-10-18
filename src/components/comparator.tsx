"use client";

import { useId, useState } from "react";

/**
 * One comparison component for every state comparison on the site (restoration before/after and
 * Vision original/concept). A native range input carries pointer, touch and keyboard input, and the
 * three buttons give a single-tap alternative to dragging.
 */
export function Comparator({
  before,
  after,
  beforeLabel = "Antes",
  afterLabel = "Depois",
  aspect = "4 / 3",
  className = "",
  maxHeight,
}: {
  before: { src: string; alt: string };
  after: { src: string; alt: string };
  beforeLabel?: string;
  afterLabel?: string;
  aspect?: string;
  className?: string;
  /** Caps tall (portrait) images so the whole comparison fits the viewport. */
  maxHeight?: string;
}) {
  const [pos, setPos] = useState(50);
  const id = useId();
  return (
    <div className={className}>
      <div
        className="relative mx-auto select-none overflow-hidden bg-night"
        style={{ aspectRatio: aspect, width: maxHeight ? `min(100%, calc(${maxHeight} * (${aspect})))` : undefined }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- sources may be local data URLs */}
        <img src={after.src} alt={after.alt} className="absolute inset-0 h-full w-full object-contain" draggable={false} />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={before.src} alt={before.alt} className="absolute inset-0 h-full w-full object-contain" draggable={false} />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-ivory/90" style={{ left: `${pos}%` }}>
          <span className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-ivory/70 bg-night/70 text-ivory backdrop-blur-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m9 6-6 6 6 6M15 6l6 6-6 6" /></svg>
          </span>
        </div>
        <span className="caption pointer-events-none absolute top-3 left-3 rounded-sm bg-night/70 px-2 py-1 text-ivory">{beforeLabel}</span>
        <span className="caption pointer-events-none absolute top-3 right-3 rounded-sm bg-night/70 px-2 py-1 text-ivory">{afterLabel}</span>
        <label htmlFor={id} className="sr-only">
          Comparar {beforeLabel.toLowerCase()} e {afterLabel.toLowerCase()}
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          step={1}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-valuetext={`${pos}% ${beforeLabel.toLowerCase()}`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <div className="mt-3 flex gap-2" role="group" aria-label="Posições rápidas">
        {[
          { v: 100, l: beforeLabel },
          { v: 50, l: "Metade" },
          { v: 0, l: afterLabel },
        ].map((b) => (
          <button key={b.v} type="button" onClick={() => setPos(b.v)} aria-pressed={pos === b.v} className="chip !min-h-10 !px-3 !py-1.5">
            {b.l}
          </button>
        ))}
      </div>
    </div>
  );
}

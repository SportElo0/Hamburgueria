"use client";

import { forwardRef, useId } from "react";

/**
 * A Paraty colonial doorway, hand-drawn in SVG: whitewashed arch frame, a painted trim band,
 * two swung-open shutters, a simple fanlight over the arch. The opening is a real <clipPath> —
 * the scene photo lives inside this same SVG, clipped to it, so frame and photo can never drift
 * out of sync at any size. `viewBox` is the single source of truth; CSS only scales the box.
 *
 * The photo's inner <g> is exposed via `photoGroupRef` so the parent can drive mouse-parallax
 * with GSAP directly on the DOM node, instead of through React state on every mousemove.
 */
const VB_W = 100;
const VB_H = 190;
// Opening: a round-arch doorway. Springline at y=78, arch radius 34, sides at x=14..86.
const OPENING_PATH = "M14,188 L14,78 A36,36 0 0 1 86,78 L86,188 Z";
const TRIM_OUTER_PATH = "M8,190 L8,76 A42,42 0 0 1 92,76 L92,190 Z";
const FRAME_OUTER_PATH = "M0,190 L0,74 A50,50 0 0 1 100,74 L100,190 Z";

export const Door = forwardRef<
  SVGGElement,
  {
    accent: string;
    shuttersOpen?: boolean;
    photoHref: string;
    photoAspect?: number;
    className?: string;
  }
>(function Door({ accent, shuttersOpen = true, photoHref, photoAspect = 1, className = "" }, photoGroupRef) {
  const uid = useId().replace(/[:]/g, "");
  const openingId = `door-opening-${uid}`;

  // Cover-fit the photo inside the opening's bounding box (14..86 x, 0..188 y).
  const boxW = 72;
  const boxH = 188;
  const boxAspect = boxW / boxH;
  let imgW: number, imgH: number;
  if (photoAspect > boxAspect) {
    imgH = boxH * 1.22;
    imgW = imgH * photoAspect;
  } else {
    imgW = boxW * 1.22;
    imgH = imgW / photoAspect;
  }
  const imgX = 14 + (boxW - imgW) / 2;
  const imgY = 0 + (boxH - imgH) / 2;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className={className} role="presentation" aria-hidden>
      <defs>
        <clipPath id={openingId} clipPathUnits="userSpaceOnUse">
          <path d={OPENING_PATH} />
        </clipPath>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="50" cy="187" rx="46" ry="5" fill="black" opacity="0.35" />

      {/* Whitewash outer frame (evenodd leaves the opening + trim visually clear) */}
      <path d={`${FRAME_OUTER_PATH} ${TRIM_OUTER_PATH}`} fillRule="evenodd" fill="#e8e0d0" />

      {/* Painted trim band */}
      <path d={`${TRIM_OUTER_PATH} ${OPENING_PATH}`} fillRule="evenodd" fill={accent} />

      {/* Photo, clipped to the opening */}
      <g clipPath={`url(#${openingId})`}>
        <g ref={photoGroupRef}>
          <image href={photoHref} x={imgX} y={imgY} width={imgW} height={imgH} preserveAspectRatio="none" />
        </g>
        <rect x="14" y="0" width="72" height="188" fill="black" opacity="0.08" />
      </g>

      {/* Fanlight mullions over the arch */}
      <g stroke="#2a2520" strokeOpacity="0.5" strokeWidth="0.6">
        <path d="M22,78 A28,28 0 0 1 50,52" fill="none" />
        <path d="M78,78 A28,28 0 0 1 50,52" fill="none" />
        <line x1="50" y1="42" x2="50" y2="78" />
      </g>

      {/* Shutters, swung open against the frame */}
      <Shutter side="left" open={shuttersOpen} />
      <Shutter side="right" open={shuttersOpen} />

      {/* Trim outline */}
      <path d={TRIM_OUTER_PATH} fill="none" stroke={accent} strokeOpacity="0.9" strokeWidth="0.5" />
    </svg>
  );
});

function Shutter({ side, open }: { side: "left" | "right"; open: boolean }) {
  const x = side === "left" ? 1 : 85;
  const angle = open ? (side === "left" ? -78 : 78) : 0;
  const hinge = side === "left" ? x : x + 14;
  return (
    <g transform={`rotate(${angle} ${hinge} 150)`} style={{ transition: "transform 1s cubic-bezier(.3,0,.2,1)" }}>
      <rect x={x} y="90" width="14" height="96" rx="0.6" fill="#1e3a44" stroke="#142a32" strokeWidth="0.4" />
      <line x1={x + 7} y1="94" x2={x + 7} y2="182" stroke="#142a32" strokeWidth="0.4" />
      <rect x={x + 2} y="96" width="10" height="36" fill="none" stroke="#142a32" strokeOpacity="0.6" strokeWidth="0.4" />
      <rect x={x + 2} y="140" width="10" height="40" fill="none" stroke="#142a32" strokeOpacity="0.6" strokeWidth="0.4" />
      <circle cx={side === "left" ? x + 12 : x + 2} cy="138" r="0.9" fill="#d9c98a" />
    </g>
  );
}

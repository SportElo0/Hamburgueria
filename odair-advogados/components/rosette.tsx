import type { CSSProperties } from "react";
import { rosette, type RosetteSpec } from "@/lib/guilloche";

/**
 * Roseta guilhochê desenhada em SVG. Decorativa (aria-hidden): o significado
 * está sempre no texto ao lado.
 *
 * - `engrave`: os anéis se gravam em sequência ao carregar.
 * - `turn`: gira devagar com o scroll da página (onde o navegador suporta).
 */
export function Rosette({
  spec,
  className = "",
  engrave = false,
  turn = false,
  steps,
  inner,
  strokeWidth = 0.7,
  engraveStroke = 0.3,
  children,
}: {
  spec: RosetteSpec;
  className?: string;
  engrave?: boolean;
  turn?: boolean;
  steps?: number;
  inner?: number;
  strokeWidth?: number;
  /**
   * Espessura em unidades do viewBox quando há gravação. No Chrome,
   * `pathLength` combinado com `non-scaling-stroke` corta o traço ao fim da
   * animação, então a roseta gravada usa espessura proporcional.
   */
  engraveStroke?: number;
  children?: React.ReactNode;
}) {
  const rings = rosette(spec, { steps, inner });
  const innerR = (inner ?? 0.42) * 100;
  return (
    <div className={`relative aspect-square ${className}`}>
      <svg
        viewBox="-104 -104 208 208"
        aria-hidden
        focusable="false"
        className={`absolute inset-0 size-full overflow-visible ${engrave ? "engrave" : ""}`}
      >
        <g className={turn ? "turn-on-scroll origin-center [transform-box:fill-box]" : undefined}>
          {rings.map((paths, i) => (
            <g key={i} style={{ "--ring": i } as CSSProperties} opacity={0.5 + (i / rings.length) * 0.5}>
              {paths.map((d, j) => (
                <path
                  key={j}
                  d={d}
                  pathLength={1}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={engrave ? engraveStroke : strokeWidth}
                  vectorEffect={engrave ? undefined : "non-scaling-stroke"}
                />
              ))}
            </g>
          ))}
        </g>
        {/* Fios do selo: borda externa dupla e o campo do centro. */}
        <g className="seal" style={{ transformOrigin: "center", transformBox: "fill-box" }}>
          <circle r={101.5} fill="none" stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <circle r={103.5} fill="none" stroke="currentColor" strokeWidth={0.6} opacity={0.6} vectorEffect="non-scaling-stroke" />
          <circle r={innerR - 7} fill="none" stroke="currentColor" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
    </div>
  );
}

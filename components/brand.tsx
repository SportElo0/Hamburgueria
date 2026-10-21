import { useId, type SVGProps } from "react";

/**
 * Monograma tipográfico provisório (serifado, como o "LM" do logotipo real)
 * até o arquivo original do logotipo ser enviado.
 */
export function Wordmark({
  className = "",
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "light";
}) {
  const rule = tone === "ink" ? "bg-champagne" : "bg-champagne-soft";
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span className="serif text-[2.1rem] leading-[0.85] font-semibold tracking-[-0.02em]">
        LM
      </span>
      <span className="mt-1.5 flex items-center gap-1.5">
        <span aria-hidden className={`h-px w-3 ${rule}`} />
        <span className="text-[0.56rem] font-semibold tracking-[0.34em] uppercase">Barbearia</span>
        <span aria-hidden className={`h-px w-3 ${rule}`} />
      </span>
    </span>
  );
}

/** Selo circular que ecoa o logotipo redondo da barbearia. */
export function Seal({ className = "", size = 132 }: { className?: string; size?: number }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Selo LM Barbearia, Leonardo Miguel, desde 2024"
    >
      <defs>
        <path id={id} d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
      </defs>
      <circle cx="60" cy="60" r="58" fill="none" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <text
        fill="currentColor"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 7.2,
          letterSpacing: "0.32em",
          fontWeight: 600,
        }}
      >
        <textPath href={`#${id}`} startOffset="0">
          BARBEARIA · LEONARDO MIGUEL · DESDE 2024 ·
        </textPath>
      </text>
      <text
        x="60"
        y="69"
        textAnchor="middle"
        fill="currentColor"
        style={{ fontFamily: "var(--font-serif)", fontSize: 27, fontWeight: 600 }}
      >
        LM
      </text>
    </svg>
  );
}

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

/** Traço no mesmo peso dos ícones lucide usados no resto do site. */
export function InstagramIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M3.5 20.5l1.3-4.2A8.6 8.6 0 1 1 8 19.3z" />
      <path d="M9.2 8.4c.2-.5.5-.6.8-.6h.5c.2 0 .4.1.5.4l.7 1.7c.1.2 0 .5-.1.7l-.5.6c-.1.2-.1.4 0 .6.6 1 1.4 1.8 2.4 2.4.2.1.4.1.6 0l.6-.5c.2-.1.5-.2.7-.1l1.7.7c.3.1.4.3.4.5v.5c0 .3-.1.6-.6.8-.6.3-1.7.5-3.3-.4a10 10 0 0 1-3.6-3.6c-.9-1.6-.7-2.7-.4-3.3z" />
    </svg>
  );
}

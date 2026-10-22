import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/**
 * O casco do logo do Convés: mastro e casco com nervuras curvas. Versão
 * provisória desenhada a partir do cardápio impresso, até chegar o arquivo original.
 */
export function Hull({ size = 28, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      aria-hidden
      {...props}
    >
      <path d="M20 2v35" />
      <path d="M3 14c6 2 11 3 17 3s11-1 17-3c-2 11-8 19-17 23C11 33 5 25 3 14Z" />
      <path d="M7 21c4 1.6 8.5 2.4 13 2.4s9-.8 13-2.4" />
      <path d="M11 27c3 1.2 6 1.8 9 1.8s6-.6 9-1.8" />
    </svg>
  );
}

/** Marca tipográfica: "convés" fino com o casco e "ILHABELA" em versalete. */
export function Wordmark({ className = "", tone = "deep" }: { className?: string; tone?: "deep" | "light" }) {
  const color = tone === "deep" ? "text-deep" : "text-sand";
  const accent = tone === "deep" ? "text-champagne-deep" : "text-champagne-soft";
  return (
    <span className={`inline-flex items-end gap-2.5 whitespace-nowrap ${color} ${className}`}>
      <Hull size={30} className={`mb-0.5 ${accent}`} />
      <span className="flex flex-col">
        <span className="mark text-[1.85rem] tracking-[0.02em] sm:text-[2.1rem]">convés</span>
        <span className="mt-1 text-[0.5625rem] font-semibold tracking-[0.5em] uppercase">Ilhabela</span>
      </span>
    </span>
  );
}

/** Divisor de seção: fio champanhe com o casco no meio. */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`rule ${className}`}>
      <Hull size={18} />
    </span>
  );
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

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

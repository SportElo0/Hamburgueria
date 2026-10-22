import type { SVGProps } from "react";
import Image from "next/image";
import { site } from "@/config/site";

/**
 * Assinatura tipográfica: "Regiane Camilo" em cursiva condensada sobre
 * "· Bolos & Doces ·" em versalete, como no selo original.
 */
export function Wordmark({
  className = "",
  tone = "cocoa",
}: {
  className?: string;
  tone?: "cocoa" | "cream";
}) {
  const ink = tone === "cocoa" ? "text-cocoa" : "text-cream";
  const sub = tone === "cocoa" ? "text-ink" : "text-on-cocoa-muted";
  return (
    <span className={`inline-flex flex-col items-center leading-none whitespace-nowrap ${className}`}>
      <span className={`script text-[1.7rem] tracking-[0.005em] ${ink} sm:text-[2rem] lg:text-[2.25rem]`}>
        Regiane Camilo
      </span>
      <span className={`mt-1 flex items-center gap-2 ${sub}`}>
        <span aria-hidden className="dot" />
        <span className="text-[0.5625rem] font-bold tracking-[0.3em] uppercase sm:text-[0.625rem] sm:tracking-[0.34em]">
          Bolos &amp; Doces
        </span>
        <span aria-hidden className="dot" />
      </span>
    </span>
  );
}

/** O selo redondo original da Regiane (recortado da foto de perfil). */
export function Seal({
  size = 160,
  className = "",
  priority = false,
  decorative = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
  /** true quando o selo é só ornamento (ex.: carimbo do convite). */
  decorative?: boolean;
}) {
  return (
    <Image
      src="/selo-regiane.png"
      alt={decorative ? "" : `Selo da marca ${site.name}`}
      width={size}
      height={size}
      priority={priority}
      sizes={`${size}px`}
      className={`rounded-full ${className}`}
    />
  );
}

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

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

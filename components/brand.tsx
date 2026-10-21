import type { SVGProps } from "react";

/** Marca tipográfica provisória até o arquivo do logotipo original ser enviado. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="display text-[1.9rem] leading-none tracking-[-0.02em]">LM</span>
      <span aria-hidden className="h-6 w-px bg-line-strong" />
      <span className="flex flex-col leading-none">
        <span className="guard text-[0.7rem] tracking-[0.2em] text-paper">BARBEARIA</span>
        <span className="mt-1 text-[0.62rem] font-semibold tracking-[0.14em] text-steel uppercase">
          Leonardo Miguel
        </span>
      </span>
    </span>
  );
}

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
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

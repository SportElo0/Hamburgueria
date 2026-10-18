import type { SVGProps } from "react";

/** Authored icon set: 24px grid, 1.5 stroke, square caps — one weight across the site. */
type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...p }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "square" as const,
    "aria-hidden": true,
    focusable: false,
    ...p,
  };
}

export const ArrowRight = (p: P) => (
  <svg {...base(p)}><path d="M4 12h15M14 6.5 19.5 12 14 17.5" /></svg>
);
export const ArrowLeft = (p: P) => (
  <svg {...base(p)}><path d="M20 12H5M10 6.5 4.5 12l5.5 5.5" /></svg>
);
export const ArrowDown = (p: P) => (
  <svg {...base(p)}><path d="M12 4v15M6.5 13.5 12 19l5.5-5.5" /></svg>
);
export const Menu = (p: P) => (
  <svg {...base(p)}><path d="M3.5 8h17M3.5 16h17" /></svg>
);
export const Close = (p: P) => (
  <svg {...base(p)}><path d="m5.5 5.5 13 13M18.5 5.5l-13 13" /></svg>
);
export const Plus = (p: P) => (
  <svg {...base(p)}><path d="M12 4.5v15M4.5 12h15" /></svg>
);
export const Minus = (p: P) => (
  <svg {...base(p)}><path d="M4.5 12h15" /></svg>
);
export const Check = (p: P) => (
  <svg {...base(p)}><path d="m4.5 12.5 4.5 4.5 10.5-10.5" /></svg>
);
export const Upload = (p: P) => (
  <svg {...base(p)}><path d="M12 15.5V4M7 8.5 12 3.5l5 5M4 14v5.5h16V14" /></svg>
);
export const Image = (p: P) => (
  <svg {...base(p)}><path d="M3.5 5h17v14h-17zM3.5 16l5-5 4 4 3-3 5 5" /><circle cx="15.5" cy="8.5" r="1.25" /></svg>
);
export const Download = (p: P) => (
  <svg {...base(p)}><path d="M12 3.5V15M7 10l5 5 5-5M4 19.5h16" /></svg>
);
export const Refresh = (p: P) => (
  <svg {...base(p)}><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4.5H15" /></svg>
);
export const Sliders = (p: P) => (
  <svg {...base(p)}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><path d="M14 4.5v5h4v-5zM8 14.5v5h4v-5z" /></svg>
);
export const Lock = (p: P) => (
  <svg {...base(p)}><path d="M5.5 10.5h13v9h-13zM8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" /></svg>
);
export const ChevronLeft = (p: P) => (
  <svg {...base(p)}><path d="m14.5 5.5-6.5 6.5 6.5 6.5" /></svg>
);
export const ChevronRight = (p: P) => (
  <svg {...base(p)}><path d="m9.5 5.5 6.5 6.5-6.5 6.5" /></svg>
);

/** WhatsApp mark (brand glyph, filled). */
export const WhatsApp = ({ size = 18, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable={false} {...p}>
    <path d="M12.04 2.5a9.43 9.43 0 0 0-8.1 14.27L2.5 21.5l4.87-1.4A9.43 9.43 0 1 0 12.04 2.5Zm0 17.2a7.77 7.77 0 0 1-3.96-1.08l-.28-.17-2.89.83.84-2.81-.18-.29a7.77 7.77 0 1 1 6.47 3.52Zm4.27-5.82c-.23-.12-1.38-.68-1.6-.76-.21-.08-.37-.12-.53.12-.15.23-.6.76-.74.92-.14.15-.27.17-.5.06-.23-.12-.98-.36-1.87-1.15a7 7 0 0 1-1.29-1.6c-.14-.24-.02-.36.1-.48.1-.1.23-.27.35-.4.11-.14.15-.24.23-.4.08-.15.04-.29-.02-.4-.06-.12-.53-1.27-.72-1.74-.19-.46-.38-.4-.53-.4h-.45a.86.86 0 0 0-.62.29c-.21.23-.82.8-.82 1.95s.84 2.26.96 2.42c.12.15 1.65 2.52 4 3.53.56.24 1 .39 1.34.5.56.18 1.08.15 1.48.09.45-.07 1.38-.56 1.58-1.11.19-.55.19-1.02.13-1.11-.05-.1-.21-.16-.44-.27Z" />
  </svg>
);

import type { StyleId } from "@/config/site";

/** Os cards de estilo filtram a galeria e levam o visitante até ela. */
type Listener = (style: StyleId | null) => void;

const listeners = new Set<Listener>();

export function showStyle(style: StyleId | null) {
  listeners.forEach((listener) => listener(style));
  const target = document.getElementById("galeria");
  if (target) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
}

export function onShowStyle(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

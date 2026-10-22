import type { OccasionId } from "@/config/site";

/**
 * Canal mínimo entre os botões espalhados pela página (ocasiões da abertura,
 * "quero um parecido" da galeria) e o fluxo de pedido.
 */
export type OrderRequest = { occasion?: OccasionId; productId?: string };
type Listener = (request: OrderRequest) => void;

const listeners = new Set<Listener>();

export function requestOrder(request: OrderRequest = {}) {
  listeners.forEach((listener) => listener(request));
  const target = document.getElementById("personalize");
  if (target) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
}

export function onOrderRequest(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

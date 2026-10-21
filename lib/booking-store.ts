/**
 * Canal mínimo entre os botões "Agendar" espalhados pela página e o fluxo de
 * agendamento: avisa qual serviço foi pedido e rola até a seção.
 */
type Listener = (serviceId: string | null) => void;

const listeners = new Set<Listener>();

export function requestBooking(serviceId: string | null = null) {
  listeners.forEach((listener) => listener(serviceId));
  const target = document.getElementById("agendar");
  if (target) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
}

export function onBookingRequest(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

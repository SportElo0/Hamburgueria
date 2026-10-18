import type { Vehicle } from "@/content/types";

/** Returns a wa.me link, or null when no official number is configured. */
export function whatsappUrl(number: string, message: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function vehicleLabel(v: Pick<Vehicle, "maker" | "model" | "chassis" | "yearLabel">): string {
  return `${v.maker} ${v.model} ${v.chassis} (${v.yearLabel})`;
}

/** Journey A: buying a car from the collection. */
export function interestMessage(v: Pick<Vehicle, "maker" | "model" | "chassis" | "yearLabel" | "slug">, siteUrl: string) {
  return `Olá, Mercantil. Tenho interesse no ${vehicleLabel(v)}. Gostaria de saber mais sobre o carro e a situação atual.\n${siteUrl}/acervo/${v.slug}`;
}

/** Journey B: restoring the visitor's own car. */
export function restorationMessage(opts: { car?: string; services?: string[]; note?: string }) {
  const lines = ["Olá, Mercantil. Gostaria de solicitar uma avaliação de restauração."];
  if (opts.car) lines.push(`Carro: ${opts.car}`);
  if (opts.services?.length) lines.push(`Interesse: ${opts.services.join(", ")}`);
  if (opts.note) lines.push(opts.note);
  return lines.join("\n");
}

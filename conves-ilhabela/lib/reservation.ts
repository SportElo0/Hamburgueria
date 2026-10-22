import { site } from "@/config/site";
import { formatShortDate, formatTime, type ISODate } from "@/lib/dates";

/** Remove caracteres de controle e espaços repetidos; mantém acentos e emojis. */
export function cleanText(value: string, { multiline = false } = {}): string {
  const withoutControl = value.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, " ");
  if (multiline) {
    return withoutControl
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n");
  }
  return withoutControl.replace(/\s+/g, " ").trim();
}

export function validateName(value: string): string | null {
  const name = cleanText(value);
  if (!name) return "Escreva seu nome para o restaurante saber quem está pedindo.";
  if (name.length < 2) return "O nome precisa ter pelo menos 2 letras.";
  if (!/\p{L}/u.test(name)) return "Use letras no nome.";
  return null;
}

export type ReservationDraft = {
  name: string;
  date: ISODate | null;
  time: string | null;
  guests: number;
  notes: string;
};

export function buildReservationMessage(d: ReservationDraft): string {
  const lines = [
    `Nome: ${cleanText(d.name)}`,
    d.date ? `Data desejada: ${formatShortDate(d.date)}` : null,
    d.time ? `Horário: ${formatTime(d.time)}` : null,
    `Pessoas: ${d.guests}`,
  ];
  const notes = cleanText(d.notes, { multiline: true });
  if (notes) lines.push(`Observação: ${notes}`);
  return [
    "Olá! Vim pelo site do Restaurante Convés e gostaria de consultar a disponibilidade de uma mesa.",
    "",
    ...lines.filter(Boolean),
    "",
    "Vocês conseguem confirmar a disponibilidade?",
  ].join("\n");
}

export type EventDraft = {
  name: string;
  type: string;
  date: ISODate | null;
  guests: string;
  notes: string;
};

export function buildEventMessage(d: EventDraft): string {
  const lines = [`Nome: ${cleanText(d.name)}`, `Tipo de evento: ${cleanText(d.type)}`];
  if (d.date) lines.push(`Data pretendida: ${formatShortDate(d.date)}`);
  const guests = d.guests.replace(/\D/g, "");
  if (guests) lines.push(`Convidados (aproximadamente): ${Number(guests)}`);
  const notes = cleanText(d.notes, { multiline: true });
  if (notes) lines.push(`Observações: ${notes}`);
  return [
    "Olá! Vim pelo site do Restaurante Convés e gostaria de pedir informações sobre um evento.",
    "",
    ...lines,
    "",
    "Vocês podem me passar as possibilidades e a disponibilidade?",
  ].join("\n");
}

/** Canal da solicitação: WhatsApp só quando configurado; senão, ligação. */
export function contactChannel(message: string) {
  if (site.whatsapp) {
    return {
      kind: "whatsapp" as const,
      href: `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`,
    };
  }
  return { kind: "phone" as const, href: `tel:${site.phone.e164}` };
}

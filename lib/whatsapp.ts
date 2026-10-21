import { site } from "@/config/site";
import { formatLongDate } from "@/lib/schedule";

export type BookingRequest = {
  name: string;
  serviceName: string;
  date: string;
  time: string;
  notes?: string;
};

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

export function buildBookingMessage(req: BookingRequest): string {
  const name = cleanText(req.name);
  const notes = req.notes ? cleanText(req.notes, { multiline: true }) : "";
  const lines = [
    `Olá, ${site.barberFirstName}! Vim pelo site da ${site.name} e gostaria de solicitar um agendamento.`,
    "",
    `Nome: ${name}`,
    `Serviço: ${req.serviceName}`,
    `Data desejada: ${formatLongDate(req.date)}`,
    `Horário de preferência: ${req.time}`,
  ];
  if (notes) lines.push(`Observações: ${notes}`);
  lines.push("", "Você consegue confirmar esse horário?");
  return lines.join("\n");
}

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${site.whatsapp.number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const greetingLink = whatsappLink(
  `Olá, ${site.barberFirstName}! Vim pelo site da ${site.name}.`,
);

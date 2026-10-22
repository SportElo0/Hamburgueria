import { occasionById, productById, site, type OccasionId } from "@/config/site";
import { formatShortDate, type ISODate } from "@/lib/dates";

export type StyleChoice =
  | { kind: "reference"; productId: string }
  | { kind: "custom" }
  | { kind: "suggest" };

export type OrderDraft = {
  occasion: OccasionId | null;
  occasionOther: string;
  style: StyleChoice | null;
  guests: string;
  theme: string;
  flavor: string;
  cakeMessage: string;
  notes: string;
  date: ISODate | null;
  name: string;
};

export const emptyDraft: OrderDraft = {
  occasion: null,
  occasionOther: "",
  style: null,
  guests: "",
  theme: "",
  flavor: "",
  cakeMessage: "",
  notes: "",
  date: null,
  name: "",
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

export function guestsNumber(value: string): number | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return n >= 1 && n <= site.order.maxGuests ? n : null;
}

/** Texto da ocasião como aparece no resumo e na mensagem. */
export function occasionLabel(draft: OrderDraft): string | null {
  const occasion = occasionById(draft.occasion);
  if (!occasion) return null;
  if (occasion.id === "outra") {
    const other = cleanText(draft.occasionOther);
    return other || occasion.name;
  }
  return occasion.name;
}

export function styleLabel(style: StyleChoice | null): string | null {
  if (!style) return null;
  if (style.kind === "custom") return "Personalizado (vou explicar a ideia)";
  if (style.kind === "suggest") return "Ainda não sei, gostaria de sugestões";
  const product = productById(style.productId);
  return product ? `${product.name} (referência da galeria do site)` : null;
}

export function validateName(value: string): string | null {
  const name = cleanText(value);
  if (!name) return "Escreva seu nome para a Regiane saber com quem está falando.";
  if (name.length < 2) return "O nome precisa ter pelo menos 2 letras.";
  if (!/\p{L}/u.test(name)) return "Use letras no nome.";
  return null;
}

/** Monta a mensagem do WhatsApp só com o que a cliente realmente preencheu. */
export function buildOrderMessage(draft: OrderDraft): string {
  const lines: string[] = [];
  const add = (label: string, value: string | null | undefined) => {
    const text = value ? cleanText(value) : "";
    if (text) lines.push(`${label}: ${text}`);
  };

  add("Meu nome", draft.name);
  add("Ocasião", occasionLabel(draft));
  add("Estilo", styleLabel(draft.style));
  const guests = guestsNumber(draft.guests);
  if (guests) lines.push(`Quantidade aproximada: ${guests} ${guests === 1 ? "pessoa" : "pessoas"}`);
  add("Tema ou decoração", draft.theme);
  add("Sabor ou recheio de preferência", draft.flavor);
  add("Mensagem no bolo", draft.cakeMessage);
  if (draft.date) lines.push(`Data desejada: ${formatShortDate(draft.date)}`);
  const notes = cleanText(draft.notes, { multiline: true });
  if (notes) lines.push(`Observações: ${notes}`);

  return [
    `Olá, ${site.ownerFirstName}! Tudo bem? Conheci seu trabalho pelo site e gostaria de solicitar um orçamento.`,
    "",
    ...lines,
    "",
    "Você consegue me informar as possibilidades e os valores?",
  ].join("\n");
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export const greetingLink = whatsappLink(
  `Olá, ${site.ownerFirstName}! Vim pelo site e gostaria de falar sobre uma encomenda.`,
);

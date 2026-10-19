export const SITE = {
  name: "Villa Verano",
  fullName: "Pousada Villa Verano",
  tagline: "Uma pousada à beira do verde, em Paraty",
  whatsappNumber: "5511999887127",
  phoneDisplay: "(24) 3371-1819",
  address: {
    line1: "R. Guapuruvu, 193 — Caborê",
    line2: "Paraty - RJ, CEP 23.970-000",
    mapsQuery: "R. Guapuruvu, 193 - Caborê, Paraty - RJ, 23970-000",
  },
  instagram: "villaveranopousada",
  rating: { score: "4,7", count: 163 },
  stars: 3,
} as const;

export function whatsappLink(message: string): string {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function mapsLink(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.address.mapsQuery)}`;
}

export interface RoomType {
  id: string;
  name: string;
  capacity: string;
  bed: string;
  highlights: string[];
}

export const ROOM_TYPES: RoomType[] = [
  {
    id: "casal-deluxe",
    name: "Quarto de Casal Deluxe",
    capacity: "Até 2 pessoas",
    bed: "1 cama king size",
    highlights: ["Vista para o jardim", "Varanda térrea", "Ar-condicionado", "Frigobar"],
  },
  {
    id: "tres-pessoas-deluxe",
    name: "Quarto para Três Pessoas Deluxe",
    capacity: "Até 3 pessoas",
    bed: "1 cama king size + cama extra",
    highlights: ["Ar-condicionado", "TV de tela plana", "Frigobar"],
  },
  {
    id: "quatro-pessoas",
    name: "Quarto para Quatro Pessoas",
    capacity: "Até 4 pessoas",
    bed: "1 cama de casal + camas extras",
    highlights: ["Vista para o jardim", "Ar-condicionado", "Ideal para família"],
  },
];

export const AMENITIES = [
  "Piscina ao ar livre",
  "Jardim e terraço",
  "Café da manhã no terraço",
  "Wi-Fi gratuito",
  "Estacionamento privativo gratuito",
  "Aceita pets",
  "Ar-condicionado em todos os quartos",
  "A 5 minutos do Centro Histórico",
] as const;

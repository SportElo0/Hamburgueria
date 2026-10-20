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
  photo: string;
}

export const ROOM_TYPES: RoomType[] = [
  {
    id: "casal-deluxe",
    name: "Quarto de Casal Deluxe",
    capacity: "Até 2 pessoas",
    bed: "1 cama king size",
    highlights: ["Vista para o jardim", "Varanda térrea", "Ar-condicionado", "Frigobar"],
    photo: "/images/quarto-verde-graded.jpg",
  },
  {
    id: "tres-pessoas-deluxe",
    name: "Quarto para Três Pessoas Deluxe",
    capacity: "Até 3 pessoas",
    bed: "1 cama king size + cama extra",
    highlights: ["Ar-condicionado", "TV de tela plana", "Frigobar"],
    photo: "/images/quarto-amarelo-graded.jpg",
  },
  {
    id: "quatro-pessoas",
    name: "Quarto para Quatro Pessoas",
    capacity: "Até 4 pessoas",
    bed: "1 cama de casal + camas extras",
    highlights: ["Vista para o jardim", "Ar-condicionado", "Ideal para família"],
    photo: "/images/piscina-graded.jpg",
  },
];

export type AmenityIcon = "pool" | "garden" | "breakfast" | "wifi" | "parking" | "pet" | "ac" | "pin";

export const AMENITIES: { label: string; icon: AmenityIcon }[] = [
  { label: "Piscina ao ar livre", icon: "pool" },
  { label: "Jardim e terraço", icon: "garden" },
  { label: "Café da manhã no terraço", icon: "breakfast" },
  { label: "Wi-Fi gratuito", icon: "wifi" },
  { label: "Estacionamento privativo gratuito", icon: "parking" },
  { label: "Aceita pets", icon: "pet" },
  { label: "Ar-condicionado em todos os quartos", icon: "ac" },
  { label: "A 5 minutos do Centro Histórico", icon: "pin" },
];

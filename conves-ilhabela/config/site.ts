/**
 * Dados do Convés em um só lugar. Só entra o que foi informado ou confirmado;
 * o que falta fica null e o site não inventa (horários, WhatsApp, nota do Google).
 */

export type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** object-position (ex.: "50% 40%"). */
  focus?: string;
  /** Crédito mostrado junto da foto enquanto ela não for oficial. */
  credit: string | null;
  /** true enquanto a foto não for oficial do restaurante (trocar). */
  provisional: boolean;
};

export const photos = {
  gramado: {
    src: "/fotos/gramado-mar.jpg",
    alt: "Gramado com caminho de pedra, árvores e bananeiras, mesas ao ar livre e o canal de Ilhabela com montanhas ao fundo",
    width: 1755,
    height: 885,
    focus: "40% 55%",
    credit: "Foto: Deia Domitti, via Google",
    provisional: true,
  },
  varanda: {
    src: "/fotos/varanda.jpg",
    alt: "Varanda coberta com forro de madeira, pilares de pedra com arandelas, um tronco de árvore atravessando o deck e mesas de madeira voltadas para a água",
    width: 1755,
    height: 1098,
    focus: "50% 55%",
    credit: "Foto: Ramon Silva, via Google",
    provisional: true,
  },
} satisfies Record<string, Photo>;

export const site = {
  name: "Restaurante Convés Ilhabela",
  shortName: "Convés",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://conves-ilhabela.vercel.app",
  /** Enquanto for proposta não contratada, o site se identifica como demonstração. */
  demo: true,
  phone: { e164: "+551238962058", display: "(12) 3896-2058" },
  /**
   * WhatsApp para solicitações: deixe null até o restaurante confirmar o número.
   * Com null, a reserva termina em "Ligar" + "Copiar mensagem".
   */
  whatsapp: null as { number: string; display: string } | null,
  instagram: { handle: "@convesilhabela", url: "https://www.instagram.com/convesilhabela/" },
  address: {
    street: "Av. São João, 198",
    neighborhood: "Perequê",
    city: "Ilhabela",
    state: "SP",
    zip: "11630-000",
  },
  links: {
    directions:
      "https://www.google.com/maps/dir/?api=1&destination=Restaurante%20Conv%C3%A9s%2C%20Av.%20S%C3%A3o%20Jo%C3%A3o%2C%20198%2C%20Perequ%C3%AA%2C%20Ilhabela%20-%20SP",
    reviews:
      "https://www.google.com/maps/search/?api=1&query=Restaurante%20Conv%C3%A9s%20Ilhabela%20Av.%20S%C3%A3o%20Jo%C3%A3o%20198",
    mapEmbed:
      "https://www.google.com/maps?q=Restaurante%20Conv%C3%A9s%2C%20Av.%20S%C3%A3o%20Jo%C3%A3o%2C%20198%2C%20Perequ%C3%AA%2C%20Ilhabela%20-%20SP&output=embed",
  },
  /** Horários: não confirmados. Preencha com linhas como { days: "Ter a dom", time: "12h às 22h" }. */
  hours: null as { days: string; time: string }[] | null,
  /**
   * Nota do Google: as capturas indicavam cerca de 4,7 e 2,1 mil avaliações,
   * sem verificação. Preencha com os valores conferidos e a data para exibir.
   */
  rating: null as { value: number; count: string; checkedAt: string } | null,
  timezone: "America/Sao_Paulo",
  reservation: {
    maxDaysAhead: 120,
    minGuests: 1,
    maxGuests: 40,
    nameMaxLength: 40,
    notesMaxLength: 240,
    /** Horários de preferência sugeridos (não são vagas). Ajuste quando os horários forem confirmados. */
    times: ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "19:00", "19:30", "20:00", "20:30", "21:00"],
  },
  events: {
    types: ["Aniversário", "Confraternização", "Encontro de família", "Evento de empresa", "Outro"],
    maxGuests: 500,
  },
  hero: {
    label: "Ilhabela • Perequê • Gastronomia à beira-mar",
    headline: ["O sabor de Ilhabela.", "A beleza do mar."],
    subtitle:
      "Sabores da culinária brasileira em um ambiente especial, cercado pela natureza e pela paisagem de Ilhabela.",
  },
};

export const nav = [
  { href: "#inicio", label: "Início" },
  { href: "#o-conves", label: "O Convés" },
  { href: "#cardapio", label: "Cardápio" },
  { href: "#experiencia", label: "Experiência" },
  { href: "#galeria", label: "Galeria" },
  { href: "#eventos", label: "Eventos" },
  { href: "#contato", label: "Contato" },
];

export const fullAddress = `${site.address.street} — ${site.address.neighborhood}, ${site.address.city} — ${site.address.state}, ${site.address.zip}`;

export type GalleryTile = {
  id: string;
  photo: Photo;
  /** Recorte de detalhe: foco e ampliação sobre a foto inteira. */
  focus: string;
  zoom: number;
  caption: string;
};

/**
 * Galeria: as duas fotos inteiras e detalhes recortados delas. Troque pelas
 * fotos oficiais do restaurante (ambiente, pratos, detalhes) quando chegarem.
 */
export const gallery: GalleryTile[] = [
  { id: "gramado", photo: photos.gramado, focus: "50% 55%", zoom: 1, caption: "O gramado, as mesas e o canal" },
  { id: "tronco", photo: photos.varanda, focus: "2% 45%", zoom: 2.6, caption: "A árvore que atravessa o deck" },
  { id: "pilar", photo: photos.varanda, focus: "28% 66%", zoom: 3.2, caption: "Pilares de pedra e arandelas" },
  { id: "varanda", photo: photos.varanda, focus: "18% 55%", zoom: 1, caption: "A varanda coberta de madeira" },
  { id: "canal", photo: photos.gramado, focus: "12% 62%", zoom: 2.2, caption: "O canal e as montanhas no horizonte" },
  { id: "bananeiras", photo: photos.gramado, focus: "92% 40%", zoom: 1.9, caption: "Bananeiras e sombra" },
];

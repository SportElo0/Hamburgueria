/**
 * LM Barbearia — configuração central do site.
 *
 * Tudo que o proprietário pode precisar mudar (WhatsApp, horários, serviços,
 * preços, fotos, textos provisórios, links) fica aqui. Os componentes só leem
 * este arquivo. Veja o README para o passo a passo de cada alteração.
 *
 * Itens marcados com "PENDENTE" precisam de confirmação do Leonardo antes de
 * publicar. O comando `npm run check:config` lista tudo o que falta.
 */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = domingo

export type DayHours = { open: string; close: string } | null;

export type Service = {
  id: string;
  name: string;
  /** Nome curto usado nos botões rápidos do topo da página. */
  shortName: string;
  description: string;
  /** Preço em reais. `null` = não informado (o site mostra "valor no WhatsApp"). */
  price: number | null;
  /** Duração em minutos. `null` = não informada (não aparece no site). */
  durationMinutes: number | null;
  /** Foto do card. `null` = card tipográfico (sem foto). */
  photo: Photo | null;
};

export type Photo = {
  /** Caminho dentro de /public, ex.: "/fotos/degrade-01.jpg". `null` = placeholder. */
  src: string | null;
  alt: string;
  /** Legenda curta exibida na galeria. */
  caption: string;
  width?: number;
  height?: number;
  /** Ponto de foco do recorte (CSS object-position), ex.: "50% 30%". */
  focus?: string;
  /**
   * PENDENTE quando `true`: a foto veio de captura de tela (Google/Instagram)
   * e deve ser trocada pelo arquivo original em alta resolução.
   */
  fromScreenshot?: boolean;
};

/**
 * Fotos reais do trabalho do Leonardo, recortadas das capturas de tela do
 * perfil da barbearia no Google e do Instagram @lm_barbearia130.
 * Troque cada arquivo pelo original em alta (mesmo nome) quando possível.
 */
export const photos = {
  lowFadeRisca: {
    src: "/fotos/low-fade-risca.jpg",
    alt: "Low fade com risca lateral e topo penteado, visto de perfil",
    caption: "Low fade com risca",
    width: 760,
    height: 892,
    focus: "55% 35%",
    fromScreenshot: true,
  },
  riscaLateral: {
    src: "/fotos/risca-lateral.jpg",
    alt: "Degradê com risca lateral marcada, visto de perfil",
    caption: "Degradê com risca",
    width: 760,
    height: 895,
    focus: "60% 40%",
    fromScreenshot: true,
  },
  desenhoNuca: {
    src: "/fotos/desenho-nuca.jpg",
    alt: "Desenho feito na máquina na nuca, com contorno limpo",
    caption: "Desenho na nuca",
    width: 776,
    height: 1072,
    focus: "60% 40%",
    fromScreenshot: true,
  },
  riscaLoiro: {
    src: "/fotos/risca-loiro.jpg",
    alt: "Cabelo cacheado descolorido com degradê e risca desenhada",
    caption: "Degradê com desenho",
    width: 760,
    height: 895,
    focus: "40% 30%",
    fromScreenshot: true,
  },
  barba: {
    src: "/fotos/barba.jpg",
    alt: "Cliente com barba grisalha alinhada, sentado na cadeira",
    caption: "Barba alinhada",
    width: 404,
    height: 640,
    focus: "50% 35%",
    fromScreenshot: true,
  },
  leonardo: {
    src: "/fotos/leonardo-atendendo.jpg",
    alt: "Leonardo Miguel sorrindo enquanto corta o cabelo de um cliente",
    caption: "Leonardo atendendo",
    width: 404,
    height: 552,
    focus: "40% 40%",
    fromScreenshot: true,
  },
  cacheado: {
    src: "/fotos/cacheado.jpg",
    alt: "Cabelo cacheado com degradê nas laterais, visto de trás",
    caption: "Cacheado com degradê",
    width: 404,
    height: 552,
    focus: "50% 35%",
    fromScreenshot: true,
  },
  degradeSocial: {
    src: "/fotos/degrade-social.jpg",
    alt: "Degradê com topo penteado para trás e barba rente, visto de perfil",
    caption: "Degradê e topo para trás",
    width: 404,
    height: 552,
    focus: "60% 40%",
    fromScreenshot: true,
  },
  lowFadeInfantil: {
    src: "/fotos/low-fade-infantil.jpg",
    alt: "Low fade em cabelo liso infantil, visto de perfil",
    caption: "Low fade",
    width: 404,
    height: 640,
    focus: "60% 45%",
    fromScreenshot: true,
  },
} satisfies Record<string, Photo>;

export const site = {
  name: "LM Barbearia",
  legalName: "LM Barbearia — Leonardo Miguel",
  barber: "Leonardo Miguel",
  barberFirstName: "Leonardo",
  since: 2024, // consta no selo do logotipo ("Desde 2024")
  copyrightYear: 2026,

  /** URL pública definitiva. Pode ser sobrescrita por NEXT_PUBLIC_SITE_URL na Vercel. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://lm-barbearia.vercel.app",

  whatsapp: {
    /** Somente dígitos, com DDI 55 + DDD. Usado no link wa.me. */
    number: "5511913392818",
    display: "(11) 91339-2818",
  },

  instagram: {
    handle: "lm_barbearia130",
    url: "https://www.instagram.com/lm_barbearia130/",
  },

  address: {
    street: "Rua Cotovia, 130",
    neighborhood: "Campanário",
    city: "Diadema",
    state: "SP",
    postalCode: "09931-530",
    country: "BR",
    /** Coordenadas aproximadas. PENDENTE: conferir no Google Maps antes de usar em SEO. */
    geo: null as { lat: number; lng: number } | null,
  },

  links: {
    /** Abre o perfil da barbearia no Google Maps (avaliações, fotos, rotas). */
    googleProfile:
      "https://www.google.com/maps/search/?api=1&query=LM+Barbearia+Rua+Cotovia+130+Campan%C3%A1rio+Diadema",
    directions:
      "https://www.google.com/maps/dir/?api=1&destination=Rua+Cotovia%2C+130+-+Campan%C3%A1rio%2C+Diadema+-+SP%2C+09931-530",
    mapEmbed:
      "https://www.google.com/maps?q=Rua+Cotovia,+130+-+Campan%C3%A1rio,+Diadema+-+SP,+09931-530&output=embed",
  },

  /**
   * Horários de funcionamento.
   * PENDENTE: o Instagram e o Google mostram horários diferentes. Os valores
   * abaixo vêm da bio do Instagram (Terça a sábado 10:00–20:00, domingo
   * 10:00–16:00). Depois que o Leonardo confirmar, ajuste e mude
   * `confirmed` para `true`.
   */
  hours: {
    confirmed: false,
    source: "Bio do Instagram @lm_barbearia130 (outubro de 2026)",
    timezone: "America/Sao_Paulo",
    week: {
      0: { open: "10:00", close: "16:00" },
      1: null,
      2: { open: "10:00", close: "20:00" },
      3: { open: "10:00", close: "20:00" },
      4: { open: "10:00", close: "20:00" },
      5: { open: "10:00", close: "20:00" },
      6: { open: "10:00", close: "20:00" },
    } satisfies Record<Weekday, DayHours>,
  },

  booking: {
    /** Quantos dias à frente o calendário mostra. */
    daysAhead: 45,
    /** Intervalo entre os horários de preferência sugeridos, em minutos. */
    slotIntervalMinutes: 30,
    /** Último horário sugerido = fechamento menos este valor. */
    lastSlotBeforeCloseMinutes: 30,
    /** Para pedidos no mesmo dia, esconde horários mais próximos que isto. */
    minNoticeMinutes: 60,
    nameMaxLength: 40,
    notesMaxLength: 240,
  },

  /**
   * Serviços. Os quatro primeiros estão no material de divulgação da
   * barbearia; "Corte + Barba" foi pedido para o site.
   * PENDENTE: preços e durações. Enquanto `price` for `null`, o site diz que o
   * valor é informado pelo WhatsApp.
   */
  services: [
    {
      id: "corte",
      name: "Corte masculino",
      shortName: "Corte",
      description:
        "Degradê, social, tesoura ou máquina. Você fala como gosta e o corte é feito com calma, do contorno ao acabamento.",
      price: null,
      durationMinutes: null,
      photo: photos.riscaLateral,
    },
    {
      id: "barba",
      name: "Barba",
      shortName: "Barba",
      description:
        "Desenho, alinhamento e acabamento da barba, respeitando o formato do seu rosto.",
      price: null,
      durationMinutes: null,
      photo: photos.barba,
    },
    {
      id: "corte-barba",
      name: "Corte + Barba",
      shortName: "Corte + Barba",
      description: "Os dois serviços no mesmo horário, para sair com o visual inteiro alinhado.",
      price: null,
      durationMinutes: null,
      photo: photos.degradeSocial,
    },
    {
      id: "sobrancelha",
      name: "Sobrancelha",
      shortName: "Sobrancelha",
      description: "Limpeza e alinhamento discreto, para completar o corte sem exagero.",
      price: null,
      durationMinutes: null,
      photo: null,
    },
    {
      id: "navalha",
      name: "Acabamento na navalha",
      shortName: "Navalha",
      description:
        "Contorno e pezinho na navalha para deixar a linha limpa e o degradê mais marcado.",
      price: null,
      durationMinutes: null,
      photo: photos.desenhoNuca,
    },
  ] as Service[],

  /**
   * Galeria "Nossos cortes": somente fotos reais do trabalho do Leonardo.
   * A ordem define o layout (as primeiras ocupam os espaços maiores).
   */
  gallery: [
    photos.riscaLateral,
    photos.desenhoNuca,
    photos.riscaLoiro,
    photos.cacheado,
    photos.lowFadeRisca,
    photos.barba,
    photos.degradeSocial,
    photos.lowFadeInfantil,
  ] as Photo[],

  hero: {
    /** Cada item é uma linha; o trecho em `accent` aparece em champanhe. */
    headline: [{ text: "Seu estilo." }, { text: "Nossa ", accent: "precisão." }],
    subtitle: "Corte, barba e acabamento na navalha com o Leonardo Miguel, no Campanário.",
    photo: photos.lowFadeRisca as Photo,
  },

  about: {
    /** `true` mostra a etiqueta "texto provisório" até o Leonardo aprovar. */
    draft: true,
    title: "Quem atende é o Leonardo.",
    paragraphs: [
      "Na LM Barbearia, o corte é feito pelo próprio Leonardo Miguel, do começo ao fim. Antes de pegar a máquina, ele pergunta como você gosta e o que quer mudar.",
      "O foco está no que aparece no espelho: degradê bem marcado, contorno limpo na navalha e barba alinhada. Sem pressa.",
    ],
    commitments: [
      "Atendimento com hora marcada pelo WhatsApp",
      "Conversa antes do corte",
      "Acabamento na navalha",
    ],
    photo: photos.leonardo as Photo,
  },

  /**
   * Avaliações. Números copiados do Google Maps em 21/10/2026.
   * Não são atualizados automaticamente: revise periodicamente ou remova.
   * Depoimentos individuais só com autorização (lista vazia por enquanto).
   */
  reviews: {
    show: true,
    platform: "Google",
    rating: 5.0,
    count: 16,
    checkedAt: "2026-10-21",
    testimonials: [] as { author: string; text: string; date: string }[],
  },

  /** Créditos discretos no rodapé. `null` = não exibir. */
  credit: null as { label: string; href?: string } | null,
};

export type SiteConfig = typeof site;

export const nav = [
  { href: "#inicio", label: "Início" },
  { href: "#servicos", label: "Serviços" },
  { href: "#cortes", label: "Nossos cortes" },
  { href: "#sobre", label: "Sobre" },
  { href: "#localizacao", label: "Localização" },
] as const;

export const weekdayNames = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export const fullAddress = `${site.address.street} — ${site.address.neighborhood}, ${site.address.city} — ${site.address.state}, ${site.address.postalCode}`;

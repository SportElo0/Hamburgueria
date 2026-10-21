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
  /** Faixa da escala do degradê destacada na marca visual do card (0 a 4). */
  mark: number[];
};

export type Photo = {
  /** Caminho dentro de /public, ex.: "/fotos/degrade-01.jpg". `null` = placeholder. */
  src: string | null;
  alt: string;
  /** Legenda curta exibida na galeria. */
  caption: string;
  width?: number;
  height?: number;
};

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
      mark: [0, 1, 2, 3, 4],
    },
    {
      id: "barba",
      name: "Barba",
      shortName: "Barba",
      description:
        "Desenho, alinhamento e acabamento da barba, respeitando o formato do seu rosto.",
      price: null,
      durationMinutes: null,
      mark: [0, 1],
    },
    {
      id: "corte-barba",
      name: "Corte + Barba",
      shortName: "Corte + Barba",
      description: "Os dois serviços no mesmo horário, para sair com o visual inteiro alinhado.",
      price: null,
      durationMinutes: null,
      mark: [0, 1, 2, 3, 4],
    },
    {
      id: "sobrancelha",
      name: "Sobrancelha",
      shortName: "Sobrancelha",
      description: "Limpeza e alinhamento discreto, para completar o corte sem exagero.",
      price: null,
      durationMinutes: null,
      mark: [4],
    },
    {
      id: "navalha",
      name: "Acabamento na navalha",
      shortName: "Navalha",
      description:
        "Contorno e pezinho na navalha para deixar a linha limpa e o degradê mais marcado.",
      price: null,
      durationMinutes: null,
      mark: [0],
    },
  ] as Service[],

  /**
   * Galeria "Nossos cortes".
   * PENDENTE: fotos reais autorizadas pelo Leonardo. Coloque os arquivos em
   * /public/fotos e preencha `src`, `width` e `height`. Enquanto `src` for
   * `null`, aparece um placeholder identificado como temporário.
   * As legendas abaixo são sugestões baseadas nos estilos do Instagram.
   */
  gallery: [
    { src: null, alt: "Degradê com risca lateral", caption: "Degradê com risca" },
    { src: null, alt: "Low fade com topo penteado para trás", caption: "Low fade" },
    { src: null, alt: "Barba alinhada com acabamento na navalha", caption: "Barba na navalha" },
    { src: null, alt: "Cabelo cacheado com degradê nas laterais", caption: "Cacheado + degradê" },
    { src: null, alt: "Desenho freestyle feito na máquina", caption: "Freestyle" },
    { src: null, alt: "Mid fade com franja texturizada", caption: "Mid fade" },
  ] as Photo[],

  hero: {
    headline: "O estilo começa no detalhe.",
    subtitle: "Cortes precisos, cuidado em cada detalhe e um atendimento do seu jeito.",
    /** PENDENTE: melhor foto de corte, de preferência vertical e bem iluminada. */
    photo: {
      src: null,
      alt: "Corte degradê feito na LM Barbearia",
      caption: "Foto principal",
    } satisfies Photo,
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
    /** PENDENTE: foto do Leonardo. */
    photo: {
      src: null,
      alt: "Leonardo Miguel, barbeiro da LM Barbearia",
      caption: "Foto do Leonardo",
    } satisfies Photo,
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

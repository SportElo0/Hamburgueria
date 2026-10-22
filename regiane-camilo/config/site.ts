/**
 * Dados da confeitaria em um só lugar.
 *
 * Tudo o que aparece no site sai daqui: contato, catálogo, fotos e textos.
 * Regra de ouro: só entra o que a Regiane confirmou. Campo sem informação
 * fica vazio (null ou []) e o site mostra "a combinar" ou "Consultar orçamento".
 */

export type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** object-position da foto inteira (ex.: "50% 40%"). */
  focus?: string;
  /** Recorte de detalhe usado nos cards de estilo: ponto de foco e ampliação. */
  detail?: { focus: string; zoom: number };
  /** true enquanto a foto vier de captura de tela do Instagram (trocar pelo original). */
  fromScreenshot: boolean;
};

export type StyleId = "tematicos" | "frutas" | "chocolate" | "frisos" | "cores" | "lacos";

export type Product = {
  id: string;
  name: string;
  style: StyleId;
  /** Descrição só do que aparece na foto. Nada de sabor ou recheio deduzido da imagem. */
  description: string;
  photo: Photo;
  /** Preço em reais. null = "Consultar orçamento". */
  price: number | null;
  sizes: string[];
  flavors: string[];
  fillings: string[];
  customization: string[];
  /** Ex.: "Sob encomenda". null = não informado. */
  availability: string | null;
  notes: string | null;
  featured: boolean;
};

const photos = {
  morangos: {
    src: "/fotos/morangos.jpg",
    alt: "Bolo branco com rosetas de creme claro e de chocolate, morangos inteiros, raspas de chocolate e calda escura escorrendo pela lateral",
    width: 1014,
    height: 1282,
    focus: "50% 45%",
    detail: { focus: "55% 30%", zoom: 1.7 },
    fromScreenshot: true,
  },
  mar: {
    src: "/fotos/mar.jpg",
    alt: "Bolo branco com frisos em espiral, decorado com estrela-do-mar, concha e pérolas claras",
    width: 1014,
    height: 1270,
    focus: "50% 55%",
    detail: { focus: "45% 38%", zoom: 1.9 },
    fromScreenshot: true,
  },
  azul: {
    src: "/fotos/azul.jpg",
    alt: "Bolo branco com topo em espiral, borda de bicos azuis e degradê azul na base",
    width: 1014,
    height: 1360,
    focus: "50% 60%",
    detail: { focus: "30% 55%", zoom: 1.8 },
    fromScreenshot: true,
  },
  brigadeiro: {
    src: "/fotos/brigadeiro.jpg",
    alt: "Bolo coberto de chocolate em babados, com granulado no topo e uma coroa de brigadeiros",
    width: 1014,
    height: 1360,
    focus: "50% 60%",
    detail: { focus: "50% 40%", zoom: 1.7 },
    fromScreenshot: true,
  },
  futebol: {
    src: "/fotos/futebol.jpg",
    alt: "Bolo temático de futebol com gramado verde feito no bico, jogadores, bola, chuteira, o número 9 e uma faixa com o nome Gabriel",
    width: 1014,
    height: 1013,
    focus: "50% 50%",
    detail: { focus: "45% 45%", zoom: 1.5 },
    fromScreenshot: true,
  },
  lacos: {
    src: "/fotos/lacos.jpg",
    alt: "Bolo branco com babados claros, pequenos corações rosa e azuis e laços de fita",
    width: 468,
    height: 520,
    focus: "50% 45%",
    detail: { focus: "50% 45%", zoom: 1.25 },
    fromScreenshot: true,
  },
} satisfies Record<string, Photo>;

/**
 * Estilos usados para organizar a vitrine. São uma proposta de organização
 * visual, não o catálogo oficial: confirmar com a Regiane antes de publicar.
 */
export const styles: { id: StyleId; name: string; hint: string; cover: Photo }[] = [
  { id: "tematicos", name: "Temáticos", hint: "O tema da festa no bolo", cover: photos.futebol },
  { id: "frutas", name: "Com frutas", hint: "Morangos e rosetas", cover: photos.morangos },
  { id: "chocolate", name: "Chocolate", hint: "Babados e brigadeiros", cover: photos.brigadeiro },
  { id: "frisos", name: "Frisos e texturas", hint: "Branco trabalhado", cover: photos.mar },
  { id: "cores", name: "Cores e degradês", hint: "Bicos e tons", cover: photos.azul },
  { id: "lacos", name: "Laços e delicadezas", hint: "Fitas e babados", cover: photos.lacos },
];

const base = {
  price: null,
  sizes: [],
  flavors: [],
  fillings: [],
  customization: [],
  availability: null,
  notes: null,
} satisfies Partial<Product>;

/** Os bolos da vitrine. Todos são trabalhos reais publicados no @re.camilo. */
export const products: Product[] = [
  {
    ...base,
    id: "morangos-rosetas",
    name: "Morangos e rosetas",
    style: "frutas",
    description:
      "Rosetas em creme claro e de chocolate, morangos inteiros, raspas de chocolate e calda escorrendo pela lateral branca.",
    photo: photos.morangos,
    featured: true,
  },
  {
    ...base,
    id: "marinho",
    name: "Marinho",
    style: "frisos",
    description: "Frisos brancos em espiral com estrela-do-mar, concha e pérolas.",
    photo: photos.mar,
    featured: true,
  },
  {
    ...base,
    id: "futebol",
    name: "Futebol",
    style: "tematicos",
    description:
      "Gramado verde feito no bico, jogadores, bola, chuteira, número e faixa com o nome do aniversariante.",
    photo: photos.futebol,
    featured: true,
  },
  {
    ...base,
    id: "brigadeiros",
    name: "Babados e brigadeiros",
    style: "chocolate",
    description: "Lateral em babados de chocolate, topo com granulado e uma coroa de brigadeiros.",
    photo: photos.brigadeiro,
    featured: true,
  },
  {
    ...base,
    id: "branco-azul",
    name: "Branco e azul",
    style: "cores",
    description: "Topo em espiral, borda de bicos azuis e degradê azul na base.",
    photo: photos.azul,
    featured: true,
  },
  {
    ...base,
    id: "lacos-coracoes",
    name: "Laços e corações",
    style: "lacos",
    description: "Babados claros, pequenos corações rosa e azuis e laços de fita.",
    photo: photos.lacos,
    featured: false,
  },
];

export type OccasionId = "aniversario" | "infantil" | "casamento" | "comemoracao" | "outra";

/** Ocasiões do pedido. Identificam o motivo; não garantem que o serviço seja oferecido. */
export const occasions: { id: OccasionId; name: string; phrase: string }[] = [
  { id: "aniversario", name: "Aniversário", phrase: "um aniversário" },
  { id: "infantil", name: "Festa infantil", phrase: "uma festa infantil" },
  { id: "casamento", name: "Casamento", phrase: "um casamento" },
  { id: "comemoracao", name: "Comemoração especial", phrase: "uma comemoração especial" },
  { id: "outra", name: "Outra ocasião", phrase: "outra ocasião" },
];

export const site = {
  name: "Bolos e Doces Regiane Camilo",
  shortName: "Regiane Camilo",
  owner: "Regiane Camilo",
  ownerFirstName: "Regiane",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://regiane-camilo.vercel.app",
  /** Enquanto for proposta não contratada, o site se identifica como demonstração. */
  demo: true,
  tagline: "Momentos especiais merecem um bolo especial.",
  whatsapp: {
    number: "5512996258593",
    display: "(12) 99625-8593",
  },
  instagram: {
    handle: "@re.camilo",
    url: "https://www.instagram.com/re.camilo/",
    /** Conferido no perfil em 21/10/2026. Atualize ou apague (null). */
    posts: { count: 3190, checkedAt: "2026-10-21" } as { count: number; checkedAt: string } | null,
  },
  address: {
    street: "Rua José Ferro, 307",
    city: "São Sebastião",
    state: "SP",
    /** Fonte do endereço, mostrada junto dele. */
    source: "Endereço informado no Instagram.",
  },
  links: {
    directions:
      "https://www.google.com/maps/dir/?api=1&destination=Rua%20Jos%C3%A9%20Ferro%2C%20307%2C%20S%C3%A3o%20Sebasti%C3%A3o%20-%20SP",
    mapEmbed:
      "https://www.google.com/maps?q=Rua%20Jos%C3%A9%20Ferro%2C%20307%2C%20S%C3%A3o%20Sebasti%C3%A3o%20-%20SP&output=embed",
  },
  /** Horário de atendimento: não informado. Preencha só quando a Regiane confirmar. */
  hours: null as string | null,
  timezone: "America/Sao_Paulo",
  order: {
    /** Primeira data aceita no calendário, em dias a partir de hoje. Ajuste com a antecedência real. */
    minDaysAhead: 1,
    maxDaysAhead: 365,
    nameMaxLength: 40,
    textMaxLength: 80,
    notesMaxLength: 300,
    maxGuests: 500,
  },
  hero: {
    label: "Bolos para momentos especiais",
    headline: { before: "Cada celebração merece um toque de ", accent: "doçura", after: "." },
    subtitle: "Bolos feitos para transformar seus momentos especiais em lembranças ainda mais doces.",
    photo: photos.morangos,
  },
  about: {
    /** true até a Regiane revisar e aprovar o texto. */
    draft: true,
    title: "Por trás de cada criação, uma história.",
    paragraphs: [
      "A Regiane Camilo faz bolos e doces sob encomenda em São Sebastião, no litoral de São Paulo.",
      "Cada pedido começa numa conversa: a ocasião, o tema, quantas pessoas, a data. A partir daí ela pensa a decoração, dos frisos às rosetas, das cores aos detalhes, para o bolo combinar com a festa.",
      "Os bolos desta página são trabalhos dela, publicados no Instagram. Se algum chamou sua atenção, ele pode ser o ponto de partida do seu pedido.",
    ],
  },
};

export const nav = [
  { href: "#inicio", label: "Início" },
  { href: "#bolos", label: "Nossos Bolos" },
  { href: "#personalize", label: "Personalize" },
  { href: "#galeria", label: "Galeria" },
  { href: "#sobre", label: "Sobre" },
  { href: "#contato", label: "Contato" },
];

export const fullAddress = `${site.address.street} — ${site.address.city}, ${site.address.state}`;

export function productById(id: string | null | undefined): Product | undefined {
  return products.find((p) => p.id === id);
}

export function occasionById(id: string | null | undefined) {
  return occasions.find((o) => o.id === id);
}

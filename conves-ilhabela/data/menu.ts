/**
 * Cardápio do Convés em um só lugar.
 *
 * Fonte desta versão: fotos do cardápio impresso publicadas em avaliações do
 * Google (cerca de abril de 2026) e o card de pratos promocionais. Nada foi
 * confirmado pelo restaurante. A grafia foi normalizada (ex.: "champgnom" →
 * "champignon"); nomes, ingredientes e acompanhamentos seguem o impresso.
 *
 * Preços ficam registrados mas só aparecem com `menuSettings.showPrices = true`,
 * depois da confirmação. O catálogo Kyte tem valores diferentes: não use um
 * para "corrigir" o outro sem falar com o restaurante.
 */

export type MenuStatus =
  | "confirmado" // confirmado pelo proprietário
  | "cardapio-fotografado" // identificado no cardápio impresso fotografado
  | "catalogo-digital" // encontrado no catálogo Kyte
  | "divergente" // valores diferentes entre as fontes
  | "revisar"; // leitura duvidosa ou item possivelmente temporário

export type MenuSource = "foto-cardapio" | "card-promocional" | "kyte" | "proprietario";

export type CategoryId =
  | "porcoes"
  | "peixes"
  | "camaroes"
  | "carnes"
  | "individuais"
  | "bebidas"
  | "cervejas";

export type MenuItem = {
  id: string;
  name: string;
  category: CategoryId;
  description?: string;
  /** Acompanhamentos, como no impresso. */
  sides?: string;
  /** Observação do impresso (ex.: forma de servir). */
  note?: string;
  /** Porções: 1 pessoa, 2 pessoas, individual ou unidade. Valores em reais. */
  prices: { single?: number; double?: number; individual?: number; unit?: number };
  source: MenuSource;
  status: MenuStatus;
};

export const menuSettings = {
  /** Ligue só depois que o restaurante confirmar os valores. */
  showPrices: false,
  /** Bebidas alcoólicas ficam fora até a confirmação do restaurante. */
  showAlcohol: false,
  /** Catálogo existente, mostrado como alternativa enquanto o cardápio não é confirmado. */
  catalogUrl: "https://convesilhabela.catalog.kyte.site/",
  sourceNote:
    "Cardápio transcrito do impresso do restaurante. Pratos, acompanhamentos e disponibilidade podem mudar; confirme no Convés.",
};

export const categories: { id: CategoryId; name: string; hint?: string; alcohol?: boolean }[] = [
  { id: "porcoes", name: "Entradas e porções" },
  { id: "peixes", name: "Peixes" },
  { id: "camaroes", name: "Camarões" },
  { id: "carnes", name: "Carnes" },
  {
    id: "individuais",
    name: "Pratos individuais",
    hint: "Acompanham arroz, feijão, batata frita e salada (consulte as guarnições). Pratos promocionais: consulte os dias e a disponibilidade.",
  },
  { id: "bebidas", name: "Bebidas sem álcool" },
  { id: "cervejas", name: "Cervejas", alcohol: true },
];

const photo = { source: "foto-cardapio", status: "cardapio-fotografado" } as const;
const promo = { source: "card-promocional", status: "revisar" } as const;

export const menu: MenuItem[] = [
  // Entradas e porções
  { ...photo, id: "batata-frita", category: "porcoes", name: "Batata frita", prices: { unit: 44 } },
  { ...photo, id: "bolinho-bacalhau", category: "porcoes", name: "Bolinho de bacalhau (10 un)", prices: { unit: 64 } },
  { ...photo, id: "mandioca-frita", category: "porcoes", name: "Mandioca frita", prices: { unit: 48 } },
  {
    ...photo,
    id: "lula-farinha",
    category: "porcoes",
    name: "Lula na farinha",
    description: "Anéis de lula temperados com limão, alho e sal, passados na farinha e fritos.",
    sides: "Acompanha molho tártaro.",
    prices: { unit: 88 },
  },
  {
    ...photo,
    id: "lula-provencal",
    category: "porcoes",
    name: "Lula à provençal",
    description: "Anéis de lula temperados com vinho branco, salteados no azeite, sal, alho e salsa.",
    sides: "Acompanha cesta de pães.",
    prices: { unit: 88 },
  },
  {
    ...photo,
    id: "casquinha-siri",
    category: "porcoes",
    name: "Casquinha de siri",
    description: "Carne de siri refogada com temperos, leite de coco e gratinada com parmesão.",
    prices: { unit: 43 },
  },
  {
    ...photo,
    id: "casquinha-camarao",
    category: "porcoes",
    name: "Casquinha de camarão",
    description: "Camarões refogados com temperos, com base bechamel e gratinada com parmesão.",
    prices: { unit: 48 },
  },
  {
    ...photo,
    id: "iscas-peixe",
    category: "porcoes",
    name: "Iscas de peixe",
    description: "Tiras de peixe temperadas com alho, limão e sal, passadas na farinha e fritas.",
    sides: "Acompanha molho tártaro.",
    prices: { unit: 85 },
  },
  {
    ...photo,
    id: "camarao-paulistinha",
    category: "porcoes",
    name: "Camarão paulistinha alho e óleo",
    description: "Camarões sete-barbas descabeçados, salteados no azeite, alho, sal e salsa.",
    prices: { unit: 79 },
  },
  {
    ...photo,
    id: "tiras-carne-suprema",
    category: "porcoes",
    name: "Tiras de carne suprema",
    description: "400 g de tiras de filé mignon, 400 g de batata frita e molho supremo de queijo.",
    prices: { unit: 109 },
  },
  {
    ...photo,
    id: "file-aperitivo",
    category: "porcoes",
    name: "Filé aperitivo acebolado",
    description: "400 g de filé mignon aperitivo ao alho e óleo.",
    sides: "Acompanha pães.",
    prices: { unit: 80 },
  },
  {
    ...photo,
    id: "brusqueta",
    category: "porcoes",
    name: "Brusqueta tradicional",
    description: "8 fatias de pão italiano com tomates picados, manjericão e azeite extravirgem.",
    prices: { unit: 59 },
  },
  {
    ...photo,
    id: "burrata-conves",
    category: "porcoes",
    name: "Burrata Convés",
    description:
      "Burrata fresca de 200 g com mix de tomates picados (italiano, cereja e tomate seco) e redução de azeite balsâmico.",
    sides: "Acompanha fatias de pão italiano.",
    prices: { unit: 88 },
  },
  {
    ...photo,
    id: "bolinho-sororoca",
    category: "porcoes",
    name: "Bolinho de sororoca com banana-da-terra",
    description: "Bolinho de sororoca (peixe local) com banana-da-terra, frito na farinha panko.",
    sides: "Acompanha chutney de maracujá.",
    prices: { unit: 69 },
  },

  // Peixes
  {
    ...photo,
    id: "moqueca-caicara",
    category: "peixes",
    name: "Moqueca caiçara",
    description:
      "Filé de peixe ensopado ao molho de pimentões, camarões sete-barbas, alho, cebola, coentro, leite de coco e azeite de dendê.",
    sides: "Acompanha arroz branco e pirão.",
    prices: { single: 105, double: 205 },
  },
  {
    ...photo,
    id: "peixe-shitake",
    category: "peixes",
    name: "Peixe ao molho de shitake",
    description: "Filé de peixe grelhado coberto com molho à base de bechamel, shoyu e shitake.",
    sides: "Acompanha arroz branco e batatas fritas.",
    prices: { single: 105, double: 205 },
  },
  {
    ...photo,
    id: "peixe-mediterraneo",
    category: "peixes",
    name: "Peixe mediterrâneo",
    description: "Filé de peixe grelhado com mix de legumes.",
    sides: "Acompanha arroz branco.",
    prices: { single: 98, double: 189 },
  },
  {
    ...photo,
    id: "peixe-belle-meuniere",
    category: "peixes",
    name: "Peixe belle meunière",
    description:
      "Filé de peixe grelhado, regado com molho de alcaparras, champignon, vinho branco e camarões sete-barbas.",
    sides: "Acompanha arroz branco e batatas coradas.",
    prices: { single: 102, double: 198 },
  },
  {
    ...photo,
    id: "file-sao-joao",
    category: "peixes",
    name: "Filé São João",
    description:
      "Finas camadas de berinjela guarnecidas de catupiry, filé de peixe coberto com muçarela, molho de camarão e parmesão, gratinado.",
    prices: { single: 98, double: 192 },
  },
  {
    ...photo,
    id: "caldeirada",
    category: "peixes",
    name: "Caldeirada",
    description: "Filé de peixe ensopado com frutos do mar, pimentões e leite de coco.",
    sides: "Acompanha arroz branco e pirão.",
    prices: { single: 105, double: 199 },
  },
  {
    ...photo,
    id: "peixe-inteiro",
    category: "peixes",
    name: "Peixe grelhado inteiro",
    sides: "Acompanha arroz com brócolis, farofa de camarão, alcaparras, champignon e batatas coradas.",
    prices: { double: 198 },
  },
  {
    ...photo,
    id: "file-frutos-do-mar",
    category: "peixes",
    name: "Filé de peixe com frutos do mar",
    description: "Filé de peixe grelhado coberto com frutos do mar puxados no alho, azeite e vinho branco.",
    sides: "Acompanha arroz branco e mix de legumes.",
    prices: { single: 105, double: 205 },
  },
  {
    ...photo,
    id: "salmao-fiorentina",
    category: "peixes",
    name: "Salmão à fiorentina",
    description: "Salmão grelhado com creme fiorentina.",
    sides: "Acompanha arroz branco e purê de mandioquinha.",
    prices: { individual: 92 },
  },
  {
    ...photo,
    id: "salmao-marroquino",
    category: "peixes",
    name: "Salmão marroquino",
    description: "Filé de salmão grelhado com molho de maracujá e cuscuz marroquino de banana-da-terra.",
    prices: { individual: 92 },
  },
  {
    ...photo,
    id: "file-magalhaes",
    category: "peixes",
    name: "Filé Magalhães",
    description: "Filé de peixe da estação com molho de camarão crocante.",
    sides: "Acompanha arroz à grega e fritas.",
    prices: { single: 90, double: 179 },
  },
  {
    ...photo,
    id: "polvo-pescador",
    category: "peixes",
    name: "Polvo à pescador",
    description: "Tentáculos de polvo puxados no gengibre e especiarias.",
    sides: "Acompanha purê de mandioquinha e tomate confit.",
    prices: { individual: 198 },
  },

  // Camarões
  {
    ...photo,
    id: "camarao-pastorela",
    category: "camaroes",
    name: "Camarão à pastorela",
    description: "Camarões médios recheados com catupiry, empanados e fritos.",
    sides: "Acompanha arroz Califórnia, fritas e palmito salteado na salsa.",
    prices: { single: 124, double: 237 },
  },
  {
    ...photo,
    id: "camarao-grega",
    category: "camaroes",
    name: "Camarão à grega",
    description: "Camarões médios temperados com alho e sal, empanados e fritos.",
    sides: "Acompanha arroz à grega, batatas fritas e provolone à milanesa.",
    prices: { single: 115, double: 227 },
  },
  {
    ...photo,
    id: "camarao-shitake",
    category: "camaroes",
    name: "Camarões ao shitake",
    description:
      "Camarões médios com shitake laminado, salteados na manteiga com um leve toque de vinho branco e encorpados com molho bechamel.",
    sides: "Acompanha arroz branco e batatas fritas.",
    prices: { single: 114, double: 226 },
  },
  {
    ...photo,
    id: "camarao-flor-de-sal",
    category: "camaroes",
    name: "Camarão flor de sal",
    description:
      "Camarões grandes grelhados, regados com azeite de ervas, tomate-cereja, muçarela de búfala e flor de sal.",
    sides: "Acompanha arroz com amêndoas e purê de mandioquinha.",
    prices: { single: 116, double: 228 },
  },
  {
    ...photo,
    id: "camarao-moranga",
    category: "camaroes",
    name: "Camarão na moranga",
    description:
      "Camarões médios salteados na manteiga com temperos, polpa da moranga, leite de coco, catupiry e parmesão, gratinados.",
    sides: "Acompanha arroz branco e batatas fritas.",
    note: "Para 1 pessoa, é servido na travessa.",
    prices: { single: 124, double: 237 },
  },
  {
    ...photo,
    id: "bobo-camarao",
    category: "camaroes",
    name: "Bobó de camarão",
    description: "Camarões médios refogados no dendê com pimentões, cebola, leite de coco e creme de mandioca.",
    sides: "Acompanha arroz branco, batatas fritas e farofa de dendê.",
    prices: { single: 122, double: 237 },
  },
  {
    ...photo,
    id: "moqueca-camarao",
    category: "camaroes",
    name: "Moqueca de camarão",
    description: "Camarões médios refogados no dendê com pimentões, cebola e leite de coco.",
    sides: "Acompanha arroz branco e pirão.",
    prices: { single: 122, double: 237 },
  },
  {
    ...photo,
    id: "camarao-catupiry",
    category: "camaroes",
    name: "Camarão com catupiry",
    description: "Camarões médios salteados na manteiga ao creme de catupiry, com parmesão e gratinados.",
    sides: "Acompanha arroz branco e batatas fritas.",
    prices: { single: 115, double: 225 },
  },

  // Carnes
  {
    ...photo,
    id: "steak-house-angus",
    category: "carnes",
    name: "Steak House Angus",
    description:
      "Bife de ancho grelhado com alho crocante, arroz biro-biro, vinagrete de maçã verde, batatas rústicas e farofa de bacon.",
    prices: { single: 104, double: 205 },
  },
  {
    ...photo,
    id: "mignon-gorgonzola",
    category: "carnes",
    name: "Filet mignon ao molho de gorgonzola",
    description: "Filet mignon grelhado, coberto com molho à base de bechamel e gorgonzola.",
    sides: "Acompanha arroz branco e batatas coradas.",
    prices: { single: 99, double: 198 },
  },
  {
    ...photo,
    id: "picanha-angus",
    category: "carnes",
    name: "Picanha Angus",
    description: "Picanha grelhada.",
    sides: "Acompanha arroz branco, vinagrete, farofa de bacon e banana à milanesa.",
    prices: { single: 98, double: 195 },
  },
  {
    ...photo,
    id: "strogonoff",
    category: "carnes",
    name: "Strogonoff de carne",
    description:
      "Cubos de filet mignon incorporados à base de bechamel, catchup e champignon, flambados com conhaque.",
    sides: "Acompanha arroz branco e batatas fritas.",
    prices: { single: 78, double: 115 },
  },
  {
    ...photo,
    id: "mignon-parmegiana",
    category: "carnes",
    name: "Filet mignon à parmegiana",
    description:
      "Bife de filet mignon empanado, coberto com muçarela e molho de tomate caseiro, gratinado com parmesão.",
    sides: "Acompanha arroz branco e batatas fritas.",
    prices: { single: 97, double: 193 },
  },
  {
    ...photo,
    id: "mignon-grelhado",
    category: "carnes",
    name: "Filet mignon grelhado",
    sides: "Acompanha arroz branco e fritas.",
    prices: { single: 78, double: 155 },
  },
  {
    ...photo,
    id: "abobora-carne-seca",
    category: "carnes",
    name: "Abóbora kabotiá com carne-seca e catupiry",
    description:
      "Carne-seca desfiada envolvida com catupiry, servida dentro da abóbora kabotiá gratinada com parmesão.",
    sides: "Acompanha arroz branco e banana à milanesa.",
    note: "Para 1 pessoa, é servido na travessa.",
    prices: { single: 85, double: 158 },
  },

  // Pratos individuais (card de pratos promocionais)
  { ...promo, id: "penne-brocolis", category: "individuais", name: "Penne ao creme branco com brócolis e bacon", prices: { individual: 41.9 } },
  { ...promo, id: "bife-figado", category: "individuais", name: "Bife de fígado acebolado", prices: { individual: 41.9 } },
  { ...promo, id: "salada-caesar", category: "individuais", name: "Salada Caesar", prices: { individual: 44.9 } },
  { ...promo, id: "peixe-palmito", category: "individuais", name: "Filé de peixe ao creme de palmito", prices: { individual: 48.9 } },
  { ...promo, id: "picadinho", category: "individuais", name: "Picadinho de carne com legumes", prices: { individual: 48.9 } },
  { ...promo, id: "frango-indiano", category: "individuais", name: "Filé de frango indiano", prices: { individual: 48.9 } },
  { ...promo, id: "abobrinha-parmegiana", category: "individuais", name: "Abobrinha à parmegiana", prices: { individual: 48.9 } },
  { ...promo, id: "rigatoni-atum", category: "individuais", name: "Rigatoni ao creme de atum", prices: { individual: 48.9 } },
  { ...promo, id: "moqueca-camarao-individual", category: "individuais", name: "Moqueca de camarão", prices: { individual: 53.9 } },
  {
    ...promo,
    id: "contra-file",
    category: "individuais",
    name: "Contra-filé",
    description: "Opções: grelhado, a cavalo, acebolado ou à parmegiana.",
    prices: { individual: 55.9 },
  },

  // Bebidas sem álcool
  { ...photo, id: "agua", category: "bebidas", name: "Água (com ou sem gás)", prices: { unit: 7 } },
  { ...photo, id: "suco-natural", category: "bebidas", name: "Suco natural", description: "Laranja, abacaxi, limão ou melancia.", prices: { unit: 16 } },
  {
    ...photo,
    id: "suco-polpa",
    category: "bebidas",
    name: "Suco de polpa",
    description: "Caju, acerola, maracujá, morango, manga, uva, graviola e cacau.",
    prices: { unit: 14 },
  },
  { ...photo, id: "suco-especial", category: "bebidas", name: "Suco especial", description: "De duas frutas.", prices: { unit: 18 } },
  { ...photo, id: "limonada-suica", category: "bebidas", name: "Limonada suíça", prices: { unit: 18.9 } },
  { ...photo, id: "soda-italiana", category: "bebidas", name: "Soda italiana", prices: { unit: 18.9 } },
  { ...photo, id: "suco-leite", category: "bebidas", name: "Suco com leite", prices: { unit: 21 } },
  {
    ...photo,
    id: "refrigerante",
    category: "bebidas",
    name: "Refrigerante",
    description: "Coca-Cola, Fanta (laranja ou uva), Soda, Guaraná, água tônica e Citrus.",
    prices: { unit: 11 },
  },
  { ...photo, id: "h2o", category: "bebidas", name: "H2O", description: "Limão ou limoneto.", prices: { unit: 13 } },
  { ...photo, id: "cha-gelado", category: "bebidas", name: "Chá (ice tea)", prices: { unit: 11 } },

  // Cervejas: os valores do impresso ficam meia linha acima dos nomes; revisar o alinhamento.
  { id: "original-600", category: "cervejas", name: "Original 600 ml", prices: { unit: 23 }, source: "foto-cardapio", status: "revisar" },
  { id: "original-balde", category: "cervejas", name: "Original 600 ml (balde com 3 un)", prices: { unit: 59 }, source: "foto-cardapio", status: "revisar" },
  { id: "heineken-600", category: "cervejas", name: "Heineken 600 ml", prices: { unit: 27 }, source: "foto-cardapio", status: "revisar" },
  { id: "heineken-balde", category: "cervejas", name: "Heineken 600 ml (balde com 3 un)", prices: { unit: 69 }, source: "foto-cardapio", status: "revisar" },
  { id: "stella-600", category: "cervejas", name: "Stella Artois 600 ml", prices: { unit: 26 }, source: "foto-cardapio", status: "revisar" },
  { id: "stella-balde", category: "cervejas", name: "Stella Artois (balde com 3 un)", prices: { unit: 68 }, source: "foto-cardapio", status: "revisar" },
  { id: "amstel-600", category: "cervejas", name: "Amstel 600 ml", prices: { unit: 21 }, source: "foto-cardapio", status: "revisar" },
  { id: "amstel-balde", category: "cervejas", name: "Amstel 600 ml (balde com 3 un)", prices: { unit: 54 }, source: "foto-cardapio", status: "revisar" },
  { id: "heineken-ln", category: "cervejas", name: "Heineken long neck (normal ou zero)", prices: { unit: 18 }, source: "foto-cardapio", status: "revisar" },
  { id: "baden-baden", category: "cervejas", name: "Baden Baden Pilsen", prices: { unit: 34 }, source: "foto-cardapio", status: "revisar" },
  { id: "stella-ln", category: "cervejas", name: "Stella Artois long neck", prices: { unit: 17 }, source: "foto-cardapio", status: "revisar" },
  { id: "corona-ln", category: "cervejas", name: "Corona long neck", prices: { unit: 18 }, source: "foto-cardapio", status: "revisar" },
  { id: "malzbier-ln", category: "cervejas", name: "Malzbier long neck", prices: { unit: 16 }, source: "foto-cardapio", status: "revisar" },
];

/** Destaques da página inicial (só pratos do impresso). */
export const highlightIds = ["moqueca-caicara", "bolinho-sororoca", "bobo-camarao", "salmao-marroquino"];

export function visibleCategories() {
  return categories.filter((c) => !c.alcohol || menuSettings.showAlcohol);
}

export function itemsOf(category: CategoryId) {
  return menu.filter((item) => item.category === category);
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Rótulos de porção, sempre; valores só com showPrices. */
export function portionLabels(item: MenuItem): { label: string; price: string | null }[] {
  const show = menuSettings.showPrices;
  const fmt = (v?: number) => (show && v !== undefined ? brl.format(v) : null);
  const out: { label: string; price: string | null }[] = [];
  if (item.prices.single !== undefined) out.push({ label: "1 pessoa", price: fmt(item.prices.single) });
  if (item.prices.double !== undefined) out.push({ label: "2 pessoas", price: fmt(item.prices.double) });
  if (item.prices.individual !== undefined) out.push({ label: "Individual", price: fmt(item.prices.individual) });
  if (item.prices.unit !== undefined && show) out.push({ label: "", price: fmt(item.prices.unit) });
  return out;
}

/** Busca sem acento e sem diferença de maiúsculas. */
export function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

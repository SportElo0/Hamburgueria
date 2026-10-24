/**
 * Conteúdos jurídicos.
 *
 * Estrutura pronta para artigos informativos. Nenhum texto jurídico é
 * publicado sem revisão do Dr. Odair: enquanto `content` for `null`, a página
 * mostra o resumo e o roteiro como "em preparação".
 *
 * Para publicar um artigo: escreva `content` (parágrafos), preencha `author`,
 * `publishedAt`, `updatedAt` e `sources`, e mude `status` para "publicado".
 */

export type ArticleStatus = "em-preparacao" | "em-revisao" | "publicado";

export type Article = {
  slug: string;
  title: string;
  summary: string;
  /** Área relacionada (slug de data/areas.ts). */
  area: string;
  /** Roteiro do que o artigo vai abordar. */
  outline: string[];
  /** Conteúdo revisado, em parágrafos. `null` enquanto não houver texto aprovado. */
  content: string[] | null;
  author: string | null;
  /** Datas no formato AAAA-MM-DD. */
  publishedAt: string | null;
  updatedAt: string | null;
  /** Fontes jurídicas que fundamentam o texto. */
  sources: string[];
  status: ArticleStatus;
};

export const articles: Article[] = [
  {
    slug: "aspectos-juridicos-do-inventario",
    title: "Aspectos jurídicos do inventário",
    summary: "O que é o inventário, quando ele é necessário e quais são os caminhos possíveis para organizar a partilha.",
    area: "familia-e-sucessoes",
    outline: [
      "O que é o inventário e para que serve",
      "Inventário judicial e extrajudicial",
      "Documentos normalmente envolvidos",
      "Por que buscar orientação logo no início",
    ],
    content: null,
    author: null,
    publishedAt: null,
    updatedAt: null,
    sources: ["Código Civil (Lei nº 10.406/2002)", "Código de Processo Civil (Lei nº 13.105/2015)"],
    status: "em-preparacao",
  },
  {
    slug: "divorcio-judicial-e-extrajudicial",
    title: "Diferenças gerais entre divórcio judicial e extrajudicial",
    summary: "Uma visão geral das duas vias e dos fatores que costumam definir qual delas é possível em cada caso.",
    area: "familia-e-sucessoes",
    outline: [
      "O divórcio na Justiça e em cartório",
      "Fatores que influenciam a escolha da via",
      "Partilha de bens e regime de bens",
      "Guarda e convivência com os filhos",
    ],
    content: null,
    author: null,
    publishedAt: null,
    updatedAt: null,
    sources: ["Código Civil (Lei nº 10.406/2002)", "Código de Processo Civil (Lei nº 13.105/2015)"],
    status: "em-preparacao",
  },
  {
    slug: "nocoes-sobre-beneficios-previdenciarios",
    title: "Noções sobre benefícios previdenciários",
    summary: "Um panorama dos principais benefícios administrados pelo INSS e de como funciona o pedido administrativo.",
    area: "previdenciario",
    outline: [
      "Quem é segurado do INSS",
      "Aposentadorias, pensões e auxílios",
      "O pedido administrativo",
      "O que fazer diante de uma negativa",
    ],
    content: null,
    author: null,
    publishedAt: null,
    updatedAt: null,
    sources: ["Lei nº 8.213/1991", "Emenda Constitucional nº 103/2019"],
    status: "em-preparacao",
  },
  {
    slug: "cuidados-na-elaboracao-de-contratos",
    title: "Cuidados na elaboração de contratos",
    summary: "Pontos de atenção antes de assinar: obrigações, prazos, multas e condições de rescisão.",
    area: "contratual-e-consumidor",
    outline: [
      "Identificação das partes e do objeto",
      "Obrigações, prazos e pagamentos",
      "Multas e condições de rescisão",
      "Quando revisar um contrato",
    ],
    content: null,
    author: null,
    publishedAt: null,
    updatedAt: null,
    sources: ["Código Civil (Lei nº 10.406/2002)"],
    status: "em-preparacao",
  },
  {
    slug: "direitos-e-deveres-nas-relacoes-de-consumo",
    title: "Direitos e deveres nas relações de consumo",
    summary: "Como o Código de Defesa do Consumidor organiza a relação entre consumidores e fornecedores.",
    area: "contratual-e-consumidor",
    outline: [
      "Quem é consumidor e quem é fornecedor",
      "Informação, oferta e publicidade",
      "Produtos e serviços com defeito",
      "Caminhos para resolver um problema",
    ],
    content: null,
    author: null,
    publishedAt: null,
    updatedAt: null,
    sources: ["Código de Defesa do Consumidor (Lei nº 8.078/1990)"],
    status: "em-preparacao",
  },
];

export const statusLabel: Record<ArticleStatus, string> = {
  "em-preparacao": "Em preparação",
  "em-revisao": "Em revisão",
  publicado: "Publicado",
};

export function getArticle(slug: string) {
  return articles.find((a) => a.slug === slug) ?? null;
}

export function formatDate(iso: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

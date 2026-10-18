import type { CommercialStatus, Service, SiteSettings, WorkStage } from "./types";

export const siteName = "MERCANTIL";
export const siteTagline = "Automóveis que atravessam gerações.";
export const siteDescription =
  "Acervo de automóveis clássicos Mercedes-Benz e projetos de restauração. Conheça a coleção, acompanhe os projetos e imagine o próximo capítulo do seu clássico.";

/** Empty until the owner configures real contacts in the admin panel. Never ship invented numbers. */
export const seedSettings: SiteSettings = {
  whatsapp: "",
  email: "",
  instagram: "",
  city: "",
  addressNote: "",
};

export const workStageLabel: Record<WorkStage, string> = {
  "a-confirmar": "Etapa a confirmar",
  avaliacao: "Em avaliação",
  projeto: "Projeto de restauração",
  "funilaria-pintura": "Funilaria e pintura",
  preparacao: "Preparação e restauração",
  "quase-pronto": "Quase pronto",
  concluido: "Trabalho concluído",
};

/** Ordered track used to show each car's position along the work, not just a label. */
export const workTrack: WorkStage[] = ["avaliacao", "projeto", "funilaria-pintura", "preparacao", "quase-pronto", "concluido"];

export const commercialLabel: Record<CommercialStatus, string> = {
  "a-confirmar": "Situação comercial a confirmar",
  "venda-prevista": "Venda prevista · consulte",
  disponivel: "Disponível · valor sob consulta",
  reservado: "Reservado",
  vendido: "Vendido",
  acervo: "Acervo · não está à venda",
};

/** Service categories proposed by the brief; each stays flagged until the owner confirms it. */
export const seedServices: Service[] = [
  {
    slug: "restauracao-classicos",
    name: "Restauração de clássicos",
    short: "O carro inteiro como projeto.",
    description:
      "Avaliação do estado atual, definição do que preservar e do que recuperar, e um plano por etapas para devolver o automóvel ao seu caráter original.",
    confirmed: false,
  },
  {
    slug: "funilaria-pintura",
    name: "Funilaria e pintura",
    short: "Carroceria, superfície e cor.",
    description:
      "Correção de carroceria e pintura, com atenção à cor e ao acabamento adequados ao modelo e à época.",
    confirmed: false,
  },
  {
    slug: "interiores",
    name: "Recuperação de interiores",
    short: "Bancos, painéis e revestimentos.",
    description: "Recuperação ou refação de revestimentos, bancos e acabamentos internos.",
    confirmed: false,
  },
  {
    slug: "acabamentos",
    name: "Acabamentos",
    short: "Cromados, frisos e detalhes.",
    description: "Cuidado com os detalhes que definem o carro: cromados, frisos, emblemas e peças aparentes.",
    confirmed: false,
  },
  {
    slug: "preparacao-estetica",
    name: "Preparação estética",
    short: "Apresentação do carro como ele merece.",
    description: "Preparação estética para uso, exposição ou venda.",
    confirmed: false,
  },
  {
    slug: "projetos-especiais",
    name: "Projetos especiais",
    short: "Quando o pedido foge do comum.",
    description: "Projetos sob medida, discutidos caso a caso a partir da avaliação do veículo.",
    confirmed: false,
  },
];

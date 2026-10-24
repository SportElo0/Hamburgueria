import type { RosetteSpec } from "@/lib/guilloche";

/**
 * Áreas de atuação informadas pelo escritório.
 *
 * Os textos são PROVISÓRIOS: informativos, gerais e sujeitos à revisão do
 * Dr. Odair antes da publicação oficial. Não prometem resultado, não fazem
 * diagnóstico e não substituem orientação profissional individualizada.
 */

export type Area = {
  slug: string;
  /** Nome completo da área. */
  name: string;
  /** Nome curto (índice da abertura, menus). */
  short: string;
  /** Uma linha para o card. */
  summary: string;
  /** Descrição objetiva da página. */
  description: string;
  /** Assuntos abordados (informados pelo escritório). */
  topics: string[];
  /** Informações gerais, em parágrafos curtos. */
  general: { title: string; text: string }[];
  faq: { q: string; a: string }[];
  /** Legislação de referência citada nas informações gerais. */
  references: string[];
  /** Desenho da roseta guilhochê própria da área. */
  rosette: RosetteSpec;
  seo: { title: string; description: string };
};

const commonFaq = {
  documents: {
    q: "Preciso enviar documentos no primeiro contato?",
    a: "Não. No primeiro contato basta um resumo breve do assunto e um meio de retorno. Se houver necessidade de documentos, eles serão solicitados depois, por um canal adequado.",
  },
  result: {
    q: "É possível saber o resultado antes de começar?",
    a: "Não. Cada situação depende dos fatos, das provas e da legislação aplicável. O que o escritório oferece é a análise do caso e a orientação sobre os caminhos possíveis.",
  },
};

export const areas: Area[] = [
  {
    slug: "familia-e-sucessoes",
    name: "Direito de Família e Sucessões",
    short: "Família e Sucessões",
    summary: "Divórcio, guarda de filhos, regime de bens, inventários e sucessões.",
    description:
      "Orientação e atuação em questões de família e de sucessão patrimonial, com atenção à delicadeza que esses assuntos costumam envolver.",
    topics: [
      "Regime de bens",
      "Divórcio judicial e extrajudicial",
      "Guarda de filhos",
      "Sucessões",
      "Inventários",
    ],
    general: [
      {
        title: "Divórcio judicial e extrajudicial",
        text: "O divórcio pode ser feito pela via judicial ou, em determinadas situações, em cartório (via extrajudicial). Qual caminho é possível depende de fatores como o consenso entre as partes e a existência de filhos menores ou incapazes, que precisam ser avaliados em cada caso.",
      },
      {
        title: "Regime de bens",
        text: "O regime de bens escolhido no casamento ou na união estável define como o patrimônio é tratado durante a relação e em uma eventual separação. Entender o regime aplicável é um passo importante antes de qualquer decisão.",
      },
      {
        title: "Inventário e sucessão",
        text: "Com o falecimento de uma pessoa, seus bens, direitos e dívidas passam por inventário, que também pode ser judicial ou extrajudicial conforme a situação. A orientação jurídica ajuda a organizar documentos, prazos e a partilha entre os herdeiros.",
      },
    ],
    faq: [
      {
        q: "Todo divórcio precisa passar pela Justiça?",
        a: "Nem sempre. Há situações em que o divórcio pode ser feito em cartório. A possibilidade depende das circunstâncias de cada caso, que são avaliadas no atendimento.",
      },
      commonFaq.documents,
      commonFaq.result,
    ],
    references: ["Código Civil (Lei nº 10.406/2002)", "Código de Processo Civil (Lei nº 13.105/2015)"],
    rosette: { lobes: 12, wobble: 3, rings: 3, copies: 6, seed: 0.2 },
    seo: {
      title: "Direito de Família e Sucessões em São Paulo",
      description:
        "Orientação jurídica em divórcio judicial e extrajudicial, guarda de filhos, regime de bens, inventários e sucessões no Estado de São Paulo.",
    },
  },
  {
    slug: "previdenciario",
    name: "Direito Previdenciário",
    short: "Previdenciário",
    summary: "Benefícios do INSS, aposentadorias, pensões e auxílio-acidente.",
    description:
      "Orientação sobre benefícios previdenciários e acompanhamento de questões administrativas e judiciais relacionadas ao INSS.",
    topics: [
      "Benefícios previdenciários",
      "Aposentadorias",
      "Pensões",
      "Auxílio-acidente",
      "Questões administrativas e judiciais junto ao INSS",
    ],
    general: [
      {
        title: "Pedido administrativo",
        text: "Em regra, os benefícios são requeridos primeiro ao INSS, pela via administrativa. A análise prévia dos requisitos e da documentação ajuda a entender qual benefício pode ser pedido e como.",
      },
      {
        title: "Quando o pedido é negado",
        text: "Uma negativa do INSS pode, conforme o caso, ser questionada por recurso administrativo ou na Justiça. A escolha do caminho depende dos motivos da negativa e das provas disponíveis.",
      },
      {
        title: "Aposentadorias e pensões",
        text: "As regras de aposentadoria e de pensão mudaram ao longo do tempo, inclusive com regras de transição. Por isso, a situação de cada segurado precisa ser verificada individualmente.",
      },
    ],
    faq: [
      {
        q: "O escritório atende questões já negadas pelo INSS?",
        a: "Sim, a atuação inclui questões administrativas e judiciais relacionadas ao INSS. Cada caso é analisado para entender os caminhos possíveis.",
      },
      commonFaq.documents,
      commonFaq.result,
    ],
    references: [
      "Lei de Benefícios da Previdência Social (Lei nº 8.213/1991)",
      "Emenda Constitucional nº 103/2019",
    ],
    rosette: { lobes: 7, wobble: 2, rings: 2, copies: 4, seed: 0.55 },
    seo: {
      title: "Direito Previdenciário em São Paulo",
      description:
        "Orientação sobre benefícios previdenciários, aposentadorias, pensões, auxílio-acidente e questões administrativas e judiciais junto ao INSS.",
    },
  },
  {
    slug: "contratual-e-consumidor",
    name: "Direito Contratual e do Consumidor",
    short: "Contratual e Consumidor",
    summary: "Elaboração, análise e revisão de contratos e relações de consumo.",
    description:
      "Elaboração e análise de contratos e orientação jurídica nas relações de consumo, com atenção à clareza das obrigações de cada parte.",
    topics: [
      "Elaboração de contratos",
      "Análise e revisão contratual",
      "Orientação jurídica em relações de consumo",
      "Defesa dos direitos do consumidor",
    ],
    general: [
      {
        title: "Antes de assinar",
        text: "Ler um contrato com atenção às obrigações, prazos, multas e condições de rescisão evita surpresas. A análise jurídica prévia ajuda a identificar pontos que merecem ajuste.",
      },
      {
        title: "Revisão contratual",
        text: "Contratos já assinados também podem ser analisados, para entender direitos e deveres das partes e avaliar se há cláusulas que mereçam discussão.",
      },
      {
        title: "Relações de consumo",
        text: "As relações entre consumidores e fornecedores seguem regras próprias, previstas no Código de Defesa do Consumidor. A orientação jurídica ajuda a entender essas regras diante de um problema concreto.",
      },
    ],
    faq: [
      {
        q: "O escritório elabora contratos para empresas e pessoas físicas?",
        a: "A atuação informada inclui a elaboração, a análise e a revisão de contratos. O alcance do trabalho é definido no atendimento, conforme a necessidade.",
      },
      commonFaq.documents,
      commonFaq.result,
    ],
    references: [
      "Código Civil (Lei nº 10.406/2002)",
      "Código de Defesa do Consumidor (Lei nº 8.078/1990)",
    ],
    rosette: { lobes: 20, wobble: 6, rings: 5, copies: 3, seed: 0.9 },
    seo: {
      title: "Direito Contratual e do Consumidor em São Paulo",
      description:
        "Elaboração, análise e revisão de contratos e orientação jurídica nas relações de consumo no Estado de São Paulo.",
    },
  },
  {
    slug: "trabalhista",
    name: "Direito Trabalhista",
    short: "Trabalhista",
    summary: "Orientação ao trabalhador, contratos, horas extras, bancários e telemarketing.",
    description:
      "Orientação jurídica ao trabalhador sobre contratos e direitos trabalhistas, incluindo questões que envolvem atividades bancárias e de telemarketing.",
    topics: [
      "Orientação jurídica ao trabalhador",
      "Análise de contratos",
      "Horas extras",
      "Questões envolvendo atividades bancárias",
      "Questões envolvendo telemarketing",
    ],
    general: [
      {
        title: "Jornada e horas extras",
        text: "A jornada de trabalho, as horas extras e os intervalos seguem regras da legislação trabalhista e, em algumas categorias, de normas coletivas. Cada situação depende do contrato e da rotina efetivamente cumprida.",
      },
      {
        title: "Bancários e telemarketing",
        text: "Algumas atividades, como a bancária e a de telemarketing, têm regras específicas de jornada e de condições de trabalho. Entender quais se aplicam ao seu caso é o primeiro passo.",
      },
      {
        title: "Prazos",
        text: "Os direitos trabalhistas estão sujeitos a prazos para serem reclamados. Por isso, vale buscar orientação sem deixar o assunto para depois.",
      },
    ],
    faq: [
      {
        q: "Ainda estou trabalhando na empresa. Posso buscar orientação?",
        a: "Sim. A orientação jurídica pode ser buscada durante ou depois do contrato de trabalho. O atendimento ajuda a entender a situação com discrição.",
      },
      commonFaq.documents,
      commonFaq.result,
    ],
    references: ["Consolidação das Leis do Trabalho (Decreto-Lei nº 5.452/1943)"],
    rosette: { lobes: 9, wobble: 0, rings: 4, copies: 9, seed: 0.35 },
    seo: {
      title: "Direito Trabalhista em São Paulo",
      description:
        "Orientação jurídica ao trabalhador sobre contratos, horas extras e questões envolvendo atividades bancárias e telemarketing.",
    },
  },
  {
    slug: "empresarial-e-penal-economico",
    name: "Direito Empresarial e Penal Econômico",
    short: "Empresarial e Penal Econômico",
    summary: "Assessoria jurídica empresarial e defesa em direito penal econômico.",
    description:
      "Assessoria jurídica para atividades empresariais e atuação na defesa em matérias de direito penal econômico.",
    topics: [
      "Assessoria jurídica empresarial",
      "Orientações relacionadas às atividades empresariais",
      "Defesa no âmbito do direito penal econômico",
    ],
    general: [
      {
        title: "Assessoria empresarial",
        text: "A assessoria jurídica acompanha a rotina da empresa em contratos, decisões e obrigações, ajudando a tomar decisões com mais segurança jurídica.",
      },
      {
        title: "Direito penal econômico",
        text: "O direito penal econômico trata de condutas ligadas à atividade econômica, como as previstas nas leis sobre crimes contra a ordem tributária e contra o sistema financeiro. A defesa técnica acompanha o caso desde as fases iniciais.",
      },
      {
        title: "Sigilo",
        text: "Assuntos empresariais e de defesa exigem discrição. O primeiro contato pelo site deve conter apenas um resumo, sem detalhes sensíveis ou documentos.",
      },
    ],
    faq: [
      {
        q: "O escritório atende empresas de qualquer porte?",
        a: "A atuação informada inclui assessoria jurídica empresarial. O escopo de cada trabalho é definido no atendimento, conforme a necessidade da empresa.",
      },
      commonFaq.documents,
      commonFaq.result,
    ],
    references: [
      "Lei dos Crimes contra a Ordem Tributária (Lei nº 8.137/1990)",
      "Lei dos Crimes contra o Sistema Financeiro Nacional (Lei nº 7.492/1986)",
      "Código Civil (Lei nº 10.406/2002)",
    ],
    rosette: { lobes: 26, wobble: 9, rings: 2, copies: 8, seed: 0.7 },
    seo: {
      title: "Direito Empresarial e Penal Econômico em São Paulo",
      description:
        "Assessoria jurídica empresarial e defesa em matérias de direito penal econômico no Estado de São Paulo.",
    },
  },
];

export function getArea(slug: string) {
  return areas.find((a) => a.slug === slug) ?? null;
}

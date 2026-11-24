import { z } from 'zod';
import { Conhecimento, ConfigEmpresa, SEGMENTOS, normalizarTelefone, type Campo } from './config';
import { EntradaFluxo, MODELOS_DE_FLUXO } from './fluxos';

/**
 * Ready-made models per kind of business (the "snapshot" idea): a new company picks one and gets, in one step, the
 * questions of its request form, the automation rules, the site texts, the content the assistant may use and the
 * flows already switched on. The company's own data (name, phone, hours, services, prices, review link) comes from
 * the 5-minute sign-up form. Nothing is copied from another company and nothing is invented: what the owner did not
 * give stays empty, and the assistant sends those questions to the team.
 */

/** What the Growlift team types when signing up a company (all optional except the basics, validated in empresas.ts). */
export const DadosCadastro = z.object({
  whatsapp: z.string().trim().max(20).default(''),
  email: z.string().trim().max(120).default(''),
  cidade: z.string().trim().max(120).default(''),
  endereco: z.string().trim().max(200).default(''),
  descricao: z.string().trim().max(600).default(''),
  /** One per line: "Name — short description". */
  servicos: z.string().trim().max(2000).default(''),
  /** Only what the owner authorised; one per line. Empty = the assistant never quotes a price. */
  precos: z.string().trim().max(2000).default(''),
  /** One per line: "question | answer". */
  perguntas: z.string().trim().max(4000).default(''),
  horarios: z.string().trim().max(300).default(''),
  hora_inicio: z.number().int().min(0).max(23).optional(),
  hora_fim: z.number().int().min(1).max(24).optional(),
  link_avaliacao: z.string().trim().max(300).refine((v) => v === '' || v.startsWith('https://'), 'O link de avaliação precisa começar com https://').default(''),
  assistente: z.string().trim().max(40).default(''),
});
export type DadosCadastro = z.infer<typeof DadosCadastro>;

type Regras = Partial<z.input<typeof ConfigEmpresa>['regras']>;
type Agenda = Partial<z.input<typeof ConfigEmpresa>['agenda']>;

export interface ModeloNegocio {
  /** Same key as SEGMENTOS (the company's segment). */
  id: string;
  nome: string;
  /** For the Growlift team, in the sign-up form. */
  resumo: string;
  campos: Campo[];
  regras: Regras;
  agenda: Agenda;
  chamada: string;
  /** Site words for this kind of business (see ConfigEmpresa.site). */
  textosSite: { botao: string; titulo_servicos: string; titulo_areas: string; titulo_form: string; texto_form: string };
  regrasComerciais: string;
  encaminhar: string;
  /** Ready-made flows (MODELOS_DE_FLUXO ids) created switched on. */
  fluxosPadrao: string[];
  /** Flows of this model only, created switched on. */
  fluxosProprios: EntradaFluxo[];
}

const PRECO_REGRA = 'Preço, desconto e prazo só podem ser informados se estiverem escritos em “preços autorizados”. Fora isso, a equipe responde.';

// The follow-up after the proposal is the model's flow (its own wording, then a task for the team), so the built-in
// automatic follow-up message stays off: the customer never gets two messages at the same moment.
export const MODELOS: Record<string, ModeloNegocio> = {
  pousada: {
    id: 'pousada',
    nome: 'Pousada',
    resumo: 'Pedidos de reserva direta: a assistente anota datas e número de pessoas, a equipe confirma valores e disponibilidade, quem não respondeu recebe uma retomada em 1 dia e, sem resposta em 3 dias, vira tarefa para a equipe; e, depois da estadia, o hóspede recebe o convite de avaliação.',
    campos: SEGMENTOS['pousada'].campos,
    regras: { sla_minutos: 15, retorno_proposta_dias: 1, retorno_auto_cliente: false, retorno_auto_horas: 24, retorno_auto_horas_2: 72, avaliacao_auto: true, manutencao_auto: false, hora_inicio: 8, hora_fim: 22 },
    agenda: { ativa: false },
    chamada: 'Reserve direto com a gente',
    textosSite: { botao: 'Pedir reserva', titulo_servicos: 'Acomodações', titulo_areas: 'Onde estamos', titulo_form: 'Peça sua reserva', texto_form: 'Conte as datas e quantas pessoas. Uma pessoa da equipe confere a disponibilidade e manda os valores. O pedido ainda não é a reserva confirmada.' },
    regrasComerciais: `A assistente não confirma reserva nem disponibilidade sozinha: anota as datas, o número de pessoas e os pedidos especiais e passa para a equipe, que confirma valores e disponibilidade. ${PRECO_REGRA}`,
    encaminhar: 'Pedido com datas definidas, grupos e eventos, pets, pedidos especiais, cancelamento, reembolso e qualquer reclamação vão para a equipe.',
    fluxosPadrao: ['boas-vindas', 'ligacao-nao-atendida'],
    fluxosProprios: [
      {
        nome: 'Valores enviados e sem resposta',
        ativo: true,
        gatilho: { tipo: 'etapa_alterada', etapa: 'proposta' },
        passos: [
          { tipo: 'esperar', minutos: 1440 },
          { tipo: 'parar_se', condicao: 'cliente_respondeu' },
          { tipo: 'parar_se', condicao: 'etapa_mudou' },
          { tipo: 'enviar_whatsapp', texto: 'Oi, {{nome}}! Aqui é da {{empresa}}. Conseguiu ver os valores para as suas datas? Se quiser reservar, é só responder por aqui que a gente confirma a disponibilidade.', modelo: '' },
          { tipo: 'esperar', minutos: 2 * 1440 },
          { tipo: 'parar_se', condicao: 'cliente_respondeu' },
          { tipo: 'parar_se', condicao: 'etapa_mudou' },
          { tipo: 'criar_tarefa', titulo: 'Retomar o pedido de reserva: valores enviados há 3 dias sem resposta', prazo_horas: 24 },
        ],
      },
    ],
  },
  restaurante: {
    id: 'restaurante',
    nome: 'Restaurante (reservas, eventos e encomendas)',
    resumo: 'Reservas de mesa e de grupo, aniversários, eventos e encomendas: a assistente anota o pedido, a equipe confirma e passa o valor, quem não respondeu é retomado no dia seguinte e, depois, o cliente recebe o convite de avaliação. (A reativação de clientes de delivery fica no app das lojas.)',
    campos: SEGMENTOS['restaurante'].campos,
    regras: { sla_minutos: 15, retorno_proposta_dias: 1, retorno_auto_cliente: false, retorno_auto_horas: 24, retorno_auto_horas_2: 0, avaliacao_auto: true, manutencao_auto: false, hora_inicio: 11, hora_fim: 23 },
    agenda: { ativa: false },
    chamada: 'Reserve sua mesa ou encomende com a gente',
    textosSite: { botao: 'Fazer pedido', titulo_servicos: 'O que oferecemos', titulo_areas: 'Onde estamos', titulo_form: 'Reserva, evento ou encomenda', texto_form: 'Conte o que você precisa, para quando e para quantas pessoas. Uma pessoa da equipe confirma e responde. O pedido ainda não é a reserva confirmada.' },
    regrasComerciais: `A assistente não confirma reserva, evento nem encomenda sozinha: anota o pedido e passa para a equipe confirmar. ${PRECO_REGRA}`,
    encaminhar: 'Eventos, grupos grandes, encomendas, alergias e restrições alimentares, reclamações e pedidos de reembolso vão para a equipe.',
    fluxosPadrao: ['boas-vindas', 'ligacao-nao-atendida'],
    fluxosProprios: [
      {
        nome: 'Orçamento de evento ou encomenda sem resposta',
        ativo: true,
        gatilho: { tipo: 'etapa_alterada', etapa: 'proposta' },
        passos: [
          { tipo: 'esperar', minutos: 1440 },
          { tipo: 'parar_se', condicao: 'cliente_respondeu' },
          { tipo: 'parar_se', condicao: 'etapa_mudou' },
          { tipo: 'enviar_whatsapp', texto: 'Oi, {{nome}}! Aqui é da {{empresa}}. Conseguiu ver o orçamento que enviamos? Se quiser confirmar ou mudar alguma coisa, é só responder por aqui.', modelo: '' },
          { tipo: 'esperar', minutos: 2 * 1440 },
          { tipo: 'parar_se', condicao: 'cliente_respondeu' },
          { tipo: 'parar_se', condicao: 'etapa_mudou' },
          { tipo: 'criar_tarefa', titulo: 'Ligar para o cliente: orçamento enviado há 3 dias sem resposta', prazo_horas: 24 },
        ],
      },
    ],
  },
  'servicos-gerais': {
    id: 'servicos-gerais',
    nome: 'Serviços (ar-condicionado, elétrica, reformas…)',
    resumo: 'Orçamento e visita técnica: a assistente entende o serviço e a urgência e marca a visita na agenda, quem não respondeu à proposta é retomado, orçamento parado vira tarefa, e depois do serviço vêm o convite de avaliação e o lembrete de manutenção (só para quem autorizou).',
    campos: SEGMENTOS['servicos-gerais'].campos,
    regras: { sla_minutos: 30, retorno_proposta_dias: 2, retorno_auto_cliente: false, retorno_auto_horas: 48, retorno_auto_horas_2: 120, avaliacao_auto: true, manutencao_auto: true, manutencao_meses: 12 },
    agenda: { ativa: true, ia_marca: true, lembrete: true },
    chamada: 'Peça seu orçamento',
    textosSite: { botao: 'Pedir orçamento', titulo_servicos: 'Serviços', titulo_areas: 'Áreas atendidas', titulo_form: 'Peça seu orçamento', texto_form: 'Conte o serviço e a urgência. Uma pessoa da equipe analisa e fala com você. O formulário não calcula valores.' },
    regrasComerciais: `O orçamento é feito pela equipe depois de entender o serviço; a assistente pode oferecer a visita técnica. ${PRECO_REGRA}`,
    encaminhar: 'Dúvidas técnicas, garantia, prazos de execução, reclamações e emergências vão para a equipe.',
    fluxosPadrao: ['boas-vindas', 'proposta-sem-resposta', 'ligacao-nao-atendida', 'orcamento-parado', 'pos-venda'],
    fluxosProprios: [],
  },
  'energia-solar': {
    id: 'energia-solar',
    nome: 'Energia solar',
    resumo: 'Orçamento com tipo de imóvel e conta de luz, visita técnica na agenda, retomada da proposta, orçamento parado, pós-venda, avaliação e lembrete de manutenção (só para quem autorizou).',
    campos: SEGMENTOS['energia-solar'].campos,
    regras: { sla_minutos: 30, retorno_proposta_dias: 2, retorno_auto_cliente: false, retorno_auto_horas: 48, retorno_auto_horas_2: 120, avaliacao_auto: true, manutencao_auto: true, manutencao_meses: 12 },
    agenda: { ativa: true, ia_marca: true, lembrete: true },
    chamada: 'Energia solar para a sua casa ou empresa',
    textosSite: { botao: 'Pedir orçamento', titulo_servicos: 'Serviços', titulo_areas: 'Áreas atendidas', titulo_form: 'Peça seu orçamento', texto_form: 'Conte o que você precisa. Uma pessoa da equipe analisa e fala com você. O formulário não calcula valores nem promete economia.' },
    regrasComerciais: `O orçamento é feito por um vendedor depois de entender o imóvel e a conta de luz. Não informar retorno do investimento pelo chat. ${PRECO_REGRA}`,
    encaminhar: 'Financiamento, garantia, dimensionamento e reclamações vão para um vendedor.',
    fluxosPadrao: ['boas-vindas', 'proposta-sem-resposta', 'ligacao-nao-atendida', 'orcamento-parado', 'pos-venda'],
    fluxosProprios: [],
  },
};

const linhas = (s: string) =>
  s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

/** "Name — description" (or "Name - description" / "Name: description") per line → site items. */
export function itensDeServico(texto: string) {
  return linhas(texto)
    .slice(0, 8)
    .map((l) => {
      const m = l.match(/^(.{1,80}?)\s*(?:—|–|-|:)\s+(.+)$/);
      return m ? { titulo: m[1].trim().slice(0, 80), texto: m[2].trim().slice(0, 400) } : { titulo: l.slice(0, 80), texto: '' };
    });
}

/** "question | answer" per line → FAQ (lines without an answer are ignored: nothing is invented). */
export function perguntasFrequentes(texto: string) {
  return linhas(texto)
    .map((l) => l.split('|'))
    .filter((p) => p.length >= 2 && p[0].trim().length >= 3 && p.slice(1).join('|').trim())
    .slice(0, 40)
    .map((p) => ({ pergunta: p[0].trim().slice(0, 200), resposta: p.slice(1).join('|').trim().slice(0, 1000) }));
}

/** The company's config, content and flows built from the model + what the owner gave. */
export function montarPeloModelo(modelo: ModeloNegocio, nome: string, dados: DadosCadastro) {
  const tel = dados.whatsapp ? normalizarTelefone(dados.whatsapp) : null;
  const regras = { ...modelo.regras, ...(dados.hora_inicio !== undefined ? { hora_inicio: dados.hora_inicio } : {}), ...(dados.hora_fim !== undefined ? { hora_fim: dados.hora_fim } : {}) };
  const config = ConfigEmpresa.parse({
    campos: modelo.campos,
    regras,
    agenda: modelo.agenda,
    ia: dados.assistente ? { nome: dados.assistente } : {},
    avaliacao: { link: dados.link_avaliacao },
    site: {
      chamada: modelo.chamada,
      ...modelo.textosSite,
      descricao: dados.descricao,
      servicos: itensDeServico(dados.servicos),
      areas: dados.cidade ? [dados.cidade.slice(0, 60)] : [],
      whatsapp: tel ? tel.slice(2) : '',
      email: dados.email,
      endereco: dados.endereco || dados.cidade,
    },
  });
  const conhecimento = Conhecimento.parse({
    descricao: dados.descricao ? `${nome}: ${dados.descricao}` : '',
    servicos: linhas(dados.servicos).join('\n').slice(0, 3000),
    horarios: dados.horarios,
    regioes: dados.cidade,
    faq: perguntasFrequentes(dados.perguntas),
    precos_autorizados: linhas(dados.precos).join('\n').slice(0, 2000),
    regras_comerciais: modelo.regrasComerciais,
    criterios_encaminhamento: modelo.encaminhar,
  });
  const fluxos = [
    ...modelo.fluxosPadrao.map((id) => {
      const m = MODELOS_DE_FLUXO.find((f) => f.id === id);
      if (!m) throw new Error(`Fluxo pronto desconhecido no modelo ${modelo.id}: ${id}`);
      // The welcome message is already the built-in order confirmation: the flow keeps only the team's part.
      const passos = id === 'boas-vindas' ? m.fluxo.passos.filter((p) => p.tipo !== 'enviar_whatsapp') : m.fluxo.passos;
      return { ...m.fluxo, passos, ativo: true };
    }),
    ...modelo.fluxosProprios,
  ].map((f) => EntradaFluxo.parse(f));
  return { config, conhecimento, fluxos };
}

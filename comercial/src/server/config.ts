import { z } from 'zod';

/** Stages of an opportunity, in board order. */
export const ETAPAS = ['novo', 'atendimento', 'qualificado', 'proposta', 'negociacao', 'ganho', 'perdido'] as const;
export type Etapa = (typeof ETAPAS)[number];
export const NOME_ETAPA: Record<Etapa, string> = {
  novo: 'Novo pedido',
  atendimento: 'Em atendimento',
  qualificado: 'Qualificado',
  proposta: 'Proposta enviada',
  negociacao: 'Negociação',
  ganho: 'Ganho',
  perdido: 'Perdido',
};
export const ETAPAS_FECHADAS: readonly Etapa[] = ['ganho', 'perdido'];

export const ESTADOS_CONVERSA = ['ia_ativa', 'aguardando_humano', 'humano_atendendo', 'encerrada'] as const;
export type EstadoConversa = (typeof ESTADOS_CONVERSA)[number];
export const NOME_ESTADO: Record<EstadoConversa, string> = {
  ia_ativa: 'IA ativa',
  aguardando_humano: 'Aguardando humano',
  humano_atendendo: 'Humano atendendo',
  encerrada: 'Encerrada',
};

export const PREFERENCIAS = ['WhatsApp', 'Ligação'] as const;

/** Extra question of a segment: shown in the form and collected by the assistant. */
const Campo = z.object({
  id: z.string().regex(/^[a-z_]{2,30}$/),
  rotulo: z.string().min(2).max(60),
  tipo: z.enum(['opcoes', 'numero', 'texto']),
  opcoes: z.array(z.string().min(1).max(40)).max(12).default([]),
  obrigatorio: z.boolean().default(false),
  pergunta: z.string().min(5).max(160),
});
export type Campo = z.infer<typeof Campo>;

/** Starting points per kind of service. A new segment is a new entry here, not a new system. */
export const SEGMENTOS: Record<string, { nome: string; campos: Campo[] }> = {
  'energia-solar': {
    nome: 'Energia solar',
    campos: [
      { id: 'tipo_imovel', rotulo: 'Tipo de imóvel', tipo: 'opcoes', opcoes: ['Casa', 'Apartamento ou condomínio', 'Comércio', 'Indústria ou galpão', 'Rural'], obrigatorio: true, pergunta: 'O imóvel é casa, apartamento, comércio, indústria ou rural?' },
      { id: 'gasto_mensal', rotulo: 'Gasto aproximado por mês com energia (R$)', tipo: 'numero', opcoes: [], obrigatorio: false, pergunta: 'Mais ou menos quanto vem a conta de luz por mês?' },
    ],
  },
  'servicos-gerais': { nome: 'Serviços em geral', campos: [] },
};

const Texto = (max: number) => z.string().trim().max(max).default('');
const Item = z.object({ titulo: z.string().trim().min(1).max(80), texto: z.string().trim().max(400).default('') });

export const ConfigEmpresa = z.object({
  site: z
    .object({
      chamada: Texto(120),
      imagem: Texto(200),
      descricao: Texto(600),
      servicos: z.array(Item).max(8).default([]),
      areas: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
      projetos: z.array(Item).max(8).default([]),
      whatsapp: Texto(20),
      email: Texto(120),
      endereco: Texto(200),
      responsavel_dados: Texto(200),
      razao_social: Texto(120),
      cnpj: Texto(20),
      privacidade: Texto(6000),
    })
    .prefault({}),
  regras: z
    .object({
      /** Minutes a new request may wait before an internal alert. */
      sla_minutos: z.number().int().min(5).max(7 * 24 * 60).default(30),
      /** Days after "proposta enviada" for the seller's follow-up task. */
      retorno_proposta_dias: z.number().int().min(1).max(60).default(2),
      /** Automatic message to the customer after a proposal (needs consent, channel rules and an idle conversation). */
      retorno_auto_cliente: z.boolean().default(false),
      retorno_auto_horas: z.number().int().min(1).max(30 * 24).default(48),
      /** Second (and last) follow-up, counted from the proposal. 0 = only one message. */
      retorno_auto_horas_2: z.number().int().min(0).max(60 * 24).default(0),
      /** Maintenance reminder, months after the service was marked as done (needs the version 2 consent). */
      manutencao_auto: z.boolean().default(false),
      manutencao_meses: z.number().int().min(1).max(36).default(12),
      /** Neutral review invitation when a service is marked as done. */
      avaliacao_auto: z.boolean().default(false),
      /** Hours past the deadline before an open task is reported to the company admins (0 = off). */
      escalar_horas: z.number().int().min(0).max(168).default(4),
      /** Daily summary in the panel, at this local hour. */
      resumo_diario: z.boolean().default(true),
      resumo_hora: z.number().int().min(0).max(23).default(8),
      /** Missed call: answer by WhatsApp right away (with the caller's consent) and create the call-back task. */
      ligacao_auto: z.boolean().default(true),
      ligacao_texto: z.string().trim().min(10).max(500).default('Oi! Aqui é {{atendente}}, da {{empresa}}. Vi que você ligou e não conseguimos atender agora. Como posso te ajudar? Se preferir, a equipe retorna a ligação.'),
      ligacao_texto_fora: z.string().trim().min(10).max(500).default('Oi! Aqui é {{atendente}}, da {{empresa}}. Recebemos sua ligação fora do nosso horário de atendimento. Assim que a equipe estiver disponível, ela te responde. Se quiser, já pode contar por aqui o que precisa.'),
      hora_inicio: z.number().int().min(0).max(23).default(8),
      hora_fim: z.number().int().min(1).max(24).default(20),
      fuso: z.string().default('America/Sao_Paulo'),
    })
    .prefault({}),
  ia: z
    .object({
      ativa: z.boolean().default(true),
      nome: z.string().trim().max(40).default('Ana'),
      modelo: Texto(60),
      limite_respostas_mes: z.number().int().min(0).max(100000).default(500),
      max_mensagens_contexto: z.number().int().min(4).max(60).default(20),
      max_tokens_resposta: z.number().int().min(100).max(2000).default(500),
    })
    .prefault({}),
  avaliacao: z.object({ link: Texto(300) }).prefault({}),
  /** Visit calendar: when visits can happen, how long they take and how many at the same time. */
  agenda: z
    .object({
      ativa: z.boolean().default(false),
      /** Weekdays with visits (0 = Sunday). */
      dias: z.array(z.number().int().min(0).max(6)).max(7).default([1, 2, 3, 4, 5]),
      hora_inicio: z.number().int().min(0).max(23).default(8),
      hora_fim: z.number().int().min(1).max(24).default(17),
      duracao_min: z.number().int().min(15).max(480).default(60),
      /** Visits at the same time (people who go to the visits). */
      capacidade: z.number().int().min(1).max(20).default(1),
      /** Minimum notice, in hours, for the assistant to book. */
      antecedencia_horas: z.number().int().min(0).max(168).default(4),
      /** How many days ahead the assistant offers. */
      janela_dias: z.number().int().min(1).max(60).default(14),
      /** The assistant offers the free times and books the visit (otherwise it only records the wish). */
      ia_marca: z.boolean().default(true),
      /** WhatsApp reminder one day before (only for who agreed). */
      lembrete: z.boolean().default(true),
    })
    .prefault({}),
  campos: z.array(Campo).max(10).default([]),
});
export type ConfigEmpresa = z.infer<typeof ConfigEmpresa>;

export function lerConfig(raw: unknown): ConfigEmpresa {
  const r = ConfigEmpresa.safeParse(raw ?? {});
  return r.success ? r.data : ConfigEmpresa.parse({});
}

export const Conhecimento = z.object({
  descricao: Texto(1500),
  servicos: Texto(3000),
  horarios: Texto(500),
  regioes: Texto(1000),
  faq: z.array(z.object({ pergunta: z.string().trim().min(3).max(200), resposta: z.string().trim().min(1).max(1000) })).max(40).default([]),
  /** Only what is written here may be quoted as a price. */
  precos_autorizados: Texto(2000),
  regras_comerciais: Texto(2000),
  criterios_encaminhamento: Texto(1500),
});
export type Conhecimento = z.infer<typeof Conhecimento>;

/** Consent text shown next to the WhatsApp checkbox; stored with each acceptance. */
/** Version of the consent text below. Version 2 added the maintenance reminder; older acceptances do not cover it. */
export const VERSAO_CONSENTIMENTO = 4;
export const TEXTO_CONSENTIMENTO_WHATSAPP = (empresa: string) =>
  `Autorizo a ${empresa} a falar comigo pelo WhatsApp sobre este pedido de orçamento, a proposta, para retornar minhas ligações, me lembrar das visitas marcadas e, depois do serviço, para me convidar a avaliar o atendimento e me lembrar da manutenção. Posso pedir para parar a qualquer momento respondendo SAIR.`;

/**
 * What the phone menu says before the call rings (configured, word for word, in the telephony service) and what is
 * recorded when the caller presses 1. A new wording gets a new version, so each record says exactly what was heard.
 */
export const VERSAO_FRASE_LIGACAO = 1;
export const FRASE_MENU_LIGACAO = (empresa: string) => `Se ninguém puder atender, quer receber uma mensagem da ${empresa} no WhatsApp, neste número? Aperte 1.`;
export const TEXTO_ACEITE_LIGACAO = (empresa: string, idChamada: string, quando: Date) =>
  `Na ligação de ${quando.toISOString()} (chamada ${idChamada}), quem ligou ouviu "${FRASE_MENU_LIGACAO(empresa)}" (frase versão ${VERSAO_FRASE_LIGACAO}) e apertou 1: autorizou uma mensagem da ${empresa} pelo WhatsApp sobre esta ligação.`;

export type Ambiente = 'desenvolvimento' | 'demonstracao' | 'producao';
export function ambiente(): Ambiente {
  const a = process.env.AMBIENTE;
  if (a === 'producao' || a === 'demonstracao' || a === 'desenvolvimento') return a;
  // Not set: a production server must never fall back to the simulators and demo tools.
  return process.env.NODE_ENV === 'production' ? 'producao' : 'desenvolvimento';
}

/** Brazilian phone → digits with country code (5511999998888), or null when it is not a valid number. */
export function normalizarTelefone(v: string): string | null {
  let d = v.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  if (!/^55[1-9]\d(9\d{8}|[2-5]\d{7})$/.test(d)) return null;
  return d;
}
export function formatarTelefone(d: string): string {
  const m = d.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : d;
}

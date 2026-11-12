import type { Campo, Conhecimento } from '../config';

/** What the assistant knows about one conversation. Built on the server; never includes other companies or credentials. */
export interface ContextoIA {
  empresa: string;
  assistente: string;
  canal: 'site' | 'whatsapp';
  conhecimento: Conhecimento;
  campos: Campo[];
  /** Fields already given in this conversation (the phone is only marked as given, never sent to the model). */
  coletado: Record<string, string | number>;
  /** What is still missing for the quote, in the order to ask, one at a time. */
  faltando: { id: string; pergunta: string }[];
}

export interface PedidoIA {
  contexto: ContextoIA;
  historico: { de: 'contato' | 'assistente'; texto: string }[];
  modelo: string;
  maxTokens: number;
}

/** The server runs (and validates) every action; the adapter only asks for it. */
export type Executar = (nome: string, entrada: unknown) => Promise<string>;

export interface RespostaIA {
  texto: string;
  tokensEntrada: number;
  tokensSaida: number;
  modelo: string;
}

export interface AdaptadorIA {
  simulada: boolean;
  responder(p: PedidoIA, executar: Executar): Promise<RespostaIA>;
}

export const MOTIVOS_ENCAMINHAMENTO = ['pedido_do_cliente', 'negociacao', 'reclamacao', 'fora_da_base', 'nao_entendi'] as const;

/** The only actions the assistant can request. Closing a sale, prices and schedules are not among them. */
export const FERRAMENTAS = [
  {
    name: 'salvar_dados',
    description:
      'Guarda dados que o cliente informou nesta conversa para o orçamento. Envie só o que o cliente realmente disse. Campos extras vão em "extras" com o id do campo. O telefone é guardado pelo sistema, não por esta ação.',
    input_schema: {
      type: 'object' as const,
      properties: {
        nome: { type: 'string' },
        cidade: { type: 'string' },
        necessidade: { type: 'string', description: 'O que o cliente precisa, em uma frase.' },
        extras: { type: 'object', additionalProperties: { type: 'string' } },
      },
    },
  },
  {
    name: 'registrar_interesse_visita',
    description: 'Registra que o cliente quer uma visita ou reunião e a preferência de dia e horário que ele disse. Não confirma a visita: a equipe confirma depois.',
    input_schema: { type: 'object' as const, properties: { preferencia: { type: 'string' } }, required: ['preferencia'] },
  },
  {
    name: 'encaminhar_para_pessoa',
    description:
      'Passa a conversa para uma pessoa da equipe. Use quando o cliente pedir, em negociação de preço, reclamação, dúvida técnica fora do conteúdo aprovado ou quando você não entendeu duas vezes.',
    input_schema: {
      type: 'object' as const,
      properties: { motivo: { type: 'string', enum: [...MOTIVOS_ENCAMINHAMENTO] }, resumo: { type: 'string', description: 'Resumo curto da conversa para o vendedor.' } },
      required: ['motivo', 'resumo'],
    },
  },
];

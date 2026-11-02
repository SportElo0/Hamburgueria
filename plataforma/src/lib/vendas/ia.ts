import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { take } from '../limits';
import { OFERTA, fatosDoContato, rascunhoSimulado, type Contexto } from './regras';

/**
 * Who writes the drafts. By default the simulator (fixed sentences, no AI, no cost). The AI only runs when the team
 * turns it on in Vercel with VENDAS_IA=claude and an ANTHROPIC_API_KEY, and even then under a monthly cap.
 * The economical model (Claude Haiku 5.5) is the default, as agreed on 02/11/2026; VENDAS_IA_MODELO overrides it.
 * Every draft, AI or not, goes to the approval queue: the AI never sends anything.
 */

export const MODELO_PADRAO = 'claude-haiku-5-5';
const LIMITE_MES_PADRAO = 100;

export const iaLigada = () => process.env.VENDAS_IA === 'claude' && Boolean(process.env.ANTHROPIC_API_KEY?.trim());
const modelo = () => process.env.VENDAS_IA_MODELO?.trim() || MODELO_PADRAO;
const limiteMes = () => {
  const n = Number(process.env.VENDAS_IA_LIMITE_MES);
  return Number.isInteger(n) && n >= 0 ? n : LIMITE_MES_PADRAO;
};

const saidaSchema = z.object({
  assunto: z.string(),
  corpo: z.string(),
});

const SISTEMA = `Você escreve e-mails de primeiro contato da Growlift, uma agência de São Paulo que faz sites para negócios locais.
Regras que não podem ser quebradas:
- Use só os fatos da lista que vem na mensagem. Não invente clientes, depoimentos, números, resultados, prazos, nomes de pessoas nem nada sobre o negócio.
- Não prometa aumento de vendas, de clientes nem posição no Google.
- Preços: só R$ 247 (Start) e R$ 597 (Grow), e só se estiverem nos fatos.
- Tom: português do Brasil, simples, educado, de pessoa para pessoa, sem exagero, sem pressão e sem emoji.
- Diga quem somos e por que estamos escrevendo. Termine oferecendo o diagnóstico grátis e pedindo para responder o e-mail.
- No máximo 900 caracteres no corpo. Sem links, sem assinatura e sem rodapé (o rodapé com CNPJ e descadastro é colocado depois).
- Um acompanhamento é curto (até 400 caracteres), lembra o primeiro e-mail e diz que basta responder "sair" para não receber mais.`;

export interface ResultadoIA {
  assunto: string;
  corpo: string;
  origem: 'simulado' | 'ia';
  modelo?: string;
  fatos: string[];
  aviso?: string;
}

/** The client is a parameter so tests can pass a fake one; nothing in the tests reaches the network. */
export type Cliente = Pick<Anthropic, 'messages'>;

export async function escreverRascunho(c: Contexto, { cliente, mes }: { cliente?: Cliente; mes: string }): Promise<ResultadoIA> {
  const fatos = fatosDoContato(c);
  const simulado = (aviso?: string): ResultadoIA => ({ ...rascunhoSimulado(c), origem: 'simulado', fatos, aviso });
  if (!cliente && !iaLigada()) return simulado();
  if (!(await take('vendas-ia', 'rascunho', limiteMes(), mes))) return simulado('Limite de rascunhos com IA do mês atingido: este foi feito pelo simulador.');
  const api = cliente ?? new Anthropic();
  try {
    const res = await api.messages.parse({
      model: modelo(),
      max_tokens: 2000,
      output_config: { effort: 'low', format: zodOutputFormat(saidaSchema) },
      system: SISTEMA,
      messages: [
        {
          role: 'user',
          content: [
            `Tipo: ${c.tipo === 'primeiro' ? 'primeiro contato' : 'acompanhamento (o primeiro e-mail não teve resposta)'}.`,
            `Negócio: ${c.negocio}.`,
            'Fatos que você pode usar:',
            ...fatos.map((f) => `- ${f}`),
            `Oferta de diagnóstico: ${OFERTA.diagnostico}`,
          ].join('\n'),
        },
      ],
    });
    if (res.stop_reason === 'refusal' || !res.parsed_output) return simulado('A IA não devolveu um texto válido: este foi feito pelo simulador.');
    return { ...res.parsed_output, origem: 'ia', modelo: res.model, fatos };
  } catch (err) {
    console.error('vendas ia', err instanceof Error ? err.message : 'erro');
    return simulado('A IA não respondeu agora: este foi feito pelo simulador.');
  }
}

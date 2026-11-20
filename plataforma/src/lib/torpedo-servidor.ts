import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { storage } from './storage';
import { take, dayWindow } from './limits';
import { comLinhaSair } from './importados';
import { iaCampanhaLigada } from './importados-servidor';
import { todaySP } from './ordering';

/**
 * "Torpedo": the owner plans the next WhatsApp campaign talking to the AI ("quero fazer promoção do bacon hoje"),
 * the AI asks what is missing and writes the message; the plan (message + day) is saved for the store.
 *   clientes/<slug>/torpedo.json   the next send: message, day, who wrote it
 * Sending stays manual (wa.me from the owner's phone): no API, no cost per message.
 */

export interface PlanoTorpedo {
  mensagem: string;
  /** YYYY-MM-DD (São Paulo). */
  dia: string;
  quantos: number;
  atualizadoEm: string;
  por: string;
}

const kPlano = (slug: string) => `clientes/${slug}/torpedo.json`;

export async function getPlano(slug: string): Promise<PlanoTorpedo | null> {
  return (await storage().readJSON<PlanoTorpedo>(kPlano(slug)))?.data ?? null;
}

export async function savePlano(slug: string, plano: PlanoTorpedo) {
  await storage().writeJSON(kPlano(slug), plano);
}

export async function apagarPlano(slug: string) {
  await storage().remove(kPlano(slug));
}

// ------------------------------------------------------------------ the conversation

export interface Fala {
  quem: 'dono' | 'ia';
  texto: string;
}

export const MAX_FALAS = 16;
export const MAX_FALA = 800;
/** Per store per day: a few campaigns worth of conversation, never a runaway bill. */
const LIMITE_DIA = 80;
const MODELO = () => process.env.CAMPANHA_IA_MODELO?.trim() || 'claude-haiku-5-5';

const sistema = (loja: string, hoje: string) => `Você ajuda o dono do ${loja} (lanchonete/restaurante) a preparar a próxima mensagem de promoção no WhatsApp para clientes antigos que aceitaram receber ofertas. Hoje é ${hoje}.
Como conversar:
- Português do Brasil, curto e simpático, como um ajudante da loja. No máximo 2 frases por resposta.
- Entenda o que ele quer (ex.: "o bacon não está saindo"). Se faltar algo importante para a oferta (preço ou desconto, até quando vale, se é delivery ou balcão), pergunte UMA coisa por vez. Pode sugerir ideias (combo, preço especial num dia), mas quem decide é ele.
- Quando tiver o suficiente, chame a ferramenta preparar_mensagem com a mensagem pronta e diga em 1 frase que deixou pronta e que ele pode ajustar.
- Se ele pedir mudança, chame preparar_mensagem de novo com a versão nova.
Regras da mensagem:
- No máximo 3 frases e 320 caracteres, tom de dono falando com cliente. No máximo 1 emoji. Sem hashtags.
- Só o que o dono confirmou: nunca invente preço, desconto, prazo, brinde, sorteio nem escassez ("últimas unidades", "só hoje") que ele não disse.
- Não use o nome do cliente (vai a mesma para vários). Não diga que é mensagem automática nem que foi escrita por IA.
- Se a oferta tiver preço ou desconto, a mensagem diz até quando vale e se é delivery, balcão ou os dois. Se o dono não disse, pergunte antes de preparar.
- Nada de "o melhor", "o mais pedido", "nº 1", "grátis" com condição escondida, nem "de/por" se o dono não confirmou o preço antigo.
- Não fale de saúde ("saudável", "emagrece") nem de bebida alcoólica sem o dono pedir. Se ele pedir bebida alcoólica, não use apelo a menores nem a consumo exagerado.
- Não escreva a linha de "responda SAIR": ela é colocada depois.`;

const FERRAMENTA: Anthropic.Tool = {
  name: 'preparar_mensagem',
  description: 'Deixa pronta a mensagem de WhatsApp que o dono vai mandar aos clientes. Use quando já souber a oferta.',
  input_schema: {
    type: 'object',
    properties: { mensagem: { type: 'string', description: 'O texto da mensagem, sem a linha de SAIR.' } },
    required: ['mensagem'],
  },
};

export type RespostaTorpedo = { ok: true; resposta: string; mensagem: string | null } | { ok: false; error: string };

const limpar = (t: string, max: number) => t.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);

export async function conversar(slug: string, loja: string, falas: Fala[], opts: { agora?: Date; cliente?: Pick<Anthropic, 'messages'> } = {}): Promise<RespostaTorpedo> {
  const agora = opts.agora ?? new Date();
  if (!iaCampanhaLigada()) return { ok: false, error: 'A IA ainda não está ligada neste app. Escreva a mensagem no campo abaixo.' };
  const historico = falas
    .slice(-MAX_FALAS)
    .map((f) => ({ role: f.quem === 'dono' ? ('user' as const) : ('assistant' as const), content: limpar(f.texto, MAX_FALA) }))
    .filter((m) => m.content);
  // The API wants the conversation to start with the owner and alternate.
  while (historico.length && historico[0].role !== 'user') historico.shift();
  const msgs: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const m of historico) {
    const last = msgs[msgs.length - 1];
    if (last && last.role === m.role) last.content += `\n${m.content}`;
    else msgs.push({ ...m });
  }
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return { ok: false, error: 'Escreva o que você quer fazer.' };
  if (!(await take('torpedo-ia', slug, LIMITE_DIA, dayWindow()))) return { ok: false, error: 'Chegou no limite de conversa com a IA de hoje. Amanhã libera de novo.' };

  const hoje = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long' }).format(agora) + ` (${todaySP(agora)})`;
  try {
    const res = await (opts.cliente ?? new Anthropic()).messages.create({
      model: MODELO(),
      max_tokens: 600,
      system: sistema(loja, hoje),
      tools: [FERRAMENTA],
      messages: msgs,
    });
    let resposta = '';
    let mensagem: string | null = null;
    for (const b of res.content) {
      if (b.type === 'text') resposta += b.text;
      if (b.type === 'tool_use' && b.name === 'preparar_mensagem') {
        const m = (b.input as { mensagem?: unknown }).mensagem;
        if (typeof m === 'string' && m.trim()) mensagem = comLinhaSair(limpar(m.replace(/^["“]|["”]$/g, ''), 500));
      }
    }
    resposta = limpar(resposta, MAX_FALA) || (mensagem ? 'Deixei a mensagem pronta aqui embaixo. Se quiser mudar algo, é só falar.' : 'Pode me contar um pouco mais?');
    return { ok: true, resposta, mensagem };
  } catch (err) {
    console.error('torpedo ia', err);
    return { ok: false, error: 'A IA não respondeu agora. Tente de novo em instantes.' };
  }
}

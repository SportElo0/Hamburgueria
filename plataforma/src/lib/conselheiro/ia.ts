import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { storage } from '../storage';
import { take, count } from '../limits';
import { chave, contexto, hoje, limpar, mutar, novoId } from './dados';
import { FERRAMENTAS, executorPara, resumoDoRestaurante, type Cartao } from './ferramentas';
import { SISTEMA, VERSAO_METODOS, descreverMetodo, metodoProvavel, verificarResposta } from './metodos';
import { USO_VAZIO, type UsoMes } from './modelo';

/**
 * O Conselheiro conversando. Liga só com CONSELHEIRO_IA=claude e ANTHROPIC_API_KEY na Vercel; sem isso a
 * conversa fica em "configuração pendente" (as outras telas funcionam igual). Cada pergunta passa por um
 * limite mensal por loja e o uso (tokens, tempo, erros e custo estimado) fica registrado por mês.
 *
 *   conselheiro/<slug>/conversas.json          índice das conversas
 *   conselheiro/<slug>/conversas/<id>.json     mensagens (texto e cartões)
 *   conselheiro/<slug>/uso/<AAAA-MM>.json      uso da IA no mês
 */

export const MODELO_PADRAO = 'claude-opus-5-5';
const LIMITE_MES_PADRAO = 150;
const MAX_PASSOS = 6;
/** Turnos anteriores que vão junto (só o texto): o resto fica guardado, mas não é reenviado. */
const HISTORICO = 6;

/** Dólares por milhão de tokens (entrada, saída, leitura de cache). Tabela de 2026-10; ajuste se a Anthropic mudar. */
export const PRECOS: Record<string, { entrada: number; saida: number; cache: number }> = {
  'claude-opus-5-5': { entrada: 4, saida: 20, cache: 0.2 },
  'claude-sonnet-5-5': { entrada: 2, saida: 10, cache: 0.2 },
  'claude-haiku-5-5': { entrada: 0.1, saida: 0.5, cache: 0.01 },
};

export const iaLigada = () => process.env.CONSELHEIRO_IA === 'claude' && Boolean(process.env.ANTHROPIC_API_KEY?.trim());
/** Teto de perguntas por mês somando todas as lojas (protege a conta da Anthropic). */
export function limiteGlobalMes() {
  const n = Number(process.env.CONSELHEIRO_IA_LIMITE_GLOBAL_MES);
  return Number.isInteger(n) && n >= 0 ? n : 2000;
}
export const modelo = () => process.env.CONSELHEIRO_IA_MODELO?.trim() || MODELO_PADRAO;
export function limiteMes() {
  const n = Number(process.env.CONSELHEIRO_IA_LIMITE_MES);
  return Number.isInteger(n) && n >= 0 ? n : LIMITE_MES_PADRAO;
}
const mesDe = (now: Date) => hoje(now).slice(0, 7);

export interface Mensagem {
  id: string;
  papel: 'dono' | 'conselheiro';
  texto: string;
  cartoes: Cartao[];
  /** Método provável e versão das regras com que a resposta foi dada. */
  metodo: string | null;
  versao: string;
  avisos: string[];
  ferramentas: { nome: string; ok: boolean }[];
  em: string;
  por: string;
}

export interface Conversa {
  id: string;
  titulo: string;
  mensagens: Mensagem[];
  criadaEm: string;
  criadaPor: string;
}

const conversaIdSchema = z.string().regex(/^cv-[a-f0-9]{12}$/);

export async function listarConversas(slug: string) {
  return (await storage().readJSON<{ id: string; titulo: string; em: string }[]>(chave(slug, 'conversas.json')))?.data ?? [];
}

export async function getConversa(slug: string, id: string): Promise<Conversa | null> {
  if (!conversaIdSchema.safeParse(id).success) return null;
  return (await storage().readJSON<Conversa>(chave(slug, `conversas/${id}.json`)))?.data ?? null;
}

export async function getUso(slug: string, mes: string): Promise<UsoMes> {
  return { ...USO_VAZIO, ...((await storage().readJSON<UsoMes>(chave(slug, `uso/${mes}.json`)))?.data ?? {}) };
}

async function registrarUso(slug: string, mes: string, delta: Partial<UsoMes>) {
  await mutar<UsoMes>(chave(slug, `uso/${mes}.json`), () => ({ ...USO_VAZIO }), (u) => {
    const novo = { ...USO_VAZIO, ...u };
    for (const [k, v] of Object.entries(delta)) novo[k as keyof UsoMes] += v ?? 0;
    return { novo };
  }).catch((err) => console.error('conselheiro uso', err instanceof Error ? err.message : 'erro'));
}

export function custoMicroUsd(model: string, u: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null }) {
  const p = PRECOS[model] ?? PRECOS[MODELO_PADRAO];
  const cacheLido = u.cache_read_input_tokens ?? 0;
  const cacheEscrito = u.cache_creation_input_tokens ?? 0;
  // $/milhão × tokens = milionésimos de dólar. Escrita no cache custa 1,25× a entrada.
  return Math.round(u.input_tokens * p.entrada + cacheEscrito * p.entrada * 1.25 + cacheLido * p.cache + u.output_tokens * p.saida);
}

export type Cliente = Pick<Anthropic, 'beta'>;

export type Resposta =
  | { estado: 'ok'; conversaId: string; mensagem: Mensagem }
  | { estado: 'configuracao-pendente' }
  | { estado: 'limite'; limite: number }
  | { estado: 'erro'; conversaId: string; erro: string };

async function gravarTurno(slug: string, conversaId: string | null, pergunta: Mensagem, resposta: Mensagem | null, by: string, now: Date) {
  const id = conversaId && (await getConversa(slug, conversaId)) ? conversaId : `cv-${novoId('x').slice(2)}`;
  await mutar<Conversa | null, Conversa>(chave(slug, `conversas/${id}.json`), () => null, (c) => {
    const atual: Conversa = c ?? { id, titulo: limpar(pergunta.texto, 80), mensagens: [], criadaEm: now.toISOString(), criadaPor: by };
    const mensagens = [...atual.mensagens, pergunta, ...(resposta ? [resposta] : [])].slice(-200);
    return { novo: { ...atual, mensagens }, retorno: { ...atual, mensagens } };
  });
  if (!conversaId || conversaId !== id) {
    await mutar<{ id: string; titulo: string; em: string }[]>(chave(slug, 'conversas.json'), () => [], (l) => ({ novo: [{ id, titulo: limpar(pergunta.texto, 80), em: now.toISOString() }, ...l].slice(0, 200) }));
  }
  return id;
}

/**
 * Responde uma pergunta do dono. `slug` já veio conferido pela sessão; as ferramentas só enxergam essa
 * loja. A IA não grava nada: os cartões voltam para a tela, e só um clique do dono salva.
 */
export async function responder(slug: string, input: { conversaId: string | null; pergunta: string }, by: string, opts: { cliente?: Cliente; now?: Date } = {}): Promise<Resposta> {
  const now = opts.now ?? new Date();
  const texto = limpar(input.pergunta, 1500);
  if (!texto) throw new Error('Escreva a pergunta.');
  if (!opts.cliente && !iaLigada()) return { estado: 'configuracao-pendente' };
  const mes = mesDe(now);
  const limite = limiteMes();
  if (!(await take('conselheiro-ia', slug, limite, mes))) return { estado: 'limite', limite };
  if (!(await take('conselheiro-ia-global', 'todas', limiteGlobalMes(), mes))) return { estado: 'limite', limite };

  const ctx = await contexto(slug, now);
  const anterior = input.conversaId ? await getConversa(slug, input.conversaId) : null;
  const metodo = metodoProvavel(texto);
  const perguntaMsg: Mensagem = { id: novoId('m'), papel: 'dono', texto, cartoes: [], metodo: null, versao: VERSAO_METODOS, avisos: [], ferramentas: [], em: now.toISOString(), por: by };

  const historico: Anthropic.Beta.BetaMessageParam[] = (anterior?.mensagens ?? []).slice(-HISTORICO).map((m) => ({ role: m.papel === 'dono' ? 'user' : 'assistant', content: m.texto || '(sem texto)' }));
  // A API pede que a conversa comece pelo usuário e alterne; um histórico cortado no meio começa certo assim.
  while (historico.length && historico[0].role !== 'user') historico.shift();
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...historico,
    {
      role: 'user',
      content: [
        `<restaurante>\n${resumoDoRestaurante(ctx)}\n</restaurante>`,
        metodo ? `<metodo_provavel>\n${descreverMetodo(metodo)}\n</metodo_provavel>` : '',
        `<pergunta_do_dono>\n${texto}\n</pergunta_do_dono>`,
      ]
        .filter(Boolean)
        .join('\n\n'),
    },
  ];

  const api = opts.cliente ?? new Anthropic();
  const executar = executorPara(ctx, now);
  const cartoes: Cartao[] = [];
  const usadas: { nome: string; ok: boolean }[] = [];
  const model = modelo();
  let textoFinal = '';
  const avisos: string[] = [];
  const inicio = Date.now();
  try {
    for (let passo = 0; passo < MAX_PASSOS; passo++) {
      const res = await api.beta.messages.create({
        model,
        max_tokens: 8000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium' },
        system: [{ type: 'text', text: SISTEMA, cache_control: { type: 'ephemeral' } }],
        tools: FERRAMENTAS,
        messages,
      });
      await registrarUso(slug, mes, {
        chamadas: 1,
        tokensEntrada: res.usage.input_tokens,
        tokensSaida: res.usage.output_tokens,
        tokensCache: res.usage.cache_read_input_tokens ?? 0,
        // Custo pelo modelo que respondeu (a Anthropic pode trocar o modelo se o principal recusar).
        custoMicroUsd: custoMicroUsd(res.model in PRECOS ? res.model : model, res.usage),
      });
      const textos = res.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map((b) => b.text);
      if (res.stop_reason === 'refusal') {
        textoFinal = 'Não consegui responder essa pergunta. Tente perguntar de outro jeito, sobre preço, promoção, combo, cardápio ou testes.';
        break;
      }
      const usos = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
      if (res.stop_reason !== 'tool_use' || !usos.length) {
        textoFinal = textos.join('\n\n').trim();
        if (res.stop_reason === 'max_tokens') avisos.push('A resposta foi cortada por tamanho. Peça para continuar ou faça uma pergunta mais específica.');
        break;
      }
      messages.push({ role: 'assistant', content: res.content });
      const resultados: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const u of usos) {
        const saida = await executar(u.name, u.input);
        usadas.push({ nome: u.name, ok: !saida.erro });
        if (saida.cartao) cartoes.push(saida.cartao);
        resultados.push({ type: 'tool_result', tool_use_id: u.id, content: saida.conteudo, is_error: saida.erro });
      }
      messages.push({ role: 'user', content: resultados });
      if (passo === MAX_PASSOS - 1) {
        textoFinal = textos.join('\n\n').trim();
        avisos.push('A análise parou no limite de passos: os cartões abaixo mostram o que já foi consultado e calculado. Faça uma pergunta mais específica para continuar.');
      }
    }
  } catch (err) {
    await registrarUso(slug, mes, { erros: 1, latenciaMs: Date.now() - inicio });
    console.error('conselheiro ia', err instanceof Error ? err.message : 'erro');
    const id = await gravarTurno(slug, input.conversaId, perguntaMsg, null, by, now);
    return { estado: 'erro', conversaId: id, erro: 'O Conselheiro não respondeu agora. Os simuladores continuam funcionando; tente de novo em alguns minutos.' };
  }
  await registrarUso(slug, mes, { latenciaMs: Date.now() - inicio });
  if (!textoFinal && !cartoes.length) textoFinal = 'Não consegui montar uma resposta. Tente de novo com o produto e o canal.';
  const resposta: Mensagem = {
    id: novoId('m'),
    papel: 'conselheiro',
    texto: textoFinal,
    cartoes,
    metodo: metodo?.id ?? null,
    versao: VERSAO_METODOS,
    avisos: [...avisos, ...verificarResposta(textoFinal)],
    ferramentas: usadas,
    em: new Date().toISOString(),
    por: 'Conselheiro',
  };
  const conversaId = await gravarTurno(slug, input.conversaId, perguntaMsg, resposta, by, now);
  return { estado: 'ok', conversaId, mensagem: resposta };
}

/** Perguntas usadas no mês (para mostrar quanto do limite foi usado). */
export const perguntasNoMes = (slug: string, now = new Date()) => count('conselheiro-ia', slug, mesDe(now));

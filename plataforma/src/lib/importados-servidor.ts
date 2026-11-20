import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { storage, ConflictError } from './storage';
import { take, dayWindow } from './limits';
import { DIAS_ENTRE_ENVIOS, comLinhaSair, mensagemModelo, type Importado } from './importados';

/**
 * Where the imported customers live, per store:
 *   clientes/<slug>/importados.json   the last import (who, when, the store's consent statement, the customers)
 *   clientes/<slug>/enviados.json     phone → when the campaign link was last opened for them
 * Opt-outs ("SAIR") stay in the existing clientes/<slug>/descadastro.json, shared with the site's customers.
 * A new import replaces the old one; "Apagar lista" deletes both files.
 */

export interface Importacao {
  fonte: 'Anota Aí' | 'Planilha';
  importadoEm: string;
  /** The store's statement that everyone in the list accepted offers on WhatsApp (LGPD: the store is the controller). */
  aceite: { por: string; em: string; texto: string };
  clientes: Importado[];
}

export const TEXTO_ACEITE = 'Confirmo que todos os clientes desta lista aceitaram receber ofertas da loja pelo WhatsApp, e que a loja guarda a prova desse aceite.';

const kImport = (slug: string) => `clientes/${slug}/importados.json`;
const kEnviados = (slug: string) => `clientes/${slug}/enviados.json`;

export async function getImportacao(slug: string): Promise<Importacao | null> {
  return (await storage().readJSON<Importacao>(kImport(slug)))?.data ?? null;
}

export async function saveImportacao(slug: string, imp: Importacao) {
  await storage().writeJSON(kImport(slug), imp);
}

export async function apagarImportacao(slug: string) {
  await storage().remove(kImport(slug)).catch(() => {});
  await storage().remove(kEnviados(slug)).catch(() => {});
}

export async function getEnviados(slug: string): Promise<Record<string, string>> {
  return (await storage().readJSON<Record<string, string>>(kEnviados(slug)))?.data ?? {};
}

export async function marcarEnviado(slug: string, phone: string, now = new Date()) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await storage().readJSON<Record<string, string>>(kEnviados(slug));
    const data = { ...(doc?.data ?? {}), [phone]: now.toISOString() };
    try {
      await storage().writeJSON(kEnviados(slug), data, doc ? doc.etag : null);
      return;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
}

/** What the owner sees about the current list (who imported, when, how many were messaged in 30 days). */
export function resumoDaImportacao(imp: Importacao, enviados: Record<string, string>, now = new Date()) {
  const desde = now.getTime() - DIAS_ENTRE_ENVIOS * 86_400_000;
  return {
    fonte: imp.fonte,
    importadoEm: imp.importadoEm,
    aceitePor: imp.aceite.por,
    total: imp.clientes.length,
    enviadosNoMes: Object.values(enviados).filter((d) => new Date(d).getTime() >= desde).length,
  };
}

// ------------------------------------------------------------------ the campaign text, written by AI

/** On with ANTHROPIC_API_KEY in Vercel; without it the panel uses the ready-made text. */
export const iaCampanhaLigada = () => Boolean(process.env.ANTHROPIC_API_KEY?.trim()) && process.env.CAMPANHA_IA !== 'desligada';
const MODELO = () => process.env.CAMPANHA_IA_MODELO?.trim() || 'claude-haiku-5-5';
/** Per store per day: enough to try a few versions, never a runaway bill. */
const LIMITE_DIA = 20;

const SISTEMA = `Você escreve UMA mensagem curta de WhatsApp de uma lanchonete ou restaurante para um cliente antigo que está há um tempo sem pedir.
Regras:
- Português do Brasil, tom simpático e direto, como o dono falaria. No máximo 3 frases e 320 caracteres.
- Use só a oferta que o dono escreveu. Não invente preço, desconto, prazo, brinde, sorteio nem escassez ("últimas unidades", "só hoje") que não estejam na oferta.
- Não diga que é mensagem automática nem que foi escrita por IA. Não use o nome do cliente (a mesma mensagem vai para vários).
- No máximo 1 emoji. Sem hashtags. Sem links, a não ser o link que o dono escreveu.
- Não escreva a linha de "responda SAIR": ela é colocada depois.
Responda só com o texto da mensagem.`;

export type ResultadoIA = { ok: true; texto: string; ia: boolean } | { ok: false; error: string };

export async function escreverMensagem(slug: string, loja: string, oferta: string): Promise<ResultadoIA> {
  const o = oferta.trim().slice(0, 300);
  if (!iaCampanhaLigada()) return { ok: true, texto: mensagemModelo(loja, o), ia: false };
  if (!(await take('campanha-ia', slug, LIMITE_DIA, dayWindow()))) return { ok: false, error: 'Limite de mensagens com IA de hoje atingido. Use o texto pronto ou tente amanhã.' };
  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: MODELO(),
      max_tokens: 300,
      system: SISTEMA,
      messages: [{ role: 'user', content: `Loja: ${loja}\nOferta que o dono quer mandar: ${o || '(nenhuma: só chamar o cliente de volta, sem desconto)'}` }],
    });
    const texto = res.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()
      .replace(/^["“]|["”]$/g, '')
      .slice(0, 500);
    if (!texto) return { ok: true, texto: mensagemModelo(loja, o), ia: false };
    return { ok: true, texto: comLinhaSair(texto), ia: true };
  } catch (err) {
    console.error('campanha ia', err);
    return { ok: true, texto: mensagemModelo(loja, o), ia: false };
  }
}

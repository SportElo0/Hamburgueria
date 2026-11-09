import 'server-only';
import crypto from 'node:crypto';
import { storage, ConflictError } from './storage';

/**
 * "Caixa Portugal": painel pessoal do Antônio e do amigo para juntar o dinheiro da viagem (15/01 a 05/02/2027).
 * Não tem nada a ver com as lojas: fica em `viagem/` no armazenamento do painel e é protegido por um PIN
 * criado na primeira visita (guardado só como hash scrypt). 8 erros em 15 minutos travam o acesso por 15 minutos.
 */

const DADOS = 'viagem/dados.json';
const ACESSO = 'viagem/acesso.json';
const MAX_ERROS = 8;
const JANELA_MS = 15 * 60 * 1000;

interface Acesso {
  salt: string;
  hash: string;
  erros: number;
  desde: number;
  travadoAte: number;
}

export const SEED = {
  versao: 1,
  config: { nomes: ['Antônio', 'Amigo'], ticketSite: 120000 },
  entradas: [] as unknown[],
  contatos: [] as unknown[],
  custos: (
    [
      ['passagens', 'Passagens SP–Lisboa ida e volta (2)', 900000],
      ['comida', 'Comida, 21 dias (2)', 378000],
      ['transporte', 'Gasolina com o primo + transporte (2)', 144000],
      ['sacos', 'Sacos de dormir 0 °C (2)', 60000],
      ['seguro', 'Seguro viagem (2)', 50000],
      ['chip', 'Chip de internet (2)', 20000],
      ['cartorio', 'Autorização de viagem no cartório', 5000],
      ['passeios', 'Passeios e extras (2)', 120000],
      ['reserva', 'Reserva para emergência (2)', 200000],
    ] as const
  ).map(([id, item, valor], i) => ({ id, item, valor, pago: false, ordem: i + 1 })),
  tarefas: (
    [
      ['oferta', 'Montar a oferta de site e a mensagem de primeiro contato', '2026-11-13'],
      ['lista', 'Fazer a lista de 50 empresas de ar-condicionado', '2026-11-15'],
      ['alerta', 'Pôr alerta de preço das passagens (Google Voos)', '2026-11-15'],
      ['primo', 'Combinar com o primo: dormir no carro no condomínio, banheiro e banho', '2026-11-20'],
      ['passaporte', 'Conferir se os passaportes valem até maio de 2027', '2026-11-20'],
      ['passagens', 'Comprar as passagens', '2026-12-05'],
      ['etias', 'Ver se o ETIAS já vale em janeiro', '2026-12-15'],
      ['autorizacao', 'Autorização de viagem no cartório (mãe e pai), com o nome do amigo', '2026-12-20'],
      ['seguro', 'Contratar o seguro viagem', '2027-01-05'],
      ['sacos', 'Comprar os sacos de dormir para 0 °C', '2027-01-05'],
      ['sites', 'Entregar todos os sites vendidos antes de viajar', '2027-01-10'],
      ['chip', 'Comprar chip ou eSIM de internet', '2027-01-12'],
    ] as const
  ).map(([id, titulo, prazo]) => ({ id, titulo, prazo, feito: false })),
};

const hashPin = (pin: string, salt: string) => crypto.scryptSync(pin, salt, 32).toString('hex');

export async function temPin() {
  return Boolean(await storage().readJSON<Acesso>(ACESSO));
}

/** Cria o PIN só se ainda não existe (gravação que falha se o documento apareceu no meio). */
export async function criarPin(pin: string): Promise<'ok' | 'invalido' | 'existe'> {
  if (!/^\d{6,12}$/.test(pin)) return 'invalido';
  const salt = crypto.randomBytes(16).toString('hex');
  try {
    await storage().writeJSON<Acesso>(ACESSO, { salt, hash: hashPin(pin, salt), erros: 0, desde: 0, travadoAte: 0 }, null);
  } catch (err) {
    if (err instanceof ConflictError) return 'existe';
    throw err;
  }
  if (!(await storage().readJSON(DADOS))) await storage().writeJSON(DADOS, SEED, null).catch(() => undefined);
  return 'ok';
}

export async function conferirPin(pin: string, agora = Date.now()): Promise<'ok' | 'errado' | 'travado' | 'sem-pin'> {
  const doc = await storage().readJSON<Acesso>(ACESSO);
  if (!doc) return 'sem-pin';
  const a = doc.data;
  if (a.travadoAte && a.travadoAte > agora) return 'travado';
  const certo = /^\d{6,12}$/.test(pin) && crypto.timingSafeEqual(Buffer.from(hashPin(pin, a.salt), 'hex'), Buffer.from(a.hash, 'hex'));
  if (certo) {
    if (a.erros) await storage().writeJSON(ACESSO, { ...a, erros: 0, desde: 0, travadoAte: 0 }, doc.etag).catch(() => undefined);
    return 'ok';
  }
  const novaJanela = !a.desde || agora - a.desde > JANELA_MS;
  const erros = (novaJanela ? 0 : a.erros || 0) + 1;
  await storage()
    .writeJSON(ACESSO, { ...a, erros, desde: novaJanela ? agora : a.desde, travadoAte: erros >= MAX_ERROS ? agora + JANELA_MS : 0 }, doc.etag)
    .catch(() => undefined);
  return erros >= MAX_ERROS ? 'travado' : 'errado';
}

// ───────────── validação: só o formato esperado entra ─────────────
const txt = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const cent = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100_000_000 ? v : 0);
const dia = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const id = (v: unknown) => (typeof v === 'string' && /^[\w-]{1,40}$/.test(v) ? v : crypto.randomBytes(6).toString('hex'));
const lista = (v: unknown, max: number): Record<string, unknown>[] => (Array.isArray(v) ? v.slice(0, max).map((x) => (x && typeof x === 'object' ? (x as Record<string, unknown>) : {})) : []);
const ETAPAS = ['contato', 'conversa', 'proposta', 'fechou', 'perdeu'];
const ORIGENS = ['site', '3d', 'outro'];

export function validar(d: unknown) {
  if (!d || typeof d !== 'object') throw new Error('dados inválidos');
  const o = d as Record<string, unknown>;
  const config = (o.config && typeof o.config === 'object' ? o.config : {}) as Record<string, unknown>;
  const nomes = (Array.isArray(config.nomes) ? config.nomes.slice(0, 2) : []).map((n) => txt(n, 30) || 'Pessoa');
  while (nomes.length < 2) nomes.push('Pessoa');
  return {
    versao: 1,
    config: { nomes, ticketSite: cent(config.ticketSite) },
    entradas: lista(o.entradas, 500).map((x) => ({ id: id(x.id), valor: cent(x.valor), data: dia(x.data), pessoa: [0, 1, 2].includes(x.pessoa as number) ? x.pessoa : 2, origem: ORIGENS.includes(x.origem as string) ? x.origem : 'outro', descricao: txt(x.descricao, 80), criadoEm: txt(x.criadoEm, 40) })),
    contatos: lista(o.contatos, 500).map((x) => ({ id: id(x.id), empresa: txt(x.empresa, 70) || 'Empresa', etapa: ETAPAS.includes(x.etapa as string) ? x.etapa : 'contato', nota: txt(x.nota, 120), atualizadoEm: txt(x.atualizadoEm, 40) })),
    custos: lista(o.custos, 60).map((x, i) => ({ id: id(x.id), item: txt(x.item, 60) || 'Custo', valor: cent(x.valor), pago: x.pago === true, ordem: Number.isInteger(x.ordem) ? x.ordem : i + 1 })),
    tarefas: lista(o.tarefas, 100).map((x) => ({ id: id(x.id), titulo: txt(x.titulo, 90) || 'Tarefa', prazo: dia(x.prazo), feito: x.feito === true })),
  };
}

export async function lerDados() {
  const doc = await storage().readJSON<unknown>(DADOS);
  if (doc) return { dados: doc.data, etag: doc.etag };
  try {
    const etag = await storage().writeJSON(DADOS, SEED, null);
    return { dados: SEED as unknown, etag };
  } catch (err) {
    if (!(err instanceof ConflictError)) throw err;
    const d = (await storage().readJSON<unknown>(DADOS))!;
    return { dados: d.data, etag: d.etag };
  }
}

/** Grava se ninguém gravou depois do `etag` lido; senão lança ConflictError. */
export async function gravarDados(dados: unknown, etag: string) {
  const limpo = validar(dados);
  return { dados: limpo, etag: await storage().writeJSON(DADOS, limpo, etag) };
}

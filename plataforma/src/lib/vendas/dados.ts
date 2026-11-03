import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { ConflictError, storage } from '../storage';
import { gravacaoPermitida } from '../ambiente';
import { dayWindow } from '../limits';
import { leadDoLugar, listarLeads, marcarNaoContatar } from '../oportunidades/dados';
import type { Lead } from '../oportunidades/regras';
import { escreverRascunho, type Cliente } from './ia';
import {
  DOMINIOS_PUBLICOS,
  ETAPAS_ENCERRADAS,
  ETAPAS_MANUAIS,
  ETAPA_IDS,
  MAX_ACOMPANHAMENTOS,
  completarSchema,
  conferirRascunho,
  contatoCompleto,
  contatoSchema,
  nomeExibicao,
  dominioDe,
  edicaoRascunhoSchema,
  nomeEtapa,
  normalizarEmail,
  pedeParaSair,
  possivelReclamacao,
  whatsappSchema,
  type Contato,
  type Etapa,
  type Evento,
  type Rascunho,
  type SugestaoContato,
  CANAIS_DIRETOS,
  NOME_CANAL_DIRETO,
  contatoDiretoRecente,
  type CanalDireto,
  type TipoRascunho,
} from './regras';

/**
 * Sales Agent storage. Two documents in the panel's store:
 *   vendas/contatos.json → { <id>: Contato }   (the CRM: contact, stage, drafts, history)
 *   vendas/bloqueio.json → Bloqueio[]          (who must never get a message; checked before every draft and send)
 * Opted-out addresses are kept only as a hash plus a masked label, enough to keep honouring the request.
 */

const CONTATOS = 'vendas/contatos.json';
const BLOQUEIO = 'vendas/bloqueio.json';
const MAX_HISTORICO = 200;

export class VendasError extends Error {}

/**
 * Writes are allowed locally (files under .data/) and in Production only. The Preview deployments currently share
 * the production database (POSTGRES_URL is set for Preview too), so a preview link must never change the real CRM.
 */
export { gravacaoPermitida };
function exigirGravacao() {
  if (!gravacaoPermitida()) throw new VendasError('Esta é uma versão de prévia: a área de vendas fica só para leitura aqui.');
}

export interface Bloqueio {
  chave: string;
  tipo: 'email' | 'dominio' | 'lugar';
  /** What the team sees: a masked address, a domain or a place ID. */
  rotulo: string;
  motivo: string;
  origem: 'equipe' | 'descadastro' | 'resposta';
  em: string;
  por: string;
}

/**
 * Keyed hash (HMAC with a key derived from SESSION_SECRET): someone holding the block list and a list of addresses
 * still cannot tell who opted out. Changing SESSION_SECRET would orphan the list, so that secret must never rotate
 * without migrating it.
 */
const chaveBloqueio = () => {
  const s = process.env.SESSION_SECRET ?? '';
  if (s.length < 32) throw new VendasError('SESSION_SECRET ausente ou curto: a lista de bloqueio não pode ser conferida.');
  return createHash('sha256').update(`vendas-bloqueio:${s}`).digest();
};
const hash = (tipo: Bloqueio['tipo'], valor: string) => createHmac('sha256', chaveBloqueio()).update(`${tipo}:${valor}`).digest('hex');
export const mascarar = (email: string) => {
  const [u, d] = normalizarEmail(email).split('@');
  return `${u.slice(0, 2)}${'*'.repeat(Math.max(2, u.length - 2))}@${d ?? ''}`;
};

async function atualizar<T>(key: string, vazio: T, fn: (atual: T) => T): Promise<T> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const doc = await storage().readJSON<T>(key);
    const novo = fn(doc?.data ?? vazio);
    try {
      await storage().writeJSON(key, novo, doc ? doc.etag : null);
      return novo;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 5) throw err;
    }
  }
  throw new ConflictError();
}

const evento = (por: string, tipo: Evento['tipo'], texto: string, now: Date): Evento => ({ em: now.toISOString(), por, tipo, texto });
const comEvento = (c: Contato, e: Evento): Contato => ({ ...c, historico: [...c.historico, e].slice(-MAX_HISTORICO), atualizadoEm: e.em });

/* ---------- reading ---------- */

export async function listarContatos(): Promise<Contato[]> {
  const doc = await storage().readJSON<Record<string, Contato>>(CONTATOS);
  return Object.values(doc?.data ?? {}).sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
}

export async function contatoPorId(id: string): Promise<Contato | undefined> {
  if (!/^[a-z0-9]{10}$/.test(id)) return undefined;
  const doc = await storage().readJSON<Record<string, Contato>>(CONTATOS);
  return doc && Object.hasOwn(doc.data, id) ? doc.data[id] : undefined;
}

export async function listarBloqueio(): Promise<Bloqueio[]> {
  return ((await storage().readJSON<Bloqueio[]>(BLOQUEIO))?.data ?? []).toSorted((a, b) => b.em.localeCompare(a.em));
}

/** Whether a message to this address (or this business) is forbidden. */
export async function bloqueado(alvo: { email?: string; placeId?: string }): Promise<Bloqueio | undefined> {
  const lista = await listarBloqueio();
  const chaves = new Set<string>();
  if (alvo.email) {
    chaves.add(hash('email', normalizarEmail(alvo.email)));
    chaves.add(hash('dominio', dominioDe(alvo.email)));
  }
  if (alvo.placeId) chaves.add(hash('lugar', alvo.placeId));
  return lista.find((b) => chaves.has(b.chave));
}

/* ---------- contacts ---------- */

const novoId = () => randomBytes(8).toString('hex').slice(0, 10);

export async function criarContato(raw: unknown, por: string, now = new Date()): Promise<Contato> {
  exigirGravacao();
  const parsed = contatoSchema.safeParse(raw);
  if (!parsed.success) throw new VendasError(parsed.error.issues[0]?.message || 'Confira os dados do contato.');
  const d = parsed.data;
  if (await bloqueado({ email: d.email, placeId: d.placeId })) throw new VendasError('Este e-mail ou negócio está na lista de bloqueio: não pode ser contatado.');
  const lead = d.placeId ? await leadDoLugar(d.placeId) : undefined;
  if (d.placeId && !lead) throw new VendasError('Esse lugar não está na lista de Oportunidades.');
  if (lead && (lead.situacao === 'nao-contatar' || lead.situacao === 'descartada'))
    throw new VendasError(`Esse negócio está como "${lead.situacao === 'nao-contatar' ? 'Não contatar' : 'Descartada'}" em Oportunidades.`);
  const id = novoId();
  const iso = now.toISOString();
  const contato: Contato = {
    id,
    origem: 'manual',
    placeId: d.placeId,
    negocio: d.negocio,
    email: d.email,
    fonte: { tipo: d.fonteTipo, url: d.fonteUrl },
    segmento: d.segmento ?? lead?.segmento,
    // "Sem site" only reaches an e-mail after the team confirmed it in 2 public sources (Oportunidades' rule).
    categoria: lead && lead.categoria === 'sem-site' && lead.verificacao.situacao !== 'confirmado' ? 'incerta' : lead?.categoria,
    sinais: lead?.sinais ?? [],
    cidade: d.cidade || lead?.cidade || '',
    uf: d.uf || lead?.uf || '',
    etapa: 'novo',
    observacoes: d.observacoes,
    rascunhos: [],
    historico: [evento(por, 'cadastro', `Contato cadastrado. E-mail achado em: ${d.fonteUrl}`, now)],
    criadoEm: iso,
    criadoPor: por,
    atualizadoEm: iso,
  };
  await atualizar<Record<string, Contato>>(CONTATOS, {}, (atual) => {
    const repetido = Object.values(atual).find((c) => c.email === d.email || (d.placeId && c.placeId === d.placeId));
    if (repetido) throw new VendasError(`Já existe um contato para ${repetido.email === d.email ? 'este e-mail' : 'este negócio'}: ${nomeExibicao(repetido)}.`);
    return { ...atual, [id]: contato };
  });
  return contato;
}

async function alterarContato(id: string, fn: (c: Contato) => Contato): Promise<Contato> {
  exigirGravacao();
  let salvo: Contato | undefined;
  await atualizar<Record<string, Contato>>(CONTATOS, {}, (atual) => {
    const c = Object.hasOwn(atual, id) ? atual[id] : undefined;
    if (!c) throw new VendasError('Contato não encontrado.');
    salvo = fn(c);
    return { ...atual, [id]: salvo };
  });
  return salvo!;
}

/** Keeps what "Buscar contatos nos sites" found (or why nothing was found), only while the contact still waits for qualification. */
export async function salvarSugestao(id: string, sugestao: SugestaoContato, por: string, now = new Date()) {
  return alterarContato(id, (c) => {
    if (c.etapa !== 'qualificar' || c.email) return c;
    const texto = sugestao.email
      ? `Busca no site do negócio: achado ${sugestao.email}${sugestao.negocio ? ` (${sugestao.negocio})` : ''}. Falta uma pessoa confirmar.`
      : `Busca no site do negócio: ${sugestao.motivo ?? 'nada encontrado'}`;
    return { ...comEvento(c, evento(por, 'cadastro', texto, now)), sugestao };
  });
}

/** "Já mandei": the one direct contact is recorded, and the panel will not offer another for DIAS_SEM_REPETIR days. */
export async function registrarContatoDireto(id: string, canal: string, por: string, now = new Date()) {
  if (!CANAIS_DIRETOS.includes(canal as CanalDireto)) throw new VendasError('Canal inválido.');
  return alterarContato(id, (c) => {
    if (c.etapa === 'nao-contatar') throw new VendasError('Este contato pediu para não ser contatado.');
    if (contatoDiretoRecente(c, now)) throw new VendasError('Este negócio já foi contatado diretamente. Se não respondeu, não mande de novo.');
    const contatoDireto = { canal: canal as CanalDireto, em: now.toISOString(), por };
    return { ...comEvento(c, evento(por, 'nota', `Contato direto por ${NOME_CANAL_DIRETO[canal as CanalDireto]} (uma vez; não repetir).`, now)), contatoDireto };
  });
}

export async function mudarEtapa(id: string, etapa: string, por: string, now = new Date()) {
  if (!ETAPA_IDS.includes(etapa as Etapa) || !ETAPAS_MANUAIS.includes(etapa as Etapa)) throw new VendasError('Etapa inválida.');
  return alterarContato(id, (c) => {
    if (c.etapa === 'nao-contatar') throw new VendasError('Este contato pediu para não ser contatado. A etapa não muda mais.');
    if (!contatoCompleto(c) && !['qualificar', 'frio', 'perdido'].includes(etapa))
      throw new VendasError('Complete o contato (nome, e-mail comercial e fonte) antes de avançar no funil.');
    if (c.etapa === etapa) return c;
    return { ...comEvento(c, evento(por, 'etapa', `${nomeEtapa(c.etapa)} → ${nomeEtapa(etapa as Etapa)}`, now)), etapa: etapa as Etapa };
  });
}

export async function anotar(id: string, texto: string, por: string, now = new Date()) {
  const t = String(texto ?? '').trim().slice(0, 1000);
  if (t.length < 2) throw new VendasError('Escreva a anotação.');
  return alterarContato(id, (c) => comEvento(c, evento(por, 'nota', t, now)));
}

/**
 * A reply pasted by the team (phase 1; phase 3 reads the inbox). "Sair" and the like block right away, with no AI;
 * anything else moves the contact to "Respondeu" for a person to qualify.
 */
export async function registrarResposta(id: string, texto: string, por: string, now = new Date()) {
  const t = String(texto ?? '').trim().slice(0, 2000);
  if (t.length < 2) throw new VendasError('Cole a resposta do cliente.');
  if (pedeParaSair(t)) {
    const c = await contatoPorId(id);
    if (!c) throw new VendasError('Contato não encontrado.');
    const motivo = possivelReclamacao(t)
      ? 'Pediu para não receber mais. ATENÇÃO: a resposta cita reclamação (Procon, advogado, LGPD ou parecido); avisar o Lucas.'
      : 'Pediu para não receber mais (resposta ao e-mail).';
    return bloquearContato(id, motivo, 'resposta', por, now);
  }
  return alterarContato(id, (c) => {
    const avancar: Etapa[] = ['novo', 'em-aprovacao', 'aprovado', 'enviado'];
    const c2 = comEvento(c, evento(por, 'resposta', t, now));
    return avancar.includes(c.etapa) ? { ...c2, etapa: 'respondeu' } : c2;
  });
}

/** The lead asked, in writing, to be called on WhatsApp. Only then the panel shows the button for that number. */
export async function registrarWhatsapp(id: string, raw: unknown, por: string, now = new Date()) {
  const parsed = whatsappSchema.safeParse(raw);
  if (!parsed.success) throw new VendasError(parsed.error.issues[0]?.message || 'Confira o número.');
  return alterarContato(id, (c) => {
    if (!['respondeu', 'quente', 'morno', 'cliente'].includes(c.etapa)) throw new VendasError('Só depois que o cliente responder pedindo contato pelo WhatsApp.');
    const w = { numero: parsed.data.numero, pedidoEm: now.toISOString(), como: parsed.data.como };
    return { ...comEvento(c, evento(por, 'whatsapp', `Pediu contato pelo WhatsApp: ${w.como}`, now)), whatsapp: w };
  });
}

/** The Oportunidades decision always wins: "Descartada" or "Não contatar" there stops any writing here. */
async function exigirLeadAberto(placeId: string | undefined) {
  if (!placeId) return;
  const lead = await leadDoLugar(placeId);
  if (lead?.situacao === 'nao-contatar') throw new VendasError('Esse negócio está como "Não contatar" em Oportunidades.');
  if (lead?.situacao === 'descartada') throw new VendasError('Esse negócio está como "Descartada" em Oportunidades.');
}

/* ---------- import from Oportunidades ---------- */

export const MAX_IMPORTACAO = 500;
const ETAPAS_INICIAIS: Etapa[] = ['qualificar', 'novo', 'em-aprovacao', 'aprovado'];

export interface ResumoImportacao {
  importadas: { id: string; placeId: string; pendenteVerificacao: boolean }[];
  jaCadastradas: { id: string; placeId: string }[];
  ignoradas: { placeId: string; motivo: string }[];
  /** Imported, but "sem site" still needs the hand check in 2 sources before it can be used in a text. */
  pendentesVerificacao: number;
  /** Eligible leads left for a next click (only "elegíveis", above the per-click cap). */
  restantes: number;
}

/** Why a lead cannot enter the CRM, or null when it can. */
function motivoParaIgnorar(l: Lead, bloqueados: Set<string>): string | null {
  if (l.situacao === 'nao-contatar') return 'Não contatar';
  if (l.situacao === 'descartada') return 'Descartada';
  if (bloqueados.has(hash('lugar', l.placeId))) return 'Na lista de bloqueio';
  if (l.categoria === 'site-proprio') return 'Já tem site próprio funcionando';
  if (l.sinais.some((s) => /fechado definitivamente/i.test(s))) return 'Fechado definitivamente no Google';
  return null;
}

const pendenteVerificacao = (l: Lead) => l.categoria === 'sem-site' && l.verificacao.situacao !== 'confirmado';

/** For the Oportunidades screen: which place IDs are already in the CRM (→ contact id) and which could be imported. */
export async function situacaoNoCrm(): Promise<{ noCrm: Record<string, string>; elegiveis: string[] }> {
  const [leads, contatos, bloqueio] = await Promise.all([listarLeads(), listarContatos(), listarBloqueio()]);
  const noCrm: Record<string, string> = {};
  for (const c of contatos) if (c.placeId) noCrm[c.placeId] = c.id;
  const bloqueados = new Set(bloqueio.map((b) => b.chave));
  const elegiveis = leads.filter((l) => !noCrm[l.placeId] && !motivoParaIgnorar(l, bloqueados)).map((l) => l.placeId);
  return { noCrm, elegiveis };
}

/**
 * Brings Oportunidades leads into the CRM as "Aguardando qualificação". Copies only the place ID and the team's own
 * findings (city, segment, category, the site check); never a name, address, phone or site from Google.
 * Safe to run twice, or twice at once: the place ID check happens inside the same atomic write.
 */
export async function importarLeads(alvo: { placeIds: string[] } | 'elegiveis', por: string, now = new Date()): Promise<ResumoImportacao> {
  exigirGravacao();
  const [leads, bloqueio] = await Promise.all([listarLeads(), listarBloqueio()]);
  const porId = new Map(leads.map((l) => [l.placeId, l]));
  const bloqueados = new Set(bloqueio.map((b) => b.chave));
  let pedidos: string[];
  let restantes = 0;
  if (alvo === 'elegiveis') {
    // Pick the eligible ones first, then cap: a big list never blocks the button; the rest goes on the next click.
    const noCrm = new Set((await listarContatos()).map((c) => c.placeId).filter(Boolean));
    const todos = leads.filter((l) => !noCrm.has(l.placeId) && !motivoParaIgnorar(l, bloqueados)).map((l) => l.placeId);
    pedidos = todos.slice(0, MAX_IMPORTACAO);
    restantes = todos.length - pedidos.length;
    if (pedidos.length === 0) throw new VendasError('Nenhuma oportunidade elegível para importar.');
  } else {
    pedidos = [...new Set(alvo.placeIds.map(String))];
    if (pedidos.length === 0) throw new VendasError('Nenhuma empresa selecionada.');
    if (pedidos.length > MAX_IMPORTACAO) throw new VendasError(`No máximo ${MAX_IMPORTACAO} empresas por vez.`);
  }
  const iso = now.toISOString();
  let resumo: ResumoImportacao = { importadas: [], jaCadastradas: [], ignoradas: [], pendentesVerificacao: 0, restantes };

  await atualizar<Record<string, Contato>>(CONTATOS, {}, (atual) => {
    // Rebuilt on every retry, so a conflicting write never leaves a half-counted summary.
    resumo = { importadas: [], jaCadastradas: [], ignoradas: [], pendentesVerificacao: 0, restantes };
    const existentes = new Map<string, string>();
    for (const c of Object.values(atual)) if (c.placeId) existentes.set(c.placeId, c.id);
    const novo = { ...atual };
    for (const placeId of pedidos) {
      const l = porId.get(placeId);
      if (!l) {
        resumo.ignoradas.push({ placeId, motivo: 'Não está na lista de Oportunidades' });
        continue;
      }
      const ja = existentes.get(placeId);
      if (ja) {
        resumo.jaCadastradas.push({ id: ja, placeId });
        continue;
      }
      const motivo = motivoParaIgnorar(l, bloqueados);
      if (motivo) {
        resumo.ignoradas.push({ placeId, motivo });
        continue;
      }
      const pendente = pendenteVerificacao(l);
      const id = novoId();
      novo[id] = {
        id,
        origem: 'importado',
        placeId,
        negocio: '',
        email: '',
        fonte: null,
        segmento: l.segmento,
        // "Sem site" only reaches a text after the hand check in 2 sources (Oportunidades' rule).
        categoria: pendente ? 'incerta' : l.categoria,
        sinais: l.sinais,
        cidade: l.cidade,
        uf: l.uf,
        etapa: 'qualificar',
        observacoes: '',
        rascunhos: [],
        historico: [evento(por, 'cadastro', 'Importado de Oportunidades. Falta o nome do negócio, o e-mail comercial e a fonte do e-mail.', now)],
        criadoEm: iso,
        criadoPor: por,
        atualizadoEm: iso,
      };
      existentes.set(placeId, id);
      resumo.importadas.push({ id, placeId, pendenteVerificacao: pendente });
      if (pendente) resumo.pendentesVerificacao++;
    }
    return novo;
  });
  return resumo;
}

/** Qualifying: the team types the name, the business e-mail and where it found it. Then the contact can get texts. */
export async function completarContato(id: string, raw: unknown, por: string, now = new Date()) {
  const parsed = completarSchema.safeParse(raw);
  if (!parsed.success) throw new VendasError(parsed.error.issues[0]?.message || 'Confira os dados.');
  const d = parsed.data;
  const c = await contatoPorId(id);
  if (!c) throw new VendasError('Contato não encontrado.');
  if (await bloqueado({ email: d.email, placeId: c.placeId })) throw new VendasError('Este e-mail ou negócio está na lista de bloqueio: não pode ser contatado.');
  await exigirLeadAberto(c.placeId);
  exigirGravacao();
  let salvo: Contato | undefined;
  await atualizar<Record<string, Contato>>(CONTATOS, {}, (atual) => {
    const x = Object.hasOwn(atual, id) ? atual[id] : undefined;
    if (!x) throw new VendasError('Contato não encontrado.');
    if (x.etapa === 'nao-contatar') throw new VendasError('Este contato pediu para não ser contatado.');
    if (x.rascunhos.some((r) => r.status === 'aprovado')) throw new VendasError('Este contato já tem texto aprovado: o nome e o e-mail não mudam mais por aqui.');
    const outro = Object.values(atual).find((o) => o.id !== id && o.email === d.email);
    if (outro) throw new VendasError(`Este e-mail já está em outro contato: ${nomeExibicao(outro)}.`);
    const mudou = x.negocio !== d.negocio || x.email !== d.email || x.fonte?.url !== d.fonteUrl;
    const base = mudou ? comEvento(x, evento(por, 'cadastro', `Contato completado. E-mail achado em: ${d.fonteUrl}`, now)) : x;
    salvo = { ...base, negocio: d.negocio, email: d.email, fonte: { tipo: d.fonteTipo, url: d.fonteUrl }, etapa: x.etapa === 'qualificar' ? 'novo' : x.etapa, sugestao: undefined };
    return { ...atual, [id]: salvo };
  });
  return salvo!;
}

/**
 * "Preparar abordagens": a first draft for every complete contact still without one, up to `max` per click (the
 * simulator is instant; the AI, when on, is slower and has its own monthly cap). Everything lands in the approval queue.
 */
export async function prepararRascunhosEmLote(por: string, opts: { cliente?: Cliente; max?: number; now?: Date } = {}) {
  exigirGravacao();
  const max = Math.min(Math.max(opts.max ?? 10, 1), 30);
  const candidatos = (await listarContatos()).filter((c) => c.etapa === 'novo' && contatoCompleto(c) && c.rascunhos.every((r) => r.status === 'descartado'));
  const gerados: string[] = [];
  const falhas: { id: string; motivo: string }[] = [];
  for (const c of candidatos.slice(0, max)) {
    try {
      await gerarRascunho(c.id, 'primeiro', por, { cliente: opts.cliente, now: opts.now });
      gerados.push(c.id);
    } catch (err) {
      if (!(err instanceof VendasError)) throw err;
      falhas.push({ id: c.id, motivo: err.message });
    }
  }
  return { gerados: gerados.length, falhas, restantes: Math.max(candidatos.length - max, 0) };
}

/** Keeps the CRM in step when the team changes a lead in Oportunidades. */
export async function sincronizarComOportunidade(placeId: string, situacao: string, por: string, now = new Date()) {
  if (!gravacaoPermitida()) return;
  const c = (await listarContatos()).find((x) => x.placeId === placeId);
  if (!c || c.etapa === 'nao-contatar') return;
  if (situacao === 'nao-contatar') {
    await bloquearContato(c.id, 'Marcado como "Não contatar" em Oportunidades.', 'equipe', por, now);
  } else if (situacao === 'descartada' && ETAPAS_INICIAIS.includes(c.etapa)) {
    const em = now.toISOString();
    await alterarContato(c.id, (x) => ({
      ...comEvento(x, evento(por, 'etapa', `${nomeEtapa(x.etapa)} → Perdido (descartada em Oportunidades)`, now)),
      etapa: 'perdido',
      rascunhos: x.rascunhos.map((r) => (r.status === 'para-aprovar' ? { ...r, status: 'descartado', decididoEm: em, decididoPor: por } : r)),
    }));
  }
}

/* ---------- drafts ---------- */

const idRascunho = () => randomBytes(6).toString('hex');

export async function gerarRascunho(id: string, tipo: TipoRascunho, por: string, opts: { cliente?: Cliente; now?: Date } = {}) {
  exigirGravacao();
  const now = opts.now ?? new Date();
  const c = await contatoPorId(id);
  if (!c) throw new VendasError('Contato não encontrado.');
  if (ETAPAS_ENCERRADAS.includes(c.etapa)) throw new VendasError(`Contato em "${nomeEtapa(c.etapa)}": não recebe novos textos.`);
  if (!contatoCompleto(c)) throw new VendasError('Complete o contato antes: nome do negócio, e-mail comercial e a fonte do e-mail.');
  if (await bloqueado({ email: c.email, placeId: c.placeId })) throw new VendasError('Este contato está na lista de bloqueio.');
  await exigirLeadAberto(c.placeId);
  const vivos = c.rascunhos.filter((r) => r.status !== 'descartado');
  if (vivos.some((r) => r.status === 'para-aprovar')) throw new VendasError('Já tem um rascunho esperando aprovação. Aprove ou descarte antes de gerar outro.');
  if (tipo === 'primeiro' && vivos.some((r) => r.tipo === 'primeiro')) throw new VendasError('O primeiro e-mail já foi aprovado. O próximo só pode ser um acompanhamento.');
  if (tipo === 'acompanhamento') {
    if (!vivos.some((r) => r.tipo === 'primeiro' && r.status === 'aprovado')) throw new VendasError('Aprove o primeiro e-mail antes do acompanhamento.');
    if (vivos.filter((r) => r.tipo === 'acompanhamento').length >= MAX_ACOMPANHAMENTOS) throw new VendasError(`No máximo ${MAX_ACOMPANHAMENTOS} acompanhamento por empresa.`);
    if (['respondeu', 'quente', 'morno'].includes(c.etapa)) throw new VendasError('O cliente já respondeu: responda a ele, não mande acompanhamento automático.');
  }
  const texto = await escreverRascunho({ negocio: c.negocio, cidade: c.cidade, segmento: c.segmento, categoria: c.categoria, sinais: c.sinais, tipo }, { cliente: opts.cliente, mes: dayWindow(now).slice(0, 7) });
  const conferencia = conferirRascunho(texto.assunto, texto.corpo);
  const r: Rascunho = {
    id: idRascunho(),
    tipo,
    assunto: texto.assunto.slice(0, 120),
    corpo: texto.corpo.slice(0, 3000),
    origem: texto.origem,
    modelo: texto.modelo,
    fatos: texto.fatos,
    alertas: [...(texto.aviso ? [texto.aviso] : []), ...conferencia.alertas],
    status: 'para-aprovar',
    criadoEm: now.toISOString(),
    criadoPor: por,
  };
  return alterarContato(id, (x) => {
    if (x.rascunhos.some((y) => y.status === 'para-aprovar')) throw new VendasError('Já tem um rascunho esperando aprovação.');
    const quem = r.origem === 'ia' ? `IA (${r.modelo})` : 'simulador, sem IA';
    const c2 = comEvento(x, evento(por, 'rascunho', `Rascunho de ${tipo === 'primeiro' ? 'primeiro e-mail' : 'acompanhamento'} gerado (${quem}).`, now));
    return { ...c2, rascunhos: [...x.rascunhos, r], etapa: ['novo', 'aprovado'].includes(x.etapa) ? 'em-aprovacao' : x.etapa };
  });
}

function alterarRascunho(id: string, rid: string, por: string, now: Date, fn: (r: Rascunho, c: Contato) => { r: Rascunho; texto: string; tipo: Evento['tipo']; etapa?: Etapa }) {
  return alterarContato(id, (c) => {
    const i = c.rascunhos.findIndex((r) => r.id === rid);
    if (i < 0) throw new VendasError('Rascunho não encontrado.');
    if (c.rascunhos[i].status !== 'para-aprovar') throw new VendasError('Esse rascunho já foi decidido.');
    const out = fn(c.rascunhos[i], c);
    const rascunhos = c.rascunhos.with(i, out.r);
    return { ...comEvento(c, evento(por, out.tipo, out.texto, now)), rascunhos, etapa: out.etapa ?? c.etapa };
  });
}

export async function editarRascunho(id: string, rid: string, raw: unknown, por: string, now = new Date()) {
  const parsed = edicaoRascunhoSchema.safeParse(raw);
  if (!parsed.success) throw new VendasError(parsed.error.issues[0]?.message || 'Confira o texto.');
  const { assunto, corpo } = parsed.data;
  const conf = conferirRascunho(assunto, corpo);
  return alterarRascunho(id, rid, por, now, (r) => ({ r: { ...r, assunto, corpo, origem: 'editado', alertas: conf.alertas }, texto: 'Rascunho editado.', tipo: 'rascunho' }));
}

export async function aprovarRascunho(id: string, rid: string, por: string, now = new Date()) {
  const c = await contatoPorId(id);
  if (!c) throw new VendasError('Contato não encontrado.');
  if (await bloqueado({ email: c.email, placeId: c.placeId })) throw new VendasError('Este contato está na lista de bloqueio.');
  await exigirLeadAberto(c.placeId);
  return alterarRascunho(id, rid, por, now, (r, atual) => {
    if (ETAPAS_ENCERRADAS.includes(atual.etapa)) throw new VendasError(`Contato em "${nomeEtapa(atual.etapa)}": não dá para aprovar.`);
    const conf = conferirRascunho(r.assunto, r.corpo);
    if (conf.bloqueia) throw new VendasError(`Corrija antes de aprovar: ${conf.alertas.join(' ')}`);
    const etapa: Etapa | undefined = atual.etapa === 'em-aprovacao' || atual.etapa === 'novo' ? 'aprovado' : undefined;
    return {
      r: { ...r, status: 'aprovado', decididoEm: now.toISOString(), decididoPor: por, alertas: conf.alertas },
      texto: `Aprovado: "${r.assunto}". O envio de verdade só existe na fase 2.`,
      tipo: 'aprovacao',
      etapa,
    };
  });
}

export async function descartarRascunho(id: string, rid: string, por: string, now = new Date()) {
  return alterarRascunho(id, rid, por, now, (r, atual) => ({
    r: { ...r, status: 'descartado', decididoEm: now.toISOString(), decididoPor: por },
    texto: `Rascunho descartado: "${r.assunto}".`,
    tipo: 'descarte',
    etapa: atual.etapa === 'em-aprovacao' ? (atual.rascunhos.some((x) => x.status === 'aprovado') ? 'aprovado' : 'novo') : undefined,
  }));
}

/* ---------- block list ---------- */

async function adicionarBloqueios(novos: Bloqueio[]) {
  await atualizar<Bloqueio[]>(BLOQUEIO, [], (atual) => {
    const tem = new Set(atual.map((b) => b.chave));
    return [...atual, ...novos.filter((b) => !tem.has(b.chave))];
  });
}

/** Blocks a contact for good: its address, its business (place ID), pending drafts discarded, address masked. */
export async function bloquearContato(id: string, motivo: string, origem: Bloqueio['origem'], por: string, now = new Date()) {
  exigirGravacao();
  const c = await contatoPorId(id);
  if (!c) throw new VendasError('Contato não encontrado.');
  const em = now.toISOString();
  const rotulo = !c.email || c.email.includes('*') ? c.email : mascarar(c.email);
  const novos: Bloqueio[] = [];
  if (c.email && !c.email.includes('*')) novos.push({ chave: hash('email', c.email), tipo: 'email', rotulo, motivo, origem, em, por });
  if (c.placeId) novos.push({ chave: hash('lugar', c.placeId), tipo: 'lugar', rotulo: `${nomeExibicao(c)} (Oportunidades)`, motivo, origem, em, por });
  await adicionarBloqueios(novos);
  if (c.placeId) await marcarNaoContatar(c.placeId, motivo, por, now);
  // What the business wrote and the team's free notes may carry personal data: after an opt-out only the facts stay.
  const limpar = origem !== 'equipe';
  return alterarContato(id, (x) => ({
    ...comEvento(limpar ? { ...x, historico: x.historico.map((e) => (e.tipo === 'resposta' || e.tipo === 'whatsapp' || e.tipo === 'nota' ? { ...e, texto: '[removido a pedido]' } : e)) } : x, evento(por, 'bloqueio', `Bloqueado: ${motivo}`, now)),
    etapa: 'nao-contatar',
    email: rotulo,
    observacoes: limpar ? '' : x.observacoes,
    whatsapp: undefined,
    rascunhos: x.rascunhos.map((r) => (r.status === 'para-aprovar' ? { ...r, status: 'descartado', decididoEm: em, decididoPor: por } : r)),
  }));
}

/** The team blocks an address or a whole domain that is not (yet) a contact. */
export async function bloquearManual(raw: { valor?: unknown; motivo?: unknown }, por: string, now = new Date()) {
  exigirGravacao();
  const valor = normalizarEmail(String(raw.valor ?? ''));
  const motivo = String(raw.motivo ?? '').trim().slice(0, 200) || 'Pedido de não contato';
  const ehEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  const ehDominio = !ehEmail && /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(valor);
  if (!ehEmail && !ehDominio) throw new VendasError('Digite um e-mail ou um domínio (ex.: padaria.com.br).');
  if (ehDominio && DOMINIOS_PUBLICOS.includes(valor)) throw new VendasError('Esse domínio é de e-mail público: bloqueie o endereço completo.');
  const b: Bloqueio = ehEmail
    ? { chave: hash('email', valor), tipo: 'email', rotulo: mascarar(valor), motivo, origem: 'equipe', em: now.toISOString(), por }
    : { chave: hash('dominio', valor), tipo: 'dominio', rotulo: valor, motivo, origem: 'equipe', em: now.toISOString(), por };
  await adicionarBloqueios([b]);
  const atingidos = (await listarContatos()).filter((c) => c.etapa !== 'nao-contatar' && (ehEmail ? c.email === valor : dominioDe(c.email) === valor));
  for (const c of atingidos) await bloquearContato(c.id, motivo, 'equipe', por, now);
  return { bloqueio: b, contatos: atingidos.length };
}

/** Only a block the team added by mistake can be undone. An opt-out (link or reply) stays forever. */
export async function desbloquear(chave: string, por: string) {
  exigirGravacao();
  await atualizar<Bloqueio[]>(BLOQUEIO, [], (atual) => {
    const b = atual.find((x) => x.chave === chave);
    if (!b) throw new VendasError('Bloqueio não encontrado.');
    if (b.origem !== 'equipe') throw new VendasError('Pedido de descadastro do próprio negócio não pode ser desfeito.');
    console.info('vendas desbloqueio', b.tipo, por);
    return atual.filter((x) => x.chave !== chave);
  });
}

/* ---------- unsubscribe link ---------- */

const segredo = () => {
  const s = process.env.SESSION_SECRET ?? '';
  if (s.length < 32) throw new VendasError('SESSION_SECRET ausente ou curto: não dá para assinar o link de descadastro.');
  return createHash('sha256').update(`vendas-descadastro:${s}`).digest();
};

/** A link that never expires (an unsubscribe must always work) and names only the contact's internal ID. */
export function tokenDescadastro(id: string) {
  const sig = createHmac('sha256', segredo()).update(id).digest('base64url').slice(0, 32);
  return `${id}.${sig}`;
}

export function lerToken(token: string): string | null {
  const m = /^([a-z0-9]{10})\.([A-Za-z0-9_-]{32})$/.exec(String(token ?? ''));
  if (!m) return null;
  let esperado: Buffer;
  try {
    esperado = Buffer.from(tokenDescadastro(m[1]).split('.')[1]);
  } catch {
    return null;
  }
  const veio = Buffer.from(m[2]);
  return esperado.length === veio.length && timingSafeEqual(esperado, veio) ? m[1] : null;
}

/** Runs when the person confirms on the public page. Idempotent: a second click just says it is done. */
export async function descadastrar(token: string, now = new Date()): Promise<'feito' | 'invalido'> {
  const id = lerToken(token);
  if (!id) return 'invalido';
  const c = await contatoPorId(id);
  if (!c) return 'invalido';
  if (c.etapa === 'nao-contatar') return 'feito';
  await bloquearContato(id, 'Descadastro pelo link do e-mail.', 'descadastro', 'o próprio negócio', now);
  return 'feito';
}

/* ---------- views ---------- */

export function filaDeAprovacao(contatos: Contato[]) {
  return contatos
    .flatMap((c) => c.rascunhos.filter((r) => r.status === 'para-aprovar').map((r) => ({ contato: c, rascunho: r })))
    .sort((a, b) => a.rascunho.criadoEm.localeCompare(b.rascunho.criadoEm));
}

export function contagemPorEtapa(contatos: Contato[]): Record<Etapa, number> {
  const out = Object.fromEntries(ETAPA_IDS.map((e) => [e, 0])) as Record<Etapa, number>;
  for (const c of contatos) out[c.etapa]++;
  return out;
}

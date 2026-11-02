import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { ConflictError, storage } from '../storage';
import { dayWindow } from '../limits';
import { leadDoLugar, marcarNaoContatar } from '../oportunidades/dados';
import { escreverRascunho, type Cliente } from './ia';
import {
  DOMINIOS_PUBLICOS,
  ETAPAS_ENCERRADAS,
  ETAPAS_MANUAIS,
  ETAPA_IDS,
  MAX_ACOMPANHAMENTOS,
  conferirRascunho,
  contatoSchema,
  dominioDe,
  edicaoRascunhoSchema,
  nomeEtapa,
  normalizarEmail,
  pedeParaSair,
  whatsappSchema,
  type Contato,
  type Etapa,
  type Evento,
  type Rascunho,
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
export const gravacaoPermitida = () => !process.env.VERCEL || process.env.VERCEL_ENV === 'production';
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

const hash = (tipo: Bloqueio['tipo'], valor: string) => createHash('sha256').update(`growlift-bloqueio:${tipo}:${valor}`).digest('hex');
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
  const id = randomBytes(8).toString('hex').replace(/[^a-z0-9]/g, '').slice(0, 10).padEnd(10, '0');
  const iso = now.toISOString();
  const contato: Contato = {
    id,
    placeId: d.placeId,
    negocio: d.negocio,
    email: d.email,
    fonte: { tipo: d.fonteTipo, url: d.fonteUrl },
    segmento: d.segmento ?? lead?.segmento,
    categoria: lead?.categoria,
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
    if (repetido) throw new VendasError(`Já existe um contato para ${repetido.email === d.email ? 'este e-mail' : 'este negócio'}: ${repetido.negocio}.`);
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

export async function mudarEtapa(id: string, etapa: string, por: string, now = new Date()) {
  if (!ETAPA_IDS.includes(etapa as Etapa) || !ETAPAS_MANUAIS.includes(etapa as Etapa)) throw new VendasError('Etapa inválida.');
  return alterarContato(id, (c) => {
    if (c.etapa === 'nao-contatar') throw new VendasError('Este contato pediu para não ser contatado. A etapa não muda mais.');
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
    await alterarContato(id, (x) => comEvento(x, evento(por, 'resposta', t, now)));
    return bloquearContato(id, 'Pediu para não receber mais (resposta ao e-mail).', 'resposta', por, now);
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

/* ---------- drafts ---------- */

const idRascunho = () => randomBytes(6).toString('hex');

export async function gerarRascunho(id: string, tipo: TipoRascunho, por: string, opts: { cliente?: Cliente; now?: Date } = {}) {
  exigirGravacao();
  const now = opts.now ?? new Date();
  const c = await contatoPorId(id);
  if (!c) throw new VendasError('Contato não encontrado.');
  if (ETAPAS_ENCERRADAS.includes(c.etapa)) throw new VendasError(`Contato em "${nomeEtapa(c.etapa)}": não recebe novos textos.`);
  if (await bloqueado({ email: c.email, placeId: c.placeId })) throw new VendasError('Este contato está na lista de bloqueio.');
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
  const rotulo = c.email.includes('*') ? c.email : mascarar(c.email);
  const novos: Bloqueio[] = [];
  if (!c.email.includes('*')) novos.push({ chave: hash('email', c.email), tipo: 'email', rotulo, motivo, origem, em, por });
  if (c.placeId) novos.push({ chave: hash('lugar', c.placeId), tipo: 'lugar', rotulo: `${c.negocio} (Oportunidades)`, motivo, origem, em, por });
  await adicionarBloqueios(novos);
  if (c.placeId) await marcarNaoContatar(c.placeId, motivo, por, now);
  return alterarContato(id, (x) => ({
    ...comEvento(x, evento(por, 'bloqueio', `Bloqueado: ${motivo}`, now)),
    etapa: 'nao-contatar',
    email: rotulo,
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
  const esperado = Buffer.from(tokenDescadastro(m[1]).split('.')[1]);
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

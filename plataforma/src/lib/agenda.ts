import 'server-only';
import { storage, ConflictError } from './storage';
import { readGenerated, setContentStatus } from './conteudos';
import { signedContentUrl } from './link-publico';
import {
  InstagramError,
  containerStatus,
  createCarousel,
  createImage,
  createReel,
  instagramConfigured,
  permalinkOf,
  publishContainer,
  refreshTokenIfDue,
} from './instagram';

/**
 * The Instagram agenda. Claude prepares posts in growlift-social/agenda.json (file, caption, day and time); they show
 * here as "Para aprovar". Nothing is published until someone on the team approves it ("Aprovar e agendar"). At the
 * time, the publisher (runAgenda, called every few minutes) creates the post on Instagram and marks it as posted.
 *
 * Layout in storage:
 *   instagram/agenda.json   Record<post id, AgendaState>: only approved (or failed/posted) posts have an entry
 */

export type AgendaTipo = 'reel' | 'carrossel' | 'imagem';
export type AgendaStatus = 'rascunho' | 'agendado' | 'processando' | 'postado' | 'erro' | 'atrasado';

export interface AgendaDraft {
  id: string;
  titulo: string;
  tipo: AgendaTipo;
  arquivos: string[];
  capa: string | null;
  legenda: string;
  /** ISO time with offset, São Paulo. */
  quando: string;
  ia: boolean;
  palavra?: string;
  /** The Conteúdos status key marked "postado" once it is live. */
  chave?: string | null;
  fixar?: boolean;
}

export interface AgendaState {
  status: Exclude<AgendaStatus, 'rascunho'>;
  legenda: string;
  quando: string;
  ia: boolean;
  by: string;
  at: string;
  containerId?: string;
  childIds?: string[];
  claimedAt?: string;
  mediaId?: string;
  permalink?: string;
  error?: string;
  postedAt?: string;
}

export type AgendaItem = AgendaDraft & { status: AgendaStatus; state: AgendaState | null };

export class AgendaError extends Error {}

const KEY = 'instagram/agenda.json';
/** Later than this after its time (the publisher was down), a post waits for someone to press "Publicar agora". */
const LATE_MS = 3 * 3600_000;
/** A video still processing after this is given up on. */
const PROCESS_MS = 30 * 60_000;
/** Claimed but no container saved after this: the run died midway. Never retried on its own (could double-post). */
const STUCK_MS = 10 * 60_000;
const PER_RUN = 5;
const MAX_CAPTION = 2200;

export async function agendaDrafts(): Promise<AgendaDraft[]> {
  return (await readGenerated<{ itens: AgendaDraft[] }>('agenda.json'))?.itens ?? [];
}

async function readState() {
  return storage().readJSON<Record<string, AgendaState>>(KEY);
}

/** Read-modify-write one post's state; `fn` returns the new state, null to delete it, or undefined to leave it. */
async function update(id: string, fn: (cur: AgendaState | undefined) => AgendaState | null | undefined): Promise<AgendaState | null | undefined> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const doc = await readState();
    const all = { ...(doc?.data ?? {}) };
    const next = fn(all[id]);
    if (next === undefined) return undefined;
    if (next === null) delete all[id];
    else all[id] = next;
    try {
      await storage().writeJSON(KEY, all, doc ? doc.etag : null);
      return next;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 5) throw err;
    }
  }
  return undefined;
}

export async function agendaView(): Promise<AgendaItem[]> {
  const [drafts, doc] = await Promise.all([agendaDrafts(), readState()]);
  const state = doc?.data ?? {};
  return drafts
    .map((d) => {
      const s = state[d.id] ?? null;
      return { ...d, ...(s ? { legenda: s.legenda, quando: s.quando, ia: s.ia } : {}), status: s?.status ?? 'rascunho', state: s } as AgendaItem;
    })
    .sort((a, b) => a.quando.localeCompare(b.quando));
}

function checkCaption(legenda: string) {
  const text = legenda.trim();
  if (!text) throw new AgendaError('Escreva a legenda.');
  if (text.length > MAX_CAPTION) throw new AgendaError(`A legenda passou de ${MAX_CAPTION} caracteres.`);
  if ((text.match(/#[\p{L}\p{N}_]+/gu) ?? []).length > 30) throw new AgendaError('O Instagram aceita no máximo 30 hashtags.');
  if ((text.match(/@[\w.]+/g) ?? []).length > 20) throw new AgendaError('O Instagram aceita no máximo 20 marcações (@).');
  return text;
}

/** "Aprovar e agendar": the caption, time and AI label as the team left them. */
export async function approve(id: string, input: { legenda: string; quando: string; ia: boolean }, by: string, now = new Date()) {
  const draft = (await agendaDrafts()).find((d) => d.id === id);
  if (!draft) throw new AgendaError('Post não encontrado.');
  const legenda = checkCaption(input.legenda);
  const at = Date.parse(input.quando);
  if (!Number.isFinite(at)) throw new AgendaError('Data ou hora inválida.');
  if (at < now.getTime() - 60_000) throw new AgendaError('Esse horário já passou. Escolha outro, ou use "Publicar agora".');
  if (at > now.getTime() + 75 * 86_400_000) throw new AgendaError('Agende para no máximo 75 dias à frente.');
  await update(id, (cur) => {
    if (cur && !['erro', 'atrasado', 'agendado'].includes(cur.status)) throw new AgendaError(cur.status === 'postado' ? 'Esse post já foi publicado.' : 'Esse post está sendo publicado agora.');
    return { status: 'agendado', legenda, quando: new Date(at).toISOString(), ia: Boolean(input.ia), by, at: now.toISOString() };
  });
}

/** Back to "Para aprovar" (only before it starts publishing). */
export async function unschedule(id: string) {
  await update(id, (cur) => {
    if (!cur) return undefined;
    if (cur.status === 'processando') throw new AgendaError('Esse post já está sendo publicado.');
    if (cur.status === 'postado') throw new AgendaError('Esse post já foi publicado. Para tirar, apague no Instagram.');
    return null;
  });
}

/** Publish an approved (or late, or failed) post now. */
export async function publishNow(id: string, by: string, now = new Date()) {
  await update(id, (cur) => {
    if (!cur) throw new AgendaError('Aprove o post antes de publicar.');
    if (!['agendado', 'atrasado', 'erro'].includes(cur.status)) throw new AgendaError(cur.status === 'postado' ? 'Esse post já foi publicado.' : 'Esse post já está sendo publicado.');
    return { status: 'agendado', legenda: cur.legenda, quando: now.toISOString(), ia: cur.ia, by, at: now.toISOString() };
  });
}

const fail = (cur: AgendaState, error: string): AgendaState => ({ ...cur, status: 'erro', error: error.slice(0, 300) });

async function createContainers(d: AgendaDraft, s: AgendaState, origin: string) {
  const url = (rel: string, jpg = false) => signedContentUrl(origin, rel, { jpg });
  if (d.tipo === 'reel') {
    return { containerId: await createReel({ videoUrl: url(d.arquivos[0]), coverUrl: d.capa ? url(d.capa, true) : undefined, caption: s.legenda, ai: s.ia }) };
  }
  if (d.tipo === 'imagem') return { containerId: await createImage({ imageUrl: url(d.arquivos[0], true), caption: s.legenda, ai: s.ia }) };
  const childIds: string[] = [];
  for (const f of d.arquivos.slice(0, 20)) childIds.push(await createImage({ imageUrl: url(f, true), child: true }));
  return { childIds, containerId: await createCarousel({ children: childIds, caption: s.legenda, ai: s.ia }) };
}

export interface RunResult {
  skipped?: string;
  started: string[];
  posted: string[];
  failed: string[];
}

/**
 * The publisher. Called by the cron route every few minutes and by "Publicar agora"/"Verificar agora". Each post is
 * claimed with a conditional write first, so two runs at the same moment can never publish it twice.
 */
export async function runAgenda(origin: string, now = new Date()): Promise<RunResult> {
  const result: RunResult = { started: [], posted: [], failed: [] };
  if (!instagramConfigured()) return { ...result, skipped: 'instagram-nao-conectado' };
  await refreshTokenIfDue(now);
  const drafts = new Map((await agendaDrafts()).map((d) => [d.id, d]));
  const state = (await readState())?.data ?? {};
  let budget = PER_RUN;

  for (const [id, s] of Object.entries(state).sort((a, b) => a[1].quando.localeCompare(b[1].quando))) {
    if (budget <= 0) break;
    const d = drafts.get(id);
    if (!d) continue;

    if (s.status === 'agendado' && Date.parse(s.quando) <= now.getTime()) {
      if (now.getTime() - Date.parse(s.quando) > LATE_MS) {
        await update(id, (cur) => (cur?.status === 'agendado' ? { ...cur, status: 'atrasado', error: 'O horário passou e o post não saiu (o publicador ficou parado). Confira e toque em "Publicar agora".' } : undefined));
        continue;
      }
      budget--;
      // Claim it: only the run whose write lands goes on.
      const claimed = await update(id, (cur) => (cur?.status === 'agendado' && cur.quando === s.quando ? { ...cur, status: 'processando', claimedAt: now.toISOString(), error: undefined } : undefined));
      if (!claimed) continue;
      try {
        const made = await createContainers(d, claimed, origin);
        await update(id, (cur) => (cur?.status === 'processando' ? { ...cur, ...made } : undefined));
        result.started.push(id);
      } catch (err) {
        const msg = err instanceof InstagramError ? err.message : 'Falha ao enviar para o Instagram.';
        if (!(err instanceof InstagramError)) console.error('agenda: criar post', id, err);
        await update(id, (cur) => (cur ? fail(cur, msg) : undefined));
        result.failed.push(id);
      }
      continue;
    }

    if (s.status === 'processando') {
      if (!s.containerId) {
        if (s.claimedAt && now.getTime() - Date.parse(s.claimedAt) > STUCK_MS) {
          await update(id, (cur) => (cur?.status === 'processando' && !cur.containerId ? fail(cur, 'O envio parou no meio. Confira no Instagram se o post não saiu antes de tentar de novo.') : undefined));
          result.failed.push(id);
        }
        continue;
      }
      budget--;
      try {
        const st = await containerStatus(s.containerId);
        if (st.code === 'FINISHED') {
          // Claim the publish step too: mark it before calling, so a parallel run sees it taken.
          const go = await update(id, (cur) => (cur?.status === 'processando' && cur.containerId === s.containerId && !cur.postedAt ? { ...cur, postedAt: now.toISOString() } : undefined));
          if (!go) continue;
          const mediaId = await publishContainer(s.containerId);
          const permalink = await permalinkOf(mediaId);
          await update(id, (cur) => (cur ? { ...cur, status: 'postado', mediaId, permalink, error: undefined } : undefined));
          if (d.chave) await setContentStatus(d.chave, 'postado', 'Instagram (automático)', now).catch(() => undefined);
          result.posted.push(id);
        } else if (st.code === 'PUBLISHED') {
          await update(id, (cur) => (cur ? { ...cur, status: 'postado', postedAt: cur.postedAt ?? now.toISOString() } : undefined));
          result.posted.push(id);
        } else if (st.code === 'ERROR' || st.code === 'EXPIRED') {
          const why = st.code === 'EXPIRED' ? 'O Instagram descartou o envio (passou de 24 horas).' : `O Instagram recusou o arquivo${st.detail ? `: ${st.detail}` : ''}.`;
          await update(id, (cur) => (cur ? fail(cur, why) : undefined));
          result.failed.push(id);
        } else if (s.claimedAt && now.getTime() - Date.parse(s.claimedAt) > PROCESS_MS) {
          await update(id, (cur) => (cur ? fail(cur, 'O Instagram não terminou de processar o vídeo em 30 minutos. Tente de novo.') : undefined));
          result.failed.push(id);
        }
      } catch (err) {
        // A publish call that failed after we marked postedAt: we don't know if it went out. Ask a person.
        const msg = err instanceof InstagramError ? err.message : 'Falha ao falar com o Instagram.';
        const current = (await readState())?.data[id];
        if (current?.postedAt) {
          await update(id, (cur) => (cur ? fail({ ...cur, postedAt: undefined }, `${msg} Confira no Instagram se o post saiu antes de tentar de novo.`) : undefined));
          result.failed.push(id);
        } else if (!(err instanceof InstagramError)) console.error('agenda: status', id, err);
      }
    }
  }
  return result;
}

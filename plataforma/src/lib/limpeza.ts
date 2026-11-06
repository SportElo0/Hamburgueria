import 'server-only';
import { gravacaoPermitida } from './ambiente';
import { ConflictError, storage } from './storage';
import { getDraft, getPublished } from './stores';
import { orderingOf } from './ordering';
import { purgeOld as limparReservas } from './reservas';
import { purgeOld as limparFila } from './fila';

/**
 * Daily clean-up of personal data, run by the same 5-minute tick as the Instagram agenda (once a day):
 * - bookings older than each store's retention (Configurar › Reservas, default 6 months) lose name, phone and e-mail;
 * - waiting-list days older than a day are deleted.
 * Before this, both only ran when a new booking or a new person in the queue arrived, so a quiet store kept old data.
 */

const ESTADO = 'limpeza/estado.json';
const MESES_PADRAO = 6;
const diaSP = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

async function lojasCom(prefixo: string) {
  return [...new Set((await storage().list(prefixo)).map((k) => k.split('/')[1]).filter(Boolean))];
}

/**
 * The store's retention. A read error is NOT turned into the default: it throws, and the store is skipped (and retried),
 * so a database hiccup can never erase data of a store that keeps it for 12 or 24 months. The default only applies when
 * the store really does not exist any more.
 */
async function mesesDe(slug: string) {
  const record = (await getPublished(slug)) ?? (await getDraft(slug))?.data ?? null;
  return record ? orderingOf(record.store).reservations.seller.keepMonths : MESES_PADRAO;
}

export interface Limpeza {
  feito: 'ok' | 'ja-feito' | 'nao-e-producao';
  reservas?: number;
  filas?: number;
  falhas?: string[];
}

export async function limpezaDiaria(agora = new Date()): Promise<Limpeza> {
  if (!gravacaoPermitida()) return { feito: 'nao-e-producao' };
  const hoje = diaSP(agora);
  const doc = await storage().readJSON<{ dia: string; tentarApos?: string }>(ESTADO);
  if (doc?.data.dia === hoje) return { feito: 'ja-feito' };
  if (doc?.data.tentarApos && Date.parse(doc.data.tentarApos) > agora.getTime()) return { feito: 'ja-feito' };
  let marca: string;
  try {
    // Claimed first, so two ticks at the same time do not both run it.
    marca = await storage().writeJSON(ESTADO, { dia: hoje, em: agora.toISOString() }, doc ? doc.etag : null);
  } catch (err) {
    if (err instanceof ConflictError) return { feito: 'ja-feito' };
    throw err;
  }
  const falhas: string[] = [];
  let reservas = 0;
  let filas = 0;
  for (const slug of await lojasCom('reservas/')) {
    try {
      await limparReservas(slug, await mesesDe(slug), agora);
      reservas++;
    } catch (err) {
      falhas.push(`reservas/${slug}`);
      console.error('limpeza: reservas', slug, err instanceof Error ? err.message : err);
    }
  }
  for (const slug of await lojasCom('fila/')) {
    try {
      await limparFila(slug, agora);
      filas++;
    } catch (err) {
      falhas.push(`fila/${slug}`);
      console.error('limpeza: fila', slug, err instanceof Error ? err.message : err);
    }
  }
  if (falhas.length) {
    // Something was skipped: try again in an hour instead of waiting for tomorrow.
    await storage()
      .writeJSON(ESTADO, { dia: '', em: agora.toISOString(), tentarApos: new Date(agora.getTime() + 3600_000).toISOString(), falhas }, marca)
      .catch((err) => console.error('limpeza: marca', err instanceof Error ? err.message : err));
  }
  return { feito: 'ok', reservas, filas, ...(falhas.length ? { falhas } : {}) };
}

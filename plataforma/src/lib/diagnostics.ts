import 'server-only';
import { z } from 'zod';
import { storage, ConflictError } from './storage';

/**
 * Free diagnosis requests from the Growlift site: a business asks for a look at its online presence
 * and a preview of a new site. One document per São Paulo day: diagnosticos/<YYYY-MM-DD>.json.
 */

const TZ = 'America/Sao_Paulo';
const dayOf = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const keyOf = (day: string) => `diagnosticos/${day}.json`;
/** A ceiling against floods; far above what the form gets in a day. */
const MAX_PER_DAY = 300;

const text = (max: number, message = 'Confira os dados do formulário.') => z.string({ message }).trim().max(max);

export const diagnosisInputSchema = z.object({
  business: text(80, 'Informe o nome do negócio.').min(2, 'Informe o nome do negócio.'),
  segment: text(60, 'Informe o ramo do negócio.').min(2, 'Informe o ramo do negócio.'),
  city: text(60).default(''),
  whatsapp: z
    .string({ message: 'Informe um WhatsApp com DDD.' })
    .transform((v) => v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, ''))
    .refine((v) => /^\d{10,11}$/.test(v), 'Informe um WhatsApp com DDD.'),
  presence: text(200).default(''),
  wishes: text(1000).default(''),
  /** The person allowed Growlift to contact them on WhatsApp; the form cannot be sent without it. */
  consent: z.literal(true, { message: 'Marque a autorização para recebermos o seu contato.' }),
  /** Honeypot: people never see it, bots fill it. */
  website: z.string().max(0).optional(),
});
export type DiagnosisInput = z.input<typeof diagnosisInputSchema>;

export const DIAGNOSIS_STATUSES = ['novo', 'em-andamento', 'enviado', 'descartado'] as const;
export type DiagnosisStatus = (typeof DIAGNOSIS_STATUSES)[number];

export interface DiagnosisRequest {
  id: string;
  createdAt: string;
  business: string;
  segment: string;
  city: string;
  whatsapp: string;
  presence: string;
  wishes: string;
  consentAt: string;
  status: DiagnosisStatus;
  source: string;
}

export class DiagnosisError extends Error {}

export async function createDiagnosisRequest(raw: unknown, source: string, now = new Date()): Promise<DiagnosisRequest> {
  const parsed = diagnosisInputSchema.safeParse(raw);
  if (!parsed.success) throw new DiagnosisError(parsed.error.issues[0]?.message || 'Confira os dados do formulário.');
  const input = parsed.data;
  if (input.website) throw new DiagnosisError('Não foi possível enviar.');
  const day = dayOf(now);
  const at = now.toISOString();
  const request: DiagnosisRequest = {
    id: `${day.replace(/-/g, '')}-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: at,
    business: input.business,
    segment: input.segment,
    city: input.city,
    whatsapp: input.whatsapp,
    presence: input.presence,
    wishes: input.wishes,
    consentAt: at,
    status: 'novo',
    source: source.slice(0, 120),
  };
  await updateDay(day, (list) => {
    if (list.length >= MAX_PER_DAY) throw new DiagnosisError('Recebemos muitos pedidos hoje. Tente de novo amanhã.');
    return [...list, request];
  });
  return request;
}

async function updateDay(day: string, fn: (list: DiagnosisRequest[]) => DiagnosisRequest[]) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const doc = await storage().readJSON<DiagnosisRequest[]>(keyOf(day));
    try {
      await storage().writeJSON(keyOf(day), fn(doc?.data ?? []), doc ? doc.etag : null);
      return;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 4) throw err;
    }
  }
}

/** The last `days` days, newest first. */
export async function listDiagnosisRequests(days = 30, now = new Date()): Promise<DiagnosisRequest[]> {
  const keys = Array.from({ length: days }, (_, i) => dayOf(new Date(now.getTime() - i * 86_400_000)));
  const docs = await Promise.all(keys.map((d) => storage().readJSON<DiagnosisRequest[]>(keyOf(d))));
  return docs.flatMap((d) => d?.data ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function setDiagnosisStatus(id: string, status: DiagnosisStatus) {
  const day = /^(\d{4})(\d{2})(\d{2})-/.exec(id);
  if (!day || !DIAGNOSIS_STATUSES.includes(status)) throw new DiagnosisError('Pedido inválido.');
  await updateDay(`${day[1]}-${day[2]}-${day[3]}`, (list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
}

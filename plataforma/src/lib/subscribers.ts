import 'server-only';
import { z } from 'zod';
import { storage, ConflictError } from './storage';
import { getPublished } from './stores';

/**
 * "Quero receber ofertas" sign-ups from a store's own site (plans without online ordering).
 * clientes/<slug>/inscritos.json: one entry per phone, the latest sign-up wins.
 * They join the store's customer list; whoever later asks to stop goes to the opt-out list, which always wins.
 */

export interface Subscriber {
  phone: string;
  name: string;
  subscribedAt: string;
}

const MAX_SUBSCRIBERS = 20_000;
const keyOf = (slug: string) => `clientes/${slug}/inscritos.json`;

export const subscribeSchema = z.object({
  name: z.string({ message: 'Informe seu nome.' }).trim().max(60).default(''),
  phone: z
    .string({ message: 'Informe um WhatsApp com DDD.' })
    .transform((v) => v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, ''))
    .refine((v) => /^\d{10,11}$/.test(v), 'Informe um WhatsApp com DDD.'),
  consent: z.literal(true, { message: 'Marque a autorização para receber ofertas pelo WhatsApp.' }),
  /** Honeypot: people never see it, bots fill it. */
  website: z.string().max(0).optional(),
});

export class SubscribeError extends Error {}

export async function listSubscribers(slug: string): Promise<Subscriber[]> {
  return (await storage().readJSON<Subscriber[]>(keyOf(slug)))?.data ?? [];
}

export async function addSubscriber(slug: string, raw: unknown, now = new Date()): Promise<Subscriber> {
  if (!(await getPublished(slug))) throw new SubscribeError('Loja não encontrada.');
  const parsed = subscribeSchema.safeParse(raw);
  if (!parsed.success) throw new SubscribeError(parsed.error.issues[0]?.message || 'Confira os dados.');
  if (parsed.data.website) throw new SubscribeError('Não foi possível enviar.');
  const entry: Subscriber = { phone: parsed.data.phone, name: parsed.data.name, subscribedAt: now.toISOString() };
  for (let attempt = 0; attempt < 5; attempt++) {
    const doc = await storage().readJSON<Subscriber[]>(keyOf(slug));
    const list = (doc?.data ?? []).filter((s) => s.phone !== entry.phone);
    if (list.length >= MAX_SUBSCRIBERS) throw new SubscribeError('A lista desta loja está cheia. Fale com a loja.');
    try {
      await storage().writeJSON(keyOf(slug), [...list, entry], doc ? doc.etag : null);
      return entry;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 4) throw err;
    }
  }
  throw new SubscribeError('Não foi possível salvar agora.');
}

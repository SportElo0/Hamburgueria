import 'server-only';
import { storage, ConflictError } from './storage';
import { ordersForDays } from './orders';
import { SOLD_STATUSES, effectiveStatus, type Order } from './ordering';
import { listSubscribers, type Subscriber } from './subscribers';

/**
 * The store's customers, built from its orders, and who agreed to promotions on WhatsApp.
 * Consent comes from the checkout tick box on the customer's latest order; the store can also take
 * someone off (they replied "SAIR"), kept in clientes/<slug>/descadastro.json and always winning.
 */

export interface Customer {
  phone: string;
  name: string;
  /** Orders the store accepted. */
  orders: number;
  spent: number;
  lastOrderAt: string;
  /** Ticked "receive promotions" on their latest order and not taken off since. */
  optIn: boolean;
  /** What their latest order or sign-up said, before any opt-out. */
  ticked: boolean;
  /** Signed up on the store's site to receive offers. */
  subscribedAt?: string;
  optedOut: boolean;
}

const optOutKey = (slug: string) => `clientes/${slug}/descadastro.json`;

export async function getOptOuts(slug: string): Promise<string[]> {
  return (await storage().readJSON<string[]>(optOutKey(slug)))?.data ?? [];
}

export async function setOptOut(slug: string, phone: string, out: boolean) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const doc = await storage().readJSON<string[]>(optOutKey(slug));
    const list = (doc?.data ?? []).filter((p) => p !== phone);
    try {
      await storage().writeJSON(optOutKey(slug), out ? [...list, phone] : list, doc ? doc.etag : null);
      return;
    } catch (err) {
      if (!(err instanceof ConflictError) || attempt === 3) throw err;
    }
  }
}

/** Pure: customers from day documents (oldest first). Newest customers first. */
export function customersFrom(days: { orders: Order[] }[], optOuts: readonly string[], now = Date.now(), subscribers: readonly Subscriber[] = []): Customer[] {
  const out = new Set(optOuts);
  const byPhone = new Map<string, Customer>();
  /** When each phone last said yes or no, so the newest answer (order tick box or site sign-up) wins. */
  const answeredAt = new Map<string, string>();
  for (const { orders } of days) {
    for (const o of [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
      const status = effectiveStatus(o, now);
      // Expired Pix and table orders (no phone) are not customers to contact.
      if (status === 'expirado' || !o.customer.phone) continue;
      const c = byPhone.get(o.customer.phone) ?? {
        phone: o.customer.phone,
        name: o.customer.name,
        orders: 0,
        spent: 0,
        lastOrderAt: o.createdAt,
        optIn: false,
        ticked: false,
        optedOut: false,
      };
      c.name = o.customer.name;
      c.lastOrderAt = o.createdAt;
      if (o.optIn !== undefined) {
        c.ticked = o.optIn;
        answeredAt.set(c.phone, o.createdAt);
      }
      if (SOLD_STATUSES.includes(status)) {
        c.orders++;
        c.spent += o.total;
      }
      byPhone.set(c.phone, c);
    }
  }
  for (const s of subscribers) {
    const c = byPhone.get(s.phone) ?? { phone: s.phone, name: s.name || 'Sem nome', orders: 0, spent: 0, lastOrderAt: s.subscribedAt, optIn: false, ticked: false, optedOut: false };
    c.subscribedAt = s.subscribedAt;
    if (s.subscribedAt >= (answeredAt.get(s.phone) ?? '')) c.ticked = true;
    byPhone.set(c.phone, c);
  }
  return [...byPhone.values()]
    .map((c) => ({
      ...c,
      optedOut: out.has(c.phone),
      optIn: c.ticked && !out.has(c.phone),
    }))
    .sort((a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt));
}

export async function listCustomers(slug: string, days = 90, now = new Date()) {
  const [docs, optOuts, subscribers] = await Promise.all([ordersForDays(slug, days, now), getOptOuts(slug), listSubscribers(slug)]);
  return customersFrom(docs, optOuts, now.getTime(), subscribers);
}

import { z } from 'zod';

/** One shape for every client: a restaurant's menu and a shop's catalogue are both "categories of items". */

const id = z.string().min(1).max(40);
const text = (max: number) => z.string().trim().max(max);

export const SEGMENTS = ['restaurante', 'loja', 'servico'] as const;
export const PLANS = ['parceiro', 'avulso', 'essencial', 'presenca', 'crescimento'] as const;

export const PLAN_LABEL: Record<(typeof PLANS)[number], string> = {
  parceiro: 'Parceiro (sem mensalidade)',
  avulso: 'Site avulso',
  essencial: 'Essencial',
  presenca: 'Presença',
  crescimento: 'Crescimento',
};

/** Monthly site changes included in each plan (matches the commercial proposal). */
export const PLAN_CHANGE_LIMIT: Record<(typeof PLANS)[number], number> = {
  parceiro: 2,
  avulso: 0,
  essencial: 2,
  presenca: 4,
  crescimento: 8,
};

export const choiceSchema = z.object({
  id,
  label: text(80).min(1),
  /** Extra charge in centavos (0 = included). */
  priceDelta: z.number().int().min(0).max(1_000_000),
});

export const optionGroupSchema = z.object({
  id,
  name: text(60).min(1),
  type: z.enum(['single', 'multiple']),
  required: z.boolean(),
  choices: z.array(choiceSchema).max(40),
});

export const itemSchema = z.object({
  id,
  name: text(120).min(1),
  description: text(600),
  /** Centavos. `null` = no price shown (e.g. "consulte"). */
  price: z.number().int().min(0).max(10_000_000).nullable(),
  priceLabel: text(40),
  /** Storage pathname of the photo (served by /api/midia/...), or an absolute https URL. */
  image: text(400),
  imageAlt: text(200),
  available: z.boolean(),
  featured: z.boolean(),
  tags: z.array(text(30).min(1)).max(10),
  options: z.array(optionGroupSchema).max(10),
});

export const categorySchema = z.object({
  id,
  name: text(80).min(1),
  description: text(300),
  items: z.array(itemSchema).max(300),
});

export const hoursSchema = z.object({ days: text(60).min(1), time: text(60).min(1) });

export const unitSchema = z.object({
  id,
  name: text(80).min(1),
  address: text(200),
  mapsUrl: text(500),
  whatsapp: text(20),
  hours: z.array(hoursSchema).max(14),
});

export const storeSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use letras minúsculas, números e hífen.').max(60),
  name: text(80).min(1),
  segment: z.enum(SEGMENTS),
  siteUrl: text(300),
  contact: z.object({
    whatsapp: text(20),
    instagram: text(60),
    email: text(120),
    phone: text(30),
  }),
  units: z.array(unitSchema).max(10),
  notice: z.object({ active: z.boolean(), text: text(200) }),
  catalog: z.object({ categories: z.array(categorySchema).max(40) }),
  /** Free-form data a bespoke site needs (e.g. board shapes, offers). Edited as JSON. */
  extra: z.record(z.string(), z.unknown()),
  /** Internal only: never sent to public sites. */
  account: z.object({
    plan: z.enum(PLANS),
    /** Overrides the plan's monthly change allowance when set. */
    changeLimit: z.number().int().min(0).max(100).nullable(),
    partnerUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')),
    monthlyFee: z.number().int().min(0).nullable(),
    notes: text(2000),
  }),
});

export type Store = z.infer<typeof storeSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Item = z.infer<typeof itemSchema>;
export type OptionGroup = z.infer<typeof optionGroupSchema>;
export type Unit = z.infer<typeof unitSchema>;
export type Plan = (typeof PLANS)[number];

/** A store as saved: the editable draft plus bookkeeping. */
export interface StoreRecord {
  store: Store;
  updatedAt: string;
  updatedBy: string;
  publishedAt: string | null;
}

export const changeEntrySchema = z.object({
  id,
  at: z.string(),
  by: z.string(),
  description: text(500).min(1),
  /** Counts against the monthly allowance. Holiday hours and our own fixes do not. */
  counted: z.boolean(),
  /** Over the allowance: to be charged as an extra. */
  extra: z.boolean(),
  reason: text(120),
});
export type ChangeEntry = z.infer<typeof changeEntrySchema>;

export interface StoreSummary {
  slug: string;
  name: string;
  segment: Store['segment'];
  plan: Plan;
  updatedAt: string;
  publishedAt: string | null;
}

export function newId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

export function emptyStore(slug: string, name: string, segment: Store['segment']): Store {
  return {
    slug,
    name,
    segment,
    siteUrl: '',
    contact: { whatsapp: '', instagram: '', email: '', phone: '' },
    units: [],
    notice: { active: false, text: '' },
    catalog: { categories: [] },
    extra: {},
    account: { plan: 'parceiro', changeLimit: null, partnerUntil: '', monthlyFee: null, notes: '' },
  };
}

export function emptyItem(): Item {
  return {
    id: newId(),
    name: '',
    description: '',
    price: null,
    priceLabel: '',
    image: '',
    imageAlt: '',
    available: true,
    featured: false,
    tags: [],
    options: [],
  };
}

export function changeLimit(store: Store): number {
  return store.account.changeLimit ?? PLAN_CHANGE_LIMIT[store.account.plan];
}

/** What public sites receive: everything except the internal account data. */
export function toPublic(store: Store, publishedAt: string | null, mediaBase: string) {
  const media = (src: string) => (!src || /^https?:\/\//.test(src) ? src : `${mediaBase}/${src.replace(/^midia\//, '')}`);
  return {
    slug: store.slug,
    name: store.name,
    segment: store.segment,
    contact: store.contact,
    units: store.units,
    notice: store.notice.active ? store.notice.text : null,
    catalog: {
      categories: store.catalog.categories.map((c) => ({
        ...c,
        items: c.items.map((i) => ({ ...i, image: media(i.image) })),
      })),
    },
    extra: store.extra,
    publishedAt,
  };
}
export type PublicStore = ReturnType<typeof toPublic>;

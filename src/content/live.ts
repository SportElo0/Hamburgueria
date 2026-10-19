// Live overrides published from the agency's store panel (plataforma/). The static files stay the
// source of structure, photos and layers; the panel can change prices, names, descriptions,
// availability, contacts and a notice without a redeploy. Any network or shape problem keeps the
// static data, so the site never depends on the panel being up.
import { useSyncExternalStore } from 'react';
import { addons as baseAddons, products as baseProducts, type OptionChoice, type Product } from './menu';
import { restaurant as baseRestaurant, type RestaurantInfo } from './restaurant';

export const CATALOG_URL = process.env.NEXT_PUBLIC_CATALOG_URL ?? 'https://painel-lojas-sportelo.vercel.app/api/public/lojas/downtown-burger';

export interface Catalog {
  products: Product[];
  byId: Map<string, Product>;
  /** Add-ons still on offer, with live prices. */
  addons: OptionChoice[];
  soldOut: ReadonlySet<string>;
  notice: string | null;
  restaurant: RestaurantInfo;
}

const ADDON_GROUP = 'adicionais';

function build(products: Product[], addons: OptionChoice[], soldOut: Set<string>, notice: string | null, restaurant: RestaurantInfo): Catalog {
  return { products, byId: new Map(products.map((p) => [p.id, p])), addons, soldOut, notice, restaurant };
}

export const staticCatalog = build(baseProducts, baseAddons, new Set(), null, baseRestaurant);

type Loose = Record<string, unknown> | undefined;
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const cents = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 10_000_000 ? v : null);
const digits = (v: unknown) => str(v).replace(/\D/g, '') || null;

/** Applies a published store (GET /api/public/lojas/<slug>) to the static menu. Returns null if the payload is unusable. */
export function mergeLive(data: unknown): Catalog | null {
  const d = data as Record<string, unknown> | null;
  const categories = (d?.catalog as Loose)?.categories;
  if (!d || !Array.isArray(categories)) return null;

  const live = new Map<string, Record<string, unknown>>();
  for (const c of categories) {
    const items = (c as Loose)?.items;
    if (!Array.isArray(items)) continue;
    for (const i of items) if (typeof i?.id === 'string') live.set(i.id, i);
  }

  const addons = baseAddons.flatMap((a) => {
    const o = live.get(a.id);
    if (!o) return [a];
    if (o.available === false) return [];
    return [{ ...a, label: str(o.name) || a.label, priceDelta: cents(o.price) ?? a.priceDelta }];
  });

  const soldOut = new Set<string>();
  const products = baseProducts.map((p) => {
    const options = p.options?.map((g) => (g.id === ADDON_GROUP ? { ...g, choices: addons } : g));
    const o = live.get(p.id);
    if (!o) return { ...p, options };
    if (o.available === false) soldOut.add(p.id);
    // Only photos uploaded through the panel replace ours; the seed points back at this site's own files.
    const image = str(o.image).includes('/api/midia/') ? str(o.image) : p.image;
    return {
      ...p,
      name: str(o.name) || p.name,
      description: typeof o.description === 'string' ? o.description.trim() || undefined : p.description,
      price: cents(o.price) ?? p.price,
      image,
      options,
    };
  });

  const contact = d.contact as Loose;
  const unit = (Array.isArray(d.units) ? d.units[0] : undefined) as Loose;
  const hours = Array.isArray(unit?.hours)
    ? unit.hours.map((h: Loose) => ({ days: str(h?.days), time: str(h?.time) })).filter((h) => h.days && h.time)
    : [];
  const mapsUrl = str(unit?.mapsUrl);
  const restaurant: RestaurantInfo = {
    ...baseRestaurant,
    whatsappNumber: digits(contact?.whatsapp) ?? digits(unit?.whatsapp) ?? baseRestaurant.whatsappNumber,
    address: str(unit?.address) || baseRestaurant.address,
    hours: hours.length ? hours : baseRestaurant.hours,
    mapsUrl: mapsUrl.startsWith('https://') ? mapsUrl : baseRestaurant.mapsUrl,
    phone: str(contact?.phone) || baseRestaurant.phone,
    email: str(contact?.email) || baseRestaurant.email,
    instagram: str(contact?.instagram).replace(/^@/, '') || baseRestaurant.instagram,
  };

  return build(products, addons, soldOut, str(d.notice) || null, restaurant);
}

let current = staticCatalog;
let started = false;
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Fetches the published catalog once per page load. */
export function loadLiveCatalog(url = CATALOG_URL) {
  if (started || !url) return;
  started = true;
  fetch(url, { signal: AbortSignal.timeout(6000) })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      const next = mergeLive(data);
      if (!next) return;
      current = next;
      listeners.forEach((fn) => fn());
    })
    .catch(() => {
      /* offline or panel down: keep the static menu */
    });
}

/** Static data during prerender and hydration, live data once it arrives. */
export function useCatalog() {
  return useSyncExternalStore(subscribe, () => current, () => staticCatalog);
}

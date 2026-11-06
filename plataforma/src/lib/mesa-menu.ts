import type { Store } from './schema';
import type { MesaCategory } from '@/components/mesa/MesaApp';

const media = (src: string) => (!src || /^https?:\/\//.test(src) ? src : `/api/midia/${src.replace(/^midia\//, '')}`);

/**
 * The menu as the table's phone (and the waiter's order screen) shows it: add-ons picked inside each item,
 * items without a price left out (they are asked to the waiter). `store` already has the sold-out marks.
 */
export function mesaMenu(store: Store): MesaCategory[] {
  const addons = new Map(store.catalog.categories.find((c) => c.id === 'adicionais')?.items.map((i) => [i.id, i]) ?? []);
  return store.catalog.categories
    .filter((c) => c.id !== 'adicionais')
    .map((c) => ({
      id: c.id,
      name: c.name,
      items: c.items
        .filter((i) => i.price !== null)
        .map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          price: i.price ?? 0,
          image: media(i.image),
          imageAlt: i.imageAlt || i.name,
          available: i.available,
          modelo3d: i.modelo3d ? { src: media(i.modelo3d.src), ios: i.modelo3d.ios ? media(i.modelo3d.ios) : undefined, larguraCm: i.modelo3d.larguraCm, alturaCm: i.modelo3d.alturaCm } : null,
          options: i.options.map((g) => ({
            id: g.id,
            name: g.name,
            type: g.type,
            required: g.required,
            choices: g.choices.map((ch) => {
              const linked = g.id === 'adicionais' ? addons.get(ch.id) : undefined;
              return { id: ch.id, label: linked?.name || ch.label, price: linked?.price ?? ch.priceDelta, available: linked ? linked.available : true };
            }),
          })),
        })),
    }))
    .filter((c) => c.items.length);
}

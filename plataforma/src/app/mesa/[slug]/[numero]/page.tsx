import type { Metadata, Viewport } from 'next';
import { isSlug } from '@/lib/slug';
import { getPublished } from '@/lib/stores';
import { getOperation } from '@/lib/orders';
import { orderingOf, withSoldOut } from '@/lib/ordering';
import { validKey } from '@/lib/mesas';
import { MesaApp, type MesaCategory } from '@/components/mesa/MesaApp';

export const metadata: Metadata = { title: 'Pedido na mesa' };
export const viewport: Viewport = { themeColor: '#0b0907' };

const media = (src: string) => (!src || /^https?:\/\//.test(src) ? src : `/api/midia/${src.replace(/^midia\//, '')}`);

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <main className="flex min-h-dvh flex-col justify-center bg-[#0b0907] px-6 text-[#f4ead8]">
      <h1 className="text-3xl font-black tracking-tight uppercase">{title}</h1>
      <p className="mt-3 text-base leading-relaxed text-[#cbbfa8]">{text}</p>
    </main>
  );
}

/** The page a table's QR opens. Public; everything it does goes through the table's API with the QR key. */
export default async function MesaPage({ params, searchParams }: { params: Promise<{ slug: string; numero: string }>; searchParams: Promise<{ k?: string }> }) {
  const { slug, numero } = await params;
  const { k = '' } = await searchParams;
  const number = Number(numero);
  if (!isSlug(slug) || !/^\d{1,3}$/.test(numero) || !validKey(slug, number, k)) {
    return <Notice title="Mesa não encontrada" text="Leia de novo o QR Code que está na mesa, ou chame o garçom." />;
  }
  const [record, operation] = await Promise.all([getPublished(slug), getOperation(slug)]);
  const ordering = record ? orderingOf(record.store) : null;
  if (!record || !ordering?.enabled || !ordering.tables.enabled || number > ordering.tables.count) {
    return <Notice title="Pedido pela mesa desligado" text="Este restaurante não está recebendo pedidos pelo celular agora. Chame o garçom." />;
  }
  const store = withSoldOut(record.store, operation.soldOut);
  const addons = new Map(store.catalog.categories.find((c) => c.id === 'adicionais')?.items.map((i) => [i.id, i]) ?? []);
  // Add-ons are picked inside each item; items without a price are asked to the waiter.
  const menu: MesaCategory[] = store.catalog.categories
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

  return <MesaApp slug={slug} number={number} tableKey={k} storeName={store.name} menu={menu} kitchenOpen={operation.open} />;
}

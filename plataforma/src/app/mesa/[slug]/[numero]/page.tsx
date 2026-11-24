import type { Metadata, Viewport } from 'next';
import { isSlug } from '@/lib/slug';
import { getPublished } from '@/lib/stores';
import { getOperation } from '@/lib/orders';
import { isReviewUrl, orderingOf, withSoldOut } from '@/lib/ordering';
import { validKey } from '@/lib/mesas';
import { tablePayReady } from '@/lib/mesa-pagamento';
import { MesaApp, type MesaCategory } from '@/components/mesa/MesaApp';
import { mesaMenu } from '@/lib/mesa-menu';

export const metadata: Metadata = { title: 'Pedido na mesa' };
export const viewport: Viewport = { themeColor: '#F4F6FA' };

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <main className="flex min-h-dvh flex-col justify-center bg-[#F4F6FA] px-6 text-[#121826]">
      <h1 className="text-3xl font-black tracking-tight uppercase">{title}</h1>
      <p className="mt-3 text-base leading-relaxed text-[#4A5568]">{text}</p>
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
  const menu: MesaCategory[] = mesaMenu(store);

  return <MesaApp slug={slug} number={number} tableKey={k} storeName={store.name} menu={menu} kitchenOpen={operation.open} reviewUrl={isReviewUrl(ordering.reviewUrl) ? ordering.reviewUrl : undefined} pay={{ on: tablePayReady(store), needsEmail: ordering.pixMode === 'mercadopago' }} />;
}

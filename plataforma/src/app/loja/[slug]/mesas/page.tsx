import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { requireStoreAccess } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { orderingOf } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';
import { tablePath } from '@/lib/mesas';
import { PrintButton } from '@/components/mesa/PrintButton';

export const metadata = { title: 'QR Codes das mesas' };

/** One QR per table, ready to print and stick on the tables. Each carries that table's secret key. */
export default async function MesasQrPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const ordering = orderingOf(draft.data.store);
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;
  const tables = await Promise.all(
    Array.from({ length: ordering.tables.count }, (_, i) => i + 1).map(async (n) => {
      const url = `${origin}${tablePath(slug, n)}`;
      return { n, url, svg: await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }) };
    }),
  );

  return (
    <div className="qr-sheet mx-auto max-w-4xl px-4 py-6 print:max-w-none print:p-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <a href={`/loja/${slug}/salao`} className="text-sm text-ink-mute hover:text-ink">
            ← Salão
          </a>
          <h1 className="mt-1 text-2xl font-extrabold">QR Codes das mesas</h1>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">
            Imprima, recorte e cole um em cada mesa. Cada QR só abre a sua mesa. Para mudar o número de mesas, a equipe da Growlift ajusta em Pedidos online.
          </p>
          {!ordering.enabled || !ordering.tables.enabled ? <p className="mt-2 text-sm font-semibold text-warn">O pedido pela mesa ainda está desligado: os QR só funcionam depois que ele for ligado e a loja publicada.</p> : null}
        </div>
        <PrintButton />
      </div>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-2 print:gap-0">
        {tables.map((t) => (
          <li key={t.n} className="flex break-inside-avoid flex-col items-center rounded-2xl border border-line bg-white p-4 text-center print:rounded-none print:border-dashed print:p-6">
            <p className="text-xs font-bold tracking-[0.12em] text-ink-mute uppercase">{draft.data.store.name}</p>
            <p className="mt-1 text-3xl font-black">Mesa {t.n}</p>
            <div className="mt-3 w-full max-w-[220px] [&_svg]:h-auto [&_svg]:w-full" role="img" aria-label={`QR Code da Mesa ${t.n}`} dangerouslySetInnerHTML={{ __html: t.svg }} />
            <p className="mt-3 text-sm font-semibold">Aponte a câmera para pedir</p>
            <p className="text-xs text-ink-mute">Sem app e sem cadastro</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

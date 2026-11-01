import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { requireStoreAccess } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { orderingOf } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';
import { PrintButton } from '@/components/mesa/PrintButton';

export const metadata = { title: 'QR da fila' };

/** The sign for the door: scan to join the waiting list. */
export default async function FilaQrPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const o = orderingOf(draft.data.store);
  const h = await headers();
  const url = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}/fila/${slug}`;
  const svg = await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
  return (
    <div className="qr-sheet mx-auto max-w-2xl px-4 py-6 print:max-w-none print:p-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <a href={`/loja/${slug}/mapa`} className="text-sm text-ink-mute hover:text-ink">
            ← Mapa
          </a>
          <h1 className="mt-1 text-2xl font-extrabold">QR da fila de espera</h1>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">Imprima e cole na porta ou na recepção. Quem chega lê o QR, entra na fila e é avisado no celular quando a mesa vagar.</p>
          {!o.waitlist.enabled && <p className="mt-2 text-sm font-semibold text-warn">A fila pelo celular ainda está desligada: a Growlift liga em Configurar → Pedido na mesa.</p>}
        </div>
        <PrintButton />
      </div>
      <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-line bg-white p-8 text-center print:rounded-none print:border-0">
        <p className="text-sm font-bold tracking-[0.14em] text-ink-mute uppercase">{draft.data.store.name}</p>
        <p className="mt-2 text-4xl leading-tight font-black">Mesa cheia?<br />Entre na fila pelo celular</p>
        <div className="mt-6 w-full max-w-[280px] [&_svg]:h-auto [&_svg]:w-full" role="img" aria-label="QR Code da fila de espera" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-6 text-lg font-semibold">Aponte a câmera, deixe seu nome e espere onde quiser.</p>
        <p className="mt-1 text-sm text-ink-mute">Deixe a página aberta e a tela ligada: ela avisa quando a sua mesa estiver pronta. Sem app. Pedimos só nome e número de pessoas.</p>
      </div>
    </div>
  );
}

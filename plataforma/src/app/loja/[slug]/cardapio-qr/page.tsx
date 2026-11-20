import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { getDraft, getPublished } from '@/lib/stores';
import { isSlug } from '@/lib/slug';
import { PrintButton } from '@/components/mesa/PrintButton';

export const metadata = { title: 'QR do cardápio' };

/** The sign for tables, the counter or the door: scan to see the menu (no ordering). Owner's login or the team. */
export default async function CardapioQrPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const publicado = Boolean(await getPublished(slug));
  const h = await headers();
  const url = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}/cardapio/${slug}`;
  const svg = await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
  return (
    <div className="qr-sheet mx-auto max-w-2xl px-4 py-6 print:max-w-none print:p-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <a href={`/loja/${slug}/dono`} className="text-sm text-ink-mute hover:text-ink">
            ← Painel do dono
          </a>
          <h1 className="mt-1 text-2xl font-extrabold">QR do cardápio</h1>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">
            Imprima e cole nas mesas, no balcão ou na porta. O cliente vê o cardápio no celular, sem abrir mesa e sem pedir. Quando um preço, uma foto ou um esgotado muda no painel, o cardápio já
            aparece mudado: não precisa imprimir de novo.
          </p>
          <p className="mt-2 text-sm">
            Endereço:{' '}
            <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-accent underline">
              {url.replace(/^https?:\/\//, '')}
            </a>{' '}
            <span className="text-ink-mute">(serve também para a bio do Instagram)</span>
          </p>
          {!publicado && <p className="mt-2 text-sm font-semibold text-warn">O cardápio ainda não foi publicado: a Growlift publica e o QR passa a funcionar.</p>}
        </div>
        <PrintButton />
      </div>
      <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-line bg-white p-8 text-center print:rounded-none print:border-0">
        <p className="text-sm font-bold tracking-[0.14em] text-ink-mute uppercase">{draft.data.store.name}</p>
        <p className="mt-2 text-4xl leading-tight font-black">Nosso cardápio</p>
        <div className="mt-6 w-full max-w-[280px] [&_svg]:h-auto [&_svg]:w-full" role="img" aria-label="QR Code do cardápio" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-6 text-lg font-semibold">Aponte a câmera do celular.</p>
        {/* True while /cardapio has no form, cookie or tracking: revisit this line if that ever changes. */}
        <p className="mt-1 text-sm text-ink-mute">Sem app e sem cadastro.</p>
      </div>
    </div>
  );
}

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { getDraft, getPublished } from '@/lib/stores';
import { isSlug } from '@/lib/slug';
import { orderingOf } from '@/lib/ordering';
import { dessertCategoryIds } from '@/lib/sobremesa';
import { PrintButton } from '@/components/mesa/PrintButton';

export const metadata = { title: 'Cartão da sobremesa' };

/**
 * The little card the waiter leaves on the table when clearing the plates: scan to see the desserts (in 3D when
 * scanned) on the menu-only page. Works at tables that ordered with the waiter too. Four per A4 sheet, to cut.
 */
export default async function SobremesaQrPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const store = draft.data.store;
  const publicado = Boolean(await getPublished(slug));
  const cats = dessertCategoryIds(store, orderingOf(store).sobremesa);
  const first = store.catalog.categories.find((c) => cats.has(c.id) && c.items.length);
  const has3d = Boolean(first?.items.some((i) => i.modelo3d));
  const h = await headers();
  const url = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}/cardapio/${slug}${first ? `#cat-${first.id}` : ''}`;
  const svg = await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 print:max-w-none print:p-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <a href={`/loja/${slug}/dono`} className="text-sm text-ink-mute hover:text-ink">
            ← Painel do dono
          </a>
          <h1 className="mt-1 text-2xl font-extrabold">Cartão da sobremesa</h1>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">
            Imprima, recorte e deixe um na mesa quando o garçom recolher os pratos. O QR abre as sobremesas no cardápio do celular{has3d ? ', com o 3D' : ''}. Funciona também nas mesas que pediram com o
            garçom.
          </p>
          {!first && <p className="mt-2 text-sm font-semibold text-warn">Não achei a categoria de sobremesa: marque em Pedidos online › Hora da sobremesa. O QR abre o cardápio do começo.</p>}
          {first && !has3d && <p className="mt-2 text-sm font-semibold text-warn">Nenhuma sobremesa tem 3D ainda: o cartão diz só &quot;Sobremesas&quot;.</p>}
          {!publicado && <p className="mt-2 text-sm font-semibold text-warn">O cardápio ainda não foi publicado: a Growlift publica e o QR passa a funcionar.</p>}
        </div>
        <PrintButton />
      </div>
      <div className="grid grid-cols-2 gap-4 print:gap-0">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-white p-6 text-center print:h-[148mm] print:justify-center print:rounded-none">
            <p className="text-xs font-bold tracking-[0.14em] text-ink-mute uppercase">{store.name}</p>
            <p className="mt-2 text-3xl leading-tight font-black">{has3d ? 'Sobremesa em 3D' : 'Sobremesas'}</p>
            <div className="mt-4 w-full max-w-[180px] [&_svg]:h-auto [&_svg]:w-full" role="img" aria-label="QR Code das sobremesas" dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="mt-4 text-base font-semibold">{has3d ? 'Aponte a câmera e veja do tamanho de verdade.' : 'Aponte a câmera e escolha a sua.'}</p>
            <p className="mt-1 text-xs text-ink-mute">Peça ao garçom.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

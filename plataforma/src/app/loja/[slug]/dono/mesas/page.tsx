import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { orderingOf } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';
import { MesasAoVivo } from '@/components/dono/MesasAoVivo';

export const metadata = { title: 'Mesas' };

export default async function MesasDonoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const o = orderingOf(draft.data.store);
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Mesas</h1>
          <p className="mt-1 text-ink-soft">Ao vivo: quem está sentado, quanto já pediu e quem está chamando. Atualiza sozinho.</p>
        </div>
        {o.enabled && o.tables.enabled && (
          <div className="flex gap-2">
            <a href={`/loja/${slug}/mapa`} className="btn-ghost min-h-11">
              Mapa e reservas
            </a>
            <a href={`/loja/${slug}/salao`} className="btn-ghost min-h-11">
              Tela do salão
            </a>
          </div>
        )}
      </div>
      {o.enabled && o.tables.enabled ? (
        <MesasAoVivo slug={slug} count={o.tables.count} />
      ) : (
        <p className="card mt-6 px-5 py-10 text-center text-ink-mute">O pedido pela mesa (QR) está desligado nesta loja. Fale com a Growlift para ligar.</p>
      )}
    </div>
  );
}

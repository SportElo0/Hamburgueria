import type { Metadata } from 'next';
import { isSlug } from '@/lib/slug';
import { publicFloor } from '@/lib/movimento';
import { MovimentoLive } from '@/components/salao/MovimentoLive';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const floor = isSlug(slug) ? await publicFloor(slug) : null;
  return { title: floor ? `Movimento agora · ${floor.store}` : 'Movimento agora' };
}

/** Public: how busy the room is right now, and a way to book when it's full. */
export default async function MovimentoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const floor = isSlug(slug) ? await publicFloor(slug) : null;
  if (!floor) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-2xl font-bold">Movimento indisponível</h1>
        <p className="mt-2 text-ink-soft">Este restaurante não mostra o movimento do salão pelo site.</p>
      </main>
    );
  }
  return <MovimentoLive slug={slug} initial={floor} />;
}

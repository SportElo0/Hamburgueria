import type { Metadata } from 'next';
import { isSlug } from '@/lib/slug';
import { publicFloor } from '@/lib/movimento';
import { MovimentoEmbed } from '@/components/salao/MovimentoEmbed';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Movimento agora', robots: { index: false } };

/**
 * The live floor, made to sit inside the restaurant's own site (an iframe). The only panel page that may be
 * framed (see next.config.ts); read-only, no personal data.
 */
export default async function MovimentoEmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const floor = isSlug(slug) ? await publicFloor(slug) : null;
  if (!floor) return <p className="p-4 text-sm text-ink-mute">Movimento indisponível agora.</p>;
  return <MovimentoEmbed slug={slug} initial={floor} />;
}

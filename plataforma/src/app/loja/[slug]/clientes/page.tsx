import { notFound, redirect } from 'next/navigation';
import { isSlug } from '@/lib/slug';

/** The clients screen moved into the owner's panel; old links and bookmarks land there. */
export default async function CustomersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  redirect(`/loja/${slug}/dono/clientes`);
}

import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getChanges, getDraft, listChangeMonths } from '@/lib/stores';
import { monthKey, usage } from '@/lib/changes';
import { changeLimit } from '@/lib/schema';
import { isSlug } from '@/lib/slug';
import { StoreEditor } from '@/components/editor/StoreEditor';

export default async function LojaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mes?: string; aba?: string }>;
}) {
  await requireUser();
  const { slug } = await params;
  const { mes, aba } = await searchParams;
  if (!isSlug(slug)) notFound();
  const draft = await getDraft(slug);
  if (!draft) notFound();

  const current = monthKey();
  const month = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : current;
  const [changes, currentChanges, months] = await Promise.all([getChanges(slug, month), getChanges(slug, current), listChangeMonths(slug)]);
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;

  return (
    <>
      <Link href="/painel" className="text-sm text-ink-mute hover:text-ink">
        ← Lojas
      </Link>
      <StoreEditor
        record={draft.data}
        etag={draft.etag}
        month={month}
        currentMonth={current}
        months={[...new Set([current, ...months])]}
        changes={changes}
        currentUsage={usage(currentChanges, changeLimit(draft.data.store))}
        apiUrl={`${origin}/api/public/lojas/${slug}`}
        initialTab={aba}
      />
    </>
  );
}

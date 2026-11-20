import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { isSlug } from '@/lib/slug';
import { getCostSheet } from '@/lib/inteligencia/dados';
import { isDemo } from '@/lib/inteligencia/demo';
import { CostEditor } from '@/components/inteligencia/CostEditor';

export const metadata = { title: 'Custos da loja' };

export default async function CustosPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const costs = await getCostSheet(slug);
  const categories = draft.data.store.catalog.categories.map((c) => ({
    name: c.name,
    items: c.items.map((i) => ({ id: i.id, name: i.name, price: i.price })),
  }));

  return (
    <div className="space-y-5">
      {isDemo(slug) && (
        <p role="note" className="rounded-lg border border-warn/40 bg-warn/10 px-4 py-2.5 text-sm font-semibold text-warn">
          Demonstração: custos fictícios.
        </p>
      )}
      <div>
        <Link href={`/painel/inteligencia/${slug}`} className="text-sm text-ink-mute hover:text-ink">
          ← Voltar à análise
        </Link>
        <h1 className="mt-1 text-3xl font-bold">Custos · {draft.data.store.name}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-mute">
          Use os valores que a loja informou (notas de compra, fichas da cozinha, extrato da maquininha). Sem custo, o item continua na
          análise de vendas, mas fica fora das margens e da matriz.
        </p>
      </div>
      <CostEditor slug={slug} initial={costs.sheet} etag={costs.etag} categories={categories} />
    </div>
  );
}

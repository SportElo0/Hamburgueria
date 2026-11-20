import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { isSlug } from '@/lib/slug';
import { getConversa, iaLigada, limiteMes, listarConversas, perguntasNoMes } from '@/lib/conselheiro/ia';
import { Conversa } from '@/components/conselheiro/Conversa';

export const metadata = { title: 'Conselheiro · Conversa' };

export default async function ConversaPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ c?: string; pergunta?: string }> }) {
  const { slug } = await params;
  const q = await searchParams;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const [lista, atual, usadas] = await Promise.all([listarConversas(slug), q.c ? getConversa(slug, q.c) : null, perguntasNoMes(slug)]);
  const base = `/loja/${slug}/dono/conselheiro/conversa`;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
      <Conversa key={atual?.id ?? 'nova'} slug={slug} ligada={iaLigada()} conversaId={atual?.id ?? null} mensagens={atual?.mensagens ?? []} perguntaInicial={(q.pergunta ?? '').slice(0, 300)} />
      <aside className="space-y-3 text-sm">
        <Link href={base} className="btn-ghost w-full">Nova conversa</Link>
        <p className="text-xs text-ink-mute">Perguntas neste mês: {usadas} de {limiteMes()}.</p>
        {lista.length > 0 && (
          <ul className="space-y-1">
            {lista.slice(0, 30).map((c) => (
              <li key={c.id}>
                <Link href={`${base}?c=${c.id}`} className={`block truncate rounded-lg px-2 py-1.5 hover:bg-paper ${atual?.id === c.id ? 'bg-accent-soft font-semibold text-accent' : 'text-ink-soft'}`}>
                  {c.titulo}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

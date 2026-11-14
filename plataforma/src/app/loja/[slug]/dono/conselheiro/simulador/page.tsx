import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { isSlug } from '@/lib/slug';
import { contexto } from '@/lib/conselheiro/dados';
import { basesParaSimulador, listarSimulacoes } from '@/lib/conselheiro/registros';
import { NOME_SIMULACAO } from '@/lib/conselheiro/modelo';
import { Simulador } from '@/components/conselheiro/Simulador';

export const metadata = { title: 'Conselheiro · Simulador' };

export default async function SimuladorPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ produto?: string; canal?: string; aba?: string }> }) {
  const { slug } = await params;
  const q = await searchParams;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const ctx = await contexto(slug);
  const [bases, salvas] = await Promise.all([basesParaSimulador(ctx), listarSimulacoes(slug)]);
  const aba = q.aba === 'desconto' || q.aba === 'combo' ? q.aba : 'preco';
  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-ink-soft">Mude um número e veja a conta na hora. Simule à vontade: nada muda no seu cardápio. Salve o que quiser comparar ou levar para uma decisão.</p>
      <Simulador slug={slug} bases={bases} inicial={{ produto: q.produto, canal: q.canal, aba }} />
      {salvas.length > 0 && (
        <section>
          <h2 className="text-lg font-bold">Simulações salvas</h2>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {salvas.slice(0, 20).map((s) => (
              <li key={s.id} className="card p-3 text-sm">
                <p className="font-semibold">{s.titulo}</p>
                <p className="text-ink-mute">{NOME_SIMULACAO[s.tipo]} · {new Date(s.criadaEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-ink-mute">As que viraram decisão aparecem em <Link className="font-semibold text-accent" href={`/loja/${slug}/dono/conselheiro/decisoes`}>Decisões</Link>, com os números guardados.</p>
        </section>
      )}
    </div>
  );
}

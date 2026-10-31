import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { listStores } from '@/lib/stores';
import { DEMO_SLUG } from '@/lib/inteligencia/demo';
import { DemoButton } from '@/components/inteligencia/DemoButton';

export const metadata = { title: 'Inteligência' };

export default async function InteligenciaIndex() {
  await requireUser();
  const stores = await listStores();
  const demo = stores.find((s) => s.slug === DEMO_SLUG);
  const real = stores.filter((s) => s.slug !== DEMO_SLUG && s.segment === 'restaurante');

  return (
    <>
      <h1 className="text-3xl font-bold">Inteligência</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-mute">
        Vendas, margens por item e recomendações de teste a partir dos pedidos que a loja recebe pelo site. Os números são
        calculados pelo painel; as recomendações seguem regras fixas e só valem depois de a equipe revisar e o dono aprovar.
      </p>

      <section className="card mt-6 border-dashed p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="font-bold">Demonstração com dados fictícios</p>
            <p className="mt-1 text-sm text-ink-mute">
              Uma hamburgueria inventada, com 120 dias de pedidos e custos gerados pelo painel. Serve para mostrar como funciona
              sem usar dados de clientes. Não é publicada e não aparece em nenhum site.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {demo && (
              <Link href={`/painel/inteligencia/${DEMO_SLUG}`} className="btn-primary">
                Abrir demonstração
              </Link>
            )}
            <DemoButton exists={Boolean(demo)} />
          </div>
        </div>
      </section>

      <h2 className="mt-8 text-lg font-bold">Restaurantes</h2>
      {real.length === 0 ? (
        <p className="mt-2 text-sm text-ink-mute">Nenhum restaurante cadastrado.</p>
      ) : (
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {real.map((s) => (
            <li key={s.slug}>
              <Link href={`/painel/inteligencia/${s.slug}`} className="card block p-5 transition-colors hover:border-ink">
                <p className="text-lg font-bold">{s.name}</p>
                <p className="text-sm text-ink-mute">Ver vendas, margens e recomendações</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { listReferrals } from '@/lib/referrals';
import { listStores } from '@/lib/stores';
import { ReferralsPanel } from '@/components/ReferralsPanel';

export default async function IndicacoesPage() {
  await requireUser();
  const [referrals, stores] = await Promise.all([listReferrals(), listStores()]);

  return (
    <>
      <Link href="/painel" className="text-sm text-ink-mute hover:text-ink">
        ← Lojas
      </Link>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Indicações</h1>
          <p className="mt-1 text-sm text-ink-mute">Quem indicou, o que foi feito e a comissão a pagar quando o negócio fechar.</p>
        </div>
      </div>
      <ReferralsPanel referrals={referrals} storeOptions={stores.map((s) => ({ slug: s.slug, name: s.name }))} />
    </>
  );
}

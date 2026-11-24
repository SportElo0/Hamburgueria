import { requireUser } from '@/lib/auth';
import { listarClientesCrm } from '@/lib/crm-servidor';
import { gravacaoPermitida } from '@/lib/ambiente';
import { todaySP } from '@/lib/ordering';
import { CrmGrowlift } from '@/components/crm/CrmGrowlift';

export const metadata = { title: 'Clientes da Growlift' };

/** Growlift's customers and possible customers, typed in by the team. */
export default async function ClientesGrowliftPage() {
  await requireUser();
  const lista = await listarClientesCrm();
  return (
    <>
      <h1 className="text-3xl font-bold">Clientes</h1>
      <p className="mt-1 max-w-3xl text-ink-soft">Quem já comprou da Growlift e quem pode comprar: o que levou, quanto, se já pagou, mensalidades e anotações. Só a equipe vê.</p>
      {!gravacaoPermitida() && <p className="card mt-4 p-4 text-sm font-semibold text-warn">Esta é uma versão de prévia: dá para ver, mas nada é salvo aqui.</p>}
      <CrmGrowlift inicial={lista} hoje={todaySP()} />
    </>
  );
}

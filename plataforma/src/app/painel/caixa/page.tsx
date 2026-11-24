import { requireUser } from '@/lib/auth';
import { listarCustos } from '@/lib/custos-servidor';
import { listarClientesCrm } from '@/lib/crm-servidor';
import { gravacaoPermitida } from '@/lib/ambiente';
import { todaySP } from '@/lib/ordering';
import { CaixaGrowlift } from '@/components/crm/CaixaGrowlift';

export const metadata = { title: 'Caixa da Growlift' };

/** Growlift's month: sales (from Clientes), costs and what is left to spend. Team only. */
export default async function CaixaPage() {
  await requireUser();
  const [custos, clientes] = await Promise.all([listarCustos(), listarClientesCrm()]);
  return (
    <>
      <h1 className="text-3xl font-bold">Caixa</h1>
      <p className="mt-1 max-w-3xl text-ink-soft">O que entrou (das vendas da aba Clientes), o que sai (assinaturas, imposto, material, anúncio) e quanto sobra para gastar. Só a equipe vê.</p>
      {!gravacaoPermitida() && <p className="card mt-4 p-4 text-sm font-semibold text-warn">Esta é uma versão de prévia: dá para ver, mas nada é salvo aqui.</p>}
      <CaixaGrowlift inicial={custos} clientes={clientes} hoje={todaySP()} />
    </>
  );
}

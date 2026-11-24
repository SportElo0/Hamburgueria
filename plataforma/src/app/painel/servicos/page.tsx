import { requireUser } from '@/lib/auth';
import { listarServicos } from '@/lib/servicos-servidor';
import { gravacaoPermitida } from '@/lib/ambiente';
import { ServicosGrowlift } from '@/components/crm/ServicosGrowlift';

export const metadata = { title: 'Serviços da Growlift' };

/** Every Growlift service in one place: a card with a demo picture and what it is. Team only. */
export default async function ServicosPage() {
  await requireUser();
  const servicos = await listarServicos();
  return (
    <>
      <h1 className="text-3xl font-bold">Serviços</h1>
      <p className="mt-1 max-w-3xl text-ink-soft">Tudo o que a Growlift vende ou está construindo, com uma foto de exemplo e o que é cada um. Só a equipe vê.</p>
      {!gravacaoPermitida() && <p className="card mt-4 p-4 text-sm font-semibold text-warn">Esta é uma versão de prévia: dá para ver, mas nada é salvo aqui.</p>}
      <ServicosGrowlift inicial={servicos} />
    </>
  );
}

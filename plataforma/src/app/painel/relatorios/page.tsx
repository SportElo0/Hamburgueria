import { requireUser } from '@/lib/auth';
import { listStores } from '@/lib/stores';
import { hojeSP } from '@/lib/relatorio/exportar';
import { INSTRUCOES_CLAUDE } from '@/lib/relatorio/instrucoes';
import { ExportarDados } from './ExportarDados';

export const metadata = { title: 'Dados para o Claude' };

const somaDias = (day: string, n: number) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

export default async function RelatoriosPage() {
  await requireUser();
  const hoje = hojeSP();
  const lojas = (await listStores()).filter((s) => s.segment === 'restaurante').map((s) => ({ slug: s.slug, nome: s.name }));
  const [y, m] = hoje.split('-').map(Number);
  const inicioMesPassado = m === 1 ? `${y - 1}-12-01` : `${y}-${String(m - 1).padStart(2, '0')}-01`;
  const fimMesPassado = somaDias(`${hoje.slice(0, 7)}-01`, -1);
  return (
    <>
      <h1 className="text-3xl font-bold">Dados para o Claude</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-mute">
        Escolha o período e baixe o documento de cada restaurante (ou de todos). No Claude, abra o projeto <strong>Consultor de restaurantes</strong>, solte os
        documentos e peça a apresentação do mês. O documento traz só contagens e números da loja, nenhum dado de cliente.
      </p>
      <ExportarDados
        lojas={lojas}
        periodos={[
          { rotulo: 'Últimos 30 dias', de: somaDias(hoje, -29), ate: hoje },
          { rotulo: 'Mês passado', de: inicioMesPassado, ate: fimMesPassado },
          { rotulo: 'Últimos 7 dias', de: somaDias(hoje, -6), ate: hoje },
        ]}
        hoje={hoje}
        instrucoes={INSTRUCOES_CLAUDE}
      />
    </>
  );
}

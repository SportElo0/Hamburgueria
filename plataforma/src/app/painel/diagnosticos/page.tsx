import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { listDiagnosisRequests } from '@/lib/diagnostics';
import { DiagnosisList } from '@/components/DiagnosisList';

export const metadata = { title: 'Pedidos de diagnóstico' };

export default async function DiagnosticosPage() {
  await requireUser();
  const requests = await listDiagnosisRequests(60);
  return (
    <>
      <Link href="/painel" className="text-sm text-ink-mute hover:text-ink">
        ← Lojas
      </Link>
      <div className="mt-2">
        <h1 className="text-3xl font-bold">Pedidos de diagnóstico</h1>
        <p className="mt-1 text-sm text-ink-mute">Quem pediu o diagnóstico grátis pelo site da Growlift nos últimos 60 dias. Todos autorizaram o contato pelo WhatsApp.</p>
      </div>
      <DiagnosisList requests={requests} />
    </>
  );
}

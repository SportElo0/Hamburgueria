import { notFound, redirect } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { isSlug } from '@/lib/slug';
import { modulosDa } from '@/lib/produto';
import { getOptOuts } from '@/lib/customers';
import { linhasDoCrm } from '@/lib/importados';
import { getEnviados, getImportacao, resumoDaImportacao } from '@/lib/importados-servidor';
import { ImportarLista } from '@/components/app/ImportarLista';
import { ClientesCrm } from '@/components/app/ClientesCrm';

export const metadata = { title: 'Clientes' };

export default async function AppClientesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const modulos = modulosDa(draft.data.store);
  if (!modulos.includes('clientes')) {
    if (modulos.includes('torpedo')) redirect(`/loja/${slug}/app/torpedo`);
    return <p className="text-ink-soft">Seu app ainda está sendo montado pela Growlift.</p>;
  }
  const [importacao, enviados, optOuts] = await Promise.all([getImportacao(slug), getEnviados(slug), getOptOuts(slug)]);
  const resumo = importacao ? resumoDaImportacao(importacao, enviados) : null;
  const linhas = importacao ? linhasDoCrm(importacao.clientes, { importadoEm: importacao.importadoEm, optOuts, enviados }) : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Clientes</h1>
        <p className="mt-1 text-sm text-ink-soft">Todos os seus clientes do Anota Aí num lugar só: quem mais pede, quem sumiu e quem já foi chamado.</p>
      </div>
      <ImportarLista key={resumo?.importadoEm ?? 'vazio'} slug={slug} resumo={resumo} />
      {linhas.length > 0 && <ClientesCrm slug={slug} storeName={draft.data.store.name} linhas={linhas} torpedo={modulos.includes('torpedo')} />}
    </div>
  );
}

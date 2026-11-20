import { notFound, redirect } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { isSlug } from '@/lib/slug';
import { modulosDa } from '@/lib/produto';
import { getOptOuts } from '@/lib/customers';
import { escolher } from '@/lib/importados';
import { getEnviados, getImportacao, iaCampanhaLigada } from '@/lib/importados-servidor';
import { getPlano } from '@/lib/torpedo-servidor';
import { todaySP } from '@/lib/ordering';
import { Torpedo } from '@/components/app/Torpedo';

export const metadata = { title: 'Torpedo' };

export default async function AppTorpedoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const modulos = modulosDa(draft.data.store);
  if (!modulos.includes('torpedo')) redirect(`/loja/${slug}/app`);
  const [importacao, enviados, optOuts, plano] = await Promise.all([getImportacao(slug), getEnviados(slug), getOptOuts(slug), getPlano(slug)]);
  // Up to 200, best first: the screen shows as many as the owner chose.
  const escolhidos = importacao ? escolher(importacao.clientes, { importadoEm: importacao.importadoEm, optOuts, enviados, limite: 200 }) : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Torpedo</h1>
        <p className="mt-1 text-sm text-ink-soft">Conte o que você quer vender e a IA prepara a mensagem. Depois é só tocar em Enviar: sai do seu WhatsApp, sem custo por mensagem.</p>
      </div>
      <Torpedo
        slug={slug}
        storeName={draft.data.store.name}
        ia={iaCampanhaLigada()}
        hoje={todaySP()}
        plano={plano}
        escolhidos={escolhidos}
        temLista={Boolean(importacao)}
        clientes={modulos.includes('clientes')}
      />
    </div>
  );
}

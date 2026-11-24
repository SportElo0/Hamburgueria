import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { isSlug } from '@/lib/slug';
import { getLotes } from '@/lib/conselheiro/dados';
import { TIPOS_LOTE, type TipoLote } from '@/lib/conselheiro/modelo';
import { Importador } from '@/components/conselheiro/Importador';
import { AcaoForm } from '@/components/conselheiro/AcaoForm';
import { desfazerLoteAction } from '../actions';

export const metadata = { title: 'Conselheiro · Importar' };

export default async function ImportarPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ tipo?: string }> }) {
  const { slug } = await params;
  const { tipo } = await searchParams;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const lotes = (await getLotes(slug)).sort((a, b) => b.em.localeCompare(a.em));
  const inicial: TipoLote = TIPOS_LOTE.includes(tipo as TipoLote) ? (tipo as TipoLote) : 'vendas';
  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-ink-soft">
        Traga a planilha do seu sistema ou do app de delivery. Você vê cada linha antes de gravar; nada entra sem o seu ok. Integração direta com outros sistemas só com acesso oficial (nunca com a sua senha).
      </p>
      <Importador slug={slug} tipoInicial={inicial} />
      <section>
        <h2 className="text-lg font-bold">Importações feitas</h2>
        {lotes.length === 0 ? (
          <p className="mt-2 text-ink-soft">Nenhuma ainda.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {lotes.map((l) => (
              <li key={l.id} className="card flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                <div>
                  <p className="font-semibold">{l.arquivo} <span className="font-normal text-ink-mute">· {l.tipo}</span></p>
                  <p className="text-ink-mute">
                    {new Date(l.em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} por {l.por} · {l.importadas} de {l.linhas} linha(s)
                    {l.periodo ? ` · ${l.periodo.inicio.split('-').reverse().join('/')} a ${l.periodo.fim.split('-').reverse().join('/')}` : ''}
                    {l.desfeitoEm ? ` · desfeito em ${l.desfeitoEm.slice(0, 10).split('-').reverse().join('/')}` : ''}
                  </p>
                </div>
                {l.tipo === 'vendas' && !l.desfeitoEm && (
                  <AcaoForm action={desfazerLoteAction.bind(null, slug)} botao="Desfazer" variante="danger" inline>
                    <input type="hidden" name="loteId" value={l.id} />
                  </AcaoForm>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

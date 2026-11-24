import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { isSlug } from '@/lib/slug';
import { getDraft } from '@/lib/stores';
import { orderingOf } from '@/lib/ordering';
import { seatingHistory } from '@/lib/mesas';
import { dessertCategoryIds, dessertStats, DESSERT_MODE_LABEL } from '@/lib/sobremesa';
import { produtoDa } from '@/lib/produto';
import { brl, fmtBps } from '@/lib/conselheiro/calculos';
import { contexto, linha } from '@/lib/conselheiro/dados';
import { getTestes } from '@/lib/conselheiro/registros';
import { NOME_STATUS_TESTE } from '@/lib/conselheiro/modelo';

export const metadata = { title: 'Conselheiro · 3D' };

export default async function TresDPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const [ctx, testes, draft] = await Promise.all([contexto(slug), getTestes(slug), getDraft(slug)]);
  const base = `/loja/${slug}/dono/conselheiro`;
  const com3d = ctx.produtos.filter((p) => p.modelo3d);
  const canal = ctx.perfil.canais.find((c) => c.ativo && c.id === 'painel') ?? ctx.perfil.canais.find((c) => c.ativo);
  const sobremesa = draft ? orderingOf(draft.data.store).sobremesa : null;
  const soConselheiro = draft ? produtoDa(draft.data.store) === 'conselheiro' : false;
  const stats = !soConselheiro && sobremesa && sobremesa.mode !== 'desligado' ? dessertStats(await seatingHistory(slug, 60)) : null;
  const catsSobremesa = draft && sobremesa ? dessertCategoryIds(draft.data.store, sobremesa) : new Set<string>();
  const sobremesas = draft ? draft.data.store.catalog.categories.filter((c) => catsSobremesa.has(c.id)).flatMap((c) => c.items) : [];
  const candidatos = ctx.produtos.filter((p) => !p.modelo3d && p.origem === 'cardapio' && ctx.perfil.prioritarios.includes(p.id));

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-ink-soft">
        O 3D é opcional: o Conselheiro funciona sem ele. Aqui aparecem os pratos que têm modelo, onde ele está publicado e os testes que usam esses pratos. A foto continua no cardápio para quem não abre o 3D.
      </p>

      {soConselheiro && (
        <section className="card space-y-3 p-5 text-sm">
          <h2 className="text-lg font-bold">Sobremesa 3D na mesa</h2>
          <p className="text-ink-soft">
            Quando o garçom recolhe os pratos, deixa na mesa o cartão com QR. O cliente aponta a câmera, vê as sobremesas em 3D e pode colocar o prato em tamanho real na mesa. O pedido continua com o garçom, no sistema que vocês já usam.
          </p>
          {sobremesas.length === 0 ? (
            <p className="font-semibold text-warn">Nenhuma categoria de sobremesa no cardápio ainda: a Growlift cadastra com você.</p>
          ) : (
            <ul className="space-y-1">
              {sobremesas.map((i) => (
                <li key={i.id}>
                  {i.name}: {i.modelo3d ? <span className="font-semibold text-ok">com 3D</span> : <span className="text-ink-mute">só foto (falta escanear)</span>}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <a className="btn-primary" href={`/loja/${slug}/sobremesa-qr`}>Imprimir o cartão com QR</a>
            <a className="btn-ghost" href={`${base}/testes#novo`}>Medir antes e depois</a>
            <a className="btn-ghost" href={`${base}/importar?tipo=vendas`}>Importar vendas</a>
          </div>
          <p className="text-xs text-ink-mute">
            Para saber se vendeu mais: importe as vendas de sobremesa do seu sistema (antes e depois do cartão) e crie um teste &quot;antes e depois&quot;. Sem o sistema de mesas da Growlift não há aviso automático no celular nem na tela do garçom, e o painel não sabe quem abriu o 3D.
          </p>
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold">Pratos com 3D</h2>
        {com3d.length === 0 ? (
          <p className="mt-2 text-ink-soft">Nenhum prato com 3D ainda. A equipe da Growlift escaneia e envia pelo painel.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {com3d.map((p) => {
              const l = canal ? linha(ctx, p, canal) : null;
              const ts = testes.filter((t) => t.produtos.includes(p.id));
              return (
                <li key={p.id} className="card p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{p.nome}</p>
                      <p className="text-ink-mute">
                        {p.modelo3d!.publicado ? 'Publicado no cardápio' : 'Só no rascunho (não publicado)'} · {p.modelo3d!.larguraCm} cm de largura · iPhone: {p.modelo3d!.ios ? 'arquivo próprio' : 'convertido no aparelho'} · foto: {p.foto ? 'sim' : 'não'}
                      </p>
                    </div>
                    {l?.resultado && <p className="text-right">{canal!.nome}: {brl(l.resultado.contribuicao)} por unidade ({fmtBps(l.resultado.margemBps)})</p>}
                  </div>
                  {ts.length > 0 ? (
                    <p className="mt-1">Testes: {ts.map((t) => <Link key={t.id} href={`${base}/testes#${t.id}`} className="mr-2 font-semibold text-accent">{t.nome} ({NOME_STATUS_TESTE[t.status]})</Link>)}</p>
                  ) : (
                    <p className="mt-1 text-ink-mute">Nenhum teste com este prato.</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card p-5 text-sm">
        <h2 className="text-lg font-bold">O que dá para medir hoje</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
          <li>Vendas e contribuição de cada prato, antes e depois do 3D, num teste de Testes e metas.</li>
          {!soConselheiro && <li>Na Hora da sobremesa: a parte das mesas que pediu sobremesa com o aviso e sem o aviso.</li>}
          <li><strong>Ainda não medido:</strong> quantas pessoas abriram o 3D, se o modelo carregou e quem tocou em “Ver na minha mesa”. Tocar no botão também não prova que o prato apareceu na mesa, e compra depois de ver não prova que foi o 3D que vendeu.</li>
        </ul>
      </section>

      {sobremesa && !soConselheiro && (
        <section className="card p-5 text-sm">
          <h2 className="text-lg font-bold">Hora da sobremesa</h2>
          <p className="mt-1 text-ink-soft">
            Modo: <strong>{DESSERT_MODE_LABEL[sobremesa.mode]}</strong>. O aviso aparece {sobremesa.minutes} minutos depois que a cozinha marca o prato principal como pronto, ou quando a mesa pede a conta. Prato pronto não quer dizer que a refeição acabou, e o aviso só aparece com a página da mesa aberta no celular.
          </p>
          {stats ? (
            <p className="mt-2">
              Últimos 60 dias: com aviso {stats.com.tables} mesas ({Math.round(stats.com.rate * 100)}% pediram), sem aviso {stats.sem.tables} mesas ({Math.round(stats.sem.rate * 100)}%).{' '}
              {stats.reliable ? 'Já há mesas suficientes nos dois grupos para comparar.' : 'Ainda poucas mesas para comparar: espere mais dias.'} Detalhes em Mesas › Tempo nas mesas.
            </p>
          ) : (
            <p className="mt-2 text-ink-mute">Desligado (só mede). A equipe liga em Pedidos online › Hora da sobremesa.</p>
          )}
        </section>
      )}

      {candidatos.length > 0 && (
        <section>
          <h2 className="text-lg font-bold">Prioritários sem 3D</h2>
          <p className="mt-1 text-sm text-ink-soft">Para escolher o que escanear, veja a contribuição de cada um. Quem decide é você.</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {candidatos.map((p) => {
              const l = canal ? linha(ctx, p, canal) : null;
              return (
                <li key={p.id} className="card p-3 text-sm">
                  <p className="font-semibold">{p.nome}</p>
                  <p className="text-ink-mute">{l?.resultado ? `${brl(l.resultado.contribuicao)} por unidade em ${canal!.nome}` : 'sem custo ou preço para calcular'}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { isSlug } from '@/lib/slug';
import { brl, fmtBps } from '@/lib/conselheiro/calculos';
import { contexto, custoVigente, linha } from '@/lib/conselheiro/dados';
import { NOME_ORIGEM } from '@/lib/conselheiro/modelo';
import { AcaoForm } from '@/components/conselheiro/AcaoForm';
import { adicionarCustoAction, adicionarPrecoAction } from '../actions';

export const metadata = { title: 'Conselheiro · Produtos e custos' };

const br = (d: string) => (d ? d.split('-').reverse().join('/') : '');

export default async function ProdutosPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ todos?: string }> }) {
  const { slug } = await params;
  const { todos } = await searchParams;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const ctx = await contexto(slug);
  const base = `/loja/${slug}/dono/conselheiro`;
  const canais = ctx.perfil.canais.filter((c) => c.ativo);
  const prior = new Set(ctx.perfil.prioritarios);
  const lista = [...ctx.produtos].sort((a, b) => Number(prior.has(b.id)) - Number(prior.has(a.id)));
  const mostrar = todos || prior.size === 0 ? lista : lista.filter((p) => prior.has(p.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-ink-soft">
          Preço por canal, custo vigente e quanto sobra por unidade. Custo novo é uma versão nova: as simulações salvas continuam com o custo que usaram.
        </p>
        <div className="flex gap-2">
          {prior.size > 0 && (
            <Link className="btn-ghost" href={todos ? `${base}/produtos` : `${base}/produtos?todos=1`}>
              {todos ? 'Só os prioritários' : `Ver todos (${ctx.produtos.length})`}
            </Link>
          )}
          <Link className="btn-ghost" href={`${base}/importar?tipo=custos`}>Importar custos</Link>
        </div>
      </div>
      {canais.length === 0 && (
        <p className="rounded-lg bg-warn/10 px-4 py-3 text-sm font-semibold text-warn">
          Cadastre ao menos um canal de venda em <Link className="underline" href={`${base}/cadastro`}>Cadastro</Link> para ver a contribuição.
        </p>
      )}
      {mostrar.length === 0 && <p className="text-ink-soft">Nenhum produto ainda. Cadastre em Cadastro ou importe uma lista.</p>}
      <ul className="space-y-3">
        {mostrar.map((p) => {
          const custo = custoVigente(ctx.custos, ctx.ficha, p.id, ctx.dia, ctx.perfil.custoValidadeDias);
          const historico = ctx.custos.filter((c) => c.produtoId === p.id).sort((a, b) => b.inicio.localeCompare(a.inicio) || b.registradoEm.localeCompare(a.registradoEm));
          const ls = canais.map((c) => linha(ctx, p, c));
          return (
            <li key={p.id} id={p.id} className="card scroll-mt-6 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">
                    {p.nome} {prior.has(p.id) && <span className="chip bg-accent-soft text-accent">prioritário</span>} {p.modelo3d && <span className="chip bg-paper text-ink-soft">3D</span>}
                  </p>
                  <p className="text-sm text-ink-mute">{p.categoria || 'Sem categoria'} · {p.origem === 'cardapio' ? 'do cardápio do painel' : NOME_ORIGEM[p.origem]}</p>
                </div>
                <div className="text-right text-sm">
                  {custo && custo.ingredientes !== null ? (
                    <>
                      <p>Ingredientes <strong className="tabular-nums">{brl(custo.ingredientes)}</strong> · embalagem {brl(custo.embalagem)}{custo.outros ? ` · outros ${brl(custo.outros)}` : ''}</p>
                      <p className={custo.desatualizado ? 'font-semibold text-warn' : 'text-ink-mute'}>
                        {NOME_ORIGEM[custo.origem]}, desde {br(custo.inicio)}{custo.desatualizado ? ' · desatualizado' : ''}
                      </p>
                    </>
                  ) : (
                    <p className="font-semibold text-warn">Sem custo dos ingredientes</p>
                  )}
                </div>
              </div>
              {ls.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="text-left text-ink-mute">
                      <tr><th className="py-1 font-semibold">Canal</th><th className="font-semibold">Preço</th><th className="font-semibold">Por unidade</th><th className="font-semibold">% do preço</th><th className="font-semibold">Fora da conta / pendências</th></tr>
                    </thead>
                    <tbody>
                      {ls.map((l) => (
                        <tr key={l.canal.id} className="border-t border-line align-top">
                          <td className="py-2 font-semibold">{l.canal.nome}</td>
                          <td className="py-2 tabular-nums">{l.preco ? <>{brl(l.preco.preco)}<span className="block text-xs text-ink-mute">{NOME_ORIGEM[l.preco.origem]}{l.preco.inicio ? `, ${br(l.preco.inicio)}` : ''}</span></> : <span className="text-warn">sem preço</span>}</td>
                          <td className="py-2 tabular-nums">{l.resultado?.contribuicao != null ? <>{brl(l.resultado.contribuicao)}<span className="block text-xs text-ink-mute">{l.resultado.rotulo}</span></> : '—'}</td>
                          <td className={`py-2 tabular-nums ${l.resultado?.margemBps != null && ctx.perfil.metaContribuicaoBps !== null && l.resultado.margemBps < ctx.perfil.metaContribuicaoBps ? 'font-semibold text-bad' : ''}`}>{fmtBps(l.resultado?.margemBps ?? null)}</td>
                          <td className="py-2 text-xs text-ink-soft">{l.pendencias.join('; ') || 'nada'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-1 text-xs text-ink-mute">Contribuição = preço − ingredientes − embalagem − outros − comissão − taxa de pagamento − tributo confirmado. Não é lucro.</p>
                </div>
              )}
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-accent">Registrar custo ou preço · histórico ({historico.length})</summary>
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  <AcaoForm action={adicionarCustoAction.bind(null, slug)} botao="Registrar custo" variante="ghost">
                    <input type="hidden" name="produtoId" value={p.id} />
                    <p className="text-sm font-semibold">Novo custo (por unidade)</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <div><label className="label" htmlFor={`ing-${p.id}`}>Ingredientes (R$)</label><input id={`ing-${p.id}`} name="ingredientes" className="field" inputMode="decimal" placeholder="12,50" /></div>
                      <div><label className="label" htmlFor={`emb-${p.id}`}>Embalagem (R$)</label><input id={`emb-${p.id}`} name="embalagem" className="field" inputMode="decimal" /></div>
                      <div><label className="label" htmlFor={`out-${p.id}`}>Outros (R$)</label><input id={`out-${p.id}`} name="outros" className="field" inputMode="decimal" /></div>
                      <div><label className="label" htmlFor={`lote-${p.id}`}>ou custo do lote (R$)</label><input id={`lote-${p.id}`} name="custoLote" className="field" inputMode="decimal" /></div>
                      <div><label className="label" htmlFor={`rend-${p.id}`}>rende (porções)</label><input id={`rend-${p.id}`} name="rendimento" className="field" inputMode="decimal" /></div>
                      <div><label className="label" htmlFor={`ini-${p.id}`}>Vale desde</label><input id={`ini-${p.id}`} name="inicio" type="date" className="field" max={ctx.dia} defaultValue={ctx.dia} /></div>
                    </div>
                    <div><label className="label" htmlFor={`nota-${p.id}`}>Nota</label><input id={`nota-${p.id}`} name="nota" className="field" maxLength={200} placeholder="Ex.: nota do fornecedor de 05/11" /></div>
                    <p className="text-xs text-ink-mute">Uma nota de compra sozinha não dá o custo por porção: informe quanto o lote rende.</p>
                  </AcaoForm>
                  {canais.length > 0 && (
                    <AcaoForm action={adicionarPrecoAction.bind(null, slug)} botao="Registrar preço" variante="ghost">
                      <input type="hidden" name="produtoId" value={p.id} />
                      <p className="text-sm font-semibold">Preço num canal</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <div><label className="label" htmlFor={`can-${p.id}`}>Canal</label><select id={`can-${p.id}`} name="canalId" className="field">{canais.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                        <div><label className="label" htmlFor={`pre-${p.id}`}>Preço (R$)</label><input id={`pre-${p.id}`} name="preco" className="field" inputMode="decimal" required /></div>
                        <div><label className="label" htmlFor={`pini-${p.id}`}>Vale desde</label><input id={`pini-${p.id}`} name="inicio" type="date" className="field" defaultValue={ctx.dia} /></div>
                      </div>
                      <p className="text-xs text-ink-mute">Isto não muda o cardápio: é o preço usado nas contas. Para mudar o preço do cardápio, use Preços e custos.</p>
                    </AcaoForm>
                  )}
                </div>
                {historico.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-ink-soft">
                    {historico.map((h) => (
                      <li key={h.id}>
                        {br(h.inicio)}: ingredientes {brl(h.ingredientes)}, embalagem {brl(h.embalagem)}{h.lote ? ` (lote ${brl(h.lote.custo)} ÷ ${h.lote.rendimento})` : ''} · {NOME_ORIGEM[h.origem]} por {h.registradoPor}, conferido por {h.confirmadoPor}{h.nota ? ` · ${h.nota}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

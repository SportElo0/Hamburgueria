import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DONO, requireStoreAccess } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { dayOf, ordersOfDays } from '@/lib/orders';
import { STATUS_LABEL, brl, orderingOf, salesReport, type Order } from '@/lib/ordering';
import { MODOS, SITUACOES, escolha, filtrarPedidos, situacaoDe, type Modo, type Situacao } from '@/lib/historico';
import { isSlug } from '@/lib/slug';

export const metadata = { title: 'Pedidos e delivery' };

const DIAS_ATRAS = 90;
const somaDias = (day: string, n: number) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const dataLonga = (day: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${day}T12:00:00Z`));
const hora = (iso: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
const fone = (p: string) => (p.length === 11 ? `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}` : p.length === 10 ? `(${p.slice(0, 2)}) ${p.slice(2, 6)}-${p.slice(6)}` : p);

const NOME_MODO: Record<Modo, string> = { todos: 'Todos', entrega: 'Entrega', retirada: 'Retirada', mesa: 'Mesa' };
const NOME_SITUACAO: Record<Situacao, string> = { todos: 'Todos', andamento: 'Em andamento', concluido: 'Concluídos', cancelado: 'Recusados e Pix vencido' };
const PAGAMENTO = { pix: 'Pix', cartao: 'Cartão', dinheiro: 'Dinheiro' } as const;
const COR: Record<Exclude<Situacao, 'todos'>, string> = { andamento: 'bg-accent-soft text-accent', concluido: 'bg-ok/10 text-ok', cancelado: 'bg-line text-ink-mute' };

function canal(o: Order) {
  if (o.mode === 'mesa') return o.table ? `Mesa ${o.table.number}` : 'Mesa';
  return o.mode === 'entrega' ? 'Entrega' : 'Retirada';
}

function pagamento(o: Order) {
  if (o.payment.status === 'na-mesa') return 'Na conta da mesa';
  const forma = PAGAMENTO[o.payment.method];
  if (o.payment.status === 'pago') return `${forma} · pago`;
  if (o.payment.status === 'na-entrega') return `${forma} na entrega${o.payment.changeFor ? ` (troco para ${brl(o.payment.changeFor)})` : ''}`;
  if (o.payment.status === 'devolvido') return `${forma} · devolvido`;
  if (o.payment.status === 'devolver') return `${forma} · a devolver`;
  return `${forma} · pendente`;
}

/** Every order of a day (site, delivery and tables), and how delivery is set up. Owner's login or the team. */
export default async function PedidosDonoPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug, DONO);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const o = orderingOf(draft.data.store);
  const q = await searchParams;
  const hoje = dayOf(new Date());
  const minimo = somaDias(hoje, -DIAS_ATRAS);
  const dia = typeof q.dia === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(q.dia) && q.dia <= hoje && q.dia >= minimo ? q.dia : hoje;
  const modo = escolha(MODOS, q.modo, 'todos');
  const situacao = escolha(SITUACOES, q.situacao, 'todos');
  const [{ orders }] = await ordersOfDays(slug, [dia]);
  const resumo = salesReport([{ day: dia, orders }]);
  const lista = filtrarPedidos(orders, { modo, situacao });
  const link = (mudar: Partial<{ dia: string; modo: Modo; situacao: Situacao }>) => {
    const p = new URLSearchParams({ dia, modo, situacao, ...mudar });
    if (p.get('modo') === 'todos') p.delete('modo');
    if (p.get('situacao') === 'todos') p.delete('situacao');
    if (p.get('dia') === hoje) p.delete('dia');
    const s = p.toString();
    return s ? `?${s}` : '?';
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Pedidos e delivery</h1>
      <p className="mt-1 text-ink-soft">Todos os pedidos do dia: site, entrega, retirada e mesas. Os pedidos que estão chegando agora ficam na Tela da cozinha.</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link href={link({ dia: somaDias(dia, -1) })} className={`btn-ghost min-h-11 ${dia <= minimo ? 'pointer-events-none opacity-40' : ''}`} aria-disabled={dia <= minimo}>
          ← Dia anterior
        </Link>
        <form className="flex items-center gap-2" action="">
          <label htmlFor="ped-dia" className="sr-only">
            Dia
          </label>
          <input id="ped-dia" type="date" name="dia" defaultValue={dia} min={minimo} max={hoje} className="field min-h-11 w-auto" />
          {modo !== 'todos' && <input type="hidden" name="modo" value={modo} />}
          {situacao !== 'todos' && <input type="hidden" name="situacao" value={situacao} />}
          <button type="submit" className="btn-ghost min-h-11">
            Ver dia
          </button>
        </form>
        {dia < hoje && (
          <Link href={link({ dia: somaDias(dia, 1) })} className="btn-ghost min-h-11">
            Próximo dia →
          </Link>
        )}
        {dia !== hoje && (
          <Link href={link({ dia: hoje })} className="btn-ghost min-h-11">
            Hoje
          </Link>
        )}
      </div>
      <p className="mt-3 text-lg font-bold first-letter:uppercase">{dataLonga(dia)}</p>

      <section aria-label="Resumo do dia" className="mt-3 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">Vendas</p>
          <p className="mt-1 text-2xl font-bold whitespace-nowrap tabular-nums">{brl(resumo.revenue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">Pedidos</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{resumo.orders}</p>
        </div>
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">Ticket médio</p>
          <p className="mt-1 text-2xl font-bold whitespace-nowrap tabular-nums">{resumo.orders ? brl(resumo.average) : '–'}</p>
        </div>
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">Recusados</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{resumo.refused}</p>
          {resumo.abandoned > 0 && <p className="mt-1 text-xs text-ink-mute">e {resumo.abandoned} Pix não pago</p>}
        </div>
      </section>
      <p className="mt-2 text-xs text-ink-mute">
        Vendas e pedidos contam o que não foi recusado nem ficou sem pagar, como no relatório. Por canal: entrega {brl(resumo.byMode.entrega.revenue)}, retirada {brl(resumo.byMode.retirada.revenue)}, mesas{' '}
        {brl(resumo.byMode.mesa.revenue)}.
      </p>

      <section className="card mt-4 p-5" aria-labelledby="lista-pedidos">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="lista-pedidos" className="text-lg font-bold">
            Pedidos {lista.length !== orders.length ? `(${lista.length} de ${orders.length})` : `(${orders.length})`}
          </h2>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Canal">
            <span className="mr-1 text-xs font-semibold text-ink-mute uppercase">Canal</span>
            {MODOS.map((m) => (
              <Link key={m} href={link({ modo: m })} aria-current={m === modo ? 'true' : undefined} className={`chip min-h-9 px-3 ${m === modo ? 'bg-ink text-white' : 'bg-line text-ink-soft'}`}>
                {NOME_MODO[m]}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Situação">
            <span className="mr-1 text-xs font-semibold text-ink-mute uppercase">Situação</span>
            {SITUACOES.map((s) => (
              <Link key={s} href={link({ situacao: s })} aria-current={s === situacao ? 'true' : undefined} className={`chip min-h-9 px-3 ${s === situacao ? 'bg-ink text-white' : 'bg-line text-ink-soft'}`}>
                {NOME_SITUACAO[s]}
              </Link>
            ))}
          </div>
        </div>

        {lista.length === 0 ? (
          <p className="mt-4 text-sm text-ink-mute">{orders.length ? 'Nenhum pedido com esse filtro.' : 'Nenhum pedido neste dia.'}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {lista.map((p) => {
              const sit = situacaoDe(p.status);
              return (
                <li key={p.id}>
                  <details className="group py-3">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 [&::-webkit-details-marker]:hidden">
                      <span className="w-12 font-bold tabular-nums">#{p.number}</span>
                      <span className="w-12 text-sm text-ink-mute tabular-nums">{hora(p.createdAt)}</span>
                      <span className="w-24 text-sm font-semibold">{canal(p)}</span>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {p.mode !== 'mesa' && <strong className="mr-2">{p.customer.name}</strong>}
                        <span className="text-ink-mute">{p.lines.map((l) => `${l.quantity}× ${l.name}`).join(', ')}</span>
                      </span>
                      <span className={`chip ${COR[sit]}`}>{STATUS_LABEL[p.status]}</span>
                      <span className="w-24 text-right font-bold tabular-nums">{brl(p.total)}</span>
                    </summary>
                    <div className="mt-3 grid gap-4 rounded-lg bg-paper p-4 text-sm md:grid-cols-2">
                      <div>
                        <p className="font-semibold">Itens</p>
                        <ul className="mt-1 space-y-1">
                          {p.lines.map((l, i) => (
                            <li key={i} className="flex justify-between gap-3">
                              <span>
                                {l.quantity}× {l.name}
                                {l.options.length > 0 && <span className="block text-xs text-ink-mute">{l.options.map((op) => op.label).join(' · ')}</span>}
                                {l.notes && <span className="block text-xs text-ink-mute">Obs.: {l.notes}</span>}
                              </span>
                              <span className="tabular-nums">{brl(l.total)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 space-y-0.5 border-t border-line pt-2 text-ink-soft">
                          {p.deliveryFee > 0 && <p className="flex justify-between"><span>Entrega</span><span className="tabular-nums">{brl(p.deliveryFee)}</span></p>}
                          {p.discount > 0 && <p className="flex justify-between"><span>Desconto{p.coupon ? ` (${p.coupon})` : ''}</span><span className="tabular-nums">− {brl(p.discount)}</span></p>}
                          <p className="flex justify-between font-bold text-ink"><span>Total</span><span className="tabular-nums">{brl(p.total)}</span></p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p><span className="font-semibold">Pagamento:</span> {pagamento(p)}</p>
                        {p.mode !== 'mesa' && (
                          <p>
                            <span className="font-semibold">Cliente:</span> {p.customer.name}
                            {p.customer.phone && <> · <a className="underline" href={`tel:+55${p.customer.phone}`}>{fone(p.customer.phone)}</a></>}
                          </p>
                        )}
                        {p.address && (
                          <p>
                            <span className="font-semibold">Endereço:</span> {p.address.street}
                            {p.address.area && ` · ${p.address.area}`}
                            {p.address.reference && ` · ${p.address.reference}`}
                          </p>
                        )}
                        {p.note && <p><span className="font-semibold">Observação:</span> {p.note}</p>}
                        {p.reason && <p><span className="font-semibold">Motivo:</span> {p.reason}</p>}
                        <div>
                          <p className="font-semibold">Andamento</p>
                          <ol className="mt-1 space-y-0.5 text-ink-soft">
                            {p.history.map((h, i) => (
                              <li key={i} className="tabular-nums">
                                {hora(h.at)} · {STATUS_LABEL[h.status]}
                                {h.by && !['cliente', 'sistema', 'pix'].includes(h.by) ? ` · ${h.by}` : ''}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card mt-4 p-5" aria-labelledby="delivery">
        <h2 id="delivery" className="text-lg font-bold">
          Como está o delivery
        </h2>
        {!o.enabled ? (
          <p className="mt-2 text-sm text-ink-soft">O pedido pelo site está desligado. Fale com a Growlift para ligar.</p>
        ) : (
          <>
            <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-ink-mute">Entrega</dt>
                <dd className="font-semibold">{o.delivery ? 'Ligada' : 'Desligada'}</dd>
              </div>
              <div>
                <dt className="text-ink-mute">Retirada no balcão</dt>
                <dd className="font-semibold">{o.pickup ? 'Ligada' : 'Desligada'}</dd>
              </div>
              <div>
                <dt className="text-ink-mute">Tempo que o cliente vê</dt>
                <dd className="font-semibold">{o.eta || 'Não informado'}</dd>
              </div>
              <div>
                <dt className="text-ink-mute">Pedido mínimo</dt>
                <dd className="font-semibold">{o.minOrder ? `${brl(o.minOrder)} (sem a entrega)` : 'Sem mínimo'}</dd>
              </div>
              <div>
                <dt className="text-ink-mute">Pagamento pelo site</dt>
                <dd className="font-semibold">{[o.pix && 'Pix', o.card && 'Cartão na entrega', o.cash && 'Dinheiro na entrega'].filter(Boolean).join(', ') || 'Nenhum'}</dd>
              </div>
              <div>
                <dt className="text-ink-mute">Cupons ativos</dt>
                <dd className="font-semibold">{o.coupons.filter((c) => c.active).map((c) => c.code).join(', ') || 'Nenhum'}</dd>
              </div>
            </dl>
            {o.delivery && (
              <div className="mt-4">
                <p className="text-sm font-semibold">Bairros e taxas</p>
                {o.areas.length ? (
                  <ul className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    {o.areas.map((a) => (
                      <li key={a.id} className="flex justify-between gap-3 border-b border-line py-1">
                        <span>{a.name}</span>
                        <span className="tabular-nums">{a.fee ? brl(a.fee) : 'Grátis'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-ink-soft">Sem lista de bairros: a loja combina a taxa com o cliente em cada pedido.</p>
                )}
              </div>
            )}
          </>
        )}
        <p className="mt-4 text-xs text-ink-mute">Para mudar taxa, bairros, tempo ou formas de pagamento, peça à Growlift: a mudança vale na hora para todos os clientes do site.</p>
      </section>
    </div>
  );
}

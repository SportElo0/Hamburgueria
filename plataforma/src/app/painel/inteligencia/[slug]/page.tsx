import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { isSlug } from '@/lib/slug';
import { brl } from '@/lib/ordering';
import { intelligenceFor } from '@/lib/inteligencia/dados';
import { isDemo } from '@/lib/inteligencia/demo';
import { MENU_CLASS_HINT, MENU_CLASS_LABEL, MIN_ORDERS_TO_COMPARE, type Analysis, type MenuClass, type ProductRow } from '@/lib/inteligencia/analise';
import { CONFIDENCE_LABEL, DECISION_LABEL } from '@/lib/inteligencia/recomendacoes';
import { DecisionControls } from '@/components/inteligencia/DecisionControls';

export const metadata = { title: 'Inteligência da loja' };

const PERIODS = [30, 60, 90];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const pct = (x: number | null, digits = 0) => (x === null ? '–' : `${(x * 100).toFixed(digits).replace('.', ',')}%`);
const signed = (x: number | null) => (x === null ? 'sem base' : `${x > 0 ? '+' : ''}${pct(x, 1)}`);
const shortDate = (day: string) => {
  const [, m, d] = day.split('-');
  return `${d}/${m}`;
};
const CLASS_ORDER: MenuClass[] = ['estrela', 'cavalo-de-batalha', 'quebra-cabeca', 'abacaxi'];
const CLASS_TONE: Record<MenuClass, string> = {
  estrela: 'bg-ok/10 text-ok',
  'cavalo-de-batalha': 'bg-warn/10 text-warn',
  'quebra-cabeca': 'bg-accent-soft text-accent',
  abacaxi: 'bg-bad/10 text-bad',
};

export default async function InteligenciaLoja({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ dias?: string }> }) {
  await requireUser();
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const { dias } = await searchParams;
  const days = PERIODS.find((p) => String(p) === dias) ?? 30;
  const { analysis: a, recommendations, decisions, costs } = await intelligenceFor(slug, days);
  const demo = isDemo(slug);

  return (
    <div className="space-y-6">
      {demo && (
        <p role="note" className="rounded-lg border border-warn/40 bg-warn/10 px-4 py-2.5 text-sm font-semibold text-warn">
          Demonstração: pedidos, clientes e custos desta loja são fictícios, gerados pelo painel.
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/painel/inteligencia" className="text-sm text-ink-mute hover:text-ink">
            ← Inteligência
          </Link>
          <h1 className="mt-1 text-3xl font-bold">{draft.data.store.name}</h1>
          <p className="mt-1 text-sm text-ink-mute">
            {a.current.from && `${shortDate(a.current.from)} a ${shortDate(a.current.to)}`} · comparado aos {days} dias anteriores
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Período" className="flex rounded-lg border border-line bg-white p-0.5">
            {PERIODS.map((p) => (
              <Link
                key={p}
                href={`?dias=${p}`}
                aria-current={p === days ? 'page' : undefined}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${p === days ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'}`}
              >
                {p} dias
              </Link>
            ))}
          </nav>
          <Link href={`/painel/inteligencia/${slug}/custos`} className="btn-ghost min-h-11">
            Custos
          </Link>
        </div>
      </div>

      {a.current.orders === 0 ? (
        <p className="card px-5 py-10 text-center text-ink-mute">
          Nenhuma venda pelo site neste período. A análise usa só os pedidos que chegam pelo painel.
        </p>
      ) : (
        <>
          <Summary a={a} days={days} />

          <section aria-labelledby="recs" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="recs" className="text-lg font-bold">
                Recomendações para testar
              </h2>
              <p className="text-xs text-ink-mute">Geradas por regras a partir dos números acima. A equipe revisa; nada muda no cardápio sozinho.</p>
            </div>
            {recommendations.length === 0 ? (
              <p className="card p-5 text-sm text-ink-mute">Nada a sugerir com os dados deste período.</p>
            ) : (
              <ol className="grid gap-3 lg:grid-cols-2">
                {recommendations.map((r) => {
                  const d = decisions[r.id] ?? null;
                  return (
                    <li key={r.id} className={`card p-5 ${d?.status === 'descartada' ? 'opacity-60' : ''}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="chip bg-ink/5 text-ink-soft">{CONFIDENCE_LABEL[r.confidence]}</span>
                        {d && <span className="chip bg-ok/10 text-ok">{DECISION_LABEL[d.status]}</span>}
                      </div>
                      <h3 className="mt-2 font-bold">{r.title}</h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
                        {r.evidence.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                      <p className="mt-3 text-sm">
                        <span className="font-semibold">Teste sugerido:</span> {r.suggestion}
                      </p>
                      <p className="mt-1 text-sm text-ink-mute">
                        <span className="font-semibold">Como medir:</span> {r.measure}
                      </p>
                      <DecisionControls slug={slug} id={r.id} decision={d} />
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <Matrix a={a} />
          <Products a={a} />
          <Rhythm a={a} />

          <footer className="space-y-1 text-xs text-ink-mute">
            <p>
              Venda = pedido aceito pela loja e não devolvido. Margem de contribuição = venda do item (com desconto de cupom rateado) − taxa do
              meio de pagamento − custo de insumos e embalagem. Não é lucro: aluguel, equipe, entrega e impostos não entram.
            </p>
            <p>
              Matriz por categoria (método Kasavana &amp; Smith): vende muito = pelo menos 70% da participação média da categoria; margem alta = margem
              por unidade igual ou acima da média da categoria. Itens sem custo ficam de fora.
            </p>
            {costs.updatedAt && (
              <p>
                Custos atualizados em {new Date(costs.updatedAt).toLocaleDateString('pt-BR')} por {costs.updatedBy}.
              </p>
            )}
          </footer>
        </>
      )}
    </div>
  );
}

function Delta({ value, reliable }: { value: number | null; reliable: boolean }) {
  if (value === null) return <span className="text-ink-mute">sem período anterior</span>;
  const tone = !reliable ? 'text-ink-mute' : value > 0.005 ? 'text-ok' : value < -0.005 ? 'text-bad' : 'text-ink-mute';
  return (
    <span className={tone}>
      {signed(value)} vs. antes{!reliable && ' (poucos pedidos para comparar)'}
    </span>
  );
}

function Summary({ a, days }: { a: Analysis; days: number }) {
  const c = a.comparison;
  return (
    <section aria-label="Resumo" className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Faturamento" value={brl(a.current.revenue)} hint={<Delta value={c.revenue} reliable={c.reliable} />} />
        <Stat label="Pedidos" value={String(a.current.orders)} hint={<Delta value={c.orders} reliable={c.reliable} />} />
        <Stat label="Ticket médio" value={brl(a.current.average)} hint={<Delta value={c.average} reliable={c.reliable} />} />
        <Stat
          label="Margem de contribuição"
          value={a.contribution === null ? '–' : brl(a.contribution)}
          hint={<span className="text-ink-mute">{a.contributionRate === null ? 'informe os custos' : `${pct(a.contributionRate)} da venda dos itens com custo`}</span>}
        />
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className={`chip ${a.costCoverage >= 0.8 ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}>Custos cobrem {pct(a.costCoverage)} da receita de itens</span>
        <span className={`chip ${a.feesConfirmed ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}>{a.feesConfirmed ? 'Taxas de pagamento confirmadas' : 'Taxas de pagamento não confirmadas'}</span>
        <span className="chip bg-ink/5 text-ink-soft">
          {a.current.customers} clientes · {a.current.returning} voltaram
        </span>
        {(a.current.refused > 0 || a.current.abandoned > 0 || a.current.refunded > 0) && (
          <span className="chip bg-ink/5 text-ink-soft">
            Fora da conta: {a.current.refused} recusados · {a.current.abandoned} Pix não pagos · {a.current.refunded} devolvidos
          </span>
        )}
        {!c.reliable && a.current.orders > 0 && (
          <span className="chip bg-ink/5 text-ink-soft">Comparação só é confiável com {MIN_ORDERS_TO_COMPARE}+ pedidos em cada período de {days} dias</span>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: React.ReactNode }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs">{hint}</p>
    </div>
  );
}

function Matrix({ a }: { a: Analysis }) {
  if (a.matrix.length === 0) {
    return (
      <section className="card p-5">
        <h2 className="font-bold">Matriz do cardápio</h2>
        <p className="mt-1 text-sm text-ink-mute">Informe o custo de pelo menos dois itens da mesma categoria para montar a matriz.</p>
      </section>
    );
  }
  return (
    <section aria-labelledby="matriz" className="space-y-3">
      <h2 id="matriz" className="text-lg font-bold">
        Matriz do cardápio
      </h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {CLASS_ORDER.map((cls) => {
          const items = a.products.filter((p) => p.menuClass === cls);
          return (
            <div key={cls} className="card p-4">
              <span className={`chip ${CLASS_TONE[cls]}`}>{MENU_CLASS_LABEL[cls]}</span>
              <p className="mt-2 text-xs text-ink-mute">{MENU_CLASS_HINT[cls]}</p>
              {items.length === 0 ? (
                <p className="mt-3 text-sm text-ink-mute">Nenhum item.</p>
              ) : (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {items.map((p) => (
                    <li key={p.productId} className="flex justify-between gap-2">
                      <span className="min-w-0">
                        {p.name} <span className="text-xs text-ink-mute">· {p.category}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-ink-soft">{brl(p.unitContribution ?? 0)}/un</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Products({ a }: { a: Analysis }) {
  const row = (p: ProductRow) => (
    <tr key={p.productId} className="border-t border-line">
      <td className="py-2 pr-3">
        <span className="font-semibold">{p.name}</span>
        <span className="block text-xs text-ink-mute">{p.category}</span>
      </td>
      <td className="py-2 pr-3 text-right tabular-nums">{p.quantity}</td>
      <td className="py-2 pr-3 text-right tabular-nums">{brl(p.revenue)}</td>
      <td className="py-2 pr-3 text-right tabular-nums">{brl(p.averagePrice)}</td>
      <td className="py-2 pr-3 text-right tabular-nums">{p.unitCost === null ? <span className="text-warn">sem custo</span> : brl(p.unitCost)}</td>
      <td className="py-2 pr-3 text-right tabular-nums">{p.unitContribution === null ? '–' : brl(p.unitContribution)}</td>
      <td className="py-2 pr-3 text-right tabular-nums">{pct(p.marginRate)}</td>
      <td className="py-2 text-right">{p.menuClass ? <span className={`chip ${CLASS_TONE[p.menuClass]}`}>{MENU_CLASS_LABEL[p.menuClass]}</span> : '–'}</td>
    </tr>
  );
  return (
    <section aria-labelledby="itens" className="card p-5">
      <h2 id="itens" className="font-bold">
        Itens vendidos
      </h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-mute">
              <th className="pb-2 font-semibold">Item</th>
              <th className="pb-2 text-right font-semibold">Qtd.</th>
              <th className="pb-2 text-right font-semibold">Venda</th>
              <th className="pb-2 text-right font-semibold">Preço médio</th>
              <th className="pb-2 text-right font-semibold">Custo/un</th>
              <th className="pb-2 text-right font-semibold">Margem/un</th>
              <th className="pb-2 text-right font-semibold">Margem %</th>
              <th className="pb-2 text-right font-semibold">Matriz</th>
            </tr>
          </thead>
          <tbody>{a.products.map(row)}</tbody>
        </table>
      </div>
    </section>
  );
}

function Rhythm({ a }: { a: Analysis }) {
  const maxH = Math.max(1, ...a.byHour);
  const maxW = Math.max(1, ...a.byWeekday);
  const hours = a.byHour.map((n, h) => ({ n, h })).filter(({ n }) => n > 0);
  return (
    <section className="grid gap-3 md:grid-cols-2">
      <div className="card p-5">
        <h2 className="font-bold">Pedidos por dia da semana</h2>
        <ul className="mt-3 space-y-1.5">
          {a.byWeekday.map((n, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="w-9 text-ink-mute">{WEEKDAYS[i]}</span>
              <span className="h-2.5 rounded-full bg-ink/70" style={{ width: `${(n / maxW) * 100}%` }} />
              <span className="tabular-nums text-ink-soft">{n}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="card p-5">
        <h2 className="font-bold">Pedidos por horário</h2>
        <ul className="mt-3 space-y-1.5">
          {hours.map(({ n, h }) => (
            <li key={h} className="flex items-center gap-2 text-sm">
              <span className="w-9 text-ink-mute tabular-nums">{String(h).padStart(2, '0')}h</span>
              <span className="h-2.5 rounded-full bg-accent/70" style={{ width: `${(n / maxH) * 100}%` }} />
              <span className="tabular-nums text-ink-soft">{n}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

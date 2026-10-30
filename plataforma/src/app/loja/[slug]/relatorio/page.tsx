import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStoreAccess } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { ordersForDays } from '@/lib/orders';
import { brl, salesReport, type SalesReport } from '@/lib/ordering';
import { isSlug } from '@/lib/slug';

export const metadata = { title: 'Relatório de vendas' };

const PERIODS = [
  { days: 1, label: 'Hoje' },
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
];

const PAYMENT_LABEL = { pix: 'Pix', cartao: 'Cartão', dinheiro: 'Dinheiro' } as const;
const MODE_LABEL = { entrega: 'Entrega', retirada: 'Retirada', mesa: 'Mesa' } as const;
const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : '–');
const shortDay = (day: string) => {
  const [, m, d] = day.split('-');
  return `${d}/${m}`;
};

export default async function ReportPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ dias?: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  await requireStoreAccess(slug);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const { dias } = await searchParams;
  const period = PERIODS.find((p) => String(p.days) === dias) ?? PERIODS[1];
  const r = salesReport(await ordersForDays(slug, period.days));

  return (
    <div className="min-h-dvh pb-16">
      <header className="border-b border-line bg-paper print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">Relatório de vendas</p>
            <h1 className="text-lg font-bold">{draft.data.store.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav aria-label="Período" className="flex rounded-lg border border-line bg-white p-0.5">
              {PERIODS.map((p) => (
                <Link
                  key={p.days}
                  href={`?dias=${p.days}`}
                  aria-current={p === period ? 'page' : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-semibold ${p === period ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'}`}
                >
                  {p.label}
                </Link>
              ))}
            </nav>
            <Link href={`/loja/${slug}`} className="btn-ghost min-h-11">
              Voltar aos pedidos
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 pt-5">
        <section aria-label="Resumo" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Faturamento" value={brl(r.revenue)} hint={r.deliveryFees ? `inclui ${brl(r.deliveryFees)} de entrega` : undefined} />
          <Stat label="Pedidos" value={String(r.orders)} hint={r.refused || r.abandoned ? `${r.refused} recusados · ${r.abandoned} Pix não pagos` : undefined} />
          <Stat label="Ticket médio" value={brl(r.average)} />
          <Stat label="Clientes" value={String(r.customers)} hint={r.customers ? `${r.returning} voltaram a pedir` : undefined} />
        </section>

        {r.orders === 0 ? (
          <p className="card px-5 py-10 text-center text-ink-mute">Nenhuma venda aceita neste período ainda.</p>
        ) : (
          <>
            {r.days.length > 1 && <DaysChart r={r} />}
            <div className="grid gap-4 md:grid-cols-2">
              <section className="card p-5">
                <h2 className="font-bold">Mais vendidos</h2>
                <ol className="mt-3 divide-y divide-line">
                  {r.topItems.map((it, i) => (
                    <li key={it.name + i} className="flex items-baseline justify-between gap-3 py-2 text-[15px]">
                      <span>
                        <span className="mr-2 text-ink-mute tabular-nums">{i + 1}.</span>
                        {it.name}
                      </span>
                      <span className="shrink-0 text-right tabular-nums">
                        <strong>{it.quantity}×</strong> <span className="text-ink-mute">{brl(it.revenue)}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
              <div className="space-y-4">
                <Split title="Forma de pagamento" rows={Object.entries(r.byPayment).map(([k, t]) => ({ label: PAYMENT_LABEL[k as keyof typeof PAYMENT_LABEL], ...t }))} total={r.orders} />
                <Split title="Entrega, retirada ou mesa" rows={Object.entries(r.byMode).map(([k, t]) => ({ label: MODE_LABEL[k as keyof typeof MODE_LABEL], ...t }))} total={r.orders} />
                <HoursChart r={r} />
                <section className="card p-5">
                  <h2 className="font-bold">Cupons</h2>
                  {r.coupons.length ? (
                    <ul className="mt-3 space-y-1.5 text-[15px]">
                      {r.coupons.map((c) => (
                        <li key={c.code} className="flex justify-between gap-3">
                          <span className="font-mono font-semibold">{c.code}</span>
                          <span className="tabular-nums">
                            {c.orders} {c.orders === 1 ? 'pedido' : 'pedidos'} · <span className="text-ink-mute">− {brl(c.discount)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-ink-mute">Nenhum cupom usado no período.</p>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
        <p className="text-xs text-ink-mute">Contam como venda os pedidos aceitos pela loja (em preparo, a caminho, prontos ou entregues). Valores com taxa de entrega e já com desconto de cupom.</p>
      </main>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-[13px] font-semibold text-ink-mute">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}

function Split({ title, rows, total }: { title: string; rows: { label: string; orders: number; revenue: number }[]; total: number }) {
  return (
    <section className="card p-5">
      <h2 className="font-bold">{title}</h2>
      <ul className="mt-3 space-y-2.5">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex justify-between gap-3 text-[15px]">
              <span>{row.label}</span>
              <span className="tabular-nums">
                {row.orders} · {pct(row.orders, total)} <span className="text-ink-mute">· {brl(row.revenue)}</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-line">
              <div className="h-full rounded-full bg-accent" style={{ width: pct(row.orders, total) === '–' ? 0 : pct(row.orders, total) }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DaysChart({ r }: { r: SalesReport }) {
  const max = Math.max(1, ...r.days.map((d) => d.revenue));
  return (
    <section className="card p-5">
      <h2 className="font-bold">Faturamento por dia</h2>
      <ol className="mt-4 flex h-40 items-end gap-1" aria-label="Faturamento por dia">
        {r.days.map((d) => (
          <li key={d.day} className="group relative flex h-full flex-1 flex-col justify-end" title={`${shortDay(d.day)}: ${brl(d.revenue)} em ${d.orders} pedidos`}>
            <span className="sr-only">
              {shortDay(d.day)}: {brl(d.revenue)}, {d.orders} pedidos
            </span>
            <span className="block rounded-t bg-accent/85 group-hover:bg-accent" style={{ height: `${Math.max(d.revenue ? 3 : 0, (d.revenue / max) * 100)}%` }} />
          </li>
        ))}
      </ol>
      <div className="mt-2 flex justify-between text-xs text-ink-mute tabular-nums" aria-hidden="true">
        <span>{shortDay(r.days[0].day)}</span>
        <span>{shortDay(r.days[r.days.length - 1].day)}</span>
      </div>
    </section>
  );
}

function HoursChart({ r }: { r: SalesReport }) {
  const hours = r.byHour.map((n, h) => ({ h, n })).filter((x) => x.n > 0);
  const max = Math.max(1, ...r.byHour);
  const peak = hours.reduce((a, b) => (b.n > a.n ? b : a), hours[0]);
  return (
    <section className="card p-5">
      <h2 className="font-bold">Horários de pico</h2>
      {peak && (
        <p className="mt-1 text-sm text-ink-mute">
          Mais pedidos entre {peak.h}h e {peak.h + 1}h.
        </p>
      )}
      <ul className="mt-3 space-y-1.5">
        {hours.map(({ h, n }) => (
          <li key={h} className="flex items-center gap-3 text-sm tabular-nums">
            <span className="w-10 shrink-0 text-ink-mute">{String(h).padStart(2, '0')}h</span>
            <span className="flex-1">
              <span className="block h-2 rounded-full bg-ink/80" style={{ width: `${(n / max) * 100}%` }} />
            </span>
            <span className="w-6 text-right">{n}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

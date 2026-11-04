import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SALAO, requireStoreAccess } from '@/lib/auth';
import { getDraft } from '@/lib/stores';
import { orderingOf, brl } from '@/lib/ordering';
import { seatingHistory } from '@/lib/mesas';
import { duration, stayStats, RELIABLE, type StayGroup } from '@/lib/salao';
import { isSlug } from '@/lib/slug';
import { MapaBoard } from '@/components/salao/MapaBoard';

export const metadata = { title: 'Mapa do salão' };

const PERIODS = [30, 60, 90];
const TZ = 'America/Sao_Paulo';

export default async function MapaPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ aba?: string; dias?: string }> }) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const user = await requireStoreAccess(slug, SALAO);
  const draft = await getDraft(slug);
  if (!draft) notFound();
  const ordering = orderingOf(draft.data.store);
  const { aba, dias } = await searchParams;
  const tab = aba === 'tempo' ? 'tempo' : 'ao-vivo';
  const days = PERIODS.includes(Number(dias)) ? Number(dias) : 30;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

  return (
    <div className="min-h-dvh pb-16">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">Mapa do salão</p>
            <h1 className="text-lg font-bold">{draft.data.store.name}</h1>
          </div>
          <nav aria-label="Seções" className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-line bg-white p-0.5">
              <Link href="?aba=ao-vivo" aria-current={tab === 'ao-vivo' ? 'page' : undefined} className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === 'ao-vivo' ? 'bg-accent text-white' : 'text-ink-soft'}`}>
                Ao vivo
              </Link>
              <Link href="?aba=tempo" aria-current={tab === 'tempo' ? 'page' : undefined} className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === 'tempo' ? 'bg-accent text-white' : 'text-ink-soft'}`}>
                Tempo nas mesas
              </Link>
            </div>
            <a href={`/movimento/${slug}`} target="_blank" rel="noreferrer" className="btn-ghost min-h-11">
              Como o cliente vê
            </a>
            <Link href={user.funcao === 'garcom' ? `/loja/${slug}/salao` : `/loja/${slug}`} className="btn-ghost min-h-11">
              {user.funcao === 'garcom' ? 'Salão' : 'Pedidos'}
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-5">
        {!ordering.enabled || !ordering.tables.enabled ? (
          <p className="card px-5 py-10 text-center text-ink-mute">O pedido na mesa está desligado. A Growlift liga em Configurar → Pedido na mesa.</p>
        ) : tab === 'ao-vivo' ? (
          <MapaBoard slug={slug} today={today} />
        ) : (
          <Tempo slug={slug} days={days} />
        )}
      </main>
    </div>
  );
}

async function Tempo({ slug, days }: { slug: string; days: number }) {
  const s = stayStats(await seatingHistory(slug, days));
  const diff = s.drinks.count && s.noDrinks.count ? s.drinks.avgMinutes - s.noDrinks.avgMinutes : null;
  return (
    <div className="space-y-4">
      <nav aria-label="Período" className="flex w-fit rounded-lg border border-line bg-white p-0.5">
        {PERIODS.map((p) => (
          <Link key={p} href={`?aba=tempo&dias=${p}`} aria-current={p === days ? 'page' : undefined} className={`rounded-md px-3 py-2 text-sm font-semibold ${p === days ? 'bg-accent text-white' : 'text-ink-soft'}`}>
            {p} dias
          </Link>
        ))}
      </nav>

      {s.count === 0 ? (
        <p className="card px-5 py-10 text-center text-ink-mute">Ainda não há contas fechadas neste período. O tempo começa a contar quando a mesa é aberta (pelo QR ou por &quot;Sentar clientes&quot; no mapa) e termina quando a conta é fechada.</p>
      ) : (
        <>
          {!s.reliable && <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent">Só {s.count} contas no período: com menos de {RELIABLE}, as médias ainda mudam muito.</p>}
          <section aria-label="Resumo" className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Tempo médio na mesa" value={duration(s.avgMinutes)} hint={`metade fica até ${duration(s.median)}`} />
            <Stat label="Mais rápida · mais longa" value={`${duration(s.min)} · ${duration(s.max)}`} />
            <Stat label="Conta média por mesa" value={brl(s.avgTicket)} hint={s.ticketPerPerson ? `${brl(s.ticketPerPerson)} por pessoa` : undefined} />
            <Stat label="Contas analisadas" value={String(s.count)} hint={s.ignored ? `${s.ignored} fora da conta (menos de 5 min ou mais de 6 h)` : undefined} />
          </section>

          <section className="card p-5">
            <h2 className="font-bold">Quem pede drink fica mais?</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Group title="Pediram drink ou bebida" g={s.drinks} />
              <Group title="Não pediram" g={s.noDrinks} />
            </div>
            {diff !== null && (
              <p className="mt-3 text-sm text-ink-soft">
                {diff === 0
                  ? 'As duas ficam o mesmo tempo, em média.'
                  : `Mesas com drink ficam ${duration(Math.abs(diff))} ${diff > 0 ? 'a mais' : 'a menos'}, em média${s.drinks.avgTicket && s.noDrinks.avgTicket ? `, e gastam ${brl(Math.abs(s.drinks.avgTicket - s.noDrinks.avgTicket))} ${s.drinks.avgTicket >= s.noDrinks.avgTicket ? 'a mais' : 'a menos'}` : ''}.`}{' '}
                É uma comparação, não prova que o drink causa a demora.
              </p>
            )}
            <p className="mt-2 text-xs text-ink-mute">Conta só o que foi pedido pelo QR. Quais categorias são bebida: Configurar → Pedido na mesa.</p>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <Table title="Por dia da semana" rows={s.byWeekday.map((d) => ({ label: d.name, g: d }))} />
            <Table title="Por horário de chegada" rows={s.byHour.map((h) => ({ label: `${String(h.hour).padStart(2, '0')}h`, g: h }))} />
            <Table title="Por mesa" rows={s.byTable.map((t) => ({ label: `Mesa ${t.number}`, g: t }))} />
            {s.reserved.count > 0 && <Table title="Com reserva" rows={[{ label: 'Mesas reservadas', g: s.reserved }]} />}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-[13px] font-semibold text-ink-mute">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}

function Group({ title, g }: { title: string; g: StayGroup }) {
  return (
    <div className="rounded-lg border border-line p-4">
      <p className="text-sm font-semibold">{title}</p>
      {g.count ? (
        <p className="mt-1 text-2xl font-bold tabular-nums">
          {duration(g.avgMinutes)} <span className="text-sm font-semibold text-ink-mute">· {brl(g.avgTicket)} · {g.count} mesas</span>
        </p>
      ) : (
        <p className="mt-1 text-sm text-ink-mute">Nenhuma mesa ainda.</p>
      )}
    </div>
  );
}

function Table({ title, rows }: { title: string; rows: { label: string; g: StayGroup }[] }) {
  return (
    <section className="card p-5">
      <h2 className="font-bold">{title}</h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-ink-mute">
            <th className="py-1 font-semibold"> </th>
            <th className="py-1 text-right font-semibold">Tempo médio</th>
            <th className="py-1 text-right font-semibold">Conta média</th>
            <th className="py-1 text-right font-semibold">Mesas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="py-1.5">{r.label}</td>
              <td className="py-1.5 text-right tabular-nums">{duration(r.g.avgMinutes)}</td>
              <td className="py-1.5 text-right tabular-nums">{brl(r.g.avgTicket)}</td>
              <td className="py-1.5 text-right tabular-nums">{r.g.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

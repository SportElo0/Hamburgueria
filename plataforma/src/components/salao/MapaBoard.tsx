'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { MapForStaff } from '@/app/api/loja/[slug]/mapa/route';
import { addToQueueAction, freeTableAction, queueAction, refundDoneAction, reservationAction, seatAction } from '@/app/loja/[slug]/actions';
import { RESERVATION_LABEL } from '@/lib/reservas-labels';
import { brl } from '@/lib/ordering';
import { duration } from '@/lib/salao';
import { SalaoDesenho, type DesenhoMesa, type DesenhoState } from './SalaoDesenho';

const POLL_MS = 5000;
type Table = MapForStaff['tables'][number];
type Booking = MapForStaff['bookings'][number];
type QueueItem = MapForStaff['queue'][number];

const minutesSince = (iso: string, now: number) => Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
const startOf = (b: Booking) => Date.parse(`${b.date}T${b.time}:00-03:00`);
const fone = (p: string) => (p.length === 11 ? `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}` : `(${p.slice(0, 2)}) ${p.slice(2, 6)}-${p.slice(6)}`);

function stateOf(t: Table | undefined): DesenhoState {
  if (!t) return 'livre';
  if (!t.confirmed) return 'aguardando';
  if (t.calls.includes('conta')) return 'conta';
  return 'ocupada';
}

export function MapaBoard({ slug, today }: { slug: string; today: string }) {
  const router = useRouter();
  const [data, setData] = useState<MapForStaff | null>(null);
  const [date, setDate] = useState(today);
  const [selected, setSelected] = useState<number | null>(null);
  const [arriving, setArriving] = useState<Booking | null>(null);
  const [seatingQueue, setSeatingQueue] = useState<QueueItem | null>(null);
  const [people, setPeople] = useState(2);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/loja/${slug}/mapa?data=${date}`, { cache: 'no-store' });
      if (res.status === 401) return router.push(`/login?volta=/loja/${slug}/mapa`);
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as MapForStaff);
    } catch {
      setError('Sem conexão. Tentando de novo…');
    }
  }, [slug, date, router]);

  useEffect(() => {
    const first = window.setTimeout(load, 0);
    const t = window.setInterval(() => document.visibilityState === 'visible' && load(), POLL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [load]);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    startTransition(async () => {
      setError('');
      const res = await fn();
      if (!res.ok) setError(res.error ?? 'Não foi possível.');
      else after?.();
      await load();
    });

  if (!data) return <p className="px-4 pt-10 text-center text-ink-mute">{error || 'Carregando o mapa…'}</p>;

  const now = Date.parse(data.now);
  const byNumber = new Map(data.tables.map((t) => [t.number, t]));
  const spots: DesenhoMesa[] = data.layout.map((s) => {
    const t = byNumber.get(s.number);
    return { ...s, state: stateOf(t), note: t ? duration(minutesSince(t.openedAt, now)) : undefined };
  });
  const seated = data.tables.length;
  const peopleNow = data.tables.reduce((n, t) => n + (t.people ?? 0), 0);
  const table = selected ? byNumber.get(selected) : undefined;
  const isToday = date === today;

  const pick = (n: number) => {
    if (seatingQueue) {
      if (byNumber.has(n)) return setError(`A mesa ${n} está ocupada. Escolha uma livre.`);
      const q = seatingQueue;
      return run(() => queueAction(slug, q.id, 'sentou', n, q.people), () => {
        setSeatingQueue(null);
        setSelected(n);
      });
    }
    if (arriving) {
      if (byNumber.has(n)) return setError(`A mesa ${n} está ocupada. Escolha uma livre.`);
      const b = arriving;
      return run(() => reservationAction(slug, b.id, 'chegou', n), () => {
        setArriving(null);
        setSelected(n);
      });
    }
    setSelected(n === selected ? null : n);
  };

  return (
    <div className="space-y-5">
      <section aria-label="Resumo" className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">Ocupadas</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {seated}
            <span className="text-base text-ink-mute"> de {data.count}</span>
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">Livres</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{Math.max(0, data.count - seated)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">Pessoas anotadas</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{peopleNow}</p>
        </div>
      </section>

      {seatingQueue && (
        <p role="status" className="rounded-xl bg-accent-soft px-4 py-3 text-sm font-semibold text-accent">
          Toque numa mesa livre para sentar {seatingQueue.name} ({seatingQueue.people} {seatingQueue.people === 1 ? 'pessoa' : 'pessoas'}), da fila.{' '}
          <button type="button" className="underline" onClick={() => setSeatingQueue(null)}>
            Cancelar
          </button>
        </p>
      )}
      {arriving && (
        <p role="status" className="rounded-xl bg-accent-soft px-4 py-3 text-sm font-semibold text-accent">
          Toque numa mesa livre para sentar a reserva de {arriving.name} ({arriving.people} {arriving.people === 1 ? 'pessoa' : 'pessoas'}).{' '}
          <button type="button" className="underline" onClick={() => setArriving(null)}>
            Cancelar
          </button>
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {error}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <section className="space-y-3">
          <div className="card overflow-hidden p-3 sm:p-4">
            <SalaoDesenho label="Mapa do salão: toque numa mesa" mesas={spots} onSelect={pick} selected={selected} />
          </div>
          <p className="text-xs text-ink-mute">Toque numa mesa para sentar clientes ou liberar. O site do restaurante mostra a mudança em poucos segundos.</p>
        </section>

        <aside className="space-y-4">
          {selected !== null && !arriving && !seatingQueue && (
            <section className="card space-y-3 p-4" aria-labelledby="mesa-sel">
              <h2 id="mesa-sel" className="text-lg font-bold">
                Mesa {selected}
              </h2>
              {table ? (
                <>
                  <dl className="grid grid-cols-2 gap-y-1 text-sm">
                    <dt className="text-ink-mute">Sentou</dt>
                    <dd className="tabular-nums">
                      {new Date(table.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })} · há {duration(minutesSince(table.openedAt, now))}
                    </dd>
                    <dt className="text-ink-mute">Pessoas</dt>
                    <dd>{table.people ?? 'não anotado'}</dd>
                    <dt className="text-ink-mute">Pedidos pelo QR</dt>
                    <dd className="tabular-nums">
                      {table.orders} · {brl(table.total)}
                    </dd>
                    {table.credit > 0 && (
                      <>
                        <dt className="text-ink-mute">Sinal da reserva</dt>
                        <dd className="tabular-nums">− {brl(table.credit)}</dd>
                        <dt className="font-semibold">{table.total >= table.credit ? 'Falta pagar' : 'Devolver ao cliente'}</dt>
                        <dd className="font-semibold tabular-nums">{brl(Math.abs(table.total - table.credit))}</dd>
                      </>
                    )}
                  </dl>
                  <PeopleEditor key={`ocupada-${selected}`} value={table.people ?? people} disabled={pending} onSave={(n) => run(() => seatAction(slug, selected, n))} label="Atualizar pessoas" />
                  {table.orders === 0 ? (
                    <button type="button" className="btn-ghost w-full" disabled={pending} onClick={() => run(() => freeTableAction(slug, selected), () => setSelected(null))}>
                      Liberar mesa
                    </button>
                  ) : (
                    <a href={`/loja/${slug}/salao`} className="btn-ghost w-full">
                      Fechar a conta no salão
                    </a>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-ink-soft">Livre. Ao sentar clientes, toque abaixo: o tempo começa a contar e entra na análise de permanência.</p>
                  <PeopleEditor key={`livre-${selected}`} value={people} disabled={pending} onSave={(n) => run(() => seatAction(slug, selected, n), () => setPeople(2))} onChange={setPeople} label="Sentar clientes aqui" />
                </>
              )}
            </section>
          )}

          {data.refunds.length > 0 && (
            <section className="card space-y-2 border-bad/40 p-4" aria-label="Devolver no caixa">
              <h2 className="text-base font-bold text-bad">Devolver no caixa</h2>
              <p className="text-sm text-ink-soft">O Mercado Pago não devolveu sozinho estes Pix pagos a mais. Devolva ao cliente e marque.</p>
              <ul className="divide-y divide-line text-sm">
                {data.refunds.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                    <span>
                      {r.table ? `Mesa ${r.table}` : 'Mesa já fechada'} · <strong>{brl(r.amount)}</strong>
                    </span>
                    <button type="button" className="btn-ghost min-h-10" disabled={pending} onClick={() => run(() => refundDoneAction(slug, r.id))}>
                      Já devolvi
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {data.queueOn && <Fila slug={slug} store={data.storeName} queue={data.queue} now={now} pending={pending} run={run} onSeat={(q) => (setSeatingQueue(q), setArriving(null), setSelected(null))} />}

          <section className="card space-y-3 p-4" aria-labelledby="reservas-titulo">
            <div className="flex items-center justify-between gap-2">
              <h2 id="reservas-titulo" className="text-lg font-bold">
                Reservas
              </h2>
              <input type="date" className="field w-auto" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Dia das reservas" />
            </div>
            {!data.reservationsOn && <p className="text-sm text-ink-mute">Reservas pelo site desligadas. A Growlift liga em Configurar.</p>}
            {data.bookings.length === 0 ? (
              <p className="text-sm text-ink-mute">Nenhuma reserva neste dia.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.bookings.map((b) => {
                  const late = now > startOf(b) + b.toleranceMinutes * 60_000;
                  return (
                    <li key={b.id} className="space-y-2 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">
                            <span className="tabular-nums">{b.time}</span> · {b.name}
                          </p>
                          <p className="text-sm text-ink-mute">
                            {b.people} {b.people === 1 ? 'pessoa' : 'pessoas'}
                            {b.deposit > 0 && ` · sinal ${brl(b.deposit)} ${b.refunded ? '(devolvido)' : b.demo ? '(teste, nada cobrado)' : b.paid ? '(pago)' : '(não pago)'}`}
                            {b.table && ` · mesa ${b.table}`}
                          </p>
                          <a className="text-sm text-accent underline" href={`tel:+55${b.phone}`}>
                            {fone(b.phone)}
                          </a>
                        </div>
                        <span className={`chip ${b.status === 'confirmada' ? 'bg-ok/10 text-ok' : b.status === 'chegou' ? 'bg-accent-soft text-accent' : 'bg-line text-ink-mute'}`}>{RESERVATION_LABEL[b.status]}</span>
                      </div>
                      {b.status === 'confirmada' && isToday && (
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="btn-primary min-h-10" disabled={pending} onClick={() => (setArriving(b), setSelected(null))}>
                            Chegou
                          </button>
                          <button type="button" className="btn-ghost min-h-10" disabled={pending || !late} onClick={() => run(() => reservationAction(slug, b.id, 'nao-veio'))} title={late ? '' : `Libera depois de ${b.toleranceMinutes} min do horário`}>
                            Não veio
                          </button>
                          <CancelButton disabled={pending} paid={b.paid} deposit={b.deposit} onConfirm={() => run(() => reservationAction(slug, b.id, 'cancelar'))} />
                        </div>
                      )}
                      {b.status === 'confirmada' && !isToday && <CancelButton disabled={pending} paid={b.paid} deposit={b.deposit} onConfirm={() => run(() => reservationAction(slug, b.id, 'cancelar'))} />}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function PeopleEditor({ value, onSave, onChange, disabled, label }: { value: number; onSave: (n: number) => void; onChange?: (n: number) => void; disabled: boolean; label: string }) {
  const [n, setN] = useState(value);
  const set = (v: number) => {
    const next = Math.min(40, Math.max(1, v));
    setN(next);
    onChange?.(next);
  };
  return (
    <div className="flex items-center gap-2">
      <button type="button" className="btn-ghost min-h-11 w-11" onClick={() => set(n - 1)} aria-label="Menos uma pessoa">
        −
      </button>
      <span className="w-10 text-center text-lg font-bold tabular-nums" aria-live="polite">
        {n}
      </span>
      <button type="button" className="btn-ghost min-h-11 w-11" onClick={() => set(n + 1)} aria-label="Mais uma pessoa">
        +
      </button>
      <button type="button" className="btn-primary min-h-11 flex-1" disabled={disabled} onClick={() => onSave(n)}>
        {label}
      </button>
    </div>
  );
}

function CancelButton({ onConfirm, disabled, paid, deposit }: { onConfirm: () => void; disabled: boolean; paid: boolean; deposit: number }) {
  const [asking, setAsking] = useState(false);
  if (!asking)
    return (
      <button type="button" className="btn-danger min-h-10" disabled={disabled} onClick={() => setAsking(true)}>
        Cancelar
      </button>
    );
  return (
    <span className="flex flex-wrap items-center gap-2 text-sm">
      {paid && deposit > 0 ? `Devolve ${brl(deposit)} ao cliente.` : 'Cancelar a reserva?'}
      <button type="button" className="btn-danger min-h-10" disabled={disabled} onClick={onConfirm}>
        Confirmar
      </button>
      <button type="button" className="btn-ghost min-h-10" onClick={() => setAsking(false)}>
        Voltar
      </button>
    </span>
  );
}

function Fila({
  slug,
  store,
  queue,
  now,
  pending,
  run,
  onSeat,
}: {
  slug: string;
  store: string;
  queue: QueueItem[];
  now: number;
  pending: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => void;
  onSeat: (q: QueueItem) => void;
}) {
  const [name, setName] = useState('');
  const [people, setPeople] = useState(2);
  const wa = (q: QueueItem) => `https://wa.me/55${q.phone}?text=${encodeURIComponent(`Olá, ${q.name}! Sua mesa no ${store} está pronta. Pode vir até a recepção.`)}`;
  return (
    <section className="card space-y-3 p-4" aria-labelledby="fila-titulo">
      <div className="flex items-center justify-between gap-2">
        <h2 id="fila-titulo" className="text-lg font-bold">
          Fila <span className="text-ink-mute tabular-nums">· {queue.length}</span>
        </h2>
        <a href={`/loja/${slug}/fila`} className="text-sm font-semibold text-accent underline">
          QR da porta
        </a>
      </div>
      {queue.length === 0 ? (
        <p className="text-sm text-ink-mute">Ninguém esperando.</p>
      ) : (
        <ol className="divide-y divide-line">
          {queue.map((q, i) => (
            <li key={q.id} className="space-y-2 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">
                  <span className="text-ink-mute tabular-nums">{i + 1}º</span> {q.name} · {q.people} {q.people === 1 ? 'pessoa' : 'pessoas'}
                </p>
                <span className={`chip ${q.status === 'chamado' ? 'bg-ok/10 text-ok' : 'bg-line text-ink-mute'}`}>
                  {q.status === 'chamado' ? `Chamado há ${minutesSince(q.calledAt!, now)} min` : `${minutesSince(q.createdAt, now)} min`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {q.status === 'aguardando' ? (
                  <button type="button" className="btn-primary min-h-10" disabled={pending} onClick={() => run(() => queueAction(slug, q.id, 'chamar'))}>
                    Chamar
                  </button>
                ) : (
                  <button type="button" className="btn-ghost min-h-10" disabled={pending} onClick={() => run(() => queueAction(slug, q.id, 'voltar'))}>
                    Desfazer chamada
                  </button>
                )}
                <button type="button" className="btn-ghost min-h-10" disabled={pending} onClick={() => onSeat(q)}>
                  Sentou
                </button>
                <button type="button" className="btn-ghost min-h-10" disabled={pending} onClick={() => run(() => queueAction(slug, q.id, 'nao-veio'))}>
                  Não veio
                </button>
                {q.status === 'chamado' && q.phone && (
                  <a href={wa(q)} target="_blank" rel="noreferrer" className="btn min-h-10 border border-ok/40 bg-ok/5 text-ok">
                    Avisar no WhatsApp
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      <form
        className="flex flex-wrap items-end gap-2 border-t border-line pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          run(() => addToQueueAction(slug, name, people), () => (setName(''), setPeople(2)));
        }}
      >
        <label className="min-w-0 flex-1">
          <span className="label">Chegou sem o QR</span>
          <input className="field" placeholder="Nome" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="w-20">
          <span className="label">Pessoas</span>
          <input className="field tabular-nums" inputMode="numeric" value={people} onChange={(e) => setPeople(Math.max(1, Math.min(30, Number(e.target.value.replace(/\D/g, '')) || 1)))} />
        </label>
        <button type="submit" className="btn-ghost min-h-10" disabled={pending || !name.trim()}>
          Pôr na fila
        </button>
      </form>
    </section>
  );
}

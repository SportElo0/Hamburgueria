'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { FloorForStaff } from '@/app/api/loja/[slug]/salao/route';
import { orderAction, tableAction, type TableAction } from '@/app/loja/[slug]/actions';
import { STATUS_LABEL, brl, type PaymentMethod } from '@/lib/ordering';
import { useBell } from '@/components/orders/OrdersBoard';

/**
 * The waiter's floor screen, made for a phone in one hand: what needs the waiter now (a table to
 * confirm, a call, a bill, food ready to take) on top, every table below, and one sheet per table.
 */

type Table = FloorForStaff[number];
const POLL_MS = 5000;
const RING_MS = 10000;

const ago = (iso: string, now: number) => {
  const min = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
  return min < 1 ? 'agora' : `há ${min} min`;
};
const items = (t: Table, status?: string) =>
  t.orders
    .filter((o) => !status || o.status === status)
    .flatMap((o) => o.lines.map((l) => `${l.quantity}× ${l.name}`))
    .join(', ');

interface Alert {
  key: string;
  table: number;
  tone: 'accent' | 'warn' | 'ok';
  title: string;
  detail: string;
  primary: { label: string; run: () => void };
  secondary?: { label: string; run: () => void };
}

export function SalaoBoard(props: { slug: string; storeName: string; count: number; enabled: boolean }) {
  const [tables, setTables] = useState<FloorForStaff | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const bell = useBell();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/loja/${props.slug}/salao`, { cache: 'no-store' });
      if (res.status === 401) return router.push(`/login?volta=/loja/${props.slug}/salao`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { tables: FloorForStaff; now: string };
      setTables(data.tables);
      setNow(Date.parse(data.now));
      setError('');
    } catch {
      setError('Sem conexão. Tentando de novo…');
    }
  }, [props.slug, router]);

  useEffect(() => {
    const first = window.setTimeout(load, 0);
    const t = window.setInterval(load, POLL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [load]);

  const run = (number: number, action: TableAction, method?: PaymentMethod) =>
    startTransition(async () => {
      const res = await tableAction(props.slug, number, action, method);
      if (!res.ok) setError(res.error ?? 'Não foi possível atualizar.');
      await load();
    });
  const delivered = (orderId: string) =>
    startTransition(async () => {
      const res = await orderAction(props.slug, orderId, 'concluir');
      if (!res.ok) setError(res.error ?? 'Não foi possível atualizar.');
      await load();
    });

  const byNumber = useMemo(() => new Map((tables ?? []).map((t) => [t.number, t])), [tables]);

  const alerts: Alert[] = useMemo(() => {
    const out: Alert[] = [];
    for (const t of tables ?? []) {
      const waiting = t.orders.filter((o) => o.status === 'aguardando-garcom');
      // Also after confirming: an order sent while the waiter was confirming still waits here.
      if (waiting.length) {
        out.push({
          key: `c${t.number}`,
          table: t.number,
          tone: 'accent',
          title: `Mesa ${t.number} · 1º pedido`,
          detail: `${items(t, 'aguardando-garcom')}. Confira se tem gente sentada na mesa.`,
          primary: { label: 'Confirmar mesa', run: () => run(t.number, 'confirmar') },
          secondary: t.confirmed ? undefined : { label: 'Não tem ninguém', run: () => run(t.number, 'dispensar') },
        });
      }
      for (const c of t.calls) {
        if (c.kind === 'garcom') {
          out.push({ key: `g${t.number}`, table: t.number, tone: 'warn', title: `Mesa ${t.number} chamou`, detail: ago(c.at, now), primary: { label: 'Estou indo', run: () => run(t.number, 'atender-garcom') } });
        } else {
          out.push({ key: `b${t.number}`, table: t.number, tone: 'ok', title: `Mesa ${t.number} pediu a conta`, detail: `${brl(t.total)} · ${ago(c.at, now)}`, primary: { label: 'Fechar a conta', run: () => setOpen(t.number) } });
        }
      }
      for (const o of t.orders.filter((x) => x.status === 'pronto')) {
        out.push({
          key: `p${o.id}`,
          table: t.number,
          tone: 'ok',
          title: `Mesa ${t.number}: pronto para levar`,
          detail: o.lines.map((l) => `${l.quantity}× ${l.name}`).join(', '),
          primary: { label: 'Entreguei', run: () => delivered(o.id) },
        });
      }
    }
    return out;
    // `run` and `delivered` only close over stable values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables, now]);

  // Rings while something waits for the waiter (a table to confirm or a call), like the kitchen bell.
  const urgent = alerts.filter((a) => a.tone !== 'ok' || a.key.startsWith('b')).length;
  useEffect(() => {
    document.title = urgent ? `(${urgent}) Salão · ${props.storeName}` : `Salão · ${props.storeName}`;
    if (!urgent || !bell.armed) return;
    bell.ring();
    const t = window.setInterval(bell.ring, RING_MS);
    return () => window.clearInterval(t);
  }, [urgent, bell, props.storeName]);

  const selected = open !== null ? byNumber.get(open) : undefined;

  return (
    <div className="min-h-dvh bg-paper pb-10" onPointerDown={bell.armed ? undefined : bell.arm}>
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold">Salão</h1>
            <p className="truncate text-[13px] text-ink-mute">{props.storeName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={bell.arm} className={`btn min-h-11 border px-3 ${bell.armed ? 'border-line bg-white text-ink-mute' : 'border-warn bg-warn text-white'}`}>
              {bell.armed ? 'Som ligado' : 'Ligar som'}
            </button>
            <a href={`/loja/${props.slug}`} className="btn-ghost min-h-11 px-3">
              Cozinha
            </a>
          </div>
        </div>
        {error && <p className="mx-auto mt-2 max-w-3xl rounded-lg bg-bad px-3 py-2 text-sm font-semibold text-white">{error}</p>}
        {!props.enabled && <p className="mx-auto mt-2 max-w-3xl rounded-lg bg-warn px-3 py-2 text-sm font-semibold text-white">O pedido pela mesa está desligado. A equipe liga em Configurar › Pedidos online.</p>}
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 pt-4">
        <section aria-labelledby="agora">
          <h2 id="agora" className="mb-2 text-xs font-extrabold tracking-[0.1em] text-ink-mute uppercase">
            Agora {alerts.length > 0 && <span className="chip ml-1 bg-ink text-white">{alerts.length}</span>}
          </h2>
          {tables === null ? (
            <p className="card p-4 text-sm text-ink-mute">Carregando…</p>
          ) : alerts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-mute">Nada esperando por você. Chamadas e pedidos novos aparecem aqui e tocam um alerta.</p>
          ) : (
            <ul className="space-y-2.5">
              {alerts.map((a) => (
                <li
                  key={a.key}
                  className={`rounded-2xl border-2 bg-white p-4 ${a.tone === 'accent' ? 'border-accent' : a.tone === 'warn' ? 'border-warn' : 'border-ok'}`}
                >
                  <p className="text-base font-extrabold">{a.title}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">{a.detail}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={a.primary.run}
                      className={`btn min-h-12 flex-1 text-[15px] text-white ${a.tone === 'accent' ? 'bg-accent' : a.tone === 'warn' ? 'bg-warn' : 'bg-ok'}`}
                    >
                      {a.primary.label}
                    </button>
                    {a.secondary && (
                      <button type="button" disabled={pending} onClick={a.secondary.run} className="btn-ghost min-h-12 px-4">
                        {a.secondary.label}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="mesas">
          <h2 id="mesas" className="mb-2 text-xs font-extrabold tracking-[0.1em] text-ink-mute uppercase">
            Mesas
          </h2>
          <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
            {Array.from({ length: props.count }, (_, i) => i + 1).map((n) => {
              const t = byNumber.get(n);
              const state = !t
                ? { label: 'Livre', cls: 'border-line bg-white text-ink-mute' }
                : t.orders.some((o) => o.status === 'aguardando-garcom')
                  ? { label: 'Confirmar', cls: 'border-accent bg-accent-soft text-accent' }
                  : t.calls.some((c) => c.kind === 'conta')
                    ? { label: 'Conta', cls: 'border-ok bg-ok/10 text-ok' }
                    : t.calls.some((c) => c.kind === 'garcom')
                      ? { label: 'Chamou', cls: 'border-warn bg-warn/10 text-warn' }
                      : { label: t.confirmed ? 'Ocupada' : 'Abriu agora', cls: 'border-ink/30 bg-white text-ink' };
              return (
                <li key={n}>
                  <button type="button" disabled={!t} onClick={() => setOpen(n)} className={`flex h-[88px] w-full flex-col justify-between rounded-2xl border-2 p-2.5 text-left disabled:cursor-default ${state.cls}`}>
                    <span className="text-lg leading-none font-extrabold text-ink">{n}</span>
                    <span className="text-xs leading-tight font-bold">
                      {state.label}
                      {t && t.total > 0 && <span className="block font-semibold text-ink-soft tabular-nums">{brl(t.total)}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        <p className="text-xs text-ink-mute">
          Deixe esta tela aberta no celular durante o serviço; ela se atualiza sozinha.{' '}
          <a href={`/loja/${props.slug}/mesas`} className="font-semibold text-accent underline">
            QR Codes das mesas
          </a>
        </p>
      </main>

      {selected && <TableSheet table={selected} now={now} pending={pending} onClose={() => setOpen(null)} onRun={(a, m) => run(selected.number, a, m)} />}
    </div>
  );
}

function TableSheet({ table: t, now, pending, onClose, onRun }: { table: Table; now: number; pending: boolean; onClose: () => void; onRun: (a: TableAction, m?: PaymentMethod) => void }) {
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50 sm:items-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="mesa-titulo" className="flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 pt-4 pb-3">
          <div>
            <h2 id="mesa-titulo" className="text-2xl font-extrabold">
              Mesa {t.number}
            </h2>
            <p className="text-sm text-ink-mute">
              Código <strong className="tracking-[0.15em] text-ink">{t.code}</strong> · {t.devices} {t.devices === 1 ? 'celular' : 'celulares'} · aberta {ago(t.openedAt, now)}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="btn-ghost h-11 w-11 shrink-0 p-0 text-xl">
            ×
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {t.orders.length === 0 && <p className="text-sm text-ink-mute">Nenhum pedido ainda.</p>}
          {t.orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <strong>#{o.number}</strong>
                <span className={`chip ${o.status === 'recusado' ? 'bg-bad/10 text-bad' : o.status === 'aguardando-garcom' ? 'bg-accent-soft text-accent' : 'bg-line text-ink'}`}>{STATUS_LABEL[o.status]}</span>
              </div>
              <ul className={`mt-1.5 space-y-0.5 text-sm ${o.status === 'recusado' ? 'line-through opacity-60' : ''}`}>
                {o.lines.map((l, i) => (
                  <li key={i} className="flex justify-between gap-3 tabular-nums">
                    <span>
                      {l.quantity}× {l.name}
                    </span>
                    <span>{brl(l.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="flex justify-between pt-1 text-lg font-extrabold tabular-nums">
            <span>Total</span>
            <span>{brl(t.total)}</span>
          </p>
        </div>

        <div className="space-y-2 border-t border-line px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
          {!t.confirmed ? (
            <div className="flex gap-2">
              <button type="button" disabled={pending} onClick={() => onRun('confirmar')} className="btn min-h-12 flex-1 bg-accent text-[15px] text-white">
                Confirmar mesa
              </button>
              <button type="button" disabled={pending} onClick={() => (onRun('dispensar'), onClose())} className="btn-ghost min-h-12 px-4">
                Não tem ninguém
              </button>
            </div>
          ) : closing ? (
            <>
              <p className="text-sm font-semibold">Como a mesa pagou {brl(t.total)}?</p>
              <div className="grid grid-cols-3 gap-2">
                {(['pix', 'cartao', 'dinheiro'] as const).map((m) => (
                  <button key={m} type="button" disabled={pending} onClick={() => (onRun('fechar', m), onClose())} className="btn min-h-12 bg-ok text-[15px] text-white">
                    {m === 'pix' ? 'Pix' : m === 'cartao' ? 'Cartão' : 'Dinheiro'}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setClosing(false)} className="btn-ghost min-h-11 w-full">
                Voltar
              </button>
            </>
          ) : (
            <button type="button" disabled={pending} onClick={() => setClosing(true)} className="btn min-h-12 w-full bg-ink text-[15px] text-white">
              Fechar a conta e liberar a mesa
            </button>
          )}
          <p className="text-xs text-ink-mute">Ao fechar, o código {t.code} deixa de valer e a mesa fica livre.</p>
        </div>
      </div>
    </div>
  );
}

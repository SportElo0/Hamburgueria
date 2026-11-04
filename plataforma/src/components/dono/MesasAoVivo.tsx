'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { FloorForStaff } from '@/app/api/loja/[slug]/salao/route';
import { tableAction } from '@/app/loja/[slug]/actions';
import { brl } from '@/lib/ordering';

type Mesa = FloorForStaff[number];
const POLL_MS = 8000;
const min = (iso: string, now: number) => Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
const tempo = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`);

/** The owner's live view of the floor, for a computer: every table at a glance, calls on top. */
export function MesasAoVivo({ slug, count }: { slug: string; count: number }) {
  const [mesas, setMesas] = useState<FloorForStaff | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [erro, setErro] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/loja/${slug}/salao`, { cache: 'no-store' });
      if (res.status === 401) return router.push(`/login?volta=/loja/${slug}/dono/mesas`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { tables: FloorForStaff; now: string };
      setMesas(data.tables);
      setNow(Date.parse(data.now));
      setErro('');
    } catch {
      setErro('Sem conexão. Tentando de novo…');
    }
  }, [slug, router]);

  useEffect(() => {
    const first = window.setTimeout(load, 0);
    const t = window.setInterval(load, POLL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [load]);

  const atender = (n: number, tipo: 'garcom' | 'conta') =>
    start(async () => {
      const r = await tableAction(slug, n, tipo === 'garcom' ? 'atender-garcom' : 'atender-conta');
      if (!r.ok) setErro(r.error ?? 'Não foi possível atualizar.');
      await load();
    });

  if (!mesas) return <p className="mt-6 text-ink-mute">{erro || 'Carregando as mesas…'}</p>;

  const byNumber = new Map(mesas.map((m) => [m.number, m]));
  const chamados = mesas
    .flatMap((m) => m.calls.map((c) => ({ mesa: m.number, tipo: c.kind, desde: c.at })))
    .sort((a, b) => a.desde.localeCompare(b.desde));
  const emAberto = mesas.reduce((n, m) => n + m.total, 0);
  const pessoas = mesas.reduce((n, m) => n + (m.people ?? 0), 0);
  const numbers = Array.from({ length: Math.max(count, ...mesas.map((m) => m.number)) }, (_, i) => i + 1);

  return (
    <div className="mt-6">
      {erro && (
        <p role="alert" className="mb-4 rounded-lg bg-bad px-3 py-2 text-sm font-semibold text-white">
          {erro}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">Mesas ocupadas</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">
            {mesas.length} <span className="text-base font-semibold text-ink-mute">de {numbers.length}</span>
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">Pessoas sentadas</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{pessoas || '—'}</p>
          <p className="text-xs text-ink-mute">quando o garçom informa</p>
        </div>
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">Consumo nas mesas abertas</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{brl(emAberto)}</p>
        </div>
        <div className={`card p-4 ${chamados.length ? 'border-bad' : ''}`}>
          <p className="text-[13px] font-semibold text-ink-mute">Chamando agora</p>
          <p className={`mt-1 text-2xl font-extrabold tabular-nums ${chamados.length ? 'text-bad' : ''}`}>{chamados.length}</p>
        </div>
      </div>

      {chamados.length > 0 && (
        <section aria-labelledby="chamados" className="card mt-4 border-bad p-5">
          <h2 id="chamados" className="text-[17px] font-bold">
            Chamados de garçom
          </h2>
          <ul className="mt-2 divide-y divide-line">
            {chamados.map((c) => (
              <li key={`${c.mesa}-${c.tipo}`} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span className="text-[15px]">
                  <strong>Mesa {c.mesa}</strong> {c.tipo === 'garcom' ? 'chamou o garçom' : 'pediu a conta'}{' '}
                  <span className={min(c.desde, now) >= 5 ? 'font-semibold text-bad' : 'text-ink-mute'}>há {tempo(min(c.desde, now))}</span>
                </span>
                <button type="button" className="btn-ghost min-h-10 px-3" disabled={pending} onClick={() => atender(c.mesa, c.tipo)}>
                  Já atendido
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Todas as mesas" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {numbers.map((n) => {
          const m = byNumber.get(n) as Mesa | undefined;
          if (!m)
            return (
              <div key={n} className="rounded-xl border border-dashed border-line bg-white/60 p-4">
                <p className="text-lg font-extrabold text-ink-mute">Mesa {n}</p>
                <p className="text-sm text-ink-mute">Livre</p>
              </div>
            );
          const chamando = m.calls.some((c) => c.kind === 'garcom');
          const conta = m.calls.some((c) => c.kind === 'conta');
          const pedidos = m.orders.filter((o) => o.status !== 'recusado').length;
          return (
            <div key={n} className={`card p-4 ${chamando ? 'border-2 border-bad' : conta ? 'border-2 border-warn' : !m.confirmed ? 'border-2 border-accent' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-lg font-extrabold">Mesa {n}</p>
                <span className="text-xs text-ink-mute tabular-nums">{tempo(min(m.openedAt, now))}</span>
              </div>
              <p className="mt-1 text-xl font-bold tabular-nums">{brl(m.total)}</p>
              <p className="text-xs text-ink-mute">
                {pedidos} {pedidos === 1 ? 'pedido' : 'pedidos'}
                {m.people ? ` · ${m.people} ${m.people === 1 ? 'pessoa' : 'pessoas'}` : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {chamando && <span className="chip bg-bad/10 text-bad">Chamando</span>}
                {conta && <span className="chip bg-warn/10 text-warn">Pediu a conta</span>}
                {!m.confirmed && <span className="chip bg-accent-soft text-accent">Confirmar mesa</span>}
              </div>
            </div>
          );
        })}
      </section>
      <p className="mt-3 text-xs text-ink-mute">Fechar a conta, confirmar mesa e marcar entregue ficam na tela do salão, com o garçom.</p>
    </div>
  );
}

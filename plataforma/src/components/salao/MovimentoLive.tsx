'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PublicFloor } from '@/lib/movimento';
import { SalaoDesenho } from './SalaoDesenho';

const POLL_MS = 20_000;
const LEVEL = {
  tranquilo: { label: 'Tranquilo', text: 'Tem mesa livre agora. A situação muda a todo momento.', cls: 'bg-ok text-white' },
  movimentado: { label: 'Movimentado', text: 'O salão está enchendo.', cls: 'bg-warn text-white' },
  cheio: { label: 'Cheio', text: 'Todas as mesas estão ocupadas ou reservadas agora.', cls: 'bg-bad text-white' },
} as const;
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

export function MovimentoLive({ slug, initial }: { slug: string; initial: PublicFloor }) {
  const [floor, setFloor] = useState(initial);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/lojas/${slug}/movimento`, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      setFloor((await res.json()) as PublicFloor);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, [slug]);

  useEffect(() => {
    const t = window.setInterval(() => document.visibilityState === 'visible' && load(), POLL_MS);
    return () => window.clearInterval(t);
  }, [load]);

  const level = LEVEL[floor.level];
  return (
    <main className="mx-auto max-w-2xl px-4 pt-8 pb-16">
      <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">Movimento agora</p>
      <h1 className="mt-1 text-3xl font-black tracking-tight">{floor.store}</h1>

      <section className="card mt-5 p-5" aria-live="polite">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-4 py-1.5 text-base font-bold ${level.cls}`}>{level.label}</span>
          <p className="text-lg font-semibold tabular-nums">
            {floor.free} {floor.free === 1 ? 'mesa livre' : 'mesas livres'} de {floor.total}
          </p>
        </div>
        <p className="mt-2 text-ink-soft">{level.text}</p>
        {floor.waitlist && (
          <a href={`/fila/${slug}`} className="mt-4 mr-2 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent text-base font-bold text-white hover:bg-accent-deep sm:w-auto sm:px-6">
            Entrar na fila{floor.waiting ? ` · ${floor.waiting} na frente` : ''}
          </a>
        )}
        {floor.reservations && (
          <a href={`/reservar/${slug}`} className={`mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl text-base font-bold sm:w-auto sm:px-6 ${floor.level === 'cheio' ? 'bg-accent text-white hover:bg-accent' : 'border border-line bg-white text-ink hover:border-accent'}`}>
            Reservar uma mesa
          </a>
        )}
      </section>

      <section className="mt-5 space-y-3">
        <h2 className="text-sm font-bold">Mapa do salão</h2>
        <div className="card overflow-hidden p-3">
          <SalaoDesenho label="Mesas do salão agora" mesas={floor.tables.map((t) => ({ ...t, state: t.taken ? 'ocupada' : 'livre' }))} />
        </div>
      </section>

      <p className="mt-6 text-xs text-ink-mute">
        Atualizado às {hhmm(floor.updatedAt)}{offline ? ' · sem conexão, tentando de novo' : ', a cada 20 segundos'}. Mesas reservadas para os próximos minutos contam como ocupadas.
      </p>
    </main>
  );
}

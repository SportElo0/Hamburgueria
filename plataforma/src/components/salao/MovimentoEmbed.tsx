'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PublicFloor } from '@/lib/movimento';
import { SalaoDesenho } from './SalaoDesenho';

const POLL_MS = 15_000;
const LEVEL = {
  tranquilo: { label: 'Tranquilo', cls: 'bg-[#E6F6EE] text-[#157A4E]' },
  movimentado: { label: 'Movimentado', cls: 'bg-[#FFF4DE] text-[#9A6400]' },
  cheio: { label: 'Cheio', cls: 'bg-[#FDECEC] text-[#B42318]' },
} as const;

/** Compact live floor for the restaurant's site: level, free tables, the drawing and the booking button. */
export function MovimentoEmbed({ slug, initial }: { slug: string; initial: PublicFloor }) {
  const [floor, setFloor] = useState(initial);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/lojas/${slug}/movimento`, { cache: 'no-store' });
      if (res.ok) setFloor((await res.json()) as PublicFloor);
    } catch {
      /* keep the last picture */
    }
  }, [slug]);

  useEffect(() => {
    const t = window.setInterval(() => document.visibilityState === 'visible' && load(), POLL_MS);
    return () => window.clearInterval(t);
  }, [load]);

  // Tell the restaurant's page how tall this is, so its frame fits the drawing without scrollbars.
  useEffect(() => {
    if (window.parent === window) return;
    const root = document.querySelector('[data-embed-root]');
    if (!root) return;
    // The content's own height (the page itself is never shorter than the frame, so it can't be measured).
    const send = () => window.parent.postMessage({ type: 'growlift-movimento', height: Math.ceil(root.getBoundingClientRect().height) }, '*');
    const ro = new ResizeObserver(send);
    ro.observe(root);
    send();
    return () => ro.disconnect();
  }, []);

  const level = LEVEL[floor.level];
  return (
    <div className="bg-white" data-embed-root>
    <div className="mx-auto max-w-[860px] p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2" aria-live="polite">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22A06B] opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22A06B]" />
          </span>
          <p className="text-sm font-bold text-ink">Movimento agora</p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${level.cls}`}>{level.label}</span>
        </div>
        <p className="text-sm font-semibold text-ink-soft tabular-nums">
          {floor.free} {floor.free === 1 ? 'mesa livre' : 'mesas livres'} de {floor.total}
        </p>
      </div>
      <div className="mt-2">
        <SalaoDesenho minWidth={480} label={`Mesas do ${floor.store} agora`} mesas={floor.tables.map((t) => ({ ...t, state: t.taken ? 'ocupada' : 'livre' }))} />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {floor.waitlist && (
            <a href={`/fila/${slug}`} target="_blank" rel="noopener" className="btn-primary min-h-11">
              Entrar na fila{floor.waiting ? ` · ${floor.waiting} na frente` : ''}
            </a>
          )}
          {floor.reservations && (
            <a href={`/reservar/${slug}`} target="_blank" rel="noopener" className={floor.waitlist ? 'btn-ghost min-h-11' : 'btn-primary min-h-11'}>
              Reservar uma mesa
            </a>
          )}
        </div>
        <a href="https://growlift.com.br" target="_blank" rel="noopener" className="text-[11px] text-ink-mute hover:text-accent">
          Atualiza sozinho · Growlift
        </a>
      </div>
    </div>
    </div>
  );
}

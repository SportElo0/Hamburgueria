'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { leaveQueueAction, queueStatusAction } from '@/app/fila/[slug]/actions';
import type { PublicEntry } from '@/lib/fila';

const POLL_MS = 5000;

/** Two short tones and a buzz when the table is ready (works once the page has been touched). */
function alertCustomer() {
  try {
    navigator.vibrate?.([300, 150, 300, 150, 600]);
  } catch {}
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.3);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.32);
    });
  } catch {}
}

export function FilaStatus({ slug, token, storeName, initial }: { slug: string; token: string; storeName: string; initial: PublicEntry }) {
  const [e, setE] = useState(initial);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const last = useRef(initial.status);

  const load = useCallback(async () => {
    const res = await queueStatusAction(slug, initial.id, token);
    if (!res.ok || !res.data) return;
    if (res.data.status === 'chamado' && last.current !== 'chamado') {
      alertCustomer();
      document.title = 'Sua mesa está pronta!';
    }
    last.current = res.data.status;
    setE(res.data);
  }, [slug, initial.id, token]);

  useEffect(() => {
    if (!['aguardando', 'chamado'].includes(e.status)) return;
    const t = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(t);
  }, [e.status, load]);

  const leave = () =>
    startTransition(async () => {
      const res = await leaveQueueAction(slug, initial.id, token);
      if (!res.ok) return setError(res.error);
      if (res.data) setE(res.data);
    });

  return (
    <main className="mx-auto max-w-md px-4 pt-8 pb-16" aria-live="polite">
      <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">Fila · {storeName}</p>
      {e.status === 'chamado' ? (
        <section className="mt-4 rounded-3xl bg-ok p-6 text-white">
          <p className="text-sm font-bold tracking-wide uppercase opacity-90">{e.name}</p>
          <h1 className="mt-1 text-4xl leading-tight font-black">Sua mesa está pronta!</h1>
          <p className="mt-2 text-lg">Vá até a recepção agora. A mesa fica guardada por 10 minutos.</p>
        </section>
      ) : e.status === 'aguardando' ? (
        <section className="card mt-4 p-6 text-center">
          <p className="text-sm font-semibold text-ink-mute">{e.name}, sua posição</p>
          <p className="mt-1 text-7xl font-black text-accent tabular-nums">{e.position}º</p>
          <p className="mt-2 text-ink-soft">{e.ahead === 0 ? 'Você é o próximo!' : `${e.ahead} ${e.ahead === 1 ? 'grupo' : 'grupos'} na sua frente.`}</p>
          <p className="mt-4 text-sm text-ink-mute">Mantenha esta página aberta e com a tela ligada: ela atualiza sozinha e avisa com som e vibração. Em alguns celulares o aviso pode não tocar, então fique de olho na recepção.</p>
          <button type="button" className="btn-ghost mt-3" onClick={alertCustomer}>
            Testar o aviso
          </button>
        </section>
      ) : (
        <section className="card mt-4 p-6">
          <h1 className="text-2xl font-bold">{e.status === 'sentou' ? 'Bom proveito!' : e.status === 'saiu' ? 'Você saiu da fila.' : 'Seu lugar na fila foi encerrado.'}</h1>
          {e.status !== 'sentou' && <p className="mt-2 text-ink-soft">Se quiser voltar, entre na fila de novo pelo QR da porta.</p>}
        </section>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-bad">
          {error}
        </p>
      )}
      {(e.status === 'aguardando' || e.status === 'chamado') &&
        (confirming ? (
          <div className="card mt-4 flex items-center gap-2 p-4">
            <p className="flex-1 text-sm">Sair da fila?</p>
            <button type="button" className="btn-danger" disabled={pending} onClick={leave}>
              Sair
            </button>
            <button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>
              Ficar
            </button>
          </div>
        ) : (
          <button type="button" className="btn-ghost mt-4 w-full" onClick={() => setConfirming(true)}>
            Sair da fila
          </button>
        ))}
    </main>
  );
}

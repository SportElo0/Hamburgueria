'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import type { ChangeEntry } from '@/lib/schema';
import { monthLabel, usage } from '@/lib/changes';
import { logChangeAction, removeChangeAction } from '@/app/painel/actions';
import { CountChoice, type CountMode } from './PublishDialog';
import { UsageBadge } from '../UsageBadge';

export function ChangesPanel(props: { slug: string; month: string; currentMonth: string; months: string[]; changes: ChangeEntry[]; limit: number }) {
  const u = usage(props.changes, props.limit);
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<CountMode>('conta');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const isCurrent = props.month === props.currentMonth;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold first-letter:uppercase">{monthLabel(props.month)}</h2>
          <UsageBadge usage={u} />
        </div>
        <nav aria-label="Meses" className="mt-3 flex flex-wrap gap-1">
          {props.months.map((m) => (
            <Link
              key={m}
              href={`?aba=mudancas&mes=${m}`}
              aria-current={m === props.month ? 'page' : undefined}
              className="chip border border-line bg-white text-ink-soft aria-[current=page]:border-ink aria-[current=page]:text-ink"
            >
              {m}
            </Link>
          ))}
        </nav>
        {props.changes.length === 0 ? (
          <p className="mt-6 text-sm text-ink-mute">Nenhuma mudança registrada neste mês.</p>
        ) : (
          <ol className="mt-4 divide-y divide-line">
            {[...props.changes].reverse().map((c) => (
              <li key={c.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.description}</p>
                  <p className="mt-0.5 text-xs text-ink-mute">
                    {new Date(c.at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · {c.by}
                  </p>
                </div>
                {c.counted ? (
                  c.extra ? <span className="chip bg-bad/10 text-bad">Extra · cobrar</span> : <span className="chip bg-ink/5 text-ink-soft">Conta no limite</span>
                ) : (
                  <span className="chip bg-ok/10 text-ok">Não conta · {c.reason || 'sem motivo'}</span>
                )}
                <button
                  type="button"
                  className="cursor-pointer text-xs font-semibold text-ink-mute hover:text-bad"
                  onClick={() =>
                    confirm('Apagar este registro?') &&
                    start(async () => {
                      const res = await removeChangeAction(props.slug, props.month, c.id);
                      if (!res.ok) setError(res.error ?? 'Falha ao apagar.');
                    })
                  }
                >
                  Apagar
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      {isCurrent && (
        <section className="card h-fit space-y-3 p-5">
          <h2 className="text-lg font-bold">Registrar pedido</h2>
          <p className="text-sm text-ink-mute">Use quando a mudança foi feita sem publicar pelo painel, ou para anotar um pedido já combinado.</p>
          <label htmlFor="pedido" className="label">O que o cliente pediu</label>
          <textarea id="pedido" rows={3} className="field resize-y" value={description} onChange={(e) => setDescription(e.target.value)} />
          <CountChoice mode={mode} setMode={setMode} reason={reason} setReason={setReason} allowInternal={false} />
          {error && <p className="text-sm font-semibold text-bad">{error}</p>}
          <button
            type="button"
            className="btn-primary w-full"
            disabled={pending || !description.trim()}
            onClick={() =>
              start(async () => {
                const res = await logChangeAction(props.slug, { description, counted: mode === 'conta', reason });
                if (!res.ok) return setError(res.error ?? 'Falha ao registrar.');
                setDescription('');
                setError('');
              })
            }
          >
            {pending ? 'Registrando…' : 'Registrar'}
          </button>
        </section>
      )}
    </div>
  );
}

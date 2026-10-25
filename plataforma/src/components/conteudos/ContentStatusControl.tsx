'use client';

import { useState, useTransition } from 'react';
import { setContentStatusAction } from '@/app/painel/actions';
import type { ContentStatus } from '@/lib/conteudos';

const OPTIONS: { id: ContentStatus; label: string; on: string }[] = [
  { id: 'rascunho', label: 'Para aprovar', on: 'bg-ink text-white' },
  { id: 'aprovado', label: 'Aprovado', on: 'bg-ok text-white' },
  { id: 'postado', label: 'Postado', on: 'bg-accent text-white' },
];

export function ContentStatusControl({ statusKey, status, by, label }: { statusKey: string; status: ContentStatus; by?: string; label: string }) {
  const [value, setValue] = useState(status);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const change = (next: ContentStatus) => {
    if (next === value) return;
    const prev = value;
    setValue(next);
    setError('');
    start(async () => {
      const res = await setContentStatusAction(statusKey, next);
      if (!res.ok) {
        setValue(prev);
        setError(res.error ?? 'Não foi possível salvar.');
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <div role="group" aria-label={`Situação de ${label}`} className="inline-flex rounded-lg border border-line bg-white p-0.5">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            disabled={pending}
            onClick={() => change(o.id)}
            className={`min-h-9 cursor-pointer rounded-md px-3 text-[13px] font-semibold transition-colors ${value === o.id ? o.on : 'text-ink-mute hover:text-ink'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-xs font-semibold text-bad">
          {error}
        </p>
      ) : (
        by && value !== 'rascunho' && value === status && <p className="text-xs text-ink-mute">por {by}</p>
      )}
    </div>
  );
}

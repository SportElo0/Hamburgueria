'use client';

import { useState } from 'react';
import type { Store } from '@/lib/schema';
import type { Update } from './StoreEditor';

/** Raw JSON for data only one bespoke site uses (board shapes, offers, translations…). */
export function ExtraEditor({ store, update }: { store: Store; update: Update }) {
  const [text, setText] = useState(() => JSON.stringify(store.extra, null, 2));
  const [error, setError] = useState('');
  return (
    <section className="card space-y-3 p-5">
      <h2 className="text-lg font-bold">Dados extras do site</h2>
      <p className="text-sm text-ink-mute">
        Informações específicas de um site que não cabem no catálogo (ex.: tipos de prancha, cupom da campanha). Formato JSON. Mexa só se souber o que está
        fazendo.
      </p>
      <textarea
        aria-label="Dados extras em JSON"
        rows={18}
        spellCheck={false}
        className={`field resize-y font-mono text-[13px] ${error ? 'border-bad' : ''}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          try {
            const value = JSON.parse(text || '{}');
            if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Precisa ser um objeto { … }.');
            setError('');
            update((d) => void (d.extra = value));
          } catch (err) {
            setError(err instanceof Error ? err.message : 'JSON inválido');
          }
        }}
      />
      {error && <p className="text-sm font-semibold text-bad">JSON inválido: {error}. A alteração não foi aplicada.</p>}
    </section>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { importSeedsAction } from '@/app/painel/actions';

export function ImportSeeds({ names }: { names: string[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  return (
    <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 border-accent/40 bg-accent-soft p-4">
      <p className="text-sm">
        <strong>Lojas prontas para importar:</strong> {names.join(', ')}. O cardápio e os contatos vêm dos sites publicados.
      </p>
      <button
        type="button"
        className="btn-primary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await importSeedsAction();
            if (!res.ok) setError(res.error ?? 'Falha ao importar.');
          })
        }
      >
        {pending ? 'Importando…' : 'Importar'}
      </button>
      {error && <p className="w-full text-sm font-semibold text-bad">{error}</p>}
    </div>
  );
}

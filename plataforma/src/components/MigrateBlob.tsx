'use client';

import { useState, useTransition } from 'react';
import { migrateBlobAction } from '@/app/painel/actions';

/** Shown only until the old Vercel Blob data is in the new database. */
export function MigrateBlob() {
  const [pending, start] = useTransition();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  return (
    <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 border-warn/40 bg-warn/10 p-4">
      <p className="text-sm">
        <strong>Dados antigos ainda não copiados.</strong> As lojas, pedidos e logins estão no armazenamento antigo (Vercel Blob). Copie para o banco novo antes de mexer em qualquer loja.
      </p>
      <button
        type="button"
        className="btn-primary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError('');
            const res = await migrateBlobAction();
            if (!res.ok) setError(res.error ?? 'Falha ao copiar.');
            else if (!res.finished) setNote(`${res.copied} copiados agora (${res.skipped ?? 0} já estavam no banco novo). Clique de novo para continuar.`);
          })
        }
      >
        {pending ? 'Copiando…' : 'Copiar dados'}
      </button>
      {note && <p className="w-full text-sm">{note}</p>}
      {error && <p className="w-full text-sm font-semibold text-bad">{error}</p>}
    </div>
  );
}

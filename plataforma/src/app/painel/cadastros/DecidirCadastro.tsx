'use client';

import { useState, useTransition } from 'react';
import { aprovarCadastroAction, recusarCadastroAction } from './actions';

export function DecidirCadastro({ slug, nome }: { slug: string; nome: string }) {
  const [pending, start] = useTransition();
  const [erro, setErro] = useState('');
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setErro('');
      const r = await fn();
      if (!r.ok) setErro(r.error ?? 'Erro.');
    });
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button type="button" className="btn-primary" disabled={pending} onClick={() => run(() => aprovarCadastroAction(slug))}>
          Aprovar
        </button>
        <button
          type="button"
          className="btn-danger"
          disabled={pending}
          onClick={() => {
            if (window.confirm(`Recusar e apagar o cadastro de ${nome}? Não dá para desfazer.`)) run(() => recusarCadastroAction(slug));
          }}
        >
          Recusar
        </button>
      </div>
      {erro && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {erro}
        </p>
      )}
    </div>
  );
}

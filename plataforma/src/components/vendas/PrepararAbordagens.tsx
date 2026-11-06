'use client';

import { useState, useTransition } from 'react';
import { prepararLoteAction } from '@/app/painel/oportunidades/vendas/actions';

/** One click: a first draft for every qualified contact still without one. They go to "Para aprovar"; nothing is sent. */
export function PrepararAbordagens({ prontos }: { prontos: number }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  return (
    <div className="text-right">
      <button
        type="button"
        className="btn-primary"
        disabled={pending || prontos === 0}
        title={prontos === 0 ? 'Nenhum contato qualificado sem rascunho' : undefined}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const r = await prepararLoteAction();
            if (!r.ok) setMsg({ ok: false, texto: r.error });
            else
              setMsg({
                ok: true,
                texto: `${r.dados.gerados} rascunho(s) na fila de aprovação.${r.dados.restantes ? ` Faltam ${r.dados.restantes}: clique de novo.` : ''}${r.dados.falhas ? ` ${r.dados.falhas} não puderam (ver a ficha).` : ''}`,
              });
          })
        }
      >
        {pending ? 'Preparando…' : `Preparar abordagens (${prontos})`}
      </button>
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`mt-1 text-sm font-semibold ${msg.ok ? 'text-ok' : 'text-bad'}`}>
          {msg.texto}
        </p>
      )}
    </div>
  );
}

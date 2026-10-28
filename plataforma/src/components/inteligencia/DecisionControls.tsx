'use client';

import { useState, useTransition } from 'react';
import { decideAction } from '@/app/painel/inteligencia/actions';
import { DECISION_LABEL, type Decision, type DecisionStatus } from '@/lib/inteligencia/recomendacoes';

const NEXT: { status: DecisionStatus; label: string }[] = [
  { status: 'aprovada', label: 'Dono aprovou' },
  { status: 'em-teste', label: 'Em teste' },
  { status: 'concluida', label: 'Concluída' },
  { status: 'descartada', label: 'Descartar' },
];

/** A equipe registra o que foi decidido com o dono; nada muda no cardápio por aqui. */
export function DecisionControls({ slug, id, decision }: { slug: string; id: string; decision: Decision | null }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState(decision?.note ?? '');
  const [error, setError] = useState('');
  const save = (status: DecisionStatus | null) =>
    start(async () => {
      setError('');
      const r = await decideAction(slug, id, status, note);
      if (!r.ok) setError(r.error ?? 'Erro.');
    });

  return (
    <div className="mt-4 border-t border-line pt-3">
      {decision && (
        <p className="mb-2 text-sm">
          <span className="font-semibold">{DECISION_LABEL[decision.status]}</span>
          <span className="text-ink-mute">
            {' '}
            · {decision.by} · {new Date(decision.at).toLocaleDateString('pt-BR')}
          </span>
        </p>
      )}
      <label className="sr-only" htmlFor={`nota-${id}`}>
        Observação
      </label>
      <input
        id={`nota-${id}`}
        className="field text-sm"
        placeholder="Observação (ex.: combinado com o dono por WhatsApp em 28/10)"
        value={note}
        maxLength={500}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {NEXT.map((n) => (
          <button
            key={n.status}
            type="button"
            disabled={pending}
            onClick={() => save(n.status)}
            aria-pressed={decision?.status === n.status}
            className={`btn min-h-9 border px-3 text-[13px] ${decision?.status === n.status ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink'}`}
          >
            {n.label}
          </button>
        ))}
        {decision && (
          <button type="button" disabled={pending} onClick={() => save(null)} className="btn min-h-9 px-3 text-[13px] text-ink-mute hover:text-ink">
            Voltar para pendente
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
    </div>
  );
}

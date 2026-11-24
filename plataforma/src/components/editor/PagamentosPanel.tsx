'use client';

import { useState, useTransition } from 'react';
import { monthLabel } from '@/lib/changes';
import { formatPrice } from '@/lib/slug';
import type { Payment } from '@/lib/schema';
import { setPaymentAction } from '@/app/painel/actions';

export function PagamentosPanel(props: {
  slug: string;
  monthlyFee: number | null;
  extraPrice: number | null;
  currentExtras: number;
  history: { month: string; payment: Payment }[];
}) {
  const [note, setNote] = useState(props.history[0]?.payment.note ?? '');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const suggested = (props.monthlyFee ?? 0) + (props.extraPrice ? props.extraPrice * props.currentExtras : 0);
  const hasCharge = props.monthlyFee !== null || (props.extraPrice !== null && props.currentExtras > 0);
  const [current, ...previous] = props.history;

  const toggle = (month: string, paid: boolean, noteValue: string) =>
    start(async () => {
      const res = await setPaymentAction(props.slug, month, { paid, note: noteValue });
      if (!res.ok) setError(res.error ?? 'Falha ao atualizar.');
    });

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold first-letter:uppercase">{monthLabel(current.month)}</h2>
        {hasCharge ? (
          <div className="rounded-lg bg-ink/5 p-4 text-sm">
            <p className="font-semibold">Valor sugerido: R$ {formatPrice(suggested)}</p>
            <ul className="mt-1 space-y-0.5 text-ink-mute">
              {props.monthlyFee !== null && <li>Mensalidade: R$ {formatPrice(props.monthlyFee)}</li>}
              {props.extraPrice !== null && props.currentExtras > 0 && (
                <li>
                  {props.currentExtras} mudança(s) extra × R$ {formatPrice(props.extraPrice)}
                </li>
              )}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-ink-mute">Sem mensalidade e sem valor de mudança extra combinado para esta loja.</p>
        )}
        {error && <p className="text-sm font-semibold text-bad">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <span className={`chip ${current.payment.paid ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}>
            {current.payment.paid ? 'Pago' : 'Pendente'}
          </span>
          {current.payment.paid && current.payment.paidAt && (
            <span className="text-xs text-ink-mute">
              em {new Date(current.payment.paidAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              {current.payment.paidBy && ` · ${current.payment.paidBy}`}
            </span>
          )}
        </div>
        <textarea
          aria-label="Observação do pagamento"
          rows={2}
          className="field resize-y"
          placeholder="Ex.: Pix combinado para dia 10"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => toggle(current.month, current.payment.paid, note)}
        />
        <button
          type="button"
          className={current.payment.paid ? 'btn-ghost' : 'btn-primary'}
          disabled={pending}
          onClick={() => toggle(current.month, !current.payment.paid, note)}
        >
          {pending ? 'Salvando…' : current.payment.paid ? 'Marcar como pendente' : 'Marcar como pago'}
        </button>
      </section>

      {previous.length > 0 && (
        <section className="card h-fit space-y-3 p-5">
          <h2 className="text-lg font-bold">Meses anteriores</h2>
          <ul className="divide-y divide-line">
            {previous.map(({ month, payment }) => (
              <li key={month} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="first-letter:uppercase">{monthLabel(month)}</span>
                <span className={`chip shrink-0 ${payment.paid ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}>{payment.paid ? 'Pago' : 'Pendente'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

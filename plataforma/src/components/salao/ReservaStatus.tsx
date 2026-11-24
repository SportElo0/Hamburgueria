'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { cancelReservationAction, simulateDepositAction, trackReservationAction } from '@/app/reservar/[slug]/actions';
import type { PublicReservation } from '@/lib/reservas';
import { brl } from '@/lib/ordering';
import { SellerFooter, type Seller } from './SellerFooter';

const POLL_MS = 5000;
const when = (r: PublicReservation) =>
  `${new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'America/Sao_Paulo' }).format(new Date(`${r.date}T12:00:00-03:00`))}, às ${r.time}`;
const dateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

export function ReservaStatus({ slug, token, storeName, initial, seller }: { slug: string; token: string; storeName: string; initial: PublicReservation; seller: Seller | null }) {
  const [r, setR] = useState(initial);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  // When the customer opened "cancel": decides which message (refund or not) they see.
  const [confirming, setConfirming] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  // The deadline passed between opening "cancel" and confirming: the server asks again before keeping the deposit.
  const [askAgain, setAskAgain] = useState('');

  const load = useCallback(async () => {
    const res = await trackReservationAction(slug, r.id, token);
    if (res.ok && res.data) setR(res.data);
  }, [slug, r.id, token]);

  useEffect(() => {
    if (r.status !== 'aguardando-pix') return;
    const t = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(t);
  }, [r.status, load]);

  const act = (fn: () => ReturnType<typeof cancelReservationAction>) =>
    startTransition(async () => {
      setError('');
      const res = await fn();
      if (!res.ok) {
        if ('askAgain' in res && res.askAgain) return setAskAgain(res.error);
        return setError(res.error);
      }
      if (res.data) setR(res.data);
      setConfirming(null);
      setAskAgain('');
    });

  const inTime = confirming !== null && (confirming <= Date.parse(r.refundUntil) || (r.withdrawUntil !== null && confirming <= Date.parse(r.withdrawUntil)));
  const refundExpected = r.paid && r.deposit > 0 ? inTime : undefined;
  const paidDeposit = r.deposit > 0 && r.status !== 'aguardando-pix' && r.status !== 'expirada';

  return (
    <main className="mx-auto max-w-xl px-4 pt-8 pb-16">
      <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">Reserva · {storeName}</p>
      <h1 className="mt-1 text-3xl font-black tracking-tight">{r.statusLabel}</h1>
      <p className="mt-2 text-lg first-letter:uppercase">{when(r)}</p>
      <p className="text-ink-soft">
        {r.people} {r.people === 1 ? 'pessoa' : 'pessoas'} · em nome de {r.name}
      </p>

      {r.status === 'aguardando-pix' && r.pix && (
        <section className="card mt-6 p-5 text-center" aria-labelledby="pix">
          <h2 id="pix" className="text-lg font-bold">
            Pague o sinal de {brl(r.deposit)} para garantir a mesa
          </h2>
          <p className="mt-1 text-sm text-ink-soft">Pix válido até {dateTime(r.pix.expiresAt)}. Esta página confirma sozinha quando o pagamento cair.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${r.pix.qrBase64}`} alt="QR Code do Pix" width={220} height={220} className="mx-auto mt-4" />
          <button
            type="button"
            className="btn-primary mt-4 w-full"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(r.pix!.copyPaste);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2500);
              } catch {}
            }}
          >
            {copied ? 'Código copiado' : 'Copiar código Pix'}
          </button>
          {r.pix.demo && (
            <button type="button" className="btn-ghost mt-2 w-full" disabled={pending} onClick={() => act(() => simulateDepositAction(slug, r.id, token))}>
              Simular pagamento (demonstração, nada é cobrado)
            </button>
          )}
        </section>
      )}

      {r.status === 'confirmada' && (
        <section className="card mt-6 space-y-2 p-5" aria-labelledby="ok">
          <h2 id="ok" className="text-lg font-bold">
            Mesa garantida
          </h2>
          {r.deposit > 0 && <p className="text-ink-soft">Sinal de {brl(r.deposit)} pago. Ele é descontado da sua conta no dia; se a conta der menos, devolvemos a diferença no fechamento.</p>}
          {r.deposit > 0 && (
            <p className="text-sm text-ink-soft">
              Devolução do sinal se cancelar: até {dateTime(r.withdrawUntil && Date.parse(r.withdrawUntil) > Date.parse(r.refundUntil) ? r.withdrawUntil : r.refundUntil)}. Depois disso, ou sem chegar até {r.rules.toleranceMinutes} minutos após o horário, o sinal fica com o restaurante. Se o restaurante cancelar, devolve tudo.
            </p>
          )}
          <p className="text-ink-soft">Chegue até {r.rules.toleranceMinutes} minutos depois do horário. Guarde esta página: o link é a sua reserva.</p>
        </section>
      )}

      {r.status === 'cancelada' && <p className="card mt-6 p-5 text-ink-soft">{r.refunded ? `Reserva cancelada. A devolução do sinal de ${brl(r.deposit)} foi enviada pelo Pix para a conta de onde saiu o pagamento.` : paidDeposit ? 'Reserva cancelada depois do prazo: o sinal ficou com o restaurante, como nas regras.' : 'Reserva cancelada.'}</p>}
      {r.status === 'expirada' && <p className="card mt-6 p-5 text-ink-soft">O Pix do sinal não foi pago a tempo e a reserva não foi feita. Se quiser, faça uma nova.</p>}
      {r.status === 'nao-veio' && <p className="card mt-6 p-5 text-ink-soft">A reserva passou da tolerância sem chegada. O sinal ficou com o restaurante, como nas regras.</p>}
      {(r.status === 'chegou' || r.status === 'concluida') && <p className="card mt-6 p-5 text-ink-soft">Bom proveito! O sinal entra como desconto na conta da mesa.</p>}

      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-bad">
          {error}
        </p>
      )}

      {r.canCancel && (
        <section className="mt-6">
          {confirming === null ? (
            <button type="button" className="btn-ghost w-full" onClick={() => setConfirming(Date.now())}>
              Cancelar reserva
            </button>
          ) : (
            <div className="card space-y-3 p-4">
              <p className="text-sm">
                {r.status === 'aguardando-pix' || r.deposit === 0
                  ? 'Cancelar esta reserva?'
                  : inTime
                    ? `Você cancela dentro do prazo e recebe o sinal de ${brl(r.deposit)} de volta pelo Pix.`
                    : `O prazo para devolução já acabou. Se cancelar agora, o sinal de ${brl(r.deposit)} fica com o restaurante.`}
              </p>
              <div className="flex gap-2">
                <button type="button" className="btn-danger flex-1" disabled={pending} onClick={() => act(() => cancelReservationAction(slug, r.id, token, refundExpected))}>
                  {pending ? 'Cancelando…' : 'Sim, cancelar'}
                </button>
                <button type="button" className="btn-ghost flex-1" onClick={() => setConfirming(null)}>
                  Voltar
                </button>
              </div>
            </div>
          )}
          {askAgain && (
            <div className="card mt-3 space-y-3 border-warn p-4">
              <p className="text-sm">{askAgain}</p>
              <div className="flex gap-2">
                <button type="button" className="btn-danger flex-1" disabled={pending} onClick={() => act(() => cancelReservationAction(slug, r.id, token, false))}>
                  Cancelar mesmo assim
                </button>
                <button type="button" className="btn-ghost flex-1" onClick={() => (setAskAgain(''), setConfirming(null))}>
                  Manter a reserva
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      {seller && <SellerFooter seller={seller} slug={slug} />}
    </main>
  );
}

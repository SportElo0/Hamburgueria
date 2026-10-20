'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCatalog, type OnlineOrdering } from '@/content/live';
import { formatBRL } from '@/lib/money';
import { CheckoutError, placeOrder, previewCoupon, trackingPath, type PaymentMethod } from '@/lib/checkout';
import { useCart } from '../Providers';
import { ArrowRightIcon } from '../ui/Icons';

const input = 'mt-2 h-13 w-full rounded-2xl border-2 border-ink/15 bg-white/5 px-4 text-base outline-none focus-visible:border-ink aria-invalid:border-brand';
const labelCls = 'cond block text-sm font-bold tracking-[0.1em] uppercase';
const choice =
  'cond flex min-h-13 cursor-pointer items-center justify-center rounded-2xl border-2 border-ink/15 px-3 text-center text-base font-bold tracking-[0.04em] uppercase transition-colors hover:border-ink/40 has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-on-dark has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink';

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const toCents = (v: string) => {
  const n = Number(v.replace(/[^\d,]/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
};

/** Order details and payment, sent straight to the store's panel (no WhatsApp). */
export function Checkout({ ordering, onBack, onPlaced }: { ordering: OnlineOrdering; onBack: () => void; onPlaced: () => void }) {
  const cart = useCart();
  const router = useRouter();
  const uid = useId();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'entrega' | 'retirada'>(ordering.delivery ? 'entrega' : 'retirada');
  const [areaId, setAreaId] = useState('');
  const [street, setStreet] = useState('');
  const [reference, setReference] = useState('');
  const [payment, setPayment] = useState<PaymentMethod | ''>('');
  const [change, setChange] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [couponText, setCouponText] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; discount: number; freeDelivery: boolean } | null>(null);
  const [optIn, setOptIn] = useState(false);
  const { restaurant } = useCatalog();
  const [couponMsg, setCouponMsg] = useState('');
  const [checking, setChecking] = useState(false);

  const area = ordering.areas.find((a) => a.id === areaId);
  const feePending = mode === 'entrega' && ordering.areas.length === 0;
  const fee = mode === 'entrega' ? (area?.fee ?? 0) : 0;
  // A free-delivery coupon waives the fee of the chosen neighbourhood; the panel applies it again on the order.
  const discount = coupon ? (coupon.freeDelivery ? (mode === 'entrega' && !feePending ? fee : 0) : coupon.discount) : 0;
  const total = cart.total - discount + fee;
  const pixAllowed = ordering.payments.pix && !feePending;
  const methods = (
    [
      ['pix', 'Pix', pixAllowed],
      ['cartao', mode === 'entrega' ? 'Cartão na entrega' : 'Cartão no balcão', ordering.payments.card],
      ['dinheiro', 'Dinheiro', ordering.payments.cash],
    ] as const
  ).filter(([, , on]) => on);
  const belowMin = cart.total < ordering.minOrder;

  const applyCoupon = async () => {
    const code = couponText.trim();
    if (!code) return;
    setChecking(true);
    setCouponMsg('');
    try {
      const res = await previewCoupon(code, cart.total);
      setCoupon({ code: res.code, discount: res.discount, freeDelivery: res.freeDelivery === true });
    } catch (err) {
      setCoupon(null);
      setCouponMsg(err instanceof CheckoutError ? err.message : 'Não foi possível validar o cupom.');
    } finally {
      setChecking(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (name.trim().length < 2) return setError('Informe seu nome.');
    if (digits.length < 10) return setError('Informe seu telefone com DDD.');
    if (mode === 'entrega' && ordering.areas.length && !area) return setError('Escolha o seu bairro.');
    if (mode === 'entrega' && street.trim().length < 5) return setError('Informe o endereço de entrega.');
    if (!payment) return setError('Escolha a forma de pagamento.');
    if (payment === 'pix' && !ordering.pixDemo && !email.trim()) return setError('Informe seu e-mail para o comprovante do Pix.');
    const changeFor = payment === 'dinheiro' ? toCents(change) : null;
    if (changeFor !== null && changeFor < total) return setError('O valor para troco precisa ser maior que o total.');
    setSending(true);
    try {
      const placed = await placeOrder({
        lines: cart.lines,
        customer: { name: name.trim(), phone: digits, email: email.trim() },
        mode,
        address: { areaId, street: street.trim(), reference: reference.trim() },
        payment,
        changeFor,
        note: note.trim(),
        coupon: coupon?.code ?? '',
        optIn,
      });
      cart.clear();
      onPlaced();
      router.push(trackingPath(placed.id, placed.token));
    } catch (err) {
      setError(err instanceof CheckoutError ? err.message : 'Não foi possível enviar o pedido. Tente de novo.');
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col" aria-describedby={error ? `${uid}-err` : undefined}>
      <div className="scroll-cream min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 md:px-8">
        <button type="button" onClick={onBack} className="cond text-sm font-bold tracking-[0.1em] text-ink-soft uppercase underline underline-offset-4 hover:text-mustard">
          ← Voltar para a sacola
        </button>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-name`} className={labelCls}>
              Seu nome
            </label>
            <input id={`${uid}-name`} className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} required />
          </div>
          <div>
            <label htmlFor={`${uid}-phone`} className={labelCls}>
              Telefone (WhatsApp)
            </label>
            <input id={`${uid}-phone`} className={input} value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} inputMode="tel" autoComplete="tel-national" placeholder="(11) 90000-0000" required />
          </div>
        </div>

        {ordering.delivery && ordering.pickup && (
          <fieldset>
            <legend className={labelCls}>Como você quer receber?</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  ['entrega', 'Entrega'],
                  ['retirada', 'Retirar no local'],
                ] as const
              ).map(([id, label]) => (
                <label key={id} className={choice}>
                  <input type="radio" name={`${uid}-mode`} className="sr-only" checked={mode === id} onChange={() => setMode(id)} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {mode === 'entrega' && (
          <div className="space-y-4">
            {ordering.areas.length > 0 && (
              <div>
                <label htmlFor={`${uid}-area`} className={labelCls}>
                  Bairro
                </label>
                <select id={`${uid}-area`} className={`${input} cursor-pointer`} value={areaId} onChange={(e) => setAreaId(e.target.value)} required>
                  <option value="">Escolha o bairro</option>
                  {ordering.areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · entrega {a.fee ? formatBRL(a.fee) : 'grátis'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor={`${uid}-street`} className={labelCls}>
                Endereço
              </label>
              <input id={`${uid}-street`} className={input} value={street} onChange={(e) => setStreet(e.target.value)} autoComplete="street-address" maxLength={200} placeholder="Rua, número e complemento" required />
            </div>
            <div>
              <label htmlFor={`${uid}-ref`} className={labelCls}>
                Ponto de referência <span className="font-medium text-ink-mute normal-case">(opcional)</span>
              </label>
              <input id={`${uid}-ref`} className={input} value={reference} onChange={(e) => setReference(e.target.value)} maxLength={120} />
            </div>
          </div>
        )}

        <fieldset>
          <legend className={labelCls}>Pagamento</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {methods.map(([id, label]) => (
              <label key={id} className={choice}>
                <input type="radio" name={`${uid}-pay`} className="sr-only" checked={payment === id} onChange={() => setPayment(id)} />
                {label}
              </label>
            ))}
          </div>
          {ordering.payments.pix && feePending && <p className="mt-2 text-sm text-ink-mute">Pix pelo site só para retirada: a taxa de entrega é confirmada pela loja.</p>}
          {payment === 'pix' && <p className="mt-2 text-sm text-ink-soft">Você paga agora com o QR code ou o Pix copia e cola. O pedido vai para a cozinha assim que o pagamento for confirmado.</p>}
          {payment === 'pix' && !ordering.pixDemo && (
            <div className="mt-3">
              <label htmlFor={`${uid}-email`} className={labelCls}>
                E-mail para o comprovante
              </label>
              <input id={`${uid}-email`} type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={120} />
            </div>
          )}
          {payment === 'dinheiro' && (
            <div className="mt-3">
              <label htmlFor={`${uid}-change`} className={labelCls}>
                Troco para quanto? <span className="font-medium text-ink-mute normal-case">(deixe vazio se não precisar)</span>
              </label>
              <input id={`${uid}-change`} className={input} inputMode="decimal" value={change} onChange={(e) => setChange(e.target.value)} placeholder="Ex.: 100" />
            </div>
          )}
        </fieldset>

        {ordering.coupons && (
          <div>
            <label htmlFor={`${uid}-coupon`} className={labelCls}>
              Cupom de desconto <span className="font-medium text-ink-mute normal-case">(opcional)</span>
            </label>
            {coupon ? (
              <div className="mt-2 flex min-h-13 items-center justify-between gap-3 rounded-2xl border-2 border-brand px-4">
                <span className="cond text-base font-bold tracking-[0.04em] uppercase">
                  {coupon.code} <span className="text-mustard">{coupon.freeDelivery ? 'entrega grátis' : `− ${formatBRL(coupon.discount)}`}</span>
                </span>
                <button
                  type="button"
                  className="text-sm text-ink-soft underline underline-offset-4 hover:text-mustard"
                  onClick={() => {
                    setCoupon(null);
                    setCouponText('');
                  }}
                >
                  Remover
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <input
                  id={`${uid}-coupon`}
                  className={`${input.replace('mt-2 ', '')} uppercase`}
                  value={couponText}
                  onChange={(e) => setCouponText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void applyCoupon();
                    }
                  }}
                  maxLength={20}
                  autoComplete="off"
                  autoCapitalize="characters"
                  aria-invalid={couponMsg ? true : undefined}
                  aria-describedby={couponMsg ? `${uid}-coupon-msg` : undefined}
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={checking || !couponText.trim()}
                  className="cond min-h-13 shrink-0 cursor-pointer rounded-2xl border-2 border-ink/30 px-5 text-base font-bold tracking-[0.06em] uppercase hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checking ? '…' : 'Aplicar'}
                </button>
              </div>
            )}
            {coupon?.freeDelivery && mode === 'retirada' && <p className="mt-2 text-sm text-ink-soft">Esse cupom vale só para entrega.</p>}
            {coupon?.freeDelivery && mode === 'entrega' && feePending && <p className="mt-2 text-sm text-ink-soft">A loja confirma a entrega grátis junto com a taxa.</p>}
            {couponMsg && (
              <p id={`${uid}-coupon-msg`} className="mt-2 text-sm font-semibold text-brand">
                {couponMsg}
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor={`${uid}-note`} className={labelCls}>
            Observações do pedido <span className="font-medium text-ink-mute normal-case">(opcional)</span>
          </label>
          <textarea
            id={`${uid}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={200}
            className="mt-2 w-full resize-none rounded-2xl border-2 border-ink/15 bg-white/5 px-4 py-3 text-base outline-none focus-visible:border-ink"
          />
        </div>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[var(--color-brand)]" />
          <span className="text-[0.95rem] leading-snug">
            Quero receber promoções do {restaurant.name} no WhatsApp.
            <span className="block text-sm text-ink-mute">Até duas mensagens por mês. Para sair, é só responder SAIR.</span>
          </span>
        </label>
      </div>

      <footer className="border-t-2 border-ink bg-paper px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)] md:px-8 md:pb-8">
        <dl className="space-y-1 text-ink-soft">
          <div className="flex items-baseline justify-between">
            <dt>Subtotal</dt>
            <dd className="cond tabular text-lg font-semibold">{formatBRL(cart.total)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex items-baseline justify-between">
              <dt>Cupom {coupon?.code}</dt>
              <dd className="cond tabular text-lg font-semibold text-mustard">− {formatBRL(discount)}</dd>
            </div>
          )}
          {mode === 'entrega' && (
            <div className="flex items-baseline justify-between">
              <dt>Entrega</dt>
              <dd className="cond tabular text-lg font-semibold">{feePending ? 'a confirmar pela loja' : area ? (fee ? formatBRL(fee) : 'grátis') : 'escolha o bairro'}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between text-ink">
            <dt className="display text-[1.7rem]">Total</dt>
            <dd className="display tabular text-[2rem]">{formatBRL(total)}</dd>
          </div>
        </dl>
        {ordering.eta && <p className="mt-1 text-xs text-ink-mute">Tempo estimado: {ordering.eta}.</p>}
        {belowMin && <p className="mt-2 text-sm font-semibold text-brand">Pedido mínimo de {formatBRL(ordering.minOrder)}.</p>}
        {error && (
          <p id={`${uid}-err`} role="alert" className="mt-2 text-sm font-semibold text-brand">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={sending || belowMin || cart.count === 0}
          className="cond mt-3 inline-flex min-h-15 w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-brand text-xl font-bold tracking-[0.06em] text-on-dark uppercase transition-[background-color,transform] duration-200 hover:bg-brand-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? 'Enviando…' : payment === 'pix' ? 'Gerar Pix' : 'Fazer pedido'}
          {!sending && <ArrowRightIcon size={20} />}
        </button>
      </footer>
    </form>
  );
}

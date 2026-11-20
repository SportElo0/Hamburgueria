'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { lastOrder, trackingPath } from '@/lib/checkout';
import { useCatalog } from '@/content/live';
import { resolveSelections, unitPrice } from '@/lib/cart';
import { formatBRL } from '@/lib/money';
import { buildOrderMessage, whatsappUrl, type OrderMode } from '@/lib/order';
import { useCart, useUi } from '../Providers';
import { Star } from '../brand/Brand';
import { ArrowRightIcon, BagIcon, ChatIcon, CheckIcon, CloseIcon, CopyIcon, EditIcon, TrashIcon } from '../ui/Icons';
import { Stepper, useNativeDialog } from '../ui/primitives';
import { Checkout } from './Checkout';

export function CartDrawer() {
  const ui = useUi();
  const close = () => ui.setCartOpen(false);
  const ref = useNativeDialog(ui.cartOpen, close, 300);

  return (
    <dialog
      ref={ref}
      aria-labelledby="cart-title"
      className="cart-drawer m-0 mt-auto h-[92dvh] w-full overflow-clip rounded-t-[28px] bg-paper p-0 text-ink md:mt-0 md:ml-auto md:h-dvh md:w-[min(520px,100vw)] md:rounded-none md:rounded-l-[28px]"
    >
      <CartBody onClose={close} />
    </dialog>
  );
}

function CartBody({ onClose }: { onClose: () => void }) {
  const cart = useCart();
  const ui = useUi();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<OrderMode>('entrega');
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState(false);
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  // Undo lives inside the drawer: the global toast renders under the modal's top layer.
  const [removed, setRemoved] = useState<{ name: string; restore: () => void } | null>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!removed) return;
    undoRef.current?.focus();
    const t = window.setTimeout(() => setRemoved(null), 8000);
    return () => window.clearTimeout(t);
  }, [removed]);

  const message = useMemo(
    () => buildOrderMessage(cart.lines, cart.lookup, { customerName: name, note, mode, address }),
    [cart.lines, cart.lookup, name, note, mode, address],
  );
  const catalog = useCatalog();
  const whatsapp = catalog.restaurant.whatsappNumber;
  const live = Boolean(whatsapp);
  // With online ordering on in the panel, the order is finished here and sent to the store, not to WhatsApp.
  const ordering = catalog.ordering;
  const [step, setStep] = useState<'sacola' | 'finalizar'>('sacola');
  const checkingOut = Boolean(ordering) && step === 'finalizar' && cart.lines.length > 0;

  const guard = () => {
    if (mode === 'entrega' && !address.trim()) {
      setAddressError(true);
      document.getElementById('order-address')?.focus();
      return false;
    }
    return true;
  };

  const send = () => {
    if (!guard()) return;
    if (whatsapp) {
      window.open(whatsappUrl(whatsapp, message), '_blank', 'noopener');
    } else {
      setPreview(true);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const goToMenu = () => {
    onClose();
    document.getElementById('cardapio')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b-[5px] border-double border-ink px-5 pt-5 pb-4 md:px-8 md:pt-8">
        <h2 id="cart-title" className="display flex items-center gap-3 text-[2.6rem]">
          {checkingOut ? 'Finalizar' : 'Sua sacola'}
          {cart.count > 0 && <span className="cond tabular rounded-full bg-ink px-2.5 py-0.5 text-lg tracking-wide text-on-dark">{cart.count}</span>}
        </h2>
        <button type="button" onClick={onClose} aria-label="Fechar sacola" className="grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-ink/8">
          <CloseIcon size={22} />
        </button>
      </header>

      {removed && (
        <div role="status" className="flex items-center gap-3 border-b border-ink/12 bg-cream-deep/70 px-5 py-2 md:px-8">
          <p className="min-w-0 flex-1 text-[0.95rem] font-medium">{removed.name} removido da sacola.</p>
          <button
            ref={undoRef}
            type="button"
            onClick={() => {
              removed.restore();
              setRemoved(null);
            }}
            className="cond min-h-11 shrink-0 cursor-pointer rounded-full bg-ink px-5 text-sm font-bold tracking-wide text-on-dark uppercase transition-colors hover:bg-brand"
          >
            Desfazer
          </button>
        </div>
      )}

      {checkingOut && ordering ? (
        <Checkout ordering={ordering} onBack={() => setStep('sacola')} onPlaced={onClose} />
      ) : cart.lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-cream-deep text-ink-soft">
            <BagIcon size={34} />
          </span>
          <p className="display text-[2rem]">Nada por aqui ainda</p>
          <p className="max-w-[30ch] text-ink-soft">Escolha um burger, uma porção ou uma bebida e ele aparece aqui.</p>
          <LastOrderLink onClose={onClose} />
          <button
            type="button"
            onClick={goToMenu}
            className="cond inline-flex min-h-13 cursor-pointer items-center gap-2 rounded-full bg-ink px-7 text-lg font-bold tracking-[0.06em] text-on-dark uppercase transition-colors hover:bg-brand"
          >
            Ver cardápio <ArrowRightIcon size={18} />
          </button>
        </div>
      ) : (
        <>
          <div className="scroll-cream min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 md:px-8">
            <ul aria-label="Itens da sacola">
              {cart.lines.map((line) => {
                const p = cart.lookup(line.productId);
                if (!p) return null;
                const sel = resolveSelections(p, line.selections);
                const img = sel.find((s) => 'image' in s.choice && s.choice.image)?.choice as { image?: string } | undefined;
                return (
                  <li key={line.lineId} className="flex gap-4 border-b border-ink/12 py-5">
                    {img?.image || p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img?.image ?? p.image} alt="" className="h-20 w-20 shrink-0 rounded-2xl bg-cream-deep object-contain p-1" loading="lazy" />
                    ) : (
                      <span aria-hidden="true" className="display grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-brand/40 bg-cream-deep text-[2rem] text-brand">
                        {p.name.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="display text-[1.5rem] leading-[0.95]">{p.name}</p>
                        <p className="cond tabular shrink-0 text-lg font-bold">{formatBRL(unitPrice(p, line.selections) * line.quantity)}</p>
                      </div>
                      {sel.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5 text-sm text-ink-soft">
                          {sel.map(({ group, choice }) => (
                            <li key={group.id + choice.id}>
                              {group.id === 'adicionais' ? `+ ${choice.label}` : `${group.label.replace(/ incluso$/i, '')}: ${choice.label}`}
                              {group.included ? ' (incluso)' : choice.priceDelta && !group.variant ? ` · ${formatBRL(choice.priceDelta)}` : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                      {line.notes && <p className="mt-1 text-sm text-ink-soft italic">“{line.notes}”</p>}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Stepper value={line.quantity} onChange={(v) => cart.setQuantity(line.lineId, v)} label={`Quantidade de ${p.name}`} size="sm" />
                        {p.options?.length ? (
                          <button
                            type="button"
                            onClick={() => ui.openProduct({ productId: p.id, lineId: line.lineId })}
                            className="cond inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-bold tracking-wide uppercase transition-colors hover:bg-ink/8"
                          >
                            <EditIcon size={16} /> Editar
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            cart.remove(line.lineId);
                            setRemoved({ name: p.name, restore: () => cart.add(p.id, line.quantity, line.selections, line.notes) });
                          }}
                          className="cond ml-auto inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-bold tracking-wide text-brand uppercase transition-colors hover:bg-brand/8"
                        >
                          <TrashIcon size={16} /> Remover
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {!ordering && (
            <div className="mt-6 space-y-5 pb-6">
              <fieldset>
                <legend className="cond text-sm font-bold tracking-[0.1em] uppercase">Como você quer receber?</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(
                    [
                      ['entrega', 'Entrega'],
                      ['retirada', 'Retirar no local'],
                    ] as const
                  ).map(([id, label]) => (
                    <label
                      key={id}
                      className="cond flex min-h-13 cursor-pointer items-center justify-center rounded-2xl border-2 border-ink/15 px-3 text-base font-bold tracking-[0.04em] uppercase transition-colors hover:border-ink/40 has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-on-dark has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"
                    >
                      <input
                        type="radio"
                        name="order-mode"
                        value={id}
                        checked={mode === id}
                        onChange={() => {
                          setMode(id);
                          setAddressError(false);
                        }}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              {mode === 'entrega' && (
                <div>
                  <label htmlFor="order-address" className="cond block text-sm font-bold tracking-[0.1em] uppercase">
                    Endereço de entrega
                  </label>
                  <textarea
                    id="order-address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (e.target.value.trim()) setAddressError(false);
                    }}
                    rows={2}
                    maxLength={200}
                    autoComplete="street-address"
                    aria-invalid={addressError}
                    aria-describedby={addressError ? 'order-address-err' : 'order-address-hint'}
                    className="mt-2 w-full resize-none rounded-2xl border-2 border-ink/15 bg-white/5 px-4 py-3 text-base outline-none focus-visible:border-ink aria-invalid:border-brand"
                  />
                  {addressError ? (
                    <p id="order-address-err" role="alert" className="mt-1.5 text-sm font-semibold text-brand">
                      Informe o endereço para a entrega, ou escolha retirar no local.
                    </p>
                  ) : (
                    <p id="order-address-hint" className="mt-1.5 text-sm text-ink-mute">
                      Rua, número, bairro e um ponto de referência.
                    </p>
                  )}
                </div>
              )}
              <div>
                <label htmlFor="order-name" className="cond block text-sm font-bold tracking-[0.1em] uppercase">
                  Seu nome <span className="font-medium text-ink-mute normal-case">(opcional)</span>
                </label>
                <input
                  id="order-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="given-name"
                  maxLength={60}
                  className="mt-2 h-13 w-full rounded-2xl border-2 border-ink/15 bg-white/5 px-4 text-base outline-none focus-visible:border-ink"
                />
              </div>
              <div>
                <label htmlFor="order-note" className="cond block text-sm font-bold tracking-[0.1em] uppercase">
                  Observações do pedido <span className="font-medium text-ink-mute normal-case">(opcional)</span>
                </label>
                <textarea
                  id="order-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  maxLength={200}
                  className="mt-2 w-full resize-none rounded-2xl border-2 border-ink/15 bg-white/5 px-4 py-3 text-base outline-none focus-visible:border-ink"
                />
              </div>
            </div>
            )}
            {ordering && <div className="pb-6" />}
          </div>

          {ordering ? (
            <footer className="border-t-2 border-ink bg-paper px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)] md:px-8 md:pb-8">
              <div className="flex items-baseline justify-between">
                <span className="display text-[1.7rem]">Subtotal</span>
                <span className="display tabular text-[2rem]">{formatBRL(cart.total)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-mute">Entrega e pagamento na próxima etapa. O pedido vai direto para o El Patron.</p>
              {!ordering.open && (
                <p role="status" className="mt-3 rounded-xl bg-brand/15 px-3 py-2 text-sm font-semibold text-ink">
                  A loja está fechada agora. Você pode montar a sacola e pedir quando abrir.
                </p>
              )}
              <button
                type="button"
                disabled={!ordering.open}
                onClick={() => setStep('finalizar')}
                className="cond mt-3 inline-flex min-h-15 w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-brand text-xl font-bold tracking-[0.06em] text-on-dark uppercase transition-[background-color,transform] duration-200 hover:bg-brand-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ordering.open ? 'Continuar' : 'Loja fechada'} {ordering.open && <ArrowRightIcon size={20} />}
              </button>
            </footer>
          ) : (
          <footer className="border-t-2 border-ink bg-paper px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)] md:px-8 md:pb-8">
            <dl className="space-y-1">
              <div className="flex items-baseline justify-between text-ink-soft [@media(max-height:760px)]:hidden">
                <dt>Subtotal</dt>
                <dd className="cond tabular text-lg font-semibold">{formatBRL(cart.total)}</dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="display text-[1.9rem]">Total</dt>
                <dd className="display tabular text-[2.2rem]">{formatBRL(cart.total)}</dd>
              </div>
            </dl>
            <p className="mt-1 text-xs text-ink-mute">Taxa de entrega e forma de pagamento são combinadas com o El Patron pelo WhatsApp.</p>

            {!live && (
              <p className="mt-3 rounded-xl bg-mustard/30 px-3 py-2 text-sm text-ink [@media(max-height:760px)]:mt-2 [@media(max-height:760px)]:py-1.5 [@media(max-height:760px)]:text-xs">
                <strong className="font-bold">Modo demonstração.</strong> O WhatsApp oficial ainda não foi configurado, então nenhum pedido é enviado. Você pode gerar e copiar a mensagem.
              </p>
            )}

            {preview && !live ? (
              <div className="mt-3">
                <pre className="scroll-cream max-h-44 overflow-auto rounded-2xl bg-ink p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-on-dark">{message}</pre>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={copy}
                    className="cond inline-flex min-h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-ink text-lg font-bold tracking-[0.06em] text-on-dark uppercase transition-colors hover:bg-brand"
                  >
                    {copied ? <CheckIcon size={20} /> : <CopyIcon size={20} />}
                    {copied ? 'Copiada' : 'Copiar mensagem'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreview(false)}
                    className="cond min-h-14 cursor-pointer rounded-full border-2 border-ink/20 px-5 text-base font-bold tracking-wide uppercase transition-colors hover:border-ink"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={send}
                className="cond mt-3 inline-flex min-h-15 w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-brand text-xl font-bold tracking-[0.06em] text-on-dark uppercase transition-[background-color,transform] duration-200 hover:bg-brand-deep active:scale-[0.98]"
              >
                {live ? <ChatIcon size={22} /> : <Star size={14} className="text-mustard" />}
                {live ? 'Enviar pedido pelo WhatsApp' : 'Gerar mensagem do pedido'}
              </button>
            )}
          </footer>
          )}
        </>
      )}
    </div>
  );
}

const noSubscribe = () => () => {};

/** A way back to the order placed on this device in the last day. */
function LastOrderLink({ onClose }: { onClose: () => void }) {
  const raw = useSyncExternalStore(
    noSubscribe,
    () => JSON.stringify(lastOrder()),
    () => 'null',
  );
  const last = JSON.parse(raw) as ReturnType<typeof lastOrder>;
  if (!last) return null;
  return (
    <Link href={trackingPath(last.id, last.token)} onClick={onClose} className="cond text-base font-bold tracking-[0.08em] text-mustard uppercase underline underline-offset-4">
      Acompanhar meu último pedido
    </Link>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useCatalog } from '@/content/live';
import { resolveSelections, unitPrice } from '@/lib/cart';
import { formatBRL } from '@/lib/money';
import { buildOrderMessage, whatsappUrl } from '@/lib/order';
import { useCart, useUi } from '../Providers';
import { Star } from '../brand/Brand';
import { ArrowRightIcon, BagIcon, ChatIcon, CheckIcon, CloseIcon, CopyIcon, EditIcon, TrashIcon } from '../ui/Icons';
import { Stepper, useNativeDialog } from '../ui/primitives';

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
  const [adult, setAdult] = useState(false);
  const [adultError, setAdultError] = useState(false);
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

  const hasAlcohol = cart.lines.some((l) => cart.lookup(l.productId)?.alcoholic);
  const message = useMemo(() => buildOrderMessage(cart.lines, cart.lookup, { customerName: name, note }), [cart.lines, cart.lookup, name, note]);
  const whatsapp = useCatalog().restaurant.whatsappNumber;
  const live = Boolean(whatsapp);

  const guard = () => {
    if (hasAlcohol && !adult) {
      setAdultError(true);
      document.getElementById('adult-check')?.focus();
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
          Sua sacola
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

      {cart.lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-cream-deep text-ink-soft">
            <BagIcon size={34} />
          </span>
          <p className="display text-[2rem]">Nada por aqui ainda</p>
          <p className="max-w-[30ch] text-ink-soft">Escolha um burger, uma porção ou uma bebida e ele aparece aqui.</p>
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img?.image ?? p.image} alt="" className="h-20 w-20 shrink-0 rounded-2xl bg-cream-deep object-contain p-1" loading="lazy" />
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
                              {group.included ? ' (incluso)' : choice.priceDelta ? ` · ${formatBRL(choice.priceDelta)}` : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                      {line.notes && <p className="mt-1 text-sm text-ink-soft italic">“{line.notes}”</p>}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Stepper value={line.quantity} onChange={(v) => cart.setQuantity(line.lineId, v)} label={`Quantidade de ${p.name}`} size="sm" />
                        {p.options?.length || p.category === 'burgers' ? (
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

            <div className="mt-6 space-y-5 pb-6">
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
                  className="mt-2 h-13 w-full rounded-2xl border-2 border-ink/15 bg-white/60 px-4 text-base outline-none focus-visible:border-ink"
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
                  className="mt-2 w-full resize-none rounded-2xl border-2 border-ink/15 bg-white/60 px-4 py-3 text-base outline-none focus-visible:border-ink"
                />
              </div>
              {hasAlcohol && (
                <div className="rounded-2xl border-2 border-ink/15 p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      id="adult-check"
                      type="checkbox"
                      checked={adult}
                      onChange={(e) => {
                        setAdult(e.target.checked);
                        setAdultError(false);
                      }}
                      aria-describedby="adult-help"
                      aria-invalid={adultError}
                      className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-ink"
                    />
                    <span className="text-[0.98rem] font-medium">Declaro que tenho 18 anos ou mais.</span>
                  </label>
                  <p id="adult-help" className="mt-2 text-sm text-ink-soft">
                    Seu pedido tem bebida alcoólica. Venda proibida para menores de 18 anos. Esta é apenas uma declaração: o restaurante pode pedir documento com foto.
                  </p>
                  {adultError && (
                    <p role="alert" className="mt-2 text-sm font-semibold text-brand">
                      Confirme a declaração de maioridade ou remova as long necks para continuar.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

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
            <p className="mt-1 text-xs text-ink-mute">Taxa de entrega e forma de pagamento são combinadas com o restaurante.</p>

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
        </>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useCatalog } from '@/content/live';
import { formatBRL } from '@/lib/money';
import { CheckoutError, fetchOrder, simulatePix, type OrderStatus, type TrackedOrder } from '@/lib/checkout';
import { Logo } from '../brand/Brand';
import { CheckIcon, ChatIcon, CopyIcon } from '../ui/Icons';

const POLL_MS = 5000;
const FINAL: OrderStatus[] = ['concluido', 'recusado', 'expirado'];

const STEPS = {
  entrega: [
    ['novo', 'Recebido'],
    ['preparo', 'Em preparo'],
    ['saiu', 'Saiu para entrega'],
    ['concluido', 'Entregue'],
  ],
  retirada: [
    ['novo', 'Recebido'],
    ['preparo', 'Em preparo'],
    ['pronto', 'Pronto para retirar'],
    ['concluido', 'Retirado'],
  ],
} as const;

const time = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

/** Reads ?id=…&t=… on the client (the page is static). */
function useParams() {
  const search = useSyncExternalStore(
    () => () => {},
    () => window.location.search,
    () => '',
  );
  const q = new URLSearchParams(search);
  return { id: q.get('id') ?? '', token: q.get('t') ?? '' };
}

function useCountdown(until: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [until]);
  if (!until) return '';
  const left = Math.max(0, Date.parse(until) - now);
  return `${Math.floor(left / 60_000)}:${String(Math.floor((left % 60_000) / 1000)).padStart(2, '0')}`;
}

export function OrderTracking() {
  const { id, token } = useParams();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const whatsapp = useCatalog().restaurant.whatsappNumber;

  const load = useCallback(async () => {
    if (!id || !token) return;
    try {
      setOrder(await fetchOrder(id, token));
      setError('');
    } catch (err) {
      setError(err instanceof CheckoutError ? err.message : 'Não foi possível carregar o pedido.');
    }
  }, [id, token]);

  const done = order ? FINAL.includes(order.status) : false;
  useEffect(() => {
    if (!id || !token || done) return;
    const first = window.setTimeout(load, 0);
    const t = window.setInterval(load, POLL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [id, token, done, load]);

  const pix = order?.payment.pix ?? null;
  const countdown = useCountdown(pix?.expiresAt ?? null);

  const copy = async () => {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.copyPaste);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const simulate = async () => {
    setSimulating(true);
    try {
      setOrder(await simulatePix(id, token));
    } catch (err) {
      setError(err instanceof CheckoutError ? err.message : 'Não foi possível simular agora.');
    }
    setSimulating(false);
  };

  return (
    <main className="min-h-dvh bg-cream pb-20 text-ink">
      <header className="border-b border-brand/20">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link href="/" aria-label="El Patron Burger: voltar ao site">
            <Logo alt="" className="h-10 w-auto" />
          </Link>
          <Link href="/#cardapio" className="cond text-sm font-bold tracking-[0.12em] uppercase hover:text-mustard">
            Cardápio
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 pt-10">
        {!id || !token ? (
          <Empty text="Link de pedido incompleto. Abra o link que apareceu quando você fez o pedido." />
        ) : !order ? (
          error ? <Empty text={error} /> : <p className="text-ink-soft">Carregando seu pedido…</p>
        ) : (
          <>
            <p className="cond text-sm font-bold tracking-[0.3em] text-brand uppercase">Pedido #{order.number}</p>
            <h1 className="display gold-foil mt-2 text-[clamp(2.2rem,8vw,3.6rem)]">{headline(order)}</h1>
            <p className="mt-2 text-ink-soft">{subline(order)}</p>
            {error && (
              <p role="alert" className="mt-3 text-sm font-semibold text-brand">
                {error}
              </p>
            )}

            {order.status === 'aguardando-pix' && pix && (
              <section aria-labelledby="pix-title" className="mt-8 rounded-[24px] border border-brand/50 bg-paper p-5 md:p-7">
                <h2 id="pix-title" className="display text-[1.6rem]">
                  Pague com Pix
                </h2>
                {pix.demo && (
                  <p className="mt-2 rounded-xl bg-mustard/20 px-3 py-2 text-sm font-semibold">Pix de demonstração: nenhum valor é cobrado. Use “Simular pagamento” para ver o resto do caminho.</p>
                )}
                <div className="mt-4 grid items-center gap-5 sm:grid-cols-[auto_1fr]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`data:image/png;base64,${pix.qrBase64}`} alt="QR code do Pix" width={220} height={220} className="mx-auto rounded-xl bg-white p-2" />
                  <div>
                    <p className="display tabular text-[2rem]">{formatBRL(order.total)}</p>
                    <p className="text-sm text-ink-soft">Expira em {countdown}. Abra o app do banco, escolha Pix e leia o QR code, ou copie o código.</p>
                    <button
                      type="button"
                      onClick={copy}
                      className="cond mt-4 inline-flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-mustard px-6 text-lg font-bold tracking-[0.06em] text-on-dark uppercase transition-colors hover:bg-ink"
                    >
                      {copied ? <CheckIcon size={20} /> : <CopyIcon size={20} />}
                      {copied ? 'Código copiado' : 'Copiar Pix copia e cola'}
                    </button>
                    {pix.demo && (
                      <button
                        type="button"
                        onClick={simulate}
                        disabled={simulating}
                        className="cond mt-2 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full border-2 border-ink/30 px-6 text-base font-bold tracking-[0.06em] uppercase transition-colors hover:border-ink disabled:opacity-60"
                      >
                        {simulating ? 'Confirmando…' : 'Simular pagamento (teste)'}
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-xs text-ink-mute">Esta página atualiza sozinha quando o pagamento é confirmado.</p>
              </section>
            )}

            {!['aguardando-pix', 'expirado', 'recusado'].includes(order.status) && <Progress order={order} />}

            <section aria-labelledby="resumo" className="mt-8 rounded-[24px] border border-brand/25 bg-paper p-5 md:p-7">
              <h2 id="resumo" className="display text-[1.4rem]">
                Resumo
              </h2>
              <ul className="mt-3 divide-y divide-brand/15">
                {order.lines.map((l, i) => (
                  <li key={i} className="flex justify-between gap-4 py-2.5">
                    <span>
                      <strong className="font-semibold">
                        {l.quantity}× {l.name}
                      </strong>
                      {l.options.length > 0 && <span className="block text-sm text-ink-soft">{l.options.map((x) => (x.group === 'Adicionais' ? `+ ${x.label}` : `${x.group}: ${x.label}`)).join(' · ')}</span>}
                      {l.notes && <span className="block text-sm text-ink-soft italic">“{l.notes}”</span>}
                    </span>
                    <span className="cond tabular shrink-0 font-semibold">{formatBRL(l.total)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1 border-t border-brand/25 pt-3 text-ink-soft">
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <dt>Cupom {order.coupon}</dt>
                    <dd className="cond tabular text-mustard">− {formatBRL(order.discount)}</dd>
                  </div>
                )}
                {order.mode === 'entrega' && (
                  <div className="flex justify-between">
                    <dt>Entrega</dt>
                    <dd className="cond tabular">{order.feePending ? 'a confirmar pela loja' : order.deliveryFee ? formatBRL(order.deliveryFee) : 'grátis'}</dd>
                  </div>
                )}
                <div className="flex justify-between text-ink">
                  <dt className="display text-[1.3rem]">Total</dt>
                  <dd className="display tabular text-[1.5rem]">{formatBRL(order.total)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-ink-soft">
                {order.mode === 'entrega' ? `Entrega em: ${order.address?.area ? `${order.address.area}, ` : ''}${order.address?.street ?? ''}` : 'Retirada no local'}
                <br />
                Pagamento: {paymentText(order)}
              </p>
            </section>

            <div className="mt-8 flex flex-wrap gap-3">
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Olá! Sobre o meu pedido #${order.number} feito pelo site.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cond inline-flex min-h-13 items-center gap-2 rounded-full border-2 border-brand/50 px-6 text-base font-bold tracking-[0.06em] uppercase transition-colors hover:border-mustard hover:text-mustard"
                >
                  <ChatIcon size={18} /> Falar com a loja
                </a>
              )}
              {done && (
                <Link href="/#cardapio" className="cond inline-flex min-h-13 items-center rounded-full bg-mustard px-6 text-base font-bold tracking-[0.06em] text-on-dark uppercase transition-colors hover:bg-ink">
                  Fazer outro pedido
                </Link>
              )}
            </div>
            <p className="mt-6 text-xs text-ink-mute">Guarde este link para acompanhar o pedido. Feito às {time(order.createdAt)}.</p>
          </>
        )}
      </div>
    </main>
  );
}

function headline(o: TrackedOrder) {
  switch (o.status) {
    case 'aguardando-pix':
      return 'Falta só o Pix';
    case 'novo':
      return 'Pedido recebido';
    case 'preparo':
      return 'Na chapa';
    case 'saiu':
      return 'Saiu para entrega';
    case 'pronto':
      return 'Pronto para retirar';
    case 'concluido':
      return o.mode === 'entrega' ? 'Entregue. Bom apetite!' : 'Retirado. Bom apetite!';
    case 'recusado':
      return 'Pedido não aceito';
    case 'expirado':
      return 'O Pix expirou';
  }
}

function subline(o: TrackedOrder) {
  switch (o.status) {
    case 'aguardando-pix':
      return 'Assim que o pagamento cair, o pedido vai para a cozinha.';
    case 'novo':
      return o.payment.status === 'pago' ? 'Pix confirmado. Aguardando a loja aceitar o pedido.' : 'Aguardando a loja aceitar o pedido.';
    case 'preparo':
      return 'A loja aceitou e já está preparando.';
    case 'saiu':
      return 'O entregador está a caminho.';
    case 'pronto':
      return 'Pode vir buscar no balcão.';
    case 'concluido':
      return 'Obrigado por pedir no El Patron.';
    case 'recusado':
      return `${o.reason ? `Motivo: ${o.reason}. ` : ''}${o.payment.method === 'pix' && o.payment.status !== 'pendente' ? 'O valor do Pix será devolvido.' : ''}`;
    case 'expirado':
      return 'O pagamento não foi feito a tempo e o pedido foi cancelado. Você pode pedir de novo.';
  }
}

function paymentText(o: TrackedOrder) {
  if (o.payment.method === 'pix') return o.payment.status === 'pago' ? 'Pix (pago)' : o.payment.status === 'devolvido' ? 'Pix (devolvido)' : 'Pix';
  if (o.payment.method === 'cartao') return o.mode === 'entrega' ? 'cartão na entrega' : 'cartão no balcão';
  return `dinheiro${o.payment.changeFor ? ` (troco para ${formatBRL(o.payment.changeFor)})` : ''}`;
}

function Progress({ order }: { order: TrackedOrder }) {
  const steps = STEPS[order.mode];
  const reached = (s: OrderStatus) => order.history.find((h) => h.status === s);
  const current = steps.findIndex(([s]) => s === order.status);
  return (
    <ol aria-label="Andamento do pedido" className="mt-8 grid gap-3 sm:grid-cols-4">
      {steps.map(([s, label], i) => {
        const hit = reached(s);
        const active = i === current;
        return (
          <li key={s} aria-current={active ? 'step' : undefined} className={`rounded-2xl border p-4 ${hit ? 'border-mustard bg-mustard/10' : 'border-brand/20'} ${active ? 'ring-2 ring-mustard' : ''}`}>
            <span className={`grid h-8 w-8 place-items-center rounded-full ${hit ? 'bg-mustard text-on-dark' : 'border-2 border-brand/30 text-ink-mute'}`}>
              {hit ? <CheckIcon size={16} /> : <span className="cond text-sm font-bold">{i + 1}</span>}
            </span>
            <p className="cond mt-2 text-base font-bold tracking-[0.04em] uppercase">{label}</p>
            {hit && <p className="text-xs text-ink-mute">{time(hit.at)}</p>}
          </li>
        );
      })}
    </ol>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-brand/25 bg-paper p-8 text-center">
      <p className="text-lg">{text}</p>
      <Link href="/#cardapio" className="cond mt-5 inline-flex min-h-13 items-center rounded-full bg-mustard px-6 text-base font-bold tracking-[0.06em] text-on-dark uppercase hover:bg-ink">
        Ir para o cardápio
      </Link>
    </div>
  );
}

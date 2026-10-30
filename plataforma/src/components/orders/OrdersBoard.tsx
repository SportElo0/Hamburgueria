'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { StaffOrder } from '@/app/api/loja/[slug]/pedidos/route';
import { orderAction, setOpenAction, setSoldOutAction } from '@/app/loja/[slug]/actions';
import { STATUS_LABEL, brl, type OperatorAction, type OrderStatus } from '@/lib/ordering';
import type { Operation } from '@/lib/orders';

const POLL_MS = 5000;
const RING_MS = 7000;

type Column = 'novos' | 'preparo' | 'saida' | 'finalizados';
const COLUMNS: { id: Column; label: string; statuses: OrderStatus[] }[] = [
  { id: 'novos', label: 'Novos', statuses: ['novo', 'aguardando-pix'] },
  { id: 'preparo', label: 'Em preparo', statuses: ['preparo'] },
  { id: 'saida', label: 'Saiu / pronto', statuses: ['saiu', 'pronto'] },
  { id: 'finalizados', label: 'Finalizados', statuses: ['concluido', 'recusado', 'expirado'] },
];

const MODE_CHIP = { entrega: 'Entrega', retirada: 'Retirada', mesa: 'Salão' } as const;
const time = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
const phoneLabel = (p: string) => (p.length === 11 ? `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}` : `(${p.slice(0, 2)}) ${p.slice(2, 6)}-${p.slice(6)}`);

/** Two short tones; an AudioContext needs one tap on the page before it may play. The floor screen uses it too. */
export function useBell() {
  const ctx = useRef<AudioContext | null>(null);
  const [armed, setArmed] = useState(false);
  const arm = useCallback(() => {
    ctx.current ??= new AudioContext();
    void ctx.current.resume();
    setArmed(true);
  }, []);
  const ring = useCallback(() => {
    const ac = ctx.current;
    if (!ac || ac.state !== 'running') return;
    [0, 0.22].forEach((t, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.frequency.value = i ? 1175 : 880;
      gain.gain.setValueAtTime(0.0001, ac.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.35, ac.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + 0.2);
      osc.connect(gain).connect(ac.destination);
      osc.start(ac.currentTime + t);
      osc.stop(ac.currentTime + t + 0.22);
    });
  }, []);
  return { armed, arm, ring };
}

export interface MenuForStaff {
  id: string;
  name: string;
  items: { id: string; name: string }[];
}

export function OrdersBoard(props: {
  slug: string;
  storeName: string;
  enabled: boolean;
  userName: string;
  team: boolean;
  /** Ordering at the table is on: link to the waiter's floor screen. */
  tables: boolean;
  menu: MenuForStaff[];
  logout: () => Promise<void>;
}) {
  const [orders, setOrders] = useState<StaffOrder[] | null>(null);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [error, setError] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [tab, setTab] = useState<Column>('novos');
  const [printing, setPrinting] = useState<StaffOrder | null>(null);
  const [, startTransition] = useTransition();
  const bell = useBell();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/loja/${props.slug}/pedidos`, { cache: 'no-store' });
      if (res.status === 401) return router.push(`/login?volta=/loja/${props.slug}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { orders: StaffOrder[]; operation: Operation };
      setOrders(data.orders);
      setOperation(data.operation);
      setLastSync(new Date());
      setError('');
    } catch {
      setError('Sem conexão com o servidor. Tentando de novo…');
    }
  }, [props.slug, router]);

  useEffect(() => {
    const first = window.setTimeout(load, 0);
    const t = window.setInterval(load, POLL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [load]);

  const waiting = useMemo(() => (orders ?? []).filter((o) => o.status === 'novo'), [orders]);

  // Rings while any order waits to be accepted, like a kitchen bell; the tab title counts them.
  useEffect(() => {
    document.title = waiting.length ? `(${waiting.length}) Novo pedido · ${props.storeName}` : `Pedidos · ${props.storeName}`;
    if (!waiting.length || !bell.armed) return;
    bell.ring();
    const t = window.setInterval(bell.ring, RING_MS);
    return () => window.clearInterval(t);
  }, [waiting.length, bell, props.storeName]);

  // Print one ticket: render it, let the browser print, then clear.
  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(null);
    window.addEventListener('afterprint', done, { once: true });
    const t = window.setTimeout(() => window.print(), 50);
    return () => window.clearTimeout(t);
  }, [printing]);

  const act = (o: StaffOrder, action: OperatorAction, reason = '') =>
    startTransition(async () => {
      const res = await orderAction(props.slug, o.id, action, reason);
      if (!res.ok) setError(res.error ?? 'Não foi possível atualizar.');
      await load();
    });

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleSoldOut = (itemId: string, out: boolean) => {
    // Flip the switch now; the transition below would hold the update until the server answers.
    setOperation((op) => (op ? { ...op, soldOut: out ? [...op.soldOut, itemId] : op.soldOut.filter((x) => x !== itemId) } : op));
    startTransition(async () => {
      const res = await setSoldOutAction(props.slug, itemId, out);
      if (!res.ok) setError(res.error ?? 'Não foi possível atualizar.');
      await load();
    });
  };

  const toggleOpen = () =>
    startTransition(async () => {
      bell.arm();
      await setOpenAction(props.slug, !operation?.open);
      await load();
    });

  // Unpaid Pix orders wait below the ones to act on: nothing to prepare until the money is in.
  const byColumn = (c: Column) =>
    (orders ?? [])
      .filter((o) => COLUMNS.find((x) => x.id === c)!.statuses.includes(o.status))
      .sort((a, b) => Number(a.status === 'aguardando-pix') - Number(b.status === 'aguardando-pix'));
  const doneToday = (orders ?? []).filter((o) => o.status === 'concluido');

  return (
    <div className="min-h-dvh pb-16" onPointerDown={bell.armed ? undefined : bell.arm}>
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">Pedidos do site</p>
            <h1 className="text-lg font-bold">{props.storeName}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleOpen}
              disabled={!operation || !props.enabled}
              aria-pressed={operation?.open ?? false}
              className={`btn min-h-11 border ${operation?.open ? 'border-ok bg-ok text-white' : 'border-line bg-white text-ink'}`}
            >
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${operation?.open ? 'bg-white' : 'bg-bad'}`} />
              {operation?.open ? 'Loja aberta' : 'Loja fechada'}
            </button>
            <button type="button" onClick={bell.arm} className={`btn min-h-11 border ${bell.armed ? 'border-line bg-white text-ink-mute' : 'border-warn bg-warn text-white'}`}>
              {bell.armed ? 'Som ligado' : 'Ativar som dos pedidos'}
            </button>
            <button type="button" onClick={() => setMenuOpen(true)} className="btn-ghost min-h-11">
              Esgotados{operation?.soldOut.length ? ` (${operation.soldOut.length})` : ''}
            </button>
            {props.tables && (
              <a href={`/loja/${props.slug}/salao`} className="btn-ghost min-h-11">
                Salão
              </a>
            )}
            <a href={`/loja/${props.slug}/relatorio`} className="btn-ghost min-h-11">
              Relatório
            </a>
            <a href={`/loja/${props.slug}/clientes`} className="btn-ghost min-h-11">
              Clientes
            </a>
            {props.team && (
              <a href={`/painel/lojas/${props.slug}?aba=online`} className="btn-ghost min-h-11">
                Configurar
              </a>
            )}
            <form action={props.logout}>
              <button type="submit" className="btn-ghost min-h-11">
                Sair
              </button>
            </form>
          </div>
        </div>
        {!props.enabled && (
          <p className="bg-warn px-4 py-2 text-center text-sm font-semibold text-white">Os pedidos pelo site estão desligados para esta loja. A equipe liga em Configurar.</p>
        )}
        {props.enabled && operation && !operation.open && (
          <p className="bg-ink px-4 py-2 text-center text-sm text-white">A loja está fechada: o site não aceita pedidos. Toque em “Loja fechada” para abrir.</p>
        )}
        {error && <p className="bg-bad px-4 py-2 text-center text-sm font-semibold text-white">{error}</p>}
      </header>

      <div className="mx-auto max-w-[1500px] px-4 pt-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-mute">
          <span>
            {doneToday.length} concluído{doneToday.length === 1 ? '' : 's'} hoje · {brl(doneToday.reduce((s, o) => s + o.total, 0))}
          </span>
          <span>{lastSync ? `Atualizado às ${lastSync.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}` : 'Carregando…'}</span>
        </div>

        <nav aria-label="Situação" className="mt-3 flex gap-1 overflow-x-auto lg:hidden">
          {COLUMNS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-current={tab === c.id ? 'true' : undefined}
              onClick={() => setTab(c.id)}
              className="btn min-h-10 shrink-0 border border-line bg-white aria-[current=true]:border-ink aria-[current=true]:bg-ink aria-[current=true]:text-white"
            >
              {c.label} <span className="tabular-nums">{byColumn(c.id).length}</span>
            </button>
          ))}
        </nav>

        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          {COLUMNS.map((c) => (
            <section key={c.id} aria-label={c.label} className={`${tab === c.id ? '' : 'hidden'} lg:block`}>
              <h2 className="mb-2 hidden items-center gap-2 text-sm font-bold tracking-wide text-ink-soft uppercase lg:flex">
                {c.label}
                <span className="chip bg-line text-ink">{byColumn(c.id).length}</span>
              </h2>
              <div className="grid gap-3">
                {orders === null ? (
                  <p className="card p-4 text-sm text-ink-mute">Carregando pedidos…</p>
                ) : byColumn(c.id).length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-mute">{c.id === 'novos' ? 'Nenhum pedido esperando. Os novos tocam um alerta.' : 'Nada aqui.'}</p>
                ) : (
                  byColumn(c.id).map((o) => <OrderCard key={o.id} order={o} storeName={props.storeName} onAction={act} onPrint={() => setPrinting(o)} />)
                )}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-6 text-xs text-ink-mute">Logado como {props.userName}. Deixe esta tela aberta durante o expediente; ela se atualiza sozinha.</p>
      </div>

      {printing && <Ticket order={printing} storeName={props.storeName} />}
      {menuOpen && <SoldOutSheet menu={props.menu} soldOut={operation?.soldOut ?? []} onToggle={toggleSoldOut} onClose={() => setMenuOpen(false)} />}
    </div>
  );
}

const METHOD_LABEL = { pix: 'Pix', cartao: 'Cartão', dinheiro: 'Dinheiro' } as const;

function PaymentBadge({ o }: { o: StaffOrder }) {
  const { method, status, changeFor } = o.payment;
  if (o.mode === 'mesa') {
    return <span className="chip bg-accent-soft text-accent">{status === 'pago' ? `Pago na mesa · ${METHOD_LABEL[method]}` : 'Paga ao fechar a mesa'}</span>;
  }
  if (method === 'pix') {
    const map = {
      pago: ['Pix pago', 'bg-ok text-white'],
      pendente: [o.status === 'expirado' ? 'Pix não pago' : 'Aguardando Pix', 'bg-line text-ink'],
      devolver: ['Pix: devolver valor', 'bg-bad text-white'],
      devolvido: ['Pix devolvido', 'bg-line text-ink'],
      'na-entrega': ['Pix', 'bg-line text-ink'],
      'na-mesa': ['Pix', 'bg-line text-ink'],
    } as const;
    const [label, cls] = map[status];
    return <span className={`chip ${cls}`}>{label}{o.payment.pixProvider === 'demo' ? ' (teste)' : ''}</span>;
  }
  if (method === 'cartao') return <span className="chip bg-accent-soft text-accent">{o.mode === 'entrega' ? 'Cartão na entrega' : 'Cartão no balcão'}</span>;
  return <span className="chip bg-accent-soft text-accent">Dinheiro{changeFor ? ` · troco p/ ${brl(changeFor)}` : ' · sem troco'}</span>;
}

/** Quick sold-out switches for service; the site hides the item within seconds, no publish needed. */
function SoldOutSheet({ menu, soldOut, onToggle, onClose }: { menu: MenuForStaff[]; soldOut: string[]; onToggle: (id: string, out: boolean) => void; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="esgotados-title" className="fixed inset-0 z-40 flex justify-end bg-ink/40 print:hidden" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex h-full w-full max-w-md flex-col bg-paper shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 id="esgotados-title" className="text-lg font-bold">
              Esgotados
            </h2>
            <p className="text-sm text-ink-mute">Marcou, sai do site na hora. Desmarque quando voltar.</p>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {menu.map((c) => (
            <section key={c.id}>
              <h3 className="text-xs font-bold tracking-wide text-ink-mute uppercase">{c.name}</h3>
              <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-white">
                {c.items.map((i) => {
                  const out = soldOut.includes(i.id);
                  return (
                    <li key={i.id}>
                      <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-3">
                        <span className={`text-[15px] ${out ? 'text-ink-mute line-through' : ''}`}>{i.name}</span>
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          {out ? <span className="text-bad">Esgotado</span> : <span className="text-ok">Disponível</span>}
                          <input type="checkbox" className="h-5 w-5 accent-bad" checked={out} onChange={(e) => onToggle(i.id, e.target.checked)} aria-label={`${i.name} esgotado`} />
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Pre-written WhatsApp message for the order's current step. */
function notifyText(o: StaffOrder, storeName: string) {
  if (!o.customer.phone) return null;
  const first = o.customer.name.split(' ')[0];
  const by = {
    preparo: `seu pedido #${o.number} foi aceito e já está sendo preparado. 🔥`,
    saiu: `seu pedido #${o.number} saiu para entrega! 🛵`,
    pronto: `seu pedido #${o.number} está pronto para retirar no balcão. ✅`,
    concluido: `obrigado pelo pedido #${o.number}! Bom apetite. 🍔`,
    recusado: `infelizmente não conseguimos fazer o pedido #${o.number}${o.reason ? ` (${o.reason})` : ''}.${o.payment.status === 'devolvido' || o.payment.status === 'devolver' ? ' O valor do Pix será devolvido.' : ''}`,
  } as Partial<Record<OrderStatus, string>>;
  const body = by[o.status];
  return body ? `Olá, ${first}! Aqui é do ${storeName}: ${body}` : null;
}

function OrderCard({ order: o, storeName, onAction, onPrint }: { order: StaffOrder; storeName: string; onAction: (o: StaffOrder, a: OperatorAction, reason?: string) => void; onPrint: () => void }) {
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState('');
  const highlight = o.status === 'novo';
  const wa = `https://wa.me/55${o.customer.phone}`;
  return (
    <article
      className={`card overflow-hidden ${highlight ? 'border-2 border-accent shadow-[0_8px_24px_-12px_rgb(194_65_12/0.6)]' : ''} ${o.status === 'aguardando-pix' ? 'opacity-75' : ''}`}
      aria-labelledby={`o-${o.id}`}
    >
      <div className={`flex items-center justify-between gap-2 px-4 py-2.5 ${highlight ? 'bg-accent text-white' : 'bg-paper'}`}>
        <h3 id={`o-${o.id}`} className="text-base font-bold">
          #{o.number} <span className="font-semibold opacity-80">· {time(o.createdAt)}</span>
        </h3>
        <span className="text-xs font-semibold tracking-wide uppercase">{STATUS_LABEL[o.status]}</span>
      </div>
      <div className="space-y-3 px-4 py-3 text-sm">
        {o.status === 'aguardando-pix' && <p className="rounded-lg bg-line px-3 py-2 font-semibold">Não prepare ainda: o cliente não pagou o Pix. Ele entra em Novos quando o pagamento cair.</p>}
        {o.mode === 'mesa' ? (
          <p className="text-2xl font-black tracking-tight">Mesa {o.table?.number}</p>
        ) : (
        <div>
          <p className="text-[15px] font-bold">{o.customer.name}</p>
          <p className="flex flex-wrap gap-x-3">
            <a href={`tel:+55${o.customer.phone}`} className="underline">
              {phoneLabel(o.customer.phone)}
            </a>
            <a href={wa} target="_blank" rel="noreferrer" className="text-ok underline">
              WhatsApp
            </a>
          </p>
        </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          <span className={`chip ${o.mode === 'entrega' ? 'bg-ink text-white' : o.mode === 'mesa' ? 'bg-accent text-white' : 'bg-line text-ink'}`}>{MODE_CHIP[o.mode]}</span>
          <PaymentBadge o={o} />
        </div>
        {o.address && (
          <p className="leading-snug">
            {o.address.area && <strong>{o.address.area}: </strong>}
            {o.address.street}
            {o.address.reference && <span className="block text-ink-mute">Ref.: {o.address.reference}</span>}
          </p>
        )}
        <ul className="divide-y divide-line border-y border-line">
          {o.lines.map((l, i) => (
            <li key={i} className="py-2">
              <p className="flex justify-between gap-3 font-semibold">
                <span>
                  {l.quantity}× {l.name}
                </span>
                <span className="tabular-nums">{brl(l.total)}</span>
              </p>
              {l.options.length > 0 && <p className="text-ink-soft">{l.options.map((x) => (x.group === 'Adicionais' ? `+ ${x.label}` : `${x.group}: ${x.label}`)).join(' · ')}</p>}
              {l.notes && <p className="font-semibold text-warn">Obs.: {l.notes}</p>}
            </li>
          ))}
        </ul>
        {o.note && <p className="rounded-lg bg-accent-soft px-3 py-2 font-semibold text-accent">Obs. do pedido: {o.note}</p>}
        <dl className="space-y-0.5">
          {o.discount > 0 && (
            <div className="flex justify-between text-ok">
              <dt>Cupom {o.coupon}</dt>
              <dd className="tabular-nums">− {brl(o.discount)}</dd>
            </div>
          )}
          {o.mode === 'entrega' && (
            <div className="flex justify-between text-ink-mute">
              <dt>Entrega</dt>
              <dd className="tabular-nums">{o.feePending ? 'a combinar' : brl(o.deliveryFee)}</dd>
            </div>
          )}
          <div className="flex justify-between text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{brl(o.total)}</dd>
          </div>
        </dl>
        {o.status === 'recusado' && o.reason && <p className="text-bad">Motivo: {o.reason}</p>}
        {notifyText(o, storeName) && (
          <a
            href={`https://wa.me/55${o.customer.phone}?text=${encodeURIComponent(notifyText(o, storeName)!)}`}
            target="_blank"
            rel="noreferrer"
            className="btn min-h-10 w-full border border-ok/40 bg-ok/5 text-ok hover:bg-ok hover:text-white print:hidden"
          >
            Avisar o cliente no WhatsApp
          </a>
        )}
        {o.payment.status === 'devolver' && (
          <p className="rounded-lg bg-bad px-3 py-2 font-semibold text-white">A devolução automática do Pix falhou. Devolva o valor pelo app do Mercado Pago.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3 print:hidden">
        {refusing ? (
          <form
            className="flex w-full flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onAction(o, 'recusar', reason);
              setRefusing(false);
            }}
          >
            <label className="label" htmlFor={`r-${o.id}`}>
              Motivo (o cliente vê)
            </label>
            <input id={`r-${o.id}`} className="field" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: acabou o pão australiano" autoFocus />
            <div className="flex gap-2">
              <button type="submit" className="btn-danger flex-1">
                Confirmar recusa{o.payment.status === 'pago' ? ' e devolver Pix' : ''}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setRefusing(false)}>
                Voltar
              </button>
            </div>
          </form>
        ) : (
          <>
            {o.status === 'novo' && (
              <button type="button" className="btn min-h-12 basis-full bg-ok text-base text-white hover:bg-ink" onClick={() => onAction(o, 'aceitar')}>
                Aceitar pedido
              </button>
            )}
            {o.status === 'preparo' && (
              <button type="button" className="btn-primary min-h-12 basis-full text-base" onClick={() => onAction(o, 'despachar')}>
                {o.mode === 'entrega' ? 'Saiu para entrega' : o.mode === 'mesa' ? 'Pronto para levar à mesa' : 'Pronto para retirada'}
              </button>
            )}
            {(o.status === 'saiu' || o.status === 'pronto') && (
              <button type="button" className="btn-primary min-h-12 basis-full text-base" onClick={() => onAction(o, 'concluir')}>
                {o.mode === 'entrega' ? 'Entregue' : o.mode === 'mesa' ? 'Entregue na mesa' : 'Retirado'}
              </button>
            )}
            {['novo', 'preparo', 'aguardando-pix'].includes(o.status) && (
              <button type="button" className="btn-danger flex-1" onClick={() => setRefusing(true)}>
                Recusar
              </button>
            )}
            <button type="button" className="btn-ghost flex-1" onClick={onPrint}>
              Imprimir
            </button>
          </>
        )}
      </div>
    </article>
  );
}

/** 80 mm kitchen ticket; only this prints. */
function Ticket({ order: o, storeName }: { order: StaffOrder; storeName: string }) {
  return (
    <div className="ticket hidden print:block">
      <p style={{ textAlign: 'center', fontWeight: 700 }}>{storeName}</p>
      <p style={{ textAlign: 'center', fontSize: '20px', fontWeight: 800 }}>PEDIDO #{o.number}</p>
      <p style={{ textAlign: 'center' }}>{new Date(o.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
      <hr />
      {o.mode === 'mesa' ? (
        <p style={{ fontSize: '20px', fontWeight: 800 }}>MESA {o.table?.number}</p>
      ) : (
        <>
          <p>
            <strong>{o.customer.name}</strong> · {phoneLabel(o.customer.phone)}
          </p>
          <p>
            <strong>{o.mode === 'entrega' ? 'ENTREGA' : 'RETIRADA'}</strong>
          </p>
        </>
      )}
      {o.address && (
        <p>
          {o.address.area && `${o.address.area}: `}
          {o.address.street}
          {o.address.reference && ` (Ref.: ${o.address.reference})`}
        </p>
      )}
      <hr />
      {o.lines.map((l, i) => (
        <div key={i} style={{ marginBottom: '4px' }}>
          <p style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>
              {l.quantity}x {l.name}
            </strong>
            <span>{brl(l.total)}</span>
          </p>
          {l.options.map((x, k) => (
            <p key={k}>&nbsp;&nbsp;{x.group === 'Adicionais' ? `+ ${x.label}` : `${x.group}: ${x.label}`}</p>
          ))}
          {l.notes && <p>&nbsp;&nbsp;OBS: {l.notes}</p>}
        </div>
      ))}
      {o.note && <p>OBS DO PEDIDO: {o.note}</p>}
      <hr />
      {o.discount > 0 && <p>Cupom {o.coupon}: - {brl(o.discount)}</p>}
      {o.mode === 'entrega' && <p>Entrega: {o.feePending ? 'a combinar' : brl(o.deliveryFee)}</p>}
      <p style={{ fontSize: '16px', fontWeight: 800 }}>TOTAL: {brl(o.total)}</p>
      <p>
        Pagamento:{' '}
        {o.mode === 'mesa'
          ? 'NA MESA'
          : o.payment.method === 'pix'
          ? o.payment.status === 'pago'
            ? 'PIX PAGO'
            : 'PIX (não confirmado)'
          : o.payment.method === 'cartao'
            ? o.mode === 'entrega'
              ? 'CARTÃO NA ENTREGA'
              : 'CARTÃO NO BALCÃO'
            : `DINHEIRO${o.payment.changeFor ? ` - troco p/ ${brl(o.payment.changeFor)}` : ''}`}
      </p>
    </div>
  );
}

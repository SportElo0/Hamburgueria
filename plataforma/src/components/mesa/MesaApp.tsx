'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { brl, type OrderStatus } from '@/lib/ordering';
import type { TableState } from '@/lib/mesas';

/**
 * The table's phone screen: open or join the table, order from the menu, follow the table's bill,
 * call the waiter and ask for the bill. Built for a phone held in one hand at the table.
 */

export interface MesaChoice {
  id: string;
  label: string;
  price: number;
  available: boolean;
}
export interface MesaItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  imageAlt: string;
  available: boolean;
  options: { id: string; name: string; type: 'single' | 'multiple'; required: boolean; choices: MesaChoice[] }[];
}
export interface MesaCategory {
  id: string;
  name: string;
  items: MesaItem[];
}

interface CartLine {
  key: string;
  itemId: string;
  name: string;
  quantity: number;
  unit: number;
  selections: Record<string, string[]>;
  detail: string;
  notes: string;
}

const POLL_MS = 8000;

const STATUS: Partial<Record<OrderStatus, { label: string; tone: string }>> = {
  'aguardando-garcom': { label: 'Esperando o garçom', tone: 'bg-[#e8b04a]/15 text-[#f0c877]' },
  novo: { label: 'Enviado à cozinha', tone: 'bg-[#e8b04a]/15 text-[#f0c877]' },
  preparo: { label: 'Na cozinha', tone: 'bg-[#6ebe78]/15 text-[#9fdca8]' },
  pronto: { label: 'Pronto, já vai para a mesa', tone: 'bg-[#6ebe78]/15 text-[#9fdca8]' },
  concluido: { label: 'Entregue', tone: 'bg-[#f4ead8]/10 text-[#cbbfa8]' },
  recusado: { label: 'Não aceito', tone: 'bg-[#e05a4f]/15 text-[#f5a3a3]' },
};

function Bell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function MesaApp(props: { slug: string; number: number; tableKey: string; storeName: string; menu: MesaCategory[]; kitchenOpen: boolean }) {
  const api = `/api/public/lojas/${props.slug}/mesas/${props.number}`;
  const [state, setState] = useState<TableState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'cardapio' | 'conta'>('cardapio');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [picking, setPicking] = useState<MesaItem | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${api}?k=${encodeURIComponent(props.tableKey)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      setState((await res.json()) as TableState);
    } catch {
      setError('Sem conexão. Tentando de novo…');
    }
  }, [api, props.tableKey]);

  useEffect(() => {
    const first = window.setTimeout(load, 0);
    const t = window.setInterval(() => document.visibilityState === 'visible' && load(), POLL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const send = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ k: props.tableKey, ...body }) });
      const data = (await res.json()) as TableState & { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Não foi possível agora. Tente de novo.');
        return false;
      }
      setState(data);
      return true;
    } catch {
      setError('Sem conexão. Tente de novo.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cart.reduce((s, l) => s + l.unit * l.quantity, 0);

  const addLine = (line: Omit<CartLine, 'key'>) =>
    setCart((c) => {
      const key = `${line.itemId}|${JSON.stringify(line.selections)}|${line.notes}`;
      const found = c.find((l) => l.key === key);
      return found ? c.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, l.quantity + line.quantity) } : l)) : [...c, { ...line, key }];
    });
  const setQty = (key: string, q: number) => setCart((c) => (q <= 0 ? c.filter((l) => l.key !== key) : c.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, q) } : l))));

  const placeOrder = async () => {
    const ok = await send({ action: 'pedir', items: cart.map((l) => ({ productId: l.itemId, quantity: l.quantity, selections: l.selections, notes: l.notes })) });
    if (ok) {
      setCart([]);
      setReviewing(false);
      setView('conta');
      setToast('Pedido enviado!');
    }
  };

  if (!state) {
    return (
      <Shell>
        <p className="px-5 pt-24 text-center text-[#cbbfa8]" role="status">
          {error || 'Abrindo a mesa…'}
        </p>
      </Shell>
    );
  }

  if (!state.member) return <Entrada storeName={props.storeName} number={props.number} open={state.open} busy={busy} error={error} onOpen={() => send({ action: 'abrir' })} onJoin={(code) => send({ action: 'entrar', code })} />;

  const pendingCalls = new Set(state.calls);
  return (
    <Shell>
      <header className="sticky top-0 z-20 border-b border-[#2c2316] bg-[#0b0907]/95 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-black tracking-tight text-[#e8b04a] uppercase">{props.storeName}</p>
            <p className="text-[13px] text-[#cbbfa8]">
              Mesa {props.number} · código <strong className="tracking-[0.12em] text-[#f4ead8]">{state.code}</strong>
            </p>
          </div>
          <button
            type="button"
            disabled={busy || pendingCalls.has('garcom')}
            onClick={async () => (await send({ action: 'chamar', kind: 'garcom' })) && setToast('O garçom foi chamado.')}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#6d5a3b] px-4 text-sm font-bold disabled:border-[#6ebe78]/50 disabled:text-[#9fdca8]"
          >
            <Bell />
            {pendingCalls.has('garcom') ? 'Chamado' : 'Garçom'}
          </button>
        </div>
        <nav aria-label="Telas da mesa" className="mt-3 grid grid-cols-2 gap-1 rounded-full border border-[#3a2e1d] p-1">
          {(['cardapio', 'conta'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`min-h-10 rounded-full text-sm font-bold ${view === v ? 'bg-[#f4ead8] text-[#140f08]' : 'text-[#cbbfa8]'}`}
            >
              {v === 'cardapio' ? 'Cardápio' : `Conta${state.orders.length ? ` · ${brl(state.total)}` : ' da mesa'}`}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <p role="alert" className="mx-4 mt-3 rounded-xl bg-[#e05a4f]/15 px-4 py-3 text-sm text-[#f5a3a3]">
          {error}
        </p>
      )}

      {view === 'cardapio' ? (
        <Cardapio menu={props.menu} kitchenOpen={props.kitchenOpen} onPick={(item) => (item.options.length ? setPicking(item) : addLine({ itemId: item.id, name: item.name, quantity: 1, unit: item.price, selections: {}, detail: '', notes: '' }))} cart={cart} />
      ) : (
        <Conta state={state} busy={busy} onBill={async () => (await send({ action: 'chamar', kind: 'conta' })) && setToast('O garçom já vem com a conta.')} />
      )}

      {view === 'cardapio' && cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#0b0907] via-[#0b0907] to-transparent px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => setReviewing(true)} className="flex min-h-14 w-full items-center justify-between rounded-full bg-[#e8b04a] px-6 text-[#140f08]">
            <span className="text-[15px] font-extrabold">Ver pedido · {cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
            <span className="text-[17px] font-black tabular-nums">{brl(cartTotal)}</span>
          </button>
        </div>
      )}

      {picking && <OpcoesSheet item={picking} onClose={() => setPicking(null)} onAdd={(line) => (addLine(line), setPicking(null))} />}
      {reviewing && (
        <Revisao
          cart={cart}
          total={cartTotal}
          busy={busy}
          error={error}
          firstOrder={!state.confirmed && state.orders.length === 0}
          onQty={setQty}
          onClose={() => setReviewing(false)}
          onSend={placeOrder}
        />
      )}
      {toast && (
        <p role="status" className="fixed inset-x-4 top-4 z-50 rounded-2xl bg-[#f4ead8] px-4 py-3 text-center text-[15px] font-bold text-[#140f08] shadow-2xl">
          {toast}
        </p>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#0b0907] pb-28 text-[#f4ead8] antialiased">{children}</div>;
}

function Entrada(props: { storeName: string; number: number; open: boolean; busy: boolean; error: string; onOpen: () => void; onJoin: (code: string) => void }) {
  const [code, setCode] = useState('');
  return (
    <Shell>
      <main className="relative overflow-hidden px-5 pt-[max(24px,env(safe-area-inset-top))]">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(232,176,74,0.22),transparent)]" />
        <p className="relative text-xl font-black tracking-tight text-[#e8b04a] uppercase">{props.storeName}</p>
        <p className="relative mt-10 text-[13px] font-bold tracking-[0.14em] text-[#cbbfa8] uppercase">Você está no salão</p>
        <h1 className="relative mt-1 text-[84px] leading-[0.9] font-black tracking-tight uppercase">
          Mesa <span className="text-[#e8b04a]">{props.number}</span>
        </h1>
        <p className="relative mt-4 text-[15px] leading-relaxed text-[#cbbfa8]">Peça pelo celular, chame o garçom e acompanhe a conta. Sem app e sem cadastro.</p>

        {props.error && (
          <p role="alert" className="relative mt-6 rounded-xl bg-[#e05a4f]/15 px-4 py-3 text-sm text-[#f5a3a3]">
            {props.error}
          </p>
        )}

        {!props.open && (
          <section className="relative mt-6 rounded-3xl border border-[#3a2e1d] bg-[#16110b] p-5">
            <h2 className="text-base font-bold">Primeira pessoa da mesa?</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#cbbfa8]">Você abre a mesa e recebe um código para os amigos entrarem. O garçom confirma o primeiro pedido.</p>
            <button type="button" disabled={props.busy} onClick={props.onOpen} className="mt-4 min-h-[52px] w-full rounded-full bg-[#e8b04a] text-base font-extrabold text-[#140f08] disabled:opacity-60">
              Abrir a Mesa {props.number}
            </button>
          </section>
        )}

        <form
          className="relative mt-4 rounded-3xl border border-[#3a2e1d] p-5"
          onSubmit={(e) => {
            e.preventDefault();
            props.onJoin(code);
          }}
        >
          <h2 className="text-base font-bold">{props.open ? 'Esta mesa já está aberta' : 'Alguém da mesa já abriu?'}</h2>
          <label htmlFor="codigo" className="mt-1.5 block text-[13px] leading-relaxed text-[#cbbfa8]">
            Digite o código de 4 números que aparece no celular de quem abriu.
          </label>
          <input
            id="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{4}"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="0000"
            className="mt-4 h-16 w-full rounded-2xl border-[1.5px] border-[#4a3b25] bg-[#16110b] text-center text-3xl font-bold tracking-[0.5em] text-[#f4ead8] placeholder:text-[#4a3b25] focus:border-[#e8b04a] focus:outline-none"
          />
          <button type="submit" disabled={props.busy || code.length !== 4} className="mt-3 min-h-12 w-full rounded-full border-[1.5px] border-[#6d5a3b] text-[15px] font-bold disabled:opacity-50">
            Entrar na mesa
          </button>
        </form>
        <p className="relative mt-6 pb-8 text-center text-xs leading-relaxed text-[#a8977a]">O código só vale enquanto a conta da mesa estiver aberta. Esqueceu? O garçom vê o código.</p>
      </main>
    </Shell>
  );
}

function Cardapio({ menu, kitchenOpen, onPick, cart }: { menu: MesaCategory[]; kitchenOpen: boolean; onPick: (item: MesaItem) => void; cart: CartLine[] }) {
  const inCart = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of cart) m.set(l.itemId, (m.get(l.itemId) ?? 0) + l.quantity);
    return m;
  }, [cart]);
  return (
    <div>
      {!kitchenOpen && <p className="mx-4 mt-3 rounded-xl bg-[#e8b04a]/15 px-4 py-3 text-sm text-[#f0c877]">A cozinha está fechada agora. Chame o garçom.</p>}
      <nav aria-label="Categorias" className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
        {menu.map((c) => (
          <a key={c.id} href={`#cat-${c.id}`} className="flex min-h-10 shrink-0 items-center rounded-full border border-[#3a2e1d] px-4 text-sm font-semibold text-[#cbbfa8] no-underline">
            {c.name}
          </a>
        ))}
      </nav>
      {menu.map((c) => (
        <section key={c.id} id={`cat-${c.id}`} aria-labelledby={`h-${c.id}`} className="scroll-mt-32 px-4 pt-3">
          <h2 id={`h-${c.id}`} className="mb-3 text-[13px] font-bold tracking-[0.12em] text-[#cbbfa8] uppercase">
            {c.name}
          </h2>
          <ul className="space-y-3">
            {c.items.map((item) => {
              const count = inCart.get(item.id) ?? 0;
              return (
                <li key={item.id} className={`flex items-center gap-3 rounded-[20px] border border-[#2c2316] bg-[#16110b] p-3 ${item.available ? '' : 'opacity-50'}`}>
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.imageAlt} loading="lazy" className="h-20 w-20 shrink-0 rounded-2xl bg-[#2c2316] object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-base leading-tight font-bold">{item.name}</p>
                    {item.description && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[#cbbfa8]">{item.description}</p>}
                    <p className="mt-1.5 text-[15px] font-extrabold text-[#e8b04a] tabular-nums">{item.available ? brl(item.price) : 'Esgotado'}</p>
                  </div>
                  {item.available && kitchenOpen && (
                    <button
                      type="button"
                      onClick={() => onPick(item)}
                      aria-label={`Adicionar ${item.name}`}
                      className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e8b04a] text-2xl leading-none font-bold text-[#140f08]"
                    >
                      +
                      {count > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-[#f4ead8] px-1 text-xs font-black text-[#140f08]" aria-hidden="true">
                          {count}
                        </span>
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function OpcoesSheet({ item, onClose, onAdd }: { item: MesaItem; onClose: () => void; onAdd: (line: Omit<CartLine, 'key'>) => void }) {
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [tried, setTried] = useState(false);
  const missing = item.options.filter((g) => g.required && !(picked[g.id] ?? []).length);
  const extras = item.options.flatMap((g) => g.choices.filter((c) => (picked[g.id] ?? []).includes(c.id)));
  const unit = item.price + extras.reduce((s, c) => s + c.price, 0);
  const toggle = (groupId: string, single: boolean, choiceId: string) =>
    setPicked((p) => {
      const cur = p[groupId] ?? [];
      if (single) return { ...p, [groupId]: [choiceId] };
      return { ...p, [groupId]: cur.includes(choiceId) ? cur.filter((x) => x !== choiceId) : [...cur, choiceId] };
    });
  return (
    <Sheet title={item.name} onClose={onClose}>
      <div className="space-y-5 px-5 pb-4">
        {item.description && <p className="text-sm leading-relaxed text-[#cbbfa8]">{item.description}</p>}
        {item.options.map((g) => (
          <fieldset key={g.id}>
            <legend className="flex w-full items-center justify-between text-[15px] font-bold">
              {g.name}
              <span className={`text-xs font-semibold ${tried && missing.includes(g) ? 'text-[#f5a3a3]' : 'text-[#a8977a]'}`}>{g.required ? 'Obrigatório' : g.type === 'single' ? 'Escolha 1' : 'Opcional'}</span>
            </legend>
            <div className="mt-2 space-y-2">
              {g.choices.map((c) => {
                const on = (picked[g.id] ?? []).includes(c.id);
                return (
                  <label key={c.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] px-4 ${on ? 'border-[#e8b04a] bg-[#e8b04a]/10' : 'border-[#3a2e1d]'} ${c.available ? '' : 'opacity-50'}`}>
                    <input
                      type={g.type === 'single' ? 'radio' : 'checkbox'}
                      name={g.id}
                      disabled={!c.available}
                      checked={on}
                      onChange={() => toggle(g.id, g.type === 'single', c.id)}
                      className="h-5 w-5 accent-[#e8b04a]"
                    />
                    <span className="flex-1 text-[15px]">{c.label}</span>
                    <span className="text-sm text-[#cbbfa8] tabular-nums">{!c.available ? 'Esgotado' : c.price ? `+ ${brl(c.price)}` : ''}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
        <div>
          <label htmlFor="obs" className="text-[15px] font-bold">
            Alguma observação?
          </label>
          <input id="obs" value={notes} maxLength={140} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: sem cebola" className="mt-2 h-12 w-full rounded-2xl border-[1.5px] border-[#3a2e1d] bg-[#16110b] px-4 text-[16px] text-[#f4ead8] placeholder:text-[#7a6a52] focus:border-[#e8b04a] focus:outline-none" />
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-[#2c2316] px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        <Stepper value={qty} onChange={(q) => setQty(Math.max(1, Math.min(20, q)))} label={item.name} />
        <button
          type="button"
          className="min-h-14 flex-1 rounded-full bg-[#e8b04a] px-4 text-[15px] font-extrabold text-[#140f08]"
          onClick={() => {
            setTried(true);
            if (missing.length) return;
            const detail = item.options
              .flatMap((g) => g.choices.filter((c) => (picked[g.id] ?? []).includes(c.id)).map((c) => (g.id === 'adicionais' ? `+ ${c.label}` : c.label)))
              .join(' · ');
            onAdd({ itemId: item.id, name: item.name, quantity: qty, unit, selections: picked, detail, notes: notes.trim() });
          }}
        >
          Adicionar · {brl(unit * qty)}
        </button>
      </div>
      {tried && missing.length > 0 && (
        <p role="alert" className="px-5 pb-4 text-sm text-[#f5a3a3]">
          Escolha: {missing.map((g) => g.name).join(', ')}.
        </p>
      )}
    </Sheet>
  );
}

function Revisao(props: { cart: CartLine[]; total: number; busy: boolean; error: string; firstOrder: boolean; onQty: (key: string, q: number) => void; onClose: () => void; onSend: () => void }) {
  return (
    <Sheet title="Seu pedido" onClose={props.onClose}>
      <ul className="divide-y divide-[#2c2316] px-5">
        {props.cart.map((l) => (
          <li key={l.key} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold">{l.name}</p>
              {l.detail && <p className="text-[13px] text-[#cbbfa8]">{l.detail}</p>}
              {l.notes && <p className="text-[13px] text-[#f0c877]">Obs.: {l.notes}</p>}
              <p className="mt-1 text-sm font-bold text-[#e8b04a] tabular-nums">{brl(l.unit * l.quantity)}</p>
            </div>
            <Stepper value={l.quantity} onChange={(q) => props.onQty(l.key, q)} label={l.name} allowZero />
          </li>
        ))}
      </ul>
      <div className="space-y-3 border-t border-[#2c2316] px-5 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        {props.firstOrder && <p className="rounded-xl bg-[#e8b04a]/10 px-4 py-3 text-[13px] leading-relaxed text-[#f0c877]">Primeiro pedido da mesa: o garçom passa para confirmar e ele vai para a cozinha.</p>}
        {props.error && (
          <p role="alert" className="text-sm text-[#f5a3a3]">
            {props.error}
          </p>
        )}
        <button type="button" disabled={props.busy || !props.cart.length} onClick={props.onSend} className="flex min-h-14 w-full items-center justify-between rounded-full bg-[#e8b04a] px-6 text-[#140f08] disabled:opacity-60">
          <span className="text-[15px] font-extrabold">{props.busy ? 'Enviando…' : 'Enviar para a cozinha'}</span>
          <span className="text-[17px] font-black tabular-nums">{brl(props.total)}</span>
        </button>
      </div>
    </Sheet>
  );
}

function Conta({ state, busy, onBill }: { state: Extract<TableState, { member: true }>; busy: boolean; onBill: () => void }) {
  const askedBill = state.calls.includes('conta');
  return (
    <div className="space-y-3 px-4 pt-4">
      <section className="flex items-center justify-between gap-3 rounded-[20px] border border-[#3a2e1d] bg-[#16110b] px-4 py-3.5">
        <div>
          <p className="text-[13px] text-[#cbbfa8]">Chame a mesa toda: o código é</p>
          <p className="text-3xl font-extrabold tracking-[0.22em]">{state.code}</p>
        </div>
        <p className="text-right text-xs text-[#cbbfa8]">
          {state.phones} {state.phones === 1 ? 'celular' : 'celulares'}
          <br />
          nesta mesa
        </p>
      </section>

      {!state.confirmed && state.orders.length > 0 && (
        <p className="rounded-2xl bg-[#e8b04a]/10 px-4 py-3 text-[13px] leading-relaxed text-[#f0c877]">O garçom vai passar na mesa para confirmar. Depois disso, os pedidos vão direto para a cozinha.</p>
      )}

      {state.orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#3a2e1d] px-4 py-8 text-center text-sm text-[#cbbfa8]">Nenhum pedido ainda. Escolha no cardápio.</p>
      ) : (
        <ol className="space-y-3">
          {state.orders.map((o, i) => {
            const s = STATUS[o.status] ?? { label: o.status, tone: 'bg-[#f4ead8]/10 text-[#cbbfa8]' };
            return (
              <li key={o.id} className="rounded-[20px] border border-[#3a2e1d] px-4 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-bold text-[#cbbfa8]">Pedido {i + 1}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.tone}`}>{s.label}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {o.lines.map((l, j) => (
                    <li key={j} className={`flex justify-between gap-3 text-sm tabular-nums ${o.status === 'recusado' ? 'line-through opacity-60' : ''}`}>
                      <span>
                        {l.quantity}× {l.name}
                      </span>
                      <span>{brl(l.total)}</span>
                    </li>
                  ))}
                </ul>
                {o.reason && <p className="mt-2 text-[13px] text-[#f5a3a3]">{o.reason}</p>}
              </li>
            );
          })}
        </ol>
      )}

      <p className="flex justify-between px-1 pt-1 text-lg font-extrabold tabular-nums">
        <span>Total da mesa</span>
        <span>{brl(state.total)}</span>
      </p>
      <button
        type="button"
        disabled={busy || askedBill || state.orders.length === 0}
        onClick={onBill}
        className="min-h-14 w-full rounded-full bg-[#e8b04a] text-base font-extrabold text-[#140f08] disabled:bg-[#6ebe78]/20 disabled:text-[#9fdca8]"
      >
        {askedBill ? 'Conta pedida: o garçom já vem' : 'Pedir a conta'}
      </button>
      <p className="pb-4 text-center text-xs text-[#a8977a]">Quando a conta for paga, o código {state.code} deixa de valer.</p>
    </div>
  );
}

function Stepper({ value, onChange, label, allowZero = false }: { value: number; onChange: (v: number) => void; label: string; allowZero?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" aria-label={`Menos ${label}`} disabled={!allowZero && value <= 1} onClick={() => onChange(value - 1)} className="grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-[#6d5a3b] text-xl disabled:opacity-40">
        −
      </button>
      <span className="min-w-6 text-center text-base font-extrabold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label={`Mais ${label}`} disabled={value >= 20} onClick={() => onChange(value + 1)} className="grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-[#6d5a3b] text-xl disabled:opacity-40">
        +
      </button>
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/60" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="flex max-h-[88dvh] w-full flex-col rounded-t-[28px] border-t border-[#3a2e1d] bg-[#100c08]">
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="grid h-11 w-11 place-items-center rounded-full border border-[#3a2e1d] text-xl">
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

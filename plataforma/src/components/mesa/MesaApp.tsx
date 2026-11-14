"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { brl, type OrderStatus } from "@/lib/ordering";
import type { TableState } from "@/lib/mesas";
import { Cubo, Prato3D, Selo3D } from "./Prato3D";

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
  /** Dish in 3D at real size (only items the Growlift team scanned). */
  modelo3d?: { src: string; ios?: string; larguraCm: number; alturaCm: number } | null;
  options: {
    id: string;
    name: string;
    type: "single" | "multiple";
    required: boolean;
    choices: MesaChoice[];
  }[];
}
export interface MesaCategory {
  id: string;
  name: string;
  items: MesaItem[];
}

export interface CartLine {
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
const PRICE_CHANGED =
  "O preço de alguns itens mudou. Confira o novo total antes de fechar.";

/** A cart line priced from the menu on screen, so a price changed on the panel shows before ordering. */
export function priceOf(menu: MesaCategory[], l: CartLine): number {
  const item = menu.flatMap((c) => c.items).find((i) => i.id === l.itemId);
  if (!item) return l.unit;
  const extras = item.options.flatMap((g) =>
    (l.selections[g.id] ?? []).map(
      (id) => g.choices.find((c) => c.id === id)?.price ?? 0,
    ),
  );
  return item.price + extras.reduce((s, p) => s + p, 0);
}

const STATUS: Partial<Record<OrderStatus, { label: string; tone: string }>> = {
  "aguardando-garcom": {
    label: "Esperando o garçom",
    tone: "bg-[#0865FE]/15 text-[#0865FE]",
  },
  novo: { label: "Enviado à cozinha", tone: "bg-[#0865FE]/15 text-[#0865FE]" },
  preparo: { label: "Na cozinha", tone: "bg-[#15803D]/15 text-[#15803D]" },
  pronto: {
    label: "Pronto, já vai para a mesa",
    tone: "bg-[#15803D]/15 text-[#15803D]",
  },
  concluido: { label: "Entregue", tone: "bg-[#121826]/5 text-[#4A5568]" },
  recusado: { label: "Não aceito", tone: "bg-[#C81E1E]/15 text-[#B91C1C]" },
};

function Bell() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function MesaApp(props: {
  slug: string;
  number: number;
  tableKey: string;
  storeName: string;
  menu: MesaCategory[];
  kitchenOpen: boolean;
  reviewUrl?: string;
  pay?: { on: boolean; needsEmail: boolean };
}) {
  const api = `/api/public/lojas/${props.slug}/mesas/${props.number}`;
  const router = useRouter();
  const [state, setState] = useState<TableState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"cardapio" | "conta">("cardapio");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [picking, setPicking] = useState<MesaItem | null>(null);
  const [vendo3d, setVendo3d] = useState<MesaItem | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [toast, setToast] = useState("");
  // "Agora não" on the dessert card, per seating (the code changes with each new group at the table).
  const [semSobremesa, setSemSobremesa] = useState<string | null>(null);
  // This phone was at the table with a bill, and the table is gone: the bill was paid. Say thanks (and ask for a review).
  const hadBill = useRef(false);
  const [thanked, setThanked] = useState(false);
  const [refundNote, setRefundNote] = useState<{
    amount: number;
    status: "feito" | "falhou";
  } | null>(null);
  const apply = useCallback((next: TableState) => {
    if (next.member && next.orders.length > 0) hadBill.current = true;
    else if (!next.member && hadBill.current) {
      hadBill.current = false;
      setThanked(true);
    }
    setState(next);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `${api}?k=${encodeURIComponent(props.tableKey)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(String(res.status));
      apply((await res.json()) as TableState);
    } catch {
      setError("Sem conexão. Tentando de novo…");
    }
  }, [api, props.tableKey, apply]);

  useEffect(() => {
    const first = window.setTimeout(load, 0);
    const t = window.setInterval(
      () => document.visibilityState === "visible" && load(),
      POLL_MS,
    );
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const send = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ k: props.tableKey, ...body }),
      });
      const data = (await res.json()) as TableState & {
        error?: string;
        refund?: { amount: number; status: "feito" | "falhou" };
      };
      if (data.refund) setRefundNote(data.refund);
      if (!res.ok) {
        setError(data.error ?? "Não foi possível agora. Tente de novo.");
        // New prices: reload the menu from the server; the cart reprices itself and the customer sends again.
        if (data.error === PRICE_CHANGED) router.refresh();
        return false;
      }
      apply(data);
      return true;
    } catch {
      setError("Sem conexão. Tente de novo.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Counts how often dishes are opened in 3D (no personal data); never blocks or shows an error.
  const contar3d = (itemId: string, modo: "tela" | "mesa") => {
    void fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ k: props.tableKey, action: "ver3d", itemId, modo }),
      keepalive: true,
    }).catch(() => {});
  };

  const priced = useMemo(
    () => cart.map((l) => ({ ...l, unit: priceOf(props.menu, l) })),
    [cart, props.menu],
  );
  const cartCount = priced.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = priced.reduce((s, l) => s + l.unit * l.quantity, 0);

  const addLine = (line: Omit<CartLine, "key">) =>
    setCart((c) => {
      const key = `${line.itemId}|${JSON.stringify(line.selections)}|${line.notes}`;
      const found = c.find((l) => l.key === key);
      return found
        ? c.map((l) =>
            l.key === key
              ? { ...l, quantity: Math.min(20, l.quantity + line.quantity) }
              : l,
          )
        : [...c, { ...line, key }];
    });
  const setQty = (key: string, q: number) =>
    setCart((c) =>
      q <= 0
        ? c.filter((l) => l.key !== key)
        : c.map((l) =>
            l.key === key ? { ...l, quantity: Math.min(20, q) } : l,
          ),
    );

  const placeOrder = async () => {
    const ok = await send({
      action: "pedir",
      expectedSubtotal: cartTotal,
      items: priced.map((l) => ({
        productId: l.itemId,
        quantity: l.quantity,
        selections: l.selections,
        notes: l.notes,
      })),
    });
    if (ok) {
      setCart([]);
      setReviewing(false);
      setView("conta");
      setToast("Pedido enviado!");
    }
  };

  if (!state) {
    return (
      <Shell>
        <p className="px-5 pt-24 text-center text-[#4A5568]" role="status">
          {error || "Abrindo a mesa…"}
        </p>
      </Shell>
    );
  }

  if (!state.member && thanked)
    return (
      <Obrigado
        storeName={props.storeName}
        reviewUrl={props.reviewUrl}
        refund={refundNote}
        onBack={() => setThanked(false)}
      />
    );
  if (!state.member)
    return (
      <Entrada
        storeName={props.storeName}
        number={props.number}
        open={state.open}
        busy={busy}
        error={error}
        onOpen={() => send({ action: "abrir" })}
        onJoin={(code) => send({ action: "entrar", code })}
      />
    );

  const pendingCalls = new Set(state.calls);
  const dessertKey = `sobremesa-${props.slug}-${props.number}-${state.code}`;
  const dessertHidden = semSobremesa === dessertKey || lerDispensa(dessertKey);
  const dessertItems = state.sobremesa
    ? state.sobremesa.items
        .map((id) => props.menu.flatMap((c) => c.items).find((i) => i.id === id))
        .filter((i): i is MesaItem => Boolean(i))
    : [];
  const pickItem = (item: MesaItem) =>
    item.options.length
      ? setPicking(item)
      : addLine({
          itemId: item.id,
          name: item.name,
          quantity: 1,
          unit: item.price,
          selections: {},
          detail: "",
          notes: "",
        });
  const dessertCard =
    state.sobremesa && dessertItems.length && !dessertHidden ? (
      <SobremesaCard
        reason={state.sobremesa.reason}
        items={dessertItems}
        kitchenOpen={props.kitchenOpen}
        cart={cart}
        onPick={(item) => {
          pickItem(item);
          if (!item.options.length) setToast(`${item.name} no pedido. Toque em Ver pedido para enviar.`);
          setView("cardapio");
        }}
        onVer3d={setVendo3d}
        onClose={() => {
          guardarDispensa(dessertKey);
          setSemSobremesa(dessertKey);
        }}
      />
    ) : null;
  return (
    <Shell>
      <header className="sticky top-0 z-20 border-b border-[#E6EBF2] bg-[#F4F6FA]/95 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-black tracking-tight text-[#0865FE] uppercase">
              {props.storeName}
            </p>
            <p className="text-[13px] text-[#4A5568]">
              Mesa {props.number} · código{" "}
              <strong className="tracking-[0.12em] text-[#121826]">
                {state.code}
              </strong>
            </p>
          </div>
          <button
            type="button"
            disabled={busy || pendingCalls.has("garcom")}
            onClick={async () =>
              (await send({ action: "chamar", kind: "garcom" })) &&
              setToast("O garçom foi chamado.")
            }
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#C9D3E1] px-4 text-sm font-bold disabled:border-[#15803D]/50 disabled:text-[#15803D]"
          >
            <Bell />
            {pendingCalls.has("garcom") ? "Chamado" : "Garçom"}
          </button>
        </div>
        <nav
          aria-label="Telas da mesa"
          className="mt-3 grid grid-cols-2 gap-1 rounded-full border border-[#DCE2EC] p-1"
        >
          {(["cardapio", "conta"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`min-h-10 rounded-full text-sm font-bold ${view === v ? "bg-[#0865FE] text-[#FFFFFF]" : "text-[#4A5568]"}`}
            >
              {v === "cardapio"
                ? "Cardápio"
                : `Conta${state.orders.length ? ` · ${brl(state.total)}` : " da mesa"}`}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <p
          role="alert"
          className="mx-4 mt-3 rounded-xl bg-[#C81E1E]/15 px-4 py-3 text-sm text-[#B91C1C]"
        >
          {error}
        </p>
      )}

      {view === "cardapio" && dessertCard}

      {view === "cardapio" ? (
        <>
          {(state.servicoPct > 0 || state.couvertPessoa > 0) && (
            <p className="mx-4 mt-3 rounded-xl bg-[#121826]/5 px-4 py-2.5 text-[13px] text-[#4A5568]">
              {[
                state.couvertPessoa > 0
                  ? `Couvert de ${brl(state.couvertPessoa)} por pessoa`
                  : "",
                state.servicoPct > 0
                  ? `taxa de serviço de ${state.servicoPct}% (opcional)`
                  : "",
              ]
                .filter(Boolean)
                .join(" e ")
                .replace(/^t/, "T")}{" "}
              na conta.
            </p>
          )}
          <Cardapio
            menu={props.menu}
            kitchenOpen={props.kitchenOpen}
            onPick={pickItem}
            onVer3d={setVendo3d}
            cart={cart}
          />
        </>
      ) : (
        <Conta
          state={state}
          busy={busy}
          reviewUrl={props.reviewUrl}
          pay={props.pay}
          slug={props.slug}
          storeName={props.storeName}
          send={send}
          error={error}
          onBill={async () =>
            (await send({ action: "chamar", kind: "conta" })) &&
            setToast("O garçom já vem com a conta.")
          }
        />
      )}
      {/* On the bill, the card goes under the button just tapped, where the eyes already are. */}
      {view === "conta" && dessertCard && <div className="pb-6">{dessertCard}</div>}

      {view === "cardapio" && cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#F4F6FA] via-[#F4F6FA] to-transparent px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setReviewing(true)}
            className="flex min-h-14 w-full items-center justify-between rounded-full bg-[#0865FE] px-6 text-[#FFFFFF]"
          >
            <span className="text-[15px] font-extrabold">
              Ver pedido · {cartCount} {cartCount === 1 ? "item" : "itens"}
            </span>
            <span className="text-[17px] font-black tabular-nums">
              {brl(cartTotal)}
            </span>
          </button>
        </div>
      )}

      {picking && (
        <OpcoesSheet
          item={picking}
          onClose={() => setPicking(null)}
          onAdd={(line) => (addLine(line), setPicking(null))}
          onVer3d={picking.modelo3d ? () => setVendo3d(picking) : undefined}
        />
      )}
      {vendo3d?.modelo3d && (
        <Prato3D
          item={{ ...vendo3d, modelo3d: vendo3d.modelo3d }}
          onClose={() => setVendo3d(null)}
          onVer={(modo) => contar3d(vendo3d.id, modo)}
        />
      )}
      {reviewing && (
        <Revisao
          cart={priced}
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
        <p
          role="status"
          className="fixed inset-x-4 top-4 z-50 rounded-2xl bg-[#121826] px-4 py-3 text-center text-[15px] font-bold text-[#FFFFFF] shadow-2xl"
        >
          {toast}
        </p>
      )}
    </Shell>
  );
}

function lerDispensa(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
function guardarDispensa(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Private mode or blocked storage: the card stays closed until the page reloads.
  }
}

/**
 * "Hora da sobremesa": after the main course (or when the table asks for the bill), up to 3 desserts, the ones
 * scanned in 3D first. Shown once per seating; "Agora não" closes it for this phone.
 */
function SobremesaCard({
  reason,
  items,
  kitchenOpen,
  cart,
  onPick,
  onVer3d,
  onClose,
}: {
  reason: "tempo" | "conta";
  items: MesaItem[];
  kitchenOpen: boolean;
  cart: CartLine[];
  onPick: (item: MesaItem) => void;
  onVer3d: (item: MesaItem) => void;
  onClose: () => void;
}) {
  const inCart = new Set(cart.map((l) => l.itemId));
  return (
    <section
      aria-labelledby="sobremesa-titulo"
      className="mx-4 mt-3 rounded-[24px] bg-[#121826] p-4 text-[#FFFFFF] motion-safe:animate-[sobremesa-in_320ms_cubic-bezier(0.22,1,0.36,1)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold tracking-[0.14em] text-[#9DB8FF] uppercase">
            Hora da sobremesa
          </p>
          <h2
            id="sobremesa-titulo"
            className="mt-1 text-lg leading-tight font-black"
          >
            {reason === "conta"
              ? "Antes de fechar, uma sobremesa?"
              : "Sobrou espaço para um doce?"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold text-[#C9D3E1] underline-offset-2 hover:underline"
        >
          Agora não
        </button>
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-[18px] bg-[#FFFFFF]/8 p-2.5"
          >
            {item.modelo3d ? (
              <button
                type="button"
                onClick={() => onVer3d(item)}
                aria-label={`Ver ${item.name} em 3D`}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#FFFFFF]/10 transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Cubo className="mx-auto h-7 w-7 text-[#C9D3E1]" />
                )}
                <Selo3D />
              </button>
            ) : item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt={item.imageAlt}
                className="h-16 w-16 shrink-0 rounded-2xl bg-[#FFFFFF]/10 object-cover"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-[15px] leading-tight font-bold">{item.name}</p>
              <p className="mt-1 text-[14px] font-extrabold text-[#9DB8FF] tabular-nums">
                {brl(item.price)}
              </p>
            </div>
            {kitchenOpen && (
              <button
                type="button"
                onClick={() => onPick(item)}
                aria-label={`Adicionar ${item.name}`}
                className="grid h-11 min-w-11 shrink-0 place-items-center rounded-full bg-[#0865FE] px-3 text-sm font-black text-[#FFFFFF] transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                {inCart.has(item.id) ? "+1" : "+"}
              </button>
            )}
          </li>
        ))}
      </ul>
      {items.some((i) => i.modelo3d) && (
        <p className="mt-2.5 text-[12px] text-[#C9D3E1]">
          Toque na foto para ver em 3D, do tamanho de verdade.
        </p>
      )}
    </section>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#F4F6FA] pb-28 text-[#121826] antialiased">
      {children}
    </div>
  );
}

function Entrada(props: {
  storeName: string;
  number: number;
  open: boolean;
  busy: boolean;
  error: string;
  onOpen: () => void;
  onJoin: (code: string) => void;
}) {
  const [code, setCode] = useState("");
  return (
    <Shell>
      <main className="relative overflow-hidden px-5 pt-[max(24px,env(safe-area-inset-top))]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(8,101,254,0.10),transparent)]"
        />
        <p className="relative text-xl font-black tracking-tight text-[#0865FE] uppercase">
          {props.storeName}
        </p>
        <p className="relative mt-10 text-[13px] font-bold tracking-[0.14em] text-[#4A5568] uppercase">
          Você está no salão
        </p>
        <h1 className="relative mt-1 text-[84px] leading-[0.9] font-black tracking-tight uppercase">
          Mesa <span className="text-[#0865FE]">{props.number}</span>
        </h1>
        <p className="relative mt-4 text-[15px] leading-relaxed text-[#4A5568]">
          Peça pelo celular, chame o garçom e acompanhe a conta. Sem app e sem
          cadastro.
        </p>

        {props.error && (
          <p
            role="alert"
            className="relative mt-6 rounded-xl bg-[#C81E1E]/15 px-4 py-3 text-sm text-[#B91C1C]"
          >
            {props.error}
          </p>
        )}

        {!props.open && (
          <section className="relative mt-6 rounded-3xl border border-[#DCE2EC] bg-[#FFFFFF] p-5">
            <h2 className="text-base font-bold">Primeira pessoa da mesa?</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#4A5568]">
              Você abre a mesa e recebe um código para os amigos entrarem. O
              garçom confirma o primeiro pedido.
            </p>
            <button
              type="button"
              disabled={props.busy}
              onClick={props.onOpen}
              className="mt-4 min-h-[52px] w-full rounded-full bg-[#0865FE] text-base font-extrabold text-[#FFFFFF] disabled:opacity-60"
            >
              Abrir a Mesa {props.number}
            </button>
          </section>
        )}

        <form
          className="relative mt-4 rounded-3xl border border-[#DCE2EC] p-5"
          onSubmit={(e) => {
            e.preventDefault();
            props.onJoin(code);
          }}
        >
          <h2 className="text-base font-bold">
            {props.open
              ? "Esta mesa já está aberta"
              : "Alguém da mesa já abriu?"}
          </h2>
          <label
            htmlFor="codigo"
            className="mt-1.5 block text-[13px] leading-relaxed text-[#4A5568]"
          >
            Digite o código de 4 números que aparece no celular de quem abriu.
          </label>
          <input
            id="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{4}"
            maxLength={4}
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="0000"
            className="mt-4 h-16 w-full rounded-2xl border-[1.5px] border-[#C9D3E1] bg-[#FFFFFF] text-center text-3xl font-bold tracking-[0.5em] text-[#121826] placeholder:text-[#C9D3E1] focus:border-[#0865FE] focus:outline-none"
          />
          <button
            type="submit"
            disabled={props.busy || code.length !== 4}
            className="mt-3 min-h-12 w-full rounded-full border-[1.5px] border-[#C9D3E1] text-[15px] font-bold disabled:opacity-50"
          >
            Entrar na mesa
          </button>
        </form>
        <p className="relative mt-6 pb-8 text-center text-xs leading-relaxed text-[#6A7385]">
          O código só vale enquanto a conta da mesa estiver aberta. Esqueceu? O
          garçom vê o código.
        </p>
      </main>
    </Shell>
  );
}

export function Cardapio({
  menu,
  kitchenOpen,
  onPick,
  onVer3d,
  cart,
}: {
  menu: MesaCategory[];
  kitchenOpen: boolean;
  onPick: (item: MesaItem) => void;
  /** Only the customer's menu passes it: dishes with a 3D get a "3D" mark and open it on tap. */
  onVer3d?: (item: MesaItem) => void;
  cart: CartLine[];
}) {
  const inCart = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of cart) m.set(l.itemId, (m.get(l.itemId) ?? 0) + l.quantity);
    return m;
  }, [cart]);
  return (
    <div>
      {!kitchenOpen && (
        <p className="mx-4 mt-3 rounded-xl bg-[#0865FE]/15 px-4 py-3 text-sm text-[#0865FE]">
          A cozinha está fechada agora. Chame o garçom.
        </p>
      )}
      <nav
        aria-label="Categorias"
        className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]"
      >
        {menu.map((c) => (
          <a
            key={c.id}
            href={`#cat-${c.id}`}
            className="flex min-h-10 shrink-0 items-center rounded-full border border-[#DCE2EC] px-4 text-sm font-semibold text-[#4A5568] no-underline"
          >
            {c.name}
          </a>
        ))}
      </nav>
      {menu.map((c) => (
        <section
          key={c.id}
          id={`cat-${c.id}`}
          aria-labelledby={`h-${c.id}`}
          className="scroll-mt-32 px-4 pt-3"
        >
          <h2
            id={`h-${c.id}`}
            className="mb-3 text-[13px] font-bold tracking-[0.12em] text-[#4A5568] uppercase"
          >
            {c.name}
          </h2>
          <ul className="space-y-3">
            {c.items.map((item) => {
              const count = inCart.get(item.id) ?? 0;
              return (
                <li
                  key={item.id}
                  className={`flex items-center gap-3 rounded-[20px] border border-[#E6EBF2] bg-[#FFFFFF] p-3 ${item.available ? "" : "opacity-50"}`}
                >
                  {item.modelo3d && onVer3d ? (
                    <button
                      type="button"
                      onClick={() => onVer3d(item)}
                      aria-label={`Ver ${item.name} em 3D`}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#E6EBF2] transition-transform duration-150 ease-out active:scale-[0.96]"
                    >
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Cubo className="mx-auto mb-3 h-8 w-8 text-[#4A5568]" />
                      )}
                      <Selo3D />
                    </button>
                  ) : item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      loading="lazy"
                      className="h-20 w-20 shrink-0 rounded-2xl bg-[#E6EBF2] object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-base leading-tight font-bold">
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[#4A5568]">
                        {item.description}
                      </p>
                    )}
                    <p className="mt-1.5 text-[15px] font-extrabold text-[#0865FE] tabular-nums">
                      {item.available ? brl(item.price) : "Esgotado"}
                    </p>
                  </div>
                  {item.available && kitchenOpen && (
                    <button
                      type="button"
                      onClick={() => onPick(item)}
                      aria-label={`Adicionar ${item.name}`}
                      className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0865FE] text-2xl leading-none font-bold text-[#FFFFFF]"
                    >
                      +
                      {count > 0 && (
                        <span
                          className="absolute -top-1.5 -right-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-[#0865FE] px-1 text-xs font-black text-[#FFFFFF]"
                          aria-hidden="true"
                        >
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

export function OpcoesSheet({
  item,
  onClose,
  onAdd,
  onVer3d,
}: {
  item: MesaItem;
  onClose: () => void;
  onAdd: (line: Omit<CartLine, "key">) => void;
  onVer3d?: () => void;
}) {
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [tried, setTried] = useState(false);
  const missing = item.options.filter(
    (g) => g.required && !(picked[g.id] ?? []).length,
  );
  const extras = item.options.flatMap((g) =>
    g.choices.filter((c) => (picked[g.id] ?? []).includes(c.id)),
  );
  const unit = item.price + extras.reduce((s, c) => s + c.price, 0);
  const toggle = (groupId: string, single: boolean, choiceId: string) =>
    setPicked((p) => {
      const cur = p[groupId] ?? [];
      if (single) return { ...p, [groupId]: [choiceId] };
      return {
        ...p,
        [groupId]: cur.includes(choiceId)
          ? cur.filter((x) => x !== choiceId)
          : [...cur, choiceId],
      };
    });
  return (
    <Sheet title={item.name} onClose={onClose}>
      <div className="space-y-5 px-5 pb-4">
        {onVer3d && (
          <button
            type="button"
            onClick={onVer3d}
            className="flex min-h-12 w-full items-center gap-3 rounded-2xl border-[1.5px] border-[#0865FE]/30 bg-[#0865FE]/[0.06] px-4 text-left text-[15px] font-bold text-[#0865FE]"
          >
            <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0865FE] text-[11px] font-black text-[#FFFFFF]">
              3D
            </span>
            Ver na sua mesa, em tamanho aproximado
          </button>
        )}
        {item.description && (
          <p className="text-sm leading-relaxed text-[#4A5568]">
            {item.description}
          </p>
        )}
        {item.options.map((g) => (
          <fieldset key={g.id}>
            <legend className="flex w-full items-center justify-between text-[15px] font-bold">
              {g.name}
              <span
                className={`text-xs font-semibold ${tried && missing.includes(g) ? "text-[#B91C1C]" : "text-[#6A7385]"}`}
              >
                {g.required
                  ? "Obrigatório"
                  : g.type === "single"
                    ? "Escolha 1"
                    : "Opcional"}
              </span>
            </legend>
            <div className="mt-2 space-y-2">
              {g.choices.map((c) => {
                const on = (picked[g.id] ?? []).includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] px-4 ${on ? "border-[#0865FE] bg-[#0865FE]/10" : "border-[#DCE2EC]"} ${c.available ? "" : "opacity-50"}`}
                  >
                    <input
                      type={g.type === "single" ? "radio" : "checkbox"}
                      name={g.id}
                      disabled={!c.available}
                      checked={on}
                      onChange={() => toggle(g.id, g.type === "single", c.id)}
                      className="h-5 w-5 accent-[#0865FE]"
                    />
                    <span className="flex-1 text-[15px]">{c.label}</span>
                    <span className="text-sm text-[#4A5568] tabular-nums">
                      {!c.available
                        ? "Esgotado"
                        : c.price
                          ? `+ ${brl(c.price)}`
                          : ""}
                    </span>
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
          <input
            id="obs"
            value={notes}
            maxLength={140}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: sem cebola"
            className="mt-2 h-12 w-full rounded-2xl border-[1.5px] border-[#DCE2EC] bg-[#FFFFFF] px-4 text-[16px] text-[#121826] placeholder:text-[#6A7385] focus:border-[#0865FE] focus:outline-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-[#E6EBF2] px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        <Stepper
          value={qty}
          onChange={(q) => setQty(Math.max(1, Math.min(20, q)))}
          label={item.name}
        />
        <button
          type="button"
          className="min-h-14 flex-1 rounded-full bg-[#0865FE] px-4 text-[15px] font-extrabold text-[#FFFFFF]"
          onClick={() => {
            setTried(true);
            if (missing.length) return;
            const detail = item.options
              .flatMap((g) =>
                g.choices
                  .filter((c) => (picked[g.id] ?? []).includes(c.id))
                  .map((c) =>
                    g.id === "adicionais" ? `+ ${c.label}` : c.label,
                  ),
              )
              .join(" · ");
            onAdd({
              itemId: item.id,
              name: item.name,
              quantity: qty,
              unit,
              selections: picked,
              detail,
              notes: notes.trim(),
            });
          }}
        >
          Adicionar · {brl(unit * qty)}
        </button>
      </div>
      {tried && missing.length > 0 && (
        <p role="alert" className="px-5 pb-4 text-sm text-[#B91C1C]">
          Escolha: {missing.map((g) => g.name).join(", ")}.
        </p>
      )}
    </Sheet>
  );
}

export function Revisao(props: {
  title?: string;
  cart: CartLine[];
  total: number;
  busy: boolean;
  error: string;
  firstOrder: boolean;
  onQty: (key: string, q: number) => void;
  onClose: () => void;
  onSend: () => void;
}) {
  return (
    <Sheet title={props.title ?? "Seu pedido"} onClose={props.onClose}>
      <ul className="divide-y divide-[#E6EBF2] px-5">
        {props.cart.map((l) => (
          <li key={l.key} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold">{l.name}</p>
              {l.detail && (
                <p className="text-[13px] text-[#4A5568]">{l.detail}</p>
              )}
              {l.notes && (
                <p className="text-[13px] text-[#0865FE]">Obs.: {l.notes}</p>
              )}
              <p className="mt-1 text-sm font-bold text-[#0865FE] tabular-nums">
                {brl(l.unit * l.quantity)}
              </p>
            </div>
            <Stepper
              value={l.quantity}
              onChange={(q) => props.onQty(l.key, q)}
              label={l.name}
              allowZero
            />
          </li>
        ))}
      </ul>
      <div className="space-y-3 border-t border-[#E6EBF2] px-5 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        {props.firstOrder && (
          <p className="rounded-xl bg-[#0865FE]/10 px-4 py-3 text-[13px] leading-relaxed text-[#0865FE]">
            Primeiro pedido da mesa: o garçom passa para confirmar e ele vai
            para a cozinha.
          </p>
        )}
        {props.error && (
          <p role="alert" className="text-sm text-[#B91C1C]">
            {props.error}
          </p>
        )}
        <button
          type="button"
          disabled={props.busy || !props.cart.length}
          onClick={props.onSend}
          className="flex min-h-14 w-full items-center justify-between rounded-full bg-[#0865FE] px-6 text-[#FFFFFF] disabled:opacity-60"
        >
          <span className="text-[15px] font-extrabold">
            {props.busy ? "Enviando…" : "Enviar para a cozinha"}
          </span>
          <span className="text-[17px] font-black tabular-nums">
            {brl(props.total)}
          </span>
        </button>
      </div>
    </Sheet>
  );
}

function Conta({
  state,
  busy,
  onBill,
  reviewUrl,
  pay,
  send,
  error,
  slug,
  storeName,
}: {
  state: Extract<TableState, { member: true }>;
  busy: boolean;
  onBill: () => void;
  reviewUrl?: string;
  pay?: { on: boolean; needsEmail: boolean };
  slug: string;
  storeName: string;
  send: (body: Record<string, unknown>) => Promise<boolean>;
  error: string;
}) {
  const askedBill = state.calls.includes("conta");
  const canPay = Boolean(pay?.on) && state.confirmed && state.due > 0;
  return (
    <div className="space-y-3 px-4 pt-4">
      <section className="flex items-center justify-between gap-3 rounded-[20px] border border-[#DCE2EC] bg-[#FFFFFF] px-4 py-3.5">
        <div>
          <p className="text-[13px] text-[#4A5568]">
            Chame a mesa toda: o código é
          </p>
          <p className="text-3xl font-extrabold tracking-[0.22em]">
            {state.code}
          </p>
        </div>
        <p className="text-right text-xs text-[#4A5568]">
          {state.phones} {state.phones === 1 ? "celular" : "celulares"}
          <br />
          nesta mesa
        </p>
      </section>

      {!state.confirmed && state.orders.length > 0 && (
        <p className="rounded-2xl bg-[#0865FE]/10 px-4 py-3 text-[13px] leading-relaxed text-[#0865FE]">
          O garçom vai passar na mesa para confirmar. Depois disso, os pedidos
          vão direto para a cozinha.
        </p>
      )}

      {state.orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#DCE2EC] px-4 py-8 text-center text-sm text-[#4A5568]">
          Nenhum pedido ainda. Escolha no cardápio.
        </p>
      ) : (
        <ol className="space-y-3">
          {state.orders.map((o, i) => {
            const s = STATUS[o.status] ?? {
              label: o.status,
              tone: "bg-[#121826]/5 text-[#4A5568]",
            };
            return (
              <li
                key={o.id}
                className="rounded-[20px] border border-[#DCE2EC] px-4 py-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-bold text-[#4A5568]">
                    Pedido {i + 1}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.tone}`}
                  >
                    {s.label}
                  </span>
                </div>
                <ul className="mt-2 space-y-1">
                  {o.lines.map((l, j) => (
                    <li
                      key={j}
                      className={`flex justify-between gap-3 text-sm tabular-nums ${o.status === "recusado" ? "line-through opacity-60" : ""}`}
                    >
                      <span>
                        {l.quantity}× {l.name}
                      </span>
                      <span>{brl(l.total)}</span>
                    </li>
                  ))}
                </ul>
                {o.reason && (
                  <p className="mt-2 text-[13px] text-[#B91C1C]">{o.reason}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className="space-y-1 px-1 pt-1 tabular-nums">
        {(state.conta.servico > 0 || state.conta.couvert > 0) && (
          <>
            <p className="flex justify-between text-sm text-[#4A5568]">
              <span>Pedidos</span>
              <span>{brl(state.conta.itens)}</span>
            </p>
            {state.conta.servico > 0 && (
              <p className="flex justify-between text-sm text-[#4A5568]">
                <span>Taxa de serviço ({state.servicoPct}%, opcional)</span>
                <span>{brl(state.conta.servico)}</span>
              </p>
            )}
            {state.conta.couvert > 0 && (
              <p className="flex justify-between text-sm text-[#4A5568]">
                <span>Couvert</span>
                <span>{brl(state.conta.couvert)}</span>
              </p>
            )}
          </>
        )}
        <p className="flex justify-between text-lg font-extrabold">
          <span>Total da mesa</span>
          <span>{brl(state.total)}</span>
        </p>
        {state.credit > 0 && (
          <p className="flex justify-between text-sm text-[#4A5568]">
            <span>Sinal da reserva</span>
            <span>− {brl(Math.min(state.credit, state.total))}</span>
          </p>
        )}
        {state.paid > 0 && (
          <p className="flex justify-between text-sm text-[#15803D]">
            <span>Já pago pelo Pix</span>
            <span>− {brl(state.paid)}</span>
          </p>
        )}
        {(state.credit > 0 || state.paid > 0) && (
          <p className="flex justify-between font-bold">
            <span>Falta pagar</span>
            <span>{brl(state.due)}</span>
          </p>
        )}
      </div>
      {state.payments
        .filter((p) => p.refund)
        .map((p) => (
          <p
            key={p.id}
            role="status"
            className="rounded-2xl bg-[#F4F6FA] px-4 py-3 text-sm text-[#4A5568]"
          >
            {p.refund!.status === "falhou"
              ? `Seu Pix pagou ${brl(p.refund!.amount)} a mais e a devolução automática não funcionou. Fale com o garçom: o restaurante devolve no caixa.`
              : `${brl(p.refund!.amount)} do seu Pix ${p.refund!.status === "feito" ? "foram devolvidos" : "estão sendo devolvidos"}: a conta já estava paga nesse valor. O dinheiro volta pela conta de onde saiu o Pix.`}
          </p>
        ))}
      {canPay && (
        <PagarPix
          state={state}
          busy={busy}
          send={send}
          needsEmail={Boolean(pay?.needsEmail)}
          error={error}
          slug={slug}
          storeName={storeName}
        />
      )}
      <button
        type="button"
        disabled={busy || askedBill || state.orders.length === 0}
        onClick={onBill}
        className="min-h-14 w-full rounded-full bg-[#0865FE] text-base font-extrabold text-[#FFFFFF] disabled:bg-[#15803D]/20 disabled:text-[#15803D]"
      >
        {askedBill ? "Conta pedida: o garçom já vem" : "Pedir a conta"}
      </button>
      {askedBill && reviewUrl && <ReviewCard url={reviewUrl} />}
      <p className="pb-4 text-center text-xs text-[#6A7385]">
        Quando a conta for paga, o código {state.code} deixa de valer.
      </p>
    </div>
  );
}

/** Pay the bill (or one share) by Pix from the phone. The amount is worked out on the server. */
function PagarPix({
  state,
  busy,
  send,
  needsEmail,
  error,
  slug,
  storeName,
}: {
  state: Extract<TableState, { member: true }>;
  busy: boolean;
  send: (body: Record<string, unknown>) => Promise<boolean>;
  needsEmail: boolean;
  error: string;
  slug: string;
  storeName: string;
}) {
  const [open, setOpen] = useState(false);
  const [parts, setParts] = useState(1);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState("");
  const pending = state.payments.filter((p) => p.status === "aguardando");
  // Same rule as the server: a share of the whole bill, never more than what is left.
  const even = Math.ceil(Math.max(0, state.total - state.credit) / parts);
  const share = Math.min(state.due, even);
  const last = parts > 1 && share < even;
  const pendingIds = pending.map((p) => p.id).join(",");

  // While a real Pix is open, ask the server to check it every few seconds (the provider is asked at most every 10 s).
  // `send` changes on every render; keep the latest in a ref so the timer isn't reset by each poll.
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  useEffect(() => {
    if (!pendingIds) return;
    const ids = pendingIds.split(",");
    const t = window.setInterval(
      () =>
        ids.forEach(
          (id) => void sendRef.current({ action: "pagamento", payment: id }),
        ),
      10_000,
    );
    return () => window.clearInterval(t);
  }, [pendingIds]);

  return (
    <section className="space-y-3 rounded-3xl border border-[#DCE2EC] bg-[#FFFFFF] p-4">
      {pending.map((p) => (
        <div
          key={p.id}
          className="space-y-2 rounded-2xl bg-[#F4F6FA] p-3 text-center"
        >
          <p className="text-sm font-bold">
            Pix de {brl(p.amount)} aguardando pagamento
          </p>
          {p.pix && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${p.pix.qrBase64}`}
                alt={`QR Code do Pix de ${brl(p.amount)}`}
                width={180}
                height={180}
                className="mx-auto rounded-lg bg-white"
              />
              <button
                type="button"
                className="min-h-11 w-full rounded-full bg-[#0865FE] text-sm font-bold text-white"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(p.pix!.copyPaste);
                    setCopied(p.id);
                    window.setTimeout(() => setCopied(""), 2500);
                  } catch {}
                }}
              >
                {copied === p.id ? "Código copiado" : "Copiar código Pix"}
              </button>
              {p.pix.demo && (
                <button
                  type="button"
                  disabled={busy}
                  className="min-h-11 w-full rounded-full border border-[#C9D3E1] text-sm font-bold"
                  onClick={() => send({ action: "simular-pix", payment: p.id })}
                >
                  Simular pagamento (demonstração)
                </button>
              )}
              <p className="text-xs text-[#6A7385]">
                Esta tela confirma sozinha quando o Pix cair.
              </p>
            </>
          )}
        </div>
      ))}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-14 w-full rounded-full border-2 border-[#0865FE] text-base font-extrabold text-[#0865FE]"
        >
          Pagar pelo Pix
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-bold">Dividir a conta?</p>
          <div className="flex items-center justify-between gap-3">
            <Stepper
              value={parts}
              onChange={(v) => setParts(Math.max(1, Math.min(20, v)))}
              label="pessoas"
            />
            <p className="text-right text-sm text-[#4A5568]">
              {parts === 1
                ? state.paid > 0
                  ? "O que falta"
                  : "Conta inteira"
                : last
                  ? "Sua parte (o que falta)"
                  : `Conta ÷ ${parts} pessoas`}
              <br />
              <span className="text-xl font-extrabold text-[#121826] tabular-nums">
                {brl(share)}
              </span>
              {parts > 1 && !last && (
                <span className="text-[#4A5568]"> cada</span>
              )}
            </p>
          </div>
          {needsEmail && (
            <label className="block text-left">
              <span className="text-[13px] font-semibold text-[#4A5568]">
                Seu e-mail (o Mercado Pago pede para processar o Pix)
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-[#DCE2EC] px-3"
              />
            </label>
          )}
          {error && (
            <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={busy || share < 100}
            onClick={async () =>
              (await send({ action: "pagar", parts, email })) && setOpen(false)
            }
            className="min-h-14 w-full rounded-full bg-[#0865FE] text-base font-extrabold text-white disabled:opacity-50"
          >
            {parts === 1
              ? `Gerar Pix de ${brl(share)}`
              : `Gerar o meu Pix de ${brl(share)}`}
          </button>
          <p className="text-xs text-[#6A7385]">
            Divisão em partes iguais da conta: cada pessoa gera o seu Pix no
            próprio celular, e o último paga o que faltar. Ninguém é obrigado a
            pagar a parte de outro. Quando a conta toda estiver paga, a mesa
            fecha sozinha. Se pagarem a mais, ou se a mesa já estiver fechada, o
            valor é devolvido pelo Mercado Pago na conta de origem.
          </p>
          <p className="text-xs text-[#6A7385]">
            Você paga a {storeName}: o Pix vai direto para a conta do
            restaurante. O comprovante do Pix não é nota fiscal; peça ao garçom
            se precisar.{" "}
            <a href={`/privacidade/${slug}`} className="underline">
              Privacidade
            </a>
          </p>
        </div>
      )}
    </section>
  );
}

/** Asked of everyone who asks for the bill, whatever they thought of it; nothing is offered in return. */
function ReviewCard({ url }: { url: string }) {
  return (
    <section className="rounded-3xl border border-[#DCE2EC] bg-[#FFFFFF] p-5 text-center">
      <h2 className="text-base font-bold">Conta pra gente como foi?</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#4A5568]">
        Sua avaliação no Google ajuda outras pessoas a conhecer a casa.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#0865FE] text-base font-extrabold text-[#0865FE]"
      >
        Avaliar no Google
      </a>
    </section>
  );
}

function Obrigado({
  storeName,
  reviewUrl,
  refund,
  onBack,
}: {
  storeName: string;
  reviewUrl?: string;
  refund?: { amount: number; status: "feito" | "falhou" } | null;
  onBack: () => void;
}) {
  return (
    <Shell>
      <main className="px-5 pt-[max(24px,env(safe-area-inset-top))] pb-10">
        <p className="text-xl font-black tracking-tight text-[#0865FE] uppercase">
          {storeName}
        </p>
        <h1 className="mt-10 text-5xl leading-[0.95] font-black tracking-tight uppercase">
          Conta fechada. Obrigado!
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[#4A5568]">
          Volte sempre. O código da mesa já não vale mais.
        </p>
        {refund && (
          <p
            role="status"
            className="mt-4 rounded-2xl bg-[#F4F6FA] px-4 py-3 text-sm text-[#4A5568]"
          >
            {refund.status === "feito"
              ? `${brl(refund.amount)} do seu Pix foram devolvidos: a conta já estava paga nesse valor. O dinheiro volta pela conta de onde saiu o Pix.`
              : `Seu Pix pagou ${brl(refund.amount)} a mais e a devolução automática não funcionou. Fale com o caixa: o restaurante devolve.`}
          </p>
        )}
        {reviewUrl && (
          <div className="mt-8">
            <ReviewCard url={reviewUrl} />
          </div>
        )}
        <button
          type="button"
          onClick={onBack}
          className="mt-6 min-h-12 w-full rounded-full border border-[#DCE2EC] text-sm font-bold text-[#4A5568]"
        >
          Voltar ao início da mesa
        </button>
      </main>
    </Shell>
  );
}

export function Stepper({
  value,
  onChange,
  label,
  allowZero = false,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  allowZero?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label={`Menos ${label}`}
        disabled={!allowZero && value <= 1}
        onClick={() => onChange(value - 1)}
        className="grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-[#C9D3E1] text-xl disabled:opacity-40"
      >
        −
      </button>
      <span
        className="min-w-6 text-center text-base font-extrabold tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`Mais ${label}`}
        disabled={value >= 20}
        onClick={() => onChange(value + 1)}
        className="grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-[#C9D3E1] text-xl disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[88dvh] w-full flex-col rounded-t-[28px] border-t border-[#DCE2EC] bg-[#FFFFFF]"
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-11 w-11 place-items-center rounded-full border border-[#DCE2EC] text-xl"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

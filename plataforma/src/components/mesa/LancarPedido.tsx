"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { staffOrderAction } from "@/app/loja/[slug]/actions";
import { brl } from "@/lib/ordering";
import {
  Cardapio,
  OpcoesSheet,
  Revisao,
  priceOf,
  type CartLine,
  type MesaCategory,
  type MesaItem,
} from "./MesaApp";

/**
 * The waiter's order screen for one table, on the phone: the same menu the table sees, a tap adds an item
 * (items with options open their choices), and "Enviar para a cozinha" sends it straight to the kitchen,
 * into the table's bill. A free table is opened by the order itself.
 */
export function LancarPedido({
  slug,
  number,
  menu,
  onClose,
  onSent,
}: {
  slug: string;
  number: number;
  menu: MesaCategory[];
  onClose: () => void;
  onSent: () => void;
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [busca, setBusca] = useState("");
  const [escolhendo, setEscolhendo] = useState<MesaItem | null>(null);
  const [revendo, setRevendo] = useState(false);
  const [erro, setErro] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const q = busca.trim().toLocaleLowerCase("pt-BR");
  const visivel = useMemo(
    () =>
      q
        ? menu
            .map((c) => ({
              ...c,
              items: c.items.filter((i) =>
                i.name.toLocaleLowerCase("pt-BR").includes(q),
              ),
            }))
            .filter((c) => c.items.length)
        : menu,
    [menu, q],
  );
  const priced = useMemo(
    () => cart.map((l) => ({ ...l, unit: priceOf(menu, l) })),
    [cart, menu],
  );
  const count = priced.reduce((s, l) => s + l.quantity, 0);
  const total = priced.reduce((s, l) => s + l.unit * l.quantity, 0);

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
  const pick = (item: MesaItem) => {
    // No choices to make: one tap, one more. With choices: open them.
    if (!item.options.length)
      addLine({
        itemId: item.id,
        name: item.name,
        quantity: 1,
        unit: item.price,
        selections: {},
        detail: "",
        notes: "",
      });
    else setEscolhendo(item);
  };
  const setQty = (key: string, n: number) =>
    setCart((c) =>
      n <= 0
        ? c.filter((l) => l.key !== key)
        : c.map((l) =>
            l.key === key ? { ...l, quantity: Math.min(20, n) } : l,
          ),
    );

  const enviar = () =>
    start(async () => {
      setErro("");
      const r = await staffOrderAction(
        slug,
        number,
        priced.map((l) => ({
          productId: l.itemId,
          quantity: l.quantity,
          selections: l.selections,
          notes: l.notes,
        })),
        total,
      );
      if (!r.ok) return setErro(r.error ?? "Não foi possível lançar o pedido.");
      setCart([]);
      setRevendo(false);
      onSent();
    });

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#F4F6FA] text-[#121826]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lancar-titulo"
    >
      <header className="border-b border-[#E6EBF2] bg-[#F4F6FA]/95 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="lancar-titulo" className="text-xl font-extrabold">
              Pedido da mesa {number}
            </h2>
            <p className="text-[13px] text-[#4A5568]">
              Vai direto para a cozinha e entra na conta da mesa.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#DCE2EC] bg-white text-xl"
          >
            ×
          </button>
        </div>
        <label className="sr-only" htmlFor="busca-item">
          Procurar no cardápio
        </label>
        <input
          id="busca-item"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Procurar no cardápio…"
          className="mt-3 h-12 w-full rounded-2xl border-[1.5px] border-[#DCE2EC] bg-white px-4 text-[16px] focus:border-[#0865FE] focus:outline-none"
        />
      </header>

      <div className="flex-1 overflow-y-auto pb-28">
        {menu.length === 0 ? (
          <p className="px-5 pt-10 text-center text-[#4A5568]">
            O cardápio ainda não tem itens com preço. O dono monta em Preços e
            custos.
          </p>
        ) : visivel.length === 0 ? (
          <p className="px-5 pt-10 text-center text-[#4A5568]">
            Nada com “{busca}”.
          </p>
        ) : (
          <Cardapio menu={visivel} kitchenOpen onPick={pick} cart={cart} />
        )}
      </div>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 px-4 pt-2 pb-[max(16px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setRevendo(true)}
            className="flex min-h-14 w-full items-center justify-between rounded-full bg-[#0865FE] px-6 text-white shadow-lg"
          >
            <span className="text-[15px] font-extrabold">
              Ver pedido · {count} {count === 1 ? "item" : "itens"}
            </span>
            <span className="text-[17px] font-black tabular-nums">
              {brl(total)}
            </span>
          </button>
        </div>
      )}

      {escolhendo && (
        <OpcoesSheet
          item={escolhendo}
          onClose={() => setEscolhendo(null)}
          onAdd={(line) => {
            addLine(line);
            setEscolhendo(null);
          }}
        />
      )}
      {revendo && (
        <Revisao
          title={`Pedido da mesa ${number}`}
          cart={priced}
          total={total}
          busy={pending}
          error={erro}
          firstOrder={false}
          onQty={setQty}
          onClose={() => setRevendo(false)}
          onSend={enviar}
        />
      )}
    </div>
  );
}

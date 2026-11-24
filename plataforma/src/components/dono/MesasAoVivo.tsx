"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FloorForStaff } from "@/app/api/loja/[slug]/salao/route";
import {
  freeTableAction,
  seatAction,
  tableAction,
} from "@/app/loja/[slug]/actions";
import { contaConfigAction, mesasAction } from "@/app/loja/[slug]/dono/actions";
import { LancarPedido } from "@/components/mesa/LancarPedido";
import type { MesaCategory } from "@/components/mesa/MesaApp";
import { brl } from "@/lib/ordering";

type Mesa = FloorForStaff[number];
const POLL_MS = 8000;
const min = (iso: string, now: number) =>
  Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
const tempo = (m: number) =>
  m < 60
    ? `${m} min`
    : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;

/**
 * The owner's live view of the floor, for a computer: every table at a glance, calls on top. The owner
 * sets how many tables there are and marks a table taken (with how many people, if he wants) or free;
 * tables opened by phone through the QR show up by themselves with what they ordered.
 */
export function MesasAoVivo({
  slug,
  count: initialCount,
  qr,
  menu,
  conta,
}: {
  slug: string;
  count: number;
  qr: boolean;
  menu: MesaCategory[];
  /** Service charge (%) and cover charge per person (centavos) set now. */
  conta: { servico: number; couvert: number };
}) {
  const [mesas, setMesas] = useState<FloorForStaff | null>(null);
  const [count, setCount] = useState(initialCount);
  const [countText, setCountText] = useState(String(initialCount));
  const [now, setNow] = useState(() => Date.now());
  const [erro, setErro] = useState("");
  const [aberta, setAberta] = useState<number | null>(null);
  const [pessoas, setPessoas] = useState("");
  const [pending, start] = useTransition();
  const [lancando, setLancando] = useState<number | null>(null);
  const [aviso, setAviso] = useState("");
  // The green notice goes away by itself after a few seconds.
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(""), 4000);
    return () => window.clearTimeout(t);
  }, [aviso]);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/loja/${slug}/salao`, { cache: "no-store" });
      if (res.status === 401)
        return router.push(`/login?volta=/loja/${slug}/dono/mesas`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { tables: FloorForStaff; now: string };
      setMesas(data.tables);
      setNow(Date.parse(data.now));
      setErro("");
    } catch {
      setErro("Sem conexão. Tentando de novo…");
    }
  }, [slug, router]);

  useEffect(() => {
    const first = window.setTimeout(load, 0);
    const t = window.setInterval(load, POLL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [load]);

  /**
   * The screen changes at once (`optimistic`) and the server confirms behind it; on an error the
   * live floor is read again, which undoes the change on screen.
   */
  const run = (
    fn: () => Promise<{ ok: boolean; error?: string }>,
    after?: () => void,
    optimistic?: (m: FloorForStaff) => FloorForStaff,
  ) => {
    setErro("");
    if (optimistic) setMesas((m) => (m ? optimistic(m) : m));
    after?.();
    start(async () => {
      const r = await fn();
      if (!r.ok) setErro(r.error ?? "Não foi possível atualizar.");
      void load();
    });
  };
  const sentar =
    (n: number, people: number | null) =>
    (m: FloorForStaff): FloorForStaff => {
      const cur = m.find((x) => x.number === n);
      if (cur)
        return m.map((x) =>
          x.number === n
            ? { ...x, confirmed: true, people: people ?? x.people }
            : x,
        );
      const nova = {
        id: `novo-${n}`,
        number: n,
        code: "",
        openedAt: new Date(now).toISOString(),
        confirmed: true,
        devices: 0,
        calls: [],
        people,
        orders: [],
        total: 0,
      };
      return [...m, nova as unknown as Mesa].sort(
        (a, b) => a.number - b.number,
      );
    };
  const tirar = (n: number) => (m: FloorForStaff) =>
    m.filter((x) => x.number !== n);
  const abrir = (n: number, m?: Mesa) => {
    setAberta(aberta === n ? null : n);
    setPessoas(m?.people ? String(m.people) : "");
    setErro("");
  };
  const pessoasNum = pessoas.trim() ? Number(pessoas.replace(/\D/g, "")) : null;
  const pessoasOk =
    pessoasNum === null ||
    (Number.isInteger(pessoasNum) && pessoasNum >= 1 && pessoasNum <= 40);

  if (!mesas)
    return (
      <p className="mt-6 text-ink-mute">{erro || "Carregando as mesas…"}</p>
    );

  const byNumber = new Map(mesas.map((m) => [m.number, m]));
  const chamados = mesas
    .flatMap((m) =>
      m.calls.map((c) => ({ mesa: m.number, tipo: c.kind, desde: c.at })),
    )
    .sort((a, b) => a.desde.localeCompare(b.desde));
  const emAberto = mesas.reduce((n, m) => n + m.total, 0);
  const pessoasSentadas = mesas.reduce((n, m) => n + (m.people ?? 0), 0);
  const numbers = Array.from(
    { length: Math.max(count, ...mesas.map((m) => m.number)) },
    (_, i) => i + 1,
  );
  const novoCount = Number(countText.replace(/\D/g, ""));

  return (
    <div className="mt-6">
      {erro && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-bad px-3 py-2 text-sm font-semibold text-white"
        >
          {erro}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">
            Mesas ocupadas
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">
            {mesas.length}{" "}
            <span className="text-base font-semibold text-ink-mute">
              de {numbers.length}
            </span>
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">
            Pessoas sentadas
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">
            {pessoasSentadas || "—"}
          </p>
          <p className="text-xs text-ink-mute">quando alguém informa</p>
        </div>
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">
            Consumo pelo QR nas mesas abertas
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">
            {brl(emAberto)}
          </p>
        </div>
        <div className={`card p-4 ${chamados.length ? "border-bad" : ""}`}>
          <p className="text-[13px] font-semibold text-ink-mute">
            Chamando agora
          </p>
          <p
            className={`mt-1 text-2xl font-extrabold tabular-nums ${chamados.length ? "text-bad" : ""}`}
          >
            {chamados.length}
          </p>
        </div>
      </div>

      <form
        className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!Number.isInteger(novoCount) || novoCount < 1 || novoCount > 200)
            return setErro("Informe de 1 a 200 mesas.");
          const antes = count;
          setCount(novoCount);
          start(async () => {
            const r = await mesasAction(slug, novoCount);
            if (!r.ok) {
              setErro(r.error ?? "Não foi possível salvar.");
              setCount(antes);
              setCountText(String(antes));
            }
          });
        }}
      >
        <div>
          <label htmlFor="quantas" className="label">
            Quantas mesas o restaurante tem
          </label>
          <input
            id="quantas"
            className="field w-28 text-right tabular-nums"
            inputMode="numeric"
            value={countText}
            onChange={(e) => setCountText(e.target.value)}
          />
        </div>
        {novoCount !== count && (
          <button
            type="submit"
            className="btn-primary min-h-[42px]"
            disabled={pending}
          >
            Salvar
          </button>
        )}
        {!qr && (
          <p className="basis-full text-sm text-ink-mute">
            O pedido pelo QR está desligado: as mesas abrem quando você marca
            aqui. Para ligar o QR, fale com a Growlift.
          </p>
        )}
      </form>

      <ContaConfig slug={slug} inicial={conta} />

      {chamados.length > 0 && (
        <section
          aria-labelledby="chamados"
          className="card mt-4 border-bad p-5"
        >
          <h2 id="chamados" className="text-[17px] font-bold">
            Chamados de garçom
          </h2>
          <ul className="mt-2 divide-y divide-line">
            {chamados.map((c) => (
              <li
                key={`${c.mesa}-${c.tipo}`}
                className="flex flex-wrap items-center justify-between gap-3 py-2.5"
              >
                <span className="text-[15px]">
                  <strong>Mesa {c.mesa}</strong>{" "}
                  {c.tipo === "garcom" ? "chamou o garçom" : "pediu a conta"}{" "}
                  <span
                    className={
                      min(c.desde, now) >= 5
                        ? "font-semibold text-bad"
                        : "text-ink-mute"
                    }
                  >
                    há {tempo(min(c.desde, now))}
                  </span>
                </span>
                <button
                  type="button"
                  className="btn-ghost min-h-10 px-3"
                  onClick={() =>
                    run(
                      () =>
                        tableAction(
                          slug,
                          c.mesa,
                          c.tipo === "garcom"
                            ? "atender-garcom"
                            : "atender-conta",
                        ),
                      undefined,
                      (m) =>
                        m.map((x) =>
                          x.number === c.mesa
                            ? {
                                ...x,
                                calls: x.calls.filter((k) => k.kind !== c.tipo),
                              }
                            : x,
                        ),
                    )
                  }
                >
                  Já atendido
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        aria-label="Todas as mesas"
        className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
      >
        {numbers.map((n) => {
          const m = byNumber.get(n) as Mesa | undefined;
          const open = aberta === n;
          const pessoasForm = (label: string, onConfirm: () => void) => (
            <div className="mt-3 space-y-2 border-t border-line pt-3">
              <label
                className="block text-xs font-semibold text-ink-soft"
                htmlFor={`p-${n}`}
              >
                Pessoas{" "}
                <span className="font-normal text-ink-mute">(opcional)</span>
              </label>
              <input
                id={`p-${n}`}
                className="field py-1.5"
                inputMode="numeric"
                value={pessoas}
                onChange={(e) => setPessoas(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="btn-primary w-full"
                disabled={!pessoasOk}
                onClick={onConfirm}
              >
                {label}
              </button>
            </div>
          );
          if (!m)
            return (
              <div
                key={n}
                className={`rounded-xl border bg-white/60 p-4 ${open ? "border-accent bg-white" : "border-dashed border-line"}`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => abrir(n)}
                  aria-expanded={open}
                >
                  <p className="text-lg font-extrabold text-ink-mute">
                    Mesa {n}
                  </p>
                  <p className="text-sm text-ink-mute">
                    Livre · toque para ocupar ou pedir
                  </p>
                </button>
                {open &&
                  pessoasForm("Marcar ocupada", () =>
                    run(
                      () => seatAction(slug, n, pessoasNum),
                      () => setAberta(null),
                      sentar(n, pessoasNum),
                    ),
                  )}
                {open && (
                  <button
                    type="button"
                    className="btn-ghost mt-2 w-full"
                    onClick={() => {
                      setLancando(n);
                      setAberta(null);
                    }}
                  >
                    + Lançar pedido
                  </button>
                )}
              </div>
            );
          const chamando = m.calls.some((c) => c.kind === "garcom");
          const conta = m.calls.some((c) => c.kind === "conta");
          const pedidos = m.orders.filter(
            (o) => o.status !== "recusado",
          ).length;
          const pelaQr = m.devices > 0;
          return (
            <div
              key={n}
              className={`card p-4 ${chamando ? "border-2 border-bad" : conta ? "border-2 border-warn" : !m.confirmed ? "border-2 border-accent" : open ? "border-accent" : ""}`}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => abrir(n, m)}
                aria-expanded={open}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg font-extrabold">Mesa {n}</p>
                  <span className="text-xs text-ink-mute tabular-nums">
                    {tempo(min(m.openedAt, now))}
                  </span>
                </div>
                {pedidos > 0 ? (
                  <>
                    <p className="mt-1 text-xl font-bold tabular-nums">
                      {brl(m.total)}
                    </p>
                    <p className="text-xs text-ink-mute">
                      {pedidos} {pedidos === 1 ? "pedido" : "pedidos"} pelo QR
                      {m.people
                        ? ` · ${m.people} ${m.people === 1 ? "pessoa" : "pessoas"}`
                        : ""}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm font-semibold">
                    Ocupada
                    {m.people
                      ? ` · ${m.people} ${m.people === 1 ? "pessoa" : "pessoas"}`
                      : ""}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1">
                  {pelaQr && (
                    <span className="chip bg-accent-soft text-accent">
                      Conta aberta pelo QR
                    </span>
                  )}
                  {chamando && (
                    <span className="chip bg-bad/10 text-bad">Chamando</span>
                  )}
                  {conta && (
                    <span className="chip bg-warn/10 text-warn">
                      Pediu a conta
                    </span>
                  )}
                  {!m.confirmed && (
                    <span className="chip bg-accent-soft text-accent">
                      Confirmar mesa
                    </span>
                  )}
                </div>
              </button>
              {open && !m.confirmed && (
                <div className="mt-3 grid gap-2 border-t border-line pt-3">
                  <p className="text-xs text-ink-mute">
                    Alguém abriu esta mesa pelo QR. Tem gente sentada nela?
                  </p>
                  <button
                    type="button"
                    className="btn-primary w-full"
                    onClick={() =>
                      run(
                        () => tableAction(slug, n, "confirmar"),
                        () => setAberta(null),
                        sentar(n, null),
                      )
                    }
                  >
                    Sim, confirmar
                  </button>
                  <button
                    type="button"
                    className="btn-ghost w-full"
                    onClick={() =>
                      run(
                        () => tableAction(slug, n, "dispensar"),
                        () => setAberta(null),
                        tirar(n),
                      )
                    }
                  >
                    Não tem ninguém
                  </button>
                </div>
              )}
              {open && m.confirmed && (
                <>
                  <button
                    type="button"
                    className="btn-primary mt-3 w-full"
                    onClick={() => {
                      setLancando(n);
                      setAberta(null);
                    }}
                  >
                    + Lançar pedido
                  </button>
                  {pessoasForm("Salvar pessoas", () =>
                    run(
                      () => seatAction(slug, n, pessoasNum),
                      () => setAberta(null),
                      sentar(n, pessoasNum),
                    ),
                  )}
                  {pedidos > 0 ? (
                    <a
                      href={`/loja/${slug}/salao`}
                      className="btn-ghost mt-2 w-full"
                    >
                      Fechar a conta no salão
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="btn-ghost mt-2 w-full"
                      onClick={() =>
                        run(
                          () => freeTableAction(slug, n),
                          () => setAberta(null),
                          tirar(n),
                        )
                      }
                    >
                      Liberar a mesa
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </section>
      <p className="mt-3 text-xs text-ink-mute">
        Fechar a conta da mesa fica na tela do salão, onde se escolhe a forma de
        pagamento.
      </p>
      {lancando !== null && (
        <LancarPedido
          slug={slug}
          number={lancando}
          menu={menu}
          onClose={() => setLancando(null)}
          onSent={() => {
            setAviso(`Pedido da mesa ${lancando} enviado para a cozinha.`);
            setLancando(null);
            void load();
          }}
        />
      )}
      {aviso && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-6 z-30 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-ok px-4 py-3 text-sm font-semibold text-white shadow-lg"
        >
          {aviso}
          <button
            type="button"
            onClick={() => setAviso("")}
            aria-label="Fechar aviso"
            className="text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

const reais = (c: number) => (c ? (c / 100).toFixed(2).replace(".", ",") : "");

/** Service charge and cover charge, set by the owner; they show on the table's bill and in the menu. */
function ContaConfig({
  slug,
  inicial,
}: {
  slug: string;
  inicial: { servico: number; couvert: number };
}) {
  const [salvo, setSalvo] = useState(inicial);
  const [servico, setServico] = useState(String(inicial.servico || ""));
  const [couvert, setCouvert] = useState(reais(inicial.couvert));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const s = servico.trim() ? Number(servico.replace(/\D/g, "")) : 0;
  const cTxt = couvert
    .replace(/R\$|\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const c = cTxt ? Math.round(Number(cTxt) * 100) : 0;
  const valido =
    Number.isInteger(s) &&
    s >= 0 &&
    s <= 20 &&
    Number.isFinite(c) &&
    c >= 0 &&
    c <= 50_000;
  const mudou = s !== salvo.servico || c !== salvo.couvert;
  return (
    <form
      className="mt-4 flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valido)
          return setMsg({
            ok: false,
            text: "Taxa de 0 a 20% e couvert até R$ 500.",
          });
        start(async () => {
          const r = await contaConfigAction(slug, s, c);
          if (!r.ok)
            return setMsg({
              ok: false,
              text: r.error ?? "Não foi possível salvar.",
            });
          setSalvo({ servico: s, couvert: c });
          setMsg({ ok: true, text: "Salvo. Já vale nas contas abertas." });
        });
      }}
    >
      <div>
        <label htmlFor="servico" className="label">
          Taxa de serviço (%)
        </label>
        <input
          id="servico"
          className="field w-24 text-right tabular-nums"
          inputMode="numeric"
          placeholder="0"
          value={servico}
          onChange={(e) => setServico(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="couvert" className="label">
          Couvert por pessoa (R$)
        </label>
        <input
          id="couvert"
          className="field w-28 text-right tabular-nums"
          inputMode="decimal"
          placeholder="0,00"
          value={couvert}
          onChange={(e) => setCouvert(e.target.value)}
        />
      </div>
      {mudou && (
        <button
          type="submit"
          className="btn-primary min-h-[42px]"
          disabled={pending}
        >
          Salvar
        </button>
      )}
      <p className="basis-full text-xs text-ink-mute">
        A taxa de serviço aparece como opcional para o cliente e o garçom pode
        tirar de uma mesa. O couvert entra quando o número de pessoas da mesa é
        informado.
      </p>
      {msg && (
        <p
          role={msg.ok ? "status" : "alert"}
          className={`basis-full text-sm font-semibold ${msg.ok ? "text-ok" : "text-bad"}`}
        >
          {msg.text}
        </p>
      )}
    </form>
  );
}

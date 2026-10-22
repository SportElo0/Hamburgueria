"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import {
  itemsOf,
  menu,
  menuSettings,
  normalize,
  portionLabels,
  visibleCategories,
  type CategoryId,
  type MenuItem,
} from "@/data/menu";

const categories = visibleCategories();

export function Menu() {
  // Abre numa categoria; "Todos" é escolha explícita. A busca sempre cobre o cardápio inteiro.
  const [active, setActive] = useState<CategoryId | null>("peixes");
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  // Links "Ver no cardápio" dos destaques: limpa filtros e marca o prato.
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#prato-")) return;
      const dish = menu.find((m) => `#prato-${m.id}` === hash);
      setActive(dish?.category ?? null);
      setQuery("");
      setFlash(hash.slice(7));
      window.requestAnimationFrame(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ block: "center" });
      });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const term = normalize(query.trim());
  const groups = useMemo(
    () =>
      categories
        .filter((c) => term || !active || c.id === active)
        .map((c) => ({
          ...c,
          items: itemsOf(c.id).filter(
            (item) =>
              !term ||
              normalize([item.name, item.description, item.sides].filter(Boolean).join(" ")).includes(term),
          ),
        }))
        .filter((g) => g.items.length > 0),
    [active, term],
  );
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div id="cardapio-completo" className="scroll-mt-20 bg-sand">
      <div className="mx-auto max-w-[90rem] px-5 pt-20 pb-24 sm:px-8 lg:px-12 lg:pt-28">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
          <h3 data-reveal className="serif text-[clamp(2.1rem,4vw,3.4rem)] text-deep lg:col-span-6">
            Cardápio completo
          </h3>
          <div data-reveal className="text-[0.9375rem] leading-relaxed text-muted lg:col-span-5 lg:col-start-8">
            <p>{menuSettings.sourceNote}</p>
            {!menuSettings.showPrices && (
              <p className="mt-2">
                Valores informados no restaurante.{" "}
                <a
                  href={menuSettings.catalogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-deep"
                >
                  <span className="link-line">Catálogo digital do Convés</span>
                  <ArrowUpRight size={14} />
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Busca e categorias: ficam presas no topo enquanto a lista rola. */}
        <div className="sticky top-[4.25rem] z-20 -mx-5 mt-10 border-b border-line bg-sand px-5 pt-3 pb-3 sm:-mx-8 sm:px-8 lg:top-[4.75rem] lg:-mx-12 lg:px-12">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative block lg:w-[20rem] lg:flex-none">
              <span className="sr-only">Buscar prato</span>
              <Search
                size={18}
                strokeWidth={1.6}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar prato ou ingrediente"
                className="field pr-11 pl-11"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Limpar busca"
                  className="absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center text-muted hover:text-deep"
                >
                  <X size={18} />
                </button>
              )}
            </label>
            <div
              role="group"
              aria-label="Categorias do cardápio"
              className="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:flex-wrap"
            >
              {[{ id: null, name: "Todos" } as { id: CategoryId | null; name: string }, ...categories].map((c) => {
                const selected = active === c.id;
                return (
                  <button
                    key={c.id ?? "todos"}
                    type="button"
                    aria-pressed={selected && !term}
                    onClick={() => {
                      setActive(c.id);
                      setQuery("");
                    }}
                    className={`relative min-h-11 flex-none px-3.5 text-[0.9375rem] whitespace-nowrap transition-colors ${
                      selected && !term ? "font-semibold text-deep" : "text-ink/75 hover:text-deep"
                    }`}
                  >
                    {c.name}
                    <span
                      aria-hidden
                      className={`absolute inset-x-3.5 bottom-1 h-[2px] origin-left bg-champagne transition-transform duration-500 ease-[var(--ease-out-expo)] ${
                        selected && !term ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p aria-live="polite" className="mt-6 text-[0.875rem] text-muted">
          {term ? `${total} ${total === 1 ? "resultado" : "resultados"} para “${query.trim()}” em todo o cardápio` : ""}
        </p>

        {groups.length === 0 ? (
          <div className="py-16 text-center">
            <p className="serif text-[1.8rem] text-deep">Nenhum prato encontrado.</p>
            <p className="mt-2 text-muted">Tente outra palavra ou veja todas as categorias.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActive(null);
              }}
              className="btn btn-outline mt-6"
            >
              Ver o cardápio inteiro
            </button>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.id} aria-labelledby={`cat-${group.id}`} className="mt-10 first-of-type:mt-6">
              <div className="flex flex-col gap-1 border-b border-deep pb-3 sm:flex-row sm:items-end sm:justify-between">
                <h4 id={`cat-${group.id}`} className="serif text-[1.9rem] text-deep">
                  {group.name}
                </h4>
                <span className="text-[0.875rem] text-muted">
                  {group.items.length} {group.items.length === 1 ? "item" : "itens"}
                </span>
              </div>
              {group.hint && <p className="mt-3 max-w-[70ch] text-[0.9375rem] text-muted">{group.hint}</p>}
              <ul className="grid grid-cols-1 gap-x-14 lg:grid-cols-2">
                {group.items.map((item) => (
                  <Dish key={item.id} item={item} flash={flash === item.id} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function Dish({ item, flash }: { item: MenuItem; flash: boolean }) {
  const portions = portionLabels(item).filter((p) => p.label || p.price);
  return (
    <li
      id={`prato-${item.id}`}
      className={`scroll-mt-48 border-b border-line py-5 transition-colors duration-700 ${flash ? "bg-sage/60" : ""}`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h5 className="serif text-[1.3rem] leading-snug text-deep">{item.name}</h5>
        {portions.length > 0 && (
          <span className="flex flex-none gap-3 text-[0.8125rem] text-muted">
            {portions.map((p) => (
              <span key={p.label || "un"} className="whitespace-nowrap">
                {p.label}
                {p.price && <span className="tabular ml-1 font-semibold text-deep">{p.price}</span>}
              </span>
            ))}
          </span>
        )}
      </div>
      {item.description && <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink/85">{item.description}</p>}
      {item.sides && <p className="mt-1 text-[0.875rem] leading-relaxed text-muted">{item.sides}</p>}
      {item.note && <p className="mt-1 text-[0.8125rem] text-muted italic">{item.note}</p>}
    </li>
  );
}

'use client';

import { useMemo, useState, useTransition } from 'react';
import { saveCostsAction } from '@/app/painel/inteligencia/actions';
import { INGREDIENT_UNITS, unitCostOf, type CostSheet, type ProductCost } from '@/lib/inteligencia/custos';
import { brl } from '@/lib/ordering';

type Category = { name: string; items: { id: string; name: string; price: number | null }[] };

/** "12,50" → 1250. Vazio ou inválido → null. */
function toCents(text: string): number | null {
  const clean = text.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}
const fromCents = (c: number | null) => (c === null ? '' : (c / 100).toFixed(2).replace('.', ','));
const toNumber = (text: string) => {
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const newId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 10);

const EMPTY_PRODUCT: ProductCost = { mode: 'ficha', unitCost: null, recipe: [], packaging: null };

export function CostEditor({ slug, initial, etag: initialEtag, categories }: { slug: string; initial: CostSheet; etag: string | null; categories: Category[] }) {
  const [sheet, setSheet] = useState<CostSheet>(initial);
  const [etag, setEtag] = useState(initialEtag);
  const [status, setStatus] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<string | null>(null);

  const update = (fn: (s: CostSheet) => CostSheet) => {
    setStatus(null);
    setSheet((s) => fn(structuredClone(s)));
  };
  const setProduct = (id: string, fn: (p: ProductCost) => ProductCost | null) =>
    update((s) => {
      const next = fn(structuredClone(s.products[id] ?? EMPTY_PRODUCT));
      if (next) s.products[id] = next;
      else delete s.products[id];
      return s;
    });

  const ingredientIds = useMemo(() => new Set(sheet.ingredients.map((i) => i.id)), [sheet.ingredients]);

  const save = () =>
    start(async () => {
      const r = await saveCostsAction(slug, sheet, etag);
      if (r.ok) {
        setEtag(r.etag ?? null);
        setStatus({ tone: 'ok', text: 'Custos salvos.' });
      } else setStatus({ tone: 'bad', text: r.error ?? 'Erro ao salvar.' });
    });

  return (
    <div className="space-y-5 pb-24">
      <section className="card space-y-4 p-5">
        <h2 className="font-bold">Taxas e embalagem</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {(['pix', 'cartao', 'dinheiro'] as const).map((m) => (
            <div key={m}>
              <label className="label" htmlFor={`taxa-${m}`}>
                Taxa {m === 'pix' ? 'do Pix' : m === 'cartao' ? 'do cartão' : 'do dinheiro'} (%)
              </label>
              <input
                id={`taxa-${m}`}
                className="field"
                inputMode="decimal"
                defaultValue={(sheet.fees[m] / 100).toString().replace('.', ',')}
                onChange={(e) => update((s) => ({ ...s, fees: { ...s.fees, [m]: Math.min(5000, Math.round(toNumber(e.target.value) * 100)) } }))}
              />
            </div>
          ))}
          <div>
            <label className="label" htmlFor="embalagem">
              Embalagem padrão por item (R$)
            </label>
            <input id="embalagem" className="field" inputMode="decimal" defaultValue={fromCents(sheet.packagingDefault)} onChange={(e) => update((s) => ({ ...s, packagingDefault: toCents(e.target.value) ?? 0 }))} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sheet.feesConfirmed} onChange={(e) => update((s) => ({ ...s, feesConfirmed: e.target.checked }))} className="size-4" />
          A loja confirmou essas taxas (extrato da maquininha e do Pix)
        </label>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">Insumos</h2>
          <button
            type="button"
            className="btn-ghost min-h-9 px-3"
            onClick={() => update((s) => ({ ...s, ingredients: [...s.ingredients, { id: newId(), name: 'Novo insumo', unit: 'kg', costPerUnit: 0 }] }))}
          >
            + Insumo
          </button>
        </div>
        {sheet.ingredients.length === 0 ? (
          <p className="mt-2 text-sm text-ink-mute">Cadastre os insumos para montar fichas técnicas (ou use o custo direto em cada item).</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sheet.ingredients.map((ing, idx) => (
              <li key={ing.id} className="grid grid-cols-[1fr_5.5rem_7.5rem_auto] items-end gap-2">
                <div>
                  <label className="label" htmlFor={`ing-${ing.id}`}>
                    Nome
                  </label>
                  <input id={`ing-${ing.id}`} className="field" value={ing.name} maxLength={80} onChange={(e) => update((s) => ((s.ingredients[idx].name = e.target.value), s))} />
                </div>
                <div>
                  <label className="label" htmlFor={`uni-${ing.id}`}>
                    Unidade
                  </label>
                  <select id={`uni-${ing.id}`} className="field" value={ing.unit} onChange={(e) => update((s) => ((s.ingredients[idx].unit = e.target.value as typeof ing.unit), s))}>
                    {INGREDIENT_UNITS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor={`cus-${ing.id}`}>
                    R$ por {ing.unit}
                  </label>
                  <input
                    id={`cus-${ing.id}`}
                    className="field"
                    inputMode="decimal"
                    defaultValue={fromCents(ing.costPerUnit)}
                    onChange={(e) => update((s) => ((s.ingredients[idx].costPerUnit = toCents(e.target.value) ?? 0), s))}
                  />
                </div>
                <button
                  type="button"
                  className="btn-danger min-h-10 px-3"
                  aria-label={`Remover ${ing.name}`}
                  onClick={() => {
                    const used = Object.values(sheet.products).some((p) => p.recipe.some((l) => l.ingredientId === ing.id));
                    if (used && !confirm(`${ing.name} está em fichas técnicas. Remover também dessas fichas?`)) return;
                    update((s) => {
                      s.ingredients.splice(idx, 1);
                      for (const p of Object.values(s.products)) p.recipe = p.recipe.filter((l) => l.ingredientId !== ing.id);
                      return s;
                    });
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">Custo de cada item</h2>
        {categories.map((cat) => (
          <div key={cat.name} className="card divide-y divide-line">
            <p className="px-5 py-3 text-sm font-bold">{cat.name}</p>
            {cat.items.map((item) => {
              const p = sheet.products[item.id];
              const cost = unitCostOf(sheet, item.id);
              const isOpen = open === item.id;
              return (
                <div key={item.id} className="px-5 py-3">
                  <button type="button" className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : item.id)}>
                    <span className="min-w-0">
                      <span className="font-semibold">{item.name}</span>
                      <span className="block text-xs text-ink-mute">Preço {item.price === null ? 'sem preço' : brl(item.price)}</span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums">
                      {cost === null ? (
                        <span className="text-warn">sem custo</span>
                      ) : (
                        <>
                          {brl(cost)}
                          {item.price ? <span className="text-ink-mute"> · margem {Math.round(((item.price - cost) / item.price) * 100)}%</span> : null}
                        </>
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="mt-3 space-y-3 rounded-lg bg-paper p-3">
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Forma de informar o custo">
                        {(['ficha', 'manual'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            role="radio"
                            aria-checked={(p?.mode ?? 'ficha') === mode}
                            onClick={() => setProduct(item.id, (cur) => ({ ...cur, mode }))}
                            className={`btn min-h-9 border px-3 text-[13px] ${(p?.mode ?? 'ficha') === mode ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}
                          >
                            {mode === 'ficha' ? 'Ficha técnica' : 'Custo direto'}
                          </button>
                        ))}
                        {p && (
                          <button type="button" className="btn min-h-9 px-3 text-[13px] text-ink-mute" onClick={() => setProduct(item.id, () => null)}>
                            Limpar custo
                          </button>
                        )}
                      </div>
                      {(p?.mode ?? 'ficha') === 'manual' ? (
                        <div className="max-w-xs">
                          <label className="label" htmlFor={`man-${item.id}`}>
                            Custo por unidade, sem embalagem (R$)
                          </label>
                          <input id={`man-${item.id}`} className="field" inputMode="decimal" defaultValue={fromCents(p?.unitCost ?? null)} onChange={(e) => setProduct(item.id, (cur) => ({ ...cur, unitCost: toCents(e.target.value) }))} />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(p?.recipe ?? []).map((line, li) => (
                            <div key={li} className="grid grid-cols-[1fr_7rem_auto] items-end gap-2">
                              <select
                                aria-label="Insumo"
                                className="field"
                                value={ingredientIds.has(line.ingredientId) ? line.ingredientId : ''}
                                onChange={(e) => setProduct(item.id, (cur) => ((cur.recipe[li].ingredientId = e.target.value), cur))}
                              >
                                {sheet.ingredients.map((ing) => (
                                  <option key={ing.id} value={ing.id}>
                                    {ing.name} ({ing.unit})
                                  </option>
                                ))}
                              </select>
                              <input
                                aria-label="Quantidade por unidade do item"
                                className="field"
                                inputMode="decimal"
                                defaultValue={String(line.quantity).replace('.', ',')}
                                onChange={(e) => setProduct(item.id, (cur) => ((cur.recipe[li].quantity = toNumber(e.target.value)), cur))}
                              />
                              <button type="button" className="btn-danger min-h-10 px-3" aria-label="Remover insumo da ficha" onClick={() => setProduct(item.id, (cur) => ((cur.recipe.splice(li, 1)), cur))}>
                                ×
                              </button>
                            </div>
                          ))}
                          {sheet.ingredients.length ? (
                            <button
                              type="button"
                              className="btn-ghost min-h-9 px-3 text-[13px]"
                              onClick={() => setProduct(item.id, (cur) => ({ ...cur, recipe: [...cur.recipe, { ingredientId: sheet.ingredients[0].id, quantity: 0 }] }))}
                            >
                              + Insumo na ficha
                            </button>
                          ) : (
                            <p className="text-sm text-ink-mute">Cadastre insumos acima ou use o custo direto.</p>
                          )}
                        </div>
                      )}
                      <div className="max-w-xs">
                        <label className="label" htmlFor={`emb-${item.id}`}>
                          Embalagem deste item (R$, vazio = padrão)
                        </label>
                        <input
                          id={`emb-${item.id}`}
                          className="field"
                          inputMode="decimal"
                          defaultValue={fromCents(p?.packaging ?? null)}
                          onChange={(e) => setProduct(item.id, (cur) => ({ ...cur, packaging: toCents(e.target.value) }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 px-4 py-3">
          {status && (
            <p role="status" className={`text-sm ${status.tone === 'ok' ? 'text-ok' : 'text-bad'}`}>
              {status.text}
            </p>
          )}
          <button type="button" className="btn-primary" disabled={pending} onClick={save}>
            {pending ? 'Salvando…' : 'Salvar custos'}
          </button>
        </div>
      </div>
    </div>
  );
}

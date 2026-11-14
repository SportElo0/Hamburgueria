'use client';

import { DESSERT_MODES, DESSERT_MODE_LABEL, dessertCategoryIds, type Sobremesa } from '@/lib/sobremesa';
import type { Store } from '@/lib/schema';

/**
 * The team's settings for "Hora da sobremesa": the mode (off and only measuring, half the tables as a test, or
 * every table), which categories are dessert, up to 3 items to show first and how long after the main course.
 * Saved with the store; publish to apply.
 */
export function SobremesaSettings({ value, store, ordersUrl, onChange }: { value: Sobremesa; store: Store; ordersUrl: string; onChange: (v: Sobremesa) => void }) {
  const cats = store.catalog.categories.filter((c) => c.id !== 'adicionais');
  const dessertCats = dessertCategoryIds(store, value);
  const items = store.catalog.categories.flatMap((c) => c.items.map((i) => ({ id: i.id, name: i.name, has3d: Boolean(i.modelo3d), dessert: dessertCats.has(c.id) })));
  const set = <K extends keyof Sobremesa>(k: K, v: Sobremesa[K]) => onChange({ ...value, [k]: v });
  const toggleFeatured = (id: string, on: boolean) => set('featured', on ? [...value.featured, id].slice(0, 3) : value.featured.filter((x) => x !== id));
  const noDessert = dessertCats.size === 0;

  return (
    <section className="card space-y-5 p-5 lg:col-span-2">
      <div>
        <h2 className="text-lg font-bold">Hora da sobremesa</h2>
        <p className="text-sm text-ink-mute">
          Depois do prato principal (ou quando a mesa pede a conta), o celular da mesa mostra até 3 sobremesas, as que têm 3D primeiro, e a tela do garçom avisa qual mesa ainda não pediu doce. A
          conta fechada guarda quantas sobremesas saíram, para comparar mesas com e sem o aviso (mapa › Tempo nas mesas).
        </p>
      </div>

      <fieldset>
        <legend className="label">Como usar</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {DESSERT_MODES.map((m) => (
            <label key={m} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-semibold ${value.mode === m ? 'border-accent bg-accent text-white' : 'border-line bg-white'}`}>
              <input type="radio" name="sobremesa-modo" className="sr-only" checked={value.mode === m} onChange={() => set('mode', m)} />
              {DESSERT_MODE_LABEL[m]}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-mute">
          {value.mode === 'desligado' && 'Nada aparece para o cliente nem para o garçom. As sobremesas continuam contadas: são as semanas de "antes".'}
          {value.mode === 'metade' && 'Só as mesas de número ímpar recebem o aviso; as pares ficam como comparação. É o teste para saber se o aviso muda alguma coisa.'}
          {value.mode === 'todas' && 'Todas as mesas recebem o aviso. A comparação passa a ser com as semanas de antes.'}
        </p>
      </fieldset>

      <div>
        <h3 className="font-bold">Quais categorias são sobremesa</h3>
        <p className="text-sm text-ink-mute">Sem marcar nenhuma, vale o nome da categoria (sobremesas, doces, sorvetes, açaí…).</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {cats.map((c) => {
            const on = value.categories.includes(c.id);
            return (
              <label key={c.id} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${on ? 'border-accent bg-accent text-white' : dessertCats.has(c.id) ? 'border-accent bg-white text-accent' : 'border-line bg-white'}`}>
                <input type="checkbox" className="sr-only" checked={on} onChange={(e) => set('categories', e.target.checked ? [...value.categories, c.id] : value.categories.filter((x) => x !== c.id))} />
                {c.name}
              </label>
            );
          })}
        </div>
        {noDessert && <p className="mt-2 text-sm font-semibold text-warn">Nenhuma categoria de sobremesa encontrada: marque uma, senão o aviso não aparece.</p>}
      </div>

      <div>
        <h3 className="font-bold">Mostrar primeiro (até 3)</h3>
        <p className="text-sm text-ink-mute">Sem escolher, aparecem as sobremesas com 3D primeiro. Item esgotado não aparece.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {items
            .filter((i) => i.dessert || value.featured.includes(i.id))
            .map((i) => {
              const on = value.featured.includes(i.id);
              const full = !on && value.featured.length >= 3;
              return (
                <label key={i.id} className={`flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm ${full ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${on ? 'border-accent bg-accent text-white' : 'border-line bg-white'}`}>
                  <input type="checkbox" className="sr-only" checked={on} disabled={full} onChange={(e) => toggleFeatured(i.id, e.target.checked)} />
                  {i.name}
                  {i.has3d && <span className={`chip ${on ? 'bg-white/20 text-white' : 'bg-accent/10 text-accent'}`}>3D</span>}
                </label>
              );
            })}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="sobremesa-min" className="label">
            Minutos depois do prato pronto
          </label>
          <input
            id="sobremesa-min"
            className="field w-24"
            inputMode="numeric"
            value={value.minutes}
            onChange={(e) => set('minutes', Math.max(5, Math.min(90, Number(e.target.value.replace(/\D/g, '')) || 5)))}
          />
        </div>
        <a href={`${ordersUrl}/sobremesa-qr`} className="btn-ghost" target="_blank" rel="noreferrer">
          Cartão &quot;Sobremesa em 3D&quot; para imprimir
        </a>
      </div>
    </section>
  );
}

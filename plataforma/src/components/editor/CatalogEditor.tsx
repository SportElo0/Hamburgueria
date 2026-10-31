'use client';

import { useState } from 'react';
import { emptyItem, newId, type Item, type Store } from '@/lib/schema';
import type { Update } from './StoreEditor';
import { ItemEditor } from './ItemEditor';

function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return;
  const [x] = list.splice(from, 1);
  list.splice(to, 0, x);
}

export function CatalogEditor({ store, update }: { store: Store; update: Update }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const categories = store.catalog.categories;
  const itemCount = categories.reduce((n, c) => n + c.items.length, 0);
  const soldOut = categories.reduce((n, c) => n + c.items.filter((i) => !i.available).length, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-mute">
          {categories.length} categorias · {itemCount} itens{soldOut > 0 && ` · ${soldOut} indisponível(is)`}
        </p>
        <div className="flex gap-2">
          <input type="search" placeholder="Buscar item…" aria-label="Buscar item" className="field w-56" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button
            type="button"
            className="btn-ghost"
            onClick={() => update((d) => void d.catalog.categories.push({ id: newId(), name: 'Nova categoria', description: '', items: [] }))}
          >
            + Categoria
          </button>
        </div>
      </div>

      {categories.length === 0 && (
        <div className="card p-10 text-center text-sm text-ink-mute">Nenhuma categoria. Comece criando uma (ex.: Burgers, Bebidas, Camisetas).</div>
      )}

      {categories.map((cat, ci) => {
        const items = cat.items.map((item, ii) => ({ item, ii })).filter(({ item }) => !q || item.name.toLowerCase().includes(q));
        if (q && items.length === 0) return null;
        return (
          <section key={cat.id} className="card p-4 md:p-5" aria-label={`Categoria ${cat.name}`}>
            <div className="flex flex-wrap items-start gap-3">
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,14rem)_1fr]">
                <input
                  aria-label="Nome da categoria"
                  className="field font-bold"
                  value={cat.name}
                  onChange={(e) => update((d) => void (d.catalog.categories[ci].name = e.target.value))}
                />
                <input
                  aria-label="Descrição da categoria"
                  placeholder="Descrição (opcional)"
                  className="field"
                  value={cat.description}
                  onChange={(e) => update((d) => void (d.catalog.categories[ci].description = e.target.value))}
                />
              </div>
              <div className="flex gap-1">
                <IconButton label="Subir categoria" onClick={() => update((d) => move(d.catalog.categories, ci, ci - 1))} disabled={ci === 0}>↑</IconButton>
                <IconButton label="Descer categoria" onClick={() => update((d) => move(d.catalog.categories, ci, ci + 1))} disabled={ci === categories.length - 1}>↓</IconButton>
                <IconButton
                  label="Excluir categoria"
                  danger
                  onClick={() => {
                    if (confirm(`Excluir a categoria “${cat.name}” e seus ${cat.items.length} itens?`)) update((d) => void d.catalog.categories.splice(ci, 1));
                  }}
                >
                  ✕
                </IconButton>
              </div>
            </div>

            <ul className="mt-4 divide-y divide-line border-y border-line">
              {items.map(({ item, ii }) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  slug={store.slug}
                  expanded={open === item.id}
                  onToggle={() => setOpen(open === item.id ? null : item.id)}
                  first={ii === 0}
                  last={ii === cat.items.length - 1}
                  change={(fn) => update((d) => fn(d.catalog.categories[ci].items[ii]))}
                  moveBy={(delta) => update((d) => move(d.catalog.categories[ci].items, ii, ii + delta))}
                  duplicate={() =>
                    update((d) => void d.catalog.categories[ci].items.splice(ii + 1, 0, { ...structuredClone(item), id: newId(), name: `${item.name} (cópia)` }))
                  }
                  remove={() => {
                    if (confirm(`Excluir “${item.name || 'item sem nome'}”?`)) update((d) => void d.catalog.categories[ci].items.splice(ii, 1));
                  }}
                />
              ))}
            </ul>
            {!q && (
              <button
                type="button"
                className="btn-ghost mt-3"
                onClick={() => {
                  const fresh = emptyItem();
                  update((d) => void d.catalog.categories[ci].items.push(fresh));
                  setOpen(fresh.id);
                }}
              >
                + Item em {cat.name}
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ItemRow(props: {
  item: Item;
  slug: string;
  expanded: boolean;
  onToggle: () => void;
  first: boolean;
  last: boolean;
  change: (fn: (item: Item) => void) => void;
  moveBy: (delta: number) => void;
  duplicate: () => void;
  remove: () => void;
}) {
  const { item } = props;
  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <Thumb src={item.image} />
        <button type="button" onClick={props.onToggle} aria-expanded={props.expanded} className="min-w-0 flex-1 cursor-pointer text-left">
          <span className={`block truncate font-semibold ${item.available ? '' : 'text-ink-mute line-through'}`}>{item.name || 'Item sem nome'}</span>
          <span className="block truncate text-xs text-ink-mute">
            {item.price !== null ? `R$ ${(item.price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : item.priceLabel || 'Sem preço'}
            {item.featured && ' · destaque'}
            {item.options.length > 0 && ` · ${item.options.length} grupo(s) de opções`}
          </span>
        </button>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-semibold">
          <input type="checkbox" className="h-4 w-4 accent-ok" checked={item.available} onChange={(e) => props.change((i) => void (i.available = e.target.checked))} />
          {item.available ? 'Disponível' : 'Esgotado'}
        </label>
        <div className="hidden gap-1 sm:flex">
          <IconButton label="Subir item" onClick={() => props.moveBy(-1)} disabled={props.first}>↑</IconButton>
          <IconButton label="Descer item" onClick={() => props.moveBy(1)} disabled={props.last}>↓</IconButton>
        </div>
      </div>
      {props.expanded && (
        <div className="mt-4 rounded-lg bg-paper p-4">
          <ItemEditor item={item} slug={props.slug} change={props.change} />
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            <button type="button" className="btn-ghost sm:hidden" onClick={() => props.moveBy(-1)} disabled={props.first}>Subir</button>
            <button type="button" className="btn-ghost sm:hidden" onClick={() => props.moveBy(1)} disabled={props.last}>Descer</button>
            <button type="button" className="btn-ghost" onClick={props.duplicate}>Duplicar</button>
            <button type="button" className="btn-danger" onClick={props.remove}>Excluir item</button>
          </div>
        </div>
      )}
    </li>
  );
}

export function mediaSrc(src: string) {
  return !src ? '' : /^https?:\/\//.test(src) ? src : `/api/midia/${src.replace(/^midia\//, '')}`;
}

function Thumb({ src }: { src: string }) {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-paper text-[10px] text-ink-mute">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={mediaSrc(src)} alt="" className="h-full w-full object-cover" loading="lazy" /> : 'sem foto'}
    </span>
  );
}

export function IconButton(props: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      onClick={props.onClick}
      disabled={props.disabled}
      className={`grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-line bg-white text-sm disabled:cursor-not-allowed disabled:opacity-40 ${props.danger ? 'text-bad hover:border-bad' : 'hover:border-ink'}`}
    >
      {props.children}
    </button>
  );
}

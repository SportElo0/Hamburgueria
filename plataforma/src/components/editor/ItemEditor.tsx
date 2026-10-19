'use client';

import { useRef, useState } from 'react';
import { newId, type Item } from '@/lib/schema';
import { formatPrice, parsePrice } from '@/lib/slug';
import { uploadImageAction } from '@/app/painel/actions';
import { IconButton, mediaSrc } from './CatalogEditor';

export function ItemEditor({ item, slug, change }: { item: Item; slug: string; change: (fn: (i: Item) => void) => void }) {
  const base = `item-${item.id}`;
  return (
    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
      <ImageField item={item} slug={slug} change={change} />
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
          <div>
            <label htmlFor={`${base}-nome`} className="label">Nome</label>
            <input id={`${base}-nome`} className="field" value={item.name} onChange={(e) => change((i) => void (i.name = e.target.value))} />
          </div>
          <PriceField id={`${base}-preco`} value={item.price} onChange={(v) => change((i) => void (i.price = v))} />
        </div>
        <div>
          <label htmlFor={`${base}-desc`} className="label">Descrição</label>
          <textarea id={`${base}-desc`} rows={3} className="field resize-y" value={item.description} onChange={(e) => change((i) => void (i.description = e.target.value))} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${base}-plabel`} className="label">Texto no lugar do preço (opcional)</label>
            <input
              id={`${base}-plabel`}
              placeholder="Ex.: Consulte · a partir de"
              className="field"
              value={item.priceLabel}
              onChange={(e) => change((i) => void (i.priceLabel = e.target.value))}
            />
          </div>
          <div>
            <label htmlFor={`${base}-tags`} className="label">Etiquetas (separadas por vírgula)</label>
            <input
              id={`${base}-tags`}
              placeholder="Ex.: vegano, novo, picante"
              className="field"
              defaultValue={item.tags.join(', ')}
              onBlur={(e) =>
                change(
                  (i) =>
                    void (i.tags = e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .slice(0, 10)),
                )
              }
            />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-4 w-4 accent-accent" checked={item.featured} onChange={(e) => change((i) => void (i.featured = e.target.checked))} />
          Destacar este item
        </label>
        <OptionsEditor item={item} change={change} />
      </div>
    </div>
  );
}

function PriceField({ id, value, onChange }: { id: string; value: number | null; onChange: (v: number | null) => void }) {
  const [text, setText] = useState(formatPrice(value));
  const [error, setError] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">Preço (R$)</label>
      <input
        id={id}
        inputMode="decimal"
        placeholder="Sem preço"
        className={`field tabular-nums ${error ? 'border-bad' : ''}`}
        value={text}
        aria-invalid={error}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const cents = parsePrice(text);
          if (Number.isNaN(cents)) return setError(true);
          setError(false);
          setText(formatPrice(cents));
          onChange(cents);
        }}
      />
      {error && <p className="mt-1 text-xs font-semibold text-bad">Use o formato 54,90</p>}
    </div>
  );
}

function ImageField({ item, slug, change }: { item: Item; slug: string; change: (fn: (i: Item) => void) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File) => {
    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.set('arquivo', file);
    const res = await uploadImageAction(slug, fd);
    setUploading(false);
    if (!res.ok || !res.key) return setError(res.error ?? 'Falha no envio.');
    change((i) => void (i.image = res.key!));
  };

  return (
    <div>
      <span className="label">Foto</span>
      <div className="grid aspect-square place-items-center overflow-hidden rounded-lg border border-dashed border-line bg-white text-xs text-ink-mute">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.image ? <img src={mediaSrc(item.image)} alt={item.imageAlt} className="h-full w-full object-contain" /> : 'Sem foto'}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        aria-label="Enviar foto"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = '';
        }}
      />
      <div className="mt-2 flex gap-2">
        <button type="button" className="btn-ghost min-h-9 flex-1 px-2" disabled={uploading} onClick={() => input.current?.click()}>
          {uploading ? 'Enviando…' : item.image ? 'Trocar' : 'Enviar foto'}
        </button>
        {item.image && (
          <button type="button" className="btn-danger min-h-9 px-2" onClick={() => change((i) => void (i.image = ''))}>
            Remover
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs font-semibold text-bad">{error}</p>}
      <label htmlFor={`alt-${item.id}`} className="label mt-3">Descrição da foto</label>
      <input
        id={`alt-${item.id}`}
        placeholder="Para leitores de tela"
        className="field text-sm"
        value={item.imageAlt}
        onChange={(e) => change((i) => void (i.imageAlt = e.target.value))}
      />
    </div>
  );
}

function OptionsEditor({ item, change }: { item: Item; change: (fn: (i: Item) => void) => void }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Opções e adicionais</p>
          <p className="text-xs text-ink-mute">Ex.: tamanho (P, M, G), sabor, ponto da carne, adicionais pagos.</p>
        </div>
        <button
          type="button"
          className="btn-ghost min-h-9 px-3"
          onClick={() => change((i) => void i.options.push({ id: newId(), name: 'Nova opção', type: 'single', required: false, choices: [] }))}
        >
          + Grupo
        </button>
      </div>
      {item.options.map((g, gi) => (
        <div key={g.id} className="mt-3 rounded-lg bg-paper p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              aria-label="Nome do grupo"
              className="field min-w-0 flex-1 font-semibold"
              value={g.name}
              onChange={(e) => change((i) => void (i.options[gi].name = e.target.value))}
            />
            <select
              aria-label="Tipo de escolha"
              className="field w-auto"
              value={g.type}
              onChange={(e) => change((i) => void (i.options[gi].type = e.target.value as 'single' | 'multiple'))}
            >
              <option value="single">Escolhe 1</option>
              <option value="multiple">Escolhe vários</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs font-semibold">
              <input type="checkbox" checked={g.required} onChange={(e) => change((i) => void (i.options[gi].required = e.target.checked))} />
              Obrigatório
            </label>
            <IconButton label="Excluir grupo" danger onClick={() => change((i) => void i.options.splice(gi, 1))}>✕</IconButton>
          </div>
          <ul className="mt-2 space-y-2">
            {g.choices.map((c, chi) => (
              <li key={c.id} className="flex items-center gap-2">
                <input
                  aria-label="Nome da escolha"
                  className="field min-w-0 flex-1"
                  value={c.label}
                  onChange={(e) => change((i) => void (i.options[gi].choices[chi].label = e.target.value))}
                />
                <ChoicePrice value={c.priceDelta} onChange={(v) => change((i) => void (i.options[gi].choices[chi].priceDelta = v))} />
                <IconButton label="Excluir escolha" danger onClick={() => change((i) => void i.options[gi].choices.splice(chi, 1))}>✕</IconButton>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-2 cursor-pointer text-sm font-semibold text-accent"
            onClick={() => change((i) => void i.options[gi].choices.push({ id: newId(), label: '', priceDelta: 0 }))}
          >
            + Escolha
          </button>
        </div>
      ))}
    </div>
  );
}

function ChoicePrice({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(value ? formatPrice(value) : '');
  return (
    <input
      aria-label="Valor adicional (R$)"
      placeholder="+ R$ 0"
      inputMode="decimal"
      className="field w-24 tabular-nums"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const cents = parsePrice(text);
        const v = cents === null || Number.isNaN(cents) ? 0 : cents;
        setText(v ? formatPrice(v) : '');
        onChange(v);
      }}
    />
  );
}

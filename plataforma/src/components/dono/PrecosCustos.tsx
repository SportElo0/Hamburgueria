'use client';

import { useMemo, useState, useTransition } from 'react';
import { adicionarItemAction, salvarItemAction } from '@/app/loja/[slug]/dono/actions';
import { setSoldOutAction } from '@/app/loja/[slug]/actions';
import { MARGEM_BAIXA, margem, parseReais } from '@/lib/dono-resumo';
import { brl } from '@/lib/ordering';
import type { ItemDono } from '@/lib/dono';

const reais = (cents: number | null) => (cents === null ? '' : (cents / 100).toFixed(2).replace('.', ','));
const pct = (v: number) => `${Math.round(v * 100)}%`;

function NovoItem({ slug, categorias, onAdded }: { slug: string; categorias: string[]; onAdded: (category: string, item: ItemDono) => void }) {
  const [aberto, setAberto] = useState(categorias.length === 0);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categorias[0] ?? '');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [erro, setErro] = useState('');
  const [pending, start] = useTransition();
  if (!aberto)
    return (
      <button type="button" className="btn-primary" onClick={() => setAberto(true)}>
        + Adicionar item
      </button>
    );
  const priceCents = parseReais(price);
  const costCents = parseReais(cost);
  return (
    <form
      className="card w-full p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !category.trim()) return setErro('Escreva o nome e a categoria.');
        if (priceCents === null || Number.isNaN(priceCents) || priceCents < 1) return setErro('Escreva o preço, por exemplo 34,90.');
        if (Number.isNaN(costCents)) return setErro('O custo precisa ser um valor, por exemplo 12,50.');
        start(async () => {
          setErro('');
          const r = await adicionarItemAction(slug, { name: name.trim(), price: priceCents, category: category.trim(), cost: costCents });
          if (!r.ok || !r.id) return setErro(r.error ?? 'Não foi possível adicionar.');
          onAdded(category.trim(), {
            id: r.id,
            name: name.trim(),
            description: '',
            price: priceCents,
            category: category.trim(),
            soldOut: false,
            cost: costCents,
            costMode: costCents === null ? null : 'manual',
            manualCost: costCents,
            packaging: 0,
          });
          setName('');
          setPrice('');
          setCost('');
        });
      }}
    >
      <p className="font-bold">Adicionar item ao cardápio</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_1fr_1fr_auto] lg:items-end">
        <div>
          <label htmlFor="novo-nome" className="label">
            Nome
          </label>
          <input id="novo-nome" className="field" maxLength={120} placeholder="Ex.: X-Salada" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="novo-cat" className="label">
            Categoria
          </label>
          <input id="novo-cat" className="field" list="categorias-dono" maxLength={80} placeholder="Ex.: Lanches" value={category} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="categorias-dono">
            {categorias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="novo-preco" className="label">
            Preço (R$)
          </label>
          <input id="novo-preco" className="field text-right tabular-nums" inputMode="decimal" placeholder="34,90" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <label htmlFor="novo-custo" className="label">
            Custo para fazer <span className="font-normal text-ink-mute">(opcional)</span>
          </label>
          <input id="novo-custo" className="field text-right tabular-nums" inputMode="decimal" placeholder="12,50" value={cost} onChange={(e) => setCost(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary min-h-[42px]" disabled={pending}>
          {pending ? 'Adicionando…' : 'Adicionar'}
        </button>
      </div>
      {erro && (
        <p role="alert" className="mt-2 text-sm font-semibold text-bad">
          {erro}
        </p>
      )}
    </form>
  );
}

type Filtro = 'todos' | 'baixa' | 'sem-custo' | 'esgotados';

function Row({ slug, item, onSaved, onSoldOut }: { slug: string; item: ItemDono; onSaved: (i: ItemDono) => void; onSoldOut: (v: boolean) => void }) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(reais(item.price));
  const [cost, setCost] = useState(reais(item.manualCost));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const priceCents = parseReais(price);
  const costCents = parseReais(cost);
  const ficha = item.costMode === 'ficha';
  // What the margin will be with what is typed now (before saving), so the owner sees the effect.
  const liveCost = ficha ? item.cost : costCents === null || Number.isNaN(costCents) ? null : costCents + item.packaging;
  const livePrice = priceCents && !Number.isNaN(priceCents) ? priceCents : (item.price ?? 0);
  const m = margem(livePrice, liveCost);
  const dirty = name.trim() !== item.name || priceCents !== item.price || (!ficha && costCents !== item.manualCost);
  const invalid = !name.trim() || priceCents === null || Number.isNaN(priceCents) || priceCents < 1 || (!ficha && Number.isNaN(costCents));

  const save = () =>
    start(async () => {
      setMsg(null);
      const input: { name?: string; price?: number; cost?: number | null } = {};
      if (name.trim() !== item.name) input.name = name.trim();
      if (priceCents !== item.price) input.price = priceCents!;
      if (!ficha && costCents !== item.manualCost) input.cost = costCents;
      const r = await salvarItemAction(slug, item.id, input);
      if (!r.ok) return setMsg({ ok: false, text: r.error ?? 'Não foi possível salvar.' });
      const manualCost = ficha ? item.manualCost : costCents;
      onSaved({
        ...item,
        name: name.trim(),
        price: priceCents!,
        manualCost,
        costMode: ficha ? 'ficha' : manualCost === null ? null : 'manual',
        cost: ficha ? item.cost : manualCost === null ? null : manualCost + item.packaging,
      });
      setMsg({ ok: true, text: 'Salvo' });
    });

  const low = m && m.taxa < MARGEM_BAIXA;
  return (
    <tr className={`align-top ${item.soldOut ? 'bg-paper/70' : ''}`}>
      <td className="py-2.5 pr-3">
        <label className="sr-only" htmlFor={`n-${item.id}`}>
          Nome
        </label>
        <input id={`n-${item.id}`} className="field" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
      </td>
      <td className="py-2.5 pr-3">
        <label className="sr-only" htmlFor={`p-${item.id}`}>
          Preço de {item.name}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-ink-mute">R$</span>
          <input id={`p-${item.id}`} className="field pl-9 text-right tabular-nums" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
      </td>
      <td className="py-2.5 pr-3">
        {ficha ? (
          <p className="pt-2 text-sm">
            <span className="font-semibold tabular-nums">{brl(item.cost ?? 0)}</span> <span className="text-ink-mute">pela ficha técnica</span>
          </p>
        ) : (
          <>
            <label className="sr-only" htmlFor={`c-${item.id}`}>
              Quanto custa fazer {item.name}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-ink-mute">R$</span>
              <input
                id={`c-${item.id}`}
                className={`field pl-9 text-right tabular-nums ${cost ? '' : 'border-dashed'}`}
                inputMode="decimal"
                placeholder="quanto gasta"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
            {item.packaging > 0 && <p className="mt-1 text-xs text-ink-mute">+ {brl(item.packaging)} de embalagem</p>}
          </>
        )}
      </td>
      <td className="py-2.5 pr-3 pt-4 text-right tabular-nums">{m ? <span className={`font-bold ${m.lucro < 0 ? 'text-bad' : ''}`}>{brl(m.lucro)}</span> : <span className="text-ink-mute">—</span>}</td>
      <td className="py-2.5 pr-3 pt-4 text-right">
        {m ? <span className={`chip ${low ? 'bg-warn/10 text-warn' : 'bg-ok/10 text-ok'}`}>{pct(m.taxa)}</span> : <span className="text-sm text-ink-mute">sem custo</span>}
      </td>
      <td className="py-2.5 pr-3">
        <button
          type="button"
          role="switch"
          aria-checked={item.soldOut}
          aria-label={`${item.name} esgotado`}
          disabled={pending}
          onClick={() =>
            start(async () => {
              setMsg(null);
              const r = await setSoldOutAction(slug, item.id, !item.soldOut);
              if (r.ok) onSoldOut(!item.soldOut);
              else setMsg({ ok: false, text: r.error ?? 'Não foi possível mudar.' });
            })
          }
          className={`btn min-h-10 w-full border px-3 ${item.soldOut ? 'border-bad bg-bad/10 text-bad' : 'border-line bg-white text-ink-soft hover:border-ink-mute'}`}
        >
          {item.soldOut ? 'Esgotado' : 'Disponível'}
        </button>
      </td>
      <td className="py-2.5">
        {dirty && (
          <button type="button" className="btn-primary min-h-10 w-full px-3" disabled={invalid || pending} onClick={save}>
            {pending ? 'Salvando…' : 'Salvar'}
          </button>
        )}
        {msg && (
          <p role={msg.ok ? 'status' : 'alert'} className={`mt-1 text-xs font-semibold ${msg.ok ? 'text-ok' : 'text-bad'}`}>
            {msg.text}
          </p>
        )}
      </td>
    </tr>
  );
}

export function PrecosCustos({ slug, categories }: { slug: string; categories: { name: string; items: ItemDono[] }[] }) {
  const [cats, setCats] = useState(categories);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const all = useMemo(() => cats.flatMap((c) => c.items), [cats]);
  const counts = {
    baixa: all.filter((i) => {
      const m = margem(i.price ?? 0, i.cost);
      return m && m.taxa < MARGEM_BAIXA;
    }).length,
    semCusto: all.filter((i) => i.cost === null).length,
    esgotados: all.filter((i) => i.soldOut).length,
  };
  const comCusto = all.filter((i) => i.cost !== null && i.price);
  const media = comCusto.length ? comCusto.reduce((n, i) => n + (i.price! - i.cost!) / i.price!, 0) / comCusto.length : null;

  const update = (id: string, fn: (i: ItemDono) => ItemDono) => setCats((cs) => cs.map((c) => ({ ...c, items: c.items.map((i) => (i.id === id ? fn(i) : i)) })));
  const q = busca.trim().toLocaleLowerCase('pt-BR');
  const show = (i: ItemDono) => {
    if (q && !i.name.toLocaleLowerCase('pt-BR').includes(q)) return false;
    const m = margem(i.price ?? 0, i.cost);
    if (filtro === 'baixa') return Boolean(m && m.taxa < MARGEM_BAIXA);
    if (filtro === 'sem-custo') return i.cost === null;
    if (filtro === 'esgotados') return i.soldOut;
    return true;
  };
  const filtros: { id: Filtro; label: string }[] = [
    { id: 'todos', label: `Todos (${all.length})` },
    { id: 'baixa', label: `Margem baixa (${counts.baixa})` },
    { id: 'sem-custo', label: `Sem custo (${counts.semCusto})` },
    { id: 'esgotados', label: `Esgotados (${counts.esgotados})` },
  ];
  const visible = cats.map((c) => ({ ...c, items: c.items.filter(show) })).filter((c) => c.items.length);

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">Margem média</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{media === null ? '—' : pct(media)}</p>
          <p className="text-xs text-ink-mute">{comCusto.length === 1 ? "do 1 item" : `dos ${comCusto.length} itens`} com custo, antes de taxas e impostos</p>
        </div>
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">Margem baixa (abaixo de {pct(MARGEM_BAIXA)})</p>
          <p className={`mt-1 text-2xl font-extrabold tabular-nums ${counts.baixa ? 'text-warn' : ''}`}>{counts.baixa}</p>
          <p className="text-xs text-ink-mute">vale rever o preço ou a receita</p>
        </div>
        <div className="card p-4">
          <p className="text-[13px] font-semibold text-ink-mute">Sem custo informado</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{counts.semCusto}</p>
          <p className="text-xs text-ink-mute">escreva quanto gasta para fazer</p>
        </div>
      </div>

      <div className="mt-6">
        <NovoItem
          slug={slug}
          categorias={cats.map((c) => c.name)}
          onAdded={(category, item) =>
            setCats((cs) => {
              const at = cs.findIndex((c) => c.name.toLocaleLowerCase('pt-BR') === category.toLocaleLowerCase('pt-BR'));
              return at >= 0 ? cs.map((c, i) => (i === at ? { ...c, items: [...c.items, item] } : c)) : [...cs, { name: category, items: [item] }];
            })
          }
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="busca">
          Procurar item
        </label>
        <input id="busca" className="field max-w-xs" placeholder="Procurar item…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-white p-1" role="group" aria-label="Mostrar">
          {filtros.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filtro === f.id}
              onClick={() => setFiltro(f.id)}
              className={`min-h-9 rounded-md px-3 text-sm font-semibold ${filtro === f.id ? 'bg-accent text-white' : 'text-ink-soft hover:text-ink'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="card mt-4 px-5 py-10 text-center text-ink-mute">{all.length === 0 ? 'Nenhum item ainda. Comece em "Adicionar item".' : 'Nenhum item aqui.'}</p>
      ) : (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <colgroup>
              <col />
              <col className="w-36" />
              <col className="w-40" />
              <col className="w-28" />
              <col className="w-24" />
              <col className="w-32" />
              <col className="w-28" />
            </colgroup>
            <thead className="border-b border-line text-[12px] font-semibold tracking-wide text-ink-mute uppercase">
              <tr>
                <th className="px-0 py-3 pr-3 pl-5">Item</th>
                <th className="py-3 pr-3">Preço</th>
                <th className="py-3 pr-3">Custo para fazer</th>
                <th className="py-3 pr-3 text-right">Sobra por venda</th>
                <th className="py-3 pr-3 text-right">Margem</th>
                <th className="py-3 pr-3">No cardápio</th>
                <th className="py-3 pr-5" />
              </tr>
            </thead>
            {visible.map((c) => (
              <tbody key={c.name} className="divide-y divide-line [&_td:first-child]:pl-5 [&_td:last-child]:pr-5">
                <tr>
                  <th colSpan={7} scope="colgroup" className="bg-paper px-5 py-2 text-[13px] font-bold text-ink-soft">
                    {c.name}
                  </th>
                </tr>
                {c.items.map((i) => (
                  <Row key={i.id} slug={slug} item={i} onSaved={(n) => update(i.id, () => n)} onSoldOut={(v) => update(i.id, (x) => ({ ...x, soldOut: v }))} />
                ))}
              </tbody>
            ))}
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-ink-mute">
        Sobra por venda = preço − custo para fazer (com a embalagem). Ainda não desconta taxa do cartão, impostos, aluguel e salários. Mudar nome e preço vale na hora
        no cardápio. Foto, descrição e adicionais: peça à Growlift na tela Cardápio completo.
      </p>
    </div>
  );
}

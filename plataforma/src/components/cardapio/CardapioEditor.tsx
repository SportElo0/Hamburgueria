'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { editItemAction, requestChangeAction } from '@/app/loja/[slug]/actions';
import { brl } from '@/lib/ordering';

export interface CardapioItem {
  id: string;
  name: string;
  description: string;
  price: number | null;
}
export interface CardapioCategory {
  id: string;
  name: string;
  items: CardapioItem[];
}
interface Request {
  id: string;
  texto: string;
  criadoEm: string;
  status: 'pendente' | 'feito' | 'descartado';
}

const STATUS = { pendente: 'Esperando', feito: 'Feito', descartado: 'Não feito' } as const;

/** "32,90" or "32.90" or "32" → 3290 centavos; null when it isn't a price. */
export function parsePrice(text: string): number | null {
  const clean = text.replace(/[R$\s]/g, '');
  if (!/^\d{1,6}([.,]\d{1,2})?$/.test(clean)) return null;
  const [reais, cents = ''] = clean.split(/[.,]/);
  return Number(reais) * 100 + Number(cents.padEnd(2, '0'));
}
const priceText = (c: number | null) => (c === null ? '' : (c / 100).toFixed(2).replace('.', ','));

export function CardapioEditor({ slug, categories, requests, published }: { slug: string; categories: CardapioCategory[]; requests: Request[]; published: boolean }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = categories
    .map((c) => ({ ...c, items: q ? c.items.filter((i) => i.name.toLowerCase().includes(q)) : c.items }))
    .filter((c) => c.items.length);

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="font-bold">Mude preço, nome e descrição na hora</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Salvou, aparece no site em poucos segundos. Para foto, item novo ou outra mudança no site, use o pedido no fim da página.
        </p>
        {published && (
          <label className="mt-4 block">
            <span className="sr-only">Procurar item</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar item" className="field" />
          </label>
        )}
      </section>

      {!published && <p className="card px-5 py-8 text-center text-ink-mute">O cardápio ainda não foi publicado. A Growlift avisa quando estiver no ar.</p>}

      {shown.map((c) => (
        <section key={c.id} aria-labelledby={`cat-${c.id}`}>
          <h3 id={`cat-${c.id}`} className="text-xs font-bold tracking-wide text-ink-mute uppercase">
            {c.name}
          </h3>
          <ul className="mt-2 space-y-2">
            {c.items.map((i) => (
              <ItemRow key={i.id} slug={slug} item={i} />
            ))}
          </ul>
        </section>
      ))}
      {published && q && !shown.length && <p className="text-center text-ink-mute">Nenhum item com esse nome.</p>}

      <RequestForm slug={slug} requests={requests} />
    </div>
  );
}

function ItemRow({ slug, item }: { slug: string; item: CardapioItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState(priceText(item.price));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const save = () => {
    const cents = parsePrice(price);
    if (cents === null || cents < 1) return setError('Escreva o preço assim: 32,90');
    if (!name.trim()) return setError('O nome não pode ficar vazio.');
    // A big jump is usually a typo (3,29 instead of 32,90): ask before it goes live.
    if (item.price && Math.abs(cents - item.price) / item.price > 0.5 && !window.confirm(`O preço vai de ${brl(item.price)} para ${brl(cents)}. Está certo?`)) return;
    setError('');
    startTransition(async () => {
      const res = await editItemAction(slug, item.id, { name, description, price: cents });
      if (!res.ok) return setError(res.error ?? 'Não foi possível salvar.');
      setSaved(true);
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <li className="card flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="font-semibold">{item.name}</p>
          <p className="text-sm text-ink-mute tabular-nums">
            {item.price === null ? 'Sem preço' : brl(item.price)}
            {saved && <span className="ml-2 font-semibold text-ok">Salvo</span>}
          </p>
        </div>
        <button type="button" className="btn-ghost min-h-11 shrink-0" onClick={() => { setOpen(true); setSaved(false); }} aria-label={`Editar ${item.name}`}>
          Editar
        </button>
      </li>
    );
  }
  return (
    <li className="card space-y-3 px-4 py-4">
      <label className="block">
        <span className="text-sm font-semibold">Nome</span>
        <input className="field mt-1" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Descrição</span>
        <textarea className="field mt-1" rows={3} value={description} maxLength={600} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Preço (R$)</span>
        <input className="field mt-1 w-40 tabular-nums" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="32,90" />
      </label>
      {error && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="button" className="btn-primary min-h-11" disabled={pending} onClick={save}>
          {pending ? 'Salvando…' : 'Salvar e publicar'}
        </button>
        <button
          type="button"
          className="btn-ghost min-h-11"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setName(item.name);
            setDescription(item.description);
            setPrice(priceText(item.price));
            setError('');
          }}
        >
          Cancelar
        </button>
      </div>
    </li>
  );
}

function RequestForm({ slug, requests }: { slug: string; requests: Request[] }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const send = () =>
    startTransition(async () => {
      const res = await requestChangeAction(slug, text);
      if (!res.ok) return setMsg({ ok: false, text: res.error ?? 'Não foi possível enviar.' });
      setText('');
      setMsg({ ok: true, text: 'Pedido enviado. A Growlift avisa quando estiver pronto.' });
      router.refresh();
    });
  return (
    <section className="card p-5" aria-labelledby="pedir-titulo">
      <h2 id="pedir-titulo" className="font-bold">
        Pedir outra mudança
      </h2>
      <p className="mt-1 text-sm text-ink-soft">Foto nova, item novo, texto ou horário do site. Escreva o que quer mudar; se tiver foto, mande pelo WhatsApp e avise aqui.</p>
      <label className="mt-3 block">
        <span className="sr-only">O que você quer mudar</span>
        <textarea className="field" rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: trocar a foto do X-Bacon pela que mandei no WhatsApp" />
      </label>
      {msg && (
        <p role="status" className={`mt-2 text-sm font-semibold ${msg.ok ? 'text-ok' : 'text-bad'}`}>
          {msg.text}
        </p>
      )}
      <button type="button" className="btn-primary mt-3 min-h-11" disabled={pending || text.trim().length < 5} onClick={send}>
        {pending ? 'Enviando…' : 'Enviar pedido'}
      </button>
      {requests.length > 0 && (
        <ul className="mt-5 divide-y divide-line border-t border-line text-sm">
          {requests.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 py-2">
              <span className="min-w-0">{r.texto}</span>
              <span className={`shrink-0 font-semibold ${r.status === 'feito' ? 'text-ok' : r.status === 'pendente' ? 'text-warn' : 'text-ink-mute'}`}>{STATUS[r.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

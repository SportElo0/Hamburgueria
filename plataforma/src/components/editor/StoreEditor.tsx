'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import type { ChangeEntry, PedidoEntry, Payment, Store, StoreRecord } from '@/lib/schema';
import type { Usage } from '@/lib/changes';
import { saveStoreAction } from '@/app/painel/actions';
import { CatalogEditor } from './CatalogEditor';
import { InfoEditor } from './InfoEditor';
import { AccountEditor } from './AccountEditor';
import { ChangesPanel } from './ChangesPanel';
import { ExtraEditor } from './ExtraEditor';
import { IntegrationPanel } from './IntegrationPanel';
import { PedidosPanel } from './PedidosPanel';
import { OnlineOrdersPanel } from './OnlineOrdersPanel';
import type { OperatorSummary } from '@/lib/operators';
import { PagamentosPanel } from './PagamentosPanel';
import { PublishDialog } from './PublishDialog';
import { UsageBadge } from '../UsageBadge';

const TABS = [
  ['catalogo', 'Cardápio / catálogo'],
  ['info', 'Informações'],
  ['online', 'Pedidos online'],
  ['pedidos', 'Pedidos de mudança'],
  ['mudancas', 'Mudanças'],
  ['pagamentos', 'Pagamentos'],
  ['conta', 'Conta e plano'],
  ['extra', 'Dados extras'],
  ['integracao', 'Integração'],
] as const;
type Tab = (typeof TABS)[number][0];

export type Update = (fn: (draft: Store) => void) => void;

export function StoreEditor(props: {
  record: StoreRecord;
  etag: string;
  month: string;
  currentMonth: string;
  months: string[];
  changes: ChangeEntry[];
  currentUsage: Usage;
  pedidos: PedidoEntry[];
  paymentHistory: { month: string; payment: Payment }[];
  apiUrl: string;
  operators: OperatorSummary[];
  hasMercadoPago: boolean;
  ordersUrl: string;
  webhookUrl: string;
  storeOpen: boolean;
  initialTab?: string;
}) {
  const [store, setStore] = useState<Store>(props.record.store);
  const [saved, setSaved] = useState(() => JSON.stringify(props.record.store));
  const [etag, setEtag] = useState(props.etag);
  const [tab, setTab] = useState<Tab>(TABS.some(([t]) => t === props.initialTab) ? (props.initialTab as Tab) : 'catalogo');
  const [status, setStatus] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [busy, startTransition] = useTransition();

  const dirty = useMemo(() => JSON.stringify(store) !== saved, [store, saved]);
  const unpublished = dirty || !props.record.publishedAt || props.record.updatedAt > props.record.publishedAt;

  const update: Update = useCallback((fn) => {
    setStore((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const selectTab = (t: Tab) => {
    setTab(t);
    const url = new URL(window.location.href);
    url.searchParams.set('aba', t);
    window.history.replaceState(null, '', url);
  };

  /** Saves the draft; resolves to the new etag, or null when it failed. */
  const save = useCallback(async (): Promise<string | null> => {
    const res = await saveStoreAction(store.slug, etag, store);
    if (!res.ok || !res.etag) {
      setStatus({ tone: 'bad', text: res.error ?? 'Não foi possível salvar.' });
      return null;
    }
    setEtag(res.etag);
    setSaved(JSON.stringify(store));
    setStatus({ tone: 'ok', text: 'Rascunho salvo.' });
    return res.etag;
  }, [store, etag]);

  return (
    <>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold">{store.name || 'Sem nome'}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-mute">
            <span className="font-mono">{store.slug}</span>
            <UsageBadge usage={props.currentUsage} />
            {unpublished ? (
              <span className="chip bg-warn/10 text-warn">{dirty ? 'Alterações não salvas' : 'Rascunho não publicado'}</span>
            ) : (
              <span className="chip bg-ok/10 text-ok">Publicado</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" disabled={!dirty || busy} onClick={() => startTransition(async () => void (await save()))}>
            {busy ? 'Salvando…' : 'Salvar rascunho'}
          </button>
          <button type="button" className="btn-primary" disabled={busy} onClick={() => setPublishing(true)}>
            Publicar
          </button>
        </div>
      </div>

      {status && (
        <p role="status" className={`mt-3 text-sm font-semibold ${status.tone === 'ok' ? 'text-ok' : 'text-bad'}`}>
          {status.text}
        </p>
      )}

      <nav aria-label="Seções da loja" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(([id, label]) => {
          const pendentes = id === 'pedidos' ? props.pedidos.filter((p) => p.status === 'pendente').length : 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className="-mb-px shrink-0 cursor-pointer border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-ink-mute hover:text-ink aria-[current=page]:border-ink aria-[current=page]:text-ink"
            >
              {label}
              {pendentes > 0 && <span className="chip ml-1.5 bg-warn/10 px-1.5 py-0 text-xs text-warn">{pendentes}</span>}
            </button>
          );
        })}
      </nav>

      <div className="mt-6">
        {tab === 'catalogo' && <CatalogEditor store={store} update={update} />}
        {tab === 'info' && <InfoEditor store={store} update={update} />}
        {tab === 'online' && (
          <OnlineOrdersPanel store={store} update={update} operators={props.operators} hasMercadoPago={props.hasMercadoPago} ordersUrl={props.ordersUrl} webhookUrl={props.webhookUrl} open={props.storeOpen} />
        )}
        {tab === 'pedidos' && <PedidosPanel slug={store.slug} pedidos={props.pedidos} />}
        {tab === 'mudancas' && (
          <ChangesPanel slug={store.slug} month={props.month} currentMonth={props.currentMonth} months={props.months} changes={props.changes} limit={props.currentUsage.limit} />
        )}
        {tab === 'pagamentos' && (
          <PagamentosPanel
            slug={store.slug}
            monthlyFee={store.account.monthlyFee}
            extraPrice={store.account.extraPrice}
            currentExtras={props.currentUsage.extras}
            history={props.paymentHistory}
          />
        )}
        {tab === 'conta' && <AccountEditor store={store} update={update} />}
        {tab === 'extra' && <ExtraEditor store={store} update={update} />}
        {tab === 'integracao' && <IntegrationPanel apiUrl={props.apiUrl} publishedAt={props.record.publishedAt} />}
      </div>

      {publishing && (
        <PublishDialog
          slug={store.slug}
          usage={props.currentUsage}
          dirty={dirty}
          save={save}
          onClose={() => setPublishing(false)}
          onDone={(text, newEtag) => {
            if (newEtag) setEtag(newEtag);
            setSaved(JSON.stringify(store));
            setStatus({ tone: 'ok', text });
            setPublishing(false);
          }}
        />
      )}
    </>
  );
}

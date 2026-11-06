'use client';

import { useState, useTransition } from 'react';
import { PEDIDO_CANAIS, type PedidoEntry } from '@/lib/schema';
import { addPedidoAction, resolvePedidoAction } from '@/app/painel/actions';

const STATUS_CHIP: Record<PedidoEntry['status'], string> = {
  pendente: 'bg-warn/10 text-warn',
  feito: 'bg-ok/10 text-ok',
  descartado: 'bg-ink/5 text-ink-soft',
};
const STATUS_LABEL: Record<PedidoEntry['status'], string> = { pendente: 'Pendente', feito: 'Feito', descartado: 'Descartado' };

export function PedidosPanel({ slug, pedidos }: { slug: string; pedidos: PedidoEntry[] }) {
  const [texto, setTexto] = useState('');
  const [canal, setCanal] = useState<PedidoEntry['canal']>('WhatsApp');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const pendentes = pedidos.filter((p) => p.status === 'pendente');
  const resolvidos = pedidos.filter((p) => p.status !== 'pendente').sort((a, b) => (b.resolvidoEm ?? '').localeCompare(a.resolvidoEm ?? ''));

  const resolve = (id: string, status: 'feito' | 'descartado') =>
    start(async () => {
      const res = await resolvePedidoAction(slug, id, status);
      if (!res.ok) setError(res.error ?? 'Falha ao atualizar.');
    });

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <section className="card p-5">
        <h2 className="text-lg font-bold">Pedidos pendentes</h2>
        <p className="mt-1 text-sm text-ink-mute">O que o cliente pediu e ainda não foi feito. Quando publicar a mudança, registre-a na aba &quot;Mudanças&quot; e marque o pedido como feito.</p>
        {error && <p className="mt-3 text-sm font-semibold text-bad">{error}</p>}
        {pendentes.length === 0 ? (
          <p className="mt-6 text-sm text-ink-mute">Nenhum pedido pendente.</p>
        ) : (
          <ol className="mt-4 divide-y divide-line">
            {pendentes.map((p) => (
              <li key={p.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.texto}</p>
                  <p className="mt-0.5 text-xs text-ink-mute">
                    {new Date(p.criadoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · {p.canal} · {p.criadoPor}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" disabled={pending} className="btn-ghost px-2 py-1 text-xs" onClick={() => resolve(p.id, 'descartado')}>
                    Descartar
                  </button>
                  <button type="button" disabled={pending} className="btn-primary px-2 py-1 text-xs" onClick={() => resolve(p.id, 'feito')}>
                    Marcar feito
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        {resolvidos.length > 0 && (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-semibold text-ink-mute">Resolvidos ({resolvidos.length})</summary>
            <ol className="mt-3 divide-y divide-line">
              {resolvidos.map((p) => (
                <li key={p.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.texto}</p>
                    <p className="mt-0.5 text-xs text-ink-mute">
                      {new Date(p.criadoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · {p.canal}
                    </p>
                  </div>
                  <span className={`chip shrink-0 ${STATUS_CHIP[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                </li>
              ))}
            </ol>
          </details>
        )}
      </section>

      <section className="card h-fit space-y-3 p-5">
        <h2 className="text-lg font-bold">Registrar pedido</h2>
        <p className="text-sm text-ink-mute">Anote assim que o pedido chegar, antes de fazer a mudança.</p>
        <label htmlFor="pedido-texto" className="label">O que o cliente pediu</label>
        <textarea id="pedido-texto" rows={3} className="field resize-y" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <label htmlFor="pedido-canal" className="label">Canal</label>
        <select id="pedido-canal" className="field" value={canal} onChange={(e) => setCanal(e.target.value as PedidoEntry['canal'])}>
          {PEDIDO_CANAIS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-primary w-full"
          disabled={pending || !texto.trim()}
          onClick={() =>
            start(async () => {
              const res = await addPedidoAction(slug, texto, canal);
              if (!res.ok) return setError(res.error ?? 'Falha ao registrar.');
              setTexto('');
              setError('');
            })
          }
        >
          {pending ? 'Registrando…' : 'Registrar pedido'}
        </button>
      </section>
    </div>
  );
}

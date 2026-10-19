'use client';

import { useState } from 'react';
import { PLAN_CHANGE_LIMIT, PLAN_LABEL, PLANS, type Plan, type Store } from '@/lib/schema';
import { formatPrice, parsePrice } from '@/lib/slug';
import type { Update } from './StoreEditor';

export function AccountEditor({ store, update }: { store: Store; update: Update }) {
  const a = store.account;
  const [fee, setFee] = useState(formatPrice(a.monthlyFee));
  const expired = a.partnerUntil && a.partnerUntil < new Date().toISOString().slice(0, 10);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Plano</h2>
        <p className="text-sm text-ink-mute">Só a equipe vê estas informações. Elas nunca vão para o site da loja.</p>
        <div>
          <label htmlFor="plano" className="label">Plano</label>
          <select id="plano" className="field" value={a.plan} onChange={(e) => update((d) => void (d.account.plan = e.target.value as Plan))}>
            {PLANS.map((p) => (
              <option key={p} value={p}>
                {PLAN_LABEL[p]} · {PLAN_CHANGE_LIMIT[p]} mudança(s)/mês
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="limite" className="label">Mudanças por mês (deixe vazio para usar o padrão do plano)</label>
          <input
            id="limite"
            type="number"
            min={0}
            max={100}
            className="field"
            placeholder={String(PLAN_CHANGE_LIMIT[a.plan])}
            value={a.changeLimit ?? ''}
            onChange={(e) => update((d) => void (d.account.changeLimit = e.target.value === '' ? null : Math.max(0, Math.min(100, Number(e.target.value)))))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ate" className="label">Parceria / contrato até</label>
            <input id="ate" type="date" className="field" value={a.partnerUntil} onChange={(e) => update((d) => void (d.account.partnerUntil = e.target.value))} />
            {expired && <p className="mt-1 text-xs font-semibold text-warn">Prazo vencido: hora de oferecer um plano.</p>}
          </div>
          <div>
            <label htmlFor="mensalidade" className="label">Mensalidade (R$)</label>
            <input
              id="mensalidade"
              inputMode="decimal"
              className="field"
              placeholder="Sem mensalidade"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              onBlur={() => {
                const v = parsePrice(fee);
                const cents = v === null || Number.isNaN(v) ? null : v;
                setFee(formatPrice(cents));
                update((d) => void (d.account.monthlyFee = cents));
              }}
            />
          </div>
        </div>
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">Anotações internas</h2>
        <textarea
          aria-label="Anotações internas"
          rows={10}
          className="field resize-y"
          placeholder="Combinados com o cliente, preferências, acessos pendentes…"
          value={a.notes}
          onChange={(e) => update((d) => void (d.account.notes = e.target.value))}
        />
      </section>
    </div>
  );
}

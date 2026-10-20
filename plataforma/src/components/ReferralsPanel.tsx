'use client';

import { useState, useTransition } from 'react';
import { REFERRAL_STATUS_LABEL, REFERRAL_STATUSES, SEGMENTS, type Referral, type ReferralStatus } from '@/lib/schema';
import { formatPrice, parsePrice } from '@/lib/slug';
import { createReferralAction, updateReferralAction } from '@/app/painel/actions';

const SEGMENT_LABEL = { restaurante: 'Restaurante', loja: 'Loja', servico: 'Serviço' } as const;

export function ReferralsPanel({ referrals, storeOptions }: { referrals: Referral[]; storeOptions: { slug: string; name: string }[] }) {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_22rem]">
      <section className="space-y-3">
        {referrals.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="font-semibold">Nenhuma indicação ainda.</p>
            <p className="mt-1 text-sm text-ink-mute">Cadastre a primeira ao lado.</p>
          </div>
        ) : (
          referrals.map((r) => <ReferralCard key={r.id} referral={r} storeOptions={storeOptions} />)
        )}
      </section>
      <NewReferralForm />
    </div>
  );
}

function ReferralCard({ referral, storeOptions }: { referral: Referral; storeOptions: { slug: string; name: string }[] }) {
  const [comissao, setComissao] = useState(formatPrice(referral.comissao));
  const [notas, setNotas] = useState(referral.notas);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  const patch = (data: Parameters<typeof updateReferralAction>[1]) =>
    start(async () => {
      const res = await updateReferralAction(referral.id, data);
      if (!res.ok) setError(res.error ?? 'Falha ao salvar.');
    });

  return (
    <div className="card space-y-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold">{referral.nome}</p>
          <p className="text-sm text-ink-mute">
            {SEGMENT_LABEL[referral.segmento]} · indicado por {referral.indicadoPor}
          </p>
        </div>
        <select
          aria-label="Status"
          className="field w-auto"
          value={referral.status}
          disabled={pending}
          onChange={(e) => patch({ status: e.target.value as ReferralStatus })}
        >
          {REFERRAL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {REFERRAL_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm font-semibold text-bad">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`contato-${referral.id}`} className="label">Contato</label>
          <input
            id={`contato-${referral.id}`}
            className="field"
            defaultValue={referral.contato}
            onBlur={(e) => e.target.value !== referral.contato && patch({ contato: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor={`loja-${referral.id}`} className="label">Virou loja</label>
          <select
            id={`loja-${referral.id}`}
            className="field"
            value={referral.storeSlug ?? ''}
            onChange={(e) => patch({ storeSlug: e.target.value || null })}
          >
            <option value="">Ainda não</option>
            {storeOptions.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={`comissao-${referral.id}`} className="label">Comissão (R$)</label>
          <input
            id={`comissao-${referral.id}`}
            inputMode="decimal"
            className="field"
            placeholder="Combinar"
            value={comissao}
            onChange={(e) => setComissao(e.target.value)}
            onBlur={() => {
              const v = parsePrice(comissao);
              const cents = v === null || Number.isNaN(v) ? null : v;
              setComissao(formatPrice(cents));
              patch({ comissao: cents });
            }}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 pb-2.5 text-sm font-semibold">
          <input type="checkbox" checked={referral.comissaoPaga} onChange={(e) => patch({ comissaoPaga: e.target.checked })} />
          Comissão paga
        </label>
      </div>

      <textarea
        aria-label="Notas"
        rows={2}
        className="field resize-y"
        placeholder="Observações…"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        onBlur={() => notas !== referral.notas && patch({ notas })}
      />
    </div>
  );
}

function NewReferralForm() {
  const [nome, setNome] = useState('');
  const [segmento, setSegmento] = useState<(typeof SEGMENTS)[number]>('restaurante');
  const [indicadoPor, setIndicadoPor] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  return (
    <section className="card h-fit space-y-3 p-5">
      <h2 className="text-lg font-bold">Nova indicação</h2>
      <div>
        <label htmlFor="ind-nome" className="label">Negócio indicado</label>
        <input id="ind-nome" className="field" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div>
        <label htmlFor="ind-segmento" className="label">Segmento</label>
        <select id="ind-segmento" className="field" value={segmento} onChange={(e) => setSegmento(e.target.value as (typeof SEGMENTS)[number])}>
          {SEGMENTS.map((s) => (
            <option key={s} value={s}>
              {SEGMENT_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="ind-por" className="label">Indicado por</label>
        <input id="ind-por" className="field" placeholder="Nome do cliente ou loja" value={indicadoPor} onChange={(e) => setIndicadoPor(e.target.value)} />
      </div>
      {error && <p className="text-sm font-semibold text-bad">{error}</p>}
      <button
        type="button"
        className="btn-primary w-full"
        disabled={pending || !nome.trim() || !indicadoPor.trim()}
        onClick={() =>
          start(async () => {
            const res = await createReferralAction({ nome, segmento, indicadoPor });
            if (!res.ok) return setError(res.error ?? 'Falha ao cadastrar.');
            setNome('');
            setIndicadoPor('');
            setError('');
          })
        }
      >
        {pending ? 'Cadastrando…' : 'Cadastrar indicação'}
      </button>
    </section>
  );
}

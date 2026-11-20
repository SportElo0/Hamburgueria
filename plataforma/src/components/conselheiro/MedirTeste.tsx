'use client';

import { useState, useTransition } from 'react';
import { brl } from '@/lib/conselheiro/calculos';
import type { Medicao } from '@/lib/conselheiro/registros';
import { medirTesteAction } from '@/app/loja/[slug]/dono/conselheiro/actions';

/** Mostra a medição pelas vendas antes de registrar; o registro refaz a conta no servidor. */
export function MedirTeste({ slug, id, dinheiro, children }: { slug: string; id: string; dinheiro: boolean; children: React.ReactNode }) {
  const [m, setM] = useState<Medicao | null>(null);
  const [erro, setErro] = useState('');
  const [pending, start] = useTransition();
  const fmt = (v: number) => (dinheiro ? brl(v) : v.toLocaleString('pt-BR'));
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn-ghost"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setErro('');
            const r = await medirTesteAction(slug, id);
            if (r.ok) setM(r.medicao);
            else {
              setM(null);
              setErro(r.msg);
            }
          })
        }
      >
        {pending ? 'Medindo…' : 'Medir pelas vendas registradas'}
      </button>
      {erro && <p className="text-sm font-semibold text-bad">{erro}</p>}
      {m && (
        <div className="rounded-lg bg-paper p-3 text-sm">
          <p>Base ({m.base.periodo}, {m.base.dias} dias): <strong>{fmt(m.base.valor)}</strong>{m.base.atendimentos !== null ? `, ${m.base.atendimentos} atendimentos` : ''}</p>
          <p>Teste ({m.teste.periodo}, {m.teste.dias} dias): <strong>{fmt(m.teste.valor)}</strong>{m.teste.atendimentos !== null ? `, ${m.teste.atendimentos} atendimentos` : ''}</p>
          {m.avisos.map((a) => <p key={a} className="text-warn">{a}</p>)}
          <div className="mt-2">{children}</div>
        </div>
      )}
    </div>
  );
}

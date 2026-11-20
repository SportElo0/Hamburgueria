'use client';

import { useState, useTransition } from 'react';
import { aprovarAction, descartarAction, editarAction, gerarAction, type Resposta } from '@/app/painel/oportunidades/vendas/actions';
import { MAX_ACOMPANHAMENTOS, type Rascunho } from '@/lib/vendas/regras';
import { dataHora } from './ui';

const STATUS: Record<Rascunho['status'], string> = { 'para-aprovar': 'Para aprovar', aprovado: 'Aprovado', descartado: 'Descartado' };
const ORIGEM: Record<Rascunho['origem'], string> = { simulado: 'Simulador (sem IA)', ia: 'IA', editado: 'Editado por uma pessoa' };

function useAcao() {
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const rodar = (fn: () => Promise<Resposta<unknown>>, depois?: () => void) =>
    start(async () => {
      setError('');
      const r = await fn();
      if (!r.ok) setError(r.error);
      else depois?.();
    });
  return { pending, error, rodar };
}

function RascunhoPendente({ id, r, rodape }: { id: string; r: Rascunho; rodape: string }) {
  const [editando, setEditando] = useState(false);
  const [assunto, setAssunto] = useState(r.assunto);
  const [corpo, setCorpo] = useState(r.corpo);
  const { pending, error, rodar } = useAcao();
  return (
    <div className="mt-3">
      {editando ? (
        <div className="grid gap-2">
          <label className="label" htmlFor={`assunto-${r.id}`}>
            Assunto
          </label>
          <input id={`assunto-${r.id}`} className="field" value={assunto} maxLength={120} onChange={(e) => setAssunto(e.target.value)} />
          <label className="label" htmlFor={`corpo-${r.id}`}>
            Texto
          </label>
          <textarea id={`corpo-${r.id}`} className="field min-h-64 leading-relaxed" value={corpo} maxLength={3000} onChange={(e) => setCorpo(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={pending} onClick={() => rodar(() => editarAction(id, r.id, { assunto, corpo }), () => setEditando(false))}>
              {pending ? 'Salvando…' : 'Salvar texto'}
            </button>
            <button type="button" className="btn-ghost" disabled={pending} onClick={() => (setAssunto(r.assunto), setCorpo(r.corpo), setEditando(false))}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-soft">
            Assunto: <span className="font-semibold text-ink">{r.assunto}</span>
          </p>
          <pre className="mt-2 rounded-lg border border-line bg-white p-4 font-sans text-[15px] leading-relaxed whitespace-pre-wrap">
            {r.corpo}
            {'\n\n'}
            <span className="text-ink-mute">{rodape}</span>
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={pending} onClick={() => rodar(() => aprovarAction(id, r.id))}>
              {pending ? 'Salvando…' : 'Aprovar texto'}
            </button>
            <button type="button" className="btn-ghost" disabled={pending} onClick={() => setEditando(true)}>
              Editar
            </button>
            <button type="button" className="btn-danger" disabled={pending} onClick={() => rodar(() => descartarAction(id, r.id))}>
              Descartar
            </button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

export function Rascunhos({ id, rascunhos, rodape, encerrado, podeAcompanhar }: { id: string; rascunhos: Rascunho[]; rodape: string; encerrado: boolean; podeAcompanhar: boolean }) {
  const { pending, error, rodar } = useAcao();
  const pendente = rascunhos.some((r) => r.status === 'para-aprovar');
  const temPrimeiro = rascunhos.some((r) => r.tipo === 'primeiro' && r.status !== 'descartado');
  const acompanhamentos = rascunhos.filter((r) => r.tipo === 'acompanhamento' && r.status !== 'descartado').length;
  return (
    <section className="card p-5" aria-labelledby="rascunhos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="rascunhos" className="text-lg font-bold">
          E-mails
        </h2>
        {!encerrado && !pendente && (
          <div className="flex flex-wrap gap-2">
            {!temPrimeiro && (
              <button type="button" className="btn-primary" disabled={pending} onClick={() => rodar(() => gerarAction(id, 'primeiro'))}>
                {pending ? 'Escrevendo…' : 'Gerar primeiro e-mail'}
              </button>
            )}
            {temPrimeiro && podeAcompanhar && acompanhamentos < MAX_ACOMPANHAMENTOS && (
              <button type="button" className="btn-ghost" disabled={pending} onClick={() => rodar(() => gerarAction(id, 'acompanhamento'))}>
                {pending ? 'Escrevendo…' : 'Gerar acompanhamento'}
              </button>
            )}
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-bad">
          {error}
        </p>
      )}
      {rascunhos.length === 0 && <p className="mt-2 text-sm text-ink-mute">Nenhum texto ainda. O rascunho vai para a fila de aprovação; nada é enviado.</p>}
      <ol className="mt-2 space-y-4">
        {rascunhos.toReversed().map((r) => (
          <li key={r.id} className={`border-t border-line pt-4 ${r.status === 'descartado' ? 'opacity-60' : ''}`}>
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{r.tipo === 'primeiro' ? 'Primeiro e-mail' : 'Acompanhamento'}</span>
              <span className={`chip ${r.status === 'aprovado' ? 'bg-ok/10 text-ok' : r.status === 'para-aprovar' ? 'bg-warn/10 text-warn' : 'bg-line text-ink-mute'}`}>{STATUS[r.status]}</span>
              <span className="text-ink-mute">
                {ORIGEM[r.origem]}
                {r.modelo ? ` · ${r.modelo}` : ''} · {dataHora(r.criadoEm)}
                {r.decididoPor ? ` · decidido por ${r.decididoPor} em ${dataHora(r.decididoEm)}` : ''}
              </span>
            </p>
            {r.alertas.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-warn">
                {r.alertas.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            )}
            <details className="mt-2 text-sm text-ink-soft">
              <summary className="cursor-pointer">Fatos que o texto podia usar ({r.fatos.length})</summary>
              <ul className="mt-1 list-disc pl-5">
                {r.fatos.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </details>
            {r.status === 'para-aprovar' ? (
              <RascunhoPendente id={id} r={r} rodape={rodape} />
            ) : (
              <>
                <p className="mt-2 text-sm text-ink-soft">
                  Assunto: <span className="font-semibold text-ink">{r.assunto}</span>
                </p>
                <pre className="mt-2 rounded-lg border border-line bg-white p-4 font-sans text-[15px] leading-relaxed whitespace-pre-wrap">{r.corpo}</pre>
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

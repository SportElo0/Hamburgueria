'use client';

import { useActionState } from 'react';
import type { ResultadoChecagem } from '@/server/ia/checagem';

export type EstadoTeste = { erro?: string; resultado?: ResultadoChecagem };

/** Growlift-only button that runs the real-assistant checks on the server and shows each answer. */
export function TestarAssistente({ acao, modeloPadrao }: { acao: (a: EstadoTeste, fd: FormData) => Promise<EstadoTeste>; modeloPadrao: string }) {
  const [estado, enviar, rodando] = useActionState(acao, {});
  const r = estado.resultado;
  return (
    <div>
      <form action={enviar} className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1"><label className="rotulo" htmlFor="modelo-teste">Modelo</label><input className="campo" id="modelo-teste" name="modelo" defaultValue={modeloPadrao} /></div>
        <button className="botao" disabled={rodando}>{rodando ? 'Testando… (até 1 minuto)' : 'Testar a assistente real'}</button>
      </form>
      {estado.erro && <p role="alert" className="aviso mt-3 bg-erro-clara text-erro">{estado.erro}</p>}
      {r && (
        <div className="mt-4 space-y-2" role="status">
          <p className={`aviso ${r.casos.every((c) => c.ok) ? 'bg-ok-clara text-ok' : 'bg-alerta-clara text-alerta'}`}>
            {r.casos.filter((c) => c.ok).length} de {r.casos.length} verificações passaram · modelo {r.modelo} · {r.tokensEntrada} tokens de entrada e {r.tokensSaida} de saída · custo estimado {r.custoUsd == null ? 'sem preço cadastrado' : `US$ ${r.custoUsd.toFixed(4)}`}
          </p>
          <ul className="divide-y divide-linha text-[15px]">
            {r.casos.map((c) => (
              <li key={c.nome} className="py-2">
                <p className="font-semibold text-tinta"><span className={`etiqueta mr-2 ${c.ok ? 'etiqueta-ok' : 'etiqueta-erro'}`}>{c.ok ? 'ok' : 'falhou'}</span>{c.nome}{c.motivo ? ` · ${c.motivo}` : ''}</p>
                <p className="text-sm"><span className="text-suave">Cliente:</span> {c.cliente}</p>
                <p className="text-sm"><span className="text-suave">Assistente:</span> {c.assistente || '—'}</p>
                {c.acoes.length > 0 && <p className="text-sm text-suave">Ações pedidas: {c.acoes.join(', ')}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { bloquearManualAction, desbloquearAction } from '@/app/painel/oportunidades/vendas/actions';

export function NovoBloqueio() {
  const [pending, start] = useTransition();
  const [valor, setValor] = useState('');
  const [motivo, setMotivo] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  return (
    <form
      className="card mt-4 grid gap-2 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setMsg(null);
          const r = await bloquearManualAction(valor, motivo);
          if (!r.ok) setMsg({ ok: false, texto: r.error });
          else {
            setMsg({ ok: true, texto: r.dados.contatos ? `Bloqueado. ${r.dados.contatos} contato(s) do CRM passaram para "Não contatar".` : 'Bloqueado.' });
            setValor('');
            setMotivo('');
          }
        });
      }}
    >
      <div>
        <label className="label" htmlFor="bloq-valor">
          E-mail ou domínio
        </label>
        <input id="bloq-valor" className="field" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="contato@negocio.com.br ou negocio.com.br" required />
      </div>
      <div>
        <label className="label" htmlFor="bloq-motivo">
          Motivo
        </label>
        <input id="bloq-motivo" className="field" value={motivo} maxLength={200} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: pediu por telefone" />
      </div>
      <button type="submit" className="btn-danger" disabled={pending}>
        {pending ? 'Bloqueando…' : 'Bloquear'}
      </button>
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`text-sm font-semibold md:col-span-3 ${msg.ok ? 'text-ok' : 'text-bad'}`}>
          {msg.texto}
        </p>
      )}
    </form>
  );
}

export function Desbloquear({ chave }: { chave: string }) {
  const [pending, start] = useTransition();
  const [erro, setErro] = useState('');
  return (
    <>
      <button
        type="button"
        className="btn-ghost min-h-8 px-3 text-xs"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await desbloquearAction(chave);
            setErro(r.ok ? '' : r.error);
          })
        }
      >
        {pending ? '…' : 'Desfazer (foi engano)'}
      </button>
      {erro && <span className="ml-2 text-xs text-bad">{erro}</span>}
    </>
  );
}

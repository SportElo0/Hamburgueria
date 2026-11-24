'use client';

import { useState, useTransition } from 'react';
import { bloquearContatoAction, etapaAction, notaAction, respostaAction, whatsappAction, type Resposta } from '@/app/painel/oportunidades/vendas/actions';
import { ETAPAS, ETAPAS_MANUAIS, type Etapa } from '@/lib/vendas/regras';

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-4 first:border-0 first:pt-0">
      <h3 className="text-sm font-bold">{titulo}</h3>
      {children}
    </div>
  );
}

function useAcao() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const rodar = (fn: () => Promise<Resposta<unknown>>, ok: string, depois?: () => void) =>
    start(async () => {
      setMsg(null);
      const r = await fn();
      if (!r.ok) setMsg({ ok: false, texto: r.error });
      else {
        setMsg({ ok: true, texto: ok });
        depois?.();
      }
    });
  const aviso = msg && (
    <p role={msg.ok ? 'status' : 'alert'} className={`mt-2 text-sm font-semibold ${msg.ok ? 'text-ok' : 'text-bad'}`}>
      {msg.texto}
    </p>
  );
  return { pending, rodar, aviso };
}

export function AcoesContato({ id, etapa, podeWhatsapp }: { id: string; etapa: Etapa; podeWhatsapp: boolean }) {
  const etapaA = useAcao();
  const notaA = useAcao();
  const respA = useAcao();
  const whatsA = useAcao();
  const blockA = useAcao();
  const [nota, setNota] = useState('');
  const [resposta, setResposta] = useState('');
  const [numero, setNumero] = useState('');
  const [como, setComo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  if (etapa === 'nao-contatar')
    return <p className="card p-5 text-sm text-ink-soft">Este negócio pediu para não ser contatado. Nada mais pode ser feito aqui, de propósito.</p>;

  return (
    <section className="card space-y-4 p-5" aria-label="Ações">
      <Bloco titulo="Etapa do funil">
        <div className="mt-2 flex flex-wrap gap-2">
          {ETAPAS.filter((e) => ETAPAS_MANUAIS.includes(e.id)).map((e) => (
            <button
              key={e.id}
              type="button"
              title={e.dica}
              disabled={etapaA.pending}
              aria-pressed={etapa === e.id}
              onClick={() => etapaA.rodar(() => etapaAction(id, e.id), `Etapa: ${e.nome}.`)}
              className={`btn min-h-9 border px-3 text-[13px] ${etapa === e.id ? 'border-accent bg-accent text-white' : 'border-line bg-white hover:border-accent'}`}
            >
              {e.nome}
            </button>
          ))}
        </div>
        {etapaA.aviso}
      </Bloco>

      <Bloco titulo="Registrar resposta do cliente">
        <p className="mt-1 text-sm text-ink-soft">Cole a resposta que chegou. Se ele pedir para sair, o contato é bloqueado na hora.</p>
        <textarea className="field mt-2 min-h-24" value={resposta} maxLength={2000} onChange={(e) => setResposta(e.target.value)} aria-label="Resposta do cliente" />
        <button type="button" className="btn-ghost mt-2" disabled={respA.pending || resposta.trim().length < 2} onClick={() => respA.rodar(() => respostaAction(id, resposta), 'Resposta registrada.', () => setResposta(''))}>
          {respA.pending ? 'Salvando…' : 'Registrar resposta'}
        </button>
        {respA.aviso}
      </Bloco>

      {podeWhatsapp && (
        <Bloco titulo="O cliente pediu para ser chamado no WhatsApp">
          <p className="mt-1 text-sm text-ink-soft">Só quando ele mesmo pedir, por escrito. O painel não manda mensagem: o botão só abre a conversa para uma pessoa escrever.</p>
          <div className="mt-2 grid gap-2 md:grid-cols-[12rem_1fr]">
            <input className="field" inputMode="tel" placeholder="(11) 98888-7777" value={numero} onChange={(e) => setNumero(e.target.value)} aria-label="Celular do cliente" />
            <input className="field" placeholder="Como pediu (ex.: respondeu o e-mail de 03/11)" value={como} maxLength={300} onChange={(e) => setComo(e.target.value)} aria-label="Como o cliente pediu" />
          </div>
          <button type="button" className="btn-ghost mt-2" disabled={whatsA.pending} onClick={() => whatsA.rodar(() => whatsappAction(id, { numero, como }), 'Número registrado.')}>
            {whatsA.pending ? 'Salvando…' : 'Registrar pedido'}
          </button>
          {whatsA.aviso}
        </Bloco>
      )}

      <Bloco titulo="Anotação">
        <input className="field mt-2" value={nota} maxLength={1000} placeholder="Ex.: ligou pedindo proposta do Grow" onChange={(e) => setNota(e.target.value)} aria-label="Anotação" />
        <button type="button" className="btn-ghost mt-2" disabled={notaA.pending || nota.trim().length < 2} onClick={() => notaA.rodar(() => notaAction(id, nota), 'Anotado.', () => setNota(''))}>
          {notaA.pending ? 'Salvando…' : 'Anotar'}
        </button>
        {notaA.aviso}
      </Bloco>

      <Bloco titulo="Não contatar">
        <p className="mt-1 text-sm text-ink-soft">Bloqueia este e-mail e o negócio para sempre, descarta textos pendentes e marca &quot;Não contatar&quot; em Oportunidades.</p>
        {!confirmar ? (
          <button type="button" className="btn-danger mt-2" onClick={() => setConfirmar(true)}>
            Bloquear contato
          </button>
        ) : (
          <div className="mt-2 grid gap-2">
            <input className="field" placeholder="Motivo (ex.: pediu por telefone)" value={motivo} maxLength={200} onChange={(e) => setMotivo(e.target.value)} aria-label="Motivo do bloqueio" />
            <div className="flex gap-2">
              <button type="button" className="btn-danger" disabled={blockA.pending} onClick={() => blockA.rodar(() => bloquearContatoAction(id, motivo), 'Bloqueado.')}>
                {blockA.pending ? 'Bloqueando…' : 'Confirmar bloqueio'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setConfirmar(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
        {blockA.aviso}
      </Bloco>
    </section>
  );
}

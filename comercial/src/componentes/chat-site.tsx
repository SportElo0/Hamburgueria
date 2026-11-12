'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Msg {
  id: string;
  de: 'voce' | 'assistente' | 'equipe';
  texto: string;
  simulada: boolean;
}

/** Chat with the company's virtual assistant. The conversation token lives only in this tab's memory and storage. */
export function ChatSite({ chave, empresa, tokenInicial, aberto: abertoInicial = false, flutuante = true }: { chave: string; empresa: string; tokenInicial?: string | null; aberto?: boolean; flutuante?: boolean }) {
  const guarda = `chat:${chave}`;
  const [aberto, setAberto] = useState(abertoInicial);
  const [token, setToken] = useState<string | null>(tokenInicial ?? null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [estado, setEstado] = useState('ia_ativa');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const fim = useRef<HTMLDivElement>(null);

  const chamar = useCallback(
    async (corpo: Record<string, unknown>) => {
      const r = await fetch('/api/publico/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chave, ...corpo }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro ?? 'Não foi possível enviar. Tente de novo.');
      setMsgs(j.mensagens);
      setEstado(j.estado);
      if (j.token) {
        setToken(j.token);
        try { sessionStorage.setItem(guarda, j.token); } catch {}
      }
    },
    [chave, guarda],
  );

  useEffect(() => {
    if (tokenInicial) {
      try { sessionStorage.setItem(guarda, tokenInicial); } catch {}
      return;
    }
    try {
      const salvo = sessionStorage.getItem(guarda);
      // Restored after mount: the stored token only exists in the browser.
      if (salvo) queueMicrotask(() => setToken(salvo));
    } catch {}
  }, [guarda, tokenInicial]);

  // While open, look for new messages (a person from the team may answer).
  useEffect(() => {
    if (!aberto || !token) return;
    const ler = () => chamar({ acao: 'ler', token }).catch(() => {});
    ler();
    const t = setInterval(() => document.visibilityState === 'visible' && ler(), 5000);
    return () => clearInterval(t);
  }, [aberto, token, chamar]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'nearest' });
  }, [msgs, aberto]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setErro('');
    try {
      await chamar({ token, texto: t });
      setTexto('');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar.');
    } finally {
      setEnviando(false);
    }
  }

  const painel = (
    <section aria-label={`Chat com a ${empresa}`} className={`flex flex-col overflow-hidden rounded-2xl border border-linha bg-white ${flutuante ? 'h-[min(70dvh,520px)] w-[min(92vw,380px)] shadow-2xl' : 'h-[420px] w-full'}`}>
      <header className="flex items-center justify-between gap-2 bg-tinta px-4 py-3 text-white">
        <div>
          <p className="font-bold">Assistente virtual da {empresa}</p>
          <p className="text-[12.5px] text-white/75">{estado === 'ia_ativa' ? 'Respostas automáticas. Peça “atendente” para falar com uma pessoa.' : estado === 'humano_atendendo' ? 'Uma pessoa da equipe está neste atendimento.' : 'A equipe foi avisada e vai responder por aqui.'}</p>
        </div>
        {flutuante && <button type="button" onClick={() => setAberto(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-lg" aria-label="Fechar o chat">×</button>}
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite">
        {msgs.length === 0 && <p className="p-2 text-sm text-suave">Escreva sua dúvida ou diga o que você precisa. A assistente responde com as informações da empresa e chama uma pessoa quando for preciso.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.de === 'voce' ? 'justify-end' : 'justify-start'}`}>
            <p className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-[15px] ${m.de === 'voce' ? 'bg-marca text-white' : 'bg-[#eef1f5] text-tinta'}`}>
              {m.de !== 'voce' && <span className="mb-0.5 block text-[12px] font-semibold text-suave">{m.de === 'equipe' ? 'Equipe' : `Assistente virtual${m.simulada ? ' · simulação' : ''}`}</span>}
              {m.texto}
            </p>
          </div>
        ))}
        <div ref={fim} />
      </div>
      <form onSubmit={enviar} className="border-t border-linha p-2">
        {erro && <p role="alert" className="mb-2 rounded-md bg-erro-clara px-2 py-1.5 text-sm text-erro">{erro}</p>}
        <div className="flex gap-2">
          <label className="sr-only" htmlFor={`chat-${chave}`}>Sua mensagem</label>
          <input id={`chat-${chave}`} className="campo" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={1000} placeholder="Escreva aqui" autoComplete="off" />
          <button className="botao shrink-0" disabled={enviando || !texto.trim()}>{enviando ? '…' : 'Enviar'}</button>
        </div>
      </form>
    </section>
  );

  if (!flutuante) return painel;
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
      {aberto && painel}
      {!aberto && (
        <button type="button" onClick={() => setAberto(true)} className="botao rounded-full px-5 shadow-lg">Tirar dúvidas no chat</button>
      )}
    </div>
  );
}

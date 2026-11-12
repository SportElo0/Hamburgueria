'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatSite } from './chat-site';

export interface CampoExtra {
  id: string;
  rotulo: string;
  tipo: 'opcoes' | 'numero' | 'texto';
  opcoes: string[];
  obrigatorio: boolean;
}

interface Props {
  chave: string;
  empresa: string;
  campos: CampoExtra[];
  textoConsentimento: string;
  linkPrivacidade: string;
  origem: 'site' | 'formulario_incorporado';
}

const Erro = ({ id, erros }: { id: string; erros: Record<string, string> }) => (erros[id] ? <p id={`${id}-erro`} className="mt-1 text-sm font-semibold text-erro">{erros[id]}</p> : null);

const novaChave = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `k${Date.now()}${Math.random().toString(36).slice(2, 12)}`);

/** Quote request form. It only says "received" after the server confirms the request was saved. */
export function FormularioPedido({ chave, empresa, campos, textoConsentimento, linkPrivacidade, origem }: Props) {
  const [erros, setErros] = useState<Record<string, string>>({});
  const [geral, setGeral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState<{ chat: string | null; whatsapp: string; resumo: string } | null>(null);
  // One key per form fill: sending twice (double click, retry after a network error) cannot create two requests.
  const idem = useRef('');
  const topoErros = useRef<HTMLParagraphElement>(null);
  // A ref, not state: two submits in the same instant must see the lock at once.
  const travado = useRef(false);
  useEffect(() => {
    idem.current = novaChave();
  }, []);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (travado.current) return;
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? '').trim();
    const extras = Object.fromEntries(campos.map((c) => [c.id, v(`extra_${c.id}`)]));
    const local: Record<string, string> = {};
    if (v('nome').length < 2) local.nome = 'Escreva seu nome.';
    if (v('telefone').replace(/\D/g, '').length < 10) local.telefone = 'Escreva o telefone com DDD. Exemplo: (11) 91234-5678.';
    if (v('cidade').length < 2) local.cidade = 'Escreva sua cidade.';
    if (v('necessidade').length < 5) local.necessidade = 'Conte em poucas palavras o que você precisa.';
    if (!v('preferencia_contato')) local.preferencia_contato = 'Escolha como prefere o contato.';
    for (const c of campos) if (c.obrigatorio && !extras[c.id]) local[`extra_${c.id}`] = `Preencha: ${c.rotulo.toLowerCase()}.`;
    setErros(local);
    setGeral('');
    if (Object.keys(local).length) {
      setGeral('Confira os campos destacados.');
      topoErros.current?.focus();
      return;
    }
    travado.current = true;
    setEnviando(true);
    try {
      const campanha = Object.fromEntries([...new URLSearchParams(window.location.search)].filter(([k]) => /^(utm_|gclid$|fbclid$)/.test(k)));
      const r = await fetch('/api/publico/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave, origem, nome: v('nome'), telefone: v('telefone'), cidade: v('cidade'), necessidade: v('necessidade'), preferencia_contato: v('preferencia_contato'), aceite_whatsapp: fd.get('aceite_whatsapp') === 'on', chave_idempotencia: idem.current, extras, campanha, site_url: v('site_url') }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 422 && j.campos) {
        setErros(Object.fromEntries(Object.entries(j.campos as Record<string, string>).map(([k, m]) => [campos.some((c) => c.id === k) ? `extra_${k}` : k, m])));
        setGeral(j.erro ?? 'Confira os campos destacados.');
        topoErros.current?.focus();
        return;
      }
      if (!r.ok) throw new Error(j.erro ?? 'Não foi possível enviar agora.');
      setFeito({ chat: j.chat ?? null, whatsapp: j.whatsapp ?? '', resumo: `Olá! Acabei de pedir um orçamento pelo site. Meu nome é ${v('nome')}, sou de ${v('cidade')}. ${v('necessidade')}` });
    } catch (err) {
      setGeral(`${err instanceof Error ? err.message : 'Não foi possível enviar agora.'} Seus dados continuam no formulário: tente de novo.`);
      topoErros.current?.focus();
    } finally {
      travado.current = false;
      setEnviando(false);
    }
  }

  if (feito) {
    return (
      <div className="space-y-4" role="status">
        <div className="rounded-xl bg-ok-clara p-4 text-ok">
          <p className="text-lg font-bold">Pedido recebido.</p>
          <p className="mt-1 text-[15px]">A {empresa} recebeu seus dados e uma pessoa da equipe vai falar com você.</p>
        </div>
        {feito.whatsapp && (
          <div>
            <a className="botao-2 w-full" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${feito.whatsapp.length <= 11 ? `55${feito.whatsapp}` : feito.whatsapp}?text=${encodeURIComponent(feito.resumo)}`}>Abrir o WhatsApp com um resumo</a>
            <p className="mt-1 text-[13px] text-suave">Opcional: o pedido já está salvo. O WhatsApp abre com um texto pronto e você decide se envia.</p>
          </div>
        )}
        {feito.chat && (
          <div>
            <p className="mb-2 text-[15px] font-semibold text-tinta">Ficou alguma dúvida? Pergunte agora:</p>
            <ChatSite chave={chave} empresa={empresa} tokenInicial={feito.chat} aberto flutuante={false} />
          </div>
        )}
      </div>
    );
  }

  const attrs = (id: string) => ({ id, name: id, 'aria-invalid': !!erros[id], 'aria-describedby': erros[id] ? `${id}-erro` : undefined });
  return (
    <form onSubmit={enviar} method="post" noValidate className="space-y-4">
      <p ref={topoErros} tabIndex={-1} role="alert" className={geral ? 'aviso bg-erro-clara text-erro' : 'sr-only'}>{geral}</p>
      <div><label className="rotulo" htmlFor="nome">Nome</label><input className="campo" autoComplete="name" {...attrs('nome')} /><Erro erros={erros} id="nome" /></div>
      <div><label className="rotulo" htmlFor="telefone">Telefone com DDD</label><input className="campo" inputMode="tel" autoComplete="tel" placeholder="(11) 91234-5678" {...attrs('telefone')} /><Erro erros={erros} id="telefone" /></div>
      <div><label className="rotulo" htmlFor="cidade">Cidade</label><input className="campo" autoComplete="address-level2" {...attrs('cidade')} /><Erro erros={erros} id="cidade" /></div>
      {campos.map((c) => {
        const id = `extra_${c.id}`;
        return (
          <div key={c.id}>
            <label className="rotulo" htmlFor={id}>{c.rotulo}{c.obrigatorio ? '' : ' (opcional)'}</label>
            {c.tipo === 'opcoes' ? (
              <select className="campo" defaultValue="" {...attrs(id)}><option value="" disabled>Escolha</option>{c.opcoes.map((o) => <option key={o}>{o}</option>)}</select>
            ) : (
              <input className="campo" inputMode={c.tipo === 'numero' ? 'decimal' : undefined} {...attrs(id)} />
            )}
            <Erro erros={erros} id={id} />
          </div>
        );
      })}
      <div><label className="rotulo" htmlFor="necessidade">O que você precisa?</label><textarea className="campo" rows={3} maxLength={1000} {...attrs('necessidade')} /><Erro erros={erros} id="necessidade" /></div>
      <fieldset aria-describedby={erros.preferencia_contato ? 'preferencia_contato-erro' : undefined}>
        <legend className="rotulo">Como prefere o contato?</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {['WhatsApp', 'Ligação'].map((p) => <label key={p} className="flex min-h-11 items-center gap-2 text-[15px]"><input type="radio" name="preferencia_contato" value={p} className="h-5 w-5" defaultChecked={p === 'WhatsApp'} /> {p}</label>)}
        </div>
        <Erro erros={erros} id="preferencia_contato" />
      </fieldset>
      <label className="flex items-start gap-3 text-[14.5px]"><input type="checkbox" name="aceite_whatsapp" className="mt-0.5 h-5 w-5 shrink-0" /><span>{textoConsentimento}</span></label>
      {/* Hidden from people; robots fill it and are discarded. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Site<input name="site_url" tabIndex={-1} autoComplete="off" /></label></div>
      <button className="botao w-full" disabled={enviando}>{enviando ? 'Enviando…' : 'Pedir orçamento'}</button>
      <p className="text-[13px] text-suave">Usamos seus dados só para responder a este pedido. <a className="underline" href={linkPrivacidade} target="_blank" rel="noopener noreferrer">Privacidade</a>.</p>
    </form>
  );
}

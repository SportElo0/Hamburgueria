'use client';
// Contact form: same validation as the quote, honeypot + time check against spam, accessible errors, and an
// honest result (if e-mail delivery is not configured, it says so and points to phone/WhatsApp/e-mail).
import { useEffect, useId, useRef, useState } from 'react';
import { z } from 'zod';
import { EMPRESA } from '@/data/empresa';
import { contatoSchema, UF_LISTA } from '@/lib/cotacao';

const schema = contatoSchema.extend({ mensagem: z.string().trim().min(5, 'Escreva a sua mensagem.').max(2000) });
type Campos = { nome: string; empresa: string; email: string; telefone: string; cidade: string; uf: string; mensagem: string; aceite: boolean };

export function FormContato() {
  const id = useId();
  const [c, setC] = useState<Campos>({ nome: '', empresa: '', email: '', telefone: '', cidade: '', uf: '', mensagem: '', aceite: false });
  const [erros, setErros] = useState<Partial<Record<keyof Campos, string>>>({});
  const [estado, setEstado] = useState<'ocioso' | 'enviando' | 'enviado' | 'erro'>('ocioso');
  const [msg, setMsg] = useState('');
  const [configurado, setConfigurado] = useState<boolean | null>(null);
  // when the form appeared, for the anti-bot time check
  const aberto = useRef(0);
  useEffect(() => {
    aberto.current = Date.now();
  }, []);

  useEffect(() => {
    fetch('/api/contato').then((r) => r.json()).then((d) => setConfigurado(Boolean(d.configurado))).catch(() => setConfigurado(false));
  }, []);

  const mudar = (k: keyof Campos, v: string | boolean) => {
    setC((x) => ({ ...x, [k]: v }));
    setErros((e) => ({ ...e, [k]: undefined }));
  };

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const r = schema.safeParse(c);
    if (!r.success) {
      const novos: Partial<Record<keyof Campos, string>> = {};
      for (const i of r.error.issues) novos[i.path[0] as keyof Campos] ??= i.message;
      setErros(novos);
      document.getElementById(`${id}-${Object.keys(novos)[0]}`)?.focus();
      return;
    }
    setEstado('enviando');
    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contato: r.data, site: (e.currentTarget.elements.namedItem('site') as HTMLInputElement | null)?.value ?? '', tempo: Date.now() - aberto.current }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) return setEstado('enviado');
      setMsg(d.erro ?? 'Não foi possível enviar agora.');
      setEstado('erro');
    } catch {
      setMsg('Sem conexão com o servidor agora.');
      setEstado('erro');
    }
  };

  if (estado === 'enviado')
    return (
      <p role="status" className="mt-8 rounded-2xl bg-azul/10 p-6 text-azul-profundo">
        Mensagem enviada. A equipe da Bacchi responde pelo e-mail ou telefone informado.
      </p>
    );

  const campo = (k: keyof Campos, rotulo: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="rotulo" htmlFor={`${id}-${k}`}>{rotulo}</label>
      <input id={`${id}-${k}`} className="campo" value={c[k] as string} onChange={(e) => mudar(k, e.target.value)} aria-invalid={!!erros[k]} aria-describedby={erros[k] ? `${id}-${k}-e` : undefined} {...props} />
      {erros[k] && <p id={`${id}-${k}-e`} className="mt-1.5 text-sm text-[#b3261e]">{erros[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={enviar} noValidate className="mt-8 grid gap-4 sm:grid-cols-2">
      {campo('nome', 'Nome', { autoComplete: 'name' })}
      {campo('empresa', 'Empresa', { autoComplete: 'organization' })}
      {campo('email', 'E-mail', { type: 'email', autoComplete: 'email' })}
      {campo('telefone', 'Telefone com DDD', { type: 'tel', autoComplete: 'tel', inputMode: 'tel' })}
      {campo('cidade', 'Cidade', { autoComplete: 'address-level2' })}
      <div>
        <label className="rotulo" htmlFor={`${id}-uf`}>Estado</label>
        <select id={`${id}-uf`} className="campo" value={c.uf} onChange={(e) => mudar('uf', e.target.value)} aria-invalid={!!erros.uf}>
          <option value="">UF</option>
          {UF_LISTA.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        {erros.uf && <p className="mt-1.5 text-sm text-[#b3261e]">{erros.uf}</p>}
      </div>
      <div className="sm:col-span-2">
        <label className="rotulo" htmlFor={`${id}-mensagem`}>Mensagem</label>
        <textarea id={`${id}-mensagem`} className="campo min-h-36" maxLength={2000} value={c.mensagem} onChange={(e) => mudar('mensagem', e.target.value)} aria-invalid={!!erros.mensagem} />
        {erros.mensagem && <p className="mt-1.5 text-sm text-[#b3261e]">{erros.mensagem}</p>}
      </div>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>Site <input name="site" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
      </div>
      <label className="flex items-start gap-3 text-sm text-tinta-2 sm:col-span-2">
        <input id={`${id}-aceite`} type="checkbox" checked={c.aceite} onChange={(e) => mudar('aceite', e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--color-azul)]" />
        <span>Autorizo a Bacchi a usar estes dados para responder a esta mensagem.</span>
      </label>
      {erros.aceite && <p className="-mt-2 text-sm text-[#b3261e] sm:col-span-2">{erros.aceite}</p>}
      <div className="sm:col-span-2">
        <button type="submit" className="btn btn-primario w-full sm:w-auto" disabled={estado === 'enviando' || configurado === false}>
          {estado === 'enviando' ? 'Enviando…' : configurado === false ? 'Envio pelo site ainda não configurado' : 'Enviar mensagem'}
        </button>
        <div aria-live="polite">
          {(estado === 'erro' || configurado === false) && (
            <p className="mt-4 rounded-xl bg-papel px-4 py-3 text-sm text-tinta-2">
              {estado === 'erro' ? `${msg} ` : 'O formulário ainda não está ligado ao e-mail da Bacchi. '}
              Fale pelo telefone <a className="link-b font-semibold" href={EMPRESA.telefoneLink}>{EMPRESA.telefone}</a>, pelo{' '}
              <a className="link-b font-semibold" href={EMPRESA.whatsappLink} target="_blank" rel="noopener noreferrer">WhatsApp</a> ou por{' '}
              <a className="link-b font-semibold" href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a>.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

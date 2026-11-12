'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';

export interface Retorno {
  erro?: string;
  ok?: string;
  /** Something to show once and let the person copy (an invitation link, for example). */
  copiar?: string;
}
export type Acao = (anterior: Retorno, dados: FormData) => Promise<Retorno>;

/** A form bound to a server action: shows the pending state, the error or the success message, and blocks double sends. */
export function Formulario({ acao, children, className, limpar }: { acao: Acao; children: React.ReactNode; className?: string; limpar?: boolean }) {
  const [estado, enviar] = useActionState(acao, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (limpar && estado.ok) ref.current?.reset();
  }, [estado, limpar]);
  return (
    <form ref={ref} action={enviar} className={className}>
      {children}
      {estado.erro && (
        <p role="alert" className="aviso mt-3 bg-erro-clara text-erro">
          {estado.erro}
        </p>
      )}
      {estado.ok && (
        <p role="status" className="aviso mt-3 bg-ok-clara text-ok">
          {estado.ok}
        </p>
      )}
      {estado.copiar && (
        <p className="aviso mt-3 border border-linha bg-fundo text-tinta">
          <span className="block text-sm text-suave">Copie e envie para a pessoa (aparece só agora):</span>
          <code className="mt-1 block break-all text-sm">{estado.copiar}</code>
        </p>
      )}
    </form>
  );
}

export function Enviar({ children, secundario, className = '' }: { children: React.ReactNode; secundario?: boolean; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${secundario ? 'botao-2' : 'botao'} ${className}`}>
      {pending ? 'Aguarde…' : children}
    </button>
  );
}

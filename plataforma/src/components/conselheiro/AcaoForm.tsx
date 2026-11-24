'use client';

import { useActionState } from 'react';
import type { Estado } from '@/app/loja/[slug]/dono/conselheiro/actions';

/** Formulário que chama uma Server Action e mostra o resultado (ok ou erro) ao lado do botão. */
export function AcaoForm({
  action,
  children,
  botao,
  className = '',
  variante = 'primary',
  inline = false,
}: {
  action: (prev: Estado | null, fd: FormData) => Promise<Estado>;
  children?: React.ReactNode;
  botao: string;
  className?: string;
  variante?: 'primary' | 'ghost' | 'danger';
  inline?: boolean;
}) {
  const [estado, formAction, pending] = useActionState(action, null);
  const cls = variante === 'primary' ? 'btn-primary' : variante === 'danger' ? 'btn-danger' : 'btn-ghost';
  return (
    <form action={formAction} className={`${inline ? 'flex flex-wrap items-end gap-2' : 'space-y-3'} ${className}`}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={cls} disabled={pending}>
          {pending ? 'Salvando…' : botao}
        </button>
        {estado && (
          <p role="status" aria-live="polite" className={`text-sm font-semibold ${estado.ok ? 'text-ok' : 'text-bad'}`}>
            {estado.msg}
          </p>
        )}
      </div>
    </form>
  );
}

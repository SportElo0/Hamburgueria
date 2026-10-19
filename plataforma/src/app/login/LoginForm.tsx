'use client';

import { useActionState } from 'react';
import { login, type LoginState } from './actions';

export function LoginForm({ volta }: { volta: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="volta" value={volta} />
      <div>
        <label htmlFor="email" className="label">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" defaultValue={state.email} key={state.email} />
      </div>
      <div>
        <label htmlFor="senha" className="label">Senha</label>
        <input id="senha" name="senha" type="password" autoComplete="current-password" required className="field" />
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}

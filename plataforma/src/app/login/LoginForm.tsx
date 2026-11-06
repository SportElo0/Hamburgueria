'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { cadastrar, login, type CadastroState, type LoginState } from './actions';

type Quem = 'restaurante' | 'equipe';
type Modo = 'entrar' | 'novo';

function Abas<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-paper p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`min-h-10 rounded-md px-3 text-sm font-semibold transition-colors ${value === o.id ? 'bg-white text-ink shadow-sm' : 'text-ink-mute hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Entrar({ volta }: { volta: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="volta" value={volta} />
      <div>
        <label htmlFor="email" className="label">
          E-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" defaultValue={state.email} key={state.email} />
      </div>
      <div>
        <label htmlFor="senha" className="label">
          Senha
        </label>
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

function Cadastro() {
  const [state, action, pending] = useActionState<CadastroState, FormData>(cadastrar, {});
  const v = state.valores;
  const [logo, setLogo] = useState('');
  return (
    <form action={action} className="space-y-4" key={JSON.stringify(v ?? {})}>
      <p className="text-sm text-ink-soft">Crie a conta do seu restaurante. A Growlift confere e libera o seu painel.</p>
      <div>
        <label htmlFor="restaurante" className="label">
          Nome do restaurante
        </label>
        <input id="restaurante" name="restaurante" required maxLength={80} className="field" defaultValue={v?.restaurante} autoComplete="organization" />
      </div>
      <div>
        <p className="label">
          Logo <span className="font-normal text-ink-mute">(opcional, JPG, PNG ou WebP até 2 MB)</span>
        </p>
        <div className="flex items-center gap-3">
          <label htmlFor="logo" className="btn-ghost shrink-0 cursor-pointer">
            {logo ? 'Trocar imagem' : 'Escolher imagem'}
          </label>
          <span className="min-w-0 truncate text-sm text-ink-mute">{logo || 'Nenhuma imagem'}</span>
        </div>
        <input id="logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setLogo(e.target.files?.[0]?.name ?? '')} />
      </div>
      <div>
        <label htmlFor="dono" className="label">
          Seu nome
        </label>
        <input id="dono" name="dono" required maxLength={60} className="field" defaultValue={v?.dono} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="whatsapp" className="label">
          WhatsApp com DDD
        </label>
        <input id="whatsapp" name="whatsapp" required inputMode="tel" maxLength={20} placeholder="(11) 91234-5678" className="field" defaultValue={v?.whatsapp} autoComplete="tel" />
      </div>
      <div>
        <label htmlFor="novo-email" className="label">
          E-mail
        </label>
        <input id="novo-email" name="email" type="email" required maxLength={120} className="field" defaultValue={v?.email} autoComplete="email" />
      </div>
      <div>
        <label htmlFor="nova-senha" className="label">
          Crie uma senha <span className="font-normal text-ink-mute">(pelo menos 8 letras ou números)</span>
        </label>
        <input id="nova-senha" name="senha" type="password" required minLength={8} maxLength={200} autoComplete="new-password" className="field" />
      </div>
      <div>
        <label htmlFor="nova-senha2" className="label">
          Repita a senha
        </label>
        <input id="nova-senha2" name="senha2" type="password" required minLength={8} maxLength={200} autoComplete="new-password" className="field" />
      </div>
      {/* Hidden from people; robots fill every field. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="site">Site</label>
        <input id="site" name="site" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="flex items-start gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="aceite" value="sim" required className="mt-1 h-4 w-4 shrink-0 accent-accent" />
        <span>
          Li{' '}
          <Link href="/cadastro/privacidade" target="_blank" className="font-semibold text-accent underline">
            como a Growlift usa os meus dados
          </Link>
          .
        </span>
      </label>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Criando a conta…' : 'Criar conta'}
      </button>
    </form>
  );
}

export function LoginForm({ volta }: { volta: string }) {
  const [quem, setQuem] = useState<Quem>(volta.startsWith('/painel') ? 'equipe' : 'restaurante');
  const [modo, setModo] = useState<Modo>('entrar');
  return (
    <div className="mt-6 space-y-5">
      <Abas
        label="Quem está entrando"
        value={quem}
        onChange={setQuem}
        options={[
          { id: 'restaurante', label: 'Sou restaurante' },
          { id: 'equipe', label: 'Sou da Growlift' },
        ]}
      />
      {quem === 'restaurante' && (
        <Abas
          label="Já tem conta?"
          value={modo}
          onChange={setModo}
          options={[
            { id: 'entrar', label: 'Já tenho conta' },
            { id: 'novo', label: 'Sou novo' },
          ]}
        />
      )}
      {quem === 'restaurante' && modo === 'novo' ? <Cadastro /> : <Entrar volta={volta} />}
      {quem === 'restaurante' && modo === 'entrar' && <p className="text-xs text-ink-mute">Esqueceu a senha? Peça uma nova à Growlift pelo WhatsApp.</p>}
    </div>
  );
}

'use client';

import { useActionState, useState } from 'react';
import { createStoreAction, type ActionResult } from '../../actions';
import { slugify } from '@/lib/slug';

export function NewStoreForm() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(createStoreAction, { ok: true });
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [touched, setTouched] = useState(false);

  return (
    <form action={action} className="card mt-6 space-y-5 p-6">
      <div>
        <label htmlFor="nome" className="label">Nome da loja</label>
        <input
          id="nome"
          name="nome"
          required
          className="field"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!touched) setSlug(slugify(e.target.value));
          }}
        />
      </div>
      <div>
        <label htmlFor="slug" className="label">Identificador (slug)</label>
        <input
          id="slug"
          name="slug"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          className="field font-mono"
          value={slug}
          onChange={(e) => {
            setTouched(true);
            setSlug(e.target.value);
          }}
          aria-describedby="slug-help"
        />
        <p id="slug-help" className="mt-1 text-xs text-ink-mute">
          Usado no endereço dos dados da loja. Não pode ser mudado depois. Ex.: gara-pizza
        </p>
      </div>
      <div>
        <label htmlFor="segmento" className="label">Tipo de negócio</label>
        <select id="segmento" name="segmento" className="field" defaultValue="restaurante">
          <option value="restaurante">Restaurante (cardápio)</option>
          <option value="loja">Loja (catálogo de produtos)</option>
          <option value="servico">Serviço</option>
        </select>
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Criando…' : 'Criar loja'}
      </button>
    </form>
  );
}

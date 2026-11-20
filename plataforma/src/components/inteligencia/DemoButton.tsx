'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createDemoAction } from '@/app/painel/inteligencia/actions';

export function DemoButton({ exists }: { exists: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const router = useRouter();
  return (
    <div>
      <button
        type="button"
        className={exists ? 'btn-ghost' : 'btn-primary'}
        disabled={pending}
        onClick={() => {
          if (exists && !confirm('Recriar a demonstração apaga as decisões e custos editados nela e gera os pedidos fictícios de novo. Continuar?')) return;
          setError('');
          start(async () => {
            const r = await createDemoAction();
            if (!r.ok) setError(r.error ?? 'Erro.');
            else router.push('/painel/inteligencia/demo-inteligencia');
          });
        }}
      >
        {pending ? 'Gerando dados fictícios…' : exists ? 'Recriar demonstração' : 'Criar loja de demonstração'}
      </button>
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
    </div>
  );
}

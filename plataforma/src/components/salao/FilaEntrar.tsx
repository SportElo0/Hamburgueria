'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { joinQueueAction } from '@/app/fila/[slug]/actions';

export function FilaEntrar({ slug, storeName, waiting }: { slug: string; storeName: string; waiting: number }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [people, setPeople] = useState(2);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Informe seu nome.');
    startTransition(async () => {
      const res = await joinQueueAction(slug, { name, phone, people });
      if (!res.ok) return setError(res.error);
      router.push(`/fila/${slug}/${res.data.id}?t=${res.data.token}`);
    });
  };

  return (
    <main className="mx-auto max-w-md px-4 pt-8 pb-16">
      <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">Fila de espera</p>
      <h1 className="mt-1 text-3xl font-black tracking-tight">{storeName}</h1>
      <p className="mt-3 text-lg">
        {waiting === 0 ? 'Ninguém esperando agora.' : `${waiting} ${waiting === 1 ? 'grupo esperando' : 'grupos esperando'} na sua frente.`}
      </p>
      <p className="mt-1 text-ink-soft">Entre na fila pelo celular e deixe esta página aberta, com a tela ligada: ela avisa quando a sua mesa estiver pronta.</p>

      <form onSubmit={submit} noValidate className="card mt-6 space-y-4 p-5">
        <div>
          <label htmlFor="nome" className="label">
            Seu nome
          </label>
          <input id="nome" className="field" autoComplete="given-name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <span className="label">Quantas pessoas</span>
          <div className="flex items-center gap-3">
            <button type="button" className="btn-ghost min-h-11 w-11 text-lg" onClick={() => setPeople((p) => Math.max(1, p - 1))} aria-label="Menos uma pessoa">
              −
            </button>
            <span className="w-10 text-center text-xl font-bold tabular-nums" aria-live="polite">
              {people}
            </span>
            <button type="button" className="btn-ghost min-h-11 w-11 text-lg" onClick={() => setPeople((p) => Math.min(30, p + 1))} aria-label="Mais uma pessoa">
              +
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="tel" className="label">
            Telefone (opcional)
          </label>
          <input id="tel" className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} aria-describedby="tel-ajuda" />
          <p id="tel-ajuda" className="mt-1 text-xs text-ink-mute">
            Só para a recepção te avisar no WhatsApp quando a mesa estiver pronta. Não usamos para propaganda. Apagado quando você sai da fila.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm font-semibold text-bad">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn-primary min-h-12 w-full text-base">
          {pending ? 'Entrando…' : 'Entrar na fila'}
        </button>
        <p className="text-xs text-ink-mute">
          Usamos seu nome (e telefone, se informar) só para chamar você nesta fila, em nome de {storeName}. Nada de propaganda. A lista é apagada em até 2 dias.{' '}
          <a href={`/privacidade/${slug}`} className="underline">
            Aviso de privacidade
          </a>
        </p>
      </form>
    </main>
  );
}

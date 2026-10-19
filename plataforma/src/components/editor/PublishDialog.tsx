'use client';

import { useEffect, useRef, useState } from 'react';
import { NOT_COUNTED_REASONS, type Usage } from '@/lib/changes';
import { publishAction } from '@/app/painel/actions';

export type CountMode = 'conta' | 'nao-conta' | 'interno';

export function CountChoice(props: {
  mode: CountMode;
  setMode: (m: CountMode) => void;
  reason: string;
  setReason: (r: string) => void;
  allowInternal: boolean;
}) {
  const options: [CountMode, string, string][] = [
    ['conta', 'Pedido do cliente', 'Conta no limite de mudanças do mês.'],
    ['nao-conta', 'Pedido que não conta', 'Feriado, erro nosso ou cortesia.'],
    ...(props.allowInternal ? ([['interno', 'Ajuste interno', 'Não registra no histórico do cliente.']] as [CountMode, string, string][]) : []),
  ];
  return (
    <fieldset className="space-y-2">
      <legend className="label">Tipo de mudança</legend>
      {options.map(([value, title, hint]) => (
        <label key={value} className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 has-[:checked]:border-ink">
          <input type="radio" name="tipo" className="mt-1" checked={props.mode === value} onChange={() => props.setMode(value)} />
          <span>
            <span className="block text-sm font-semibold">{title}</span>
            <span className="block text-xs text-ink-mute">{hint}</span>
          </span>
        </label>
      ))}
      {props.mode === 'nao-conta' && (
        <select aria-label="Motivo" className="field" value={props.reason} onChange={(e) => props.setReason(e.target.value)}>
          <option value="">Escolha o motivo</option>
          {NOT_COUNTED_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      )}
    </fieldset>
  );
}

export function PublishDialog(props: {
  slug: string;
  usage: Usage;
  dirty: boolean;
  save: () => Promise<string | null>;
  onClose: () => void;
  onDone: (message: string, etag?: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<CountMode>('conta');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const willBeExtra = mode === 'conta' && props.usage.used >= props.usage.limit;
  const needsDescription = mode !== 'interno';
  const valid = (!needsDescription || description.trim()) && (mode !== 'nao-conta' || reason);

  const submit = async () => {
    setPending(true);
    setError('');
    if (props.dirty && !(await props.save())) {
      setPending(false);
      return setError('Não foi possível salvar antes de publicar. Veja a mensagem acima.');
    }
    const res = await publishAction(props.slug, {
      description: needsDescription ? description : '',
      counted: mode === 'conta',
      reason: mode === 'nao-conta' ? reason : '',
    });
    setPending(false);
    if (!res.ok) return setError(res.error ?? 'Falha ao publicar.');
    props.onDone(res.extra ? 'Publicado. Esta mudança passou do limite e ficou marcada como extra para cobrar.' : 'Publicado. O site já mostra a nova versão.', res.etag);
  };

  return (
    <dialog ref={ref} onClose={props.onClose} aria-labelledby="publicar-titulo" className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl p-0 backdrop:bg-ink/40">
      <form
        method="dialog"
        className="space-y-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !pending) void submit();
        }}
      >
        <h2 id="publicar-titulo" className="text-xl font-bold">Publicar no site</h2>
        <p className="text-sm text-ink-mute">
          Mudanças usadas neste mês: <strong>{props.usage.used} de {props.usage.limit}</strong>.
          {props.dirty && ' As alterações não salvas serão salvas antes.'}
        </p>
        <CountChoice mode={mode} setMode={setMode} reason={reason} setReason={setReason} allowInternal />
        {needsDescription && (
          <div>
            <label htmlFor="o-que" className="label">O que o cliente pediu</label>
            <textarea
              id="o-que"
              rows={3}
              required
              className="field resize-y"
              placeholder="Ex.: Novo preço da Calabresa e da Margherita"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}
        {willBeExtra && (
          <p className="rounded-lg bg-bad/10 p-3 text-sm font-semibold text-bad">
            O limite do mês já foi usado. Esta mudança fica marcada como extra para cobrar (combine o valor com o cliente antes).
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm font-semibold text-bad">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={() => ref.current?.close()} disabled={pending}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={!valid || pending}>
            {pending ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

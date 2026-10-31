'use client';

import { useEffect } from 'react';
import { useUi } from '../Providers';
import { CheckIcon, CloseIcon } from './Icons';

export function Toaster() {
  const { toastState, dismissToast } = useUi();

  useEffect(() => {
    if (!toastState) return;
    const t = window.setTimeout(dismissToast, 4200);
    return () => window.clearTimeout(t);
  }, [toastState, dismissToast]);

  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-[70] flex justify-center px-4 md:bottom-8"
    >
      {toastState && (
        <div
          key={toastState.id}
          className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full border border-brand/40 bg-paper py-2 pr-2 pl-4 text-ink shadow-[0_18px_40px_-12px_rgb(0_0_0/0.55)] motion-safe:animate-[toast-in_0.45s_var(--ease-out-expo)]"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mustard text-on-dark">
            <CheckIcon size={16} />
          </span>
          <span className="text-[0.95rem] font-medium">{toastState.message}</span>
          {toastState.action && (
            <button
              type="button"
              onClick={() => {
                toastState.action?.run();
                dismissToast();
              }}
              className="cond ml-1 min-h-11 shrink-0 cursor-pointer rounded-full bg-ink px-4 text-sm font-bold tracking-wide text-on-dark uppercase transition-colors hover:bg-mustard"
            >
              {toastState.action.label}
            </button>
          )}
          <button type="button" onClick={dismissToast} aria-label="Fechar aviso" className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-white/10">
            <CloseIcon size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

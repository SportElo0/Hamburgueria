'use client';

import { useEffect, useRef } from 'react';
import { priceParts } from '@/lib/money';
import { MinusIcon, PlusIcon } from './Icons';

export function Price({ cents, className = '', size = 'md' }: { cents: number; className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const { currency, whole, fraction } = priceParts(cents);
  const scale = { sm: 'text-xl', md: 'text-[1.7rem]', lg: 'text-[2.3rem]', xl: 'text-[3.2rem]' }[size];
  return (
    <span className={`display tabular inline-flex items-start leading-none ${scale} ${className}`}>
      <span className="sr-only">{`${currency} ${whole},${fraction}`}</span>
      <span aria-hidden="true" className="cond mt-[0.12em] mr-[0.12em] text-[0.42em] font-bold tracking-wide">
        {currency}
      </span>
      <span aria-hidden="true">{whole}</span>
      <span aria-hidden="true" className="mt-[0.06em] text-[0.5em]">
        ,{fraction}
      </span>
    </span>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 20,
  label,
  tone = 'light',
  size = 'md',
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md';
}) {
  const btn =
    tone === 'light'
      ? 'text-ink hover:bg-ink/8 active:bg-ink/14 disabled:text-ink/30'
      : 'text-on-dark hover:bg-white/10 active:bg-white/20 disabled:text-on-dark/30';
  const dim = size === 'sm' ? 'h-11 w-11' : 'h-12 w-12';
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex items-center rounded-full border-2 ${tone === 'light' ? 'border-ink/15' : 'border-white/25'}`}
    >
      <button
        type="button"
        className={`${dim} grid cursor-pointer place-items-center rounded-full transition-colors ${btn}`}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={value <= 1 && min === 0 ? 'Remover' : 'Diminuir quantidade'}
      >
        <MinusIcon size={18} />
      </button>
      <output aria-live="polite" className="cond tabular min-w-8 text-center text-xl font-bold">
        {value}
      </output>
      <button
        type="button"
        className={`${dim} grid cursor-pointer place-items-center rounded-full transition-colors ${btn}`}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Aumentar quantidade"
      >
        <PlusIcon size={18} />
      </button>
    </div>
  );
}

/** Wires a native <dialog> to React state: modal focus trap, Escape, backdrop click, exit animation. */
export function useNativeDialog(open: boolean, onClose: () => void, exitMs = 260) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.dataset.state = 'open';
      d.showModal();
    } else if (!open && d.open) {
      d.dataset.state = 'closing';
      const t = window.setTimeout(() => {
        d.close();
        d.dataset.state = 'closed';
      }, exitMs);
      return () => window.clearTimeout(t);
    }
  }, [open, exitMs]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      closeRef.current();
    };
    const onClick = (e: MouseEvent) => {
      if (e.target === d) closeRef.current();
    };
    d.addEventListener('cancel', onCancel);
    d.addEventListener('click', onClick);
    return () => {
      d.removeEventListener('cancel', onCancel);
      d.removeEventListener('click', onClick);
    };
  }, []);

  return ref;
}

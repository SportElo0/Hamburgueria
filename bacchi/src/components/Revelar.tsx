'use client';
// Wrapper that reveals its `[data-revelar]` children as they enter the viewport (skipped for reduced motion).
import { useRef } from 'react';
import { revelarFilhos, useAnimacao } from '@/lib/animacao';

export function Revelar({ children, className, as: Tag = 'div' }: { children: React.ReactNode; className?: string; as?: 'div' | 'section' }) {
  const ref = useRef<HTMLDivElement>(null);
  useAnimacao(ref, (_c, raiz) => revelarFilhos(raiz));
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

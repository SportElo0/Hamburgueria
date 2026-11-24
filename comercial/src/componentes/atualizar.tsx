'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Reloads the server data of the page every few seconds while the tab is visible (conversations, board). */
export function Atualizar({ segundos = 6 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible' && !document.querySelector('textarea:focus, input:focus')) router.refresh();
    }, segundos * 1000);
    return () => clearInterval(t);
  }, [router, segundos]);
  return null;
}

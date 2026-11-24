'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const POLL_MS = 60_000;

/**
 * "Diagnósticos" in the panel menu with a red badge: how many requests from the site nobody has handled yet
 * (status "Novo"). Checks again every minute while the tab is visible, and shows the count in the tab title.
 */
export function DiagnosticosNav({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);
  // A new number from the server (after a navigation or a refresh) replaces the polled one.
  const [fromServer, setFromServer] = useState(initial);
  if (initial !== fromServer) {
    setFromServer(initial);
    setCount(initial);
  }
  const path = usePathname();

  useEffect(() => {
    let stop = false;
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/api/painel/diagnosticos-novos', { cache: 'no-store' });
        if (res.ok && !stop) setCount(((await res.json()) as { count: number }).count);
      } catch {
        // Offline: keep the last number.
      }
    };
    const t = window.setInterval(check, POLL_MS);
    document.addEventListener('visibilitychange', check);
    return () => {
      stop = true;
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\+?\) /, '');
    document.title = count > 0 ? `(${count > 99 ? '99+' : count}) ${base}` : base;
  }, [count, path]);

  const here = path.startsWith('/painel/diagnosticos');
  return (
    <Link href="/painel/diagnosticos" className={`relative inline-flex items-center gap-1.5 text-sm ${here ? 'font-semibold text-ink' : 'text-ink-mute hover:text-ink'}`}>
      Diagnósticos
      {count > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1.5 text-[11px] leading-none font-bold text-white tabular-nums" aria-label={`${count} ${count === 1 ? 'novo sem resposta' : 'novos sem resposta'}`}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

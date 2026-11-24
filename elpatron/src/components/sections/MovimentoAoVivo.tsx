'use client';

import { useEffect, useState } from 'react';
import { CATALOG_URL } from '@/content/live';

/**
 * "Movimento agora": the live floor drawn by the store panel (free and taken tables, updated every few
 * seconds), embedded from the panel. It only shows up when the restaurant has tables turned on there,
 * so it is invisible until the pilot starts.
 */
export function MovimentoAoVivo() {
  const [src, setSrc] = useState<string | null>(null);
  const [height, setHeight] = useState(560);

  useEffect(() => {
    if (!CATALOG_URL) return;
    const api = `${CATALOG_URL.replace(/\/$/, '')}/movimento`;
    let alive = true;
    fetch(api, { cache: 'no-store', signal: AbortSignal.timeout(6000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { total?: number } | null) => {
        if (!alive || !data?.total) return;
        const u = new URL(CATALOG_URL);
        const slug = u.pathname.split('/').filter(Boolean).pop();
        setSrc(`${u.origin}/movimento/${slug}/embed`);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  // The panel's page reports its height; only messages from the panel's own origin are taken.
  useEffect(() => {
    if (!src) return;
    const origin = new URL(src).origin;
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; height?: number } | null;
      if (e.origin !== origin || d?.type !== 'growlift-movimento' || typeof d.height !== 'number') return;
      setHeight(Math.max(320, Math.min(1400, d.height)));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [src]);

  if (!src) return null;
  return (
    <section id="movimento" aria-labelledby="movimento-title" className="bg-cream text-ink">
      <div className="mx-auto max-w-[1360px] px-5 pt-16 md:px-10 md:pt-24">
        <div className="double-rule text-brand/50" />
        <p className="cond mt-8 text-sm font-bold tracking-[0.3em] text-brand uppercase">Ao vivo</p>
        <h2 id="movimento-title" className="display mt-2 text-[clamp(2.2rem,6vw,3.6rem)]">
          Tem mesa agora?
        </h2>
        <p className="mt-2 max-w-xl text-ink-soft">Veja o salão em tempo real antes de sair de casa. Se estiver cheio, reserve a sua mesa.</p>
        <div className="mt-6 mb-4 overflow-hidden rounded-[24px] border border-brand/25 bg-white">
          <iframe src={src} title="Movimento do salão agora" loading="lazy" className="block w-full border-0" style={{ height }} />
        </div>
      </div>
    </section>
  );
}

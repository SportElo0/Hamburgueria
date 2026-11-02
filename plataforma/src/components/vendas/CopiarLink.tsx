'use client';

import { useState } from 'react';

/** Copies a ready link to paste in a reply to the lead; nothing is sent by the panel. */
export function CopiarLink({ url, rotulo }: { url: string; rotulo: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost min-h-9 px-3 text-[13px]"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setOk(true);
          setTimeout(() => setOk(false), 2000);
        } catch {
          window.prompt('Copie o link:', url);
        }
      }}
    >
      {ok ? 'Copiado!' : rotulo}
    </button>
  );
}

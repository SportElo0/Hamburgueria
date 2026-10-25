'use client';

import type { MouseEvent } from 'react';

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Older phones, or a page opened without HTTPS: fall back to a selected textarea.
    const t = document.createElement('textarea');
    t.value = text;
    t.style.position = 'fixed';
    t.style.opacity = '0';
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }
}

/** Doc HTML built (and escaped) at build time by scripts/conteudos.mjs; every code block gets a working Copiar button. */
export function DocBody({ html }: { html: string }) {
  const onClick = async (e: MouseEvent<HTMLDivElement>) => {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-copy]');
    const pre = button?.closest('.copy-block')?.querySelector('pre');
    if (!button || !pre) return;
    await copy(pre.textContent ?? '');
    button.textContent = 'Copiado';
    button.dataset.done = '';
    setTimeout(() => {
      button.textContent = 'Copiar';
      delete button.dataset.done;
    }, 1600);
  };
  return <div className="doc" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}

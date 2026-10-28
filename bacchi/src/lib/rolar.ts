'use client';
// On phones and portrait tablets the map sits below (or above) the contacts it controls, so after a choice
// the page brings the contacts into view. Desktop shows both side by side and does not move.
export function mostrarNaTela(el: HTMLElement | null) {
  if (!el || window.innerWidth >= 1024) return;
  const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  // wait one frame so the new contacts are rendered before measuring
  requestAnimationFrame(() => el.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' }));
}

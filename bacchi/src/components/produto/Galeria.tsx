'use client';
// Product photos: one large image and thumbnails. Switching crossfades; the large image follows the pointer
// with a slight shift on desktop (depth, not zoom), and stays still for reduced motion.
import Image from 'next/image';
import { useRef, useState } from 'react';

export function Galeria({ imagens, prioridade = true }: { imagens: { src: string; alt: string }[]; prioridade?: boolean }) {
  const [atual, setAtual] = useState(0);
  const caixa = useRef<HTMLDivElement>(null);
  const mover = (e: React.PointerEvent) => {
    const el = caixa.current;
    if (!el || e.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * -14;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -14;
    el.style.setProperty('--x', `${x}px`);
    el.style.setProperty('--y', `${y}px`);
  };
  return (
    <div>
      <div ref={caixa} onPointerMove={mover} onPointerLeave={() => caixa.current?.style.setProperty('--x', '0px')} className="relative aspect-square overflow-hidden rounded-3xl bg-papel shadow-[inset_0_0_0_1px_rgba(13,23,38,.06)]">
        {imagens.map((img, i) => (
          <Image
            key={img.src}
            src={img.src}
            alt={img.alt}
            fill
            priority={prioridade && i === 0}
            sizes="(min-width:1024px) 50vw, 92vw"
            className={`scale-[1.04] object-contain transition-[opacity,transform] duration-700 ease-[var(--ease-saida)] [transform:translate(var(--x,0),var(--y,0))_scale(1.04)] ${i === atual ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={i !== atual}
          />
        ))}
      </div>
      {imagens.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Fotos">
          {imagens.map((img, i) => (
            <li key={img.src}>
              <button
                type="button"
                onClick={() => setAtual(i)}
                aria-label={`Foto ${i + 1}: ${img.alt}`}
                aria-current={i === atual}
                className={`relative block h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-papel transition-[box-shadow,opacity] duration-300 ${i === atual ? 'shadow-[0_0_0_2px_var(--color-azul)]' : 'opacity-70 hover:opacity-100'}`}
              >
                <Image src={img.src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

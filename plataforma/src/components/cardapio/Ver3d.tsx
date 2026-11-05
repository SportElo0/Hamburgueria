'use client';

import { useState } from 'react';
import { Prato3D, Selo3D, Cubo, type Prato3DItem } from '@/components/mesa/Prato3D';

/** A dish's photo on the public menu; with a 3D, the photo opens it (the same viewer as the table menu). */
export function FotoPrato({ item, image, alt, exemplo = false }: { item: Prato3DItem | null; image: string; alt: string; exemplo?: boolean }) {
  const [aberto, setAberto] = useState(false);
  if (!item) {
    // eslint-disable-next-line @next/next/no-img-element -- photos served by the panel, already sized on upload
    return image ? <img src={image} alt={alt} loading="lazy" className="h-24 w-24 shrink-0 rounded-2xl bg-[#E6EBF2] object-cover" /> : null;
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={`Ver ${item.name} em 3D`}
        className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#E6EBF2] transition-transform duration-150 ease-out active:scale-[0.96]"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Cubo className="mb-3 h-8 w-8 text-[#4A5568]" />
        )}
        <Selo3D />
      </button>
      {aberto && <Prato3D item={item} exemplo={exemplo} onClose={() => setAberto(false)} onVer={() => {}} />}
    </>
  );
}

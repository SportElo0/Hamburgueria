import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DiretorioRepresentantes } from '@/components/representantes/Rede';
import { REPRESENTANTES } from '@/data/representantes';

export const metadata: Metadata = {
  title: 'Representantes comerciais',
  description: 'Encontre o representante Bacchi do seu estado: representações comerciais em todo o Brasil, com telefone e e-mail.',
  alternates: { canonical: '/representantes' },
};

export default function RepresentantesPage() {
  const ufs = new Set(REPRESENTANTES.map((r) => r.uf)).size;
  return (
    <div className="container-b pt-32 pb-24 md:pt-40">
      <p className="eyebrow text-azul">Representantes</p>
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="max-w-[16ch] font-display text-[clamp(2.4rem,5.6vw,4.6rem)] leading-[0.98] font-semibold">Fale com quem atende a sua região.</h1>
        <p className="max-w-sm text-tinta-2">
          {REPRESENTANTES.length} representações comerciais em {ufs} estados. Escolha o seu no mapa ou na lista.
        </p>
      </div>
      <div className="regua my-12" />
      <Suspense fallback={null}>
        <DiretorioRepresentantes />
      </Suspense>
    </div>
  );
}

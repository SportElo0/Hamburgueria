import { gravacaoPermitida } from '@/lib/ambiente';

/** A strip on every panel screen of a Vercel preview: the data is real, but nothing can be saved there. */
export function AvisoPrevia() {
  if (gravacaoPermitida()) return null;
  return (
    <p role="note" className="bg-warn px-4 py-1.5 text-center text-sm font-semibold text-white">
      Prévia: os dados são os reais, mas nada é salvo aqui. Para mudar algo, use o painel principal.
    </p>
  );
}

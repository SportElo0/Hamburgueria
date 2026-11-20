import type { Metadata } from 'next';
import { RevisaoCotacao } from '@/components/cotacao/RevisaoCotacao';

export const metadata: Metadata = {
  title: 'Cotação',
  description: 'Revise os produtos escolhidos no catálogo Bacchi e envie a solicitação de orçamento para a equipe comercial.',
  alternates: { canonical: '/cotacao' },
  robots: { index: false },
};

export default function CotacaoPage() {
  return (
    <div className="container-b pt-32 pb-24 md:pt-40">
      <p className="eyebrow text-azul">Solicitação de orçamento</p>
      <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.2rem,5vw,4rem)] leading-[1] font-semibold">Revise a sua lista e envie para a Bacchi.</h1>
      <p className="mt-4 max-w-xl text-tinta-2">Sem preços nesta etapa: a equipe comercial responde com valores e prazos para a sua região.</p>
      <div className="mt-12">
        <RevisaoCotacao />
      </div>
    </div>
  );
}

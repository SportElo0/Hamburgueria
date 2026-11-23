import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Marca } from '@/componentes/acesso';
import { DemoServicos } from '@/componentes/demo-servicos';
import { demonstracaoAberta } from '@/server/demonstracao';

export const metadata: Metadata = {
  title: 'Demonstração: 5 serviços para uma pousada',
  description: 'Simulação com uma pousada fictícia: site com IA, perfil no Google, ligação perdida, retomada e avaliações.',
};

/**
 * Guided sales demonstration of the five services, with the fictitious Pousada Maré Calma. Everything on it is a
 * script played in the browser: nothing is sent and nothing is saved. Only in the demonstration and development
 * environments (it links to the demo company, which does not exist in production).
 */
export default function Demonstracao() {
  if (!demonstracaoAberta()) notFound();
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-5 sm:pt-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Marca />
        <span className="etiqueta etiqueta-alerta">Simulação · empresa fictícia</span>
      </header>
      <DemoServicos />
    </main>
  );
}

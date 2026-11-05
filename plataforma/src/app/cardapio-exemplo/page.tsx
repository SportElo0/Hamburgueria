import type { Metadata, Viewport } from 'next';
import { CardapioView } from '@/components/cardapio/CardapioView';
import { cardapioExemplo } from '@/lib/cardapio-exemplo';

export const metadata: Metadata = { title: 'Cardápio de exemplo', robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: '#F4F6FA' };

/** The QR menu as a customer sees it, with a made-up restaurant and the test 3D burger: for demos and tests. */
export default function CardapioExemploPage() {
  return <CardapioView exemplo store={cardapioExemplo()} faixa="Exemplo para demonstração: restaurante, pratos e preços fictícios." />;
}

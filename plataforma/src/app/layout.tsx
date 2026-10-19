import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Painel das lojas',
  description: 'Cardápios, catálogos e mudanças de todos os clientes num só lugar.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

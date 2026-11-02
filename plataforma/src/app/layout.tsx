import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Painel das lojas',
  description: 'Cardápios, catálogos e mudanças de todos os clientes num só lugar.',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'Growlift', statusBarStyle: 'default' },
};

export const viewport: Viewport = { themeColor: '#f4f6fa' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

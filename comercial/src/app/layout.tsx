import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Growlift Comercial', template: '%s · Growlift Comercial' },
  description: 'Pedidos de orçamento, atendimento e acompanhamento de negociações para empresas de serviços.',
  robots: { index: false, follow: false },
  // Installed panel ("Adicionar à tela inicial"): name and icon on the phone.
  appleWebApp: { capable: true, title: 'Growlift', statusBarStyle: 'default' },
  icons: { icon: '/icones/app-192.png', apple: '/icones/apple-180.png' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#175cd3' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh antialiased">
        {/* With credentials: while the deployment is behind Vercel's login, the manifest needs the same cookie as the page. */}
        <link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" />
        {children}
      </body>
    </html>
  );
}

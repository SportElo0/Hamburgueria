import type { Metadata, Viewport } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { Cabecalho } from '@/components/Cabecalho';
import { Rodape } from '@/components/Rodape';
import { INDEXAR, SITE_URL, jsonLdOrganizacao } from '@/lib/seo';
import './globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Bacchi · Clips, grampos e alfinetes desde 1937', template: '%s · Bacchi' },
  description:
    'Indústria brasileira de clips, grampos, alfinetes e artigos metálicos para escritório desde 1937. Catálogo técnico completo, cotação para revendas e representantes em todo o Brasil.',
  applicationName: 'Bacchi',
  openGraph: { type: 'website', locale: 'pt_BR', siteName: 'Bacchi', images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Clips Bacchi em aço, desde 1937' }] },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/img/marca/avatar.png', apple: '/img/marca/avatar.png' },
  alternates: { canonical: '/' },
  robots: INDEXAR ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#0a1c33', width: 'device-width', initialScale: 1 };

// Animated elements start hidden only when scripts run and the visitor allows motion; otherwise the page
// is complete without JavaScript.
// The brand intro of the home page plays on the first page view of a visit only (`js-intro`).
const ligarMovimento = `try{var h=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){h.classList.add('js-motion');if(!sessionStorage.getItem('bacchi-intro')){h.classList.add('js-intro');sessionStorage.setItem('bacchi-intro','1')}}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ligarMovimento }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganizacao()) }} />
      </head>
      <body className={INDEXAR ? undefined : 'pb-9'}>
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-marinho">
          Pular para o conteúdo
        </a>
        <Cabecalho />
        <main id="conteudo">{children}</main>
        <Rodape />
        {!INDEXAR && (
          // test deploys say so on every page, so the link cannot pass for the official site
          <p className="fixed inset-x-0 bottom-0 z-[60] flex h-9 items-center justify-center gap-1 bg-azul px-4 text-center text-xs text-white">
            Versão de teste, não é o site oficial da Bacchi.
            <a href="https://clipsbacchi.com.br" className="font-semibold underline underline-offset-2">
              Site oficial
            </a>
          </p>
        )}
        <noscript>
          <style>{`.js-motion [data-revelar]{opacity:1!important}`}</style>
        </noscript>
      </body>
    </html>
  );
}

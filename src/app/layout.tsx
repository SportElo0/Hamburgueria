import type { Metadata, Viewport } from 'next';
import { Barlow, Barlow_Condensed, Big_Shoulders } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const display = Big_Shoulders({
  subsets: ['latin'],
  weight: 'variable',
  axes: ['opsz'],
  variable: '--font-big-shoulders',
  display: 'swap',
  fallback: ['Arial Narrow', 'sans-serif'],
  adjustFontFallback: false,
});

const sans = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
});

const cond = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Downtown Burger · Burguer artesanal feito com qualidade',
  description:
    'Burgers artesanais da Downtown Burger: Downtown Classic, The Bacon Street, Australian Cheddar, Kill Bill e mais. Veja o cardápio, monte seu pedido e envie pelo WhatsApp.',
  applicationName: 'Downtown Burger',
  keywords: ['hamburgueria', 'burger artesanal', 'Downtown Burger', 'cardápio', 'smash', 'pão brioche', 'pão australiano'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'Downtown Burger',
    description: 'Burguer artesanal feito com qualidade. Veja o cardápio e monte seu pedido.',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Downtown Burger' }],
  },
  twitter: { card: 'summary_large_image', title: 'Downtown Burger', images: ['/og.jpg'] },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#a3171c',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} ${cond.variable}`}>
      <body>
        <a href="#cardapio" className="skip-link cond rounded-full bg-mustard px-5 py-3 text-base font-bold uppercase tracking-wide text-ink">
          Pular para o cardápio
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

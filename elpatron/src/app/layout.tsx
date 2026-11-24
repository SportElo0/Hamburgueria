import type { Metadata, Viewport } from 'next';
import { Barlow, Barlow_Condensed, Cinzel } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

// Engraved capitals of the printed menu ("OS CHEFÕES DA CASA", the burger names).
const display = Cinzel({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-cinzel',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
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
  title: 'El Patron Burger · O chefão dos hambúrgueres em Osasco',
  description:
    'Cardápio do El Patron Burger, El Burger Del Mal: El Patron, Al Capone, Ochoa, El Chapo e mais. Monte seu pedido e envie direto pelo WhatsApp.',
  applicationName: 'El Patron Burger',
  keywords: ['hamburgueria', 'Osasco', 'El Patron Burger', 'El Burger Del Mal', 'cardápio', 'smash', 'delivery'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'El Patron Burger',
    description: 'O chefão dos hambúrgueres voltou. Veja o cardápio e peça pelo WhatsApp.',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'El Patron Burger' }],
  },
  twitter: { card: 'summary_large_image', title: 'El Patron Burger', images: ['/og.jpg'] },
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#0c0a08',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} ${cond.variable}`}>
      <body>
        <a href="#cardapio" className="skip-link cond rounded-full bg-mustard px-5 py-3 text-base font-bold uppercase tracking-wide text-on-dark">
          Pular para o cardápio
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

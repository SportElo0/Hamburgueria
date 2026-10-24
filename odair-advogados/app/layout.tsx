import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import { site } from "@/config/site";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { RevealObserver } from "@/components/reveal-observer";
import { jsonLdScript, legalServiceJsonLd, seo } from "@/lib/seo";
import "./globals.css";

// Didone de documento gravado: os títulos têm o traço das certidões e escrituras.
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: seo.title, template: `%s | ${seo.shortTitle}` },
  description: seo.description,
  keywords: seo.keywords,
  applicationName: site.name,
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: site.name,
    title: seo.title,
    description: seo.description,
  },
  twitter: { card: "summary_large_image", title: seo.title, description: seo.description },
  robots: { index: seo.indexable, follow: seo.indexable },
};

export const viewport: Viewport = {
  themeColor: "#071b2e",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${bodoni.variable} ${manrope.variable}`}>
      <body className="flex min-h-dvh flex-col bg-ivory text-graphite">
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(legalServiceJsonLd())} />
        <a
          href="#conteudo"
          className="sr-only z-[60] rounded-[3px] bg-gold px-4 py-3 font-semibold text-navy focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Pular para o conteúdo
        </a>
        {site.demo && (
          <aside aria-label="Aviso de demonstração" className="bg-navy-deep px-5 py-2 text-center text-[0.75rem] tracking-[0.04em] text-on-navy-muted">
            Demonstração não oficial. Conteúdo sujeito à aprovação do escritório.
          </aside>
        )}
        <Header />
        <div id="conteudo" className="flex-1">
          {children}
        </div>
        <Footer />
        <RevealObserver />
      </body>
    </html>
  );
}

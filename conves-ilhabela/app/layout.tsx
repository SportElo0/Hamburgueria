import type { Metadata, Viewport } from "next";
import { Josefin_Sans, Manrope, Marcellus } from "next/font/google";
import { site } from "@/config/site";
import { restaurantJsonLd, seo } from "@/lib/seo";
import "./globals.css";

// Serifa de inscrição: títulos com a elegância da referência e bons acentos.
const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// Geométrica fina, parente da letra do logo "convés". Só na marca.
const josefin = Josefin_Sans({
  variable: "--font-josefin",
  subsets: ["latin"],
  weight: ["200", "300"],
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
  themeColor: "#f8f5ef",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${marcellus.variable} ${josefin.variable} ${manrope.variable}`}>
      <body className="min-h-dvh bg-sand text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(restaurantJsonLd()).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}

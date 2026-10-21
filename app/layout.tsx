import type { Metadata, Viewport } from "next";
import { Archivo, Manrope } from "next/font/google";
import { site } from "@/config/site";
import { barberShopJsonLd, seo } from "@/lib/seo";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: seo.title,
    template: `%s | ${seo.shortTitle}`,
  },
  description: seo.description,
  keywords: seo.keywords,
  applicationName: site.name,
  authors: [{ name: site.barber }],
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
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0c0e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${manrope.variable}`}>
      <body className="min-h-dvh bg-fade-0 text-paper">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(barberShopJsonLd()).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}

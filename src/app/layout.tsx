import type { Metadata, Viewport } from "next";
import { Archivo, Bodoni_Moda } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import { siteDescription, siteName, siteTagline } from "@/content/site";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${siteName} — Clássicos com história`, template: `%s · ${siteName}` },
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName,
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription,
    images: [{ url: "/media/concept/charuto-hero.webp", width: 1672, height: 941, alt: "Ilustração conceitual do Mercedes-Benz W111 em ambiente escuro" }],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#090a0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${bodoni.variable} ${archivo.variable}`}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

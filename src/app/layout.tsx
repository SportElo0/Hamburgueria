import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { MobileWhatsappBar } from "@/components/MobileWhatsappBar";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Pousada Villa Verano — Paraty, RJ",
  description:
    "Uma pousada charmosa a poucos minutos do Centro Histórico de Paraty. Piscina, jardim, café da manhã no terraço e quartos com varanda. Reserve direto com a gente.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full bg-ink text-paper">
        {children}
        <MobileWhatsappBar />
      </body>
    </html>
  );
}

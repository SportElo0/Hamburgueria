import Link from "next/link";
import { SITE, whatsappLink } from "@/lib/site";
import { Reveal } from "./Reveal";

export function CtaFooter() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-6 py-24 text-center sm:px-10 sm:py-32">
        <Reveal>
          <p className="eyebrow text-white/60">Vamos planejar sua estadia</p>
          <h2 className="font-display mx-auto mt-5 max-w-2xl text-4xl leading-tight sm:text-5xl">
            Paraty combina com Villa Verano.
          </h2>
          <Link href={whatsappLink("Olá! Gostaria de saber mais sobre a Villa Verano.")} target="_blank" rel="noreferrer" className="btn-cta mt-10">
            Falar pelo WhatsApp
          </Link>
        </Reveal>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-sm text-white/60 sm:flex-row sm:justify-between sm:px-10">
          <span>{SITE.fullName} · {SITE.address.line1}, {SITE.address.line2}</span>
          <div className="flex items-center gap-5">
            <Link href={`https://instagram.com/${SITE.instagram}`} target="_blank" rel="noreferrer" className="hover:text-white">
              Instagram
            </Link>
            <span>{SITE.phoneDisplay}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

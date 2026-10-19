import Image from "next/image";
import Link from "next/link";
import { SITE, whatsappLink } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative flex h-[100svh] min-h-[640px] items-end overflow-hidden">
      <Image
        src="/images/hero-fachada.jpg"
        alt="Fachada da Pousada Villa Verano ao entardecer, em Paraty"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-ink/10" />
      <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 sm:px-10 sm:pb-28">
        <p className="eyebrow text-white/80">Paraty · Rio de Janeiro</p>
        <h1 className="font-display mt-4 max-w-2xl text-5xl leading-[1.05] text-white sm:text-7xl">
          {SITE.fullName}
        </h1>
        <p className="mt-6 max-w-md text-lg text-white/90 sm:text-xl">{SITE.tagline}.</p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link href={whatsappLink("Olá! Gostaria de saber sobre disponibilidade na Villa Verano.")} target="_blank" rel="noreferrer" className="btn-cta">
            Reservar pelo WhatsApp
          </Link>
          <Link href="#quartos" className="btn-cta-ghost border-white/70 text-white hover:bg-white hover:text-ink">
            Ver quartos
          </Link>
        </div>
      </div>
    </section>
  );
}

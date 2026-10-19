import Link from "next/link";
import { SITE, whatsappLink } from "@/lib/site";

const NAV = [
  { href: "#quartos", label: "Quartos" },
  { href: "#pousada", label: "A pousada" },
  { href: "#localizacao", label: "Localização" },
];

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <span className="font-display text-lg tracking-wide text-white sm:text-xl">{SITE.name}</span>
        <nav className="hidden items-center gap-8 text-sm text-white/90 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href={whatsappLink("Olá! Vi o site da Villa Verano e gostaria de saber sobre disponibilidade.")}
          target="_blank"
          rel="noreferrer"
          className="btn-cta-ghost border-white/70 text-sm text-white hover:bg-white hover:text-ink"
        >
          Reservar
        </Link>
      </div>
    </header>
  );
}

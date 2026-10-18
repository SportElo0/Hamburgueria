import Link from "next/link";
import { ArrowRight } from "../icons";

/** The two commercial journeys as one typographic statement. */
export function Journeys() {
  const items = [
    { href: "/acervo", lead: "Procuro um clássico", title: "Conhecer o acervo" },
    { href: "/contato?jornada=restauracao", lead: "Tenho um clássico", title: "Restaurar o meu" },
  ];
  return (
    <section aria-label="Como podemos ajudar" className="relative z-10 border-t border-[var(--line-dark)] bg-night">
      <div className="wrap grid md:grid-cols-2">
        {items.map((it, i) => (
          <Link
            key={it.href}
            href={it.href}
            className={`group flex items-end justify-between gap-6 py-14 md:py-20 ${i === 0 ? "md:border-r md:border-[var(--line-dark)] md:pr-10" : "border-t border-[var(--line-dark)] md:border-t-0 md:pl-10"}`}
          >
            <span>
              <span className="block text-[0.9375rem] text-silver">{it.lead}</span>
              <span className="mt-2 block font-display text-[clamp(2.25rem,4.4vw,3.75rem)] leading-none transition-colors group-hover:text-wine-soft">
                {it.title}
              </span>
            </span>
            <ArrowRight size={28} className="mb-2 flex-none transition-transform duration-500 group-hover:translate-x-2" />
          </Link>
        ))}
      </div>
    </section>
  );
}

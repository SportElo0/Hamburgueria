import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Abertura das páginas internas: campo marinho com trilha de navegação e título. */
export function PageHead({
  trail,
  title,
  lead,
  aside,
}: {
  trail: { href?: string; label: string }[];
  title: React.ReactNode;
  lead?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <header className="relative overflow-hidden bg-navy text-ivory">
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-10 px-5 pt-10 pb-16 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-12 lg:pt-14 lg:pb-20">
        <div className="lg:col-span-7">
          <nav aria-label="Você está em">
            <ol className="flex flex-wrap items-center gap-1.5 text-[0.875rem] text-on-navy-muted">
              {trail.map((item, i) => (
                <li key={item.label} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight size={14} aria-hidden className="text-gold" />}
                  {item.href ? (
                    <Link href={item.href} className="py-2 transition-colors hover:text-ivory">
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="py-2 text-ivory">
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <h1 className="display mt-6 max-w-[18ch] text-[clamp(2.4rem,5vw,4.6rem)]">{title}</h1>
          {lead && <div className="mt-6 max-w-[54ch] text-[1.0625rem] leading-relaxed text-on-navy-muted lg:text-[1.125rem]">{lead}</div>}
        </div>
        {aside && <div className="flex justify-center lg:col-span-5 lg:justify-end">{aside}</div>}
      </div>
    </header>
  );
}

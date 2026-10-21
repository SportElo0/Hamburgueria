import type { CSSProperties } from "react";
import { CalendarCheck, MapPin, Scissors, Star } from "lucide-react";
import { site } from "@/config/site";
import { formatShortDate } from "@/lib/schedule";

const rating = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Só fatos verificáveis da barbearia, no lugar de "diferenciais" genéricos. */
export function Facts() {
  const items = [
    {
      icon: Scissors,
      title: "Com o Leonardo",
      text: `Barbearia do ${site.barber}.`,
    },
    {
      icon: CalendarCheck,
      title: "Pedido pelo WhatsApp",
      text: "Você escolhe dia e horário; ele confirma.",
    },
    {
      icon: MapPin,
      title: site.address.street,
      text: `${site.address.neighborhood}, ${site.address.city} – ${site.address.state}.`,
    },
    ...(site.reviews.show
      ? [
          {
            icon: Star,
            title: `Nota ${rating.format(site.reviews.rating)} no ${site.reviews.platform}`,
            text: `${site.reviews.count} avaliações em ${formatShortDate(site.reviews.checkedAt)}.`,
          },
        ]
      : []),
  ];

  return (
    <section aria-label="Sobre a barbearia em resumo" className="border-y border-line bg-paper">
      <ul className="mx-auto grid grid-cols-1 max-w-[88rem] grid-cols-1 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-12">
        {items.map((item, index) => (
          <li
            key={item.title}
            data-reveal
            style={{ "--reveal-delay": `${index * 90}ms` } as CSSProperties}
            className={[
              "flex items-start gap-4 border-line py-6 sm:py-8 lg:border-t-0",
              index > 0 ? "border-t" : "",
              index >= 2 ? "sm:border-t" : "sm:border-t-0",
              index % 2 === 1 ? "sm:border-l sm:pl-8" : "",
              index > 0 ? "lg:border-l lg:pl-8" : "",
            ].join(" ")}
          >
            <item.icon size={26} strokeWidth={1.1} className="mt-0.5 flex-none text-champagne" />
            <div>
              <p className="label text-ink">{item.title}</p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

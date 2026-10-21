import { site, weekdayNames } from "@/config/site";

const schemaDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const seo = {
  title: "LM Barbearia | Barbearia no Campanário, Diadema – SP",
  shortTitle: "LM Barbearia",
  description:
    "Barbearia do Leonardo Miguel no Campanário, em Diadema – SP. Corte masculino, barba, sobrancelha e acabamento na navalha. Solicite seu horário pelo WhatsApp.",
  keywords: [
    "barbearia em Diadema",
    "barbearia no Campanário",
    "corte masculino em Diadema",
    "LM Barbearia",
    "Leonardo Miguel Barbearia",
  ],
};

/**
 * Dados estruturados (schema.org/BarberShop) só com informações verificadas.
 * Horários entram apenas quando `site.hours.confirmed` for true.
 */
export function barberShopJsonLd() {
  const openingHoursSpecification = site.hours.confirmed
    ? Object.entries(site.hours.week).flatMap(([day, hours]) =>
        hours
          ? [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: `https://schema.org/${schemaDays[Number(day)]}`,
                opens: hours.open,
                closes: hours.close,
              },
            ]
          : [],
      )
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "BarberShop",
    "@id": `${site.url}/#barbearia`,
    name: site.name,
    alternateName: `${site.barber} Barbearia`,
    url: site.url,
    image: `${site.url}/opengraph-image`,
    telephone: `+${site.whatsapp.number}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    ...(site.address.geo
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: site.address.geo.lat,
            longitude: site.address.geo.lng,
          },
        }
      : {}),
    areaServed: [`${site.address.neighborhood}, ${site.address.city}`],
    sameAs: [site.instagram.url],
    founder: { "@type": "Person", name: site.barber },
    makesOffer: site.services.map((service) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: service.name },
      ...(service.price !== null ? { price: service.price.toFixed(2), priceCurrency: "BRL" } : {}),
    })),
    ...(openingHoursSpecification ? { openingHoursSpecification } : {}),
  };
}

export function hoursSummary(): { label: string; value: string }[] {
  const order = [2, 3, 4, 5, 6, 0, 1] as const;
  const rows: { label: string; value: string }[] = [];
  for (const day of order) {
    const hours = site.hours.week[day];
    const value = hours ? `${hours.open} – ${hours.close}` : "Fechado";
    const last = rows.at(-1);
    if (last && last.value === value) {
      const start = last.label.split(" a ")[0];
      last.label = `${start} a ${weekdayNames[day].toLowerCase()}`;
    } else {
      rows.push({ label: weekdayNames[day], value });
    }
  }
  return rows;
}

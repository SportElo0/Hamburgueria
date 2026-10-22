import { fullAddress, site } from "@/config/site";

export const seo = {
  /**
   * Fica fora do Google enquanto for demonstração. Para liberar depois da
   * aprovação: NEXT_PUBLIC_ALLOW_INDEXING=true na Vercel e novo deploy.
   */
  indexable: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true",
  title: "Restaurante Convés Ilhabela | Gastronomia à beira-mar no Perequê",
  shortTitle: "Convés Ilhabela",
  description:
    "Restaurante à beira-mar no Perequê, Ilhabela – SP. Peixes, camarões, moquecas e carnes num ambiente aberto entre árvores e a vista do canal. Veja o cardápio e solicite sua mesa.",
  keywords: [
    "restaurante em Ilhabela",
    "restaurante no Perequê",
    "restaurante à beira-mar Ilhabela",
    "frutos do mar Ilhabela",
    "moqueca Ilhabela",
    "Convés Ilhabela",
  ],
};

/** Dados estruturados só com fatos informados: sem horário, preço ou nota. */
export function restaurantJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: site.name,
    url: site.url,
    image: `${site.url}/fotos/gramado-mar.jpg`,
    telephone: site.phone.e164,
    servesCuisine: ["Brasileira", "Frutos do mar", "Peixes"],
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.zip,
      addressCountry: "BR",
    },
    sameAs: [site.instagram.url],
    hasMenu: `${site.url}/#cardapio`,
    description: `Restaurante à beira-mar em ${fullAddress}.`,
  };
}

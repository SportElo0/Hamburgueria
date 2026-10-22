import { fullAddress, products, site } from "@/config/site";

export const seo = {
  /**
   * Fica fora do Google enquanto for demonstração. Para liberar depois da
   * aprovação: NEXT_PUBLIC_ALLOW_INDEXING=true na Vercel e novo deploy.
   */
  indexable: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true",
  title: "Bolos e Doces Regiane Camilo | Bolos personalizados em São Sebastião – SP",
  shortTitle: "Regiane Camilo",
  description:
    "Bolos personalizados, de aniversário, decorados e temáticos da Regiane Camilo em São Sebastião, litoral de SP. Veja os trabalhos e peça seu orçamento pelo WhatsApp.",
  keywords: [
    "bolos personalizados em São Sebastião",
    "bolos de aniversário em São Sebastião",
    "bolos decorados em São Sebastião",
    "bolo temático São Sebastião",
    "confeitaria em São Sebastião SP",
    "Bolos e Doces Regiane Camilo",
  ],
};

/** Dados estruturados só com fatos confirmados: sem horário, preço ou avaliação. */
export function bakeryJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: site.name,
    url: site.url,
    image: `${site.url}/fotos/morangos.jpg`,
    telephone: `+${site.whatsapp.number}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      addressCountry: "BR",
    },
    areaServed: `${site.address.city}, ${site.address.state}`,
    sameAs: [site.instagram.url],
    founder: { "@type": "Person", name: site.owner },
    description: `Bolos sob encomenda em ${fullAddress}.`,
    makesOffer: products.map((p) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Product", name: p.name, description: p.description },
      ...(p.price !== null ? { price: p.price.toFixed(2), priceCurrency: "BRL" } : {}),
    })),
  };
}

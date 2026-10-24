import { site } from "@/config/site";
import { areas } from "@/data/areas";

export const seo = {
  /**
   * Fica fora do Google enquanto for demonstração. Para liberar depois da
   * aprovação do escritório: NEXT_PUBLIC_ALLOW_INDEXING=true na Vercel e novo deploy.
   */
  indexable: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true",
  title: "Odair Alves da Silva & Advogados | Advocacia no Estado de São Paulo",
  shortTitle: "Odair Alves da Silva & Advogados",
  description:
    "Escritório Odair Alves da Silva & Advogados: atuação em Direito de Família e Sucessões, Previdenciário, Contratual e do Consumidor, Trabalhista e Empresarial e Penal Econômico no Estado de São Paulo.",
  keywords: [
    "Odair Alves da Silva Advogados",
    "Odair Alves da Silva advogado",
    "Escritório Odair Alves da Silva",
    "Direito de Família São Paulo",
    "Direito Previdenciário São Paulo",
    "Direito Contratual São Paulo",
    "Direito Trabalhista São Paulo",
  ],
};

/**
 * Dados estruturados só com fatos informados: nome, responsável, área de
 * atuação e áreas do Direito. Endereço, telefone e OAB entram quando forem
 * confirmados; nunca avaliações ou qualificações inventadas.
 */
export function legalServiceJsonLd() {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: site.name,
    url: site.url,
    logo: `${site.url}/marca/monograma-dourado.png`,
    areaServed: { "@type": "State", name: "São Paulo", containedInPlace: { "@type": "Country", name: "Brasil" } },
    knowsAbout: areas.map((a) => a.name),
    employee: { "@type": "Person", name: site.lawyer, jobTitle: "Advogado" },
  };
  if (site.phone) data.telephone = site.phone.e164;
  if (site.email) data.email = site.email;
  if (site.address) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.zip,
      addressCountry: "BR",
    };
  }
  const sameAs = [site.social.instagram, site.social.linkedin].filter(Boolean);
  if (sameAs.length) data.sameAs = sameAs;
  return data;
}

export function jsonLdScript(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

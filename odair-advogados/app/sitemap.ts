import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { areas } from "@/data/areas";
import { articles } from "@/data/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    ...areas.map((area) => ({ url: `${site.url}/areas/${area.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${site.url}/conteudos`, changeFrequency: "weekly", priority: 0.6 },
    // Só artigos publicados (rascunhos ficam fora dos buscadores).
    ...articles
      .filter((a) => a.status === "publicado")
      .map((a) => ({ url: `${site.url}/conteudos/${a.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    { url: `${site.url}/privacidade`, changeFrequency: "yearly", priority: 0.2 },
  ];
}

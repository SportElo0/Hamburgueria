import type { MetadataRoute } from "next";
import { getVehicles } from "@/lib/repo";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages = ["", "/acervo", "/restauracao", "/projetos", "/vision", "/atelier", "/contato", "/privacidade"];
  const vehicles = await getVehicles();
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...vehicles.map((v) => ({ url: `${base}/acervo/${v.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}

import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { seo } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.shortName,
    description: seo.description,
    start_url: "/",
    display: "standalone",
    background_color: "#fff7ef",
    theme_color: "#63341f",
    lang: "pt-BR",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

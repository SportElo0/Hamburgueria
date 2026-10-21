import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { seo } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "LM Barbearia",
    description: seo.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0b0c0e",
    theme_color: "#0b0c0e",
    lang: "pt-BR",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

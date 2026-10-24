import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "Odair Alves da Silva",
    description: "Advocacia no Estado de São Paulo.",
    start_url: "/",
    display: "browser",
    background_color: "#071b2e",
    theme_color: "#071b2e",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
